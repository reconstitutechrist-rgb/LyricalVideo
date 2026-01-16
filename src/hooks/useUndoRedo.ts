/**
 * Undo/Redo Hook
 * Provides keyboard shortcuts and convenience methods for undo/redo
 */

import { useEffect, useCallback } from 'react';
import {
  useHistoryStore,
  selectCanUndo,
  selectCanRedo,
  HistoryDomain,
} from '../stores/historyStore';

interface UseUndoRedoOptions {
  /**
   * Enable keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
   * @default true
   */
  enableKeyboardShortcuts?: boolean;

  /**
   * Filter undo/redo to specific domain
   */
  domain?: HistoryDomain;

  /**
   * Callback when undo is performed
   */
  onUndo?: () => void;

  /**
   * Callback when redo is performed
   */
  onRedo?: () => void;
}

interface UseUndoRedoReturn {
  /**
   * Perform undo
   */
  undo: () => void;

  /**
   * Perform redo
   */
  redo: () => void;

  /**
   * Whether undo is available
   */
  canUndo: boolean;

  /**
   * Whether redo is available
   */
  canRedo: boolean;

  /**
   * Description of the last action (for UI display)
   */
  lastAction: string | null;

  /**
   * Description of the next redo action (for UI display)
   */
  nextRedoAction: string | null;

  /**
   * Number of actions in undo stack
   */
  historyLength: number;

  /**
   * Number of actions in redo stack
   */
  futureLength: number;

  /**
   * Clear all history
   */
  clearHistory: () => void;
}

/**
 * Hook for undo/redo functionality with keyboard shortcuts
 */
export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const { enableKeyboardShortcuts = true, onUndo, onRedo } = options;

  const store = useHistoryStore();
  const canUndo = useHistoryStore(selectCanUndo);
  const canRedo = useHistoryStore(selectCanRedo);

  const undo = useCallback(() => {
    if (store.canUndo()) {
      store.undo();
      onUndo?.();
    }
  }, [store, onUndo]);

  const redo = useCallback(() => {
    if (store.canRedo()) {
      store.redo();
      onRedo?.();
    }
  }, [store, onRedo]);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+Z or Cmd+Z - Undo
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Cmd+Y - Redo (Windows style)
      if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z - Redo (Mac style)
      if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, undo, redo]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction: store.getLastAction(),
    nextRedoAction: store.getNextRedoAction(),
    historyLength: store.past.length,
    futureLength: store.future.length,
    clearHistory: store.clear,
  };
}

export default useUndoRedo;
