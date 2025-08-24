import React, { useRef, useContext } from 'react';
import type { Track } from '../types';
import { TrackController } from './TrackController';
import { TrashIcon, UploadIcon, WaveformIcon, ArrowsUpDownIcon } from './icons';
import { I18nContext } from '../lib/i18n';


interface MonitoringPanelProps {
  tracks: Track[];
  underlayTrack: Track | null;
  onReorderTracks: (dragIndex: number, hoverIndex: number) => void;
  onDeleteTrack: (id: string) => void;
  onDeleteUnderlay: () => void;
  onUpdateVocalStartTime: (id: string, time: number) => void;
  onPreview: (trackId: string) => void;
  onRelinkFile: (trackId: string, file: File) => void;
  previewingTrackId: string | null;
  onToggleReorder: () => void;
}

const StaticTrackItem: React.FC<{
    track: Track, 
    onDelete: () => void, 
    onRelinkFile: (trackId: string, file: File) => void,
    icon: React.ReactNode, 
    color: string
}> = ({ track, onDelete, onRelinkFile, icon, color}) => {
    const { t } = useContext(I18nContext);
    const relinkInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onRelinkFile(track.id, e.target.files[0]);
        }
    }

    if (!track.file) {
        return (
             <div className="bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/50 flex items-center w-full">
                <input type="file" ref={relinkInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                <div className="flex items-center space-x-3 flex-grow min-w-0">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
                        {icon}
                     </div>
                     <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-yellow-300 break-all" title={track.fileName}>{t('track_missing_file')}: {track.fileName}</p>
                     </div>
                </div>
                <div className="flex items-center ml-4 space-x-2">
                    <button onClick={() => relinkInputRef.current?.click()} className="p-2 rounded-md bg-yellow-600/30 hover:bg-yellow-600/50 transition-colors">
                        <UploadIcon className="w-4 h-4 text-yellow-300" />
                    </button>
                    <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
                        <TrashIcon className="w-4 h-4 text-red-400" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 flex items-center w-full">
            <div className="flex items-center space-x-3 flex-grow min-w-0">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                    {icon}
                 </div>
                 <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-200 break-all" title={track.name}>{track.name}</p>
                 </div>
            </div>
            <div className="flex items-center ml-4">
              <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
                <TrashIcon className="w-4 h-4 text-red-400" />
              </button>
            </div>
        </div>
    )
}


export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ 
    tracks,
    underlayTrack,
    onReorderTracks,
    onDeleteTrack,
    onDeleteUnderlay,
    onUpdateVocalStartTime,
    onPreview,
    onRelinkFile,
    previewingTrackId,
    onToggleReorder,
}) => {
  const { t } = useContext(I18nContext);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        onReorderTracks(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">{t('monitoring_title')}</h2>
        {tracks.length > 1 && (
            <button
                onClick={onToggleReorder}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
                title={t('monitoring_reorder_title')}
            >
                <ArrowsUpDownIcon className="w-5 h-5"/>
                <span className="hidden sm:inline">{t('monitoring_reorder_button')}</span>
            </button>
        )}
      </div>
      <div className="space-y-3">
        {tracks.map((track, index) => (
          <TrackController
            key={track.id}
            track={track}
            index={index}
            onDelete={() => onDeleteTrack(track.id)}
            onVocalStartTimeChange={(time) => onUpdateVocalStartTime(track.id, time)}
            onPreview={() => onPreview(track.id)}
            isPreviewing={previewingTrackId === track.id}
            onRelinkFile={(file) => onRelinkFile(track.id, file)}
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleDragSort}
            onDragOver={(e) => e.preventDefault()}
          />
        ))}
      </div>
      {underlayTrack && (
        <div className="space-y-2 pt-4 mt-4 border-t border-gray-700">
            <h3 className="text-md font-semibold text-gray-400">{t('monitoring_underlay_title')}</h3>
             <StaticTrackItem 
                track={underlayTrack}
                onDelete={onDeleteUnderlay}
                onRelinkFile={onRelinkFile}
                icon={<WaveformIcon className="w-5 h-5 text-black/70" />}
                color="#FBBF24"
             />
        </div>
      )}
    </div>
  );
};