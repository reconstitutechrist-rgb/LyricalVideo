/**
 * Base Lyric Effect
 * Foundation for all text/lyric effects
 */

import { LyricEffect as BaseLyricEffect, LyricEffectContext } from '../core/Effect';
import { getCenteredCharacterPositions } from '../utils/CanvasUtils';

/**
 * Character data for per-character effects
 */
export interface CharacterData {
  char: string;
  index: number;
  x: number;
  y: number;
  width: number;
  originalX: number;
  originalY: number;
}

/**
 * Extended lyric effect with character-level utilities
 */
export abstract class CharacterLyricEffect extends BaseLyricEffect {
  /**
   * Get character positions for the current text
   */
  protected getCharacters(context: LyricEffectContext): CharacterData[] {
    const { ctx, text, x, y, fontSize, fontFamily } = context;
    const font = `bold ${fontSize}px "${fontFamily}"`;

    const positions = getCenteredCharacterPositions(ctx, text, x, y, font);

    return positions.map((pos, index) => ({
      char: pos.char,
      index,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      originalX: pos.x,
      originalY: pos.y,
    }));
  }

  /**
   * Draw a single character with transformations
   */
  protected drawCharacter(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    options: {
      fontSize: number;
      fontFamily: string;
      color: string;
      scale?: number;
      rotation?: number;
      opacity?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): void {
    const {
      fontSize,
      fontFamily,
      color,
      scale = 1,
      rotation = 0,
      opacity = 1,
      offsetX = 0,
      offsetY = 0,
    } = options;

    ctx.save();

    // Apply transformations
    ctx.globalAlpha = opacity;
    ctx.translate(x + offsetX, y + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Draw character
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 0, 0);

    ctx.restore();
  }

  /**
   * Draw text with glow effect
   */
  protected drawCharacterWithGlow(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    options: {
      fontSize: number;
      fontFamily: string;
      color: string;
      glowColor: string;
      glowBlur: number;
      scale?: number;
      rotation?: number;
      opacity?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): void {
    const { glowColor, glowBlur, ...baseOptions } = options;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;

    this.drawCharacter(ctx, char, x, y, baseOptions);

    ctx.restore();
  }
}

/**
 * State management for effects that need to track per-lyric state
 */
export interface EffectState {
  initialized: boolean;
  startTime: number;
  data: Record<string, unknown>;
}

/**
 * Create initial effect state
 */
export function createEffectState(): EffectState {
  return {
    initialized: false,
    startTime: 0,
    data: {},
  };
}
