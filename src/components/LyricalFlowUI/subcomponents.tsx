/**
 * LyricalFlowUI Subcomponents
 * Small reusable UI components extracted from LyricalFlowUI.
 */

import React, { useState, useEffect } from 'react';

// ============================================
// Decorative Components
// ============================================

export const EqualizerBars: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className="flex items-end gap-0.5 h-6"
    role="img"
    aria-label={active ? 'Audio playing' : 'Audio paused'}
  >
    {[40, 70, 50, 90, 60].map((h, i) => (
      <div
        key={i}
        className={`w-1 rounded-sm equalizer-bar ${active ? '' : 'opacity-30'}`}
        style={{
          height: `${h}%`,
          animationDelay: `${i * 100}ms`,
          animationPlayState: active ? 'running' : 'paused',
        }}
      />
    ))}
  </div>
);

export const SoundWave: React.FC<{ count?: number }> = ({ count = 7 }) => (
  <div className="flex items-center gap-0.5" role="img" aria-label="Processing">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="w-0.5 rounded-full sound-wave-bar"
        style={{
          height: `${8 + Math.sin(i * 0.8) * 12}px`,
          animationDelay: `${i * 100}ms`,
        }}
      />
    ))}
  </div>
);

export const RhythmDots: React.FC = () => (
  <div className="flex gap-2" role="img" aria-hidden="true">
    {[0, 150, 300, 450].map((delay, i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full rhythm-dot"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

export const EnergyOrb: React.FC<{ size: number; className?: string }> = ({
  size,
  className = '',
}) => (
  <div
    className={`absolute rounded-full energy-orb ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

export const FloatingNote: React.FC<{ note: string; className?: string }> = ({
  note,
  className = '',
}) => (
  <div
    className={`absolute text-4xl pointer-events-none animate-bounce ${className}`}
    style={{ color: 'rgba(0, 212, 255, 0.08)' }}
    aria-hidden="true"
  >
    {note}
  </div>
);

// ============================================
// Interactive Components
// ============================================

export const StepIndicator: React.FC<{ step: number; label: string }> = ({ step, label }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-5 h-5 rounded-full step-circle flex items-center justify-center text-[9px] font-bold text-white">
      {step}
    </div>
    <h3 className="text-[10px] font-bold text-cyan-400/80 tracking-wider uppercase">{label}</h3>
  </div>
);

export const ToggleSwitch: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  label: string;
  id: string;
  'data-control-id'?: string;
}> = ({ enabled, onToggle, label, id, 'data-control-id': dataControlId }) => (
  <div className="flex justify-between items-center">
    <label htmlFor={id} className="text-[9px] text-slate-400">
      {label}
    </label>
    <button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      data-control-id={dataControlId || id}
      className={`toggle-switch w-8 h-4 rounded-full p-0.5 cursor-pointer ${enabled ? 'on' : 'off'}`}
    >
      <div className="toggle-knob w-3 h-3 bg-white rounded-full shadow" />
    </button>
  </div>
);

// ============================================
// Draggable Time Input
// ============================================

export interface DraggableTimeInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
}

export const DraggableTimeInput: React.FC<DraggableTimeInputProps> = ({
  value,
  onChange,
  step = 0.01,
  min = 0,
  max = Infinity,
  label,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const sensitivity = e.shiftKey ? 0.001 : 0.01; // Fine-tune with Shift
      const newValue = Math.max(min, Math.min(max, startValue + deltaX * sensitivity));
      onChange(Number(newValue.toFixed(3)));
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startValue, min, max, onChange]);

  return (
    <input
      type="number"
      value={value.toFixed(2)}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onMouseDown={handleMouseDown}
      className={`time-input w-14 py-0.5 px-1 rounded text-[9px] text-center ${
        isDragging ? 'cursor-ew-resize bg-cyan-500/20' : 'cursor-ew-resize'
      }`}
      step={step}
      aria-label={label}
      title="Drag horizontally to adjust (hold Shift for fine control)"
    />
  );
};
