import React, { useState, useRef, useContext } from 'react';
import type { Track } from '../types';
import { DragHandleIcon, MusicNoteIcon, UserIcon, BellIcon, ChevronUpIcon, ChevronDownIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface ReorderModalProps {
  tracks: Track[];
  onClose: () => void;
  onSave: (tracks: Track[]) => void;
}

const ICONS = {
    music: MusicNoteIcon,
    spoken: UserIcon,
    jingle: BellIcon,
}

const ReorderableTrackItem: React.FC<{
  track: Track;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ track, index, total, onMove, ...dragProps }) => {
    const { t } = useContext(I18nContext);
    const Icon = ICONS[track.type];

    return (
        <div 
          className="flex items-center bg-gray-700 p-3 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing"
          draggable
          {...dragProps}
        >
            <DragHandleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 mx-3">
                <Icon className={`w-5 h-5 text-gray-300`} />
            </div>
            <p className="flex-grow font-medium text-gray-200 break-all">{track.name}</p>
            <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                <button 
                  onClick={() => onMove(index, 0)}
                  disabled={index === 0}
                  className="p-2 rounded-md hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('reorder_move_top')}
                >
                  <ChevronDoubleUpIcon className="w-5 h-5 text-gray-300" />
                </button>
                 <button 
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  className="p-2 rounded-md hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('reorder_move_up')}
                >
                  <ChevronUpIcon className="w-5 h-5 text-gray-300" />
                </button>
                 <button 
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === total - 1}
                  className="p-2 rounded-md hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('reorder_move_down')}
                >
                  <ChevronDownIcon className="w-5 h-5 text-gray-300" />
                </button>
                 <button 
                  onClick={() => onMove(index, total - 1)}
                  disabled={index === total - 1}
                  className="p-2 rounded-md hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('reorder_move_bottom')}
                >
                  <ChevronDoubleDownIcon className="w-5 h-5 text-gray-300" />
                </button>
            </div>
        </div>
    );
};

export const ReorderModal: React.FC<ReorderModalProps> = ({ tracks, onClose, onSave }) => {
  const { t } = useContext(I18nContext);
  const [orderedTracks, setOrderedTracks] = useState<Track[]>([...tracks]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const moveTrack = (fromIndex: number, toIndex: number) => {
    const newTracks = [...orderedTracks];
    if (toIndex < 0 || toIndex >= newTracks.length) return;
    const [item] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, item);
    setOrderedTracks(newTracks);
  };
  
  const handleDragSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      moveTrack(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSave = () => {
    onSave(orderedTracks);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t('reorder_title')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('reorder_subtitle')}</p>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto bg-gray-900">
            {orderedTracks.map((track, index) => (
                <ReorderableTrackItem 
                    key={track.id}
                    track={track}
                    index={index}
                    total={orderedTracks.length}
                    onMove={moveTrack}
                    onDragStart={() => dragItem.current = index}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleDragSort}
                    onDragOver={(e) => e.preventDefault()}
                />
            ))}
        </div>
        <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-end space-x-4">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 border border-gray-500 hover:bg-gray-500 text-gray-200 font-semibold rounded-md transition-colors"
            >
                {t('cancel')}
            </button>
            <button
                onClick={handleSave}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-md transition-colors"
            >
                {t('save_and_close')}
            </button>
        </div>
      </div>
    </div>
  );
};