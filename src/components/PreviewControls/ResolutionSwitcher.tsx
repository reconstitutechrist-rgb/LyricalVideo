import React, { useState } from 'react';
import {
  ComputerDesktopIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/solid';
import { ExportResolution, AspectRatio } from '../../../types';

interface ResolutionSwitcherProps {
  resolution: ExportResolution;
  onResolutionChange: (resolution: ExportResolution) => void;
  aspectRatio: AspectRatio;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  fitToWindow: boolean;
  onFitToWindowChange: (fit: boolean) => void;
}

const RESOLUTION_OPTIONS: { value: ExportResolution; label: string; multiplier: number }[] = [
  { value: '720p', label: '720p', multiplier: 0.67 },
  { value: '1080p', label: '1080p', multiplier: 1 },
  { value: '4K', label: '4K', multiplier: 2 },
];

const ZOOM_OPTIONS = [25, 50, 75, 100, 150, 200];

// Calculate actual dimensions based on aspect ratio and resolution
const getActualDimensions = (
  aspectRatio: AspectRatio,
  resolution: ExportResolution
): { width: number; height: number } => {
  const baseWidth = 1920;
  const multiplier = RESOLUTION_OPTIONS.find((r) => r.value === resolution)?.multiplier || 1;

  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;

  let width: number, height: number;
  if (ratio >= 1) {
    width = Math.round(baseWidth * multiplier);
    height = Math.round(width / ratio);
  } else {
    height = Math.round(baseWidth * multiplier);
    width = Math.round(height * ratio);
  }

  return { width, height };
};

export const ResolutionSwitcher: React.FC<ResolutionSwitcherProps> = ({
  resolution,
  onResolutionChange,
  aspectRatio,
  zoomLevel,
  onZoomChange,
  fitToWindow,
  onFitToWindowChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dimensions = getActualDimensions(aspectRatio, resolution);

  const handleZoomIn = () => {
    const currentIndex = ZOOM_OPTIONS.indexOf(zoomLevel);
    if (currentIndex < ZOOM_OPTIONS.length - 1) {
      onZoomChange(ZOOM_OPTIONS[currentIndex + 1]);
      onFitToWindowChange(false);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_OPTIONS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_OPTIONS[currentIndex - 1]);
      onFitToWindowChange(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur rounded-lg px-2 py-1 border border-gray-700/50">
      {/* Resolution Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors"
        >
          <ComputerDesktopIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{resolution}</span>
          <span className="text-gray-500">
            ({dimensions.width}x{dimensions.height})
          </span>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
            {RESOLUTION_OPTIONS.map((opt) => {
              const dims = getActualDimensions(aspectRatio, opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onResolutionChange(opt.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-700 transition-colors ${
                    resolution === opt.value ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-gray-500">
                    {dims.width}x{dims.height}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-700" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Zoom out"
          disabled={zoomLevel <= ZOOM_OPTIONS[0]}
        >
          <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onFitToWindowChange(!fitToWindow)}
          className={`px-2 py-0.5 text-xs rounded ${
            fitToWindow ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          {fitToWindow ? 'Fit' : `${zoomLevel}%`}
        </button>

        <button
          onClick={handleZoomIn}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Zoom in"
          disabled={zoomLevel >= ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1]}
        >
          <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ResolutionSwitcher;
