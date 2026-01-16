/**
 * TemplateSelector Component
 * Provides a modal for selecting project templates with genre-based presets.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { XMarkIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { PROJECT_TEMPLATES, GENRE_LIST, ProjectTemplate } from './templates';
import { useVisualSettingsStore } from '../../stores';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (template: ProjectTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onApply }) => {
  const [selectedGenre, setSelectedGenre] = useState<string | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const visualSettingsStore = useVisualSettingsStore();

  // Filter templates by genre
  const filteredTemplates = useMemo(() => {
    if (selectedGenre === 'all') return PROJECT_TEMPLATES;
    return PROJECT_TEMPLATES.filter((t) => t.genre === selectedGenre);
  }, [selectedGenre]);

  // Apply template to visual settings
  const handleApply = useCallback(() => {
    if (!selectedTemplate) return;

    // Apply visual settings from template
    visualSettingsStore.setCurrentStyle(selectedTemplate.visualStyle);
    visualSettingsStore.updateVisualSettings({
      palette: selectedTemplate.palette,
      // Map particlesEnabled to particleSpeed (0 = disabled, 1.0 = enabled)
      particleSpeed: selectedTemplate.particlesEnabled ? 1.0 : 0,
      intensity: selectedTemplate.glowIntensity,
      dynamicBackgroundOpacity: selectedTemplate.backgroundOpacity < 1,
    });

    // Call optional callback
    onApply?.(selectedTemplate);

    // Close modal
    onClose();
  }, [selectedTemplate, visualSettingsStore, onApply, onClose]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && selectedTemplate) handleApply();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedTemplate, handleApply]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-pink-400" />
            <h2 className="text-lg font-bold text-white">Project Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Tabs */}
        <div className="px-6 py-3 border-b border-white/5 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedGenre === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {GENRE_LIST.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                isHovered={hoveredTemplate === template.id}
                onSelect={() => setSelectedTemplate(template)}
                onHover={() => setHoveredTemplate(template.id)}
                onHoverEnd={() => setHoveredTemplate(null)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0 bg-slate-800/50">
          <p className="text-sm text-slate-400">
            {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'Select a template to apply'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTemplate}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                selectedTemplate
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual template card component
 */
interface TemplateCardProps {
  template: ProjectTemplate;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onHoverEnd,
}) => {
  // Generate gradient preview from template colors
  const gradientPreview = useMemo(() => {
    return `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})`;
  }, [template.colors]);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={`relative group text-left rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isSelected
          ? 'border-pink-500 ring-2 ring-pink-500/30 scale-[1.02]'
          : isHovered
            ? 'border-white/20 scale-[1.01]'
            : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Color Preview */}
      <div
        className="h-24 relative"
        style={{
          background: gradientPreview,
          backgroundColor: template.colors.background,
        }}
      >
        {/* Sample text preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold drop-shadow-lg"
            style={{ color: template.colors.text }}
          >
            {template.thumbnail}
          </span>
        </div>

        {/* Particles overlay if enabled */}
        {template.particlesEnabled && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/60 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3" style={{ backgroundColor: template.colors.background }}>
        <h3 className="font-semibold text-sm mb-0.5" style={{ color: template.colors.text }}>
          {template.name}
        </h3>
        <p className="text-xs opacity-70 line-clamp-2" style={{ color: template.colors.text }}>
          {template.description}
        </p>
        <span
          className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium opacity-80"
          style={{
            backgroundColor: template.colors.primary + '20',
            color: template.colors.primary,
          }}
        >
          {template.genre}
        </span>
      </div>
    </button>
  );
};

/**
 * Hook to manage template selector modal state
 */
export function useTemplateSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastApplied, setLastApplied] = useState<ProjectTemplate | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleApply = useCallback((template: ProjectTemplate) => {
    setLastApplied(template);
  }, []);

  return {
    isOpen,
    open,
    close,
    lastApplied,
    TemplateSelectorModal: () => (
      <TemplateSelector isOpen={isOpen} onClose={close} onApply={handleApply} />
    ),
  };
}

export default TemplateSelector;
