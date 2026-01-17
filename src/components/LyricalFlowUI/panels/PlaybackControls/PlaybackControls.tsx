/**
 * PlaybackControls Component
 * Bottom center playback bar with play/pause, seek, and progress.
 * Extracted from LyricalFlowUI for better maintainability.
 */

import React, { useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from '@heroicons/react/24/solid';
import { formatTime } from '../../../../utils/time';

export interface PlaybackControlsProps {
  // State
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Callbacks
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onSkipForward,
  onSkipBackward,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      onSeek(percent * duration);
    },
    [duration, onSeek]
  );

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl flex items-center gap-3 z-20 glass-panel"
      style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 136, 255, 0.1)' }}
    >
      {/* Top Gradient Line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-50"
        style={{
          background:
            'linear-gradient(90deg, transparent, #00d4ff, #0088ff, #00ffcc, #0088ff, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Skip Back */}
      <button
        onClick={onSkipBackward}
        className="p-1.5 text-slate-400 hover:text-cyan-400 transition touch-target"
        aria-label="Skip backward 10 seconds"
        disabled={!audioUrl}
      >
        <BackwardIcon className="w-5 h-5" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="w-11 h-11 rounded-full flex items-center justify-center text-white btn-gradient-cyan touch-target"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={!audioUrl}
      >
        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
      </button>

      {/* Skip Forward */}
      <button
        onClick={onSkipForward}
        className="p-1.5 text-slate-400 hover:text-cyan-400 transition touch-target"
        aria-label="Skip forward 10 seconds"
        disabled={!audioUrl}
      >
        <ForwardIcon className="w-5 h-5" />
      </button>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1 w-48 ml-2">
        <div
          ref={progressRef}
          className="h-1 rounded-full relative cursor-pointer progress-track touch-target"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full progress-thumb"
            style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-cyan-400/60 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Live Indicator */}
      {isPlaying && (
        <div className="w-2 h-2 rounded-full ml-1 live-indicator" aria-label="Playing" />
      )}
    </div>
  );
};

export default PlaybackControls;
