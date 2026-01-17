import React, { useCallback } from 'react';
import { SparklesIcon, FilmIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { EffectInstanceConfig, Genre } from '../../../types';
import { EffectRegistry } from '../../effects/core/EffectRegistry';
import { getDefaultValues } from '../../effects/core/ParameterTypes';
import { EffectCard } from './EffectCard';
import { EffectSelector } from './EffectSelector';
import { GenreSelector } from './GenreSelector';
import { useVisualSettingsStore } from '../../stores';

interface EffectPanelProps {
  // Optional props - will use visual settings store if not provided
  lyricEffects?: EffectInstanceConfig[];
  backgroundEffects?: EffectInstanceConfig[];
  detectedGenre?: Genre | null;
  genreOverride?: Genre | null;
  onLyricEffectsChange?: (effects: EffectInstanceConfig[]) => void;
  onBackgroundEffectsChange?: (effects: EffectInstanceConfig[]) => void;
  onGenreOverride?: (genre: Genre | null) => void;
  // Required props (session-specific)
  genreConfidence: number;
  isDetectingGenre: boolean;
}

export const EffectPanel: React.FC<EffectPanelProps> = ({
  lyricEffects: lyricEffectsProp,
  backgroundEffects: backgroundEffectsProp,
  detectedGenre: detectedGenreProp,
  genreConfidence,
  genreOverride: genreOverrideProp,
  isDetectingGenre,
  onLyricEffectsChange: onLyricEffectsChangeProp,
  onBackgroundEffectsChange: onBackgroundEffectsChangeProp,
  onGenreOverride: onGenreOverrideProp,
}) => {
  // Use visual settings store values with props as override
  const visualSettingsStore = useVisualSettingsStore();
  const lyricEffects = lyricEffectsProp ?? visualSettingsStore.lyricEffects;
  const backgroundEffects = backgroundEffectsProp ?? visualSettingsStore.backgroundEffects;
  const detectedGenre = detectedGenreProp ?? visualSettingsStore.detectedGenre;
  const genreOverride = genreOverrideProp ?? visualSettingsStore.genreOverride;

  // Use store actions if props not provided
  const onLyricEffectsChange = useCallback(
    (effects: EffectInstanceConfig[]) => {
      if (onLyricEffectsChangeProp) {
        onLyricEffectsChangeProp(effects);
      } else {
        visualSettingsStore.setLyricEffects(effects);
      }
    },
    [onLyricEffectsChangeProp, visualSettingsStore]
  );

  const onBackgroundEffectsChange = useCallback(
    (effects: EffectInstanceConfig[]) => {
      if (onBackgroundEffectsChangeProp) {
        onBackgroundEffectsChangeProp(effects);
      } else {
        visualSettingsStore.setBackgroundEffects(effects);
      }
    },
    [onBackgroundEffectsChangeProp, visualSettingsStore]
  );

  const onGenreOverride = useCallback(
    (genre: Genre | null) => {
      if (onGenreOverrideProp) {
        onGenreOverrideProp(genre);
      } else {
        visualSettingsStore.setGenreOverride(genre);
      }
    },
    [onGenreOverrideProp, visualSettingsStore]
  );

  // Add effect handlers
  const handleAddLyricEffect = (effectId: string) => {
    const effect = EffectRegistry.createLyricEffect(effectId);
    if (effect) {
      const newEffect: EffectInstanceConfig = {
        effectId,
        parameters: getDefaultValues(effect.parameters),
        enabled: true,
      };
      onLyricEffectsChange([...lyricEffects, newEffect]);
    }
  };

  const handleAddBackgroundEffect = (effectId: string) => {
    const effect = EffectRegistry.createBackgroundEffect(effectId);
    if (effect) {
      const newEffect: EffectInstanceConfig = {
        effectId,
        parameters: getDefaultValues(effect.parameters),
        enabled: true,
      };
      onBackgroundEffectsChange([...backgroundEffects, newEffect]);
    }
  };

  // Update effect parameters
  const handleLyricParameterChange = (
    index: number,
    paramId: string,
    value: number | string | boolean
  ) => {
    const updated = [...lyricEffects];
    updated[index] = {
      ...updated[index],
      parameters: { ...updated[index].parameters, [paramId]: value },
    };
    onLyricEffectsChange(updated);
  };

  const handleBackgroundParameterChange = (
    index: number,
    paramId: string,
    value: number | string | boolean
  ) => {
    const updated = [...backgroundEffects];
    updated[index] = {
      ...updated[index],
      parameters: { ...updated[index].parameters, [paramId]: value },
    };
    onBackgroundEffectsChange(updated);
  };

  // Remove effects
  const handleRemoveLyricEffect = (index: number) => {
    onLyricEffectsChange(lyricEffects.filter((_, i) => i !== index));
  };

  const handleRemoveBackgroundEffect = (index: number) => {
    onBackgroundEffectsChange(backgroundEffects.filter((_, i) => i !== index));
  };

  // Reorder effects
  const handleMoveLyricEffect = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...lyricEffects];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onLyricEffectsChange(updated);
  };

  const handleMoveBackgroundEffect = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...backgroundEffects];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onBackgroundEffectsChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-200">Effect Studio</h3>
      </div>

      {/* Genre Detection */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <MusicalNoteIcon className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-gray-300">Genre</span>
        </div>
        <GenreSelector
          detectedGenre={detectedGenre}
          confidence={genreConfidence}
          selectedGenre={genreOverride}
          onGenreSelect={onGenreOverride}
          isDetecting={isDetectingGenre}
        />
      </div>

      {/* Lyric Effects */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-300">Lyric Effects</span>
            <span className="text-[10px] text-gray-500">({lyricEffects.length} active)</span>
          </div>
          <EffectSelector
            category="lyric"
            onSelect={handleAddLyricEffect}
            activeEffects={lyricEffects.map((e) => e.effectId)}
          />
        </div>

        {lyricEffects.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No lyric effects active</p>
        ) : (
          <div className="space-y-2">
            {lyricEffects.map((effect, index) => {
              const metadata = EffectRegistry.getMetadata(effect.effectId);
              const effectInstance = EffectRegistry.createLyricEffect(effect.effectId);

              if (!metadata || !effectInstance) return null;

              return (
                <EffectCard
                  key={`${effect.effectId}-${index}`}
                  name={metadata.name}
                  parameters={effectInstance.parameters}
                  values={effect.parameters}
                  onParameterChange={(paramId, value) =>
                    handleLyricParameterChange(index, paramId, value)
                  }
                  onRemove={() => handleRemoveLyricEffect(index)}
                  onMoveUp={() => handleMoveLyricEffect(index, 'up')}
                  onMoveDown={() => handleMoveLyricEffect(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < lyricEffects.length - 1}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Background Effects */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FilmIcon className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-300">Background Effects</span>
            <span className="text-[10px] text-gray-500">({backgroundEffects.length} active)</span>
          </div>
          <EffectSelector
            category="background"
            onSelect={handleAddBackgroundEffect}
            activeEffects={backgroundEffects.map((e) => e.effectId)}
          />
        </div>

        {backgroundEffects.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No background effects active</p>
        ) : (
          <div className="space-y-2">
            {backgroundEffects.map((effect, index) => {
              const metadata = EffectRegistry.getMetadata(effect.effectId);
              const effectInstance = EffectRegistry.createBackgroundEffect(effect.effectId);

              if (!metadata || !effectInstance) return null;

              return (
                <EffectCard
                  key={`${effect.effectId}-${index}`}
                  name={metadata.name}
                  parameters={effectInstance.parameters}
                  values={effect.parameters}
                  onParameterChange={(paramId, value) =>
                    handleBackgroundParameterChange(index, paramId, value)
                  }
                  onRemove={() => handleRemoveBackgroundEffect(index)}
                  onMoveUp={() => handleMoveBackgroundEffect(index, 'up')}
                  onMoveDown={() => handleMoveBackgroundEffect(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < backgroundEffects.length - 1}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
