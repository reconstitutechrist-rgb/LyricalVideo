/**
 * Waveform Sync Editor
 * Advanced waveform-based timing adjustment with beat markers
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { LyricLine, TimingPrecision } from '../../../types';
import { useBeatMapStore } from '../../stores/beatMapStore';
import { useLyricsStore } from '../../stores/lyricsStore';
import { useAudioStore } from '../../stores/audioStore';
import { BeatSnapTool } from './BeatSnapTool';
import {
  calculateConfidenceStats,
  getConfidenceLevel,
  getConfidenceTailwindClass,
} from '../../utils/confidenceValidation';

// ============================================================================
// Types
// ============================================================================

interface WaveformSyncEditorProps {
  lyrics: LyricLine[];
  onLyricUpdate: (index: number, updates: Partial<LyricLine>) => void;
  audioBuffer?: AudioBuffer | null;
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'start' | 'end' | null;
  lyricIndex: number;
  startX: number;
  originalStart: number;
  originalEnd: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function generateWaveformPeaks(audioBuffer: AudioBuffer, numSamples: number): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const peaks = new Float32Array(numSamples);
  const samplesPerPeak = Math.floor(channelData.length / numSamples);

  for (let i = 0; i < numSamples; i++) {
    let max = 0;
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, channelData.length);

    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }

    peaks[i] = max;
  }

  return peaks;
}

// ============================================================================
// Waveform Sync Editor Component
// ============================================================================

export const WaveformSyncEditor: React.FC<WaveformSyncEditorProps> = ({
  lyrics,
  onLyricUpdate,
  audioBuffer: audioBufferProp,
  duration: durationProp,
  currentTime: currentTimeProp,
  isPlaying: isPlayingProp,
  onSeek: onSeekProp,
}) => {
  // Get audio state from store if not provided via props
  const audioStore = useAudioStore();
  const audioBuffer = audioBufferProp ?? audioStore.audioBuffer;
  const duration = durationProp ?? audioStore.duration ?? 0;
  const currentTime = currentTimeProp ?? audioStore.currentTime;
  const isPlaying = isPlayingProp ?? audioStore.isPlaying;
  const onSeek = onSeekProp ?? ((time: number) => audioStore.setCurrentTime(time));

  const lyricsStore = useLyricsStore();
  const beatMapStore = useBeatMapStore();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showBeatMarkers, setShowBeatMarkers] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    lyricIndex: -1,
    startX: 0,
    originalStart: 0,
    originalEnd: 0,
  });

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 200 });

  // Waveform peaks
  const peaks = useMemo(() => {
    if (!audioBuffer) return null;
    return generateWaveformPeaks(audioBuffer, dimensions.width * zoom);
  }, [audioBuffer, dimensions.width, zoom]);

  // Calculate visible range
  const visibleDuration = duration / zoom;
  const visibleStart = scrollOffset * (duration - visibleDuration);

  // Confidence stats
  const confidenceStats = useMemo(() => {
    return calculateConfidenceStats(lyrics);
  }, [lyrics]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(150, entry.contentRect.height),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const centerY = height / 2;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const samplesPerPixel = peaks.length / width;
    const startSample = Math.floor((visibleStart / duration) * peaks.length);

    ctx.fillStyle = '#6366f1';
    ctx.globalAlpha = 0.8;

    for (let x = 0; x < width; x++) {
      const sampleIdx = Math.floor(startSample + (x * samplesPerPixel) / zoom);
      if (sampleIdx >= 0 && sampleIdx < peaks.length) {
        const amplitude = peaks[sampleIdx] * (height / 2 - 10);
        ctx.fillRect(x, centerY - amplitude, 1, amplitude * 2);
      }
    }

    ctx.globalAlpha = 1;

    // Draw center line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, [peaks, dimensions, visibleStart, duration, zoom]);

  // Time to X conversion
  const timeToX = useCallback(
    (time: number): number => {
      return ((time - visibleStart) / visibleDuration) * dimensions.width;
    },
    [visibleStart, visibleDuration, dimensions.width]
  );

  // X to time conversion
  const xToTime = useCallback(
    (x: number): number => {
      return visibleStart + (x / dimensions.width) * visibleDuration;
    },
    [visibleStart, visibleDuration, dimensions.width]
  );

  // Handle mouse down on lyric block
  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, index: number, type: 'move' | 'start' | 'end') => {
      e.stopPropagation();
      const lyric = lyrics[index];

      setSelectedIndex(index);
      setDragState({
        isDragging: true,
        dragType: type,
        lyricIndex: index,
        startX: e.clientX,
        originalStart: lyric.startTime,
        originalEnd: lyric.endTime,
      });
    },
    [lyrics]
  );

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = (deltaX / dimensions.width) * visibleDuration;

      const lyric = lyrics[dragState.lyricIndex];
      if (!lyric) return;

      switch (dragState.dragType) {
        case 'move': {
          const newStart = Math.max(0, dragState.originalStart + deltaTime);
          const lyricDuration = dragState.originalEnd - dragState.originalStart;
          const newEnd = Math.min(duration, newStart + lyricDuration);
          onLyricUpdate(dragState.lyricIndex, {
            startTime: newStart,
            endTime: newEnd,
          });
          break;
        }
        case 'start': {
          const newStart = Math.max(
            0,
            Math.min(dragState.originalEnd - 0.1, dragState.originalStart + deltaTime)
          );
          onLyricUpdate(dragState.lyricIndex, { startTime: newStart });
          break;
        }
        case 'end': {
          const newEnd = Math.max(
            dragState.originalStart + 0.1,
            Math.min(duration, dragState.originalEnd + deltaTime)
          );
          onLyricUpdate(dragState.lyricIndex, { endTime: newEnd });
          break;
        }
      }
    },
    [dragState, dimensions.width, visibleDuration, lyrics, duration, onLyricUpdate]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      dragType: null,
    }));
  }, []);

  // Handle click on waveform for seeking
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.isDragging) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = xToTime(x);
      onSeek(Math.max(0, Math.min(duration, time)));
    },
    [dragState.isDragging, xToTime, onSeek, duration]
  );

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(1, Math.min(20, prev + delta)));
  }, []);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.WheelEvent) => {
      if (e.shiftKey) {
        // Zoom with shift+scroll
        handleZoom(e.deltaY > 0 ? -0.5 : 0.5);
      } else {
        // Scroll
        setScrollOffset((prev) => Math.max(0, Math.min(1, prev + e.deltaY * 0.001)));
      }
    },
    [handleZoom]
  );

  // Playhead position
  const playheadX = timeToX(currentTime);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden border border-slate-700"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleScroll}
    >
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="text-xs text-slate-500">Zoom: {zoom.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showBeatMarkers}
              onChange={(e) => setShowBeatMarkers(e.target.checked)}
              className="w-3 h-3 rounded"
            />
            Beats
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showConfidence}
              onChange={(e) => setShowConfidence(e.target.checked)}
              className="w-3 h-3 rounded"
            />
            Confidence
          </label>

          {showConfidence && (
            <span className="text-xs text-green-400 ml-2">
              {confidenceStats.highConfidencePercent.toFixed(0)}% high
            </span>
          )}
        </div>
      </div>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height - 40}
        className="absolute top-8 left-0 cursor-crosshair"
        onClick={handleCanvasClick}
        style={{ width: dimensions.width, height: dimensions.height - 40 }}
      />

      {/* Beat markers layer */}
      {showBeatMarkers && beatMapStore.beatMap && (
        <div className="absolute top-8 left-0 right-0 bottom-8">
          <BeatSnapTool
            width={dimensions.width}
            height={dimensions.height - 48}
            duration={duration}
            zoom={zoom}
            scrollOffset={scrollOffset}
            showBeatLines={true}
            showBPMSegments={true}
          />
        </div>
      )}

      {/* Lyric blocks layer */}
      <div className="absolute top-8 left-0 right-0 bottom-8 pointer-events-none">
        {lyrics.map((lyric, index) => {
          const startX = timeToX(lyric.startTime);
          const endX = timeToX(lyric.endTime);
          const blockWidth = endX - startX;

          // Skip if not visible
          if (endX < 0 || startX > dimensions.width) return null;

          const isSelected = selectedIndex === index;
          const confidenceLevel = getConfidenceLevel(lyric.syncConfidence);
          const confidenceClass = showConfidence ? getConfidenceTailwindClass(confidenceLevel) : '';

          return (
            <div
              key={lyric.id}
              className={`absolute h-12 rounded pointer-events-auto cursor-grab ${
                isSelected
                  ? 'bg-pink-500/40 border-2 border-pink-400'
                  : 'bg-indigo-500/30 border border-indigo-500/50 hover:bg-indigo-500/40'
              } ${confidenceClass}`}
              style={{
                left: Math.max(0, startX),
                width: Math.max(20, Math.min(blockWidth, dimensions.width - startX)),
                top: 50 + (index % 3) * 18,
              }}
              onMouseDown={(e) => handleBlockMouseDown(e, index, 'move')}
            >
              {/* Resize handles */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
                onMouseDown={(e) => handleBlockMouseDown(e, index, 'start')}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
                onMouseDown={(e) => handleBlockMouseDown(e, index, 'end')}
              />

              {/* Lyric text */}
              {blockWidth > 40 && (
                <div className="absolute inset-0 flex items-center justify-center px-1 overflow-hidden">
                  <span className="text-xs text-white truncate">{lyric.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Playhead */}
      {playheadX >= 0 && playheadX <= dimensions.width && (
        <div
          className="absolute top-8 bottom-8 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{ left: playheadX }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500" />
        </div>
      )}

      {/* Offset controls */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 flex items-center justify-center gap-4 z-20">
        <button
          onClick={() => lyricsStore.bulkOffsetAll(-100)}
          className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          title="Shift all lyrics 100ms earlier"
        >
          -100ms
        </button>
        <button
          onClick={() => lyricsStore.bulkOffsetAll(-10)}
          className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          title="Shift all lyrics 10ms earlier"
        >
          -10ms
        </button>
        <span className="text-xs text-slate-500">Offset All</span>
        <button
          onClick={() => lyricsStore.bulkOffsetAll(10)}
          className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          title="Shift all lyrics 10ms later"
        >
          +10ms
        </button>
        <button
          onClick={() => lyricsStore.bulkOffsetAll(100)}
          className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          title="Shift all lyrics 100ms later"
        >
          +100ms
        </button>
      </div>
    </div>
  );
};

export default WaveformSyncEditor;
