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
