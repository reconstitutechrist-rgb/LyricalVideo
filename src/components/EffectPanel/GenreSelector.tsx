import React from 'react';
import { Genre } from '../../../types';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface GenreSelectorProps {
  detectedGenre: Genre | null;
  confidence: number;
  selectedGenre: Genre | null;
  onGenreSelect: (genre: Genre | null) => void;
  isDetecting: boolean;
}

const genreLabels: Record<Genre, string> = {
  [Genre.HIPHOP]: 'Hip-Hop',
  [Genre.ROCK]: 'Rock',
  [Genre.ELECTRONIC]: 'Electronic',
  [Genre.CLASSICAL]: 'Classical',
  [Genre.POP]: 'Pop',
  [Genre.INDIE]: 'Indie',
  [Genre.RNB]: 'R&B',
  [Genre.JAZZ]: 'Jazz',
  [Genre.COUNTRY]: 'Country',
  [Genre.METAL]: 'Metal',
};

const genreColors: Record<Genre, string> = {
  [Genre.HIPHOP]: 'bg-amber-600',
  [Genre.ROCK]: 'bg-red-600',
  [Genre.ELECTRONIC]: 'bg-purple-600',
  [Genre.CLASSICAL]: 'bg-amber-800',
  [Genre.POP]: 'bg-pink-500',
  [Genre.INDIE]: 'bg-teal-600',
  [Genre.RNB]: 'bg-indigo-600',
  [Genre.JAZZ]: 'bg-orange-700',
  [Genre.COUNTRY]: 'bg-green-700',
  [Genre.METAL]: 'bg-gray-700',
};

export const GenreSelector: React.FC<GenreSelectorProps> = ({
  detectedGenre,
  confidence,
  selectedGenre,
  onGenreSelect,
  isDetecting,
}) => {
  const activeGenre = selectedGenre ?? detectedGenre;

  return (
    <div className="space-y-3">
      {/* Detected genre display */}
      {detectedGenre && (
        <div className="flex items-center justify-between p-2 bg-gray-750 rounded-lg">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-300">AI Detected:</span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${genreColors[detectedGenre]} text-white`}
            >
              {genreLabels[detectedGenre]}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>
      )}

      {isDetecting && (
        <div className="flex items-center gap-2 p-2 bg-gray-750 rounded-lg">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Detecting genre...</span>
        </div>
      )}

      {/* Manual override */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {selectedGenre ? 'Manual Override' : 'Select Genre'}
          </span>
          {selectedGenre && (
            <button
              onClick={() => onGenreSelect(null)}
              className="text-[10px] text-purple-400 hover:text-purple-300"
            >
              Use Auto
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {(Object.values(Genre) as Genre[]).map((genre) => (
            <button
              key={genre}
              onClick={() => onGenreSelect(genre)}
              className={`px-1.5 py-1 text-[10px] rounded transition-colors ${
                activeGenre === genre
                  ? `${genreColors[genre]} text-white`
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300'
              }`}
              title={genreLabels[genre]}
            >
              {genreLabels[genre].slice(0, 4)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
