/**
 * History Store
 * Implements undo/redo functionality using command pattern
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type HistoryDomain = 'lyrics' | 'effects' | 'settings' | 'general';

export interface HistoryEntry {
  id: string;
  domain: HistoryDomain;
  action: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
  description?: string;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;
  isUndoing: boolean;
  isRedoing: boolean;
}

export interface HistoryActions {
  /**
   * Push a new undoable action to history
   * Clears the future stack (redo history)
   */
  push: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;

  /**
   * Undo the last action
   */
  undo: () => void;

  /**
   * Redo the last undone action
   */
  redo: () => void;

  /**
   * Check if undo is available
   */
  canUndo: () => boolean;

  /**
   * Check if redo is available
   */
  canRedo: () => boolean;

  /**
   * Clear all history
   */
  clear: () => void;

  /**
   * Clear history for a specific domain
   */
  clearDomain: (domain: HistoryDomain) => void;

  /**
   * Get the last action description
   */
  getLastAction: () => string | null;

  /**
   * Get the next redo action description
   */
  getNextRedoAction: () => string | null;

  /**
   * Set max history size
   */
  setMaxHistory: (max: number) => void;
}

export type HistoryStore = HistoryState & HistoryActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: HistoryState = {
  past: [],
  future: [],
  maxHistory: 100,
  isUndoing: false,
  isRedoing: false,
};

// ============================================================================
// Utilities
// ============================================================================

let entryIdCounter = 0;

function generateEntryId(): string {
  return `history_${Date.now()}_${++entryIdCounter}`;
}

// ============================================================================
// Store
// ============================================================================

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      push: (entry) => {
        const { past, maxHistory, isUndoing, isRedoing } = get();

        // Don't record actions during undo/redo operations
        if (isUndoing || isRedoing) {
          return;
        }

        const newEntry: HistoryEntry = {
          ...entry,
          id: generateEntryId(),
          timestamp: Date.now(),
        };

        // Trim history if exceeding max
        const newPast = [...past, newEntry];
        if (newPast.length > maxHistory) {
          newPast.shift();
        }

        set(
          {
            past: newPast,
            future: [], // Clear redo stack on new action
          },
          false,
          'push'
        );
      },

      undo: () => {
        const { past, future, isUndoing, isRedoing } = get();

        if (past.length === 0 || isUndoing || isRedoing) {
          return;
        }

        const lastEntry = past[past.length - 1];

        set({ isUndoing: true }, false, 'undo:start');

        try {
          // Execute the undo operation
          lastEntry.undo();

          // Only modify stacks after successful undo
          const newPast = past.slice(0, -1);
          set(
            {
              past: newPast,
              future: [lastEntry, ...future],
              isUndoing: false,
            },
            false,
            'undo:complete'
          );
        } catch (error) {
          console.error('Undo failed:', error);
          // Keep stacks unchanged on error - entry is not lost
          set({ isUndoing: false }, false, 'undo:error');
        }
      },

      redo: () => {
        const { past, future, isUndoing, isRedoing } = get();

        if (future.length === 0 || isUndoing || isRedoing) {
          return;
        }

        const nextEntry = future[0];

        set({ isRedoing: true }, false, 'redo:start');

        try {
          // Execute the redo operation
          nextEntry.redo();

          // Only modify stacks after successful redo
          const newFuture = future.slice(1);
          set(
            {
              past: [...past, nextEntry],
              future: newFuture,
              isRedoing: false,
            },
            false,
            'redo:complete'
          );
        } catch (error) {
          console.error('Redo failed:', error);
          // Keep stacks unchanged on error - entry is not lost
          set({ isRedoing: false }, false, 'redo:error');
        }
      },

      canUndo: () => {
        const { past, isUndoing, isRedoing } = get();
        return past.length > 0 && !isUndoing && !isRedoing;
      },

      canRedo: () => {
        const { future, isUndoing, isRedoing } = get();
        return future.length > 0 && !isUndoing && !isRedoing;
      },

      clear: () => {
        set({ past: [], future: [] }, false, 'clear');
      },

      clearDomain: (domain) => {
        const { past, future } = get();
        set(
          {
            past: past.filter((e) => e.domain !== domain),
            future: future.filter((e) => e.domain !== domain),
          },
          false,
          `clearDomain:${domain}`
        );
      },

      getLastAction: () => {
        const { past } = get();
        if (past.length === 0) return null;
        const last = past[past.length - 1];
        return last.description || last.action;
      },

      getNextRedoAction: () => {
        const { future } = get();
        if (future.length === 0) return null;
        const next = future[0];
        return next.description || next.action;
      },

      setMaxHistory: (max) => {
        const { past } = get();
        const newPast = past.length > max ? past.slice(-max) : past;
        set({ maxHistory: max, past: newPast }, false, 'setMaxHistory');
      },
    }),
    { name: 'history-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectCanUndo = (state: HistoryStore): boolean =>
  state.past.length > 0 && !state.isUndoing && !state.isRedoing;

export const selectCanRedo = (state: HistoryStore): boolean =>
  state.future.length > 0 && !state.isUndoing && !state.isRedoing;

export const selectHistoryLength = (state: HistoryStore): number => state.past.length;

export const selectFutureLength = (state: HistoryStore): number => state.future.length;

// ============================================================================
// Helper: Create undoable action wrapper
// ============================================================================

/**
 * Creates an undoable action that automatically records to history
 *
 * @example
 * const updateLyrics = createUndoableAction(
 *   'lyrics',
 *   'Update lyric text',
 *   () => {
 *     const previous = getLyrics();
 *     return {
 *       execute: () => setLyrics(newLyrics),
 *       undo: () => setLyrics(previous),
 *     };
 *   }
 * );
 */
export function createUndoableAction<T>(
  domain: HistoryDomain,
  action: string,
  actionCreator: () => { execute: () => T; undo: () => void; description?: string }
): () => T {
  return () => {
    const { execute, undo, description } = actionCreator();
    const result = execute();

    useHistoryStore.getState().push({
      domain,
      action,
      description,
      undo,
      redo: execute,
    });

    return result;
  };
}

/**
 * Wraps an existing setter to make it undoable
 *
 * @example
 * const [text, setText] = useState('');
 * const setTextUndoable = makeUndoable('lyrics', 'Change text', text, setText);
 */
export function makeUndoable<T>(
  domain: HistoryDomain,
  action: string,
  getCurrentValue: () => T,
  setValue: (value: T) => void
): (newValue: T) => void {
  return (newValue: T) => {
    const previousValue = getCurrentValue();

    // Don't record if value hasn't changed
    if (previousValue === newValue) {
      return;
    }

    setValue(newValue);

    useHistoryStore.getState().push({
      domain,
      action,
      undo: () => setValue(previousValue),
      redo: () => setValue(newValue),
    });
  };
}
