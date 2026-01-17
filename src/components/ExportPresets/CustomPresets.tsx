import React, { useState } from 'react';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { exportPresetsService, CustomExportPreset } from '../../../services/exportPresets';

interface CustomPresetsProps {
  presets: CustomExportPreset[];
  onPresetsChange: () => void;
  onSelectPreset: (preset: CustomExportPreset) => void;
  activePresetId?: string;
}

export const CustomPresets: React.FC<CustomPresetsProps> = ({
  presets,
  onPresetsChange,
  onSelectPreset,
  activePresetId,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (preset: CustomExportPreset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      exportPresetsService.updateCustomPreset(id, { name: editName.trim() });
      onPresetsChange();
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    exportPresetsService.deleteCustomPreset(id);
    onPresetsChange();
  };

  if (presets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No custom presets saved yet.
        <br />
        <span className="text-xs">Configure your export settings and save them as a preset.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 px-1">Custom Presets ({presets.length})</div>
      {presets.map((preset) => {
        const isEditing = editingId === preset.id;
        const isActive = activePresetId === preset.id;

        return (
          <div
            key={preset.id}
            className={`
              p-3 rounded-lg border transition-all
              ${
                isActive
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-gray-800/60 border-gray-700/30 hover:border-gray-600'
              }
            `}
          >
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-gray-900/60 border border-gray-700/50 rounded text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(preset.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={() => handleSaveEdit(preset.id)}
                  className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                  title="Save"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
                  title="Cancel"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button onClick={() => onSelectPreset(preset)} className="flex-1 text-left">
                  <div
                    className={`text-sm font-medium ${isActive ? 'text-purple-400' : 'text-gray-200'}`}
                  >
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {preset.aspectRatio} • {preset.resolution} @ {preset.framerate}fps •{' '}
                    {preset.quality}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(preset)}
                    className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Edit name"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete preset"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomPresets;
