import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface SlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: string;
}

export const SlideOutPanel: React.FC<SlideOutPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'left',
  width = 'w-80',
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 ${side === 'left' ? 'left-0' : 'right-0'} h-full ${width} bg-black/90 backdrop-blur-2xl border-${side === 'left' ? 'r' : 'l'} border-white/10 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-blue-500/10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-56px)] overflow-y-auto custom-scrollbar p-4">{children}</div>
      </div>
    </>
  );
};

export default SlideOutPanel;
