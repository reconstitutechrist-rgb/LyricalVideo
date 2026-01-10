import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { EffectParameter, ParameterValues } from '../../effects/core/ParameterTypes';
import { ParameterSlider } from './ParameterSlider';
import { ParameterColorPicker } from './ParameterColorPicker';
import { ParameterToggle } from './ParameterToggle';
import { ParameterEnum } from './ParameterEnum';

interface EffectCardProps {
  name: string;
  parameters: EffectParameter[];
  values: ParameterValues;
  onParameterChange: (paramId: string, value: number | string | boolean) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const EffectCard: React.FC<EffectCardProps> = ({
  name,
  parameters,
  values,
  onParameterChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderParameter = (param: EffectParameter) => {
    const value = values[param.id] ?? param.defaultValue;

    switch (param.type) {
      case 'slider':
        return (
          <ParameterSlider
            key={param.id}
            parameter={param}
            value={value as number}
            onChange={(v) => onParameterChange(param.id, v)}
          />
        );
      case 'color':
        return (
          <ParameterColorPicker
            key={param.id}
            parameter={param}
            value={value as string}
            onChange={(v) => onParameterChange(param.id, v)}
          />
        );
      case 'boolean':
        return (
          <ParameterToggle
            key={param.id}
            parameter={param}
            value={value as boolean}
            onChange={(v) => onParameterChange(param.id, v)}
          />
        );
      case 'enum':
        return (
          <ParameterEnum
            key={param.id}
            parameter={param}
            value={value as string}
            onChange={(v) => onParameterChange(param.id, v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
          {name}
        </button>
        <div className="flex items-center gap-1">
          {canMoveUp && onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 text-gray-400 hover:text-white"
              title="Move up"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </button>
          )}
          {canMoveDown && onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 text-gray-400 hover:text-white"
              title="Move down"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-400"
            title="Remove effect"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Parameters */}
      {isExpanded && <div className="px-3 py-2 space-y-3">{parameters.map(renderParameter)}</div>}
    </div>
  );
};
