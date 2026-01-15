/**
 * Audio Sync Hook
 * Handles synchronization between legacy state and Zustand audio store
 */

import { useEffect, useMemo, RefObject } from 'react';
import { useAudioStore } from '../../stores';

interface LegacyAudioState {
  audioFile: File | null;
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  isPlaying: boolean;
}

interface UseAudioSyncOptions {
  legacyState: LegacyAudioState;
  setLegacyState: (updater: (prev: LegacyAudioState) => Partial<LegacyAudioState>) => void;
  audioElementRef: RefObject<HTMLAudioElement | null>;
}

interface UseAudioSyncReturn {
  audioStore: ReturnType<typeof useAudioStore>;
  mergedAudioState: LegacyAudioState;
  togglePlay: () => void;
  seek: (time: number) => void;
}

/**
 * Hook to synchronize audio state between legacy component state and Zustand store
 * This enables gradual migration from useState to Zustand
 */
export const useAudioSync = ({
  legacyState,
  setLegacyState,
  audioElementRef,
}: UseAudioSyncOptions): UseAudioSyncReturn => {
  const audioStore = useAudioStore();

  // Sync audio store with legacy state during transition
  // This effect keeps the legacy state.isPlaying in sync with the store
  useEffect(() => {
    if (legacyState.isPlaying !== audioStore.isPlaying) {
      setLegacyState((prev) => ({ ...prev, isPlaying: audioStore.isPlaying }));
    }
  }, [audioStore.isPlaying, legacyState.isPlaying, setLegacyState]);

  // Sync currentTime from store to legacy state (for components not yet migrated)
  useEffect(() => {
    if (Math.abs(legacyState.currentTime - audioStore.currentTime) > 0.1) {
      setLegacyState((prev) => ({ ...prev, currentTime: audioStore.currentTime }));
    }
  }, [audioStore.currentTime, legacyState.currentTime, setLegacyState]);

  // Sync audio file changes from legacy state to store
  useEffect(() => {
    if (legacyState.audioFile !== audioStore.audioFile) {
      audioStore.setAudioFile(legacyState.audioFile);
    }
    if (legacyState.audioBuffer !== audioStore.audioBuffer) {
      audioStore.setAudioBuffer(legacyState.audioBuffer);
    }
  }, [legacyState.audioFile, legacyState.audioBuffer, audioStore]);

  // Sync audio element playback with store
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (audioStore.isPlaying) {
      audio.play().catch(() => {
        // Handle autoplay restrictions
        audioStore.setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [audioStore.isPlaying, audioStore, audioElementRef]);

  // Sync audio element time updates to store
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      audioStore.setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioStore, audioElementRef]);

  // Create merged state for components not yet migrated
  const mergedAudioState = useMemo(
    () => ({
      audioFile: audioStore.audioFile ?? legacyState.audioFile,
      audioUrl: audioStore.audioUrl ?? legacyState.audioUrl,
      audioBuffer: audioStore.audioBuffer ?? legacyState.audioBuffer,
      currentTime: audioStore.currentTime,
      isPlaying: audioStore.isPlaying,
    }),
    [
      audioStore.audioFile,
      audioStore.audioUrl,
      audioStore.audioBuffer,
      audioStore.currentTime,
      audioStore.isPlaying,
      legacyState.audioFile,
      legacyState.audioUrl,
      legacyState.audioBuffer,
    ]
  );

  // Helper functions
  const togglePlay = () => {
    audioStore.togglePlay();
  };

  const seek = (time: number) => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.currentTime = time;
      audioStore.setCurrentTime(time);
    }
  };

  return {
    audioStore,
    mergedAudioState,
    togglePlay,
    seek,
  };
};

export default useAudioSync;
