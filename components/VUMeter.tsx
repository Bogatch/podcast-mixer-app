import React from 'react';

const SEGMENTS = [
  // 8 Green segments
  { threshold: 0.10, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.20, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.30, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.40, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.50, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.60, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.70, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  { threshold: 0.78, color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  // 2 Yellow segments
  { threshold: 0.85, color: 'bg-yellow-400', shadow: 'shadow-yellow-400/60' },
  { threshold: 0.92, color: 'bg-yellow-400', shadow: 'shadow-yellow-400/60' },
  // 2 Red segments
  { threshold: 0.96, color: 'bg-red-500', shadow: 'shadow-red-500/60' },
  { threshold: 0.99, color: 'bg-red-500', shadow: 'shadow-red-500/60' },
];

const Channel: React.FC<{ level: number }> = ({ level }) => (
    <div className="flex w-full items-center gap-1">
        {SEGMENTS.map((seg, i) => (
            <div
                key={i}
                className={`h-4 flex-1 rounded-sm transition-colors duration-75 ${
                    level >= seg.threshold
                        ? `${seg.color} shadow-[0_0_8px_0px_var(--tw-shadow-color)] ${seg.shadow}`
                        : 'bg-gray-700/50'
                }`}
            />
        ))}
    </div>
);

export const VUMeter: React.FC<{ level: number }> = ({ level }) => {
    return (
        <div className="w-full space-y-1 rounded-md border border-gray-600 bg-gray-900/70 p-2">
            <Channel level={level} />
            <Channel level={level} />
        </div>
    );
};