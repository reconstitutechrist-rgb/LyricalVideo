import React from 'react';
import { PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PeakVisual, EmotionalPeak, LyricLine } from '../../../types';

interface PeakVisualsCardProps {
  peakVisuals: PeakVisual[];
  emotionalPeaks: EmotionalPeak[];
  lyrics: LyricLine[];
  onRegeneratePeak: (peak: EmotionalPeak) => void;
  isRegenerating: string | null;
}

export const PeakVisualsCard: React.FC<PeakVisualsCardProps> = ({
  peakVisuals,
  emotionalPeaks,
  lyrics,
  onRegeneratePeak,
  isRegenerating,
}) => {
  // Get peak info for each visual
  const getpeakInfo = (peakId: string) => {
    return emotionalPeaks.find((p) => p.id === peakId);
  };

  const getLyricText = (lyricIndex: number) => {
    return lyrics[lyricIndex]?.text || 'Unknown lyric';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-750">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <PhotoIcon className="w-4 h-4 text-emerald-400" />
          Peak Visuals ({peakVisuals.length})
        </div>
      </div>

      {/* Visual grid */}
      <div className="p-3">
        {peakVisuals.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No peak visuals generated yet
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {peakVisuals.map((visual) => {
              const peakInfo = getpeakInfo(visual.peakId);
              const isLoading = isRegenerating === visual.peakId;

              return (
                <div
                  key={visual.peakId}
                  className="relative group rounded-lg overflow-hidden border border-gray-700"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-900">
                    <img
                      src={visual.asset.url}
                      alt={`Peak visual for ${peakInfo?.peakType}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div>
                      <span className="text-xs font-medium text-white bg-purple-600 px-1.5 py-0.5 rounded">
                        {peakInfo?.peakType}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-200 line-clamp-2">
                        {getLyricText(visual.lyricIndices[0])}
                      </p>
                      {peakInfo && (
                        <button
                          onClick={() => onRegeneratePeak(peakInfo)}
                          disabled={isLoading}
                          className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:text-gray-500"
                        >
                          <ArrowPathIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          {isLoading ? 'Generating...' : 'Regenerate'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <ArrowPathIcon className="w-6 h-6 text-emerald-400 animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Peaks without visuals */}
        {emotionalPeaks.filter((p) => !peakVisuals.find((v) => v.peakId === p.id)).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2">
              Peaks without visuals (
              {emotionalPeaks.filter((p) => !peakVisuals.find((v) => v.peakId === p.id)).length}):
            </div>
            <div className="flex flex-wrap gap-1">
              {emotionalPeaks
                .filter((p) => !peakVisuals.find((v) => v.peakId === p.id))
                .slice(0, 5)
                .map((peak) => (
                  <button
                    key={peak.id}
                    onClick={() => onRegeneratePeak(peak)}
                    disabled={isRegenerating === peak.id}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {peak.peakType}
                    {isRegenerating === peak.id && (
                      <ArrowPathIcon className="w-3 h-3 animate-spin" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
