import React, { useRef, useEffect, useState } from 'react';

interface WaveformProps {
  audioBuffer: AudioBuffer;
  width: number;
  height: number;
  color: string;
  trimStart?: number;
  trimEnd?: number;
  vocalStartTime?: number;
  manualCrossfadePoint?: number;
  autoCrossfadeEnabled?: boolean;
  defaultCrossfadePoint?: number;
  playheadTime?: number;
  onWaveformClick?: (time: number, modifiers: { altKey: boolean; shiftKey: boolean }) => void;
  onTrimTimeChange?: (times: { start?: number; end?: number }) => void;
  onSetCrossfadePoint?: (time: number | undefined) => void;
}

const HANDLE_SIZE = 8;
const HANDLE_COLOR = 'rgba(255, 255, 255, 0.7)';
const HANDLE_HOVER_COLOR = 'rgba(255, 255, 255, 1)';


export const Waveform: React.FC<WaveformProps> = ({ 
    audioBuffer, width, height, color, trimStart, trimEnd, 
    vocalStartTime, manualCrossfadePoint, autoCrossfadeEnabled, defaultCrossfadePoint,
    playheadTime, onWaveformClick, onTrimTimeChange, onSetCrossfadePoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'crossfade' | null>(null);
  const [hoveringHandle, setHoveringHandle] = useState<'start' | 'end' | 'crossfade' | null>(null);

  const timeToX = (time: number) => (time / audioBuffer.duration) * width;
  const xToTime = (x: number) => (x / width) * audioBuffer.duration;

  const crossfadePointValue = manualCrossfadePoint ?? (autoCrossfadeEnabled ? defaultCrossfadePoint : undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const startHandleX = trimStart !== undefined ? timeToX(trimStart) : -Infinity;
        const endHandleX = trimEnd !== undefined ? timeToX(trimEnd) : Infinity;
        const crossfadeX = crossfadePointValue !== undefined ? timeToX(crossfadePointValue) : -Infinity;

        if (onTrimTimeChange && Math.abs(x - startHandleX) <= HANDLE_SIZE / 2) {
            setDraggingHandle('start');
        } else if (onTrimTimeChange && Math.abs(x - endHandleX) <= HANDLE_SIZE / 2) {
            setDraggingHandle('end');
        } else if (onSetCrossfadePoint && crossfadePointValue !== undefined && Math.abs(x - crossfadeX) <= HANDLE_SIZE / 2) {
            setDraggingHandle('crossfade');
            // If it was an auto point, this interaction makes it manual immediately.
            const time = xToTime(x);
            onSetCrossfadePoint(Math.max(0, Math.min(audioBuffer.duration, time)));
        } else if (onWaveformClick) {
            const time = xToTime(x);
            onWaveformClick(Math.max(0, Math.min(audioBuffer.duration, time)), { altKey: e.altKey, shiftKey: e.shiftKey });
        }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (draggingHandle) {
             let newTime = xToTime(x);
             newTime = Math.max(0, Math.min(audioBuffer.duration, newTime));

             if (draggingHandle === 'start' && onTrimTimeChange) {
                 if (trimEnd === undefined || newTime < trimEnd) {
                    onTrimTimeChange({ start: newTime });
                 }
             } else if (draggingHandle === 'end' && onTrimTimeChange) {
                 if (trimStart === undefined || newTime > trimStart) {
                    onTrimTimeChange({ end: newTime });
                 }
             } else if (draggingHandle === 'crossfade' && onSetCrossfadePoint) {
                 onSetCrossfadePoint(newTime);
             }
        } else { // Hover logic
             const startHandleX = trimStart !== undefined ? timeToX(trimStart) : -Infinity;
             const endHandleX = trimEnd !== undefined ? timeToX(trimEnd) : Infinity;
             const crossfadeX = crossfadePointValue !== undefined ? timeToX(crossfadePointValue) : -Infinity;
             
             if (onTrimTimeChange && Math.abs(x - startHandleX) <= HANDLE_SIZE / 2) {
                setHoveringHandle('start');
             } else if (onTrimTimeChange && Math.abs(x - endHandleX) <= HANDLE_SIZE / 2) {
                setHoveringHandle('end');
             } else if (onSetCrossfadePoint && crossfadePointValue !== undefined && Math.abs(x - crossfadeX) <= HANDLE_SIZE / 2) {
                setHoveringHandle('crossfade');
             } else {
                setHoveringHandle(null);
             }
        }
    };

    const handleMouseUp = () => {
        setDraggingHandle(null);
    };
    
    const handleMouseLeave = () => {
        setHoveringHandle(null);
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [audioBuffer.duration, width, onWaveformClick, onTrimTimeChange, onSetCrossfadePoint, draggingHandle, trimStart, trimEnd, crossfadePointValue]);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current || width === 0) return;
    
    const canvas = canvasRef.current;
    if (hoveringHandle || draggingHandle) {
        canvas.style.cursor = 'ew-resize';
    } else {
        canvas.style.cursor = 'pointer';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        const x = i + 0.5;
        const yMin = (1 + min) * amp;
        const yMax = (1 + max) * amp;
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
    }
    ctx.stroke();

    // Draw trim overlays
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    if (trimStart !== undefined && trimStart > 0) {
        const startWidth = timeToX(trimStart);
        ctx.fillRect(0, 0, startWidth, height);
    }
    if (trimEnd !== undefined && trimEnd < audioBuffer.duration) {
        const endX = timeToX(trimEnd);
        const endWidth = width - endX;
        ctx.fillRect(endX, 0, endWidth, height);
    }

    // Draw trim handles
    if (onTrimTimeChange) {
        if (trimStart !== undefined) {
             const startHandleX = timeToX(trimStart);
             ctx.fillStyle = hoveringHandle === 'start' || draggingHandle === 'start' ? HANDLE_HOVER_COLOR : HANDLE_COLOR;
             ctx.fillRect(startHandleX - HANDLE_SIZE / 2, 0, HANDLE_SIZE, height);
        }
         if (trimEnd !== undefined) {
             const endHandleX = timeToX(trimEnd);
             ctx.fillStyle = hoveringHandle === 'end' || draggingHandle === 'end' ? HANDLE_HOVER_COLOR : HANDLE_COLOR;
             ctx.fillRect(endHandleX - HANDLE_SIZE / 2, 0, HANDLE_SIZE, height);
        }
    }


    // Draw vocal start time marker
    if (vocalStartTime !== undefined && vocalStartTime > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Red line
        const x = timeToX(vocalStartTime);
        ctx.fillRect(x - 0.5, 0, 1, height);
    }
    
    // Draw manual or auto crossfade marker
    if (crossfadePointValue !== undefined) {
        const isManual = manualCrossfadePoint !== undefined;
        const crossfadeX = timeToX(crossfadePointValue);

        ctx.save();
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'; // Green
        ctx.lineWidth = isManual ? 2 : 1;
        if (!isManual) {
            ctx.setLineDash([4, 4]);
        }
        
        ctx.beginPath();
        ctx.moveTo(crossfadeX, 0);
        ctx.lineTo(crossfadeX, height);
        ctx.stroke();
        
        ctx.restore(); // Clears line dash and other settings
    }

    // Draw playhead
    if (playheadTime !== undefined) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // White line
        const x = timeToX(playheadTime);
        ctx.fillRect(x - 0.5, 0, 1, height);
    }

  }, [audioBuffer, width, height, color, trimStart, trimEnd, vocalStartTime, playheadTime, draggingHandle, hoveringHandle, crossfadePointValue, manualCrossfadePoint]);

  return <canvas ref={canvasRef} />;
};