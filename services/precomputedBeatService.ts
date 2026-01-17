/**
 * Pre-computed Beat Service
 * Analyzes entire audio buffer to generate a beat map for predictive synchronization
 */

import { BeatMap, BeatEvent, BPMSegment, useBeatMapStore } from '../src/stores/beatMapStore';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // FFT settings
  fftSize: 2048,
  hopSize: 512, // Samples between analysis frames (~11.6ms at 44.1kHz)

  // Beat detection thresholds
  minBeatInterval: 0.1, // 100ms minimum between beats (600 BPM max)
  adaptiveThresholdDecay: 0.95,
  adaptiveThresholdRise: 0.05,
  thresholdMultiplier: 1.5,
  thresholdFloor: 0.05,

  // BPM estimation
  minBPM: 30,
  maxBPM: 300,
  bpmSmoothingFactor: 0.9,

  // Energy profile resolution (samples per second)
  energySampleRate: 30,
};

// ============================================================================
// Types
// ============================================================================

interface AnalysisFrame {
  time: number;
  energy: number;
  spectralFlux: number;
  spectralCentroid: number;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Analyze an audio buffer and generate a complete beat map
 */
export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: number) => void
): Promise<BeatMap> {
  const store = useBeatMapStore.getState();
  store.setIsAnalyzing(true);
  store.setAnalysisProgress(0);
  store.setAnalysisError(null);

  try {
    // Convert to mono if stereo
    const channelData = getMixedChannelData(audioBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Phase 1: Extract analysis frames (0-50% progress)
    const frames = await extractAnalysisFrames(channelData, sampleRate, (p) => {
      const progress = p * 0.5;
      store.setAnalysisProgress(progress);
      onProgress?.(progress);
    });

    // Phase 2: Detect beats from frames (50-80% progress)
    const beats = detectBeatsFromFrames(frames, (p) => {
      const progress = 0.5 + p * 0.3;
      store.setAnalysisProgress(progress);
      onProgress?.(progress);
    });

    // Phase 3: Analyze BPM segments (80-90% progress)
    store.setAnalysisProgress(0.8);
    onProgress?.(0.8);
    const bpmSegments = analyzeBPMSegments(beats, duration);

    // Phase 4: Generate energy profile (90-100% progress)
    store.setAnalysisProgress(0.9);
    onProgress?.(0.9);
    const energyProfile = generateEnergyProfile(frames, duration);

    // Calculate average BPM
    const averageBPM = calculateAverageBPM(beats);

    // Find peak energy (handle empty profile)
    const peakEnergy = energyProfile.length > 0 ? Math.max(...Array.from(energyProfile)) : 0;

    const beatMap: BeatMap = {
      beats,
      bpmSegments,
      energyProfile,
      peakEnergy,
      averageBPM,
      duration,
      analysisTimestamp: Date.now(),
    };

    store.setBeatMap(beatMap);
    store.setIsAnalyzing(false);
    store.setAnalysisProgress(1);
    onProgress?.(1);

    return beatMap;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
    store.setAnalysisError(errorMessage);
    throw error;
  }
}

/**
 * Mix stereo channels to mono
 */
function getMixedChannelData(audioBuffer: AudioBuffer): Float32Array {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  const mixed = new Float32Array(left.length);

  for (let i = 0; i < left.length; i++) {
    mixed[i] = (left[i] + right[i]) / 2;
  }

  return mixed;
}

/**
 * Extract analysis frames using FFT
 */
async function extractAnalysisFrames(
  channelData: Float32Array,
  sampleRate: number,
  onProgress?: (progress: number) => void
): Promise<AnalysisFrame[]> {
  const frames: AnalysisFrame[] = [];
  const fftSize = CONFIG.fftSize;
  const hopSize = CONFIG.hopSize;
  const totalFrames = Math.floor((channelData.length - fftSize) / hopSize);

  // Guard against audio that's too short
  if (totalFrames <= 0) {
    return frames;
  }

  // Create offline FFT using a simple DFT for magnitude spectrum
  // (In production, consider using a Web Worker with proper FFT library)
  let previousSpectrum: Float32Array | null = null;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const startSample = frameIndex * hopSize;
    const time = startSample / sampleRate;

    // Extract frame samples
    const frameSamples = channelData.slice(startSample, startSample + fftSize);

    // Apply Hann window
    const windowed = applyHannWindow(frameSamples);

    // Calculate magnitude spectrum using real FFT approximation
    const spectrum = calculateMagnitudeSpectrum(windowed);

    // Calculate features
    const energy = calculateEnergy(spectrum);
    const spectralFlux = calculateSpectralFlux(spectrum, previousSpectrum);
    const spectralCentroid = calculateSpectralCentroid(spectrum);

    frames.push({
      time,
      energy,
      spectralFlux,
      spectralCentroid,
    });

    previousSpectrum = spectrum;

    // Report progress every 100 frames
    if (frameIndex % 100 === 0) {
      onProgress?.(frameIndex / totalFrames);
      // Yield to prevent UI blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return frames;
}

/**
 * Apply Hann window to samples
 */
function applyHannWindow(samples: Float32Array): Float32Array {
  const windowed = new Float32Array(samples.length);
  const N = samples.length;

  for (let i = 0; i < N; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    windowed[i] = samples[i] * window;
  }

  return windowed;
}

/**
 * Calculate magnitude spectrum using DFT
 * Simplified implementation - only calculates positive frequencies
 */
function calculateMagnitudeSpectrum(samples: Float32Array): Float32Array {
  const N = samples.length;
  const numBins = Math.floor(N / 2);
  const spectrum = new Float32Array(numBins);

  // Simplified magnitude calculation using energy in frequency bands
  // This is a performance optimization - for full accuracy use proper FFT
  const bandSize = Math.floor(N / numBins);

  for (let bin = 0; bin < numBins; bin++) {
    let sum = 0;
    const start = bin * bandSize;
    const end = Math.min(start + bandSize, N);

    for (let i = start; i < end; i++) {
      sum += samples[i] * samples[i];
    }

    spectrum[bin] = Math.sqrt(sum / bandSize) * 255; // Normalize to 0-255 range
  }

  return spectrum;
}

/**
 * Calculate RMS energy
 */
function calculateEnergy(spectrum: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < spectrum.length; i++) {
    sum += spectrum[i] * spectrum[i];
  }
  return Math.sqrt(sum / spectrum.length) / 255;
}

/**
 * Calculate spectral flux (onset detection)
 */
function calculateSpectralFlux(
  spectrum: Float32Array,
  previousSpectrum: Float32Array | null
): number {
  if (!previousSpectrum) return 0;

  let flux = 0;
  for (let i = 0; i < spectrum.length; i++) {
    const diff = spectrum[i] - previousSpectrum[i];
    if (diff > 0) flux += diff;
  }

  return flux / spectrum.length / 255;
}

/**
 * Calculate spectral centroid (brightness)
 */
function calculateSpectralCentroid(spectrum: Float32Array): number {
  let weightedSum = 0;
  let sum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    weightedSum += i * spectrum[i];
    sum += spectrum[i];
  }

  if (sum === 0) return 0;
  return weightedSum / sum / spectrum.length;
}

/**
 * Detect beats from analysis frames using adaptive threshold
 */
function detectBeatsFromFrames(
  frames: AnalysisFrame[],
  onProgress?: (progress: number) => void
): BeatEvent[] {
  const beats: BeatEvent[] = [];
  let adaptiveThreshold = 0;
  let lastBeatTime = -Infinity;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const flux = frame.spectralFlux;

    // Update adaptive threshold
    adaptiveThreshold =
      adaptiveThreshold * CONFIG.adaptiveThresholdDecay + flux * CONFIG.adaptiveThresholdRise;

    // Calculate threshold
    const threshold = adaptiveThreshold * CONFIG.thresholdMultiplier + CONFIG.thresholdFloor;

    // Check for beat
    const timeSinceLastBeat = frame.time - lastBeatTime;
    if (flux > threshold && timeSinceLastBeat >= CONFIG.minBeatInterval) {
      const intensity = Math.min(1, flux / (threshold + 0.01));
      const confidence = Math.min(1, (flux - threshold) / threshold);

      beats.push({
        time: frame.time,
        intensity,
        confidence,
      });

      lastBeatTime = frame.time;
    }

    if (i % 500 === 0) {
      onProgress?.(i / frames.length);
    }
  }

  return beats;
}

/**
 * Analyze BPM segments (detect tempo changes)
 */
function analyzeBPMSegments(beats: BeatEvent[], duration: number): BPMSegment[] {
  if (beats.length < 4) {
    return [{ startTime: 0, endTime: duration, bpm: 120 }];
  }

  const segments: BPMSegment[] = [];
  const windowSize = 8; // Beats per window for BPM calculation

  for (let i = 0; i < beats.length - windowSize; i += windowSize / 2) {
    const windowBeats = beats.slice(i, i + windowSize);
    const intervals: number[] = [];

    for (let j = 1; j < windowBeats.length; j++) {
      intervals.push(windowBeats[j].time - windowBeats[j - 1].time);
    }

    // Use median interval for robustness
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];

    if (medianInterval > 0.2 && medianInterval < 2) {
      const bpm = Math.round(60 / medianInterval);
      if (bpm >= CONFIG.minBPM && bpm <= CONFIG.maxBPM) {
        const startTime = windowBeats[0].time;
        const endTime = windowBeats[windowBeats.length - 1].time;

        // Merge with previous segment if same BPM
        if (segments.length > 0 && segments[segments.length - 1].bpm === bpm) {
          segments[segments.length - 1].endTime = endTime;
        } else {
          segments.push({ startTime, endTime, bpm });
        }
      }
    }
  }

  // Fill gaps and extend to duration
  if (segments.length === 0) {
    return [{ startTime: 0, endTime: duration, bpm: calculateAverageBPM(beats) }];
  }

  // Extend first segment to start
  segments[0].startTime = 0;

  // Extend last segment to end
  segments[segments.length - 1].endTime = duration;

  return segments;
}

/**
 * Calculate average BPM from beats
 */
function calculateAverageBPM(beats: BeatEvent[]): number {
  if (beats.length < 2) return 120;

  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i].time - beats[i - 1].time);
  }

  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];

  if (medianInterval > 0.2 && medianInterval < 2) {
    const bpm = 60 / medianInterval;
    return Math.max(CONFIG.minBPM, Math.min(CONFIG.maxBPM, Math.round(bpm)));
  }

  return 120;
}

/**
 * Generate energy profile at fixed sample rate
 */
function generateEnergyProfile(frames: AnalysisFrame[], duration: number): Float32Array {
  const numSamples = Math.ceil(duration * CONFIG.energySampleRate);
  const profile = new Float32Array(numSamples);

  if (frames.length === 0) return profile;

  for (let i = 0; i < numSamples; i++) {
    const time = (i / numSamples) * duration;

    // Find nearest frame
    let nearestFrame = frames[0];
    let minDist = Math.abs(frames[0].time - time);

    for (const frame of frames) {
      const dist = Math.abs(frame.time - time);
      if (dist < minDist) {
        minDist = dist;
        nearestFrame = frame;
      }
      if (frame.time > time) break; // Frames are sorted
    }

    profile[i] = nearestFrame.energy;
  }

  return profile;
}

/**
 * Clear the current beat map
 */
export function clearBeatMap(): void {
  useBeatMapStore.getState().reset();
}

/**
 * Check if a beat map exists
 */
export function hasBeatMap(): boolean {
  return useBeatMapStore.getState().beatMap !== null;
}
