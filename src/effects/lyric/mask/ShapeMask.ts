/**
 * Shape Mask Effect
 * Text revealed through various shape masks (heart, star, polygon, SVG path)
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';

export class ShapeMaskEffect extends CharacterLyricEffect {
  readonly id = 'shape-mask';
  readonly name = 'Shape Mask';
  readonly parameters: EffectParameter[] = [
    enumParam('shape', 'Shape', 'heart', [
      { value: 'heart', label: 'Heart' },
      { value: 'star', label: 'Star' },
      { value: 'hexagon', label: 'Hexagon' },
      { value: 'diamond', label: 'Diamond' },
      { value: 'triangle', label: 'Triangle' },
    ]),
    slider('size', 'Size', 200, 50, 500, 10, 'px'),
    slider('rotation', 'Rotation', 0, 0, 360, 5, 'deg'),
    enumParam('animation', 'Animation', 'grow', [
      { value: 'grow', label: 'Grow' },
      { value: 'shrink', label: 'Shrink' },
      { value: 'rotate', label: 'Rotate' },
      { value: 'pulse', label: 'Pulse' },
    ]),
    slider('animationSpeed', 'Animation Speed', 1, 0.1, 3, 0.1),
    slider('offsetX', 'X Offset', 0, -300, 300, 5, 'px'),
    slider('offsetY', 'Y Offset', 0, -200, 200, 5, 'px'),
    slider('starPoints', 'Star Points', 5, 3, 12, 1),
    slider('innerRadius', 'Inner Radius %', 40, 20, 80, 5, '%'),
    boolean('audioReactive', 'Audio Reactive', false),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, x, y, fontSize, fontFamily, color, progress, currentTime, audioData } =
      context;

    const shape = this.getParameter<string>('shape');
    let size = this.getParameter<number>('size');
    let rotation = this.getParameter<number>('rotation');
    const animation = this.getParameter<string>('animation');
    const animationSpeed = this.getParameter<number>('animationSpeed');
    const offsetX = this.getParameter<number>('offsetX');
    const offsetY = this.getParameter<number>('offsetY');
    const starPoints = this.getParameter<number>('starPoints');
    const innerRadiusPercent = this.getParameter<number>('innerRadius');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');

    const centerX = x + offsetX;
    const centerY = y + offsetY;

    // Audio reactivity
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      size *= 1 + bassNorm * audioIntensity * 0.3;
    }

    // Apply animation
    switch (animation) {
      case 'grow':
        size *= this.easeOut(progress);
        break;
      case 'shrink':
        size *= 1 - this.easeIn(progress) * 0.5;
        break;
      case 'rotate':
        rotation += currentTime * animationSpeed * 100;
        break;
      case 'pulse':
        size *= 0.8 + 0.2 * Math.sin(currentTime * animationSpeed * Math.PI * 2);
        break;
    }

    const rotationRad = (rotation * Math.PI) / 180;

    ctx.save();

    // Create clipping path based on shape
    ctx.beginPath();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);

    switch (shape) {
      case 'heart':
        this.drawHeart(ctx, size);
        break;
      case 'star':
        this.drawStar(ctx, size, starPoints, innerRadiusPercent / 100);
        break;
      case 'hexagon':
        this.drawPolygon(ctx, size, 6);
        break;
      case 'diamond':
        this.drawPolygon(ctx, size, 4);
        break;
      case 'triangle':
        this.drawPolygon(ctx, size, 3);
        break;
    }

    ctx.rotate(-rotationRad);
    ctx.translate(-centerX, -centerY);
    ctx.clip();

    // Draw text
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, size: number): void {
    const scale = size / 30;
    ctx.moveTo(0, -scale * 8);

    // Right side
    ctx.bezierCurveTo(scale * 15, -scale * 25, scale * 25, -scale * 5, 0, scale * 15);

    // Left side
    ctx.bezierCurveTo(-scale * 25, -scale * 5, -scale * 15, -scale * 25, 0, -scale * 8);

    ctx.closePath();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    size: number,
    points: number,
    innerRatio: number
  ): void {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * innerRatio;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, size: number, sides: number): void {
    const radius = size / 2;

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  private easeOut(t: number): number {
    return t * (2 - t);
  }

  private easeIn(t: number): number {
    return t * t;
  }
}
