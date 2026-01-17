import React from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { TextKeyframe, EasingType } from '../../../types';
import { CurveVisualizer } from './CurveVisualizer';

interface KeyframeEditorProps {
  keyframe: TextKeyframe;
  keyframeIndex: number;
  totalKeyframes: number;
  onChange: (keyframe: TextKeyframe) => void;
  onDelete: () => void;
}

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In/Out' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'back', label: 'Back' },
];

export const KeyframeEditor: React.FC<KeyframeEditorProps> = ({
  keyframe,
  keyframeIndex,
  totalKeyframes,
  onChange,
  onDelete,
}) => {
  const updateProperty = <K extends keyof TextKeyframe>(key: K, value: TextKeyframe[K]) => {
    onChange({ ...keyframe, [key]: value });
  };

  return (
    <div className="p-3 space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Keyframe</div>
          <div className="text-gray-200 font-medium">
            #{keyframeIndex + 1} of {totalKeyframes}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete keyframe"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Time */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Time (0-100%)</label>
        <input
          type="range"
          min={0}
          max={100}
          value={keyframe.time * 100}
          onChange={(e) => updateProperty('time', Number(e.target.value) / 100)}
          className="w-full accent-cyan-500"
        />
        <div className="text-xs text-gray-400 text-right">{(keyframe.time * 100).toFixed(0)}%</div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">X Offset</label>
          <input
            type="number"
            value={keyframe.x}
            onChange={(e) => updateProperty('x', Number(e.target.value))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Y Offset</label>
          <input
            type="number"
            value={keyframe.y}
            onChange={(e) => updateProperty('y', Number(e.target.value))}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Scale</label>
        <input
          type="range"
          min={0}
          max={200}
          value={keyframe.scale * 100}
          onChange={(e) => updateProperty('scale', Number(e.target.value) / 100)}
          className="w-full accent-cyan-500"
        />
        <div className="text-xs text-gray-400 text-right">{(keyframe.scale * 100).toFixed(0)}%</div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Rotation</label>
        <input
          type="range"
          min={-180}
          max={180}
          value={keyframe.rotation}
          onChange={(e) => updateProperty('rotation', Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
        <div className="text-xs text-gray-400 text-right">{keyframe.rotation.toFixed(0)}°</div>
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Opacity</label>
        <input
          type="range"
          min={0}
          max={100}
          value={keyframe.opacity * 100}
          onChange={(e) => updateProperty('opacity', Number(e.target.value) / 100)}
          className="w-full accent-cyan-500"
        />
        <div className="text-xs text-gray-400 text-right">
          {(keyframe.opacity * 100).toFixed(0)}%
        </div>
      </div>

      {/* Easing */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500">Easing Curve</label>
        <select
          value={keyframe.easing || 'easeInOut'}
          onChange={(e) => updateProperty('easing', e.target.value as EasingType)}
          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
        >
          {EASING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Easing Curve Preview */}
        <CurveVisualizer easing={keyframe.easing || 'easeInOut'} />
      </div>

      {/* Quick Presets */}
      <div className="space-y-2 pt-2 border-t border-gray-800">
        <label className="text-xs text-gray-500">Quick Presets</label>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onChange({ ...keyframe, scale: 0, opacity: 0 })}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors"
          >
            Fade In Start
          </button>
          <button
            onClick={() => onChange({ ...keyframe, scale: 1, opacity: 1 })}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors"
          >
            Normal
          </button>
          <button
            onClick={() => onChange({ ...keyframe, scale: 1.5, y: -20 })}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors"
          >
            Pop Up
          </button>
          <button
            onClick={() => onChange({ ...keyframe, rotation: 15, x: 50 })}
            className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors"
          >
            Tilt Right
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyframeEditor;
