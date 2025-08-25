import React, { useState, useCallback, useMemo, useRef, useEffect, useContext } from 'react';
import type { Track, SavedProject } from './types';
import { MonitoringPanel } from './components/MonitoringPanel';
import { Timeline } from './components/Timeline';
import { MixerControls } from './components/MixerControls';
import { TrackUploader } from './components/TrackUploader';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { encodeWav } from './lib/wavEncoder';
import { encodeMp3 } from './lib/mp3Encoder';
import JSZip from 'jszip';
import { ReorderModal } from './components/ReorderModal';
import { HelpModal } from './components/HelpModal';
import { ExportModal, ExportOptions } from './components/ExportModal';
import { I18nContext, translations, Locale, TranslationKey } from './lib/i18n';
import { AuthProvider } from './context/AuthContext';
import { ProProvider, usePro } from './context/ProContext';
import { UnlockModal } from './components/UnlockModal';
import { QuestionMarkCircleIcon } from './components/icons';
import * as db from './lib/db';
import { SaveProjectModal } from './components/SaveProjectModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { StripeReturnBanner } from './components/StripeReturnBanner';


const DEMO_MAX_DURATION_SECONDS = 15 * 60; // 15 minutes

const readAudioFile = (file: File): Promise<{ duration: number; arrayBuffer: ArrayBuffer }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
        return reject(new Error("Failed to read file."));
      }
      const arrayBuffer = event.target.result;
      const audioContext = new AudioContext();
      audioContext.decodeAudioData(arrayBuffer.slice(0),
        (buffer) => resolve({ duration: buffer.duration, arrayBuffer }),
        (error) => reject(new Error(`Error decoding audio data: ${error instanceof DOMException ? error.message : String(error)}`))
      );
    };
    reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
    reader.readAsArrayBuffer(file);
  });
};

const calculateRMS = (audioBuffer: AudioBuffer): number => {
    // Use the average power of all channels for a more balanced loudness measure
    let sumOfSquares = 0;
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const data = audioBuffer.getChannelData(i);
        for (let j = 0; j < data.length; j++) {
            sumOfSquares += data[j] * data[j];
        }
    }
    const rms = Math.sqrt(sumOfSquares / (audioBuffer.length * audioBuffer.numberOfChannels));
    if (rms === 0) return -Infinity; // Avoid log(0)
    return 20 * Math.log10(rms); // Convert to dBFS
};


const analyzeTrackBoundaries = (buffer: AudioBuffer, thresholdDb: number): { smartTrimStart: number; smartTrimEnd: number } => {
    const threshold = Math.pow(10, thresholdDb / 20);
    const sampleRate = buffer.sampleRate;
    const minSilenceDuration = 0.1; // 100ms of silence to confirm
    const minSilenceSamples = Math.floor(minSilenceDuration * sampleRate);
    const channelData = buffer.getChannelData(0);

    let smartTrimStart = 0;
    let smartTrimEnd = buffer.duration;

    // Find first non-silent sample from the start
    let firstNonSilentSample = 0;
    for (let i = 0; i < channelData.length; i += minSilenceSamples) {
        const segment = channelData.subarray(i, i + minSilenceSamples);
        const isSilent = segment.every(sample => Math.abs(sample) < threshold);
        if (!isSilent) {
            firstNonSilentSample = i;
            break;
        }
    }
     // Find the precise start
    for (let i = firstNonSilentSample; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
            smartTrimStart = i / sampleRate;
            break;
        }
    }
    
    // Find last non-silent sample from the end
    let lastNonSilentSample = channelData.length - 1;
    for (let i = channelData.length; i > 0; i -= minSilenceSamples) {
        const segment = channelData.subarray(i - minSilenceSamples, i);
        const isSilent = segment.every(sample => Math.abs(sample) < threshold);
        if (!isSilent) {
            lastNonSilentSample = i;
            break;
        }
    }
    // Find precise end
    for (let i = lastNonSilentSample; i >= 0; i--) {
        if (Math.abs(channelData[i]) > threshold) {
            smartTrimEnd = (i + 1) / sampleRate;
            break;
        }
    }
    
    if (smartTrimEnd <= smartTrimStart) {
        return { smartTrimStart: 0, smartTrimEnd: buffer.duration };
    }

    // Rounding to prevent infinitesimal changes causing re-renders
    return { smartTrimStart: Math.round(smartTrimStart * 10000) / 10000, smartTrimEnd: Math.round(smartTrimEnd * 10000) / 10000 };
};


const AppContent: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { isPro } = usePro();
  
  // Project State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [underlayTrack, setUnderlayTrack] = useState<Track | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectId, setProjectId] = useState<number | null>(null);

  // Mixer Settings
  const [mixDuration, setMixDuration] = useState(2);
  const [duckingAmount, setDuckingAmount] = useState(0.7);
  const [rampUpDuration, setRampUpDuration] = useState(1.5);
  const [underlayVolume, setUnderlayVolume] = useState(0.5);
  const [trimSilenceEnabled, setTrimSilenceEnabled] = useState(true);
  const [silenceThreshold, setSilenceThreshold] = useState(-45);
  const [normalizeTracks, setNormalizeTracks] = useState(true);
  const [normalizeOutput, setNormalizeOutput] = useState(true);

  // App UI State
  const [uploadingType, setUploadingType] = useState<'music' | 'spoken' | 'jingle' | 'underlay' | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isReordering, setIsReordering] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalInitialTab, setUnlockModalInitialTab] = useState<'buy' | 'enter' | 'recover'>('buy');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportProgressTitleKey, setExportProgressTitleKey] = useState<TranslationKey>('export_progress_title');


  // AI Content
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const [isSuggestingContent, setIsSuggestingContent] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const [previewState, setPreviewState] = useState<{ trackId: string | null; sourceNode: AudioBufferSourceNode | null, timeoutId: number | null }>({ trackId: null, sourceNode: null, timeoutId: null });
  const decodedAudioBuffers = useRef<Map<string, AudioBuffer>>(new Map());

  // Show activation info toast only once per activation
  const hasShownActivationInfo = useRef(false);
  useEffect(() => {
    if (isPro && !hasShownActivationInfo.current) {
      handleInfo('info_pro_activated');
      hasShownActivationInfo.current = true;
    }
    if (!isPro) {
      hasShownActivationInfo.current = false;
    }
  }, [isPro]);

  const resetMix = useCallback(() => {
    if (mixedAudioUrl) URL.revokeObjectURL(mixedAudioUrl);
    setMixedAudioUrl(null);
    setSuggestedTitle('');
    setSuggestedDescription('');
  }, [mixedAudioUrl]);

  const handleError = (key: TranslationKey, params: { [key: string]: string | number } = {}, error?: any) => {
      const baseMessage = t(key, params);
      let finalMessage = baseMessage;

      const errorMessage = error?.message || (typeof error === 'string' ? error : null);

      if (errorMessage && !baseMessage.includes('Details:')) {
          finalMessage = `${baseMessage} | Details: ${errorMessage}`;
      }

      console.error(baseMessage, { errorDetails: error });
      setError(finalMessage);
      setTimeout(() => setError(null), 8000);
  };
  
  const handleInfo = (key: TranslationKey, duration: number = 5000) => {
      const message = t(key);
      setInfo(message);
      setTimeout(() => setInfo(null), duration);
  }
  
  const handleOpenUnlockModal = (tab: 'buy' | 'enter' | 'recover' = 'buy') => {
    setUnlockModalInitialTab(tab);
    setIsUnlockModalOpen(true);
  };

  const addTracks = useCallback(async (files: FileList, type: 'music' | 'spoken' | 'jingle') => {
    setUploadingType(type);
    setError(null);
    setInfo(null);
    resetMix();
    const newTracks: Track[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) continue;
      try {
        const { duration, arrayBuffer } = await readAudioFile(file);
        const newTrack: Track = {
          id: `${type}-${file.name}-${Date.now()}`,
          file,
          name: file.name,
          fileName: file.name,
          duration,
          type,
          fileBuffer: arrayBuffer,
          ...(type === 'music' && { vocalStartTime: 0 }),
        };
        newTracks.push(newTrack);
      } catch (err) {
        handleError('error_process_file', { fileName: file.name }, err);
        break;
      }
    }
    setTracks(prev => [...prev, ...newTracks]);
    setUploadingType(null);
  }, [resetMix, t]);

  const addUnderlay = useCallback(async (file: File) => {
    setUploadingType('underlay');
    setError(null);
    setInfo(null);
    resetMix();
    if (!file.type.startsWith('audio/')) {
        setError("Invalid file type for underlay.");
        setUploadingType(null);
        return;
    };
    try {
      const { duration, arrayBuffer } = await readAudioFile(file);
      const newTrack: Track = {
        id: `underlay-${file.name}-${Date.now()}`,
        file,
        name: file.name,
        fileName: file.name,
        duration,
        type: 'music',
        fileBuffer: arrayBuffer,
      };
      setUnderlayTrack(newTrack);
    } catch (err)      {
      handleError('error_process_file', { fileName: file.name }, err);
    }
    setUploadingType(null);
  }, [resetMix, t]);
  
  const applyLoadedProject = (projectData: any) => {
      const loadedTracks: Track[] = (projectData.tracks || []).map((t: any) => ({
        ...t,
        file: t.fileBuffer ? new File([t.fileBuffer], t.fileName) : null,
      }));

      setTracks(loadedTracks);

      if (projectData.underlayTrack) {
        setUnderlayTrack({
          ...projectData.underlayTrack,
          file: projectData.underlayTrack.fileBuffer ? new File([projectData.underlayTrack.fileBuffer], projectData.underlayTrack.fileName) : null,
        });
      } else {
        setUnderlayTrack(null);
      }
      
      if (projectData.mixerSettings) {
        setMixDuration(projectData.mixerSettings.mixDuration ?? 2);
        setDuckingAmount(projectData.mixerSettings.duckingAmount ?? 0.7);
        setRampUpDuration(projectData.mixerSettings.rampUpDuration ?? 1.5);
        setUnderlayVolume(projectData.mixerSettings.underlayVolume ?? 0.5);
        setTrimSilenceEnabled(projectData.mixerSettings.trimSilenceEnabled ?? true);
        setSilenceThreshold(projectData.mixerSettings.silenceThreshold ?? -45);
        setNormalizeTracks(projectData.mixerSettings.normalizeTracks ?? true);
        setNormalizeOutput(projectData.mixerSettings.normalizeOutput ?? true);
      }
      
      resetMix();
  };

  const handleRelinkFile = useCallback(async (trackId: string, file: File) => {
     setError(null);
     setInfo(null);
     try {
        const { duration, arrayBuffer } = await readAudioFile(file);
        
        setTracks(current => current.map(track => {
            if (track.id !== trackId) return track;
            return { ...track, file, duration, name: file.name, fileName: file.name, fileBuffer: arrayBuffer };
        }));

        setUnderlayTrack(current => {
            if (!current || current.id !== trackId) return current;
            return { ...current, file, duration, name: file.name, fileName: file.name, fileBuffer: arrayBuffer };
        });
        
        resetMix();
     } catch (err) {
        handleError('error_relink_failed', { fileName: file.name }, err);
     }
  }, [resetMix, t]);

  const deleteUnderlay = useCallback(() => {
    if (underlayTrack) {
      decodedAudioBuffers.current.delete(underlayTrack.id);
      setUnderlayTrack(null);
      resetMix();
    }
  }, [underlayTrack, resetMix]);
  
  const trackIds = useMemo(() => tracks.map(t => t.id).join(','), [tracks]);
  const underlayId = useMemo(() => underlayTrack?.id, [underlayTrack]);

  // Load mixer settings from localStorage on first load
  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('podcastMixerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings) {
                setMixDuration(settings.mixDuration ?? 2);
                setDuckingAmount(settings.duckingAmount ?? 0.7);
                setRampUpDuration(settings.rampUpDuration ?? 1.5);
                setUnderlayVolume(settings.underlayVolume ?? 0.5);
                setTrimSilenceEnabled(settings.trimSilenceEnabled ?? true);
                setSilenceThreshold(settings.silenceThreshold ?? -45);
                setNormalizeTracks(settings.normalizeTracks ?? true);
                setNormalizeOutput(settings.normalizeOutput ?? true);
            }
        }
    } catch (e) { console.error("Failed to load settings", e); }
  }, []);

  const mixerSettings = useMemo(() => ({
      mixDuration, duckingAmount, rampUpDuration, underlayVolume,
      trimSilenceEnabled, silenceThreshold, normalizeTracks, normalizeOutput
  }), [mixDuration, duckingAmount, rampUpDuration, underlayVolume,
      trimSilenceEnabled, silenceThreshold, normalizeTracks, normalizeOutput]);

  // Save mixer settings whenever they change
  useEffect(() => {
      try {
          localStorage.setItem('podcastMixerSettings', JSON.stringify(mixerSettings));
      } catch (e) {
          console.error("Failed to save settings", e);
      }
  }, [mixerSettings]);


  const getProjectData = useCallback(() => {
    return {
        tracks: tracks.map(t => ({
            id: t.id, name: t.name, fileName: t.fileName, duration: t.duration, type: t.type,
            vocalStartTime: t.vocalStartTime, fileBuffer: t.fileBuffer,
        })),
        underlayTrack: underlayTrack ? {
            id: underlayTrack.id, name: underlayTrack.name, fileName: underlayTrack.fileName,
            duration: underlayTrack.duration, type: underlayTrack.type, fileBuffer: underlayTrack.fileBuffer,
        } : null,
        mixerSettings: mixerSettings
    };
  }, [tracks, underlayTrack, mixerSettings]);

  const handleSaveProject = async (name: string, idToUpdate?: number) => {
    setIsSaving(true);
    try {
        const project: Omit<SavedProject, 'id'> & { id?: number } = {
            name,
            createdAt: new Date().toISOString(),
            projectData: getProjectData()
        };

        if (idToUpdate) {
            project.id = idToUpdate;
        }

        const savedId = await db.saveProject(project);
        setProjectId(idToUpdate ?? savedId);
        setProjectName(name);
        handleInfo('info_project_saved');
    } catch (e) {
        console.error("Failed to save project to IndexedDB", e);
        handleError('error_project_save_failed', {}, e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleLoadProject = async (id: number) => {
      try {
          const project = await db.getProjectById(id);
          if (project) {
            applyLoadedProject(project.projectData);
            setProjectName(project.name);
            setProjectId(project.id);
            handleInfo('info_project_loaded');
          }
      } catch (e) {
          console.error("Failed to load project", e);
          handleError('error_project_load_failed', {}, e);
      }
  };

   useEffect(() => {
    const analyzeAllTracks = async () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const allTracks = underlayTrack ? [...tracks, underlayTrack] : tracks;

      const updates = new Map<string, Partial<Track>>();

      for (const track of allTracks) {
        if (!track.file || !track.fileBuffer) continue;
        try {
          let buffer = decodedAudioBuffers.current.get(track.id);
          if (!buffer) {
            buffer = await audioContext.decodeAudioData(track.fileBuffer.slice(0));
            decodedAudioBuffers.current.set(track.id, buffer);
          }
          
          const trackUpdates: Partial<Track> = {};

          if (trimSilenceEnabled) {
              const { smartTrimStart, smartTrimEnd } = analyzeTrackBoundaries(buffer, silenceThreshold);
              trackUpdates.smartTrimStart = smartTrimStart;
              trackUpdates.smartTrimEnd = smartTrimEnd;
          } else {
              trackUpdates.smartTrimStart = undefined;
              trackUpdates.smartTrimEnd = undefined;
          }

          if (normalizeTracks) {
              const targetLoudness = -16; // Target RMS in dBFS
              const rmsDb = calculateRMS(buffer);
              if (isFinite(rmsDb)) {
                const gain = Math.pow(10, (targetLoudness - rmsDb) / 20);
                trackUpdates.normalizationGain = gain;
              } else {
                trackUpdates.normalizationGain = 1;
              }
          } else {
              trackUpdates.normalizationGain = undefined;
          }
          
          const currentTrackState = track.id.startsWith('underlay-') ? underlayTrack : tracks.find(t => t.id === track.id);
          const needsUpdate = Object.keys(trackUpdates).some(key => trackUpdates[key as keyof Track] !== currentTrackState?.[key as keyof Track]);
          
          if (needsUpdate) {
            updates.set(track.id, trackUpdates);
          }

        } catch (err) {
          handleError('error_process_file', { fileName: track.name }, err);
        }
      }

      if (updates.size > 0) {
        setTracks(current => current.map(t => updates.has(t.id) ? { ...t, ...updates.get(t.id) } : t));
        if (underlayTrack && updates.has(underlayTrack.id)) {
          setUnderlayTrack(t => t ? ({...t, ...updates.get(underlayTrack.id)}) : null);
        }
        resetMix();
      }
    };

    analyzeAllTracks();
  }, [trimSilenceEnabled, normalizeTracks, trackIds, underlayId, silenceThreshold, t, resetMix]);

  const handleReorderTracks = useCallback((dragIndex: number, hoverIndex: number) => {
    setTracks(prevTracks => {
        const newTracks = [...prevTracks];
        const [reorderedItem] = newTracks.splice(dragIndex, 1);
        newTracks.splice(hoverIndex, 0, reorderedItem);
        return newTracks;
    });
    resetMix();
  }, [resetMix]);

  const handleDeleteTrack = useCallback((id: string) => {
    setTracks(current => current.filter(track => track.id !== id));
    decodedAudioBuffers.current.delete(id);
    resetMix();
  }, [resetMix]);

  const updateVocalStartTime = useCallback((id: string, time: number) => {
    setTracks(current => current.map(t => t.id === id ? { ...t, vocalStartTime: time } : t));
    resetMix();
  }, [resetMix]);

  const handlePreview = useCallback(async (trackId: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    if (previewState.sourceNode) {
        previewState.sourceNode.stop();
        if (previewState.timeoutId) clearTimeout(previewState.timeoutId);
        setPreviewState({ trackId: null, sourceNode: null, timeoutId: null });
        if (previewState.trackId === trackId) return;
    }
    
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.file || track.type !== 'music' || (track.vocalStartTime ?? 0) >= track.duration) return;

    try {
        let buffer = decodedAudioBuffers.current.get(trackId);
        if (!buffer) {
          if (!track.fileBuffer) {
             throw new Error("Preview failed: audio data not available.");
          }
          buffer = await audioContext.decodeAudioData(track.fileBuffer.slice(0));
          decodedAudioBuffers.current.set(trackId, buffer);
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        const previewDuration = 3;
        source.start(0, track.vocalStartTime, previewDuration);
        
        const timeoutId = window.setTimeout(() => {
             setPreviewState(prev => prev.trackId === trackId ? { trackId: null, sourceNode: null, timeoutId: null } : prev);
        }, previewDuration * 1000);

        source.onended = () => {
             setPreviewState(prev => prev.trackId === trackId ? { trackId: null, sourceNode: null, timeoutId: null } : prev);
        };
        
        setPreviewState({ trackId, sourceNode: source, timeoutId });

    } catch (err) {
        handleError('error_preview_failed', { fileName: track.name }, err);
    }
  }, [tracks, previewState, t]);
  
  const handleUpdateTrackOrder = useCallback((newOrder: Track[]) => {
    setTracks(newOrder);
    setIsReordering(false);
    resetMix();
  }, [resetMix]);
  
  const timelineLayout = useMemo(() => {
    const layout = [];
    let timeCursor = 0;
    
    const tracksWithFiles = tracks.filter(t => t.file);

    for (let i = 0; i < tracksWithFiles.length; i++) {
        const track = tracksWithFiles[i];
        const prevLayoutItem = i > 0 ? layout[i - 1] : null;

        const smartStart = (trimSilenceEnabled && track.smartTrimStart !== undefined) ? track.smartTrimStart : 0;
        const smartEnd = (trimSilenceEnabled && track.smartTrimEnd !== undefined) ? track.smartTrimEnd : track.duration;
        
        const positioningDuration = smartEnd - smartStart;
        const playbackDuration = track.duration - smartStart;

        let startTime = prevLayoutItem ? (prevLayoutItem.startTime + prevLayoutItem.positioningDuration) : 0;
        let isTalkUpIntro = false;

        if (prevLayoutItem) {
            const prevTrack = prevLayoutItem.track;

            if ((prevTrack.type === 'spoken' || prevTrack.type === 'jingle') && track.type === 'music') {
                isTalkUpIntro = true;
                const vocalStart = track.vocalStartTime ?? 0;
                const overlapDuration = vocalStart > 0 ? vocalStart : mixDuration;
                startTime -= Math.min(overlapDuration, prevLayoutItem.positioningDuration);
            } else if (prevTrack.type === 'music' && track.type === 'music') {
                startTime -= mixDuration;
            }
        }

        const newItem = {
            track,
            startTime: Math.max(0, startTime),
            endTime: Math.max(0, startTime) + positioningDuration,
            playOffset: smartStart,
            playbackDuration: playbackDuration,
            positioningDuration: positioningDuration,
            isTalkUpIntro
        };
        layout.push(newItem);
        timeCursor = newItem.endTime;
    }

    const underlayLayout = [];
    if (underlayTrack && underlayTrack.file) {
        const musicItems = layout.filter(item => item.track.type === 'music');
        
        for (let i = 0; i < musicItems.length - 1; i++) {
            const firstMusicItem = musicItems[i];
            const secondMusicItem = musicItems[i+1];

            const underlayStart = firstMusicItem.endTime;
            const underlayEnd = secondMusicItem.startTime;
            
            if (underlayEnd > underlayStart) {
                const underlaySmartStart = (trimSilenceEnabled && underlayTrack.smartTrimStart !== undefined) ? underlayTrack.smartTrimStart : 0;
                
                underlayLayout.push({
                    track: underlayTrack,
                    startTime: underlayStart,
                    endTime: underlayEnd + mixDuration,
                    playOffset: underlaySmartStart, 
                    playbackDuration: (underlayEnd - underlayStart) + mixDuration,
                    positioningDuration: underlayEnd - underlayStart,
                });
            }
        }
    }

    const actualEndTimes = layout.map(item => item.startTime + item.playbackDuration);
    const totalDuration = layout.length > 0 ? Math.max(0, ...actualEndTimes, ...underlayLayout.map(item => item.endTime)) : 0;
    
    return { layout, underlayLayout, totalDuration };
}, [tracks, underlayTrack, mixDuration, trimSilenceEnabled]);

const renderMix = useCallback(async (sampleRate: number): Promise<AudioBuffer> => {
    const { layout, underlayLayout, totalDuration } = timelineLayout;
    if (totalDuration <= 0) {
      throw new Error("Calculated mix duration is zero or negative.");
    }

    const audioContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: Math.ceil(sampleRate * (totalDuration + 2)),
        sampleRate: sampleRate,
    });

    const allItems = [...layout, ...underlayLayout];
    
    for (const item of allItems) {
        const isUnderlay = item.track.id.startsWith('underlay-');
        let trackBuffer = decodedAudioBuffers.current.get(item.track.id);
        
        if (!trackBuffer) {
            if (!item.track.fileBuffer) continue;
            const tempCtx = new AudioContext({ sampleRate });
            trackBuffer = await tempCtx.decodeAudioData(item.track.fileBuffer.slice(0));
            await tempCtx.close();
            decodedAudioBuffers.current.set(item.track.id, trackBuffer);
        }

        if (!trackBuffer) continue;

        const source = audioContext.createBufferSource();
        source.buffer = trackBuffer;
        const gainNode = audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const gain = gainNode.gain;
        gain.setValueAtTime(item.track.normalizationGain ?? 1.0, 0);

        if (isUnderlay) {
            source.loop = true;
            gain.setValueAtTime(0.0, item.startTime);
            gain.linearRampToValueAtTime(underlayVolume * (item.track.normalizationGain ?? 1.0), item.startTime + 0.1);
            const fadeOutStartTime = item.endTime - mixDuration;
            if (fadeOutStartTime > item.startTime + 0.1) {
                gain.setValueAtTime(underlayVolume * (item.track.normalizationGain ?? 1.0), fadeOutStartTime);
            }
            gain.linearRampToValueAtTime(0, item.endTime);
        } else { 
              const mainLayoutIndex = layout.findIndex(l => l.track.id === item.track.id);
              const prevItem = mainLayoutIndex > 0 ? layout[mainLayoutIndex - 1] : null;
              const nextItem = mainLayoutIndex < layout.length - 1 ? layout[mainLayoutIndex + 1] : null;

              const baseGain = item.track.normalizationGain ?? 1.0;
              const duckedGain = baseGain * (1 - duckingAmount);
              
              let fadeInEndTime = item.startTime;

              if (item.isTalkUpIntro && prevItem && prevItem.endTime > item.startTime) {
                  const duckingEndTime = prevItem.endTime;
                  const rampDuration = Math.min(rampUpDuration, item.startTime + item.playbackDuration - duckingEndTime);
                  const rampUpEndTime = duckingEndTime + rampDuration;
                  
                  gain.setValueAtTime(duckedGain, item.startTime);
                  if (duckingEndTime > item.startTime) gain.setValueAtTime(duckedGain, duckingEndTime);
                 
                  if (rampUpEndTime > duckingEndTime) gain.linearRampToValueAtTime(baseGain, rampUpEndTime);
                  else gain.setValueAtTime(baseGain, duckingEndTime);
                  
                  fadeInEndTime = rampUpEndTime;
              } else if (prevItem && prevItem.track.type === 'music' && item.track.type === 'music') {
                  const rampUpEndTime = item.startTime + mixDuration;
                  gain.setValueAtTime(0.0, item.startTime);
                  gain.linearRampToValueAtTime(baseGain, rampUpEndTime);
                  fadeInEndTime = rampUpEndTime;
              } else {
                  gain.setValueAtTime(baseGain, item.startTime);
              }

              if (item.track.type === 'music' && nextItem && (nextItem.track.type === 'music' || nextItem.track.type === 'jingle')) {
                  const fadeOutStartTime = Math.max(fadeInEndTime, item.endTime - mixDuration);
                  const fadeOutFinishTime = item.endTime;
                  if (fadeOutFinishTime > fadeOutStartTime) {
                      gain.setValueAtTime(baseGain, fadeOutStartTime);
                      gain.linearRampToValueAtTime(0.0, fadeOutFinishTime);
                  }
              } else if (!nextItem) {
                  const actualEndTime = item.startTime + item.playbackDuration;
                  const fadeDuration = Math.min(0.5, item.playbackDuration);
                  if (fadeDuration > 0.01) {
                      const fadeOutStartTime = Math.max(fadeInEndTime, actualEndTime - fadeDuration);
                      gain.setValueAtTime(baseGain, fadeOutStartTime);
                      gain.linearRampToValueAtTime(0.0, actualEndTime);
                  }
              }
        }
        
        source.start(item.startTime, item.playOffset);
        const stopTime = isUnderlay ? item.endTime : item.startTime + item.playbackDuration;
        if (stopTime > item.startTime) {
            source.stop(stopTime);
        }
    }
    
    let mixedBuffer = await audioContext.startRendering();
    
    if (normalizeOutput) {
      let maxPeak = 0;
      for (let i = 0; i < mixedBuffer.numberOfChannels; i++) {
        const data = mixedBuffer.getChannelData(i);
        for (let j = 0; j < data.length; j++) {
          const peak = Math.abs(data[j]);
          if (peak > maxPeak) maxPeak = peak;
        }
      }
      
      if (maxPeak > 0 && maxPeak !== 1) {
        const gainValue = 0.98 / maxPeak;
        const gainContext = new OfflineAudioContext(mixedBuffer.numberOfChannels, mixedBuffer.length, mixedBuffer.sampleRate);
        const source = gainContext.createBufferSource();
        source.buffer = mixedBuffer;
        const gainNode = gainContext.createGain();
        gainNode.gain.value = gainValue;
        
        source.connect(gainNode);
        gainNode.connect(gainContext.destination);
        source.start();
        mixedBuffer = await gainContext.startRendering();
      }
    }
    
    return mixedBuffer;
}, [timelineLayout, duckingAmount, mixDuration, underlayVolume, normalizeOutput, rampUpDuration, normalizeTracks]);


  const estimatedDuration = timelineLayout.totalDuration;

  const handleMix = async () => {
    if (tracks.length === 0) {
      handleError("error_no_tracks_to_mix");
      return;
    }
    
    if (!isPro && estimatedDuration > DEMO_MAX_DURATION_SECONDS) {
        handleError('error_demo_duration_limit', { minutes: DEMO_MAX_DURATION_SECONDS / 60 });
        setIsUnlockModalOpen(true);
        return;
    }

    setIsMixing(true);
    setError(null);
    setInfo(null);
    resetMix();

    try {
      const mixedBuffer = await renderMix(44100);
      const wavBlob = encodeWav(mixedBuffer);
      setMixedAudioUrl(URL.createObjectURL(wavBlob));
    } catch (err) {
      handleError('error_mixing_failed', {}, err);
    } finally {
      setIsMixing(false);
    }
  };

  const handleExportAudio = async (options: ExportOptions) => {
    setExportProgressTitleKey('export_audio_progress_title');
    setIsExporting(true);
    setExportProgress(0);
    try {
        const mixedBuffer = await renderMix(options.sampleRate);
        let blob: Blob;
        let fileName: string;
        
        if (options.format === 'wav') {
            blob = encodeWav(mixedBuffer);
            fileName = `${projectName}.wav`;
            setExportProgress(100);
        } else {
            blob = await encodeMp3(mixedBuffer, options.bitrate, (p) => setExportProgress(p));
            fileName = `${projectName}.mp3`;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        setIsExportModalOpen(false);
    } catch(err) {
        handleError('error_export_failed', {}, err);
    } finally {
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
        }, 500);
    }
  };

  const handleExportProject = async () => {
    if (!mixedAudioUrl) {
        handleError('error_export_first_mix');
        return;
    }
    setExportProgressTitleKey('export_progress_title');
    setIsExporting(true);
    setExportProgress(0);
    try {
        const zip = new JSZip();
        
        // Remove file buffers before saving project.json to keep it small
        const projectDataToSave = getProjectData();
        projectDataToSave.tracks.forEach(t => { delete (t as any).fileBuffer; });
        if (projectDataToSave.underlayTrack) {
            delete (projectDataToSave.underlayTrack as any).fileBuffer;
        }
        zip.file("project.json", JSON.stringify(projectDataToSave, null, 2));

        const mixedAudioBlob = await fetch(mixedAudioUrl).then(r => r.blob());
        zip.file(`${projectName}_mix.wav`, mixedAudioBlob);

        const sourceFilesFolder = zip.folder("source_files");
        const allTracksWithFiles = [...tracks, underlayTrack].filter((t): t is Track => !!t && !!t.fileBuffer && !!t.fileName);

        if (sourceFilesFolder) {
            for (const track of allTracksWithFiles) {
                sourceFilesFolder.file(track.fileName, track.fileBuffer!);
            }
        }
        
        const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
            setExportProgress(metadata.percent);
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${projectName}_project.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch(err) {
        handleError('error_project_export_failed', {}, err);
    } finally {
        setIsExporting(false);
        setExportProgress(0);
    }
  };

  const handleSuggestContent = async () => {
    if (tracks.length === 0) {
      handleError("error_no_tracks_to_mix");
      return;
    }
    if (!isPro) {
      setIsUnlockModalOpen(true);
      return;
    }

    setIsSuggestingContent(true);
    setError(null);

    const trackList = tracks.map(t => `- ${t.name} (type: ${t.type})`).join('\n');
    
    try {
      const response = await fetch('/api/suggest-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackList }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get suggestion.' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get suggestion from API.');
      }
      
      const { title, description } = result.data;
      
      setSuggestedTitle(title || '');
      setSuggestedDescription(description || '');

    } catch (err) {
      handleError('error_suggestion_failed', {}, err);
    } finally {
      setIsSuggestingContent(false);
    }
  };


  const showDuckingControl = useMemo(() => {
    for (let i = 0; i < tracks.length - 1; i++) {
      const current = tracks[i];
      const next = tracks[i+1];
      if ((current.type === 'spoken' || current.type === 'jingle') && next.type === 'music') {
        return true;
      }
    }
    return false;
  }, [tracks]);

  const showUnderlayControl = useMemo(() => {
    if (!underlayTrack) return false;
    return tracks.filter(t => t.type === 'music').length >= 2;
  }, [tracks, underlayTrack]);
  
  const canMix = tracks.length > 0 && 
                 !tracks.some(t => !t.file) && 
                 (!underlayTrack || !!underlayTrack.file);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      {isReordering && (
        <ReorderModal 
            tracks={tracks}
            onClose={() => setIsReordering(false)}
            onSave={handleUpdateTrackOrder}
        />
      )}
      {isUnlockModalOpen && (
        <UnlockModal 
            onClose={() => setIsUnlockModalOpen(false)} 
            initialTab={unlockModalInitialTab}
        />
      )}
      {isHelpModalOpen && (
        <HelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}
      {isExportModalOpen && isPro && (
        <ExportModal 
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportAudio}
          isExporting={isExporting}
        />
      )}
      {isSaveModalOpen && (
        <SaveProjectModal 
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveProject}
            onLoad={handleLoadProject}
            isSaving={isSaving}
            currentProjectName={projectName}
            currentProjectId={projectId}
        />
      )}
      {isExporting && <ExportProgressModal progress={exportProgress} titleKey={exportProgressTitleKey} />}


      <div className="max-w-7xl mx-auto">
        <Header 
          onOpenUnlockModal={handleOpenUnlockModal}
        />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
              <span>{t('show_help_guide')}</span>
            </button>
            <TrackUploader 
              onFilesSelect={addTracks} 
              onUnderlaySelect={addUnderlay}
              uploadingType={uploadingType}
              isMixing={isMixing} 
            />
            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm" role="alert">{error}</div>}
            {info && <div className="bg-blue-500/20 text-blue-300 p-3 rounded-md text-sm" role="status">{info}</div>}
            
            <MixerControls 
              mixDuration={mixDuration} 
              onMixDurationChange={(d) => { setMixDuration(d); resetMix(); }}
              duckingAmount={duckingAmount}
              onDuckingAmountChange={(a) => { setDuckingAmount(a); resetMix(); }}
              rampUpDuration={rampUpDuration}
              onRampUpDurationChange={(d) => { setRampUpDuration(d); resetMix(); }}
              underlayVolume={underlayVolume}
              onUnderlayVolumeChange={(v) => { setUnderlayVolume(v); resetMix(); }}
              trimSilenceEnabled={trimSilenceEnabled}
              onTrimSilenceChange={(e) => { setTrimSilenceEnabled(e); resetMix(); }}
              silenceThreshold={silenceThreshold}
              onSilenceThresholdChange={(t) => { setSilenceThreshold(t); resetMix(); }}
              normalizeTracks={normalizeTracks}
              onNormalizeTracksChange={(e) => { setNormalizeTracks(e); resetMix(); }}
              normalizeOutput={normalizeOutput}
              onNormalizeOutputChange={(e) => { setNormalizeOutput(e); resetMix(); }}
              onMix={handleMix}
              isMixing={isMixing}
              onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
              onExportAudio={() => setIsExportModalOpen(true)}
              onExportProject={handleExportProject}
              onSaveProject={() => setIsSaveModalOpen(true)}
              isSaving={isSaving}
              mixedAudioUrl={mixedAudioUrl}
              isDisabled={!canMix}
              totalDuration={estimatedDuration}
              demoMaxDuration={DEMO_MAX_DURATION_SECONDS}
              showDuckingControl={showDuckingControl}
              showUnderlayControl={showUnderlayControl}
              onSuggestContent={handleSuggestContent}
              isSuggestingContent={isSuggestingContent}
              suggestedTitle={suggestedTitle}
              suggestedDescription={suggestedDescription}
            />
          </div>
          <div className="lg:col-span-2 bg-gray-800/50 rounded-lg p-6 shadow-2xl border border-gray-700">
            {tracks.length > 0 || underlayTrack ? (
              <div className="space-y-6">
                <MonitoringPanel
                  tracks={tracks}
                  underlayTrack={underlayTrack}
                  onDeleteTrack={handleDeleteTrack}
                  onDeleteUnderlay={deleteUnderlay}
                  onReorderTracks={handleReorderTracks}
                  onUpdateVocalStartTime={updateVocalStartTime}
                  onPreview={handlePreview}
                  onRelinkFile={handleRelinkFile}
                  previewingTrackId={previewState.trackId}
                  onToggleReorder={() => setIsReordering(true)}
                />
                <Timeline 
                  timelineLayout={timelineLayout}
                />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </main>
        <footer className="text-center text-xs text-gray-500 mt-8 pb-4">
          {t('footer_version')} 1.5.0 | © {new Date().getFullYear()} CustomRadio.sk
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const [locale, setLocale] = useState<Locale>(() => {
        try {
            const savedLocale = localStorage.getItem('podcastMixerLocale');
            if (savedLocale && translations[savedLocale as Locale]) {
                return savedLocale as Locale;
            }
        } catch (e) {
            console.error("Could not read locale from localStorage", e);
        }
        return 'en'; // Default to English
    });

    useEffect(() => {
        try {
            localStorage.setItem('podcastMixerLocale', locale);
        } catch (e) {
            console.error("Could not save locale to localStorage", e);
        }
    }, [locale]);

  const t = useCallback((key: TranslationKey, params?: { [key: string]: string | number }) => {
    // Fallback to English if key not found in current locale
    let str = translations[locale][key] || translations['en'][key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
          str = str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    return str;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ t, setLocale, locale }}>
      <AuthProvider>
        <ProProvider>
          <>
            <StripeReturnBanner />
            <AppContent />
          </>
        </ProProvider>
      </AuthProvider>
    </I18nContext.Provider>
  );
}


export default App;