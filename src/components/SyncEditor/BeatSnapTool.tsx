/**
 * Beat Snap Tool
 * Displays beat markers and provides snap-to-beat functionality for timing
 */

import React, { useMemo, useCallback } from 'react';
import { useBeatMapStore } from '../../stores/beatMapStore';
import { useLyricsStore } from '../../stores/lyricsStore';

// ============================================================================
// Types
// ============================================================================

interface BeatSnapToolProps {
  width: number;
  height: number;
  duration: number;
  zoom: number;
  scrollOffset: number;
  showBeatLines?: boolean;
  showBPMSegments?: boolean;
  snapTolerance?: number;
}

interface BeatMarkerProps {
  x: number;
  height: number;
  intensity: number;
  isMajor: boolean;
}

// ============================================================================
// Beat Marker Component
// ============================================================================

const BeatMarker: React.FC<BeatMarkerProps> = ({ x, height, intensity, isMajor }) => {
  const markerHeight = isMajor ? height * 0.8 : height * 0.4;
  const opacity = 0.3 + intensity * 0.5;
  const color = isMajor ? '#f472b6' : '#a855f7'; // pink for major, purple for minor

  return (
    <line
      x1={x}
      y1={height - markerHeight}
      x2={x}
      y2={height}
      stroke={color}
      strokeWidth={isMajor ? 2 : 1}
      opacity={opacity}
    />
  );
};

// ============================================================================
// Beat Snap Tool Component
// ============================================================================

export const BeatSnapTool: React.FC<BeatSnapToolProps> = ({
  width,
  height,
  duration,
  zoom,
  scrollOffset,
  showBeatLines = true,
  showBPMSegments = true,
  snapTolerance = 100,
}) => {
  const beatMap = useBeatMapStore((state) => state.beatMap);
  const lyricsStore = useLyricsStore();

  // Calculate visible time range (must match WaveformSyncEditor calculation)
  const visibleDuration = duration / zoom;
  const visibleStartTime = scrollOffset * (duration - visibleDuration);
  const visibleEndTime = visibleStartTime + visibleDuration;

  // Time to X position helper
  const timeToX = useCallback(
    (time: number): number => {
      return ((time - visibleStartTime) / visibleDuration) * width;
    },
    [visibleStartTime, visibleDuration, width]
  );

  // Get visible beats
  const visibleBeats = useMemo(() => {
    if (!beatMap?.beats) return [];

    return beatMap.beats.filter(
      (beat) => beat.time >= visibleStartTime - 0.5 && beat.time <= visibleEndTime + 0.5
    );
  }, [beatMap?.beats, visibleStartTime, visibleEndTime]);

  // Identify major beats (downbeats based on BPM)
  const majorBeatIndices = useMemo(() => {
    if (!beatMap?.beats || !beatMap?.bpmSegments) return new Set<number>();

    const indices = new Set<number>();
    let beatCounter = 0;

    for (let i = 0; i < beatMap.beats.length; i++) {
      const beat = beatMap.beats[i];
      const segment = beatMap.bpmSegments.find(
        (s) => beat.time >= s.startTime && beat.time <= s.endTime
      );

      // Mark every 4th beat as major (downbeat in 4/4)
      if (beatCounter % 4 === 0) {
        indices.add(i);
      }
      beatCounter++;

      // Reset counter on segment change
      if (segment && i > 0) {
        const prevBeat = beatMap.beats[i - 1];
        const prevSegment = beatMap.bpmSegments.find(
          (s) => prevBeat.time >= s.startTime && prevBeat.time <= s.endTime
        );
        if (segment !== prevSegment) {
          beatCounter = 0;
        }
      }
    }

    return indices;
  }, [beatMap?.beats, beatMap?.bpmSegments]);

  // Get visible BPM segments
  const visibleSegments = useMemo(() => {
    if (!beatMap?.bpmSegments) return [];

    return beatMap.bpmSegments.filter(
      (seg) =>
        (seg.startTime >= visibleStartTime && seg.startTime <= visibleEndTime) ||
        (seg.endTime >= visibleStartTime && seg.endTime <= visibleEndTime) ||
        (seg.startTime <= visibleStartTime && seg.endTime >= visibleEndTime)
    );
  }, [beatMap?.bpmSegments, visibleStartTime, visibleEndTime]);

  // Handle snap to beat
  const handleSnapToBeat = useCallback(() => {
    if (!beatMap?.beats) return;

    const beatTimes = beatMap.beats.map((b) => b.time);
    lyricsStore.snapToBeat(beatTimes, snapTolerance);
  }, [beatMap?.beats, lyricsStore, snapTolerance]);

  // Handle snap selected to beat
  const handleSnapSelectedToBeat = useCallback(() => {
    if (!beatMap?.beats) return;

    const beatTimes = beatMap.beats.map((b) => b.time);
    lyricsStore.snapSelectedToBeat(beatTimes, snapTolerance);
  }, [beatMap?.beats, lyricsStore, snapTolerance]);

  if (!beatMap) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
        <span className="bg-black/50 px-3 py-1 rounded">No beat map available</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Beat lines layer */}
      {showBeatLines && (
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          style={{ overflow: 'visible' }}
        >
          {visibleBeats.map((beat, idx) => {
            const globalIdx = beatMap.beats.indexOf(beat);
            const x = timeToX(beat.time);
            const isMajor = majorBeatIndices.has(globalIdx);

            return (
              <BeatMarker
                key={`beat-${beat.time}`}
                x={x}
                height={height}
                intensity={beat.intensity}
                isMajor={isMajor}
              />
            );
          })}
        </svg>
      )}

      {/* BPM segment indicators */}
      {showBPMSegments && visibleSegments.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-5 flex">
          {visibleSegments.map((seg, idx) => {
            const startX = Math.max(0, timeToX(seg.startTime));
            const endX = Math.min(width, timeToX(seg.endTime));
            const segWidth = endX - startX;

            if (segWidth < 40) return null;

            return (
              <div
                key={`seg-${idx}`}
                className="absolute h-full flex items-center justify-center text-xs text-pink-400/70 bg-pink-500/10 border-b border-pink-500/20"
                style={{
                  left: startX,
                  width: segWidth,
                }}
              >
                {Math.round(seg.bpm)} BPM
              </div>
            );
          })}
        </div>
      )}

      {/* Snap controls */}
      <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-auto">
        <button
          onClick={handleSnapSelectedToBeat}
          disabled={lyricsStore.selectedLyricIndices.size === 0}
          className="px-2 py-1 text-xs rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Snap selected lyrics to nearest beats"
        >
          Snap Selected
        </button>
        <button
          onClick={handleSnapToBeat}
          className="px-2 py-1 text-xs rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 transition-colors"
          title="Snap all lyrics to nearest beats"
        >
          Snap All
        </button>
      </div>

      {/* Beat count info */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
        {beatMap.beats.length} beats | {Math.round(beatMap.averageBPM)} BPM avg
      </div>
    </div>
  );
};

export default BeatSnapTool;
