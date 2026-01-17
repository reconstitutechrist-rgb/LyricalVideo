/**
 * Letter Shuffle Effect
 * Scrambles characters then progressively reveals correct letters
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp } from '../../utils/MathUtils';

const SHUFFLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';

export class LetterShuffleEffect extends CharacterLyricEffect {
  readonly id = 'letter-shuffle';
  readonly name = 'Letter Shuffle';
  readonly parameters: EffectParameter[] = [
    slider('shuffleDuration', 'Shuffle Duration', 1.5, 0.5, 5, 0.1, 's'),
    slider('shuffleSpeed', 'Shuffle Speed', 10, 3, 30, 1),
    enumParam('revealOrder', 'Reveal Order', 'left-to-right', [
      { value: 'left-to-right', label: 'Left to Right' },
      { value: 'right-to-left', label: 'Right to Left' },
      { value: 'random', label: 'Random' },
      { value: 'center-out', label: 'Center Out' },
    ]),
    slider('glitchIntensity', 'Glitch Intensity', 0.3, 0, 1, 0.1),
  ];

  private revealOrder: number[] = [];
  private lastLyricId: string = '';

  renderLyric(context: LyricEffectContext): void {
    const { ctx, lyric, text: _text, fontSize, fontFamily, color, progress, currentTime } = context;
    const characters = this.getCharacters(context);

    const _shuffleDuration = this.getParameter<number>('shuffleDuration');
    const shuffleSpeed = this.getParameter<number>('shuffleSpeed');
    const revealOrderType = this.getParameter<string>('revealOrder');
    const glitchIntensity = this.getParameter<number>('glitchIntensity');

    // Generate reveal order if lyric changed
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.generateRevealOrder(characters.length, revealOrderType);
    }

    // Calculate how many characters should be revealed
    const revealProgress = clamp(progress / 0.8, 0, 1); // Use 80% of duration for reveal
    const charsToReveal = Math.floor(revealProgress * characters.length);

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const revealIndex = this.revealOrder.indexOf(char.index);
      const isRevealed = revealIndex < charsToReveal;

      let displayChar: string;
      let charColor = color;
      let offsetX = 0;
      let offsetY = 0;

      if (isRevealed) {
        // Show actual character
        displayChar = char.char;
      } else if (char.char === ' ') {
        // Keep spaces as spaces
        displayChar = ' ';
      } else {
        // Show shuffling character
        const shuffleIndex =
          Math.floor(currentTime * shuffleSpeed + char.index) % SHUFFLE_CHARS.length;
        displayChar = SHUFFLE_CHARS[shuffleIndex];

        // Add glitch offset
        if (glitchIntensity > 0 && Math.random() < glitchIntensity * 0.3) {
          offsetX = (Math.random() - 0.5) * 10 * glitchIntensity;
          offsetY = (Math.random() - 0.5) * 5 * glitchIntensity;
        }

        // Slightly different color for shuffling chars
        charColor = this.adjustColor(color, 0.7);
      }

      this.drawCharacter(ctx, displayChar, char.x, char.y, {
        fontSize,
        fontFamily,
        color: charColor,
        offsetX,
        offsetY,
      });
    }
  }

  private generateRevealOrder(length: number, orderType: string): void {
    this.revealOrder = [];

    switch (orderType) {
      case 'left-to-right':
        for (let i = 0; i < length; i++) this.revealOrder.push(i);
        break;

      case 'right-to-left':
        for (let i = length - 1; i >= 0; i--) this.revealOrder.push(i);
        break;

      case 'random': {
        const indices = Array.from({ length }, (_, i) => i);
        while (indices.length > 0) {
          const randomIndex = Math.floor(Math.random() * indices.length);
          this.revealOrder.push(indices.splice(randomIndex, 1)[0]);
        }
        break;
      }

      case 'center-out': {
        const center = Math.floor(length / 2);
        let left = center - 1;
        let right = center;
        while (left >= 0 || right < length) {
          if (right < length) this.revealOrder.push(right++);
          if (left >= 0) this.revealOrder.push(left--);
        }
        break;
      }
    }
  }

  private adjustColor(color: string, factor: number): string {
    // Simple opacity adjustment by adding alpha
    if (color.startsWith('#')) {
      return (
        color +
        Math.floor(factor * 255)
          .toString(16)
          .padStart(2, '0')
      );
    }
    return color;
  }

  reset(): void {
    this.lastLyricId = '';
    this.revealOrder = [];
  }
}
