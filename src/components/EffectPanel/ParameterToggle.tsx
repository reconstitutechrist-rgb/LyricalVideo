import React from 'react';
import { BooleanParameter } from '../../effects/core/ParameterTypes';

interface ParameterToggleProps {
  parameter: BooleanParameter;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const ParameterToggle: React.FC<ParameterToggleProps> = ({ parameter, value, onChange }) => {
  const { label } = parameter;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-purple-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
