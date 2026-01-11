import React from 'react';
import { FilmIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { BackgroundStrategy, GeneratedAsset } from '../../../types';

interface BackgroundStrategyCardProps {
  strategy: BackgroundStrategy;
  sharedBackground: GeneratedAsset | null;
  onToggleType: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const BackgroundStrategyCard: React.FC<BackgroundStrategyCardProps> = ({
  strategy,
  sharedBackground,
  onToggleType,
  onRegenerate,
  isRegenerating,
}) => {
  const Icon = strategy.useVideo ? FilmIcon : PhotoIcon;
  const iconColor = strategy.useVideo ? 'text-purple-400' : 'text-blue-400';
  const typeLabel = strategy.useVideo ? 'Motion Video' : 'Static Image';

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          Background ({typeLabel})
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleType}
            disabled={isRegenerating}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
            title={strategy.useVideo ? 'Switch to static image' : 'Switch to motion video'}
          >
            {strategy.useVideo ? 'Use Image' : 'Use Video'}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
            title="Regenerate background"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Preview */}
        {sharedBackground ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 mb-3">
            {sharedBackground.type === 'video' ? (
              <video
                src={sharedBackground.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={sharedBackground.url}
                alt="Background preview"
                className="w-full h-full object-cover"
              />
            )}
            {isRegenerating && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <ArrowPathIcon className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-gray-900 flex items-center justify-center mb-3">
            {isRegenerating ? (
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {strategy.useVideo ? 'Generating video (1-2 min)...' : 'Generating image...'}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No background generated</p>
                <button
                  onClick={onRegenerate}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                >
                  Generate now
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Reasoning */}
        <div className="text-xs text-gray-400 border-l-2 border-gray-600 pl-2 italic">
          {strategy.reasoning}
        </div>
      </div>
    </div>
  );
};
