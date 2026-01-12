/**
 * Circle Mask Effect
 * Text revealed through an animated circular mask
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';

export class CircleMaskEffect extends CharacterLyricEffect {
  readonly id = 'circle-mask';
  readonly name = 'Circle Mask';
  readonly parameters: EffectParameter[] = [
    slider('radius', 'Max Radius', 200, 50, 500, 10, 'px'),
    slider('minRadius', 'Min Radius', 0, 0, 200, 5, 'px'),
    enumParam('animation', 'Animation', 'expand', [
      { value: 'expand', label: 'Expand' },
      { value: 'contract', label: 'Contract' },
      { value: 'pulse', label: 'Pulse' },
      { value: 'breathe', label: 'Breathe' },
    ]),
    enumParam('position', 'Center Position', 'center', [
      { value: 'center', label: 'Center' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'follow', label: 'Follow Progress' },
    ]),
    slider('offsetX', 'X Offset', 0, -300, 300, 5, 'px'),
    slider('offsetY', 'Y Offset', 0, -200, 200, 5, 'px'),
    boolean('softEdge', 'Soft Edge', false),
    slider('feather', 'Edge Feather', 20, 0, 100, 5, 'px'),
    boolean('audioReactive', 'Audio Reactive', false),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, x, y, fontSize, fontFamily, color, progress, width, audioData } = context;

    const maxRadius = this.getParameter<number>('radius');
    const minRadius = this.getParameter<number>('minRadius');
    const animation = this.getParameter<string>('animation');
    const position = this.getParameter<string>('position');
    const offsetX = this.getParameter<number>('offsetX');
    const offsetY = this.getParameter<number>('offsetY');
    const softEdge = this.getParameter<boolean>('softEdge');
    const feather = this.getParameter<number>('feather');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');

    // Calculate center position
    let centerX = x + offsetX;
    const centerY = y + offsetY;

    switch (position) {
      case 'left':
        centerX = x - width * 0.3 + offsetX;
        break;
      case 'right':
        centerX = x + width * 0.3 + offsetX;
        break;
      case 'follow':
        // Move from left to right following progress
        centerX = x - width * 0.4 + width * 0.8 * progress + offsetX;
        break;
    }

    // Calculate radius based on animation type
    let currentRadius = maxRadius;
    switch (animation) {
      case 'expand':
        currentRadius = minRadius + (maxRadius - minRadius) * this.easeOut(progress);
        break;
      case 'contract':
        currentRadius = maxRadius - (maxRadius - minRadius) * this.easeIn(progress);
        break;
      case 'pulse':
        currentRadius =
          minRadius + (maxRadius - minRadius) * (0.5 + 0.5 * Math.sin(progress * Math.PI * 4));
        break;
      case 'breathe':
        currentRadius =
          minRadius + (maxRadius - minRadius) * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2));
        break;
    }

    // Audio reactivity
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      currentRadius *= 1 + bassNorm * audioIntensity * 0.3;
    }

    ctx.save();

    if (softEdge && feather > 0) {
      // Create gradient mask for soft edge
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        Math.max(0, currentRadius - feather),
        centerX,
        centerY,
        currentRadius
      );
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      // Draw text to offscreen canvas first
      const offscreen = document.createElement('canvas');
      offscreen.width = ctx.canvas.width;
      offscreen.height = ctx.canvas.height;
      const offCtx = offscreen.getContext('2d')!;

      offCtx.font = `bold ${fontSize}px "${fontFamily}"`;
      offCtx.fillStyle = color;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, x, y);

      // Apply mask via composite
      offCtx.globalCompositeOperation = 'destination-in';
      offCtx.fillStyle = gradient;
      offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Draw masked result
      ctx.drawImage(offscreen, 0, 0);
    } else {
      // Hard edge clip
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw text
      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  }

  private easeOut(t: number): number {
    return t * (2 - t);
  }

  private easeIn(t: number): number {
    return t * t;
  }
}
