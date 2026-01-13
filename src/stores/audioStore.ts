/**
 * Audio Store
 * Manages audio playback state including file, buffer, and playback controls
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface AudioState {
  // Audio data
  audioFile: File | null;
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;

  // Playback state
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export interface AudioActions {
  // Setters
  setAudioFile: (file: File | null) => void;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // Playback controls
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  seek: (time: number) => void;

  // Reset
  reset: () => void;
}

export type AudioStore = AudioState & AudioActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: AudioState = {
  audioFile: null,
  audioUrl: null,
  audioBuffer: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
};

// ============================================================================
// Store
// ============================================================================

export const useAudioStore = create<AudioStore>()(
  devtools(
    (set, _get) => ({
      // Initial state
      ...initialState,

      // Actions
      setAudioFile: (file) =>
        set(
          (state) => {
            // Revoke previous URL to prevent memory leaks
            if (state.audioUrl) {
              URL.revokeObjectURL(state.audioUrl);
            }
            return {
              audioFile: file,
              audioUrl: file ? URL.createObjectURL(file) : null,
            };
          },
          false,
          'setAudioFile'
        ),

      setAudioBuffer: (buffer) => set({ audioBuffer: buffer }, false, 'setAudioBuffer'),

      setCurrentTime: (time) => set({ currentTime: time }, false, 'setCurrentTime'),

      setDuration: (duration) => set({ duration }, false, 'setDuration'),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying }), false, 'togglePlay'),

      setIsPlaying: (playing) => set({ isPlaying: playing }, false, 'setIsPlaying'),

      seek: (time) => set({ currentTime: time }, false, 'seek'),

      reset: () =>
        set(
          (state) => {
            // Revoke URL to prevent memory leaks
            if (state.audioUrl) {
              URL.revokeObjectURL(state.audioUrl);
            }
            return initialState;
          },
          false,
          'reset'
        ),
    }),
    { name: 'audio-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsAudioLoaded = (state: AudioStore): boolean => state.audioFile !== null;

export const selectIsAudioReady = (state: AudioStore): boolean =>
  state.audioFile !== null && state.audioBuffer !== null;

export const selectPlaybackProgress = (state: AudioStore): number =>
  state.duration > 0 ? state.currentTime / state.duration : 0;
