/**
 * Audio Analysis Utilities Tests
 * Unit tests for audio frequency and timing functions
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeFrequencies,
  getFrequencyValue,
  calculatePulse,
  calculateCameraShake,
  calculateDimensions,
} from './audioAnalysis';
import type { BeatData } from '../../services/beatDetectionService';

describe('audioAnalysis', () => {
  describe('analyzeFrequencies', () => {
    it('should calculate average frequency', () => {
      const dataArray = new Uint8Array([100, 100, 100, 100]);
      const result = analyzeFrequencies(dataArray);
      expect(result.average).toBe(100);
    });

    it('should calculate bass from first 10 values', () => {
      const dataArray = new Uint8Array(256);
      dataArray.fill(200, 0, 10); // High bass
      dataArray.fill(50, 10); // Low rest
      const result = analyzeFrequencies(dataArray);
      expect(result.bass).toBe(200);
    });

    it('should calculate mid from indices 10-100', () => {
      const dataArray = new Uint8Array(256);
      dataArray.fill(0, 0, 10);
      dataArray.fill(150, 10, 100); // High mid
      dataArray.fill(0, 100);
      const result = analyzeFrequencies(dataArray);
      expect(result.mid).toBe(150);
    });

    it('should calculate treble from indices 100-255', () => {
      const dataArray = new Uint8Array(256);
      dataArray.fill(0, 0, 100);
      dataArray.fill(180, 100, 255); // High treble
      const result = analyzeFrequencies(dataArray);
      expect(result.treble).toBeCloseTo(180, 0);
    });

    it('should handle empty array', () => {
      const dataArray = new Uint8Array(256);
      const result = analyzeFrequencies(dataArray);
      expect(result.average).toBe(0);
      expect(result.bass).toBe(0);
    });
  });

  describe('getFrequencyValue', () => {
    const frequencies = {
      average: 100,
      bass: 200,
      mid: 150,
      treble: 80,
    };

    const beatData: BeatData = {
      isBeat: false,
      beatIntensity: 0.8,
      bpm: 120,
      beatPhase: 0.5,
      energy: 0.7,
      energyDelta: 0.1,
      spectralCentroid: 2000,
      spectralFlux: 0.5,
      timeSinceBeat: 0.5,
    };

    it('should return bass frequency for bass band', () => {
      expect(getFrequencyValue('bass', frequencies, beatData)).toBe(200);
    });

    it('should return mid frequency for mid band', () => {
      expect(getFrequencyValue('mid', frequencies, beatData)).toBe(150);
    });

    it('should return treble frequency for treble band', () => {
      expect(getFrequencyValue('treble', frequencies, beatData)).toBe(80);
    });

    it('should return average for avg band', () => {
      expect(getFrequencyValue('avg', frequencies, beatData)).toBe(100);
    });

    it('should return 255 on beat', () => {
      const beatDataOnBeat = { ...beatData, isBeat: true };
      expect(getFrequencyValue('beat', frequencies, beatDataOnBeat)).toBe(255);
    });

    it('should return decayed value after beat', () => {
      const result = getFrequencyValue('beat', frequencies, beatData);
      expect(result).toBeLessThan(255);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for beat with infinite timeSinceBeat', () => {
      const beatDataInf = { ...beatData, timeSinceBeat: Infinity };
      expect(getFrequencyValue('beat', frequencies, beatDataInf)).toBe(0);
    });

    it('should return energy value scaled to 255', () => {
      const result = getFrequencyValue('energy', frequencies, beatData);
      expect(result).toBeCloseTo(0.7 * 255, 0);
    });
  });

  describe('calculatePulse', () => {
    it('should return 1 for zero frequency', () => {
      expect(calculatePulse(0, 1)).toBe(1);
    });

    it('should increase with frequency', () => {
      const lowPulse = calculatePulse(100, 1);
      const highPulse = calculatePulse(200, 1);
      expect(highPulse).toBeGreaterThan(lowPulse);
    });

    it('should scale with intensity', () => {
      const lowIntensity = calculatePulse(128, 0.5);
      const highIntensity = calculatePulse(128, 1.0);
      expect(highIntensity).toBeGreaterThan(lowIntensity);
    });

    it('should return max 1.5 at full frequency and intensity', () => {
      expect(calculatePulse(255, 1)).toBeCloseTo(1.5, 1);
    });
  });

  describe('calculateCameraShake', () => {
    it('should return zero shake below threshold', () => {
      const result = calculateCameraShake(100, 1, 160);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should return non-zero shake above threshold', () => {
      // Run multiple times to ensure we get some non-zero values
      let hasNonZero = false;
      for (let i = 0; i < 10; i++) {
        const result = calculateCameraShake(200, 1, 160);
        if (result.x !== 0 || result.y !== 0) {
          hasNonZero = true;
          break;
        }
      }
      expect(hasNonZero).toBe(true);
    });

    it('should increase shake with intensity', () => {
      // Calculate average shake over multiple runs
      const getAvgShake = (intensity: number) => {
        let total = 0;
        for (let i = 0; i < 100; i++) {
          const result = calculateCameraShake(200, intensity, 160);
          total += Math.abs(result.x) + Math.abs(result.y);
        }
        return total / 100;
      };

      const lowIntensityShake = getAvgShake(0.5);
      const highIntensityShake = getAvgShake(1.5);
      expect(highIntensityShake).toBeGreaterThan(lowIntensityShake);
    });
  });

  describe('calculateDimensions', () => {
    it('should calculate 16:9 dimensions correctly', () => {
      const result = calculateDimensions(1920, 1080, '16:9');
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should constrain by height when aspect ratio is wider', () => {
      const result = calculateDimensions(1920, 800, '16:9');
      expect(result.height).toBe(800);
      expect(result.width).toBe(Math.floor(800 * (16 / 9)));
    });

    it('should handle 9:16 vertical aspect ratio', () => {
      const result = calculateDimensions(1080, 1920, '9:16');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
    });

    it('should handle 1:1 square aspect ratio', () => {
      const result = calculateDimensions(1000, 800, '1:1');
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });
  });
});
