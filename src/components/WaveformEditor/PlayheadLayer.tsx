import React, { useState, useCallback, useEffect } from 'react';
import { PlayheadLayerProps } from './types';
import {
  timeToPixel,
  pixelToTime,
  formatTime,
  clamp,
} from '../../../services/audioAnalysisService';

export const PlayheadLayer: React.FC<PlayheadLayerProps> = ({
  currentTime,
  duration,
  width,
  height,
  zoom,
  scrollOffset,
  onSeek,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const playheadX = timeToPixel(currentTime, duration, width, zoom, scrollOffset);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = pixelToTime(x, duration, width, zoom, scrollOffset);
      onSeek(clamp(time, 0, duration));
    },
    [duration, width, zoom, scrollOffset, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = document.querySelector('.playhead-layer');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = pixelToTime(x, duration, width, zoom, scrollOffset);

      if (isDragging) {
        onSeek(clamp(time, 0, duration));
      }

      setHoverTime(clamp(time, 0, duration));
    },
    [isDragging, duration, width, zoom, scrollOffset, onSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x, duration, width, zoom, scrollOffset);
    setHoverTime(clamp(time, 0, duration));
  };

  return (
    <div
      className="playhead-layer absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setHoverTime(null);
      }}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Playhead line */}
      {playheadX >= 0 && playheadX <= width && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
          style={{ left: `${playheadX}px` }}
        >
          {/* Playhead handle */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm rotate-45 cursor-ew-resize pointer-events-auto"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
            }}
          />
        </div>
      )}

      {/* Hover tooltip */}
      {showTooltip && hoverTime !== null && !isDragging && (
        <div
          className="absolute -top-6 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded pointer-events-none z-30 whitespace-nowrap"
          style={{
            left: `${timeToPixel(hoverTime, duration, width, zoom, scrollOffset)}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Drag tooltip */}
      {isDragging && (
        <div
          className="absolute -top-6 px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded pointer-events-none z-30 whitespace-nowrap"
          style={{
            left: `${playheadX}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {formatTime(currentTime)}
        </div>
      )}
    </div>
  );
};

export default PlayheadLayer;
