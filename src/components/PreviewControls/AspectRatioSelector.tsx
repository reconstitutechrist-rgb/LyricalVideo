import React, { useState } from 'react';
import { AspectRatio } from '../../../types';

interface AspectRatioSelectorProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (aspectRatio: AspectRatio) => void;
  compact?: boolean;
}

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  platform: string;
  icon: 'landscape' | 'portrait' | 'square' | 'ultrawide';
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: '16:9', label: '16:9', platform: 'YouTube, TV', icon: 'landscape' },
  { value: '9:16', label: '9:16', platform: 'TikTok, Reels', icon: 'portrait' },
  { value: '1:1', label: '1:1', platform: 'Instagram', icon: 'square' },
  { value: '4:3', label: '4:3', platform: 'Classic', icon: 'landscape' },
  { value: '3:4', label: '3:4', platform: 'Portrait', icon: 'portrait' },
  { value: '2:3', label: '2:3', platform: 'Pinterest', icon: 'portrait' },
  { value: '3:2', label: '3:2', platform: 'Photo', icon: 'landscape' },
  { value: '21:9', label: '21:9', platform: 'Cinematic', icon: 'ultrawide' },
];

// Visual aspect ratio preview box
const AspectRatioIcon: React.FC<{ ratio: AspectRatio; size?: number; active?: boolean }> = ({
  ratio,
  size = 24,
  active = false,
}) => {
  const [w, h] = ratio.split(':').map(Number);
  const aspectValue = w / h;

  let width: number, height: number;
  if (aspectValue >= 1) {
    width = size;
    height = size / aspectValue;
  } else {
    height = size;
    width = size * aspectValue;
  }

  return (
    <div
      className={`rounded-sm border-2 transition-colors ${
        active ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-500 bg-gray-700'
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  aspectRatio,
  onAspectRatioChange,
  compact = false,
}) => {
  const [showGrid, setShowGrid] = useState(false);
  const currentOption = ASPECT_RATIO_OPTIONS.find((o) => o.value === aspectRatio);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-colors"
        >
          <AspectRatioIcon ratio={aspectRatio} size={20} active />
          <span className="text-sm text-gray-300">{aspectRatio}</span>
        </button>

        {showGrid && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
            <div className="grid grid-cols-4 gap-2">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onAspectRatioChange(opt.value);
                    setShowGrid(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                    aspectRatio === opt.value
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'bg-gray-900/40 border border-transparent hover:border-gray-600'
                  }`}
                  title={opt.platform}
                >
                  <AspectRatioIcon ratio={opt.value} size={28} active={aspectRatio === opt.value} />
                  <span className="text-xs text-gray-400">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Aspect Ratio</span>
        <span className="text-xs text-gray-500">{currentOption?.platform}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ASPECT_RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAspectRatioChange(opt.value)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
              aspectRatio === opt.value
                ? 'bg-cyan-500/20 border border-cyan-500/50'
                : 'bg-gray-800/60 border border-gray-700/30 hover:border-gray-600'
            }`}
            title={opt.platform}
          >
            <AspectRatioIcon ratio={opt.value} size={32} active={aspectRatio === opt.value} />
            <div className="text-center">
              <div
                className={`text-xs font-medium ${aspectRatio === opt.value ? 'text-cyan-400' : 'text-gray-300'}`}
              >
                {opt.label}
              </div>
              <div className="text-[10px] text-gray-500 truncate max-w-[60px]">{opt.platform}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
