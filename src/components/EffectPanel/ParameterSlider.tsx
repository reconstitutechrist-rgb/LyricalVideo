import React from 'react';
import { SliderParameter } from '../../effects/core/ParameterTypes';

interface ParameterSliderProps {
  parameter: SliderParameter;
  value: number;
  onChange: (value: number) => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({ parameter, value, onChange }) => {
  const { label, min, max, step = 1, unit = '' } = parameter;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
    </div>
  );
};
