import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { useUIModeStore, selectIsAdvancedMode } from '../../stores/uiModeStore';

interface CollapsibleSectionProps {
  title: string;
  storageKey?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** If true, section is hidden in Simple Mode */
  requiresAdvancedMode?: boolean;
  /** Optional fallback content to show in Simple Mode */
  simpleModeFallback?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  storageKey,
  defaultOpen = false,
  children,
  requiresAdvancedMode = false,
  simpleModeFallback,
}) => {
  // All hooks must be called before any conditional returns (Rules of Hooks)
  const isAdvancedMode = useUIModeStore(selectIsAdvancedMode);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Initialize from localStorage if storageKey provided
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultOpen;
  });

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  // Persist state to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(isOpen));
    }
  }, [isOpen, storageKey]);

  const toggle = () => setIsOpen(!isOpen);

  // Hide section in Simple Mode if it requires Advanced Mode
  if (requiresAdvancedMode && !isAdvancedMode) {
    if (simpleModeFallback) {
      return <>{simpleModeFallback}</>;
    }
    return null;
  }

  return (
    <div className="collapsible-section">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 py-2 px-1 text-[9px] font-medium text-cyan-400/70 hover:text-cyan-400 transition-colors group"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${storageKey || title}`}
      >
        <ChevronRightIcon
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className="uppercase tracking-wider">{title}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent ml-2" />
      </button>

      <div
        id={`collapsible-content-${storageKey || title}`}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pt-1 pb-2 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
