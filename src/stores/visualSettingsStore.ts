/**
 * Visual Settings Store
 * Manages visual styling, effects, and display settings with partial persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  VisualStyle,
  VisualSettings,
  AspectRatio,
  GeneratedAsset,
  EffectInstanceConfig,
  Genre,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface VisualSettingsState {
  // Core visual settings
  currentStyle: VisualStyle;
  visualSettings: VisualSettings;
  aspectRatio: AspectRatio;

  // Background
  backgroundAsset: GeneratedAsset | null;

  // Effects
  lyricEffects: EffectInstanceConfig[];
  backgroundEffects: EffectInstanceConfig[];

  // Genre
  detectedGenre: Genre | null;
  genreOverride: Genre | null;
}

export interface VisualSettingsActions {
  // Style
  setCurrentStyle: (style: VisualStyle) => void;

  // Visual settings
  setVisualSettings: (settings: VisualSettings) => void;
  updateVisualSettings: (updates: Partial<VisualSettings>) => void;

  // Aspect ratio
  setAspectRatio: (ratio: AspectRatio) => void;

  // Background
  setBackgroundAsset: (asset: GeneratedAsset | null) => void;

  // Effects
  setLyricEffects: (effects: EffectInstanceConfig[]) => void;
  setBackgroundEffects: (effects: EffectInstanceConfig[]) => void;
  updateLyricEffect: (index: number, updates: Partial<EffectInstanceConfig>) => void;
  updateBackgroundEffect: (index: number, updates: Partial<EffectInstanceConfig>) => void;
  toggleLyricEffect: (index: number) => void;
  toggleBackgroundEffect: (index: number) => void;

  // Genre
  setDetectedGenre: (genre: Genre | null) => void;
  setGenreOverride: (genre: Genre | null) => void;

  // Lyrics Only Mode
  toggleLyricsOnlyMode: () => void;

  // Reset
  reset: () => void;
}

export type VisualSettingsStore = VisualSettingsState & VisualSettingsActions;

// ============================================================================
// Default Values
// ============================================================================

const defaultVisualSettings: VisualSettings = {
  particleSpeed: 1.0,
  speedX: 1.0,
  speedY: 1.0,
  intensity: 1.0,
  palette: 'neon',
  colorPalette: 'neon',
  dynamicBackgroundOpacity: false,
  dynamicBackgroundPulse: false,
  textAnimation: 'KINETIC',
  backgroundBlendMode: 'source-over',
  blendMode: 'source-over',
  fontFamily: 'Space Grotesk',
  textStagger: 0.05,
  textRevealDuration: 0.5,
  kineticRotationRange: 0.5,
  kineticOffsetRange: 30,
  glitchFrequency: 0.5,
  trailsEnabled: true,
  particleTrails: true,
  cameraShake: true,
  cameraShakeIntensity: 1.5,
  shakeIntensity: 1.5,
  reactivityIntensity: 1.0,
  lyricsOnlyMode: false,
  fontSizeScale: 1.0,
  frequencyMapping: {
    pulse: 'bass',
    motion: 'mid',
    color: 'treble',
  },
};

const initialState: VisualSettingsState = {
  currentStyle: VisualStyle.NEON_PULSE,
  visualSettings: defaultVisualSettings,
  aspectRatio: '16:9',
  backgroundAsset: null,
  lyricEffects: [],
  backgroundEffects: [],
  detectedGenre: null,
  genreOverride: null,
};

// ============================================================================
// Store
// ============================================================================

export const useVisualSettingsStore = create<VisualSettingsStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setCurrentStyle: (style) => set({ currentStyle: style }, false, 'setCurrentStyle'),

        setVisualSettings: (settings) =>
          set({ visualSettings: settings }, false, 'setVisualSettings'),

        updateVisualSettings: (updates) =>
          set(
            (state) => ({
              visualSettings: { ...state.visualSettings, ...updates },
            }),
            false,
            'updateVisualSettings'
          ),

        setAspectRatio: (ratio) => set({ aspectRatio: ratio }, false, 'setAspectRatio'),

        setBackgroundAsset: (asset) => set({ backgroundAsset: asset }, false, 'setBackgroundAsset'),

        setLyricEffects: (effects) => set({ lyricEffects: effects }, false, 'setLyricEffects'),

        setBackgroundEffects: (effects) =>
          set({ backgroundEffects: effects }, false, 'setBackgroundEffects'),

        updateLyricEffect: (index, updates) =>
          set(
            (state) => {
              const newEffects = [...state.lyricEffects];
              if (index >= 0 && index < newEffects.length) {
                newEffects[index] = { ...newEffects[index], ...updates };
              }
              return { lyricEffects: newEffects };
            },
            false,
            'updateLyricEffect'
          ),

        updateBackgroundEffect: (index, updates) =>
          set(
            (state) => {
              const newEffects = [...state.backgroundEffects];
              if (index >= 0 && index < newEffects.length) {
                newEffects[index] = { ...newEffects[index], ...updates };
              }
              return { backgroundEffects: newEffects };
            },
            false,
            'updateBackgroundEffect'
          ),

        toggleLyricEffect: (index) =>
          set(
            (state) => {
              const newEffects = [...state.lyricEffects];
              if (index >= 0 && index < newEffects.length) {
                newEffects[index] = {
                  ...newEffects[index],
                  enabled: !newEffects[index].enabled,
                };
              }
              return { lyricEffects: newEffects };
            },
            false,
            'toggleLyricEffect'
          ),

        toggleBackgroundEffect: (index) =>
          set(
            (state) => {
              const newEffects = [...state.backgroundEffects];
              if (index >= 0 && index < newEffects.length) {
                newEffects[index] = {
                  ...newEffects[index],
                  enabled: !newEffects[index].enabled,
                };
              }
              return { backgroundEffects: newEffects };
            },
            false,
            'toggleBackgroundEffect'
          ),

        setDetectedGenre: (genre) => set({ detectedGenre: genre }, false, 'setDetectedGenre'),

        setGenreOverride: (genre) => set({ genreOverride: genre }, false, 'setGenreOverride'),

        toggleLyricsOnlyMode: () =>
          set(
            (state) => ({
              visualSettings: {
                ...state.visualSettings,
                lyricsOnlyMode: !state.visualSettings.lyricsOnlyMode,
              },
            }),
            false,
            'toggleLyricsOnlyMode'
          ),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'visual-settings-storage',
        // Only persist user preferences, not session-specific data
        partialize: (state) => ({
          visualSettings: state.visualSettings,
          aspectRatio: state.aspectRatio,
          currentStyle: state.currentStyle,
        }),
      }
    ),
    { name: 'visual-settings-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveGenre = (state: VisualSettingsStore): Genre | null =>
  state.genreOverride ?? state.detectedGenre;

export const selectHasBackground = (state: VisualSettingsStore): boolean =>
  state.backgroundAsset !== null;

export const selectEnabledLyricEffects = (state: VisualSettingsStore): EffectInstanceConfig[] =>
  state.lyricEffects.filter((effect) => effect.enabled);

export const selectEnabledBackgroundEffects = (
  state: VisualSettingsStore
): EffectInstanceConfig[] => state.backgroundEffects.filter((effect) => effect.enabled);

export const selectEffectCount = (state: VisualSettingsStore): number =>
  state.lyricEffects.length + state.backgroundEffects.length;

export const selectEnabledEffectCount = (state: VisualSettingsStore): number =>
  state.lyricEffects.filter((e) => e.enabled).length +
  state.backgroundEffects.filter((e) => e.enabled).length;
