import React, { useRef, useContext, useState, useEffect } from 'react';
import type { Track } from '../types';
import { TrashIcon, MusicNoteIcon, UserIcon, MarkerPinIcon, PlayIcon, PauseIcon, DragHandleIcon, BellIcon, UploadIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface TrackControllerProps {
  track: Track;
  index: number;
  onDelete: () => void;
  onVocalStartTimeChange: (time: number) => void;
  onPreview: () => void;
  isPreviewing: boolean;
  onRelinkFile: (file: File) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
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
  music: { bg: '#F472B6', icon: 'text-black/70' },
  spoken: { bg: '#34D399', icon: 'text-black/70' },
  jingle: { bg: '#A78BFA', icon: 'text-black/70' }
};

export const TrackController: React.FC<TrackControllerProps> = ({
  track,
  onDelete,
  onVocalStartTimeChange,
  onPreview,
  isPreviewing,
  onRelinkFile,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
}) => {
  const { t } = useContext(I18nContext);
  const [vocalStartTimeInput, setVocalStartTimeInput] = useState(track.vocalStartTime?.toFixed(2) || '0.00');
  const trackColor = COLORS[track.type];
  const Icon = ICONS[track.type];
  const relinkInputRef = useRef<HTMLInputElement>(null);
  const vocalTimeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== vocalTimeInputRef.current) {
      setVocalStartTimeInput(track.vocalStartTime?.toFixed(2) ?? '0.00');
    }
  }, [track.vocalStartTime]);


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
    commitVocalTimeChange();
  };

  const handleVocalTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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

  return (
    <div
      className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 space-y-3 overflow-hidden cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <div className="flex items-start">
        <div className="flex items-center space-x-3 flex-grow min-w-0">
           <span className="flex-shrink-0" title={t('track_drag_handle_title')}>
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
        <div className="flex items-center ml-4">
          <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
            <TrashIcon className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {track.type === 'music' && (
        <div className="space-y-2 pt-2 border-t border-gray-600/50">
          <label htmlFor={`vocal-start-${track.id}`} className="flex items-center text-sm font-medium text-gray-400">
            <MarkerPinIcon className="w-4 h-4 mr-2 text-red-400" />
            {t('track_vocal_start_label')}
          </label>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={onPreview} className="p-2 rounded-full hover:bg-gray-600 transition-colors flex-shrink-0">
              {isPreviewing ? <PauseIcon className="w-5 h-5 text-red-400" /> : <PlayIcon className="w-5 h-5 text-gray-300" />}
            </button>
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
      )}
    </div>
  );
};