/**
 * ModeToggle Component
 * Toggle switch between Simple and Advanced UI modes
 */

import React from 'react';
import { useUIModeStore, selectIsAdvancedMode } from '../../stores/uiModeStore';
import { CogIcon, SparklesIcon } from '@heroicons/react/24/solid';

export interface ModeToggleProps {
  /** Optional className for the wrapper */
  className?: string;
  /** Show labels next to toggle */
  showLabels?: boolean;
  /** Compact mode (smaller size) */
  compact?: boolean;
}

/**
 * ModeToggle provides a visual toggle switch between Simple and Advanced modes.
 * Simple mode: Cleaner UI with essential controls only
 * Advanced mode: Full access to all features and settings
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({
  className = '',
  showLabels = true,
  compact = false,
}) => {
  const isAdvancedMode = useUIModeStore(selectIsAdvancedMode);
  const toggleMode = useUIModeStore((state) => state.toggleMode);

  const handleToggle = () => {
    toggleMode();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMode();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label="UI mode selection"
    >
      {showLabels && (
        <span
          className={`text-[10px] font-medium transition-colors ${
            !isAdvancedMode ? 'text-cyan-400' : 'text-gray-500'
          } ${compact ? 'hidden sm:inline' : ''}`}
        >
          Simple
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isAdvancedMode}
        aria-label={`Switch to ${isAdvancedMode ? 'simple' : 'advanced'} mode`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center
          ${compact ? 'h-5 w-10' : 'h-6 w-12'}
          rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${isAdvancedMode ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'bg-gray-600'}
        `}
        title={
          isAdvancedMode
            ? 'Advanced Mode: All features visible. Click to simplify.'
            : 'Simple Mode: Essential features only. Click to show all.'
        }
      >
        <span
          className={`
            inline-flex items-center justify-center
            ${compact ? 'h-4 w-4' : 'h-5 w-5'}
            transform rounded-full bg-white shadow-lg
            transition-transform duration-200 ease-in-out
            ${isAdvancedMode ? (compact ? 'translate-x-5' : 'translate-x-6') : 'translate-x-0.5'}
          `}
        >
          {isAdvancedMode ? (
            <CogIcon className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-purple-600`} />
          ) : (
            <SparklesIcon className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-cyan-500`} />
          )}
        </span>
      </button>

      {showLabels && (
        <span
          className={`text-[10px] font-medium transition-colors ${
            isAdvancedMode ? 'text-purple-400' : 'text-gray-500'
          } ${compact ? 'hidden sm:inline' : ''}`}
        >
          Advanced
        </span>
      )}
    </div>
  );
};

export default ModeToggle;
