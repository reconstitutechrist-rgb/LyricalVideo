/**
 * Beat Map Store
 * Stores pre-computed beat detection data for predictive synchronization
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface BeatEvent {
  time: number;
  intensity: number;
  confidence: number;
}

export interface BPMSegment {
  startTime: number;
  endTime: number;
  bpm: number;
}

export interface BeatMap {
  beats: BeatEvent[];
  bpmSegments: BPMSegment[];
  energyProfile: Float32Array;
  peakEnergy: number;
  averageBPM: number;
  duration: number;
  analysisTimestamp: number;
}

export interface BeatMapState {
  beatMap: BeatMap | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisError: string | null;
}

export interface BeatMapActions {
  setBeatMap: (beatMap: BeatMap | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setAnalysisError: (error: string | null) => void;

  // Utility methods
  getBeatAt: (time: number) => BeatEvent | null;
  getUpcomingBeat: (
    currentTime: number,
    lookAheadMs?: number
  ) => { beat: BeatEvent; timeUntil: number } | null;
  getBPMAt: (time: number) => number;
  getEnergyAt: (time: number) => number;

  reset: () => void;
}

export type BeatMapStore = BeatMapState & BeatMapActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: BeatMapState = {
  beatMap: null,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisError: null,
};

// ============================================================================
// Store
// ============================================================================

export const useBeatMapStore = create<BeatMapStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setBeatMap: (beatMap) => set({ beatMap, analysisError: null }, false, 'setBeatMap'),

      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }, false, 'setIsAnalyzing'),

      setAnalysisProgress: (progress) =>
        set({ analysisProgress: progress }, false, 'setAnalysisProgress'),

      setAnalysisError: (error) =>
        set({ analysisError: error, isAnalyzing: false }, false, 'setAnalysisError'),

      getBeatAt: (time: number) => {
        const { beatMap } = get();
        if (!beatMap) return null;

        // Binary search for the nearest beat
        const beats = beatMap.beats;
        let left = 0;
        let right = beats.length - 1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const beat = beats[mid];

          // If within 50ms of a beat, consider it a match
          if (Math.abs(beat.time - time) < 0.05) {
            return beat;
          }

          if (beat.time < time) {
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        return null;
      },

      getUpcomingBeat: (currentTime: number, lookAheadMs: number = 100) => {
        const { beatMap } = get();
        if (!beatMap || beatMap.beats.length === 0) return null;

        const lookAheadSec = lookAheadMs / 1000;
        const beats = beatMap.beats;

        // Binary search for the first beat after currentTime
        let left = 0;
        let right = beats.length - 1;
        let nextBeatIndex = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (beats[mid].time > currentTime) {
            nextBeatIndex = mid;
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        }

        if (nextBeatIndex === -1) return null;

        const nextBeat = beats[nextBeatIndex];
        const timeUntil = nextBeat.time - currentTime;

        // Only return if within look-ahead window
        if (timeUntil <= lookAheadSec) {
          return { beat: nextBeat, timeUntil };
        }

        return null;
      },

      getBPMAt: (time: number) => {
        const { beatMap } = get();
        if (!beatMap) return 120; // Default BPM

        // Find the BPM segment containing this time
        for (const segment of beatMap.bpmSegments) {
          if (time >= segment.startTime && time < segment.endTime) {
            return segment.bpm;
          }
        }

        return beatMap.averageBPM;
      },

      getEnergyAt: (time: number) => {
        const { beatMap } = get();
        if (!beatMap || !beatMap.energyProfile || beatMap.energyProfile.length === 0) {
          return 0;
        }

        // Guard against zero duration
        if (beatMap.duration <= 0) {
          return 0;
        }

        // Energy profile is sampled at fixed intervals
        const sampleRate = beatMap.energyProfile.length / beatMap.duration;
        const index = Math.floor(time * sampleRate);

        if (index < 0 || index >= beatMap.energyProfile.length) {
          return 0;
        }

        return beatMap.energyProfile[index];
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'beat-map-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectHasBeatMap = (state: BeatMapStore): boolean => state.beatMap !== null;

export const selectIsAnalyzing = (state: BeatMapStore): boolean => state.isAnalyzing;

export const selectAverageBPM = (state: BeatMapStore): number => state.beatMap?.averageBPM ?? 120;

export const selectBeatCount = (state: BeatMapStore): number => state.beatMap?.beats.length ?? 0;
