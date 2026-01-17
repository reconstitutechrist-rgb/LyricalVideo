/**
 * Export Store
 * Manages export settings, progress, and recording state with partial persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  ExportSettings,
  ExportProgress,
  ExportResolution,
  ExportFramerate,
  ExportQuality,
  ExportFormat,
  DEFAULT_EXPORT_SETTINGS,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ExportState {
  // Export settings (persisted)
  settings: ExportSettings;

  // Export progress (session-only)
  progress: ExportProgress | null;
  isRecording: boolean;

  // UI state
  showExportSettings: boolean;
}

export interface ExportActions {
  // Settings
  setSettings: (settings: ExportSettings) => void;
  updateSetting: <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => void;
  setResolution: (resolution: ExportResolution) => void;
  setFramerate: (framerate: ExportFramerate) => void;
  setQuality: (quality: ExportQuality) => void;
  setFormat: (format: ExportFormat) => void;

  // Progress
  setProgress: (progress: ExportProgress | null) => void;
  updateProgress: (updates: Partial<ExportProgress>) => void;

  // Recording
  setIsRecording: (recording: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;

  // UI
  setShowExportSettings: (show: boolean) => void;
  toggleExportSettings: () => void;

  // Reset
  resetProgress: () => void;
  resetSettings: () => void;
  reset: () => void;
}

export type ExportStore = ExportState & ExportActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ExportState = {
  settings: DEFAULT_EXPORT_SETTINGS,
  progress: null,
  isRecording: false,
  showExportSettings: false,
};

// ============================================================================
// Store
// ============================================================================

export const useExportStore = create<ExportStore>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        ...initialState,

        // Actions
        setSettings: (settings) => set({ settings }, false, 'setSettings'),

        updateSetting: (key, value) =>
          set(
            (state) => ({
              settings: { ...state.settings, [key]: value },
            }),
            false,
            'updateSetting'
          ),

        setResolution: (resolution) =>
          set(
            (state) => ({
              settings: { ...state.settings, resolution },
            }),
            false,
            'setResolution'
          ),

        setFramerate: (framerate) =>
          set(
            (state) => ({
              settings: { ...state.settings, framerate },
            }),
            false,
            'setFramerate'
          ),

        setQuality: (quality) =>
          set(
            (state) => ({
              settings: { ...state.settings, quality },
            }),
            false,
            'setQuality'
          ),

        setFormat: (format) =>
          set(
            (state) => ({
              settings: { ...state.settings, format },
            }),
            false,
            'setFormat'
          ),

        setProgress: (progress) => set({ progress }, false, 'setProgress'),

        updateProgress: (updates) =>
          set(
            (state) => ({
              progress: state.progress ? { ...state.progress, ...updates } : null,
            }),
            false,
            'updateProgress'
          ),

        setIsRecording: (recording) => set({ isRecording: recording }, false, 'setIsRecording'),

        startRecording: () =>
          set(
            {
              isRecording: true,
              progress: { stage: 'recording', percent: 0, message: 'Starting recording...' },
            },
            false,
            'startRecording'
          ),

        stopRecording: () =>
          set(
            (state) => ({
              isRecording: false,
              progress: state.progress
                ? { ...state.progress, stage: 'processing', message: 'Processing...' }
                : null,
            }),
            false,
            'stopRecording'
          ),

        setShowExportSettings: (show) =>
          set({ showExportSettings: show }, false, 'setShowExportSettings'),

        toggleExportSettings: () =>
          set(
            (state) => ({ showExportSettings: !state.showExportSettings }),
            false,
            'toggleExportSettings'
          ),

        resetProgress: () => set({ progress: null, isRecording: false }, false, 'resetProgress'),

        resetSettings: () => set({ settings: DEFAULT_EXPORT_SETTINGS }, false, 'resetSettings'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'export-settings-storage',
        // Only persist user preferences (export settings), not session state
        partialize: (state) => ({
          settings: state.settings,
        }),
      }
    ),
    { name: 'export-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsExporting = (state: ExportStore): boolean =>
  state.isRecording || (state.progress !== null && state.progress.stage !== 'complete');

export const selectExportStage = (state: ExportStore): ExportProgress['stage'] | null =>
  state.progress?.stage ?? null;

export const selectExportPercent = (state: ExportStore): number => state.progress?.percent ?? 0;

export const selectIsExportComplete = (state: ExportStore): boolean =>
  state.progress?.stage === 'complete';

export const selectExportResolution = (state: ExportStore): ExportResolution =>
  state.settings.resolution;

export const selectExportFormat = (state: ExportStore): ExportFormat => state.settings.format;

// Helper to get resolution dimensions
export const getResolutionDimensions = (
  resolution: ExportResolution
): { width: number; height: number } => {
  switch (resolution) {
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '4K':
      return { width: 3840, height: 2160 };
    default:
      return { width: 1920, height: 1080 };
  }
};
