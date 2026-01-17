/**
 * Lyrics Store
 * Manages lyrics data, sync state, and editing state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LyricLine, TimingPrecision } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface LyricsState {
  // Lyrics data
  lyrics: LyricLine[];
  userProvidedLyrics: string;

  // Sync state
  syncPrecision: TimingPrecision;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncConfidence: number | null;

  // Selection and editing
  selectedLyricIndices: Set<number>;
  editMode: boolean;
}

export interface LyricsActions {
  // Lyrics management
  setLyrics: (lyrics: LyricLine[]) => void;
  updateLyric: (index: number, updates: Partial<LyricLine>) => void;
  deleteLyric: (index: number) => void;
  addLyric: (lyric: LyricLine) => void;
  setUserProvidedLyrics: (lyrics: string) => void;

  // Sync state
  setSyncPrecision: (precision: TimingPrecision) => void;
  setSyncing: (syncing: boolean, progress?: number) => void;
  setSyncProgress: (progress: number) => void;
  setSyncConfidence: (confidence: number | null) => void;

  // Selection
  selectLyric: (index: number) => void;
  deselectLyric: (index: number) => void;
  toggleLyricSelection: (index: number) => void;
  selectAllLyrics: () => void;
  clearSelection: () => void;
  setSelectedIndices: (indices: Set<number>) => void;

  // Edit mode
  setEditMode: (mode: boolean) => void;

  // Manual Sync Tools
  /**
   * Offset all lyrics by specified milliseconds
   */
  bulkOffsetAll: (offsetMs: number) => void;

  /**
   * Offset only selected lyrics by specified milliseconds
   */
  offsetSelected: (offsetMs: number) => void;

  /**
   * Adjust timing for a specific lyric
   */
  adjustLyricTiming: (index: number, startDeltaMs: number, endDeltaMs: number) => void;

  /**
   * Snap lyrics to nearest beats from beat map
   */
  snapToBeat: (beatTimes: number[], toleranceMs?: number) => void;

  /**
   * Snap selected lyrics to nearest beats
   */
  snapSelectedToBeat: (beatTimes: number[], toleranceMs?: number) => void;

  /**
   * Scale all timings proportionally (useful for tempo adjustment)
   */
  scaleTiming: (factor: number, anchorTime?: number) => void;

  // Reset
  reset: () => void;
}

export type LyricsStore = LyricsState & LyricsActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: LyricsState = {
  lyrics: [],
  userProvidedLyrics: '',
  syncPrecision: 'line',
  isSyncing: false,
  syncProgress: 0,
  lastSyncConfidence: null,
  selectedLyricIndices: new Set<number>(),
  editMode: false,
};

// ============================================================================
// Store
// ============================================================================

export const useLyricsStore = create<LyricsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setLyrics: (lyrics) => set({ lyrics }, false, 'setLyrics'),

      updateLyric: (index, updates) =>
        set(
          (state) => {
            const newLyrics = [...state.lyrics];
            if (index >= 0 && index < newLyrics.length) {
              newLyrics[index] = { ...newLyrics[index], ...updates };
            }
            return { lyrics: newLyrics };
          },
          false,
          'updateLyric'
        ),

      deleteLyric: (index) =>
        set(
          (state) => {
            const newLyrics = state.lyrics.filter((_, i) => i !== index);
            // Also update selection indices
            const newSelection = new Set<number>();
            state.selectedLyricIndices.forEach((i) => {
              if (i < index) {
                newSelection.add(i);
              } else if (i > index) {
                newSelection.add(i - 1);
              }
              // Don't add if i === index (deleted)
            });
            return { lyrics: newLyrics, selectedLyricIndices: newSelection };
          },
          false,
          'deleteLyric'
        ),

      addLyric: (lyric) =>
        set((state) => ({ lyrics: [...state.lyrics, lyric] }), false, 'addLyric'),

      setUserProvidedLyrics: (lyrics) =>
        set({ userProvidedLyrics: lyrics }, false, 'setUserProvidedLyrics'),

      setSyncPrecision: (precision) => set({ syncPrecision: precision }, false, 'setSyncPrecision'),

      setSyncing: (syncing, progress) =>
        set(
          {
            isSyncing: syncing,
            syncProgress: progress ?? (syncing ? 0 : get().syncProgress),
          },
          false,
          'setSyncing'
        ),

      setSyncProgress: (progress) => set({ syncProgress: progress }, false, 'setSyncProgress'),

      setSyncConfidence: (confidence) =>
        set({ lastSyncConfidence: confidence }, false, 'setSyncConfidence'),

      selectLyric: (index) =>
        set(
          (state) => {
            const newSelection = new Set(state.selectedLyricIndices);
            newSelection.add(index);
            return { selectedLyricIndices: newSelection };
          },
          false,
          'selectLyric'
        ),

      deselectLyric: (index) =>
        set(
          (state) => {
            const newSelection = new Set(state.selectedLyricIndices);
            newSelection.delete(index);
            return { selectedLyricIndices: newSelection };
          },
          false,
          'deselectLyric'
        ),

      toggleLyricSelection: (index) =>
        set(
          (state) => {
            const newSelection = new Set(state.selectedLyricIndices);
            if (newSelection.has(index)) {
              newSelection.delete(index);
            } else {
              newSelection.add(index);
            }
            return { selectedLyricIndices: newSelection };
          },
          false,
          'toggleLyricSelection'
        ),

      selectAllLyrics: () =>
        set(
          (state) => ({
            selectedLyricIndices: new Set(state.lyrics.map((_, i) => i)),
          }),
          false,
          'selectAllLyrics'
        ),

      clearSelection: () =>
        set({ selectedLyricIndices: new Set<number>() }, false, 'clearSelection'),

      setSelectedIndices: (indices) =>
        set({ selectedLyricIndices: indices }, false, 'setSelectedIndices'),

      setEditMode: (mode) => set({ editMode: mode }, false, 'setEditMode'),

      // Manual Sync Tools
      bulkOffsetAll: (offsetMs) =>
        set(
          (state) => {
            const offsetSec = offsetMs / 1000;
            const newLyrics = state.lyrics.map((lyric) => ({
              ...lyric,
              startTime: Math.max(0, lyric.startTime + offsetSec),
              endTime: Math.max(0, lyric.endTime + offsetSec),
              words: lyric.words?.map((word) => ({
                ...word,
                startTime: Math.max(0, word.startTime + offsetSec),
                endTime: Math.max(0, word.endTime + offsetSec),
              })),
            }));
            return { lyrics: newLyrics };
          },
          false,
          'bulkOffsetAll'
        ),

      offsetSelected: (offsetMs) =>
        set(
          (state) => {
            const offsetSec = offsetMs / 1000;
            const newLyrics = state.lyrics.map((lyric, index) => {
              if (!state.selectedLyricIndices.has(index)) {
                return lyric;
              }
              return {
                ...lyric,
                startTime: Math.max(0, lyric.startTime + offsetSec),
                endTime: Math.max(0, lyric.endTime + offsetSec),
                words: lyric.words?.map((word) => ({
                  ...word,
                  startTime: Math.max(0, word.startTime + offsetSec),
                  endTime: Math.max(0, word.endTime + offsetSec),
                })),
              };
            });
            return { lyrics: newLyrics };
          },
          false,
          'offsetSelected'
        ),

      adjustLyricTiming: (index, startDeltaMs, endDeltaMs) =>
        set(
          (state) => {
            const newLyrics = [...state.lyrics];
            if (index >= 0 && index < newLyrics.length) {
              const lyric = newLyrics[index];
              const startDeltaSec = startDeltaMs / 1000;
              const endDeltaSec = endDeltaMs / 1000;
              const newStartTime = Math.max(0, lyric.startTime + startDeltaSec);
              const newEndTime = Math.max(newStartTime, lyric.endTime + endDeltaSec);

              // Also adjust word-level timings to stay consistent
              const adjustedWords = lyric.words?.map((word) => ({
                ...word,
                startTime: Math.max(0, word.startTime + startDeltaSec),
                endTime: Math.max(0, word.endTime + endDeltaSec),
              }));

              newLyrics[index] = {
                ...lyric,
                startTime: newStartTime,
                endTime: newEndTime,
                words: adjustedWords,
              };
            }
            return { lyrics: newLyrics };
          },
          false,
          'adjustLyricTiming'
        ),

      snapToBeat: (beatTimes, toleranceMs = 100) =>
        set(
          (state) => {
            const toleranceSec = toleranceMs / 1000;
            const newLyrics = state.lyrics.map((lyric) => {
              // Find nearest beat for start time
              let nearestStart = lyric.startTime;
              let minStartDist = toleranceSec;
              for (const beat of beatTimes) {
                const dist = Math.abs(beat - lyric.startTime);
                if (dist < minStartDist) {
                  minStartDist = dist;
                  nearestStart = beat;
                }
              }

              // Find nearest beat for end time
              let nearestEnd = lyric.endTime;
              let minEndDist = toleranceSec;
              for (const beat of beatTimes) {
                const dist = Math.abs(beat - lyric.endTime);
                if (dist < minEndDist) {
                  minEndDist = dist;
                  nearestEnd = beat;
                }
              }

              // Ensure end is after start
              if (nearestEnd <= nearestStart) {
                nearestEnd = lyric.endTime;
              }

              return {
                ...lyric,
                startTime: nearestStart,
                endTime: nearestEnd,
              };
            });
            return { lyrics: newLyrics };
          },
          false,
          'snapToBeat'
        ),

      snapSelectedToBeat: (beatTimes, toleranceMs = 100) =>
        set(
          (state) => {
            const toleranceSec = toleranceMs / 1000;
            const newLyrics = state.lyrics.map((lyric, index) => {
              if (!state.selectedLyricIndices.has(index)) {
                return lyric;
              }

              // Find nearest beat for start time
              let nearestStart = lyric.startTime;
              let minStartDist = toleranceSec;
              for (const beat of beatTimes) {
                const dist = Math.abs(beat - lyric.startTime);
                if (dist < minStartDist) {
                  minStartDist = dist;
                  nearestStart = beat;
                }
              }

              // Find nearest beat for end time
              let nearestEnd = lyric.endTime;
              let minEndDist = toleranceSec;
              for (const beat of beatTimes) {
                const dist = Math.abs(beat - lyric.endTime);
                if (dist < minEndDist) {
                  minEndDist = dist;
                  nearestEnd = beat;
                }
              }

              // Ensure end is after start
              if (nearestEnd <= nearestStart) {
                nearestEnd = lyric.endTime;
              }

              return {
                ...lyric,
                startTime: nearestStart,
                endTime: nearestEnd,
              };
            });
            return { lyrics: newLyrics };
          },
          false,
          'snapSelectedToBeat'
        ),

      scaleTiming: (factor, anchorTime = 0) =>
        set(
          (state) => {
            const newLyrics = state.lyrics.map((lyric) => ({
              ...lyric,
              startTime: anchorTime + (lyric.startTime - anchorTime) * factor,
              endTime: anchorTime + (lyric.endTime - anchorTime) * factor,
              words: lyric.words?.map((word) => ({
                ...word,
                startTime: anchorTime + (word.startTime - anchorTime) * factor,
                endTime: anchorTime + (word.endTime - anchorTime) * factor,
              })),
            }));
            return { lyrics: newLyrics };
          },
          false,
          'scaleTiming'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'lyrics-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectLyricsCount = (state: LyricsStore): number => state.lyrics.length;

export const selectHasLyrics = (state: LyricsStore): boolean => state.lyrics.length > 0;

export const selectSelectedLyricsCount = (state: LyricsStore): number =>
  state.selectedLyricIndices.size;

export const selectIsLyricSelected = (state: LyricsStore, index: number): boolean =>
  state.selectedLyricIndices.has(index);

export const selectCurrentLyric = (state: LyricsStore, currentTime: number): LyricLine | null => {
  return (
    state.lyrics.find((lyric) => currentTime >= lyric.startTime && currentTime <= lyric.endTime) ??
    null
  );
};

export const selectCurrentLyricIndex = (state: LyricsStore, currentTime: number): number => {
  return state.lyrics.findIndex(
    (lyric) => currentTime >= lyric.startTime && currentTime <= lyric.endTime
  );
};
