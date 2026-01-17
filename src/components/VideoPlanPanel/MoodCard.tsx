import React, { useState } from 'react';
import { SparklesIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { VideoPlanMood } from '../../../types';

interface MoodCardProps {
  mood: VideoPlanMood;
  onEdit: (mood: VideoPlanMood) => void;
}

export const MoodCard: React.FC<MoodCardProps> = ({ mood, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMood, setEditedMood] = useState(mood);

  const handleSave = () => {
    onEdit(editedMood);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMood(mood);
    setIsEditing(false);
  };

  const getIntensityGradient = () => {
    switch (mood.intensity) {
      case 'high':
        return 'from-red-500 via-orange-500 to-yellow-500';
      case 'medium':
        return 'from-purple-500 via-pink-500 to-rose-500';
      case 'low':
        return 'from-blue-500 via-cyan-500 to-teal-500';
      default:
        return 'from-gray-500 via-gray-400 to-gray-300';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <SparklesIcon className="w-4 h-4 text-purple-400" />
          Mood
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-white"
            title="Edit mood"
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

      {/* Preview */}
      <div
        className={`h-16 bg-gradient-to-r ${getIntensityGradient()} flex items-center justify-center`}
      >
        <span className="text-white font-bold text-lg drop-shadow-lg">{mood.primary}</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {!isEditing ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400">Intensity:</span>
              <span className="text-xs font-medium text-gray-200 capitalize">{mood.intensity}</span>
            </div>
            {mood.secondary && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">Secondary:</span>
                <span className="text-xs text-gray-200">{mood.secondary}</span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{mood.description}</p>
          </>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Primary Mood</label>
              <input
                type="text"
                value={editedMood.primary}
                onChange={(e) => setEditedMood({ ...editedMood, primary: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Intensity</label>
              <select
                value={editedMood.intensity}
                onChange={(e) =>
                  setEditedMood({
                    ...editedMood,
                    intensity: e.target.value as 'low' | 'medium' | 'high',
                  })
                }
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea
                value={editedMood.description}
                onChange={(e) => setEditedMood({ ...editedMood, description: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
