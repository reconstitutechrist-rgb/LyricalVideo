/**
 * useAudioManagement Hook
 * Manages audio file upload, decoding, playback controls, and audio element synchronization.
 * Extracted from App.tsx to reduce monolithic component size.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAudioStore } from '../stores';
import { decodeAudio } from '../../utils/audio';
import { toast } from '../stores';

export interface AudioManagementOptions {
  onAudioDecoded?: (buffer: AudioBuffer) => void;
  onError?: (error: Error) => void;
}

export interface AudioManagementReturn {
  // Refs
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  mediaStreamDestRef: React.RefObject<MediaStreamAudioDestinationNode | null>;

  // State from store
  audioFile: File | null;
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;

  // Actions
  handleAudioFile: (file: File) => Promise<AudioBuffer | null>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  reset: () => void;

  // Audio context setup
  setupAudioContext: (audioElement: HTMLAudioElement) => MediaStreamAudioDestinationNode | null;
}

export function useAudioManagement(options: AudioManagementOptions = {}): AudioManagementReturn {
  const { onAudioDecoded, onError } = options;

  const audioStore = useAudioStore();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Handle audio file upload and decoding
  const handleAudioFile = useCallback(
    async (file: File): Promise<AudioBuffer | null> => {
      try {
        // Decode audio for waveform visualization
        const buffer = await decodeAudio(file);

        // Update store
        audioStore.setAudioFile(file);
        audioStore.setAudioBuffer(buffer);
        audioStore.setDuration(buffer.duration);

        onAudioDecoded?.(buffer);

        return buffer;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to decode audio');
        toast.error('Audio Processing Failed', err.message);
        onError?.(err);
        return null;
      }
    },
    [audioStore, onAudioDecoded, onError]
  );

  // Setup audio context for export (connects audio element to MediaStreamDestination)
  const setupAudioContext = useCallback(
    (audioElement: HTMLAudioElement): MediaStreamAudioDestinationNode | null => {
      try {
        // Create audio context if not exists
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;

        // Create source from audio element
        const source = ctx.createMediaElementSource(audioElement);

        // Create destination for recording
        const dest = ctx.createMediaStreamDestination();

        // Connect source to both destination (for recording) and speakers
        source.connect(dest);
        source.connect(ctx.destination);

        mediaStreamDestRef.current = dest;

        return dest;
      } catch (error) {
        console.error('Failed to setup audio context:', error);
        return null;
      }
    },
    []
  );

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    audioStore.togglePlay();
  }, [audioStore]);

  // Seek to time
  const seek = useCallback(
    (time: number) => {
      audioStore.seek(time);
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = time;
      }
    },
    [audioStore]
  );

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
  }, [audioStore.isPlaying, audioStore]);

  // Sync audio element time updates to store
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      audioStore.setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      audioStore.setDuration(audio.duration);
    };

    const handleEnded = () => {
      audioStore.setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioStore]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    // Refs
    audioElementRef,
    mediaStreamDestRef,

    // State from store
    audioFile: audioStore.audioFile,
    audioUrl: audioStore.audioUrl,
    audioBuffer: audioStore.audioBuffer,
    currentTime: audioStore.currentTime,
    duration: audioStore.duration,
    isPlaying: audioStore.isPlaying,

    // Actions
    handleAudioFile,
    togglePlay,
    seek,
    setIsPlaying: audioStore.setIsPlaying,
    reset: audioStore.reset,

    // Audio context setup
    setupAudioContext,
  };
}
