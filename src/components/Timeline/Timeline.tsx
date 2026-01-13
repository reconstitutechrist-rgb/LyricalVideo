import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  PlayIcon,
  PauseIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/solid';
import { LyricLine, TextKeyframe } from '../../../types';
import { formatTime } from '../../utils/time';
import { KeyframeTrack } from './KeyframeTrack';
import { KeyframeEditor } from './KeyframeEditor';
import { useAudioStore } from '../../stores';

interface TimelineProps {
  // Audio props - optional, will use audio store if not provided
  duration?: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  // Required props
  lyrics: LyricLine[];
  onLyricKeyframesChange: (lyricIndex: number, keyframes: TextKeyframe[]) => void;
  selectedLyricIndex: number | null;
  onSelectLyric: (index: number | null) => void;
}

const _TIME_RULER_HEIGHT = 24;
const _TRACK_HEIGHT = 40;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

export const Timeline: React.FC<TimelineProps> = ({
  duration: durationProp,
  currentTime: currentTimeProp,
  onSeek: onSeekProp,
  isPlaying: isPlayingProp,
  onPlayPause: onPlayPauseProp,
  lyrics,
  onLyricKeyframesChange,
  selectedLyricIndex,
  onSelectLyric,
}) => {
  // Use audio store values with props as override
  const audioStore = useAudioStore();
  const duration = durationProp ?? audioStore.duration;
  const currentTime = currentTimeProp ?? audioStore.currentTime;
  const isPlaying = isPlayingProp ?? audioStore.isPlaying;

  // Use store actions if props not provided
  const onSeek = useCallback(
    (time: number) => {
      if (onSeekProp) {
        onSeekProp(time);
      } else {
        audioStore.seek(time);
      }
    },
    [onSeekProp, audioStore]
  );

  const onPlayPause = useCallback(() => {
    if (onPlayPauseProp) {
      onPlayPauseProp();
    } else {
      audioStore.togglePlay();
    }
  }, [onPlayPauseProp, audioStore]);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState<number | null>(null);

  // Calculate timeline width based on zoom
  const pixelsPerSecond = 100 * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  // Time ruler markers
  const timeMarkers = useMemo(() => {
    const markers: { time: number; label: string; major: boolean }[] = [];
    const interval = zoom >= 2 ? 0.5 : zoom >= 1 ? 1 : 2;

    for (let t = 0; t <= duration; t += interval) {
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      markers.push({
        time: t,
        label,
        major: t % (interval * 2) === 0,
      });
    }
    return markers;
  }, [duration, zoom]);

  // Handle playhead drag
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
      onSeek(time);
    },
    [scrollLeft, pixelsPerSecond, duration, onSeek]
  );

  const handlePlayheadDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
      onSeek(time);
    },
    [isDragging, scrollLeft, pixelsPerSecond, duration, onSeek]
  );

  // Stable reference for mouseup handler to avoid memory leak
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePlayheadDrag);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handlePlayheadDrag);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handlePlayheadDrag, handleMouseUp]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!containerRef.current || isDragging) return;
    const playheadX = currentTime * pixelsPerSecond;
    const containerWidth = containerRef.current.clientWidth;

    if (playheadX < scrollLeft + 100) {
      setScrollLeft(Math.max(0, playheadX - 100));
    } else if (playheadX > scrollLeft + containerWidth - 100) {
      setScrollLeft(playheadX - containerWidth + 100);
    }
  }, [currentTime, pixelsPerSecond, scrollLeft, isDragging]);

  // Handle zoom
  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5));

  // formatTime imported from utils/time (with showMs=true for precision display)

  // Get selected lyric and keyframe
  const selectedLyric = selectedLyricIndex !== null ? lyrics[selectedLyricIndex] : null;
  const selectedKeyframe =
    selectedLyric && selectedKeyframeIndex !== null
      ? selectedLyric.keyframes?.[selectedKeyframeIndex]
      : null;

  return (
    <div className="flex flex-col bg-gray-900/90 border-t border-gray-700/50">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>

          {/* Current Time */}
          <div className="text-sm font-mono text-gray-300">
            {formatTime(currentTime, true)}
            <span className="text-gray-600"> / {formatTime(duration, true)}</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track Labels */}
        <div className="w-48 flex-shrink-0 border-r border-gray-800">
          <div className="h-6 border-b border-gray-800 bg-gray-800/50 px-2 text-xs text-gray-500 flex items-center">
            Lyrics
          </div>
          {lyrics.map((lyric, index) => (
            <button
              key={index}
              onClick={() => onSelectLyric(selectedLyricIndex === index ? null : index)}
              className={`w-full h-10 px-2 text-left text-xs border-b border-gray-800/50 truncate transition-colors ${
                selectedLyricIndex === index
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-400 hover:bg-gray-800/50'
              }`}
              title={lyric.text}
            >
              {lyric.text.slice(0, 25)}
              {lyric.text.length > 25 ? '...' : ''}
            </button>
          ))}
        </div>

        {/* Timeline Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div
            ref={timelineRef}
            className="relative"
            style={{ width: `${timelineWidth}px` }}
            onClick={handleTimelineClick}
          >
            {/* Time Ruler */}
            <div className="h-6 bg-gray-800/50 border-b border-gray-800 relative">
              {timeMarkers.map(({ time, label, major }) => (
                <div
                  key={time}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${time * pixelsPerSecond}px` }}
                >
                  <div className={`w-px ${major ? 'h-4 bg-gray-600' : 'h-2 bg-gray-700'}`} />
                  {major && <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>}
                </div>
              ))}
            </div>

            {/* Tracks */}
            {lyrics.map((lyric, index) => (
              <KeyframeTrack
                key={index}
                lyric={lyric}
                index={index}
                isSelected={selectedLyricIndex === index}
                pixelsPerSecond={pixelsPerSecond}
                duration={duration}
                keyframes={lyric.keyframes || []}
                onKeyframesChange={(kfs) => onLyricKeyframesChange(index, kfs)}
                selectedKeyframeIndex={selectedLyricIndex === index ? selectedKeyframeIndex : null}
                onSelectKeyframe={(ki) => {
                  onSelectLyric(index);
                  setSelectedKeyframeIndex(ki);
                }}
              />
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize z-10 pointer-events-auto"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
            </div>
          </div>
        </div>

        {/* Keyframe Editor Panel */}
        {selectedLyric && selectedKeyframe && selectedKeyframeIndex !== null && (
          <div className="w-64 flex-shrink-0 border-l border-gray-800 bg-gray-800/30">
            <KeyframeEditor
              keyframe={selectedKeyframe}
              keyframeIndex={selectedKeyframeIndex}
              totalKeyframes={selectedLyric.keyframes?.length || 0}
              onChange={(updated) => {
                const newKeyframes = [...(selectedLyric.keyframes || [])];
                newKeyframes[selectedKeyframeIndex] = updated;
                onLyricKeyframesChange(selectedLyricIndex!, newKeyframes);
              }}
              onDelete={() => {
                const newKeyframes = [...(selectedLyric.keyframes || [])];
                newKeyframes.splice(selectedKeyframeIndex, 1);
                onLyricKeyframesChange(selectedLyricIndex!, newKeyframes);
                setSelectedKeyframeIndex(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
