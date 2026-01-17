import React from 'react';
import { VideoPlanEffect } from '../../../types';
import { BoltIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface PlanEffectCardProps {
  effect: VideoPlanEffect;
  type: 'background' | 'lyric';
}

export const PlanEffectCard: React.FC<PlanEffectCardProps> = ({ effect, type }) => {
  const Icon = type === 'background' ? PhotoIcon : BoltIcon;
  const iconColor = type === 'background' ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-750">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-medium text-gray-200">{effect.name}</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-400 mb-2">{effect.description}</p>
        {effect.reason && (
          <div className="text-xs text-gray-500 italic border-l-2 border-gray-600 pl-2">
            {effect.reason}
          </div>
        )}
      </div>
    </div>
  );
};
