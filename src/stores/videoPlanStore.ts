/**
 * Video Plan Store
 * Manages video plan state including generation, modification, and history
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  VideoPlan,
  VideoPlanMood,
  VideoPlanColorPalette,
  VideoPlanVisualStyle,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface VideoPlanState {
  // Video plan data
  videoPlan: VideoPlan | null;
  videoPlanHistory: VideoPlan[];

  // UI state
  showPlanPanel: boolean;

  // Loading states
  isGeneratingPlan: boolean;
  regeneratingPeakId: string | null;
  isRegeneratingBackground: boolean;
}

export interface VideoPlanActions {
  // Plan setters
  setVideoPlan: (plan: VideoPlan | null) => void;
  updateVideoPlan: (updates: Partial<VideoPlan>) => void;

  // History management
  pushToHistory: () => void;
  clearHistory: () => void;

  // UI toggles
  setShowPlanPanel: (show: boolean) => void;
  togglePlanPanel: () => void;

  // Loading state setters
  setIsGeneratingPlan: (generating: boolean) => void;
  setRegeneratingPeakId: (peakId: string | null) => void;
  setIsRegeneratingBackground: (regenerating: boolean) => void;

  // Convenience methods for updating plan properties
  updateMood: (mood: VideoPlanMood) => void;
  updateColorPalette: (palette: VideoPlanColorPalette) => void;
  updateVisualStyle: (style: VideoPlanVisualStyle) => void;
  markAsApplied: () => void;

  // Reset
  reset: () => void;
}

export type VideoPlanStore = VideoPlanState & VideoPlanActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: VideoPlanState = {
  videoPlan: null,
  videoPlanHistory: [],
  showPlanPanel: true,
  isGeneratingPlan: false,
  regeneratingPeakId: null,
  isRegeneratingBackground: false,
};

// ============================================================================
// Store
// ============================================================================

export const useVideoPlanStore = create<VideoPlanStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setVideoPlan: (plan) => set({ videoPlan: plan }, false, 'setVideoPlan'),

      updateVideoPlan: (updates) =>
        set(
          (state) => {
            if (!state.videoPlan) return state;
            return {
              videoPlan: { ...state.videoPlan, ...updates },
            };
          },
          false,
          'updateVideoPlan'
        ),

      pushToHistory: () =>
        set(
          (state) => {
            if (!state.videoPlan) return state;
            return {
              videoPlanHistory: [...state.videoPlanHistory, state.videoPlan],
            };
          },
          false,
          'pushToHistory'
        ),

      clearHistory: () => set({ videoPlanHistory: [] }, false, 'clearHistory'),

      setShowPlanPanel: (show) => set({ showPlanPanel: show }, false, 'setShowPlanPanel'),

      togglePlanPanel: () =>
        set((state) => ({ showPlanPanel: !state.showPlanPanel }), false, 'togglePlanPanel'),

      setIsGeneratingPlan: (generating) =>
        set({ isGeneratingPlan: generating }, false, 'setIsGeneratingPlan'),

      setRegeneratingPeakId: (peakId) =>
        set({ regeneratingPeakId: peakId }, false, 'setRegeneratingPeakId'),

      setIsRegeneratingBackground: (regenerating) =>
        set({ isRegeneratingBackground: regenerating }, false, 'setIsRegeneratingBackground'),

      updateMood: (mood) => {
        const { videoPlan, pushToHistory } = get();
        if (!videoPlan) return;
        pushToHistory();
        set(
          { videoPlan: { ...videoPlan, mood, version: videoPlan.version + 1 } },
          false,
          'updateMood'
        );
      },

      updateColorPalette: (colorPalette) => {
        const { videoPlan, pushToHistory } = get();
        if (!videoPlan) return;
        pushToHistory();
        set(
          { videoPlan: { ...videoPlan, colorPalette, version: videoPlan.version + 1 } },
          false,
          'updateColorPalette'
        );
      },

      updateVisualStyle: (visualStyle) => {
        const { videoPlan, pushToHistory } = get();
        if (!videoPlan) return;
        pushToHistory();
        set(
          { videoPlan: { ...videoPlan, visualStyle, version: videoPlan.version + 1 } },
          false,
          'updateVisualStyle'
        );
      },

      markAsApplied: () =>
        set(
          (state) => {
            if (!state.videoPlan) return state;
            return {
              videoPlan: { ...state.videoPlan, status: 'applied' },
            };
          },
          false,
          'markAsApplied'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'video-plan-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectHasVideoPlan = (state: VideoPlanStore): boolean => state.videoPlan !== null;

export const selectVideoPlanStatus = (state: VideoPlanStore): VideoPlan['status'] | null =>
  state.videoPlan?.status ?? null;

export const selectIsVideoPlanApplied = (state: VideoPlanStore): boolean =>
  state.videoPlan?.status === 'applied';

export const selectVideoPlanVersion = (state: VideoPlanStore): number =>
  state.videoPlan?.version ?? 0;

export const selectCanUndoPlan = (state: VideoPlanStore): boolean =>
  state.videoPlanHistory.length > 0;

export const selectIsAnyPlanOperationInProgress = (state: VideoPlanStore): boolean =>
  state.isGeneratingPlan || state.regeneratingPeakId !== null || state.isRegeneratingBackground;
