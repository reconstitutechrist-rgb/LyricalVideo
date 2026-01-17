import React, { useState, useCallback, useEffect } from 'react';
import { PlayheadLayerProps } from './types';
import {
  timeToPixel,
  pixelToTime,
  formatTime,
  clamp,
} from '../../../services/audioAnalysisService';

// Minimum touch target size (44px recommended by Apple/Google)
const TOUCH_TARGET_SIZE = 44;

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

  // Unified position extraction for mouse and touch events
  const getClientX = useCallback(
    (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number => {
      if ('touches' in e && e.touches.length > 0) {
        return e.touches[0].clientX;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        return e.changedTouches[0].clientX;
      } else if ('clientX' in e) {
        return e.clientX;
      }
      return 0;
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = getClientX(e) - rect.left;
      const time = pixelToTime(x, duration, width, zoom, scrollOffset);
      onSeek(clamp(time, 0, duration));
    },
    [duration, width, zoom, scrollOffset, onSeek, getClientX]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const container = document.querySelector('.playhead-layer');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = getClientX(e) - rect.left;
      const time = pixelToTime(x, duration, width, zoom, scrollOffset);

      if (isDragging) {
        onSeek(clamp(time, 0, duration));
      }

      setHoverTime(clamp(time, 0, duration));
    },
    [isDragging, duration, width, zoom, scrollOffset, onSeek, getClientX]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      // Touch events (passive: false to allow preventDefault in drag)
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
        window.removeEventListener('touchcancel', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x, duration, width, zoom, scrollOffset);
    setHoverTime(clamp(time, 0, duration));
  };

  return (
    <div
      className="playhead-layer absolute inset-0 cursor-crosshair touch-none"
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onMouseMove={handleContainerMouseMove}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
        setHoverTime(null);
      }}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Playhead line with touch-friendly hit area */}
      {playheadX >= 0 && playheadX <= width && (
        <div
          className="absolute top-0 bottom-0 z-20"
          style={{
            left: `${playheadX - TOUCH_TARGET_SIZE / 2}px`,
            width: `${TOUCH_TARGET_SIZE}px`,
          }}
        >
          {/* Visual playhead line (centered) */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none left-1/2 -translate-x-1/2">
            {/* Playhead handle - larger for touch */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 tablet:w-3 tablet:h-3 bg-red-500 rounded-sm rotate-45 cursor-ew-resize pointer-events-auto touch-target"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsDragging(true);
              }}
            />
          </div>
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
