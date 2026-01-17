/**
 * Depth Zoom Effect
 * Zoom with blur and depth simulation
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { ExtendedEasings, clamp } from '../../utils/MathUtils';

export class DepthZoomEffect extends CharacterLyricEffect {
  readonly id = 'depth-zoom';
  readonly name = 'Depth Zoom';
  readonly parameters: EffectParameter[] = [
    enumParam('zoomDirection', 'Zoom Direction', 'in', [
      { value: 'in', label: 'Zoom In' },
      { value: 'out', label: 'Zoom Out' },
      { value: 'pulse', label: 'Pulse' },
    ]),
    slider('maxScale', 'Max Scale', 2.5, 1.2, 5, 0.1),
    slider('blurAmount', 'Blur Amount', 2, 0, 10, 0.5),
    boolean('fadeWithDepth', 'Fade with Depth', true),
    slider('speed', 'Animation Speed', 1, 0.2, 3, 0.1),
    slider('stagger', 'Character Stagger', 0.02, 0, 0.1, 0.005, 's'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, lyric, text: _text, fontSize, fontFamily, color, progress, currentTime } = context;
    const characters = this.getCharacters(context);

    const zoomDirection = this.getParameter<string>('zoomDirection');
    const maxScale = this.getParameter<number>('maxScale');
    const blurAmount = this.getParameter<number>('blurAmount');
    const fadeWithDepth = this.getParameter<boolean>('fadeWithDepth');
    const speed = this.getParameter<number>('speed');
    const stagger = this.getParameter<number>('stagger');

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const lyricDuration = lyric.endTime - lyric.startTime;

    for (const char of characters) {
      // Calculate staggered progress
      const charDelay = char.index * stagger;
      const charProgress = clamp(
        (progress * lyricDuration - charDelay) / (lyricDuration * 0.8),
        0,
        1
      );

      // Calculate zoom value based on direction
      let zoomValue: number;
      let scale: number;
      let opacity: number;

      switch (zoomDirection) {
        case 'in':
          // Start far (small), end close (normal)
          zoomValue = ExtendedEasings.easeOut(charProgress);
          scale = 1 / maxScale + (1 - 1 / maxScale) * zoomValue;
          opacity = fadeWithDepth ? zoomValue : 1;
          break;

        case 'out':
          // Start close (normal), end far (small)
          zoomValue = ExtendedEasings.easeIn(charProgress);
          scale = 1 + (maxScale - 1) * (1 - zoomValue);
          opacity = fadeWithDepth ? 1 - zoomValue * 0.7 : 1;
          break;

        case 'pulse': {
          // Continuous pulsing
          const pulsePhase = (currentTime * speed + char.index * 0.1) % 1;
          const pulseSin = Math.sin(pulsePhase * Math.PI * 2);
          scale = 1 + (maxScale - 1) * 0.3 * (pulseSin * 0.5 + 0.5);
          opacity = fadeWithDepth ? 0.7 + 0.3 * (1 - Math.abs(pulseSin) * 0.3) : 1;
          break;
        }

        default:
          scale = 1;
          opacity = 1;
      }

      // Calculate blur based on scale deviation from 1
      const scaleDeviation = Math.abs(scale - 1);
      const blur = blurAmount * scaleDeviation;

      ctx.save();

      // Apply blur effect using shadow (approximation in Canvas 2D)
      if (blur > 0.5) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur * 2;
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = color;

        // Draw multiple times for blur effect
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(char.x, char.y);
          ctx.scale(scale, scale);
          ctx.translate(-char.x, -char.y);
          ctx.fillText(char.char, char.x, char.y);
          ctx.restore();
        }
      }

      // Draw main character
      ctx.shadowBlur = 0;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.translate(char.x, char.y);
      ctx.scale(scale, scale);
      ctx.translate(-char.x, -char.y);
      ctx.fillText(char.char, char.x, char.y);

      ctx.restore();
    }
  }
}
