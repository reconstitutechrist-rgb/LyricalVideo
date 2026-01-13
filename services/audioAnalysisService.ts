/**
 * Audio Analysis Service
 * Provides waveform generation and audio analysis utilities for the lyric sync system.
 */

// Re-export time utilities for backwards compatibility
// (components that already import from here will continue to work)
export { formatTime, parseTime } from '../src/utils/time';

import { generateWaveformDataAsync, supportsWebWorker } from '../src/utils/waveformWorkerClient';

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
  channelCount: number;
}

export interface WaveformOptions {
  targetWidth?: number; // Number of samples to generate (default: 2000)
  channel?: number; // Which channel to analyze (default: 0)
  normalize?: boolean; // Normalize peaks to 0-1 range (default: true)
}

/**
 * Generate waveform peak data for visualization
 * Downsamples audio to a manageable number of peaks for canvas rendering
 * Uses Web Worker for non-blocking processing when available
 */
export const generateWaveformData = async (
  audioBuffer: AudioBuffer,
  options: WaveformOptions = {}
): Promise<WaveformData> => {
  const { targetWidth = 2000, channel = 0, normalize = true } = options;

  const channelData = audioBuffer.getChannelData(
    Math.min(channel, audioBuffer.numberOfChannels - 1)
  );

  // Use Web Worker if available for non-blocking processing
  if (supportsWebWorker()) {
    try {
      const peaks = await generateWaveformDataAsync(channelData, targetWidth, normalize);
      return {
        peaks,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channelCount: audioBuffer.numberOfChannels,
      };
    } catch (e) {
      console.warn('Web Worker failed, falling back to main thread:', e);
      // Fall through to synchronous implementation
    }
  }

  // Fallback: synchronous implementation on main thread
  const samplesPerPixel = Math.floor(channelData.length / targetWidth);
  const peaks = new Float32Array(targetWidth);

  let maxPeak = 0;

  for (let i = 0; i < targetWidth; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, channelData.length);
    let max = 0;

    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }

    peaks[i] = max;
    if (max > maxPeak) maxPeak = max;
  }

  // Normalize if requested
  if (normalize && maxPeak > 0) {
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = peaks[i] / maxPeak;
    }
  }

  return {
    peaks,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channelCount: audioBuffer.numberOfChannels,
  };
};

/**
 * Generate stereo waveform data (both channels)
 */
export const generateStereoWaveformData = async (
  audioBuffer: AudioBuffer,
  targetWidth: number = 2000
): Promise<{ left: Float32Array; right: Float32Array; duration: number }> => {
  const left = (await generateWaveformData(audioBuffer, { targetWidth, channel: 0 })).peaks;
  const right =
    audioBuffer.numberOfChannels > 1
      ? (await generateWaveformData(audioBuffer, { targetWidth, channel: 1 })).peaks
      : left;

  return {
    left,
    right,
    duration: audioBuffer.duration,
  };
};

/**
 * Convert time (seconds) to pixel position
 */
export const timeToPixel = (
  time: number,
  duration: number,
  width: number,
  zoom: number = 1,
  scrollOffset: number = 0
): number => {
  return (time / duration) * width * zoom - scrollOffset;
};

/**
 * Convert pixel position to time (seconds)
 */
export const pixelToTime = (
  pixel: number,
  duration: number,
  width: number,
  zoom: number = 1,
  scrollOffset: number = 0
): number => {
  return ((pixel + scrollOffset) / (width * zoom)) * duration;
};

// formatTime and parseTime are now imported from src/utils/time.ts and re-exported above

/**
 * Calculate appropriate time ruler intervals based on zoom level
 */
export const getTimeRulerIntervals = (
  zoom: number,
  _duration: number
): { major: number; minor: number } => {
  // At zoom 1x, show major marks every 10 seconds, minor every 1 second
  // At higher zoom, show finer intervals
  if (zoom >= 4) {
    return { major: 1, minor: 0.1 };
  } else if (zoom >= 2) {
    return { major: 5, minor: 0.5 };
  } else if (zoom >= 1) {
    return { major: 10, minor: 1 };
  } else {
    return { major: 30, minor: 5 };
  }
};

/**
 * Snap time to nearest grid interval
 */
export const snapToGrid = (time: number, gridSize: number): number => {
  return Math.round(time / gridSize) * gridSize;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculate visible time range based on scroll and zoom
 */
export const getVisibleTimeRange = (
  scrollOffset: number,
  containerWidth: number,
  duration: number,
  zoom: number
): { start: number; end: number } => {
  const totalWidth = containerWidth * zoom;
  const pixelsPerSecond = totalWidth / duration;

  const start = scrollOffset / pixelsPerSecond;
  const end = (scrollOffset + containerWidth) / pixelsPerSecond;

  return {
    start: clamp(start, 0, duration),
    end: clamp(end, 0, duration),
  };
};

/**
 * Check if a time range is visible in the current viewport
 */
export const isTimeRangeVisible = (
  startTime: number,
  endTime: number,
  visibleStart: number,
  visibleEnd: number
): boolean => {
  return startTime < visibleEnd && endTime > visibleStart;
};

/**
 * Get section color for lyric blocks
 */
export const getSectionColor = (section?: string): string => {
  if (!section) return 'rgba(100, 149, 237, 0.6)'; // Default blue

  const sectionLower = section.toLowerCase();

  if (sectionLower.includes('chorus')) return 'rgba(236, 72, 153, 0.6)'; // Pink
  if (sectionLower.includes('verse')) return 'rgba(59, 130, 246, 0.6)'; // Blue
  if (sectionLower.includes('bridge')) return 'rgba(168, 85, 247, 0.6)'; // Purple
  if (sectionLower.includes('intro')) return 'rgba(34, 197, 94, 0.6)'; // Green
  if (sectionLower.includes('outro')) return 'rgba(249, 115, 22, 0.6)'; // Orange
  if (sectionLower.includes('pre')) return 'rgba(14, 165, 233, 0.6)'; // Sky blue

  return 'rgba(100, 149, 237, 0.6)'; // Default
};
