import React, { useState, useCallback, useEffect } from 'react';
import { LyricBlockLayerProps, DragState } from './types';
import {
  timeToPixel,
  clamp,
  isTimeRangeVisible,
  getSectionColor,
} from '../../../services/audioAnalysisService';

// Minimum touch target size (44px recommended)
const TOUCH_HANDLE_WIDTH = 16; // Wider handles for touch

export const LyricBlockLayer: React.FC<LyricBlockLayerProps> = ({
  lyrics,
  width,
  height,
  zoom,
  scrollOffset,
  duration,
  syncPrecision,
  selectedLyricIndex,
  onSelectLyric,
  onLyricUpdate,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    lyricIndex: null,
    startX: 0,
    originalStartTime: 0,
    originalEndTime: 0,
  });

  const totalWidth = width * zoom;
  const visibleStart = (scrollOffset / totalWidth) * duration;
  const visibleEnd = ((scrollOffset + width) / totalWidth) * duration;

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

  const handleBlockDragStart = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      index: number,
      dragType: 'move' | 'resize-start' | 'resize-end'
    ) => {
      e.stopPropagation();
      if ('preventDefault' in e) e.preventDefault();

      const lyric = lyrics[index];
      setDragState({
        isDragging: true,
        dragType,
        lyricIndex: index,
        startX: getClientX(e),
        originalStartTime: lyric.startTime,
        originalEndTime: lyric.endTime,
      });

      onSelectLyric(index);
    },
    [lyrics, onSelectLyric, getClientX]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState.isDragging || dragState.lyricIndex === null) return;

      const deltaX = getClientX(e) - dragState.startX;
      const deltaTime = (deltaX / (width * zoom)) * duration;

      const lyric = lyrics[dragState.lyricIndex];
      const minDuration = 0.1; // Minimum lyric duration

      let newStartTime = dragState.originalStartTime;
      let newEndTime = dragState.originalEndTime;

      switch (dragState.dragType) {
        case 'move':
          newStartTime = clamp(
            dragState.originalStartTime + deltaTime,
            0,
            duration - (lyric.endTime - lyric.startTime)
          );
          newEndTime = newStartTime + (dragState.originalEndTime - dragState.originalStartTime);
          break;
        case 'resize-start':
          newStartTime = clamp(
            dragState.originalStartTime + deltaTime,
            0,
            dragState.originalEndTime - minDuration
          );
          break;
        case 'resize-end':
          newEndTime = clamp(
            dragState.originalEndTime + deltaTime,
            dragState.originalStartTime + minDuration,
            duration
          );
          break;
      }

      onLyricUpdate(dragState.lyricIndex, {
        startTime: Number(newStartTime.toFixed(3)),
        endTime: Number(newEndTime.toFixed(3)),
      });
    },
    [dragState, lyrics, width, zoom, duration, onLyricUpdate, getClientX]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      lyricIndex: null,
      startX: 0,
      originalStartTime: 0,
      originalEndTime: 0,
    });
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      // Touch events
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
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  return (
    <div
      className="lyric-block-layer absolute inset-0 pointer-events-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {lyrics.map((lyric, index) => {
        // Skip if not visible
        if (!isTimeRangeVisible(lyric.startTime, lyric.endTime, visibleStart, visibleEnd)) {
          return null;
        }

        const startX = timeToPixel(lyric.startTime, duration, width, zoom, scrollOffset);
        const endX = timeToPixel(lyric.endTime, duration, width, zoom, scrollOffset);
        const blockWidth = Math.max(20, endX - startX);
        const isSelected = selectedLyricIndex === index;

        return (
          <div
            key={lyric.id || index}
            className={`absolute top-2 pointer-events-auto cursor-move group ${
              isSelected ? 'ring-2 ring-cyan-400 z-10' : ''
            }`}
            style={{
              left: `${startX}px`,
              width: `${blockWidth}px`,
              height: `${height - 16}px`,
              backgroundColor: getSectionColor(lyric.section),
              borderRadius: '4px',
              transition: dragState.isDragging ? 'none' : 'box-shadow 0.15s',
            }}
            onClick={() => onSelectLyric(index)}
            onMouseDown={(e) => handleBlockDragStart(e, index, 'move')}
            onTouchStart={(e) => handleBlockDragStart(e, index, 'move')}
          >
            {/* Left resize handle - wider for touch */}
            <div
              className="absolute left-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/20 rounded-l touch-none"
              style={{ width: `${TOUCH_HANDLE_WIDTH}px` }}
              onMouseDown={(e) => handleBlockDragStart(e, index, 'resize-start')}
              onTouchStart={(e) => handleBlockDragStart(e, index, 'resize-start')}
            />

            {/* Right resize handle - wider for touch */}
            <div
              className="absolute right-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/20 rounded-r touch-none"
              style={{ width: `${TOUCH_HANDLE_WIDTH}px` }}
              onMouseDown={(e) => handleBlockDragStart(e, index, 'resize-end')}
              onTouchStart={(e) => handleBlockDragStart(e, index, 'resize-end')}
            />

            {/* Lyric text */}
            <div className="px-2 py-1 text-[10px] text-white truncate select-none">
              {lyric.text}
            </div>

            {/* Word timing indicators (when word/syllable precision) */}
            {syncPrecision !== 'line' && lyric.words && blockWidth > 50 && (
              <div className="absolute bottom-1 left-1 right-1 h-1 flex gap-px">
                {lyric.words.map((word, wi) => {
                  const wordStartPercent =
                    ((word.startTime - lyric.startTime) / (lyric.endTime - lyric.startTime)) * 100;
                  const wordWidthPercent =
                    ((word.endTime - word.startTime) / (lyric.endTime - lyric.startTime)) * 100;
                  return (
                    <div
                      key={word.id || wi}
                      className="absolute h-full bg-white/40 rounded-sm"
                      style={{
                        left: `${wordStartPercent}%`,
                        width: `${wordWidthPercent}%`,
                      }}
                      title={word.text}
                    />
                  );
                })}
              </div>
            )}

            {/* Section badge */}
            {lyric.section && blockWidth > 60 && (
              <div className="absolute top-0 right-1 text-[8px] text-white/70 truncate max-w-[60%]">
                {lyric.section}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LyricBlockLayer;
