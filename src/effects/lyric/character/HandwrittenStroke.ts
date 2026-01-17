/**
 * Handwritten Stroke Effect
 * Letters appear to be drawn stroke by stroke like handwriting
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp } from '../../utils/MathUtils';

export class HandwrittenStrokeEffect extends CharacterLyricEffect {
  readonly id = 'handwritten-stroke';
  readonly name = 'Handwritten Stroke';
  readonly parameters: EffectParameter[] = [
    slider('strokeSpeed', 'Stroke Speed', 100, 50, 200, 10, 'px/s'),
    slider('wobbleAmount', 'Wobble Amount', 2, 0, 5, 0.5, 'px'),
    slider('lineWeight', 'Line Weight', 4, 2, 8, 1, 'px'),
    slider('pressureVariation', 'Pressure Variation', 0.3, 0, 1, 0.05),
    slider('stagger', 'Character Stagger', 0.15, 0.05, 0.5, 0.01, 's'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, currentTime } = context;
    const characters = this.getCharacters(context);

    const _strokeSpeed = this.getParameter<number>('strokeSpeed');
    const wobbleAmount = this.getParameter<number>('wobbleAmount');
    const lineWeight = this.getParameter<number>('lineWeight');
    const pressureVariation = this.getParameter<number>('pressureVariation');
    const stagger = this.getParameter<number>('stagger');

    const totalDuration = stagger * characters.length + 1;

    for (const char of characters) {
      const charStartTime = char.index * stagger;
      const charProgress = clamp((progress * totalDuration - charStartTime) / 1, 0, 1);

      if (charProgress <= 0) continue;

      // Draw the character with stroke reveal effect
      this.drawHandwrittenChar(
        ctx,
        char.char,
        char.x,
        char.y,
        fontSize,
        fontFamily,
        color,
        charProgress,
        wobbleAmount,
        lineWeight,
        pressureVariation,
        currentTime,
        char.index
      );
    }
  }

  private drawHandwrittenChar(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    fontSize: number,
    fontFamily: string,
    color: string,
    progress: number,
    wobble: number,
    weight: number,
    pressureVar: number,
    time: number,
    index: number
  ): void {
    ctx.save();

    // Create a clipping mask that reveals the character progressively
    // We'll use a gradient mask approach

    // First, draw the character to an offscreen canvas
    const offCanvas = document.createElement('canvas');
    const charWidth = fontSize * 1.2;
    const charHeight = fontSize * 1.5;
    offCanvas.width = charWidth;
    offCanvas.height = charHeight;
    const offCtx = offCanvas.getContext('2d')!;

    // Draw character on offscreen canvas
    offCtx.font = `bold ${fontSize}px "${fontFamily}"`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = color;
    offCtx.fillText(char, charWidth / 2, charHeight / 2);

    // Create reveal mask based on progress
    // Simulate stroke direction (left to right, top to bottom for most chars)
    const revealWidth = charWidth * progress;

    ctx.save();

    // Add wobble effect
    const wobbleX = Math.sin(time * 5 + index) * wobble * (1 - progress);
    const wobbleY = Math.cos(time * 4 + index * 0.5) * wobble * 0.5 * (1 - progress);

    ctx.translate(x + wobbleX - charWidth / 2, y + wobbleY - charHeight / 2);

    // Draw with progressive reveal using clip
    ctx.beginPath();
    ctx.rect(0, 0, revealWidth, charHeight);
    ctx.clip();

    ctx.drawImage(offCanvas, 0, 0);

    ctx.restore();

    // Draw "pen tip" effect at the edge of the stroke
    if (progress > 0 && progress < 0.95) {
      const tipX = x + wobbleX - charWidth / 2 + revealWidth;
      const tipY = y + wobbleY;

      // Pressure variation for pen tip size
      const pressure = 1 + Math.sin(time * 10 + index) * pressureVar;
      const tipSize = weight * pressure * 0.5;

      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Add subtle ink variation/texture
    if (progress > 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.1 * (progress - 0.5) * 2;

      // Simulate ink pooling at start of stroke
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x - charWidth * 0.3 + wobbleX, y + wobbleY, weight * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  reset(): void {
    // No persistent state to reset
  }
}
