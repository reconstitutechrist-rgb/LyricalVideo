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
 * Includes character position caching for performance
 */
export abstract class CharacterLyricEffect extends BaseLyricEffect {
  // Cache for character positions to avoid recalculation every frame
  private characterCache: Map<string, CharacterData[]> = new Map();
  private static readonly MAX_CACHE_SIZE = 50;

  /**
   * Generate a cache key from context properties
   */
  private getCacheKey(context: LyricEffectContext): string {
    return `${context.text}:${context.fontSize}:${context.fontFamily}:${context.x}:${context.y}`;
  }

  /**
   * Get character positions for the current text (with caching)
   */
  protected getCharacters(context: LyricEffectContext): CharacterData[] {
    const cacheKey = this.getCacheKey(context);

    // Return cached result if available
    if (this.characterCache.has(cacheKey)) {
      return this.characterCache.get(cacheKey)!;
    }

    const { ctx, text, x, y, fontSize, fontFamily } = context;
    const font = `bold ${fontSize}px "${fontFamily}"`;

    const positions = getCenteredCharacterPositions(ctx, text, x, y, font);

    const characters = positions.map((pos, index) => ({
      char: pos.char,
      index,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      originalX: pos.x,
      originalY: pos.y,
    }));

    // Manage cache size - remove oldest entries if too large
    if (this.characterCache.size >= CharacterLyricEffect.MAX_CACHE_SIZE) {
      const firstKey = this.characterCache.keys().next().value;
      if (firstKey) {
        this.characterCache.delete(firstKey);
      }
    }

    // Store in cache
    this.characterCache.set(cacheKey, characters);

    return characters;
  }

  /**
   * Clear the character cache (call when text changes significantly)
   */
  protected clearCharacterCache(): void {
    this.characterCache.clear();
  }

  /**
   * Reset effect state including cache
   */
  reset(): void {
    super.reset();
    this.characterCache.clear();
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
