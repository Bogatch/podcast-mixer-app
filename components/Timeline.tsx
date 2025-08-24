import React, { useContext } from 'react';
import type { Track } from '../types';
import { I18nContext } from '../lib/i18n';

interface TimelineLayoutItem {
  track: Track;
  startTime: number;
  endTime: number; // This is the positioning end time
  playOffset: number;
  playbackDuration: number;
  isTalkUpIntro?: boolean;
}

interface TimelineProps {
  timelineLayout: { 
    layout: TimelineLayoutItem[], 
    underlayLayout: TimelineLayoutItem[],
    totalDuration: number 
  };
}

const COLORS = {
  music: '#F472B6',
  spoken: '#34D399',
  jingle: '#A78BFA',
  underlay: '#FBBF24',
};

export const Timeline: React.FC<TimelineProps> = ({ timelineLayout }) => {
  const { t } = useContext(I18nContext);
  const { layout, underlayLayout, totalDuration } = timelineLayout;

  if (layout.length === 0 && underlayLayout.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2 text-gray-400">{t('timeline_title')}</h3>
        <div className="w-full h-32 bg-gray-700/50 rounded-lg flex items-center justify-center">
          <p className="text-sm text-gray-500">{t('timeline_waiting')}</p>
        </div>
      </div>
    );
  }

  if (totalDuration <= 0) return null;

  const renderTrackItem = (item: TimelineLayoutItem, yPos: string, color: string) => {
    const { track, startTime, endTime, playbackDuration } = item;
    
    if (playbackDuration <= 0) return null;

    const leftPercent = (startTime / totalDuration) * 100;
    const fullBlockWidthPercent = (playbackDuration / totalDuration) * 100;
    
    const positioningDuration = endTime - startTime;
    const mainBlockWidthRatio = positioningDuration / playbackDuration;

    return (
      <div
        key={`${track.id}-${startTime}`} // Add startTime to key for underlay segments
        className="absolute h-1/3"
        style={{
          left: `${leftPercent}%`,
          width: `${fullBlockWidthPercent}%`,
          top: yPos,
          transition: 'all 0.3s ease-in-out'
        }}
        title={t('timeline_track_title', { trackName: track.name, startTime: startTime.toFixed(1) })}
      >
        <div 
          className="absolute h-full flex items-center justify-center border-l-2 border-r-2 border-gray-900/50 rounded"
          style={{ 
              backgroundColor: color,
              width: `${mainBlockWidthRatio * 100}%`
          }}
        >
           <span className="text-xs font-bold text-black/70 truncate px-2">{track.name}</span>
        </div>
        {/* Render tail if playback is longer than positioning */}
        {mainBlockWidthRatio < 1 &&
             <div
                className="absolute h-full rounded-r"
                style={{
                    backgroundColor: color,
                    opacity: 0.4,
                    left: `${mainBlockWidthRatio * 100}%`,
                    right: 0
                }}
                title={t('timeline_reverb_title', { duration: (playbackDuration - positioningDuration).toFixed(1) })}
             ></div>
        }
      </div>
    );
  };

  const hasTrimmedTracks = layout.some(item => (item.endTime - item.startTime) < item.playbackDuration);

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold mb-3 text-gray-400">{t('timeline_title')}</h3>
      <div className="relative w-full h-36 bg-gray-700/50 rounded-lg overflow-hidden">
        {layout.map(item => {
          if (item.track.type === 'music') {
            return renderTrackItem(item, '0%', COLORS.music);
          }
          return null;
        })}
        {layout.map(item => {
          if (item.track.type === 'spoken' || item.track.type === 'jingle') {
            const color = item.track.type === 'jingle' ? COLORS.jingle : COLORS.spoken;
            return renderTrackItem(item, '33.33%', color);
          }
          return null;
        })}
        {underlayLayout.map(item => {
          return renderTrackItem(item, '66.67%', COLORS.underlay);
        })}
      </div>
       <div className="flex justify-between flex-wrap text-xs text-gray-500 mt-1 px-1">
          <div className="flex items-center space-x-2 mr-4"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.music}}></div><span>{t('timeline_legend_music')}</span></div>
          <div className="flex items-center space-x-2 mr-4"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.spoken}}></div><span>{t('timeline_legend_spoken')}</span></div>
          <div className="flex items-center space-x-2 mr-4"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.jingle}}></div><span>{t('timeline_legend_jingle')}</span></div>
          <div className="flex items-center space-x-2 mr-4"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.underlay}}></div><span>{t('timeline_legend_underlay')}</span></div>
          {hasTrimmedTracks && <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-gray-500/40"></div><span>{t('timeline_legend_reverb')}</span></div>}
      </div>
    </div>
  );
};