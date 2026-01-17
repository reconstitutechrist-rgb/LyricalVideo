/**
 * Beat Detection Service
 * Real-time beat detection, BPM estimation, and audio feature extraction
 */

import { useBeatMapStore } from '../src/stores/beatMapStore';
import { analyzeAudioBuffer } from './precomputedBeatService';

export interface BeatData {
  isBeat: boolean;
  beatIntensity: number;
  timeSinceBeat: number;
  bpm: number;
  beatPhase: number;
  energy: number;
  energyDelta: number;
  spectralCentroid: number;
  spectralFlux: number;
  // New: upcoming beat info from pre-computed analysis
  upcomingBeat?: {
    timeUntil: number;
    intensity: number;
  };
}

export interface SmoothingConfig {
  /**
   * Smoothing factor for energy values (0-1, higher = more smoothing)
   * @default 0.3
   */
  energy: number;

  /**
   * Smoothing factor for spectral flux (0-1, higher = more smoothing)
   * @default 0.2
   */
  spectralFlux: number;

  /**
   * Smoothing factor for spectral centroid (0-1, higher = more smoothing)
   * @default 0.5
   */
  spectralCentroid: number;
}

const DEFAULT_SMOOTHING: SmoothingConfig = {
  energy: 0.3,
  spectralFlux: 0.2,
  spectralCentroid: 0.5,
};

export class BeatDetector {
  private previousSpectrum: Float32Array | null = null;
  private onsetHistory: number[] = [];
  private lastBeatTime: number = -1; // -1 indicates no beat detected yet
  private adaptiveThreshold: number = 0;
  private bpmEstimate: number = 120;
  private energyHistory: number[] = [];
  private lastAnalysisTime: number = 0;

  // Smoothing state
  private smoothingConfig: SmoothingConfig = { ...DEFAULT_SMOOTHING };
  private smoothedEnergy: number = 0;
  private smoothedSpectralFlux: number = 0;
  private smoothedSpectralCentroid: number = 0;

  /**
   * Analyze audio frame and detect beats
   */
  analyze(frequencyData: Uint8Array, currentTime: number): BeatData {
    // Guard against invalid currentTime
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      currentTime = 0;
    }

    // Guard against empty or invalid data
    if (!frequencyData || frequencyData.length === 0) {
      return {
        isBeat: false,
        beatIntensity: 0,
        timeSinceBeat: this.lastBeatTime >= 0 ? currentTime - this.lastBeatTime : Infinity,
        bpm: this.bpmEstimate,
        beatPhase: 0,
        energy: 0,
        energyDelta: 0,
        spectralCentroid: 0,
        spectralFlux: 0,
      };
    }

    // Detect if user seeked backwards - reset state if so
    if (currentTime < this.lastAnalysisTime - 0.5) {
      this.handleSeek(currentTime);
    }
    this.lastAnalysisTime = currentTime;
    // 1. Calculate spectral flux (change between frames)
    const flux = this.calculateSpectralFlux(frequencyData);

    // 2. Calculate energy (RMS of frequency magnitudes)
    const energy = this.calculateEnergy(frequencyData);

    // 3. Detect onset using adaptive threshold
    const { isBeat, beatIntensity } = this.detectOnset(flux, currentTime);

    // 4. Update BPM estimate from onset history
    this.updateBPMEstimate();

    // 5. Calculate beat phase (0-1 position in beat cycle)
    const beatPhase = this.calculateBeatPhase(currentTime);

    // 6. Calculate energy delta (rate of change)
    const energyDelta = this.calculateEnergyDelta(energy);

    // 7. Calculate spectral centroid (brightness)
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData);

    // 8. Update smoothed values for visual effects
    this.smoothedEnergy = this.applySmoothing(
      energy,
      this.smoothedEnergy,
      this.smoothingConfig.energy
    );
    this.smoothedSpectralFlux = this.applySmoothing(
      flux,
      this.smoothedSpectralFlux,
      this.smoothingConfig.spectralFlux
    );
    this.smoothedSpectralCentroid = this.applySmoothing(
      spectralCentroid,
      this.smoothedSpectralCentroid,
      this.smoothingConfig.spectralCentroid
    );

    // Calculate timeSinceBeat, handling the "no beat yet" case
    const timeSinceBeat =
      this.lastBeatTime >= 0 ? Math.max(0, currentTime - this.lastBeatTime) : Infinity;

    // Check for upcoming beat from pre-computed beat map
    const beatMapStore = useBeatMapStore.getState();
    const upcomingBeatInfo = beatMapStore.getUpcomingBeat(currentTime, 100);

    const result: BeatData = {
      isBeat,
      beatIntensity,
      timeSinceBeat,
      bpm: this.bpmEstimate,
      beatPhase,
      energy,
      energyDelta,
      spectralCentroid,
      spectralFlux: flux,
    };

    // Add upcoming beat info if available
    if (upcomingBeatInfo) {
      result.upcomingBeat = {
        timeUntil: upcomingBeatInfo.timeUntil * 1000, // Convert to ms
        intensity: upcomingBeatInfo.beat.intensity,
      };
    }

    return result;
  }

  /**
   * Spectral flux: sum of positive differences between current and previous spectrum
   * This detects onsets - when new sounds begin
   */
  private calculateSpectralFlux(frequencyData: Uint8Array): number {
    // Handle size mismatch (e.g., FFT size changed) - recreate buffer
    if (!this.previousSpectrum || this.previousSpectrum.length !== frequencyData.length) {
      this.previousSpectrum = new Float32Array(frequencyData);
      return 0;
    }

    let flux = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const diff = frequencyData[i] - this.previousSpectrum[i];
      flux += diff > 0 ? diff : 0; // Only positive changes (onsets)
    }

    // Update previous spectrum
    this.previousSpectrum.set(frequencyData);

    return flux / frequencyData.length / 255; // Normalize to 0-1
  }

  /**
   * Onset detection with adaptive threshold
   * Uses a moving average threshold that adapts to the music's dynamics
   */
  private detectOnset(
    flux: number,
    currentTime: number
  ): { isBeat: boolean; beatIntensity: number } {
    // Guard against NaN flux values
    if (!Number.isFinite(flux)) {
      flux = 0;
    }

    // Update adaptive threshold (exponential moving average)
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + flux * 0.05;

    // Guard against threshold going to invalid values
    if (!Number.isFinite(this.adaptiveThreshold)) {
      this.adaptiveThreshold = 0;
    }

    // Threshold with minimum floor to avoid false positives in quiet sections
    const threshold = this.adaptiveThreshold * 1.5 + 0.05;

    // Require minimum time between beats (100ms = max 600 BPM)
    // Handle first beat case when lastBeatTime is -1
    const timeSinceLastBeat = this.lastBeatTime < 0 ? Infinity : currentTime - this.lastBeatTime;
    const isBeat = flux > threshold && timeSinceLastBeat > 0.1;

    if (isBeat) {
      this.lastBeatTime = currentTime;
      this.onsetHistory.push(currentTime);
      // Keep last 20 onsets for BPM calculation - use while loop for safety
      while (this.onsetHistory.length > 20) {
        this.onsetHistory.shift();
      }
      // Additional safety: hard cap at 50 entries if something goes wrong
      if (this.onsetHistory.length > 50) {
        this.onsetHistory = this.onsetHistory.slice(-20);
      }
    }

    return {
      isBeat,
      beatIntensity: Math.min(1, flux / (threshold + 0.01)),
    };
  }

  /**
   * Estimate BPM from onset intervals
   * Uses median interval to be robust against outliers
   */
  private updateBPMEstimate(): void {
    if (this.onsetHistory.length < 4) return;

    // Calculate intervals between onsets
    const intervals: number[] = [];
    for (let i = 1; i < this.onsetHistory.length; i++) {
      intervals.push(this.onsetHistory[i] - this.onsetHistory[i - 1]);
    }

    // Use median interval for robustness
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];

    // Valid BPM range: 30-300 (interval 0.2s - 2s)
    if (medianInterval > 0.2 && medianInterval < 2) {
      const bpm = 60 / medianInterval;
      // Guard against NaN/Infinity from calculation errors
      if (Number.isFinite(bpm) && bpm >= 30 && bpm <= 300) {
        // Smooth BPM estimate to avoid jitter
        this.bpmEstimate = this.bpmEstimate * 0.9 + bpm * 0.1;
        // Clamp final estimate to valid range
        this.bpmEstimate = Math.max(30, Math.min(300, this.bpmEstimate));
      }
    }
  }

  /**
   * Calculate position within current beat cycle (0-1)
   * Useful for BPM-synced animations
   */
  private calculateBeatPhase(currentTime: number): number {
    const beatDuration = 60 / this.bpmEstimate;

    // If no beat detected yet, use estimated BPM from start of track
    if (this.lastBeatTime < 0) {
      const phase = (currentTime % beatDuration) / beatDuration;
      // Clamp to 0-1 to handle floating point edge cases
      return Math.max(0, Math.min(1, phase));
    }

    const timeSinceLastBeat = Math.max(0, currentTime - this.lastBeatTime);
    const phase = (timeSinceLastBeat % beatDuration) / beatDuration;
    // Clamp to 0-1 to handle floating point edge cases
    return Math.max(0, Math.min(1, phase));
  }

  /**
   * Calculate RMS energy of spectrum
   * Represents overall loudness/intensity
   */
  private calculateEnergy(frequencyData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    return Math.sqrt(sum / frequencyData.length) / 255;
  }

  /**
   * Calculate rate of energy change
   * Positive = building up, Negative = dropping
   */
  private calculateEnergyDelta(energy: number): number {
    // Guard against NaN energy values
    if (!Number.isFinite(energy)) {
      energy = 0;
    }

    this.energyHistory.push(energy);
    while (this.energyHistory.length > 16) {
      this.energyHistory.shift();
    }
    // Safety cap
    if (this.energyHistory.length > 32) {
      this.energyHistory = this.energyHistory.slice(-16);
    }

    // Need at least 8 samples to compare two non-overlapping windows
    if (this.energyHistory.length < 8) return 0;

    const midpoint = Math.floor(this.energyHistory.length / 2);

    // Recent window: last half of history
    const recentWindow = this.energyHistory.slice(midpoint);
    const recent = recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;

    // Older window: first half of history
    const olderWindow = this.energyHistory.slice(0, midpoint);
    const older = olderWindow.reduce((a, b) => a + b, 0) / olderWindow.length;

    return recent - older;
  }

  /**
   * Spectral centroid: weighted mean of frequencies
   * Higher value = brighter/sharper sound, Lower = darker/duller
   */
  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      weightedSum += i * frequencyData[i];
      sum += frequencyData[i];
    }

    if (sum === 0) return 0;
    return weightedSum / sum / frequencyData.length;
  }

  /**
   * Handle seek events - partial reset to maintain some state
   */
  private handleSeek(newTime: number): void {
    // Clear onset history since timestamps are now invalid
    this.onsetHistory = [];
    // Reset last beat time but keep BPM estimate
    this.lastBeatTime = -1;
    // Clear energy history since it's time-dependent
    this.energyHistory = [];
    // Keep adaptiveThreshold and bpmEstimate for continuity
    this.lastAnalysisTime = newTime;
  }

  /**
   * Reset detector state (e.g., when changing tracks)
   */
  reset(): void {
    this.previousSpectrum = null;
    this.onsetHistory = [];
    this.lastBeatTime = -1;
    this.adaptiveThreshold = 0;
    this.energyHistory = [];
    this.bpmEstimate = 120;
    this.lastAnalysisTime = 0;

    // Reset smoothed values
    this.smoothedEnergy = 0;
    this.smoothedSpectralFlux = 0;
    this.smoothedSpectralCentroid = 0;
  }

  /**
   * Get current BPM estimate
   */
  getBPM(): number {
    return this.bpmEstimate;
  }

  /**
   * Configure smoothing parameters
   */
  setSmoothing(config: Partial<SmoothingConfig>): void {
    this.smoothingConfig = { ...this.smoothingConfig, ...config };
  }

  /**
   * Get current smoothing configuration
   */
  getSmoothing(): SmoothingConfig {
    return { ...this.smoothingConfig };
  }

  /**
   * Apply smoothing to a value using exponential moving average
   */
  private applySmoothing(current: number, previous: number, factor: number): number {
    return previous * factor + current * (1 - factor);
  }

  /**
   * Get smoothed audio features (for smoother visual reactivity)
   * Call after analyze() to get smoothed versions of the features
   */
  getSmoothedFeatures(): {
    energy: number;
    spectralFlux: number;
    spectralCentroid: number;
  } {
    return {
      energy: this.smoothedEnergy,
      spectralFlux: this.smoothedSpectralFlux,
      spectralCentroid: this.smoothedSpectralCentroid,
    };
  }

  /**
   * Analyze entire audio buffer and generate pre-computed beat map
   * This enables predictive beat synchronization
   */
  static async analyzeBatch(
    audioBuffer: AudioBuffer,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await analyzeAudioBuffer(audioBuffer, onProgress);
  }

  /**
   * Check if a pre-computed beat map is available
   */
  static hasBeatMap(): boolean {
    return useBeatMapStore.getState().beatMap !== null;
  }

  /**
   * Get the pre-computed beat map store for direct access
   */
  static getBeatMapStore() {
    return useBeatMapStore;
  }
}
