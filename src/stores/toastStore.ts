/**
 * Toast Store
 * Manages toast notifications for user-facing messages
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastState {
  toasts: Toast[];
}

export interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;

  // Convenience methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

export type ToastStore = ToastState & ToastActions;

// ============================================================================
// Helpers
// ============================================================================

let toastCounter = 0;
const generateId = () => `toast-${++toastCounter}-${Date.now()}`;

// Default durations by type (ms)
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

// ============================================================================
// Store
// ============================================================================

export const useToastStore = create<ToastStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      toasts: [],

      // Actions
      addToast: (toastConfig) => {
        const id = generateId();
        const toast: Toast = {
          id,
          dismissible: true,
          duration: DEFAULT_DURATIONS[toastConfig.type],
          ...toastConfig,
        };

        set((state) => ({ toasts: [...state.toasts, toast] }), false, 'addToast');

        // Auto-dismiss after duration (if not persistent)
        if (toast.duration && toast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration);
        }

        return id;
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }), false, 'removeToast'),

      clearAllToasts: () => set({ toasts: [] }, false, 'clearAllToasts'),

      // Convenience methods
      success: (title, message) => get().addToast({ type: 'success', title, message }),

      error: (title, message) => get().addToast({ type: 'error', title, message }),

      warning: (title, message) => get().addToast({ type: 'warning', title, message }),

      info: (title, message) => get().addToast({ type: 'info', title, message }),
    }),
    { name: 'toast-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectToastCount = (state: ToastStore): number => state.toasts.length;

export const selectHasToasts = (state: ToastStore): boolean => state.toasts.length > 0;

// ============================================================================
// Global toast function (for use outside React components)
// ============================================================================

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().success(title, message),
  error: (title: string, message?: string) => useToastStore.getState().error(title, message),
  warning: (title: string, message?: string) => useToastStore.getState().warning(title, message),
  info: (title: string, message?: string) => useToastStore.getState().info(title, message),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  dismissAll: () => useToastStore.getState().clearAllToasts(),
};
