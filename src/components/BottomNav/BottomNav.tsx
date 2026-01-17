/**
 * BottomNav Component
 * Mobile-only bottom navigation bar for switching between main app sections.
 * Visible only on xs and sm breakpoints (phones and small tablets).
 */

import React from 'react';
import {
  PlayIcon,
  MusicalNoteIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/solid';
import {
  PlayIcon as PlayOutline,
  MusicalNoteIcon as MusicalNoteOutline,
  SparklesIcon as SparklesOutline,
  ArrowDownTrayIcon as ArrowDownTrayOutline,
} from '@heroicons/react/24/outline';

export type MobileTab = 'preview' | 'lyrics' | 'effects' | 'export';

export interface BottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasAudio?: boolean;
  hasLyrics?: boolean;
  isExporting?: boolean;
}

interface NavItem {
  id: MobileTab;
  label: string;
  IconSolid: React.ComponentType<{ className?: string }>;
  IconOutline: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 'preview',
    label: 'Preview',
    IconSolid: PlayIcon,
    IconOutline: PlayOutline,
  },
  {
    id: 'lyrics',
    label: 'Lyrics',
    IconSolid: MusicalNoteIcon,
    IconOutline: MusicalNoteOutline,
  },
  {
    id: 'effects',
    label: 'Effects',
    IconSolid: SparklesIcon,
    IconOutline: SparklesOutline,
  },
  {
    id: 'export',
    label: 'Export',
    IconSolid: ArrowDownTrayIcon,
    IconOutline: ArrowDownTrayOutline,
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hasAudio = false,
  hasLyrics = false,
  isExporting = false,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 safe-area-pb desktop:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = isActive ? item.IconSolid : item.IconOutline;

          // Determine if tab should be disabled
          const isDisabled =
            (item.id === 'lyrics' && !hasAudio) ||
            (item.id === 'effects' && !hasLyrics) ||
            (item.id === 'export' && isExporting);

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onTabChange(item.id)}
              disabled={isDisabled}
              className={`
                flex flex-col items-center justify-center gap-1 
                min-w-[4.5rem] h-full px-3 py-2
                transition-all duration-200 ease-out
                touch-manipulation
                ${
                  isActive
                    ? 'text-pink-400'
                    : isDisabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 active:text-white active:scale-95'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isDisabled}
            >
              <div
                className={`
                relative p-1.5 rounded-xl transition-all duration-200
                ${isActive ? 'bg-pink-500/20' : ''}
              `}
              >
                <Icon className="w-6 h-6" />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full" />
                )}
              </div>
              <span
                className={`
                text-[10px] font-medium tracking-wide
                ${isActive ? 'text-pink-300' : ''}
              `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Export progress indicator overlay */}
      {isExporting && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            <span className="text-sm text-pink-300 font-medium">Exporting...</span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default BottomNav;
