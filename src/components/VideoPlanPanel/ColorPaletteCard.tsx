import React, { useState } from 'react';
import { SwatchIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { VideoPlanColorPalette } from '../../../types';

interface ColorPaletteCardProps {
  palette: VideoPlanColorPalette;
  onEdit: (palette: VideoPlanColorPalette) => void;
}

export const ColorPaletteCard: React.FC<ColorPaletteCardProps> = ({ palette, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPalette, setEditedPalette] = useState(palette);

  const handleSave = () => {
    // Update gradient
    const updatedPalette = {
      ...editedPalette,
      previewGradient: `linear-gradient(135deg, ${editedPalette.primary}, ${editedPalette.secondary}, ${editedPalette.accent})`,
    };
    onEdit(updatedPalette);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPalette(palette);
    setIsEditing(false);
  };

  const colorFields: { key: keyof VideoPlanColorPalette; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <SwatchIcon className="w-4 h-4 text-pink-400" />
          Color Palette
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-white"
            title="Edit palette"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="p-1 text-green-400 hover:text-green-300"
              title="Save"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-red-400"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview swatches */}
      <div className="flex h-12">
        {colorFields.map(({ key }) => (
          <div
            key={key}
            className="flex-1 transition-all duration-200 hover:flex-[2]"
            style={{ backgroundColor: isEditing ? editedPalette[key] : palette[key] }}
            title={`${key}: ${isEditing ? editedPalette[key] : palette[key]}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="text-sm font-medium text-gray-200 mb-2">{palette.name}</div>

        {!isEditing ? (
          <div className="grid grid-cols-5 gap-1">
            {colorFields.map(({ key, label }) => (
              <div key={key} className="text-center">
                <div
                  className="w-8 h-8 mx-auto rounded-full border-2 border-gray-600"
                  style={{ backgroundColor: palette[key] }}
                />
                <span className="text-[10px] text-gray-400 block mt-1">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Palette Name</label>
              <input
                type="text"
                value={editedPalette.name}
                onChange={(e) => setEditedPalette({ ...editedPalette, name: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>
            {colorFields.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-20">{label}</label>
                <input
                  type="color"
                  value={editedPalette[key]}
                  onChange={(e) => setEditedPalette({ ...editedPalette, [key]: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={editedPalette[key]}
                  onChange={(e) => setEditedPalette({ ...editedPalette, [key]: e.target.value })}
                  className="flex-1 bg-gray-700 text-white text-xs rounded px-2 py-1 font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
