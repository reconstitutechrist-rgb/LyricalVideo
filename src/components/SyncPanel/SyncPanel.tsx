import React from 'react';
import { TimingPrecision } from '../../../types';
import { MusicalNoteIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SyncPanelProps {
  precision: TimingPrecision;
  onPrecisionChange: (precision: TimingPrecision) => void;
  userLyrics: string;
  onLyricsChange: (lyrics: string) => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncConfidence: number | null;
  disabled?: boolean;
}

const PRECISION_OPTIONS: {
  value: TimingPrecision;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'line',
    label: 'Line',
    description: 'Each line gets start/end times',
    icon: <ClockIcon className="w-4 h-4" />,
  },
  {
    value: 'word',
    label: 'Word',
    description: 'Each word gets precise timestamps (karaoke-style)',
    icon: <MusicalNoteIcon className="w-4 h-4" />,
  },
  {
    value: 'syllable',
    label: 'Syllable',
    description: 'Each syllable timed precisely (most detailed)',
    icon: <SparklesIcon className="w-4 h-4" />,
  },
];

export const SyncPanel: React.FC<SyncPanelProps> = ({
  precision,
  onPrecisionChange,
  userLyrics,
  onLyricsChange,
  onSync,
  isSyncing,
  syncProgress,
  lastSyncConfidence,
  disabled = false,
}) => {
  const handleSync = async () => {
    if (isSyncing || disabled) return;
    await onSync();
  };

  return (
    <div className="sync-panel glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Lyric Sync</h3>
        {lastSyncConfidence !== null && (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                lastSyncConfidence > 0.8
                  ? 'bg-green-400'
                  : lastSyncConfidence > 0.5
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
              }`}
            />
            <span className="text-[10px] text-gray-400">
              {Math.round(lastSyncConfidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>

      {/* Precision Selector */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">
          Timing Precision
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRECISION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPrecisionChange(option.value)}
              disabled={isSyncing || disabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                precision === option.value
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              } ${isSyncing || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={option.description}
            >
              {option.icon}
              <span className="text-[10px] font-medium">{option.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[9px] text-gray-500">
          {PRECISION_OPTIONS.find((o) => o.value === precision)?.description}
        </p>
      </div>

      {/* Lyrics Input (Optional) */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider">
          Lyrics (Optional)
        </label>
        <textarea
          value={userLyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder="Paste lyrics here for more accurate alignment, or leave empty for AI transcription..."
          disabled={isSyncing || disabled}
          className="w-full h-24 px-2 py-1.5 text-xs bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
        />
        <p className="text-[9px] text-gray-500">
          Providing lyrics helps AI align timing more accurately
        </p>
      </div>

      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={isSyncing || disabled}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
          isSyncing
            ? 'bg-cyan-600/30 text-cyan-400 cursor-wait'
            : disabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-600 text-white hover:bg-cyan-500'
        }`}
      >
        {isSyncing ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Syncing... {syncProgress}%</span>
          </>
        ) : (
          <>
            <MusicalNoteIcon className="w-4 h-4" />
            <span>Auto Sync Lyrics</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isSyncing && (
        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SyncPanel;
