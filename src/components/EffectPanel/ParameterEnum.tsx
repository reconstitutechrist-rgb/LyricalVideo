import React from 'react';
import { EnumParameter } from '../../effects/core/ParameterTypes';

interface ParameterEnumProps {
  parameter: EnumParameter;
  value: string;
  onChange: (value: string) => void;
}

export const ParameterEnum: React.FC<ParameterEnumProps> = ({ parameter, value, onChange }) => {
  const { label, options } = parameter;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 border border-gray-600 focus:border-purple-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
