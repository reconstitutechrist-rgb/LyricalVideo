import React from 'react';
import { ColorParameter } from '../../effects/core/ParameterTypes';

interface ParameterColorPickerProps {
  parameter: ColorParameter;
  value: string;
  onChange: (value: string) => void;
}

export const ParameterColorPicker: React.FC<ParameterColorPickerProps> = ({
  parameter,
  value,
  onChange,
}) => {
  const { label } = parameter;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-600"
        />
        <span className="text-xs text-gray-300 font-mono">{value}</span>
      </div>
    </div>
  );
};
