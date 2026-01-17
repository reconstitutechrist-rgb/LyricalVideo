/**
 * UI Mode Store
 * Manages Simple/Advanced mode toggle for the UI
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface UIModeState {
  /** Whether advanced mode is enabled (false = simple mode) */
  isAdvancedMode: boolean;
  /** Track if user has ever seen advanced mode (for onboarding) */
  hasSeenAdvancedMode: boolean;
}

export interface UIModeActions {
  /** Toggle between simple and advanced mode */
  toggleMode: () => void;
  /** Set mode explicitly */
  setAdvancedMode: (advanced: boolean) => void;
  /** Mark that user has viewed advanced mode */
  markAdvancedModeViewed: () => void;
  /** Reset to defaults */
  reset: () => void;
}

export type UIModeStore = UIModeState & UIModeActions;

// ============================================================================
// Default Values
// ============================================================================

const initialState: UIModeState = {
  isAdvancedMode: false, // Default to Simple Mode for new users
  hasSeenAdvancedMode: false,
};

// ============================================================================
// Store
// ============================================================================

export const useUIModeStore = create<UIModeStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        toggleMode: () =>
          set(
            (state) => {
              const newMode = !state.isAdvancedMode;
              return {
                isAdvancedMode: newMode,
                // Mark as seen when entering advanced mode
                hasSeenAdvancedMode: state.hasSeenAdvancedMode || newMode,
              };
            },
            false,
            'toggleMode'
          ),

        setAdvancedMode: (advanced) =>
          set(
            (state) => ({
              isAdvancedMode: advanced,
              hasSeenAdvancedMode: state.hasSeenAdvancedMode || advanced,
            }),
            false,
            'setAdvancedMode'
          ),

        markAdvancedModeViewed: () =>
          set({ hasSeenAdvancedMode: true }, false, 'markAdvancedModeViewed'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'ui-mode-storage',
      }
    ),
    { name: 'ui-mode-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsAdvancedMode = (state: UIModeStore): boolean => state.isAdvancedMode;

export const selectIsSimpleMode = (state: UIModeStore): boolean => !state.isAdvancedMode;

export const selectHasSeenAdvancedMode = (state: UIModeStore): boolean => state.hasSeenAdvancedMode;
