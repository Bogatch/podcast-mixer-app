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

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-400">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const AppContent: React.FC = () => {
  const { t, setLocale, locale } = useContext(I18nContext);
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
  const [normalizeOutput, setNormalizeOutput] = useState(true);
  const [trimSilenceEnabled, setTrimSilenceEnabled] = useState(true);
  const [silenceThreshold, setSilenceThreshold] = useState(-40);
  const [normalizeTracks, setNormalizeTracks] = useState(true);

  // App UI State
  const [uploadingType, setUploadingType] = useState<'music' | 'spoken' | 'jingle' | 'underlay' | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [mixedAudioBuffer, setMixedAudioBuffer] = useState<AudioBuffer | null>(null);
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
  const [showActivatedPopup, setShowActivatedPopup] = useState(false);
  const wasProRef = useRef(isPro);
  
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);

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
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') === 'true' && sessionStorage.getItem("pm_showPaymentThanks") === "1") {
            setShowThankYouPopup(true);
            sessionStorage.removeItem("pm_showPaymentThanks");
            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
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
    setMixedAudioBuffer(null);
  }, [mixedAudioUrl]);

  const handleError = (key: TranslationKey, params: { [key: string]: string | number } = {}, error?: any) => {
      const baseMessage = t(key, params);
      let finalMessage = baseMessage;

      const errorMessage = error?.message || (typeof error === 'string' ? error : null);

      if (errorMessage) {
          finalMessage = `${baseMessage} | ${t('error_details')} ${errorMessage}`;
      }

      console.error(baseMessage, { errorDetails: error });
      setError(finalMessage);
      setTimeout(() => setError(null), 8000);
  };
  
  const handleInfo = (key: TranslationKey, duration: number = 5000) => {
      const message = t(key);
      setInfo(message);
      setTimeout(() => setInfo(null), 5000);
  }
  
  const handleOpenUnlockModal = (tab: 'buy' | 'enter' = 'buy') => {
    setUnlockModalInitialTab(tab);
    setIsUnlockModalOpen(true);
  };
  
  const decodeAndStoreBuffer = async (track: Track): Promise<void> => {
    if (!track.fileBuffer || decodedAudioBuffers.current.has(track.id)) return;
    try {
        const audioCtx = new AudioContext();
        const buffer = await audioCtx.decodeAudioData(track.fileBuffer.slice(0));
        decodedAudioBuffers.current.set(track.id, buffer);
    } catch (e) {
        console.error(`Failed to decode audio for ${track.name}`, e);
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
          fileType: file.type,
          duration,
          type,
          fileBuffer: arrayBuffer,
          volume: 1.0,
          vocalStartTime: 0,
        };
        await decodeAndStoreBuffer(newTrack);
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
      await decodeAndStoreBuffer(newTrack);
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

      loadedTracks.forEach(decodeAndStoreBuffer);
      setTracks(loadedTracks);

      if (projectData.underlayTrack) {
        const loadedUnderlay = {
          ...projectData.underlayTrack,
          file: projectData.underlayTrack.fileBuffer ? new File([projectData.underlayTrack.fileBuffer], projectData.underlayTrack.fileName, { type: projectData.underlayTrack.fileType || 'audio/mpeg' }) : null,
        };
        decodeAndStoreBuffer(loadedUnderlay);
        setUnderlayTrack(loadedUnderlay);
      } else {
        setUnderlayTrack(null);
      }
      
      if (projectData.mixerSettings) {
        setMixDuration(projectData.mixerSettings.mixDuration ?? 2);
        setAutoCrossfadeEnabled(projectData.mixerSettings.autoCrossfadeEnabled ?? true);
        setDuckingAmount(projectData.mixerSettings.duckingAmount ?? 0.7);
        setRampUpDuration(projectData.mixerSettings.rampUpDuration ?? 1.5);
        setUnderlayVolume(projectData.mixerSettings.underlayVolume ?? 0.5);
        setNormalizeOutput(projectData.mixerSettings.normalizeOutput ?? true);
        setTrimSilenceEnabled(projectData.mixerSettings.trimSilenceEnabled ?? true);
        setSilenceThreshold(projectData.mixerSettings.silenceThreshold ?? -40);
        setNormalizeTracks(projectData.mixerSettings.normalizeTracks ?? true);
      }
      
      resetMix();
  };

  const handleRelinkFile = useCallback(async (trackId: string, file: File) => {
     setError(null);
     setInfo(null);
     try {
        const { duration, arrayBuffer } = await readAudioFile(file);
        
        const updateTrack = (track: Track) => {
             const newTrack = { ...track, file, duration, name: file.name, fileName: file.name, fileBuffer: arrayBuffer, fileType: file.type };
             decodeAndStoreBuffer(newTrack);
             return newTrack;
        };
        
        setTracks(current => current.map(track => track.id === trackId ? updateTrack(track) : track));
        setUnderlayTrack(current => (current && current.id === trackId) ? updateTrack(current) : current);
        
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
                setNormalizeOutput(settings.normalizeOutput ?? true);
                setTrimSilenceEnabled(settings.trimSilenceEnabled ?? true);
                setSilenceThreshold(settings.silenceThreshold ?? -40);
                setNormalizeTracks(settings.normalizeTracks ?? true);
            }
        }
    } catch (e) { console.error("Failed to load settings", e); }
  }, []);

  const mixerSettings = useMemo(() => ({
      mixDuration, autoCrossfadeEnabled, duckingAmount, rampUpDuration, underlayVolume,
      normalizeOutput, trimSilenceEnabled, silenceThreshold, normalizeTracks,
  }), [mixDuration, autoCrossfadeEnabled, duckingAmount, rampUpDuration, underlayVolume,
      normalizeOutput, trimSilenceEnabled, silenceThreshold, normalizeTracks]);

  // Save mixer settings whenever they change
  useEffect(() => {
      try {
          localStorage.setItem('podcastMixerSettings', JSON.stringify(mixerSettings));
      } catch (e) {
          console.error("Failed to save settings", e);
      }
  }, [mixerSettings]);


  const getProjectData = useCallback(() => {
    const stripFile = (t: Track) => {
        const { file, ...rest } = t;
        return rest;
    };
    return {
        projectName: projectName,
        tracks: tracks.map(stripFile),
        underlayTrack: underlayTrack ? stripFile(underlayTrack) : null,
        mixerSettings: mixerSettings
    };
  }, [tracks, underlayTrack, mixerSettings, projectName]);

  const handleSaveProject = async (name: string, idToUpdate?: number) => {
    setIsSaving(true);
    try {
        const project: Omit<SavedProject, 'id' | 'projectData'> & { id?: number, projectData: any } = {
            name,
            createdAt: new Date().toISOString(),
            projectData: {
                ...getProjectData(),
                tracks: tracks.map(t => ({...t, file: undefined })),
                underlayTrack: underlayTrack ? {...underlayTrack, file: undefined} : null,
            }
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
          console.error("Failed to load project from IndexedDB", e);
          handleError('error_project_load_failed', {}, e);
      } finally {
          setIsLoadingProject(false);
      }
  };

    const handleLoadProjectFromFile = async (projectJsonFile: File | undefined, sourceFiles: File[]) => {
        setIsLoadingProject(true);
        try {
            if (!projectJsonFile) {
                handleError('error_project_load_from_file_failed');
                return;
            }

            const projectJsonText = await projectJsonFile.text();
            const projectData = JSON.parse(projectJsonText);

            const fileMap = new Map(sourceFiles.map(f => [f.name, f]));
            const readPromises: Promise<any>[] = [];

            projectData.tracks.forEach((track: any) => {
                const file = fileMap.get(track.fileName);
                if (file) {
                    readPromises.push(readAudioFile(file).then(({ arrayBuffer }) => {
                        track.file = file;
                        track.fileBuffer = arrayBuffer;
                        track.fileType = file.type;
                    }));
                }
            });
            if (projectData.underlayTrack && fileMap.has(projectData.underlayTrack.fileName)) {
                const file = fileMap.get(projectData.underlayTrack.fileName)!;
                 readPromises.push(readAudioFile(file).then(({ arrayBuffer }) => {
                    projectData.underlayTrack.file = file;
                    projectData.underlayTrack.fileBuffer = arrayBuffer;
                    projectData.underlayTrack.fileType = file.type;
                }));
            }

            await Promise.all(readPromises);

            applyLoadedProject(projectData);
            setProjectName(projectData.projectName || t('default_project_name'));
            setProjectId(null);
            handleInfo('info_project_loaded_from_file');
        } catch (e) {
            console.error("Failed to load project from file", e);
            handleError('error_project_load_from_file_failed', {}, e);
        } finally {
            setIsLoadingProject(false);
        }
    };


    const onDeleteTrack = useCallback((id: string) => {
        setTracks(prev => prev.filter(track => track.id !== id));
        decodedAudioBuffers.current.delete(id);
        resetMix();
    }, [resetMix]);

    const onReorderTracks = useCallback((dragIndex: number, hoverIndex: number) => {
        setTracks(prev => {
            const newTracks = [...prev];
            const [draggedItem] = newTracks.splice(dragIndex, 1);
            newTracks.splice(hoverIndex, 0, draggedItem);
            return newTracks;
        });
        resetMix();
    }, [resetMix]);
    
    const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        resetMix();
    }, [resetMix]);

    // Simplified update function for props
    const onUpdateTrackProp = useCallback(<K extends keyof Track>(id: string, prop: K, value: Track[K]) => {
        updateTrack(id, { [prop]: value } as Partial<Track>);
    }, [updateTrack]);

    const onUpdateTrimTimes = useCallback((id: string, times: { start?: number, end?: number }) => {
       updateTrack(id, { smartTrimStart: times.start, smartTrimEnd: times.end });
    }, [updateTrack]);


    const stopPreview = useCallback(() => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        if (analyserNodeRef.current) {
            analyserNodeRef.current.disconnect();
            analyserNodeRef.current = null;
        }
        setPreviewState({ trackId: null, isPlaying: false, currentTime: 0, vuLevel: 0 });
        playbackStartInfoRef.current = null;
    }, []);

    const handlePreview = useCallback(async (trackId: string, startTime: number = 0) => {
        if (previewState.isPlaying && previewState.trackId === trackId) {
            stopPreview();
            return;
        }

        stopPreview();
        const track = [...tracks, underlayTrack].find(t => t && t.id === trackId);
        if (!track || !decodedAudioBuffers.current.has(trackId)) {
            handleError('error_preview_failed', {fileName: track?.name ?? ''});
            return;
        }

        const audioCtx = audioContextRef.current || new AudioContext();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const source = audioCtx.createBufferSource();
        source.buffer = decodedAudioBuffers.current.get(trackId)!;

        const gainNode = audioCtx.createGain();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.6;
        
        source.connect(gainNode);
        gainNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        source.start(0, startTime);
        sourceNodeRef.current = source;
        gainNodeRef.current = gainNode;
        analyserNodeRef.current = analyserNode;
        playbackStartInfoRef.current = { audioContextStartTime: audioCtx.currentTime, trackStartTime: startTime };
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        const updateVU = () => {
            if (!analyserNodeRef.current || !playbackStartInfoRef.current || !audioContextRef.current) return;
            analyserNodeRef.current.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((acc, val) => acc + val, 0);
            const avg = sum / dataArray.length;
            const vuLevel = Math.min(1, avg / 128);
            
            const elapsed = audioContextRef.current.currentTime - playbackStartInfoRef.current.audioContextStartTime;
            const currentTime = playbackStartInfoRef.current.trackStartTime + elapsed;

            setPreviewState({ trackId, isPlaying: true, currentTime, vuLevel });
            animationFrameIdRef.current = requestAnimationFrame(updateVU);
        };
        updateVU();

        source.onended = () => {
            if (sourceNodeRef.current === source) {
                stopPreview();
            }
        };

    }, [tracks, underlayTrack, previewState.isPlaying, previewState.trackId, stopPreview, handleError]);

    const handleCuePlay = useCallback((trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (track && track.vocalStartTime) {
            handlePreview(trackId, track.vocalStartTime);
        }
    }, [tracks, handlePreview]);

    const handleWaveformClick = useCallback((trackId: string, time: number, isShiftClick: boolean) => {
        if (isShiftClick) {
            updateTrack(trackId, { vocalStartTime: time });
        } else {
            handlePreview(trackId, time);
        }
    }, [updateTrack, handlePreview]);

    const hasFiles = useMemo(() => tracks.every(t => t.file) && (!underlayTrack || underlayTrack.file), [tracks, underlayTrack]);

    const { timelineLayout, totalDuration, defaultCrossfadePoints } = useMemo(() => {
        const layout: any[] = [];
        const underlayLayout: any[] = [];
        let currentTime = 0;
        const defaultCrossfadePoints = new Map<string, number>();

        tracks.forEach((track, index) => {
            const nextTrack = tracks[index + 1];
            
            const trimStart = trimSilenceEnabled && (track.type === 'spoken' || track.type === 'jingle') ? track.smartTrimStart || 0 : 0;
            const trimEnd = trimSilenceEnabled && (track.type === 'spoken' || track.type === 'jingle') ? track.smartTrimEnd || track.duration : track.duration;
            const effectiveDuration = trimEnd - trimStart;

            let startTime = currentTime;
            let playOffset = trimStart;
            let playbackDuration = effectiveDuration;

            if (index > 0) {
                const prevTrack = tracks[index - 1];
                if (autoCrossfadeEnabled && prevTrack.type === 'music' && track.type === 'music') {
                    startTime -= mixDuration;
                }
            }
            
            const defaultCrossfadePoint = Math.max(0, track.duration - mixDuration);
            if (track.type === 'music') {
                defaultCrossfadePoints.set(track.id, defaultCrossfadePoint);
            }
            const crossfadePoint = track.manualCrossfadePoint ?? (autoCrossfadeEnabled ? defaultCrossfadePoint : undefined);
            
            let endTime = startTime + effectiveDuration;
            
            if (track.type === 'music' && nextTrack && (nextTrack.type === 'spoken' || nextTrack.type === 'jingle')) {
                const vocalStart = track.vocalStartTime || 0;
                if (vocalStart > 0 && vocalStart < track.duration) {
                    endTime = startTime + vocalStart;
                } else if (crossfadePoint) {
                    endTime = startTime + crossfadePoint;
                }
            }
            
            layout.push({ track, startTime, endTime, playOffset, playbackDuration });
            currentTime = endTime;
        });

        // Basic underlay logic (fills gaps between music)
        if (underlayTrack) {
            const musicTracks = layout.filter(item => item.track.type === 'music');
            for (let i = 0; i < musicTracks.length - 1; i++) {
                const currentMusic = musicTracks[i];
                const nextMusic = musicTracks[i+1];
                const gapStart = currentMusic.endTime;
                const gapEnd = nextMusic.startTime;
                const gapDuration = gapEnd - gapStart;

                if (gapDuration > 0) {
                    const underlayDuration = underlayTrack.duration;
                    let underlayStartTime = 0;
                    
                    const underlayItem = {
                        track: underlayTrack,
                        startTime: gapStart,
                        endTime: gapEnd,
                        playOffset: underlayStartTime % underlayDuration,
                        playbackDuration: gapDuration
                    };
                    underlayLayout.push(underlayItem);
                }
            }
        }
        
        return { timelineLayout: { layout, underlayLayout, totalDuration: currentTime }, totalDuration: currentTime, defaultCrossfadePoints };
    }, [tracks, underlayTrack, mixDuration, autoCrossfadeEnabled, trimSilenceEnabled]);

    const handleMix = async () => {
        if (!isPro && totalDuration > DEMO_MAX_DURATION_SECONDS) {
            handleError('error_demo_duration_limit', { minutes: DEMO_MAX_DURATION_SECONDS / 60 });
            return;
        }
        if (tracks.length === 0) {
            handleError('error_no_tracks_to_mix');
            return;
        }
        
        setIsMixing(true);
        resetMix();

        try {
            const audioCtx = new OfflineAudioContext(2, 44100 * Math.ceil(totalDuration), 44100);
            
            await Promise.all(
              [...timelineLayout.layout, ...timelineLayout.underlayLayout].map(async item => {
                const audioBuffer = decodedAudioBuffers.current.get(item.track.id);
                if (!audioBuffer) return;
                
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                
                const gainNode = audioCtx.createGain();
                gainNode.gain.setValueAtTime(item.track.volume ?? 1.0, 0);

                // Simple crossfade for music -> music
                if (autoCrossfadeEnabled) {
                     const prevItem = timelineLayout.layout.find(l => l.endTime === item.startTime);
                     if(prevItem && prevItem.track.type === 'music' && item.track.type === 'music') {
                        gainNode.gain.setValueAtTime(0, item.startTime);
                        gainNode.gain.linearRampToValueAtTime(1, item.startTime + mixDuration);
                        
                        // Need to find the gainNode of the previous track to fade it out.
                        // This is complex with the current setup. A full mix requires a more integrated approach.
                        // For now, this just fades in.
                     }
                }
                
                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                source.start(item.startTime, item.playOffset, item.playbackDuration);
              })
            );

            const renderedBuffer = await audioCtx.startRendering();
            setMixedAudioBuffer(renderedBuffer);
            const wavBlob = encodeWav(renderedBuffer);
            const url = URL.createObjectURL(wavBlob);
            setMixedAudioUrl(url);

        } catch(e) {
            handleError('error_mixing_failed', {}, e);
        } finally {
            setIsMixing(false);
        }
    };
    
    const handleExportAudio = () => setIsExportModalOpen(true);

    const startExport = async (options: ExportOptions) => {
        if (!mixedAudioBuffer) return;
        setIsExporting(true);
        setExportProgressTitleKey('export_audio_progress_title');
        try {
            let blob: Blob;
            let filename = `${projectName || 'mix'}.${options.format}`;
            if (options.format === 'mp3') {
                blob = await encodeMp3(mixedAudioBuffer, options.bitrate, setExportProgress);
            } else {
                setExportProgress(50);
                blob = encodeWav(mixedAudioBuffer);
                setExportProgress(100);
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) {
            handleError('error_export_failed', {}, e);
        } finally {
            setIsExporting(false);
            setIsExportModalOpen(false);
            setExportProgress(0);
        }
    };

    const handleExportProject = async () => {
         if (!mixedAudioUrl) {
            handleError('error_export_first_mix');
            return;
        }
        setIsExporting(true);
        setExportProgressTitleKey('export_progress_title');
        setExportProgress(10);
        try {
            const zip = new JSZip();
            const projectData = getProjectData();
            zip.file("project.json", JSON.stringify(projectData, null, 2));
            setExportProgress(30);

            const sourceFilesFolder = zip.folder("source_files");
            if (sourceFilesFolder) {
                [...tracks, underlayTrack].forEach(track => {
                    if (track?.fileBuffer) {
                        sourceFilesFolder.file(track.fileName, track.fileBuffer);
                    }
                });
            }
            setExportProgress(60);

            const response = await fetch(mixedAudioUrl);
            const blob = await response.blob();
            zip.file(`${projectName || 'mix'}.wav`, blob);
            setExportProgress(80);

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName || 'project'}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportProgress(100);

        } catch (e) {
            handleError('error_project_export_failed', {}, e);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 safe-top safe-bottom">
      <StripeReturnBanner />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <Header onOpenUnlockModal={handleOpenUnlockModal} />
        
        {error && <div className="bg-red-800/50 border border-red-600/50 text-red-200 p-4 rounded-lg text-sm">{error}</div>}
        {info && <div className="bg-blue-800/50 border border-blue-600/50 text-blue-200 p-4 rounded-lg text-sm">{info}</div>}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <TrackUploader 
              onFilesSelect={addTracks} 
              onUnderlaySelect={addUnderlay} 
              uploadingType={uploadingType}
              isMixing={isMixing}
            />
            <MixerControls 
                mixDuration={mixDuration} onMixDurationChange={setMixDuration}
                autoCrossfadeEnabled={autoCrossfadeEnabled} onAutoCrossfadeChange={setAutoCrossfadeEnabled}
                duckingAmount={duckingAmount} onDuckingAmountChange={setDuckingAmount}
                rampUpDuration={rampUpDuration} onRampUpDurationChange={setRampUpDuration}
                underlayVolume={underlayVolume} onUnderlayVolumeChange={setUnderlayVolume}
                trimSilenceEnabled={trimSilenceEnabled} onTrimSilenceChange={setTrimSilenceEnabled}
                silenceThreshold={silenceThreshold} onSilenceThresholdChange={setSilenceThreshold}
                normalizeTracks={normalizeTracks} onNormalizeTracksChange={setNormalizeTracks}
                normalizeOutput={normalizeOutput} onNormalizeOutputChange={setNormalizeOutput}
                onMix={handleMix}
                isDisabled={!hasFiles || isMixing}
                isMixing={isMixing}
                onOpenUnlockModal={handleOpenUnlockModal}
                onExportAudio={handleExportAudio}
                onExportProject={handleExportProject}
                onSaveProject={() => setIsSaveModalOpen(true)}
                isSaving={isSaving}
                mixedAudioUrl={mixedAudioUrl}
                totalDuration={totalDuration}
                demoMaxDuration={DEMO_MAX_DURATION_SECONDS}
                showDuckingControl={tracks.some(t => t.type === 'spoken') && tracks.some(t => t.type === 'music')}
                showUnderlayControl={!!underlayTrack}
            />
          </aside>

          <section className="lg:col-span-2 space-y-6">
            {tracks.length > 0 || underlayTrack ? (
              <>
                <MonitoringPanel
                    tracks={tracks}
                    underlayTrack={underlayTrack}
                    onReorderTracks={onReorderTracks}
                    onDeleteTrack={onDeleteTrack}
                    onDeleteUnderlay={deleteUnderlay}
                    onUpdateVocalStartTime={(id, time) => onUpdateTrackProp(id, 'vocalStartTime', time)}
                    onUpdateManualCrossfadePoint={(id, time) => onUpdateTrackProp(id, 'manualCrossfadePoint', time)}
                    onUpdateTrackVolume={(id, volume) => onUpdateTrackProp(id, 'volume', volume)}
                    onUpdateTrimTimes={onUpdateTrimTimes}
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
                <Timeline timelineLayout={timelineLayout} />
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </main>
        <footer className="text-center text-gray-600 text-sm pt-4 border-t border-gray-800">
           <p>Podcast Mixer Studio &copy; {new Date().getFullYear()} CustomRadio.sk</p>
           <button onClick={() => setIsHelpModalOpen(true)} className="mt-2 text-teal-400 hover:text-teal-300 transition-colors flex items-center justify-center gap-2 mx-auto">
               <QuestionMarkCircleIcon className="w-5 h-5" />
               <span>{t('show_help_guide')}</span>
           </button>
        </footer>
      </div>
      
      {isReordering && <ReorderModal tracks={tracks} onClose={() => setIsReordering(false)} onSave={(newTracks) => { setTracks(newTracks); setIsReordering(false); resetMix(); }} />}
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} onExport={startExport} isExporting={isExporting} />}
      {isUnlockModalOpen && <UnlockModal onClose={() => setIsUnlockModalOpen(false)} initialTab={unlockModalInitialTab} />}
      {isSaveModalOpen && <SaveProjectModal onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveProject} onLoad={handleLoadProject} onLoadFromFile={handleLoadProjectFromFile} isSaving={isSaving} isLoadingProject={isLoadingProject} currentProjectName={projectName} currentProjectId={projectId} />}
      {(isExporting || isMixing) && <ExportProgressModal progress={isMixing ? 50 : exportProgress} titleKey={isMixing ? 'output_processing' : exportProgressTitleKey} />}

      <CenterPopup
          open={showThankYouPopup}
          onClose={() => setShowThankYouPopup(false)}
          title={t('popup_stripe_title_new')}
          icon={<SuccessIcon />}
          message={
              <div className="space-y-3">
                  <p>{t('popup_stripe_message_new_1')} <strong className="text-white">{t('popup_stripe_message_new_spam')}</strong> {t('popup_stripe_message_new_or')} <strong className="text-white">{t('popup_stripe_message_new_promo')}</strong>.</p>
                  <p>{t('popup_stripe_message_new_contact')} <a href="mailto:support@customradio.sk" className="text-teal-400 hover:underline">support@customradio.sk</a>.</p>
              </div>
          }
      />

       <CenterPopup
          open={showActivatedPopup}
          onClose={() => setShowActivatedPopup(false)}
          autoCloseMs={5000}
          title={t('popup_activated_title_new')}
          icon={<SuccessIcon />}
          message={
            <div>
              <p>{t('popup_activated_message_new')}</p>
              {proUser?.activationsLeft !== null && <p className="text-sm mt-2 text-gray-400">{t('popup_activations_remaining_text', { count: proUser?.activationsLeft ?? 0 })}</p>}
            </div>
          }
      />
    </div>
  );
};

const App: React.FC = () => {
    const [locale, setLocale] = useState<Locale>(() => {
        const browserLang = navigator.language.split('-')[0];
        const savedLocale = localStorage.getItem('podcastMixerLocale');
        if (savedLocale && translations[savedLocale as Locale]) {
            return savedLocale as Locale;
        }
        return browserLang === 'sk' ? 'sk' : 'en';
    });

    useEffect(() => {
        localStorage.setItem('podcastMixerLocale', locale);
    }, [locale]);
    
    const t = useCallback((key: TranslationKey, params: { [key: string]: string | number } = {}): string => {
        let translation = translations[locale][key] || translations.en[key] || key;
        Object.keys(params).forEach(p => {
            translation = translation.replace(`{{${p}}}`, String(params[p]));
        });
        return translation;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ t, locale, setLocale }}>
          <ProProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
          </ProProvider>
        </I18nContext.Provider>
    );
};

export default App;
