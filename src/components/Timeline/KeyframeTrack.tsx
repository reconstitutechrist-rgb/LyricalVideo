import React, { useCallback, useState } from 'react';
import { LyricLine, TextKeyframe } from '../../../types';

interface KeyframeTrackProps {
  lyric: LyricLine;
  index: number;
  isSelected: boolean;
  pixelsPerSecond: number;
  duration: number;
  keyframes: TextKeyframe[];
  onKeyframesChange: (keyframes: TextKeyframe[]) => void;
  selectedKeyframeIndex: number | null;
  onSelectKeyframe: (index: number | null) => void;
}

const DEFAULT_KEYFRAME: Omit<TextKeyframe, 'time'> = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
  easing: 'easeInOut',
};

export const KeyframeTrack: React.FC<KeyframeTrackProps> = ({
  lyric,
  index: _index,
  isSelected,
  pixelsPerSecond: _pixelsPerSecond,
  duration: _duration,
  keyframes,
  onKeyframesChange,
  selectedKeyframeIndex,
  onSelectKeyframe,
}) => {
  const [draggingKeyframe, setDraggingKeyframe] = useState<number | null>(null);

  // Convert lyric timing to pixels
  const startX = lyric.startTime * _pixelsPerSecond;
  const endX = lyric.endTime * _pixelsPerSecond;
  const lyricWidth = endX - startX;

  // Add a new keyframe on double-click
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      // Convert to normalized time (0-1 within lyric duration)
      const normalizedTime = Math.max(0, Math.min(1, localX / lyricWidth));

      const newKeyframe: TextKeyframe = {
        ...DEFAULT_KEYFRAME,
        time: normalizedTime,
      };

      // Insert in sorted order
      const newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
      onKeyframesChange(newKeyframes);
    },
    [keyframes, lyricWidth, onKeyframesChange]
  );

  // Handle keyframe drag
  const handleKeyframeDrag = useCallback(
    (e: MouseEvent, kfIndex: number, trackRect: DOMRect) => {
      const localX = e.clientX - trackRect.left;
      const normalizedTime = Math.max(0, Math.min(1, localX / lyricWidth));

      const newKeyframes = keyframes
        .map((kf, i) => (i === kfIndex ? { ...kf, time: normalizedTime } : kf))
        .sort((a, b) => a.time - b.time);

      // Find new index after sort
      const newIndex = newKeyframes.findIndex((kf) => kf.time === normalizedTime);
      onKeyframesChange(newKeyframes);
      onSelectKeyframe(newIndex);
    },
    [keyframes, lyricWidth, onKeyframesChange, onSelectKeyframe]
  );

  const handleKeyframeMouseDown = (e: React.MouseEvent, kfIndex: number) => {
    e.stopPropagation();
    onSelectKeyframe(kfIndex);

    const trackRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!trackRect) return;

    setDraggingKeyframe(kfIndex);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleKeyframeDrag(moveEvent, kfIndex, trackRect);
    };

    const handleMouseUp = () => {
      setDraggingKeyframe(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`h-10 border-b border-gray-800/50 relative ${isSelected ? 'bg-cyan-900/10' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Lyric duration bar */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded transition-colors ${
          isSelected ? 'bg-cyan-500/30 border border-cyan-500/50' : 'bg-gray-700/50'
        }`}
        style={{
          left: `${startX}px`,
          width: `${lyricWidth}px`,
        }}
      >
        {/* Lyric text (truncated) */}
        <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
          <span className="text-[10px] text-gray-400 truncate">{lyric.text.slice(0, 30)}</span>
        </div>
      </div>

      {/* Keyframe diamonds */}
      {keyframes.map((kf, kfIndex) => {
        const kfX = startX + kf.time * lyricWidth;
        const isKeyframeSelected = selectedKeyframeIndex === kfIndex;

        return (
          <div
            key={kfIndex}
            className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${
              draggingKeyframe === kfIndex ? 'scale-125' : ''
            }`}
            style={{ left: `${kfX}px` }}
            onMouseDown={(e) => handleKeyframeMouseDown(e, kfIndex)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectKeyframe(kfIndex);
            }}
          >
            {/* Diamond shape */}
            <div
              className={`w-3 h-3 rotate-45 -translate-x-1/2 transition-colors ${
                isKeyframeSelected
                  ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                  : 'bg-cyan-400 hover:bg-cyan-300'
              }`}
            />
            {/* Keyframe info tooltip on hover */}
            {isKeyframeSelected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 rounded text-[10px] text-white whitespace-nowrap z-20 pointer-events-none">
                t: {(kf.time * 100).toFixed(0)}% | s: {kf.scale.toFixed(2)} | o:{' '}
                {kf.opacity.toFixed(2)}
              </div>
            )}
          </div>
        );
      })}

      {/* Add keyframe hint */}
      {isSelected && keyframes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-600">Double-click to add keyframe</span>
        </div>
      )}
    </div>
  );
};

export default KeyframeTrack;
