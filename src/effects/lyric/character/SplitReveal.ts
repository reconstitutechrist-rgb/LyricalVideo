/**
 * Split Reveal Effect
 * Text splits apart and reassembles from different directions
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, ExtendedEasings } from '../../utils/MathUtils';

export class SplitRevealEffect extends CharacterLyricEffect {
  readonly id = 'split-reveal';
  readonly name = 'Split Reveal';
  readonly parameters: EffectParameter[] = [
    enumParam('splitDirection', 'Split Direction', 'horizontal', [
      { value: 'horizontal', label: 'Horizontal (Top/Bottom)' },
      { value: 'vertical', label: 'Vertical (Left/Right)' },
      { value: 'diagonal', label: 'Diagonal' },
    ]),
    slider('splitDistance', 'Split Distance', 80, 20, 200, 10, 'px'),
    slider('revealDuration', 'Reveal Duration', 0.8, 0.3, 1.5, 0.1, 's'),
    slider('rotation', 'Split Rotation', 15, 0, 45, 5, 'deg'),
    boolean('beatReact', 'Beat React', true),
    slider('stagger', 'Stagger', 0.03, 0, 0.1, 0.01, 's'),
  ];

  private lastBeatTime = 0;
  private beatSplitAmount = 0;

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, audioData, currentTime } = context;
    const characters = this.getCharacters(context);

    const splitDirection = this.getParameter<string>('splitDirection');
    const splitDistance = this.getParameter<number>('splitDistance');
    const revealDuration = this.getParameter<number>('revealDuration');
    const rotationDeg = this.getParameter<number>('rotation');
    const beatReact = this.getParameter<boolean>('beatReact');
    const stagger = this.getParameter<number>('stagger');

    const totalDuration = stagger * characters.length + revealDuration;
    const rotation = (rotationDeg * Math.PI) / 180;

    // Handle beat reaction
    if (beatReact && audioData?.isBeat && currentTime - this.lastBeatTime > 0.2) {
      this.beatSplitAmount = 0.3;
      this.lastBeatTime = currentTime;
    }
    this.beatSplitAmount *= 0.9;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;

    for (const char of characters) {
      const charStartTime = char.index * stagger;
      const charProgress = clamp((progress * totalDuration - charStartTime) / revealDuration, 0, 1);

      if (charProgress <= 0) continue;

      // Eased progress for smooth animation
      const eased = ExtendedEasings.easeOut(charProgress);

      // Calculate split offset (starts split, comes together)
      const splitAmount = (1 - eased) * splitDistance + this.beatSplitAmount * splitDistance;
      const rotAmount = (1 - eased) * rotation;

      // Get split offsets based on direction
      const offsets = this.getSplitOffsets(splitDirection, splitAmount, rotAmount);

      // Draw top/left half
      this.drawHalfCharacter(
        ctx,
        char.char,
        char.x + offsets.half1.x,
        char.y + offsets.half1.y,
        fontSize,
        fontFamily,
        color,
        splitDirection,
        'first',
        offsets.half1.rotation,
        eased
      );

      // Draw bottom/right half
      this.drawHalfCharacter(
        ctx,
        char.char,
        char.x + offsets.half2.x,
        char.y + offsets.half2.y,
        fontSize,
        fontFamily,
        color,
        splitDirection,
        'second',
        offsets.half2.rotation,
        eased
      );
    }
  }

  private getSplitOffsets(
    direction: string,
    distance: number,
    rotation: number
  ): {
    half1: { x: number; y: number; rotation: number };
    half2: { x: number; y: number; rotation: number };
  } {
    switch (direction) {
      case 'vertical':
        return {
          half1: { x: -distance, y: 0, rotation: -rotation },
          half2: { x: distance, y: 0, rotation: rotation },
        };
      case 'diagonal': {
        const diagDist = distance * 0.7;
        return {
          half1: { x: -diagDist, y: -diagDist, rotation: -rotation },
          half2: { x: diagDist, y: diagDist, rotation: rotation },
        };
      }
      case 'horizontal':
      default:
        return {
          half1: { x: 0, y: -distance, rotation: -rotation },
          half2: { x: 0, y: distance, rotation: rotation },
        };
    }
  }

  private drawHalfCharacter(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    fontSize: number,
    fontFamily: string,
    color: string,
    direction: string,
    half: 'first' | 'second',
    rotation: number,
    progress: number
  ): void {
    ctx.save();

    // Create clipping region for half
    const clipWidth = fontSize * 1.5;
    const clipHeight = fontSize * 1.5;

    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Set up clip path based on direction and half
    ctx.beginPath();
    switch (direction) {
      case 'vertical':
        if (half === 'first') {
          ctx.rect(-clipWidth, -clipHeight, clipWidth, clipHeight * 2);
        } else {
          ctx.rect(0, -clipHeight, clipWidth, clipHeight * 2);
        }
        break;
      case 'diagonal':
        if (half === 'first') {
          ctx.moveTo(-clipWidth, -clipHeight);
          ctx.lineTo(clipWidth, -clipHeight);
          ctx.lineTo(-clipWidth, clipHeight);
          ctx.closePath();
        } else {
          ctx.moveTo(clipWidth, clipHeight);
          ctx.lineTo(-clipWidth, clipHeight);
          ctx.lineTo(clipWidth, -clipHeight);
          ctx.closePath();
        }
        break;
      case 'horizontal':
      default:
        if (half === 'first') {
          ctx.rect(-clipWidth, -clipHeight, clipWidth * 2, clipHeight);
        } else {
          ctx.rect(-clipWidth, 0, clipWidth * 2, clipHeight);
        }
    }
    ctx.clip();

    // Draw character
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.min(1, progress * 1.5);
    ctx.fillText(char, 0, 0);

    ctx.restore();
  }

  reset(): void {
    this.lastBeatTime = 0;
    this.beatSplitAmount = 0;
  }
}
