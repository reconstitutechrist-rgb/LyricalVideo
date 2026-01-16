/**
 * Audio analysis utilities for the Visualizer
 * Extracted for clarity and reusability
 */

import { FrequencyBand } from '../../types';
import { BeatData } from '../../services/beatDetectionService';

export interface FrequencyData {
  average: number;
  bass: number;
  mid: number;
  treble: number;
}

/**
 * Analyze frequency data from audio analyser
 */
export const analyzeFrequencies = (dataArray: Uint8Array): FrequencyData => {
  const len = dataArray.length;
  const sum = dataArray.reduce((a, b) => a + b, 0);
  const average = sum / len;

  const bassSlice = dataArray.slice(0, 10);
  const bass = bassSlice.reduce((a, b) => a + b, 0) / bassSlice.length;

  const midSlice = dataArray.slice(10, 100);
  const mid = midSlice.reduce((a, b) => a + b, 0) / midSlice.length;

  const trebleSlice = dataArray.slice(100, 255);
  const treble = trebleSlice.reduce((a, b) => a + b, 0) / trebleSlice.length;

  return { average, bass, mid, treble };
};

/**
 * Get frequency value for a specific band
 */
export const getFrequencyValue = (
  band: FrequencyBand,
  frequencies: FrequencyData,
  beatData: BeatData
): number => {
  switch (band) {
    case 'bass':
      return frequencies.bass;
    case 'mid':
      return frequencies.mid;
    case 'treble':
      return frequencies.treble;
    case 'beat':
      // Return 255 on beat, decay exponentially
      // Handle Infinity (no beat detected yet) by returning 0
      if (beatData.isBeat) return 255;
      if (!isFinite(beatData.timeSinceBeat)) return 0;
      return Math.max(0, 255 * Math.exp(-beatData.timeSinceBeat * 8));
    case 'energy':
      return beatData.energy * 255;
    case 'avg':
    default:
      return frequencies.average;
  }
};

/**
 * Calculate pulse factor from frequency value
 */
export const calculatePulse = (freqValue: number, intensity: number): number => {
  return 1 + (freqValue / 255) * 0.5 * intensity;
};

/**
 * Calculate camera shake offset based on bass frequency
 */
export const calculateCameraShake = (
  bassFreq: number,
  shakeIntensity: number,
  threshold: number = 160
): { x: number; y: number } => {
  if (bassFreq <= threshold) {
    return { x: 0, y: 0 };
  }

  const intensity = Math.pow((bassFreq - threshold) / (255 - threshold), 2);
  const power = intensity * 15 * shakeIntensity;

  return {
    x: (Math.random() - 0.5) * power,
    y: (Math.random() - 0.5) * power,
  };
};

/**
 * High-precision audio timing with drift correction
 * Uses AudioContext for sub-frame accuracy
 */
export const getPreciseAudioTime = (
  audioElement: HTMLAudioElement | null,
  audioContext: AudioContext | null,
  contextStartTime: number,
  elementStartTime: number
): number => {
  if (!audioElement) return 0;

  // Use AudioContext for high precision when available
  if (audioContext && contextStartTime > 0) {
    const contextElapsed = audioContext.currentTime - contextStartTime;
    const predictedTime = elementStartTime + contextElapsed;

    // Validate against actual audio time to prevent drift
    const actualTime = audioElement.currentTime;
    const drift = Math.abs(predictedTime - actualTime);

    // Re-sync if drift exceeds 100ms
    if (drift > 0.1) {
      return actualTime;
    }

    return predictedTime;
  }

  return audioElement.currentTime;
};

/**
 * Calculate aspect ratio dimensions
 */
export interface DimensionResult {
  width: number;
  height: number;
}

export const calculateDimensions = (
  containerWidth: number,
  containerHeight: number,
  aspectRatio: string
): DimensionResult => {
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;

  let width = containerWidth;
  let height = containerWidth / ratio;

  if (height > containerHeight) {
    height = containerHeight;
    width = containerHeight * ratio;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
};
