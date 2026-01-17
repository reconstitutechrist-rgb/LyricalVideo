/**
 * KeyboardShortcuts Component
 * Modal showing available keyboard shortcuts for the app.
 * Triggered by pressing '?' key.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['Shift', '←'], description: 'Seek back 5 seconds' },
      { keys: ['Shift', '→'], description: 'Seek forward 5 seconds' },
      { keys: ['M'], description: 'Toggle mute' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'A'], description: 'Select all lyrics' },
      { keys: ['Escape'], description: 'Clear selection' },
      { keys: ['Delete'], description: 'Delete selected lyrics' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['E'], description: 'Toggle edit mode' },
      { keys: ['T'], description: 'Toggle timeline' },
      { keys: ['W'], description: 'Toggle waveform editor' },
    ],
  },
  {
    title: 'Timeline',
    shortcuts: [
      { keys: ['+'], description: 'Zoom in' },
      { keys: ['-'], description: 'Zoom out' },
      { keys: ['Home'], description: 'Jump to start' },
      { keys: ['End'], description: 'Jump to end' },
    ],
  },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-pink-400 mb-3">{group.title}</h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-slate-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, kidx) => (
                          <React.Fragment key={kidx}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">
                              {key}
                            </kbd>
                            {kidx < shortcut.keys.length - 1 && (
                              <span className="text-slate-500 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">?</kbd> anytime
            to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage keyboard shortcuts modal and global shortcuts
 */
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Listen for '?' key to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    KeyboardShortcutsModal: () => <KeyboardShortcuts isOpen={isOpen} onClose={close} />,
  };
}

export default KeyboardShortcuts;
