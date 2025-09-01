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
import CenterPopup from './components/CenterPopup';


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

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-400">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const AppContent: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { isPro, proUser } = usePro();
  
  // Project State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [underlayTrack, setUnderlayTrack] = useState<Track | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectId, setProjectId] = useState<number | null>(null);

  // Mixer Settings
  const [mixDuration, setMixDuration] = useState(2);
  const [autoCrossfadeEnabled, setAutoCrossfadeEnabled] = useState(true);
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
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  const [isReordering, setIsReordering] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalInitialTab, setUnlockModalInitialTab] = useState<'buy' | 'enter'>('buy');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportProgressTitleKey, setExportProgressTitleKey] = useState<TranslationKey>('export_progress_title');
  const [showStripePopup, setShowStripePopup] = useState(false);
  const [showActivatedPopup, setShowActivatedPopup] = useState(false);
  const wasProRef = useRef(isPro);


  // AI Content
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const [isSuggestingContent, setIsSuggestingContent] = useState(false);

  // Refs for audio playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const playbackStartInfoRef = useRef<{ audioContextStartTime: number, trackStartTime: number } | null>(null);
  const decodedAudioBuffers = useRef<Map<string, AudioBuffer>>(new Map());
  
  // State for UI display of playback
  const [previewState, setPreviewState] = useState<{ trackId: string | null; isPlaying: boolean; currentTime: number; vuLevel: number; }>({ trackId: null, isPlaying: false, currentTime: 0, vuLevel: 0 });

  // Detect ?payment_success=true on load
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('payment_success') === 'true') {
      setShowStripePopup(true);
      // Clean URL to prevent popup on refresh
      url.searchParams.delete('payment_success');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Show activation popup on transition to PRO
  useEffect(() => {
    if (isPro && !wasProRef.current) {
      setShowActivatedPopup(true);
    }
    wasProRef.current = isPro;
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

      if (errorMessage && !baseMessage.includes(t('error_details'))) {
          finalMessage = `${baseMessage} | ${t('error_details')} ${errorMessage}`;
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
  
  const handleOpenUnlockModal = (tab: 'buy' | 'enter' = 'buy') => {
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
          fileType: file.type,
          duration,
          type,
          fileBuffer: arrayBuffer,
          volume: 1.0,
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
        handleError('error_invalid_underlay');
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
        fileType: file.type,
        duration,
        type: 'music',
        volume: 1.0,
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
        file: t.fileBuffer ? new File([t.fileBuffer], t.fileName, { type: t.fileType || 'audio/mpeg' }) : null,
      }));

      setTracks(loadedTracks);

      if (projectData.underlayTrack) {
        setUnderlayTrack({
          ...projectData.underlayTrack,
          file: projectData.underlayTrack.fileBuffer ? new File([projectData.underlayTrack.fileBuffer], projectData.underlayTrack.fileName, { type: projectData.underlayTrack.fileType || 'audio/mpeg' }) : null,
        });
      } else {
        setUnderlayTrack(null);
      }
      
      if (projectData.mixerSettings) {
        setMixDuration(projectData.mixerSettings.mixDuration ?? 2);
        setAutoCrossfadeEnabled(projectData.mixerSettings.autoCrossfadeEnabled ?? true);
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
            return { ...track, file, duration, name: file.name, fileName: file.name, fileBuffer: arrayBuffer, fileType: file.type };
        }));

        setUnderlayTrack(current => {
            if (!current || current.id !== trackId) return current;
            return { ...current, file, duration, name: file.name, fileName: file.name, fileBuffer: arrayBuffer, fileType: file.type };
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
                setAutoCrossfadeEnabled(settings.autoCrossfadeEnabled ?? true);
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
      mixDuration, autoCrossfadeEnabled, duckingAmount, rampUpDuration, underlayVolume,
      trimSilenceEnabled, silenceThreshold, normalizeTracks, normalizeOutput
  }), [mixDuration, autoCrossfadeEnabled, duckingAmount, rampUpDuration, underlayVolume,
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
        projectName: projectName,
        tracks: tracks.map(t => ({
            id: t.id, name: t.name, fileName: t.fileName, duration: t.duration, type: t.type,
            volume: t.volume,
            vocalStartTime: t.vocalStartTime, fileBuffer: t.fileBuffer, fileType: t.fileType,
            manualCrossfadePoint: t.manualCrossfadePoint,
            smartTrimStart: t.smartTrimStart,
            smartTrimEnd: t.smartTrimEnd,
        })),
        underlayTrack: underlayTrack ? {
            id: underlayTrack.id, name: underlayTrack.name, fileName: underlayTrack.fileName,
            duration: underlayTrack.duration, type: underlayTrack.type, volume: underlayTrack.volume,
            fileBuffer: underlayTrack.fileBuffer, fileType: underlayTrack.fileType,
            smartTrimStart: underlayTrack.smartTrimStart,
            smartTrimEnd: underlayTrack.smartTrimEnd,
        } : null,
        mixerSettings: mixerSettings
    };
  }, [tracks, underlayTrack, mixerSettings, projectName]);

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
      setIsLoadingProject(true);
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
      } finally {
          setIsLoadingProject(false);
      }
  };

  const handleLoadProjectFromFile = async (projectJsonFile: File | undefined, sourceFiles: File[]) => {
    setIsLoadingProject(true);
    try {
        if (!projectJsonFile) {
            throw new Error("`project.json` not found in the selected folder.");
        }
        
        const projectJsonContent = await projectJsonFile.text();
        const projectData = JSON.parse(projectJsonContent);

        const sourceFileMap = new Map(sourceFiles.map(f => [f.name, f]));
        
        const rehydratedTracks = await Promise.all(
            (projectData.tracks || []).map(async (track: any) => {
                const file = sourceFileMap.get(track.fileName);
                if (file) {
                    const { arrayBuffer } = await readAudioFile(file);
                    track.fileBuffer = arrayBuffer;
                }
                return track;
            })
        );
        projectData.tracks = rehydratedTracks;

        if (projectData.underlayTrack) {
            const file = sourceFileMap.get(projectData.underlayTrack.fileName);
            if (file) {
                const { arrayBuffer } = await readAudioFile(file);
                projectData.underlayTrack.fileBuffer = arrayBuffer;
            }
        }
      
      applyLoadedProject(projectData);

      const loadedProjectName = projectData.projectName || 'Imported Project';
      setProjectName(loadedProjectName);
      setProjectId(null); 
      handleInfo('info_project_loaded_from_file');
    } catch (e) {
      console.error("Failed to load project from folder", e);
      handleError('error_project_load_from_file_failed', {}, e);
    } finally {
      setIsLoadingProject(false);
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
          const currentTrackState = track.id.startsWith('underlay-') ? underlayTrack : tracks.find(t => t.id === track.id);

          // Only auto-analyze if trim times haven't been set yet (or feature is toggled)
          if (trimSilenceEnabled) {
              if (currentTrackState?.smartTrimStart === undefined || currentTrackState?.smartTrimEnd === undefined) {
                  const { smartTrimStart, smartTrimEnd } = analyzeTrackBoundaries(buffer, silenceThreshold);
                  trackUpdates.smartTrimStart = smartTrimStart;
                  trackUpdates.smartTrimEnd = smartTrimEnd;
              }
          } else {
              // Reset if feature is disabled
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

  const updateTrackVolume = useCallback((id: string, volume: number) => {
    const updateFunc = (current: Track[]): Track[] => current.map(t => {
        if (t.id === id) {
            return { ...t, volume };
        }
        return t;
    });
    setTracks(updateFunc);
    if (underlayTrack && underlayTrack.id === id) {
        setUnderlayTrack(t => t ? ({...t, volume }) : null);
    }
     // Live update preview gain if this track is playing
    if (previewState.trackId === id && gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
    resetMix();
  }, [underlayTrack, resetMix, previewState.trackId]);

  const updateVocalStartTime = useCallback((id: string, time: number) => {
    setTracks(current => current.map(t => t.id === id ? { ...t, vocalStartTime: time } : t));
    resetMix();
  }, [resetMix]);
  
  const updateManualCrossfadePoint = useCallback((id: string, time: number | undefined) => {
    setTracks(current => current.map(t => t.id === id ? { ...t, manualCrossfadePoint: time } : t));
    resetMix();
  }, [resetMix]);

  const updateTrimTimes = useCallback((id: string, times: { start?: number; end?: number }) => {
    const updateFunc = (current: Track[]): Track[] => current.map(t => {
        if (t.id === id) {
            return {
                ...t,
                smartTrimStart: times.start ?? t.smartTrimStart,
                smartTrimEnd: times.end ?? t.smartTrimEnd,
            };
        }
        return t;
    });
    setTracks(updateFunc);
    // Also update underlay if needed
    if (underlayTrack && underlayTrack.id === id) {
        setUnderlayTrack(t => t ? ({...t, smartTrimStart: times.start ?? t.smartTrimStart, smartTrimEnd: times.end ?? t.smartTrimEnd}) : null);
    }
    resetMix();
  }, [underlayTrack, resetMix]);

   const stopCurrentPreview = useCallback(() => {
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
    }
    if (analyserNodeRef.current) {
        analyserNodeRef.current.disconnect();
        analyserNodeRef.current = null;
    }
    if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.onended = null;
        try { sourceNodeRef.current.stop(); } catch(e) { /* Can error if already stopped, which is fine */ }
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    const currentlyPlayingTrackId = playbackStartInfoRef.current ? previewState.trackId : null;
    playbackStartInfoRef.current = null;

    if(currentlyPlayingTrackId) {
        setPreviewState(prev => ({...prev, trackId: currentlyPlayingTrackId, isPlaying: false, vuLevel: 0}));
    } else {
         setPreviewState(prev => prev.isPlaying ? { ...prev, isPlaying: false, vuLevel: 0 } : prev);
    }
  }, [previewState.trackId]);


  const updatePreviewTime = useCallback(() => {
    if (!audioContextRef.current || !playbackStartInfoRef.current) {
      animationFrameIdRef.current = null; // Ensure animation stops
      return;
    }
    const elapsedTime = audioContextRef.current.currentTime - playbackStartInfoRef.current.audioContextStartTime;
    const newCurrentTime = playbackStartInfoRef.current.trackStartTime + elapsedTime;
    
    let vuLevel = 0;
    if (analyserNodeRef.current) {
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNodeRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        vuLevel = Math.min(1, (average / 128)); 
    }
    
    setPreviewState(prev => {
        if (prev.isPlaying) {
            return { ...prev, currentTime: newCurrentTime, vuLevel };
        }
        return prev;
    });
    
    animationFrameIdRef.current = requestAnimationFrame(updatePreviewTime);
  }, []);

  const handlePreview = useCallback(async (trackId: string, startTime?: number) => {
    const track = [...tracks, underlayTrack].find(t => t?.id === trackId);
    if (!track || !track.fileBuffer) return;
    
    // Toggle pause/play
    if (previewState.isPlaying && previewState.trackId === trackId && startTime === undefined) {
        stopCurrentPreview();
        return;
    }

    // Stop any other track before playing a new one
    if(previewState.isPlaying) {
      stopCurrentPreview();
    }
    
    // Set up a new playback from a specific time
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    // Determine start time: from parameter, or resume, or from beginning
    const isResumingFromPause = previewState.trackId === trackId && previewState.currentTime < track.duration && !previewState.isPlaying;

    let timeToStart;
    if (startTime !== undefined) { // 1. Direct click on waveform or CUE button
        timeToStart = startTime;
    } else if (isResumingFromPause) { // 2. Resuming a paused track
        timeToStart = previewState.currentTime;
    } else { // 3. Fresh play from beginning (for non-music) or 0 (for music without CUE)
        timeToStart = (trimSilenceEnabled && track.smartTrimStart !== undefined) ? track.smartTrimStart : 0;
    }
    
    if (timeToStart >= track.duration) {
        timeToStart = 0; // Failsafe if CUE point is at the end
    }

    try {
      let buffer = decodedAudioBuffers.current.get(trackId);
      if (!buffer) {
        buffer = await audioContext.decodeAudioData(track.fileBuffer.slice(0));
        decodedAudioBuffers.current.set(trackId, buffer);
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = track.volume ?? 1.0;
      gainNodeRef.current = gainNode;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);
      
      source.start(0, timeToStart);

      sourceNodeRef.current = source;
      playbackStartInfoRef.current = { audioContextStartTime: audioContext.currentTime, trackStartTime: timeToStart };

      setPreviewState({ trackId, isPlaying: true, currentTime: timeToStart, vuLevel: 0 });
      
      animationFrameIdRef.current = requestAnimationFrame(updatePreviewTime);

      source.onended = () => {
        if (sourceNodeRef.current === source) {
            stopCurrentPreview();
            setPreviewState(prev => ({ ...prev, trackId, isPlaying: false, currentTime: track.duration, vuLevel: 0 }));
        }
      };

    } catch (err) {
      handleError('error_preview_failed', { fileName: track.name }, err);
    }
  }, [previewState, stopCurrentPreview, tracks, underlayTrack, t, updatePreviewTime, trimSilenceEnabled]);

  const handleCuePlay = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const cueTime = track.type === 'music' 
        ? track.vocalStartTime ?? 0 
        : (trimSilenceEnabled && track.smartTrimStart !== undefined) ? track.smartTrimStart : 0;
        
    handlePreview(trackId, cueTime);
  }, [tracks, handlePreview, trimSilenceEnabled]);

  const handleWaveformClick = (trackId: string, time: number, isShiftClick: boolean) => {
    const track = tracks.find(t => t.id === trackId);
    if (track && track.type === 'music' && isShiftClick) {
        updateVocalStartTime(trackId, time);
    }
    handlePreview(trackId, time);
  };
  
  const handleUpdateTrackOrder = useCallback((newOrder: Track[]) => {
    setTracks(newOrder);
    setIsReordering(false);
    resetMix();
  }, [resetMix]);
  
  const timelineLayout = useMemo(() => {
    const layout: any[] = [];
    const tracksWithFiles = tracks.filter(t => t.file);

    let currentTime = 0;

    for (let i = 0; i < tracksWithFiles.length; i++) {
        const track = tracksWithFiles[i];
        const prevTrack = i > 0 ? tracksWithFiles[i - 1] : null;

        const smartStart = (trimSilenceEnabled && track.smartTrimStart !== undefined) ? track.smartTrimStart : 0;
        const smartEnd = (trimSilenceEnabled && track.smartTrimEnd !== undefined) ? track.smartTrimEnd : track.duration;
        
        const effectiveDuration = smartEnd - smartStart;
        if (effectiveDuration <= 0) continue;

        let startTime = currentTime;
        let isTalkUpIntro = false;
        
        if (prevTrack) {
            const prevLayoutItem = layout[layout.length - 1];
            
            if (prevTrack.manualCrossfadePoint !== undefined && prevTrack.manualCrossfadePoint > 0) {
                 const prevEffectiveDuration = prevLayoutItem.playbackDuration;
                 const crossfadePointInContext = prevTrack.manualCrossfadePoint - prevLayoutItem.playOffset;
                 
                 if (crossfadePointInContext > 0 && crossfadePointInContext < prevEffectiveDuration) {
                    startTime = prevLayoutItem.startTime + crossfadePointInContext;
                 } else {
                    startTime = prevLayoutItem.endTime;
                 }
            } else if (autoCrossfadeEnabled) {
                if ((prevTrack.type === 'spoken' || prevTrack.type === 'jingle') && track.type === 'music') {
                    isTalkUpIntro = true;
                    const introDuration = track.vocalStartTime ?? 0;
                    startTime = prevLayoutItem.endTime - introDuration;
                } else if (prevTrack.type === 'music' && track.type === 'music') {
                    startTime = prevLayoutItem.endTime - mixDuration;
                } else if (prevTrack.type === 'music' && (track.type === 'spoken' || track.type === 'jingle')) {
                    startTime = prevLayoutItem.endTime - mixDuration;
                } else {
                    startTime = prevLayoutItem.endTime;
                }
            } else {
                startTime = prevLayoutItem.endTime;
            }
        }
        
        const finalStartTime = Math.max(0, startTime);
        const newItem = {
            track,
            startTime: finalStartTime,
            endTime: finalStartTime + effectiveDuration,
            playOffset: smartStart,
            playbackDuration: effectiveDuration,
            isTalkUpIntro
        };
        layout.push(newItem);
        currentTime = newItem.endTime;
    }
    
    const actualEndTimes = layout.map(item => item.endTime);
    const totalDuration = layout.length > 0 ? Math.max(0, ...actualEndTimes) : 0;

    const underlayLayout: any[] = [];
    if (underlayTrack && underlayTrack.file) {
        const programTracks = new Set(['music', 'jingle']);
        for (let i = 0; i < layout.length; i++) {
            const currentItem = layout[i];
            const nextItem = layout[i+1];
            if (programTracks.has(currentItem.track.type) && nextItem && !programTracks.has(nextItem.track.type)) {
                const underlayStart = currentItem.endTime;
                let underlayEnd = totalDuration;
                for (let j = i + 1; j < layout.length; j++) {
                    if (programTracks.has(layout[j].track.type)) {
                        underlayEnd = layout[j].startTime;
                        break;
                    }
                }

                if (underlayEnd > underlayStart) {
                     const underlaySmartStart = (trimSilenceEnabled && underlayTrack.smartTrimStart !== undefined) ? underlayTrack.smartTrimStart : 0;
                     underlayLayout.push({
                         track: underlayTrack,
                         startTime: underlayStart,
                         endTime: underlayEnd,
                         playOffset: underlaySmartStart, 
                         playbackDuration: underlayEnd - underlayStart,
                     });
                }
            }
        }
    }

    const finalTotalDuration = Math.max(totalDuration, ...underlayLayout.map(item => item.endTime));
    
    return { layout, underlayLayout, totalDuration: finalTotalDuration };
}, [tracks, underlayTrack, mixDuration, trimSilenceEnabled, rampUpDuration, autoCrossfadeEnabled]);

  const defaultCrossfadePoints = useMemo(() => {
    const points = new Map<string, number>();
    tracks.forEach((track, index) => {
        // A crossfade point is only relevant for tracks that have a next track
        // and are of a type that can fade out (music).
        if (track.type === 'music' && index < tracks.length - 1) {
            const nextTrack = tracks[index + 1];
            // Only create auto-crossfade points for music->music or music->spoken/jingle transitions
            if (nextTrack.type === 'music' || nextTrack.type === 'spoken' || nextTrack.type === 'jingle') {
                const smartEnd = (trimSilenceEnabled && track.smartTrimEnd !== undefined) ? track.smartTrimEnd : track.duration;
                // The crossfade happens 'mixDuration' seconds before the effective end of the track.
                const point = smartEnd - mixDuration;

                const smartStart = (trimSilenceEnabled && track.smartTrimStart !== undefined) ? track.smartTrimStart : 0;
                // Ensure the point is after the start of the audible content
                if (point > smartStart) {
                    points.set(track.id, point);
                }
            }
        }
    });
    return points;
  }, [tracks, mixDuration, trimSilenceEnabled]);

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

        const trackVolume = item.track.volume ?? 1.0;
        const baseGainValue = (item.track.normalizationGain ?? 1.0) * trackVolume;

        if (isUnderlay) {
            source.loop = true;
            gainNode.gain.setValueAtTime(0.0, item.startTime);
            gainNode.gain.linearRampToValueAtTime(underlayVolume * baseGainValue, item.startTime + 0.1);
            
            const fadeOutStartTime = item.endTime - mixDuration;
            if (fadeOutStartTime > item.startTime + 0.1) {
                gainNode.gain.setValueAtTime(underlayVolume * baseGainValue, fadeOutStartTime);
            }
            gainNode.gain.linearRampToValueAtTime(0, item.endTime);
        } else { 
              const mainLayoutIndex = layout.findIndex(l => l.track.id === item.track.id);
              const prevItem = mainLayoutIndex > 0 ? layout[mainLayoutIndex - 1] : null;
              const nextItem = mainLayoutIndex < layout.length - 1 ? layout[mainLayoutIndex + 1] : null;

              const duckedGain = baseGainValue * (1 - duckingAmount);
              
              let fadeInEndTime = item.startTime;
              
              if (item.isTalkUpIntro && prevItem) {
                  // Music starts ducked under spoken word, then ramps up to full volume as spoken word ends.
                  const rampUpStartPoint = Math.max(item.startTime, prevItem.endTime - rampUpDuration);
                  const rampUpEndPoint = prevItem.endTime;
                  
                  gainNode.gain.setValueAtTime(duckedGain, item.startTime);
                  if(rampUpStartPoint > item.startTime) {
                    gainNode.gain.setValueAtTime(duckedGain, rampUpStartPoint);
                  }
                  gainNode.gain.linearRampToValueAtTime(baseGainValue, rampUpEndPoint);
                  fadeInEndTime = rampUpEndPoint;
              } else if (prevItem && prevItem.track.type === 'music' && item.track.type === 'music' && (autoCrossfadeEnabled || prevItem.track.manualCrossfadePoint)) {
                  const crossfadeDuration = prevItem.track.manualCrossfadePoint ? (item.startTime - prevItem.startTime) : mixDuration;
                  const rampUpEndTime = item.startTime + crossfadeDuration;
                  gainNode.gain.setValueAtTime(0.0, item.startTime);
                  gainNode.gain.linearRampToValueAtTime(baseGainValue, rampUpEndTime);
                  fadeInEndTime = rampUpEndTime;
              } else {
                  gainNode.gain.setValueAtTime(baseGainValue, item.startTime);
              }

              if (item.track.type === 'music' && nextItem) {
                  const useCrossfade = item.track.manualCrossfadePoint || (autoCrossfadeEnabled && (nextItem.track.type === 'music' || nextItem.track.type === 'jingle' || nextItem.track.type === 'spoken'));
                  if (useCrossfade) {
                    const fadeOutStartTime = Math.max(fadeInEndTime, nextItem.startTime);
                    const crossfadeDuration = item.track.manualCrossfadePoint ? (item.endTime - nextItem.startTime) : mixDuration;
                    const fadeOutFinishTime = fadeOutStartTime + crossfadeDuration;
                    const actualAudioEndTime = item.startTime + item.playbackDuration;
                    const finalFadeEndTime = Math.min(fadeOutFinishTime, actualAudioEndTime);

                    if (finalFadeEndTime > fadeOutStartTime) {
                        gainNode.gain.setValueAtTime(baseGainValue, fadeOutStartTime);
                        gainNode.gain.linearRampToValueAtTime(0.0, finalFadeEndTime);
                    }
                  }
              } else if (!nextItem) {
                  // Gentle fade out for the very last track in the mix
                  const actualEndTime = item.startTime + item.playbackDuration;
                  const fadeDuration = Math.min(1.0, item.playbackDuration); // Fade for 1s or less
                  if (fadeDuration > 0.01) {
                      const fadeOutStartTime = Math.max(fadeInEndTime, actualEndTime - fadeDuration);
                      gainNode.gain.setValueAtTime(baseGainValue, fadeOutStartTime);
                      gainNode.gain.linearRampToValueAtTime(0.0, actualEndTime);
                  }
              }
        }
        
        source.start(item.startTime, item.playOffset);
        const stopTime = item.startTime + item.playbackDuration;
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
}, [timelineLayout, duckingAmount, mixDuration, underlayVolume, normalizeOutput, rampUpDuration, normalizeTracks, autoCrossfadeEnabled]);


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
    // Show if there is at least one music track followed by a non-music track
    for (let i = 0; i < tracks.length - 1; i++) {
        if ((tracks[i].type === 'music' || tracks[i].type === 'jingle') && (tracks[i+1].type !== 'music' && tracks[i+1].type !== 'jingle')) {
            return true;
        }
    }
    return false;
  }, [tracks, underlayTrack]);
  
  const canMix = tracks.length > 0 && 
                 !tracks.some(t => !t.file) && 
                 (!underlayTrack || !!underlayTrack.file);

  const stripePopupMessage = useMemo(() => (
    <div className="space-y-3">
        <p>
            {t('popup_stripe_message_new_1')} <strong>{t('popup_stripe_message_new_spam')}</strong> {t('popup_stripe_message_new_or')} <strong>{t('popup_stripe_message_new_promo')}</strong>.
        </p>
        <p>
            {t('popup_stripe_message_new_contact')}{' '}
            <a href="mailto:support@customradio.sk" className="underline decoration-dotted">
                support@customradio.sk
            </a>.
        </p>
    </div>
  ), [t]);

  const activatedPopupMessage = useMemo(() => {
    const baseMessage = <p>{t('popup_activated_message_new')}</p>;
    if (proUser && typeof proUser.activationsLeft === 'number') {
        const count = proUser.activationsLeft;
        const key: TranslationKey = count > 0 ? 'popup_activations_remaining_text' : 'popup_activations_limit_reached_text';
        const activationsMessage = <p className="text-sm text-gray-400 mt-2">{t(key, { count })}</p>;
        return <>{baseMessage}{activationsMessage}</>;
    }
    return baseMessage;
  }, [t, proUser]);
  
  return (
    <div className="min-h-dvh bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6 safe-top safe-bottom">
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
            onLoadFromFile={handleLoadProjectFromFile}
            isSaving={isSaving}
            isLoadingProject={isLoadingProject}
            currentProjectName={projectName === 'Untitled Project' ? t('default_project_name') : projectName}
            currentProjectId={projectId}
        />
      )}
      {isExporting && <ExportProgressModal progress={exportProgress} titleKey={exportProgressTitleKey} />}

      <CenterPopup
        open={showStripePopup}
        onClose={() => setShowStripePopup(false)}
        autoCloseMs={12000}
        title={t('popup_stripe_title_new')}
        icon={<SuccessIcon />}
        message={stripePopupMessage}
      />

      <CenterPopup
        open={showActivatedPopup}
        onClose={() => setShowActivatedPopup(false)}
        autoCloseMs={8000}
        title={t('popup_activated_title_new')}
        icon={<SuccessIcon />}
        message={activatedPopupMessage}
      />


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
              autoCrossfadeEnabled={autoCrossfadeEnabled}
              onAutoCrossfadeChange={(e) => { setAutoCrossfadeEnabled(e); resetMix(); }}
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
                  onUpdateManualCrossfadePoint={updateManualCrossfadePoint}
                  onUpdateTrackVolume={updateTrackVolume}
                  onUpdateTrimTimes={updateTrimTimes}
                  onPreview={handlePreview}
                  onCuePlay={handleCuePlay}
                  onWaveformClick={handleWaveformClick}
                  onRelinkFile={handleRelinkFile}
                  previewState={previewState}
                  onToggleReorder={() => setIsReordering(true)}
                  decodedAudioBuffers={decodedAudioBuffers.current}
                  autoCrossfadeEnabled={autoCrossfadeEnabled}
                  defaultCrossfadePoints={defaultCrossfadePoints}
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
          <AppContent />
        </ProProvider>
      </AuthProvider>
    </I18nContext.Provider>
  );
}


export default App;