import React, { useState, useCallback, useMemo, useRef, useEffect, useContext } from 'react';
import type { Track } from './types';
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
import { ExportModal, ExportOptions } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { I18nContext, translations, Locale, TranslationKey } from './lib/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

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
  const { user, profile, saveProject, loadProject, isPro } = useAuth();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [underlayTrack, setUnderlayTrack] = useState<Track | null>(null);
  const [mixDuration, setMixDuration] = useState<number>(2);
  const [duckingAmount, setDuckingAmount] = useState(0.7);
  const [rampUpDuration, setRampUpDuration] = useState(1.5);
  const [underlayVolume, setUnderlayVolume] = useState(0.5);
  
  const [uploadingType, setUploadingType] = useState<'music' | 'spoken' | 'jingle' | 'underlay' | null>(null);
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isActuallyExporting, setIsActuallyExporting] = useState<boolean>(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [wavBlobForExport, setWavBlobForExport] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const [trimSilenceEnabled, setTrimSilenceEnabled] = useState<boolean>(true);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(-45);
  const [normalizeOutput, setNormalizeOutput] = useState<boolean>(true);
  
  const [isReordering, setIsReordering] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [localProjectToMigrate, setLocalProjectToMigrate] = useState<any>(null);


  const audioContextRef = useRef<AudioContext | null>(null);
  const [previewState, setPreviewState] = useState<{ trackId: string | null; sourceNode: AudioBufferSourceNode | null, timeoutId: number | null }>({ trackId: null, sourceNode: null, timeoutId: null });
  const decodedAudioBuffers = useRef<Map<string, AudioBuffer>>(new Map());

  const resetMix = useCallback(() => {
    if (mixedAudioUrl) URL.revokeObjectURL(mixedAudioUrl);
    setMixedAudioUrl(null);
    setWavBlobForExport(null);
  }, [mixedAudioUrl]);

  const handleError = (key: TranslationKey, params: { [key: string]: string | number } = {}) => {
      const message = t(key, params);
      console.error(message);
      setError(message);
      setTimeout(() => setError(null), 5000);
  }
  
  const handleInfo = (key: TranslationKey, duration: number = 5000) => {
      const message = t(key);
      setInfo(message);
      setTimeout(() => setInfo(null), duration);
  }

  const handleCloseAuthModal = (success: boolean) => {
    setIsAuthModalOpen(false);
    if (success) {
      handleInfo('pro_unlocked_message');
    }
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
        handleError('error_process_file', { fileName: file.name });
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
      handleError('error_process_file', { fileName: file.name });
    }
    setUploadingType(null);
  }, [resetMix, t]);
  
  const applyLoadedProject = (projectData: any) => {
      const loadedTracks: Track[] = (projectData.tracks || []).map((t: any) => ({
        ...t,
        file: null, // Files must be re-linked
        fileBuffer: undefined,
      }));

      if (projectData.underlayTrack) {
        setUnderlayTrack({
          ...projectData.underlayTrack,
          file: null,
          fileBuffer: undefined,
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
        setNormalizeOutput(projectData.mixerSettings.normalizeOutput ?? true);
      }
      
      setTracks(loadedTracks);
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
        handleError('error_relink_failed', { fileName: file.name });
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

  // Load project on user change or first load
  useEffect(() => {
    const loadInitialProject = async () => {
        let loadedProject = null;
        if (user) {
            try {
                loadedProject = await loadProject();
                if (loadedProject) {
                   handleInfo('info_cloud_project_loaded');
                }
            } catch (e) {
                console.error("Failed to load project from Supabase", e);
                handleError('error_cloud_load_failed');
            }
        } else {
            try {
                const savedSession = localStorage.getItem('podcastMixerSession');
                if (savedSession) {
                    loadedProject = JSON.parse(savedSession);
                    if (loadedProject.tracks?.length > 0 || loadedProject.underlayTrack) {
                        handleInfo('info_session_loaded');
                    }
                }
            } catch (e) {
                console.error("Failed to load session from localStorage", e);
                localStorage.removeItem('podcastMixerSession');
            }
        }
        
        if (loadedProject) {
            applyLoadedProject(loadedProject);
        } else {
            // Reset state if no project is loaded (e.g., on logout)
            applyLoadedProject({});
        }
    };
    loadInitialProject();
  }, [user]);

  // Check for local project to migrate on login
  useEffect(() => {
    if (user) {
        try {
            const savedSession = localStorage.getItem('podcastMixerSession');
            if (savedSession) {
                const project = JSON.parse(savedSession);
                if (project.tracks?.length > 0 || project.underlayTrack) {
                    setLocalProjectToMigrate(project);
                }
            }
        } catch (e) {
            console.error("Error checking for local project", e);
        }
    }
  }, [user]);

  const handleMigrateProject = async () => {
    if (!localProjectToMigrate || !user) return;
    try {
        await handleSaveProject(localProjectToMigrate); // Save to cloud
        applyLoadedProject(localProjectToMigrate); // Apply to current state
        localStorage.removeItem('podcastMixerSession'); // Clear local copy
        setLocalProjectToMigrate(null);
        handleInfo('info_project_migrated');
    } catch (e) {
        handleError('error_migration_failed');
    }
  };

  const handleIgnoreMigration = () => {
    localStorage.removeItem('podcastMixerSession');
    setLocalProjectToMigrate(null);
    handleInfo('info_local_project_discarded');
  };

  const getProjectData = (projectToSave?: any) => {
    if (projectToSave) {
        return projectToSave;
    }
    return {
        tracks: tracks.map(t => ({
            id: t.id,
            name: t.name,
            fileName: t.fileName,
            duration: t.duration,
            type: t.type,
            vocalStartTime: t.vocalStartTime,
        })),
        underlayTrack: underlayTrack ? {
            id: underlayTrack.id,
            name: underlayTrack.name,
            fileName: underlayTrack.fileName,
            duration: underlayTrack.duration,
            type: underlayTrack.type,
        } : null,
        mixerSettings: {
            mixDuration,
            duckingAmount,
            rampUpDuration,
            underlayVolume,
            trimSilenceEnabled,
            silenceThreshold,
            normalizeOutput,
        }
    };
  };

  const handleSaveProject = async (projectToSave? : any) => {
    const projectData = getProjectData(projectToSave);
    
    if (user) { // Save to Supabase
        setIsSaving(true);
        try {
            await saveProject(projectData);
            handleInfo('info_cloud_project_saved');
        } catch (e) {
            handleError('error_cloud_save_failed');
        } finally {
            setIsSaving(false);
        }
    } else { // Save to localStorage
        try {
            localStorage.setItem('podcastMixerSession', JSON.stringify(projectData));
            handleInfo('info_local_project_saved');
        } catch (e) {
            console.error("Failed to save session to localStorage", e);
            handleError('error_local_save_failed');
        }
    }
  };


   useEffect(() => {
    const analyzeAllTracks = async () => {
      if (!trimSilenceEnabled) {
        // If trimming is disabled, clear any existing trim points
        if (tracks.some(t => t.smartTrimStart !== undefined) || underlayTrack?.smartTrimStart !== undefined) {
          setTracks(current => current.map(t => ({ ...t, smartTrimStart: undefined, smartTrimEnd: undefined })));
          if (underlayTrack) setUnderlayTrack(t => t ? ({...t, smartTrimStart: undefined, smartTrimEnd: undefined}) : null);
        }
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const allTracks = underlayTrack ? [...tracks, underlayTrack] : tracks;

      const updates = new Map<string, { smartTrimStart: number; smartTrimEnd: number }>();

      for (const track of allTracks) {
        if (!track.file) continue; // Skip tracks with missing files
        try {
          let buffer = decodedAudioBuffers.current.get(track.id);
          if (!buffer) {
            if (!track.fileBuffer) {
              console.warn(`File buffer missing for track ${track.name} during analysis. The file might not have been fully processed yet.`);
              continue;
            }
            // Use a copy of the buffer for decoding, as decodeAudioData can be destructive.
            buffer = await audioContext.decodeAudioData(track.fileBuffer.slice(0));
            decodedAudioBuffers.current.set(track.id, buffer);
          }
          
          const { smartTrimStart, smartTrimEnd } = analyzeTrackBoundaries(buffer, silenceThreshold);
          
          const currentTrackState = track.id.startsWith('underlay-') ? underlayTrack : tracks.find(t => t.id === track.id);

          if (currentTrackState && (currentTrackState.smartTrimStart !== smartTrimStart || currentTrackState.smartTrimEnd !== smartTrimEnd)) {
            updates.set(track.id, { smartTrimStart, smartTrimEnd });
          }
        } catch (err) {
          handleError('error_process_file', { fileName: track.name });
        }
      }

      if (updates.size > 0) {
        setTracks(current => current.map(t => updates.has(t.id) ? { ...t, ...updates.get(t.id) } : t));
        if (underlayTrack && updates.has(underlayTrack.id)) {
          setUnderlayTrack(t => t ? ({...t, ...updates.get(underlayTrack.id)}) : null);
        }
      }
    };

    analyzeAllTracks();
  }, [trimSilenceEnabled, trackIds, underlayId, silenceThreshold, t]);

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
        handleError('error_preview_failed', { fileName: track.name });
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
                // If vocal start is 0, use the general mix duration as a sensible default overlap.
                // This makes the "ducking" feature work out-of-the-box.
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
        length: Math.ceil(sampleRate * (totalDuration + 2)), // Add padding, ensure integer length
        sampleRate: sampleRate,
    });

    const allItems = [...layout, ...underlayLayout];
    
    for (const item of allItems) {
        const isUnderlay = item.track.id.startsWith('underlay-');
        let trackBuffer = decodedAudioBuffers.current.get(item.track.id);
        
        if (!trackBuffer) {
            console.warn(`Buffer for ${item.track.name} not found, decoding now.`);
            if (!item.track.fileBuffer) continue;
             // Use a temporary context for decoding if the main one has a different sample rate
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
        gain.setValueAtTime(0.0, 0);

        if (isUnderlay) {
            source.loop = true;
            gain.setValueAtTime(0.0, item.startTime);
            gain.linearRampToValueAtTime(underlayVolume, item.startTime + 0.1);
            const fadeOutStartTime = item.endTime - mixDuration;
            if (fadeOutStartTime > item.startTime + 0.1) {
                gain.setValueAtTime(underlayVolume, fadeOutStartTime);
            }
            gain.linearRampToValueAtTime(0, item.endTime);
        } else { 
              const mainLayoutIndex = layout.findIndex(l => l.track.id === item.track.id);
              const prevItem = mainLayoutIndex > 0 ? layout[mainLayoutIndex - 1] : null;
              const nextItem = mainLayoutIndex < layout.length - 1 ? layout[mainLayoutIndex + 1] : null;

              const duckedGain = 1 - duckingAmount;
              const fullGain = 1.0;
              const silentGain = 0.0;
              
              let fadeInEndTime = item.startTime;

              if (item.isTalkUpIntro && prevItem && prevItem.endTime > item.startTime) {
                  const duckingEndTime = prevItem.endTime;
                  const rampDuration = Math.min(rampUpDuration, item.startTime + item.playbackDuration - duckingEndTime);
                  const rampUpEndTime = duckingEndTime + rampDuration;
                  
                  gain.setValueAtTime(duckedGain, item.startTime);
                  
                  if (duckingEndTime > item.startTime) gain.setValueAtTime(duckedGain, duckingEndTime);
                 
                  if (rampUpEndTime > duckingEndTime) gain.linearRampToValueAtTime(fullGain, rampUpEndTime);
                  else gain.setValueAtTime(fullGain, duckingEndTime);
                  
                  fadeInEndTime = rampUpEndTime;
              } else if (prevItem && prevItem.track.type === 'music' && item.track.type === 'music') {
                  const rampUpEndTime = item.startTime + mixDuration;
                  gain.setValueAtTime(silentGain, item.startTime);
                  gain.linearRampToValueAtTime(fullGain, rampUpEndTime);
                  fadeInEndTime = rampUpEndTime;
              } else {
                  gain.setValueAtTime(fullGain, item.startTime);
              }

              if (item.track.type === 'music' && nextItem && (nextItem.track.type === 'music' || nextItem.track.type === 'jingle')) {
                  const fadeOutStartTime = Math.max(fadeInEndTime, item.endTime - mixDuration);
                  const fadeOutFinishTime = item.endTime;
                  if (fadeOutFinishTime > fadeOutStartTime) {
                      gain.setValueAtTime(fullGain, fadeOutStartTime);
                      gain.linearRampToValueAtTime(silentGain, fadeOutFinishTime);
                  }
              } else if (!nextItem) {
                  const actualEndTime = item.startTime + item.playbackDuration;
                  const fadeDuration = Math.min(0.5, item.playbackDuration);
                  if (fadeDuration > 0.01) {
                      const fadeOutStartTime = Math.max(fadeInEndTime, actualEndTime - fadeDuration);
                      gain.setValueAtTime(fullGain, fadeOutStartTime);
                      gain.linearRampToValueAtTime(silentGain, actualEndTime);
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
        // The buffer needs to be processed in a new context to apply gain.
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
}, [timelineLayout, duckingAmount, mixDuration, underlayVolume, normalizeOutput, rampUpDuration]);


  const estimatedDuration = timelineLayout.totalDuration;

  const handleMix = async () => {
    if (tracks.length === 0) {
      handleError("error_no_tracks_to_mix");
      return;
    }

    setIsMixing(true);
    setError(null);
    setInfo(null);
    resetMix();

    try {
      const mixedBuffer = await renderMix(44100);
      const wavBlob = encodeWav(mixedBuffer);
      setWavBlobForExport(wavBlob);
      setMixedAudioUrl(URL.createObjectURL(wavBlob));
    } catch (err) {
      handleError('error_mixing_failed');
    } finally {
      setIsMixing(false);
    }
  };

  const handleExportAudio = async (options: ExportOptions) => {
    if (isActuallyExporting || !isPro) return;

    setIsActuallyExporting(true);
    setError(null);
    try {
        const mixedBuffer = await renderMix(options.sampleRate);
        let blob: Blob;
        let extension: string;

        if (options.format === 'mp3') {
            blob = await encodeMp3(mixedBuffer, options.bitrate);
            extension = 'mp3';
        } else { // wav
            blob = encodeWav(mixedBuffer);
            extension = 'wav';
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `final_mix_${timestamp}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        handleError('error_export_failed');
    } finally {
        setIsActuallyExporting(false);
        setIsExportModalOpen(false); // Close modal on completion or error
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
    // Show control if there's an underlay and at least two music tracks to bridge.
    return tracks.filter(t => t.type === 'music').length >= 2;
  }, [tracks, underlayTrack]);
  
  const handleExportProject = async () => {
    if (!wavBlobForExport || !mixedAudioUrl || !isPro) {
        handleError("error_export_first_mix");
        return;
    }

    setIsExporting(true);
    setError(null);
    setInfo(null);

    try {
        const zip = new JSZip();

        // 1. Add final mix
        zip.file("final_mix.wav", wavBlobForExport);

        // 2. Add source files
        const sourceFolder = zip.folder("source_audio");
        if (sourceFolder) {
             const allSourceTracks = [...tracks, underlayTrack].filter((t): t is Track & { fileBuffer: ArrayBuffer } => !!t && !!t.fileBuffer);
             for (const track of allSourceTracks) {
                sourceFolder.file(track.fileName, track.fileBuffer);
             }
        }
       
        // 3. Generate and download zip
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `podcast_project_${timestamp}.zip`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        handleError('error_project_export_failed');
    } finally {
        setIsExporting(false);
    }
  };

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
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
      {isExportModalOpen && isPro && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportAudio}
          isExporting={isActuallyExporting}
        />
      )}
      {isHelpModalOpen && (
        <HelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}
      {localProjectToMigrate && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
             <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 p-6 text-center">
                 <h2 className="text-xl font-bold text-white">{t('migrate_title')}</h2>
                 <p className="text-gray-400 mt-2 mb-6">{t('migrate_subtitle')}</p>
                 <div className="flex justify-center space-x-4">
                    <button onClick={handleIgnoreMigration} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors">{t('migrate_discard')}</button>
                    <button onClick={handleMigrateProject} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors">{t('migrate_import')}</button>
                 </div>
             </div>
         </div>
      )}
      <div className="max-w-7xl mx-auto">
        <Header 
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSaveProject={handleSaveProject}
          isSaving={isSaving}
          hasTracks={tracks.length > 0 || !!underlayTrack}
        />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
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
              normalizeOutput={normalizeOutput}
              onNormalizeOutputChange={(e) => { setNormalizeOutput(e); resetMix(); }}
              onMix={handleMix}
              isMixing={isMixing}
              isExporting={isExporting}
              onExportProject={handleExportProject}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              mixedAudioUrl={mixedAudioUrl}
              isDisabled={!canMix}
              totalDuration={estimatedDuration}
              demoMaxDuration={DEMO_MAX_DURATION_SECONDS}
              hasTracks={tracks.length > 0}
              showDuckingControl={showDuckingControl}
              showUnderlayControl={showUnderlayControl}
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
          {t('footer_version')} 1.3.0 | © {new Date().getFullYear()} CustomRadio.sk
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('sk');

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
        <AppContent />
      </AuthProvider>
    </I18nContext.Provider>
  );
}


export default App;