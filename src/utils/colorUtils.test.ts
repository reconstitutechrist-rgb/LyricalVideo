/**
 * Color Utilities Tests
 * Unit tests for color manipulation functions
 */

import { describe, it, expect } from 'vitest';
import {
  hue2rgb,
  parseHslToRgb,
  getOrbColor,
  getLyricGlowColor,
  getPaletteHue,
  getDynamicTextColors,
} from './colorUtils';

describe('colorUtils', () => {
  describe('hue2rgb', () => {
    it('should convert hue to RGB component correctly', () => {
      // Test edge cases
      expect(hue2rgb(0, 1, 0)).toBe(0);
      expect(hue2rgb(0, 1, 0.5)).toBeCloseTo(1, 5);
      expect(hue2rgb(0, 1, 1)).toBeCloseTo(0, 5);
    });

    it('should handle values outside 0-1 range', () => {
      // Values < 0 should wrap around
      expect(hue2rgb(0, 1, -0.5)).toBeCloseTo(1, 5);
      // Values > 1 should wrap around
      expect(hue2rgb(0, 1, 1.5)).toBeCloseTo(1, 5);
    });
  });

  describe('parseHslToRgb', () => {
    it('should parse valid HSL string', () => {
      const result = parseHslToRgb('hsl(0, 100%, 50%)');
      expect(result.r).toBeCloseTo(1, 1);
      expect(result.g).toBeCloseTo(0, 1);
      expect(result.b).toBeCloseTo(0, 1);
    });

    it('should parse HSLA string', () => {
      const result = parseHslToRgb('hsla(120, 100%, 50%, 0.5)');
      expect(result.r).toBeCloseTo(0, 1);
      expect(result.g).toBeCloseTo(1, 1);
      expect(result.b).toBeCloseTo(0, 1);
    });

    it('should return white for invalid HSL string', () => {
      const result = parseHslToRgb('invalid');
      expect(result).toEqual({ r: 1, g: 1, b: 1 });
    });
  });

  describe('getOrbColor', () => {
    it('should return sentiment color when provided', () => {
      expect(getOrbColor('neon', '#ff0000')).toBe('#ff0000');
    });

    it('should return palette-specific colors', () => {
      expect(getOrbColor('sunset')).toBe('#ffaa00');
      expect(getOrbColor('fire')).toBe('#ff4400');
      expect(getOrbColor('matrix')).toBe('#00ff00');
      expect(getOrbColor('ocean')).toBe('#00ffff');
      expect(getOrbColor('neon')).toBe('#00ffff');
    });

    it('should return default for unknown palette', () => {
      expect(getOrbColor('unknown' as unknown as 'neon')).toBe('#00ffff');
    });
  });

  describe('getLyricGlowColor', () => {
    it('should return sentiment color when provided', () => {
      expect(getLyricGlowColor('ocean', '#00ff00')).toBe('#00ff00');
    });

    it('should return palette-specific glow colors', () => {
      expect(getLyricGlowColor('ocean')).toBe('#00ffff');
      expect(getLyricGlowColor('sunset')).toBe('#ff5500');
      expect(getLyricGlowColor('matrix')).toBe('#00ff00');
      expect(getLyricGlowColor('fire')).toBe('#ff4400');
    });

    it('should return default magenta for unknown palette', () => {
      expect(getLyricGlowColor('unknown' as unknown as 'neon')).toBe('#ff00ff');
    });
  });

  describe('getPaletteHue', () => {
    it('should return correct hues for different palettes', () => {
      expect(getPaletteHue('neon', 0, 10)).toBe(290);
      expect(getPaletteHue('sunset', 0, 20)).toBe(30);
      expect(getPaletteHue('ocean', 0, 10)).toBe(190);
      expect(getPaletteHue('matrix', 0, 5)).toBe(105);
      expect(getPaletteHue('fire', 0, 15)).toBe(15);
    });

    it('should use base hue for unspecified palettes', () => {
      expect(getPaletteHue('pastel', 180, 20)).toBe(200);
    });

    it('should return 0 for grayscale', () => {
      expect(getPaletteHue('grayscale', 100, 50)).toBe(0);
    });
  });

  describe('getDynamicTextColors', () => {
    it('should return light text for dark backgrounds', () => {
      const result = getDynamicTextColors({ r: 20, g: 20, b: 20, luminance: 20 });
      expect(result.textColor).toContain('255');
    });

    it('should return dark text for light backgrounds', () => {
      const result = getDynamicTextColors({ r: 200, g: 200, b: 200, luminance: 200 });
      expect(result.textColor).toContain('10');
    });

    it('should return default colors for null input', () => {
      const result = getDynamicTextColors(null);
      expect(result.textColor).toBe('rgba(255, 255, 255, 0.95)');
      expect(result.glowColor).toBe('rgba(255, 0, 255, 0.8)');
    });
  });
});
