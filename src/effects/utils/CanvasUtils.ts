/**
 * Canvas Utilities for Effects
 * Shared canvas helpers and rendering functions
 */

import { ColorPalette } from '../../../types';

/**
 * Get palette colors
 */
export function getPaletteColors(palette: ColorPalette): string[] {
  const palettes: Record<ColorPalette, string[]> = {
    // Original palettes
    neon: ['#ff00ff', '#00ffff', '#ff00aa', '#aa00ff', '#00aaff'],
    sunset: ['#ff6b35', '#f7c59f', '#efa98a', '#d6955b', '#ffaa00'],
    ocean: ['#006994', '#40a8c4', '#60d394', '#95d5b2', '#2ec4b6'],
    matrix: ['#00ff00', '#00dd00', '#00bb00', '#009900', '#00ff33'],
    fire: ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'],
    // New palettes - Pastels & Soft
    pastel: ['#ffd1dc', '#bae1ff', '#baffc9', '#ffffba', '#e0bbff'],
    grayscale: ['#ffffff', '#c0c0c0', '#808080', '#404040', '#000000'],
    sepia: ['#704214', '#a67b5b', '#c4a77d', '#e1d4bb', '#f5e6d3'],
    // New palettes - Seasonal
    autumn: ['#8b4513', '#d2691e', '#ff8c00', '#daa520', '#cd853f'],
    winter: ['#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#26c6da'],
    spring: ['#98fb98', '#90ee90', '#ffb6c1', '#ffc0cb', '#f0e68c'],
    // New palettes - High contrast & Nature
    cyberpunk: ['#ff00ff', '#00ffff', '#ff0080', '#00ff80', '#8000ff'],
    nature: ['#228b22', '#32cd32', '#8fbc8f', '#6b8e23', '#556b2f'],
  };
  return palettes[palette] || palettes.neon;
}

/**
 * Get a random color from palette
 */
export function getRandomPaletteColor(palette: ColorPalette): string {
  const colors = getPaletteColors(palette);
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Create HSL color string
 */
export function hsl(h: number, s: number, l: number, a: number = 1): string {
  return a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/**
 * Create RGB color string
 */
export function rgb(r: number, g: number, b: number, a: number = 1): string {
  return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Blend two colors
 */
export function blendColors(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Draw a glow effect
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  intensity: number = 1
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const rgb = hexToRgb(color) || { r: 255, g: 255, b: 255 };

  gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.8 * intensity})`);
  gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.3 * intensity})`);
  gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw text with shadow/glow
 */
export function drawTextWithGlow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  glowColor: string,
  glowBlur: number = 20
): void {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Measure text dimensions
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
): { width: number; height: number } {
  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const height =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || parseInt(font) * 1.2;
  ctx.restore();
  return { width: metrics.width, height };
}

/**
 * Get character positions for a text string
 */
export function getCharacterPositions(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  font: string
): { char: string; x: number; y: number; width: number }[] {
  ctx.save();
  ctx.font = font;

  const positions: { char: string; x: number; y: number; width: number }[] = [];
  let currentX = startX;

  for (const char of text) {
    const width = ctx.measureText(char).width;
    positions.push({ char, x: currentX, y, width });
    currentX += width;
  }

  ctx.restore();
  return positions;
}

/**
 * Get centered character positions
 */
export function getCenteredCharacterPositions(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  font: string
): { char: string; x: number; y: number; width: number }[] {
  ctx.save();
  ctx.font = font;

  const totalWidth = ctx.measureText(text).width;
  const startX = centerX - totalWidth / 2;

  ctx.restore();
  return getCharacterPositions(ctx, text, startX, y, font);
}

/**
 * Draw a vignette effect
 */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.5
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(width, height) * 0.7;

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw film grain effect
 */
export function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.1
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw scanlines effect
 */
export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number = 4,
  opacity: number = 0.1
): void {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

  for (let y = 0; y < height; y += spacing) {
    ctx.fillRect(0, y, width, 1);
  }

  ctx.restore();
}

/**
 * Create off-screen canvas
 */
export function createOffscreenCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

/**
 * Clear canvas with optional color
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color?: string
): void {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}
