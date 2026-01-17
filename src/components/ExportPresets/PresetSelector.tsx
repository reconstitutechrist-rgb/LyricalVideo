import React, { useState, useMemo } from 'react';
import {
  exportPresetsService,
  ExportPreset,
  CustomExportPreset,
} from '../../../services/exportPresets';
import { ExportSettings, AspectRatio } from '../../../types';

// Platform icons as simple SVG components
const PlatformIcons: Record<string, React.FC<{ className?: string }>> = {
  YouTube: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  Instagram: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  TikTok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  Twitter: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Facebook: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  LinkedIn: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Custom: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  ),
};

interface PresetSelectorProps {
  currentSettings: ExportSettings;
  currentAspectRatio: AspectRatio;
  onSelectPreset: (preset: ExportPreset | CustomExportPreset) => void;
  onSaveCustomPreset?: (name: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentSettings,
  currentAspectRatio,
  onSelectPreset,
  onSaveCustomPreset,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Group presets by platform
  const presetsByPlatform = useMemo(() => exportPresetsService.getPresetsByPlatform(), []);
  const customPresets = useMemo(() => exportPresetsService.getCustomPresets(), []);
  const platforms = useMemo(() => Object.keys(presetsByPlatform), [presetsByPlatform]);

  // Find currently matching preset
  const matchingPreset = useMemo(
    () => exportPresetsService.findMatchingPreset(currentSettings, currentAspectRatio),
    [currentSettings, currentAspectRatio]
  );

  const handleSavePreset = () => {
    if (customPresetName.trim() && onSaveCustomPreset) {
      onSaveCustomPreset(customPresetName.trim());
      setCustomPresetName('');
      setShowSaveDialog(false);
    }
  };

  const getResolutionDimensions = (preset: ExportPreset): string => {
    const aspectMap: Record<AspectRatio, { w: number; h: number }> = {
      '16:9': { w: 1920, h: 1080 },
      '9:16': { w: 1080, h: 1920 },
      '1:1': { w: 1080, h: 1080 },
      '4:3': { w: 1440, h: 1080 },
      '3:4': { w: 1080, h: 1440 },
      '2:3': { w: 1080, h: 1620 },
      '3:2': { w: 1620, h: 1080 },
      '21:9': { w: 2560, h: 1080 },
    };
    const base = aspectMap[preset.aspectRatio] || { w: 1920, h: 1080 };
    const scale = preset.resolution === '4K' ? 2 : preset.resolution === '720p' ? 0.67 : 1;
    return `${Math.round(base.w * scale)}x${Math.round(base.h * scale)}`;
  };

  return (
    <div className="space-y-4">
      {/* Platform Quick Select */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => {
          const Icon = PlatformIcons[platform] || PlatformIcons.Custom;
          const isSelected = selectedPlatform === platform;
          const hasMatch = presetsByPlatform[platform].some((p) => p.id === matchingPreset?.id);

          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(isSelected ? null : platform)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : hasMatch
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-gray-800/60 border-gray-700/50 text-gray-300 hover:border-gray-600'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{platform}</span>
            </button>
          );
        })}

        {/* Custom presets button */}
        {customPresets.length > 0 && (
          <button
            onClick={() => setSelectedPlatform(selectedPlatform === 'Custom' ? null : 'Custom')}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
              ${
                selectedPlatform === 'Custom'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-gray-800/60 border-gray-700/50 text-gray-300 hover:border-gray-600'
              }
            `}
          >
            <PlatformIcons.Custom className="w-4 h-4" />
            <span className="text-sm font-medium">Custom ({customPresets.length})</span>
          </button>
        )}
      </div>

      {/* Preset Options for Selected Platform */}
      {selectedPlatform && selectedPlatform !== 'Custom' && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
          {presetsByPlatform[selectedPlatform]?.map((preset) => {
            const isActive = matchingPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-gray-900/40 border-gray-700/30 hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-cyan-400' : 'text-gray-200'}`}
                  >
                    {preset.name}
                  </span>
                  {isActive && <span className="text-xs text-cyan-400">Active</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {getResolutionDimensions(preset)} @ {preset.framerate}fps
                </div>
                {preset.description && (
                  <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Presets */}
      {selectedPlatform === 'Custom' && (
        <div className="space-y-2 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
          {customPresets.map((preset) => {
            const isActive = matchingPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${
                    isActive
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-gray-900/40 border-gray-700/30 hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-purple-400' : 'text-gray-200'}`}
                  >
                    {preset.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {preset.aspectRatio} • {preset.resolution}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Preset Indicator / Save Button */}
      <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-lg border border-gray-700/30">
        {matchingPreset ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-gray-300">
              Using <span className="text-green-400 font-medium">{matchingPreset.name}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="text-sm text-gray-400">Custom settings</span>
          </div>
        )}

        {onSaveCustomPreset && !matchingPreset && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors"
          >
            Save as Preset
          </button>
        )}
      </div>

      {/* Save Custom Preset Dialog */}
      {showSaveDialog && (
        <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/30 space-y-3">
          <div className="text-sm font-medium text-gray-200">Save Custom Preset</div>
          <input
            type="text"
            value={customPresetName}
            onChange={(e) => setCustomPresetName(e.target.value)}
            placeholder="Preset name..."
            className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSavePreset}
              disabled={!customPresetName.trim()}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setCustomPresetName('');
              }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
