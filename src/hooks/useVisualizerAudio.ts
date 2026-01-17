/**
 * useVisualizerAudio Hook
 * Encapsulates audio context setup, analysis, and beat detection for the Visualizer
 */

import { useRef, useEffect, useCallback } from 'react';
import { BeatDetector, BeatData } from '../../services/beatDetectionService';
import { analyzeFrequencies, type FrequencyData } from '../utils/audioAnalysis';

interface UseVisualizerAudioOptions {
  audioUrl: string | null | undefined;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  setAudioElement: (el: HTMLAudioElement) => void;
  setMediaStreamDestination: (dest: MediaStreamAudioDestinationNode) => void;
}

interface UseVisualizerAudioReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  dataArrayRef: React.RefObject<Uint8Array | null>;
  beatDetectorRef: React.RefObject<BeatDetector>;
  beatDataRef: React.RefObject<BeatData>;
  audioContextRef: React.RefObject<AudioContext | null>;
  audioContextStartTimeRef: React.RefObject<number>;
  audioElementStartTimeRef: React.RefObject<number>;
  getFrequencies: () => FrequencyData;
  getPreciseCurrentTime: () => number;
}

const DEFAULT_BEAT_DATA: BeatData = {
  isBeat: false,
  beatIntensity: 0,
  bpm: 0,
  beatPhase: 0,
  energy: 0,
  energyDelta: 0,
  spectralCentroid: 0,
  spectralFlux: 0,
  timeSinceBeat: Infinity,
};

export function useVisualizerAudio(options: UseVisualizerAudioOptions): UseVisualizerAudioReturn {
  const { audioUrl, isPlaying, onTimeUpdate, setAudioElement, setMediaStreamDestination } = options;

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Beat detection
  const beatDetectorRef = useRef<BeatDetector>(new BeatDetector());
  const beatDataRef = useRef<BeatData>(DEFAULT_BEAT_DATA);

  // High-precision timing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioContextStartTimeRef = useRef<number>(0);
  const audioElementStartTimeRef = useRef<number>(0);

  // Get current frequencies
  const getFrequencies = useCallback((): FrequencyData => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { average: 0, bass: 0, mid: 0, treble: 0 };
    }
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return analyzeFrequencies(dataArrayRef.current);
  }, []);

  // High-precision timing function
  const getPreciseCurrentTime = useCallback((): number => {
    const audio = audioRef.current;
    if (!audio) return 0;

    // Use AudioContext for sub-frame precision when available
    if (audioContextRef.current && audioContextStartTimeRef.current > 0) {
      const contextElapsed = audioContextRef.current.currentTime - audioContextStartTimeRef.current;
      const predictedTime = audioElementStartTimeRef.current + contextElapsed;

      // Validate against actual audio time to prevent drift
      const actualTime = audio.currentTime;
      const drift = Math.abs(predictedTime - actualTime);

      // Re-sync if drift exceeds 100ms
      if (drift > 0.1) {
        audioContextStartTimeRef.current = audioContextRef.current.currentTime;
        audioElementStartTimeRef.current = actualTime;
        return actualTime;
      }

      return predictedTime;
    }

    return audio.currentTime;
  }, []);

  // Setup audio context and analyser
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    audioRef.current = audio;
    setAudioElement(audio);

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const dest = ctx.createMediaStreamDestination();
    src.connect(analyser);
    analyser.connect(ctx.destination);
    src.connect(dest);

    setMediaStreamDestination(dest);
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Time update handler with high-precision timing sync
    const handleTimeUpdate = () => {
      if (!audio.paused && audioContextRef.current) {
        // Sync high-precision timing on play
        if (audioContextStartTimeRef.current === 0) {
          audioContextStartTimeRef.current = audioContextRef.current.currentTime;
          audioElementStartTimeRef.current = audio.currentTime;
        }
      }
      onTimeUpdate(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      audio.src = '';
      ctx.close();
      audioContextRef.current = null;
      audioContextStartTimeRef.current = 0;
    };
  }, [audioUrl, onTimeUpdate, setAudioElement, setMediaStreamDestination]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (analyserRef.current?.context.state === 'suspended') {
        (analyserRef.current.context as AudioContext).resume();
      }
      audio.play();

      // Reset timing sync on play
      if (audioContextRef.current) {
        audioContextStartTimeRef.current = audioContextRef.current.currentTime;
        audioElementStartTimeRef.current = audio.currentTime;
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return {
    audioRef,
    analyserRef,
    dataArrayRef,
    beatDetectorRef,
    beatDataRef,
    audioContextRef,
    audioContextStartTimeRef,
    audioElementStartTimeRef,
    getFrequencies,
    getPreciseCurrentTime,
  };
}
