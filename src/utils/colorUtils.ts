/**
 * Color utility functions for the Visualizer
 * Extracted for reusability and performance
 */

import { ColorPalette } from '../../types';

/**
 * HSL to RGB conversion helper
 * Used for WebGL particle color conversion
 */
export const hue2rgb = (p: number, q: number, t: number): number => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

/**
 * Parse HSL/HSLA color string to RGB values (0-1 range)
 */
export const parseHslToRgb = (hslString: string): { r: number; g: number; b: number } => {
  const hslMatch = hslString.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: hue2rgb(p, q, h + 1 / 3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1 / 3),
    };
  }
  return { r: 1, g: 1, b: 1 };
};

/**
 * Get orb color based on palette and sentiment
 */
export const getOrbColor = (palette: ColorPalette, sentimentColor?: string): string => {
  if (sentimentColor) return sentimentColor;
  switch (palette) {
    case 'sunset':
      return '#ffaa00';
    case 'fire':
      return '#ff4400';
    case 'matrix':
      return '#00ff00';
    case 'ocean':
      return '#00ffff';
    case 'neon':
    default:
      return '#00ffff';
  }
};

/**
 * Get glow color for lyrics based on palette and sentiment
 */
export const getLyricGlowColor = (palette: ColorPalette, sentimentColor?: string): string => {
  if (sentimentColor) return sentimentColor;
  switch (palette) {
    case 'ocean':
      return '#00ffff';
    case 'sunset':
      return '#ff5500';
    case 'matrix':
      return '#00ff00';
    case 'fire':
      return '#ff4400';
    default:
      return '#ff00ff';
  }
};

/**
 * Calculate hue based on palette for visual effects
 */
export const getPaletteHue = (
  palette: ColorPalette,
  baseHue: number,
  modifier: number = 0
): number => {
  switch (palette) {
    case 'neon':
      return 280 + modifier;
    case 'sunset':
      return 10 + modifier;
    case 'ocean':
      return 180 + modifier;
    case 'matrix':
      return 100 + modifier;
    case 'fire':
      return modifier;
    case 'cyberpunk':
      return Math.random() > 0.5 ? 180 + modifier : 300 + modifier;
    case 'pastel':
      return baseHue + modifier;
    case 'grayscale':
      return 0;
    case 'autumn':
      return 30 + modifier;
    case 'winter':
      return 200 + modifier;
    case 'spring':
      return 120 + modifier;
    case 'nature':
      return 100 + modifier;
    default:
      return baseHue + modifier;
  }
};

/**
 * Analyze image/video dominant color for dynamic text contrast
 * Returns luminance value (0-255)
 */
export const analyzeDominantColor = (
  source: HTMLImageElement | HTMLVideoElement,
  analysisCtx: CanvasRenderingContext2D
): { r: number; g: number; b: number; luminance: number } | null => {
  try {
    analysisCtx.drawImage(source, 0, 0, 1, 1);
    const [r, g, b] = analysisCtx.getImageData(0, 0, 1, 1).data;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return { r, g, b, luminance };
  } catch {
    return null;
  }
};

/**
 * Get dynamic text colors based on background luminance
 */
export const getDynamicTextColors = (
  colorData: { r: number; g: number; b: number; luminance: number } | null
): { textColor: string; glowColor: string } => {
  if (!colorData) {
    return {
      textColor: 'rgba(255, 255, 255, 0.95)',
      glowColor: 'rgba(255, 0, 255, 0.8)',
    };
  }

  const { r, g, b, luminance } = colorData;

  if (luminance > 140) {
    return {
      textColor: 'rgba(10, 10, 10, 0.9)',
      glowColor: `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.4)`,
    };
  }

  return {
    textColor: 'rgba(255, 255, 255, 0.95)',
    glowColor: `rgba(${r}, ${g}, ${b}, 0.8)`,
  };
};
