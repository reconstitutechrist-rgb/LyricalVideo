import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { EffectRegistry, EffectMetadata } from '../../effects/core/EffectRegistry';

interface EffectSelectorProps {
  category: 'lyric' | 'background';
  onSelect: (effectId: string) => void;
  activeEffects: string[];
}

export const EffectSelector: React.FC<EffectSelectorProps> = ({
  category,
  onSelect,
  activeEffects,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const effects =
    category === 'lyric' ? EffectRegistry.getLyricEffects() : EffectRegistry.getBackgroundEffects();

  const availableEffects = effects.filter((e) => !activeEffects.includes(e.id));

  const groupedEffects = availableEffects.reduce(
    (acc, effect) => {
      const tags = effect.tags || ['other'];
      const primaryTag = tags[0] || 'other';
      if (!acc[primaryTag]) acc[primaryTag] = [];
      acc[primaryTag].push(effect);
      return acc;
    },
    {} as Record<string, EffectMetadata[]>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
      >
        <PlusIcon className="w-4 h-4" />
        Add Effect
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-2 w-64 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
              <span className="text-xs font-medium text-gray-300">
                Select {category === 'lyric' ? 'Lyric' : 'Background'} Effect
              </span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {availableEffects.length === 0 ? (
              <p className="p-3 text-xs text-gray-500">All effects are active</p>
            ) : (
              <div className="p-2 space-y-2">
                {Object.entries(groupedEffects).map(([group, groupEffects]) => (
                  <div key={group}>
                    <p className="text-[10px] uppercase text-gray-500 mb-1 px-1">{group}</p>
                    {groupEffects.map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          onSelect(effect.id);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <div className="font-medium">{effect.name}</div>
                        {effect.description && (
                          <div className="text-[10px] text-gray-500">{effect.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
