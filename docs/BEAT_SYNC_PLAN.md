# Beat Detection & Enhanced Audio-Reactive Animation System

## Overview

Enhance the animation synchronization system to include **beat detection**, **BPM estimation**, and **energy dynamics** alongside the existing frequency-based reactivity. This enables effects to "punch" on drum hits and sync animations to the rhythm of the music.

## Current System Analysis

### Existing Audio Data Interface

**File**: [src/effects/core/Effect.ts](../src/effects/core/Effect.ts) (lines 12-18)

```typescript
export interface AudioData {
  bass: number; // 0-255 (FFT bins 0-10)
  mid: number; // 0-255 (FFT bins 10-100)
  treble: number; // 0-255 (FFT bins 100-255)
  average: number; // 0-255 (all bins averaged)
  raw: Uint8Array; // Full 512-bin frequency data
}
```

### Existing Frequency Analysis

**File**: [components/Visualizer.tsx](../components/Visualizer.tsx) (lines 530-562)

```typescript
// Real-time frequency extraction using Web Audio API
analyserRef.current.getByteFrequencyData(dataArrayRef.current);

// Band extraction:
const bassSlice = dataArrayRef.current.slice(0, 10); // Low frequencies
const midSlice = dataArrayRef.current.slice(10, 100); // Mid frequencies
const trebleSlice = dataArrayRef.current.slice(100, 255); // High frequencies
```

### Existing Frequency Mapping

**File**: [types.ts](../types.ts) (lines 179, 205-209)

```typescript
export type FrequencyBand = 'bass' | 'mid' | 'treble' | 'avg';

frequencyMapping: {
  pulse: FrequencyBand; // Drives scaling/size
  motion: FrequencyBand; // Drives movement speed/offset
  color: FrequencyBand; // Drives color shifts/glow
}
```

### Current Usage Examples

**Camera Shake** (Visualizer.tsx:574-582):

- Triggers when `bassFreq > 160` threshold
- Continuous modulation based on bass intensity

**Particle Motion** (Visualizer.tsx):

- Size scales with `pulseFreqValue`
- Speed multiplies with `motionFreqValue`

---

## Proposed Enhancement

### Phase 1: Extended AudioData Interface

**File**: [src/effects/core/Effect.ts](../src/effects/core/Effect.ts)

Add beat and rhythm data to the existing interface:

```typescript
export interface AudioData {
  // === EXISTING (unchanged) ===
  bass: number;
  mid: number;
  treble: number;
  average: number;
  raw: Uint8Array;

  // === NEW: Beat Detection ===
  isBeat: boolean; // True on frames where beat is detected
  beatIntensity: number; // 0-1 strength of detected beat
  timeSinceBeat: number; // Seconds since last beat (for decay curves)

  // === NEW: Rhythm Info ===
  bpm: number; // Estimated tempo (beats per minute)
  beatPhase: number; // 0-1 position within current beat cycle

  // === NEW: Energy Dynamics ===
  energy: number; // 0-1 overall energy level (RMS amplitude)
  energyDelta: number; // Rate of change (positive = building up)

  // === NEW: Spectral Features ===
  spectralCentroid: number; // 0-1 "brightness" of sound
  spectralFlux: number; // Rate of spectral change (onset indicator)
}
```

### Phase 2: Beat Detection Service

**New File**: `services/beatDetectionService.ts`

```typescript
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
}

export class BeatDetector {
  private previousSpectrum: Float32Array | null = null;
  private onsetHistory: number[] = [];
  private lastBeatTime: number = 0;
  private adaptiveThreshold: number = 0;
  private bpmEstimate: number = 120;
  private energyHistory: number[] = [];

  /**
   * Analyze audio frame and detect beats
   */
  analyze(frequencyData: Uint8Array, currentTime: number): BeatData {
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

    return {
      isBeat,
      beatIntensity,
      timeSinceBeat: currentTime - this.lastBeatTime,
      bpm: this.bpmEstimate,
      beatPhase,
      energy,
      energyDelta,
      spectralCentroid,
      spectralFlux: flux,
    };
  }

  /**
   * Spectral flux: sum of positive differences between current and previous spectrum
   */
  private calculateSpectralFlux(frequencyData: Uint8Array): number {
    if (!this.previousSpectrum) {
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
   */
  private detectOnset(
    flux: number,
    currentTime: number
  ): { isBeat: boolean; beatIntensity: number } {
    // Update adaptive threshold (moving average)
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + flux * 0.05;

    const threshold = this.adaptiveThreshold * 1.5 + 0.05; // Threshold with minimum
    const isBeat = flux > threshold && currentTime - this.lastBeatTime > 0.1; // Min 100ms between beats

    if (isBeat) {
      this.lastBeatTime = currentTime;
      this.onsetHistory.push(currentTime);
      // Keep last 20 onsets for BPM calculation
      if (this.onsetHistory.length > 20) {
        this.onsetHistory.shift();
      }
    }

    return {
      isBeat,
      beatIntensity: Math.min(1, flux / (threshold + 0.01)),
    };
  }

  /**
   * Estimate BPM from onset intervals using autocorrelation
   */
  private updateBPMEstimate(): void {
    if (this.onsetHistory.length < 4) return;

    // Calculate intervals between onsets
    const intervals: number[] = [];
    for (let i = 1; i < this.onsetHistory.length; i++) {
      intervals.push(this.onsetHistory[i] - this.onsetHistory[i - 1]);
    }

    // Find most common interval (mode)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval > 0.2 && avgInterval < 2) {
      // 30-300 BPM range
      const bpm = 60 / avgInterval;
      // Smooth BPM estimate
      this.bpmEstimate = this.bpmEstimate * 0.9 + bpm * 0.1;
    }
  }

  /**
   * Calculate position within current beat cycle (0-1)
   */
  private calculateBeatPhase(currentTime: number): number {
    const beatDuration = 60 / this.bpmEstimate;
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    return (timeSinceLastBeat % beatDuration) / beatDuration;
  }

  /**
   * Calculate RMS energy of spectrum
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
   */
  private calculateEnergyDelta(energy: number): number {
    this.energyHistory.push(energy);
    if (this.energyHistory.length > 10) {
      this.energyHistory.shift();
    }

    if (this.energyHistory.length < 2) return 0;

    const recent = this.energyHistory.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = this.energyHistory.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    return recent - older;
  }

  /**
   * Spectral centroid: weighted mean of frequencies (brightness indicator)
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
   * Reset detector state
   */
  reset(): void {
    this.previousSpectrum = null;
    this.onsetHistory = [];
    this.lastBeatTime = 0;
    this.adaptiveThreshold = 0;
    this.energyHistory = [];
  }
}
```

### Phase 3: Visualizer Integration

**File**: [components/Visualizer.tsx](../components/Visualizer.tsx)

Add beat detection to the draw loop:

```typescript
// Add import
import { BeatDetector } from '../services/beatDetectionService';

// Add ref (near other refs ~line 250)
const beatDetectorRef = useRef<BeatDetector>(new BeatDetector());

// In draw() function, after existing frequency analysis (~line 549):
const beatData = beatDetectorRef.current.analyze(
  dataArrayRef.current,
  audioRef.current?.currentTime || 0
);

// Build enhanced audioData object for effects
const audioData: AudioData = {
  // Existing
  bass: bassFreq,
  mid: midFreq,
  treble: trebleFreq,
  average: averageFreq,
  raw: dataArrayRef.current,
  // New beat data
  ...beatData,
};
```

### Phase 4: Extended Frequency Band Type

**File**: [types.ts](../types.ts)

```typescript
// Update FrequencyBand to include new options
export type FrequencyBand = 'bass' | 'mid' | 'treble' | 'avg' | 'beat' | 'energy';
```

### Phase 5: Update getFreqValue Helper

**File**: [components/Visualizer.tsx](../components/Visualizer.tsx) (lines 551-562)

```typescript
const getFreqValue = (band: FrequencyBand): number => {
  switch (band) {
    case 'bass':
      return bassFreq;
    case 'mid':
      return midFreq;
    case 'treble':
      return trebleFreq;
    case 'beat':
      // Return 255 on beat, decay otherwise
      return beatData.isBeat ? 255 : Math.max(0, 255 - beatData.timeSinceBeat * 500);
    case 'energy':
      return beatData.energy * 255;
    default:
      return averageFreq;
  }
};
```

---

## Usage Examples

### Beat-Triggered Particle Burst

```typescript
// In particle update or effect render
if (audioData.isBeat) {
  // Spawn burst of particles
  spawnParticleBurst(10);
}
```

### Decay-Based Scaling

```typescript
// Smooth decay after beat
const beatScale = 1 + 0.3 * Math.exp(-audioData.timeSinceBeat * 8);
ctx.scale(beatScale, beatScale);
```

### BPM-Synced Animation

```typescript
// Bounce that syncs with tempo
const bounce = Math.sin(audioData.beatPhase * Math.PI * 2);
const y = baseY + bounce * 20;
```

### Energy-Based Glow

```typescript
// Glow intensifies during buildups
const glowIntensity = audioData.energy + audioData.energyDelta * 2;
ctx.shadowBlur = glowIntensity * 30;
```

---

## Implementation Order

1. **Create BeatDetector service** - `services/beatDetectionService.ts`
2. **Extend AudioData interface** - `src/effects/core/Effect.ts`
3. **Integrate into Visualizer** - `components/Visualizer.tsx`
4. **Extend FrequencyBand type** - `types.ts`
5. **Update getFreqValue helper** - `components/Visualizer.tsx`
6. **Add UI controls** - `src/components/LyricalFlowUI/LyricalFlowUI.tsx`

---

## Files Summary

| Action | File                                             | Description                              |
| ------ | ------------------------------------------------ | ---------------------------------------- |
| CREATE | `services/beatDetectionService.ts`               | Beat detection class with all algorithms |
| MODIFY | `src/effects/core/Effect.ts`                     | Extend AudioData interface               |
| MODIFY | `components/Visualizer.tsx`                      | Integrate beat detector in draw loop     |
| MODIFY | `types.ts`                                       | Add 'beat' and 'energy' to FrequencyBand |
| MODIFY | `src/components/LyricalFlowUI/LyricalFlowUI.tsx` | Add beat mapping options to UI           |

---

## Verification

### 1. Beat Detection Accuracy

- Play song with clear drum beat (hip-hop, EDM)
- Log `isBeat` events and compare to actual drum hits
- Verify BPM estimate matches known song tempo

### 2. Visual Response

- Set `frequencyMapping.pulse` to `'beat'`
- Verify particles/text "pop" on each drum hit
- Check that effect feels musical and in-sync

### 3. Performance

- Monitor frame rate during playback
- Ensure beat detection adds <1ms per frame
- Check for memory leaks (onset history buffer)

### 4. Edge Cases

- Test with music without clear beat (ambient, classical)
- Test with very fast music (drum & bass, ~170+ BPM)
- Test with very slow music (ballads, ~60 BPM)
