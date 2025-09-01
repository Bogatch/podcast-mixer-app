import React, { useRef, useContext, useState, useEffect } from 'react';
import type { Track } from '../types';
import { TrashIcon, MusicNoteIcon, UserIcon, MarkerPinIcon, PlayIcon, PauseIcon, DragHandleIcon, BellIcon, UploadIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { Waveform } from './Waveform';
import { VUMeter } from './VUMeter';

interface TrackControllerProps {
  track: Track;
  index: number;
  onDelete: () => void;
  onVocalStartTimeChange: (time: number) => void;
  onManualCrossfadeChange: (time: number | undefined) => void;
  onUpdateTrackVolume: (volume: number) => void;
  onTrimTimeChange: (times: { start?: number; end?: number }) => void;
  onPreview: () => void;
  onCuePlay: () => void;
  onWaveformClick: (trackId: string, time: number, isShiftClick: boolean) => void;
  previewState: { trackId: string | null; isPlaying: boolean; currentTime: number; vuLevel: number; };
  onRelinkFile: (file: File) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  audioBuffer: AudioBuffer | undefined;
  autoCrossfadeEnabled: boolean;
  defaultCrossfadePoint?: number;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ICONS = {
    music: MusicNoteIcon,
    spoken: UserIcon,
    jingle: BellIcon,
}

const COLORS = {
  music: { bg: '#0EA5E9', icon: 'text-black/70' },
  spoken: { bg: '#34D399', icon: 'text-black/70' },
  jingle: { bg: '#A78BFA', icon: 'text-black/70' }
};

export const TrackController: React.FC<TrackControllerProps> = ({
  track,
  onDelete,
  onVocalStartTimeChange,
  onManualCrossfadeChange,
  onUpdateTrackVolume,
  onTrimTimeChange,
  onPreview,
  onCuePlay,
  onWaveformClick,
  previewState,
  onRelinkFile,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
  audioBuffer,
  autoCrossfadeEnabled,
  defaultCrossfadePoint,
}) => {
  const { t } = useContext(I18nContext);
  const [vocalStartTimeInput, setVocalStartTimeInput] = useState(track.vocalStartTime?.toFixed(2) || '0.00');
  const trackColor = COLORS[track.type];
  const Icon = ICONS[track.type];
  const relinkInputRef = useRef<HTMLInputElement>(null);
  const vocalTimeInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const escapePressedRef = useRef(false);
  
  const isPreviewing = previewState.trackId === track.id && previewState.isPlaying;
  const isCueSet = track.type === 'music' && track.vocalStartTime !== undefined && track.vocalStartTime > 0;

  useEffect(() => {
    if (document.activeElement !== vocalTimeInputRef.current) {
      setVocalStartTimeInput(track.vocalStartTime?.toFixed(2) ?? '0.00');
    }
  }, [track.vocalStartTime]);

  useEffect(() => {
    if (waveformContainerRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setWaveformWidth(entries[0].contentRect.width);
            }
        });
        resizeObserver.observe(waveformContainerRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [isExpanded]); // Rerun observer logic when the container becomes visible

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onRelinkFile(e.target.files[0]);
    }
  };

  const handleVocalTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === '' || /^\d*[,.]?\d{0,2}$/.test(value)) {
      setVocalStartTimeInput(value);
    }
  };

  const commitVocalTimeChange = () => {
    const sanitizedValue = vocalStartTimeInput.replace(',', '.');
    let finalValue = parseFloat(sanitizedValue);
    if (isNaN(finalValue) || finalValue < 0) {
      finalValue = 0;
    }
    const clampedValue = Math.min(track.duration, finalValue);
    onVocalStartTimeChange(clampedValue);
    setVocalStartTimeInput(clampedValue.toFixed(2));
  };


  const handleVocalTimeInputBlur = () => {
    if (escapePressedRef.current) {
        escapePressedRef.current = false; // Reset flag and do nothing
        return;
    }
    commitVocalTimeChange();
  };

  const handleVocalTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitVocalTimeChange();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      escapePressedRef.current = true; // Set flag to prevent onBlur from re-committing
      onVocalStartTimeChange(0);
      setVocalStartTimeInput('0.00');
      e.currentTarget.blur();
    }
  };
  
  const handleVocalTimeAdjust = (amount: number) => {
    const currentValue = parseFloat(vocalStartTimeInput.replace(',', '.')) || track.vocalStartTime || 0;
    const newValue = currentValue + amount;
    const clampedValue = Math.max(0, Math.min(track.duration, newValue));
    onVocalStartTimeChange(clampedValue);
    setVocalStartTimeInput(clampedValue.toFixed(2));
  };
  
  const handleLocalWaveformClick = (time: number, modifiers: { altKey: boolean; shiftKey: boolean }) => {
    if (modifiers.altKey) {
        onManualCrossfadeChange(time);
    } else {
        onWaveformClick(track.id, time, modifiers.shiftKey);
    }
  };
  
  const handleTrimChange = (times: { start?: number; end?: number }) => {
    onTrimTimeChange(times);
  };


  if (!track.file) {
    return (
        <div className="bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/50 space-y-3">
             <input type="file" ref={relinkInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
             <div className="flex items-start">
                 <div className="flex items-center space-x-3 flex-grow min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
                        <Icon className={`w-5 h-5 ${trackColor.icon}`} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-yellow-300">{t('track_missing_file')}</p>
                        <p className="text-xs text-yellow-500 break-all">{track.fileName}</p>
                    </div>
                </div>
                 <div className="flex items-center ml-4">
                    <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
                        <TrashIcon className="w-4 h-4 text-red-400" />
                    </button>
                </div>
             </div>
             <button
                onClick={() => relinkInputRef.current?.click()}
                className="w-full flex items-center justify-center text-sm py-2 px-3 bg-yellow-600/50 hover:bg-yellow-600/70 text-yellow-100 font-semibold rounded-md transition-colors"
             >
                <UploadIcon className="w-4 h-4 mr-2" />
                {t('track_find_file')}
             </button>
        </div>
    )
  }
  
  const effectiveCrossfadePoint = track.manualCrossfadePoint ?? (autoCrossfadeEnabled ? defaultCrossfadePoint : undefined);

  return (
    <div
      className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 space-y-3 overflow-hidden"
    >
      <div 
        className="flex items-start"
        draggable
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div 
            className="flex items-center space-x-3 flex-grow min-w-0 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
           <span className="flex-shrink-0 cursor-grab" title={t('track_drag_handle_title')}>
            <DragHandleIcon className="w-5 h-5 text-gray-400" />
           </span>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: trackColor.bg }}>
             <Icon className={`w-5 h-5 ${trackColor.icon}`} />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium text-gray-200 break-all" title={track.name}>{track.name}</p>
            <p className="text-xs text-gray-400 font-mono">{formatDuration(track.duration)}</p>
          </div>
        </div>
        <div className="flex items-center ml-4 space-x-2">
           <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600/50 hover:bg-gray-600 text-xs font-semibold text-gray-300 rounded-md transition-colors"
                title={isExpanded ? t('close') : t('track_setup_button')}
            >
                <span>{t('track_setup_button')}</span>
                {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
            <TrashIcon className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {track.type === 'music' ? (
             <div className="space-y-4 pt-3 border-t border-gray-600/50">
                {audioBuffer && (
                    <div className="space-y-1">
                        <div ref={waveformContainerRef} className="bg-gray-900/50 p-1 rounded-md cursor-pointer">
                            {waveformWidth > 0 && <Waveform 
                                audioBuffer={audioBuffer} 
                                width={waveformWidth}
                                height={60}
                                color={trackColor.bg}
                                trimStart={track.smartTrimStart}
                                trimEnd={track.smartTrimEnd}
                                vocalStartTime={track.vocalStartTime}
                                manualCrossfadePoint={track.manualCrossfadePoint}
                                autoCrossfadeEnabled={autoCrossfadeEnabled}
                                defaultCrossfadePoint={defaultCrossfadePoint}
                                playheadTime={previewState.trackId === track.id ? previewState.currentTime : undefined}
                                onWaveformClick={handleLocalWaveformClick}
                                onTrimTimeChange={handleTrimChange}
                                onSetCrossfadePoint={onManualCrossfadeChange}
                            />}
                        </div>
                        <div className="text-xs text-gray-500 text-center px-2 pt-2">
                            <strong className="text-gray-400">{t('track_waveform_help_tip')}</strong>
                            {' '}
                            {t('track_waveform_help_shift')}{' '}
                            (<span className="font-semibold text-red-400">{t('track_waveform_help_red')}</span>).
                            {' '}
                            {t('track_waveform_help_alt')}{' '}
                            (<span className="font-semibold text-green-400">{t('track_waveform_help_green')}</span>).
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-4">
                    {/* Player Buttons */}
                    <div className="flex-shrink-0 flex items-center justify-start gap-3">
                        <button 
                            onClick={onPreview}
                            className={`w-32 h-12 flex items-center justify-center font-bold text-base rounded-lg border-2 transition-colors ${
                                isPreviewing
                                    ? 'bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(49,196,141,0.7)]'
                                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                            }`}
                        >
                            START&nbsp;/&nbsp;STOP
                        </button>
                        <button 
                            onClick={onCuePlay}
                            disabled={!isCueSet}
                            className={`w-24 h-12 flex items-center justify-center font-bold text-base rounded-lg border-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isCueSet && !isPreviewing
                                    ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                                    : isCueSet && isPreviewing
                                    ? 'bg-red-700 border-red-600 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-500'
                            }`}
                        >
                            CUE
                        </button>
                    </div>

                    {/* VU Meter */}
                    <div className="w-52 flex-shrink-0">
                        <VUMeter level={isPreviewing ? previewState.vuLevel : 0} />
                    </div>

                    {/* Volume Slider */}
                    <div className="flex-grow space-y-1">
                        <label htmlFor={`volume-${track.id}`} className="text-sm font-medium text-gray-400">{t('track_volume_label')}</label>
                        <div className="flex items-center gap-3">
                            <input
                                id={`volume-${track.id}`}
                                type="range"
                                min="0" max="1.5" step="0.01"
                                value={track.volume ?? 1}
                                onChange={(e) => onUpdateTrackVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                            <span className="w-16 text-center font-mono text-sky-400">{((track.volume ?? 1) * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <label htmlFor={`vocal-start-${track.id}`} className="flex items-center text-sm font-medium text-gray-400">
                        <MarkerPinIcon className="w-4 h-4 mr-2 text-red-400" />
                        {t('track_vocal_start_label')}
                    </label>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="relative w-full flex items-center">
                            <input
                                id={`vocal-start-range-${track.id}`}
                                type="range"
                                min="0"
                                max={track.duration}
                                step="0.1"
                                value={track.vocalStartTime}
                                onChange={(e) => onVocalStartTimeChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            {effectiveCrossfadePoint && effectiveCrossfadePoint > 0 && (
                                <div 
                                    className="absolute w-2.5 h-2.5 bg-green-400 rounded-full pointer-events-none"
                                    style={{ 
                                    left: `calc(${(effectiveCrossfadePoint / track.duration) * 100}% - 5px)`,
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                    }}
                                    title={`${track.manualCrossfadePoint ? t('track_crossfade_marker_title') : t('track_autocrossfade_marker_title')}: ${effectiveCrossfadePoint.toFixed(1)}s`}
                                />
                            )}
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            <input
                                id={`vocal-start-${track.id}`}
                                ref={vocalTimeInputRef}
                                type="text"
                                value={vocalStartTimeInput}
                                onFocus={(e) => e.target.select()}
                                onChange={handleVocalTimeInputChange}
                                onBlur={handleVocalTimeInputBlur}
                                onKeyDown={handleVocalTimeInputKeyDown}
                                className="w-20 bg-gray-800/60 text-red-400 font-mono text-sm sm:text-base text-center py-1 rounded-l-md border-y border-l border-gray-600 focus:ring-red-500 focus:border-red-500 focus:z-10 relative"
                            />
                            <div className="flex flex-col -ml-px">
                                <button
                                    type="button"
                                    onClick={() => handleVocalTimeAdjust(0.1)}
                                    className="p-1 bg-gray-700 hover:bg-gray-600 border-t border-r border-b border-gray-600 rounded-tr-md focus:z-10"
                                    aria-label={t('track_vocal_start_increase')}
                                >
                                    <ChevronUpIcon className="w-3 h-3 text-gray-300" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleVocalTimeAdjust(-0.1)}
                                    className="p-1 bg-gray-700 hover:bg-gray-600 border-b border-r border-gray-600 rounded-br-md focus:z-10"
                                    aria-label={t('track_vocal_start_decrease')}
                                >
                                    <ChevronDownIcon className="w-3 h-3 text-gray-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {typeof track.manualCrossfadePoint === 'number' && !isNaN(track.manualCrossfadePoint) && (
                    <div className="flex items-center justify-between bg-gray-800/60 p-2 rounded-md">
                        <p className="text-sm text-gray-300">
                            {t('track_manual_crossfade_at', { time: track.manualCrossfadePoint.toFixed(2) })}
                        </p>
                        <button
                            onClick={() => onManualCrossfadeChange(undefined)}
                            className="px-3 py-1 text-xs font-semibold text-red-300 bg-red-500/20 hover:bg-red-500/40 rounded-md transition-colors"
                        >
                            {t('track_manual_crossfade_remove')}
                        </button>
                    </div>
                )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4 pt-3 border-t border-gray-600/50">
                 <button onClick={onPreview} className="p-2 rounded-full hover:bg-gray-600 transition-colors flex-shrink-0">
                  {isPreviewing ? <PauseIcon className="w-5 h-5 text-red-400" /> : <PlayIcon className="w-5 h-5 text-gray-300" />}
                </button>
                <p className="text-sm text-gray-500">{t('track_preview_only')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};