import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/solid';
import { WaveformEditorProps } from './types';
import { WaveformCanvas } from './WaveformCanvas';
import { TimeRuler } from './TimeRuler';
import { PlayheadLayer } from './PlayheadLayer';
import { LyricBlockLayer } from './LyricBlockLayer';
import {
  generateWaveformData,
  WaveformData,
  formatTime,
  timeToPixel,
} from '../../../services/audioAnalysisService';
import { useAudioStore } from '../../stores';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const WAVEFORM_HEIGHT = 80;
const BLOCK_LAYER_HEIGHT = 60;

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  audioBuffer: audioBufferProp,
  duration: durationProp,
  currentTime: currentTimeProp,
  onSeek: onSeekProp,
  lyrics,
  onLyricUpdate,
  syncPrecision,
  isPlaying: isPlayingProp,
  onPlayPause: onPlayPauseProp,
  selectedLyricIndex,
  onSelectLyric,
}) => {
  // Use audio store values with props as override
  const audioStore = useAudioStore();
  const audioBuffer = audioBufferProp ?? audioStore.audioBuffer;
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
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);

  // Generate waveform data when audio buffer changes
  useEffect(() => {
    if (!audioBuffer) {
      setWaveformData(null);
      return;
    }

    setIsGeneratingWaveform(true);
    generateWaveformData(audioBuffer, { targetWidth: 4000 })
      .then(setWaveformData)
      .finally(() => setIsGeneratingWaveform(false));
  }, [audioBuffer]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Auto-scroll to keep playhead visible during playback
  useEffect(() => {
    if (!isPlaying) return;

    const playheadX = timeToPixel(currentTime, duration, containerWidth, zoom, scrollOffset);

    // If playhead is near the right edge, scroll to keep it visible
    if (playheadX > containerWidth - 100) {
      const newOffset = (currentTime / duration) * containerWidth * zoom - containerWidth / 2;
      setScrollOffset(Math.max(0, Math.min(newOffset, containerWidth * zoom - containerWidth)));
    }
  }, [currentTime, isPlaying, duration, containerWidth, zoom, scrollOffset]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.min(MAX_ZOOM, z * 1.5);
      // Adjust scroll to keep center of view fixed
      const centerTime = ((scrollOffset + containerWidth / 2) / (containerWidth * z)) * duration;
      const newOffset = (centerTime / duration) * containerWidth * newZoom - containerWidth / 2;
      setScrollOffset(Math.max(0, Math.min(newOffset, containerWidth * newZoom - containerWidth)));
      return newZoom;
    });
  }, [scrollOffset, containerWidth, duration]);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.max(MIN_ZOOM, z / 1.5);
      const maxOffset = Math.max(0, containerWidth * newZoom - containerWidth);
      setScrollOffset((s) => Math.min(s, maxOffset));
      return newZoom;
    });
  }, [containerWidth]);

  // Handle horizontal scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollLeft);
  }, []);

  // Handle wheel for horizontal scroll/zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Zoom with ctrl/cmd + wheel
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  // Total content width based on zoom
  const totalWidth = containerWidth * zoom;

  return (
    <div className="waveform-editor flex flex-col bg-gray-900/90 border border-gray-700/50 rounded-lg overflow-hidden">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          </button>

          {/* Current Time Display */}
          <div className="text-xs font-mono text-gray-300">
            {formatTime(currentTime)}
            <span className="text-gray-600"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom out"
            disabled={zoom <= MIN_ZOOM}
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-gray-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom in"
            disabled={zoom >= MAX_ZOOM}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main timeline area */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        onScroll={handleScroll}
        onWheel={handleWheel}
        style={{ scrollBehavior: 'auto' }}
      >
        <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
          {/* Time Ruler */}
          <TimeRuler
            duration={duration}
            width={containerWidth}
            zoom={zoom}
            scrollOffset={scrollOffset}
          />

          {/* Waveform + Lyric Blocks */}
          <div className="relative" style={{ height: `${WAVEFORM_HEIGHT + BLOCK_LAYER_HEIGHT}px` }}>
            {/* Waveform Canvas */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{ height: `${WAVEFORM_HEIGHT}px` }}
            >
              {isGeneratingWaveform ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Generating waveform...
                </div>
              ) : waveformData ? (
                <WaveformCanvas
                  peaks={waveformData.peaks}
                  width={containerWidth}
                  height={WAVEFORM_HEIGHT}
                  zoom={zoom}
                  scrollOffset={scrollOffset}
                  duration={duration}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  No audio loaded
                </div>
              )}
            </div>

            {/* Lyric Block Layer */}
            <div
              className="absolute left-0 right-0"
              style={{ top: `${WAVEFORM_HEIGHT}px`, height: `${BLOCK_LAYER_HEIGHT}px` }}
            >
              <LyricBlockLayer
                lyrics={lyrics}
                width={containerWidth}
                height={BLOCK_LAYER_HEIGHT}
                zoom={zoom}
                scrollOffset={scrollOffset}
                duration={duration}
                syncPrecision={syncPrecision}
                selectedLyricIndex={selectedLyricIndex}
                onSelectLyric={onSelectLyric}
                onLyricUpdate={onLyricUpdate}
              />
            </div>

            {/* Playhead Layer */}
            <PlayheadLayer
              currentTime={currentTime}
              duration={duration}
              width={containerWidth}
              height={WAVEFORM_HEIGHT + BLOCK_LAYER_HEIGHT}
              zoom={zoom}
              scrollOffset={scrollOffset}
              onSeek={onSeek}
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gray-800 bg-gray-800/30 text-[10px] text-gray-500">
        <span>
          {lyrics.length} lyrics • {syncPrecision} precision
        </span>
        <span>Ctrl+Scroll to zoom • Click waveform to seek • Drag blocks to adjust timing</span>
      </div>
    </div>
  );
};

export default WaveformEditor;
