/**
 * Base Background Effect
 * Foundation for all background visual effects
 */

import { BackgroundEffect as BaseBackgroundEffect } from '../core/Effect';
import { clearCanvas, drawVignette } from '../utils/CanvasUtils';

/**
 * Extended background effect with common utilities
 */
export abstract class GenreBackgroundEffect extends BaseBackgroundEffect {
  /**
   * Clear the canvas with a color
   */
  protected clear(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string = '#000000'
  ): void {
    clearCanvas(ctx, width, height, color);
  }

  /**
   * Add vignette effect
   */
  protected addVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number = 0.5
  ): void {
    drawVignette(ctx, width, height, intensity);
  }

  /**
   * Map audio frequency to a visual value
   */
  protected mapFrequency(value: number, min: number, max: number): number {
    return min + (value / 255) * (max - min);
  }

  /**
   * Get bass reactive scale
   */
  protected getBassScale(bass: number, baseScale: number = 1, intensity: number = 0.3): number {
    return baseScale + (bass / 255) * intensity;
  }

  /**
   * Draw a gradient background
   */
  protected drawGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[],
    direction: 'vertical' | 'horizontal' | 'radial' = 'vertical'
  ): void {
    let gradient: CanvasGradient;

    if (direction === 'radial') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) * 0.7;
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    } else if (direction === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, width, 0);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 0, height);
    }

    const step = 1 / (colors.length - 1);
    colors.forEach((color, i) => {
      gradient.addColorStop(i * step, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}
