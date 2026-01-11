import React, { useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  VideoPlanVisualStyle,
  VisualStyle,
  TextAnimationStyle,
  FontFamily,
  BlendMode,
} from '../../../types';

interface VisualStyleCardProps {
  style: VideoPlanVisualStyle;
  onEdit: (style: VideoPlanVisualStyle) => void;
}

const visualStyleOptions = Object.values(VisualStyle);
const textAnimationOptions: TextAnimationStyle[] = [
  'NONE',
  'TYPEWRITER',
  'FADE_CHARS',
  'KINETIC',
  'BOUNCE',
];
const fontFamilyOptions: FontFamily[] = [
  'Space Grotesk',
  'Inter',
  'Roboto',
  'Montserrat',
  'Cinzel',
];
const blendModeOptions: BlendMode[] = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'lighten',
  'color-dodge',
  'soft-light',
];

export const VisualStyleCard: React.FC<VisualStyleCardProps> = ({ style, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStyle, setEditedStyle] = useState(style);

  const handleSave = () => {
    onEdit(editedStyle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStyle(style);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-400" />
          Visual Style
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-white"
            title="Edit style"
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

      {/* Content */}
      <div className="px-3 py-2">
        {!isEditing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Style:</span>
                <span className="ml-1 text-gray-200">{style.style.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-gray-400">Animation:</span>
                <span className="ml-1 text-gray-200">{style.textAnimation}</span>
              </div>
              <div>
                <span className="text-gray-400">Font:</span>
                <span className="ml-1 text-gray-200">{style.fontFamily}</span>
              </div>
              <div>
                <span className="text-gray-400">Blend:</span>
                <span className="ml-1 text-gray-200">{style.blendMode}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">Intensity</div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${(style.intensity / 3) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">Speed</div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${(style.particleSpeed / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Visual Style</label>
              <select
                value={editedStyle.style}
                onChange={(e) =>
                  setEditedStyle({ ...editedStyle, style: e.target.value as VisualStyle })
                }
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {visualStyleOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Text Animation</label>
              <select
                value={editedStyle.textAnimation}
                onChange={(e) =>
                  setEditedStyle({
                    ...editedStyle,
                    textAnimation: e.target.value as TextAnimationStyle,
                  })
                }
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {textAnimationOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Font Family</label>
              <select
                value={editedStyle.fontFamily}
                onChange={(e) =>
                  setEditedStyle({ ...editedStyle, fontFamily: e.target.value as FontFamily })
                }
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {fontFamilyOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Blend Mode</label>
              <select
                value={editedStyle.blendMode}
                onChange={(e) =>
                  setEditedStyle({ ...editedStyle, blendMode: e.target.value as BlendMode })
                }
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {blendModeOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Intensity: {editedStyle.intensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={editedStyle.intensity}
                onChange={(e) =>
                  setEditedStyle({ ...editedStyle, intensity: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Particle Speed: {editedStyle.particleSpeed.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={editedStyle.particleSpeed}
                onChange={(e) =>
                  setEditedStyle({ ...editedStyle, particleSpeed: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
