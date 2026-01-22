/**
 * Kaleidoscope Dream Background Effect
 * Mirrored rotating segments with color shifting and trippy visuals
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface KaleidoscopeShape {
  angle: number;
  distance: number;
  size: number;
  hue: number;
  type: 'circle' | 'triangle' | 'diamond';
}

export class KaleidoscopeDreamEffect extends GenreBackgroundEffect {
  readonly id = 'kaleidoscope-dream';
  readonly name = 'Kaleidoscope Dream';
  readonly parameters: EffectParameter[] = [
    slider('segments', 'Mirror Segments', 6, 3, 12, 1),
    slider('rotationSpeed', 'Rotation Speed', 0.5, 0, 2, 0.1),
    slider('colorSpeed', 'Color Shift Speed', 0.3, 0, 1, 0.05),
    boolean('colorShift', 'Color Shift', true),
    slider('complexity', 'Complexity', 0.6, 0.2, 1, 0.1),
  ];

  private shapes: KaleidoscopeShape[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const segments = this.getParameter<number>('segments');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const colorSpeed = this.getParameter<number>('colorSpeed');
    const colorShift = this.getParameter<boolean>('colorShift');
    const complexity = this.getParameter<number>('complexity');

    if (!this.initialized) {
      this.initShapes(complexity);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const trebleBoost = audioData.treble / 255;
    const midBoost = audioData.mid / 255;

    // Dark background with subtle gradient
    const bgHue = colorShift ? (currentTime * colorSpeed * 20) % 360 : 240;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, `hsl(${bgHue}, 30%, 15%)`);
    gradient.addColorStop(1, `hsl(${(bgHue + 60) % 360}, 40%, 5%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calculate rotation with audio influence
    const baseRotation = currentTime * rotationSpeed;
    const audioRotation = bassBoost * 0.5;
    const totalRotation = baseRotation + audioRotation;

    // Draw kaleidoscope
    ctx.save();
    ctx.translate(width / 2, height / 2);

    const maxRadius = Math.max(width, height) * 0.6;
    const segmentAngle = (Math.PI * 2) / segments;

    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.rotate(segmentAngle * seg + totalRotation);

      // Create clipping region for this segment
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius * Math.cos(0), maxRadius * Math.sin(0));
      ctx.arc(0, 0, maxRadius, 0, segmentAngle);
      ctx.lineTo(0, 0);
      ctx.clip();

      // Mirror every other segment
      if (seg % 2 === 1) {
        ctx.scale(1, -1);
        ctx.rotate(segmentAngle);
      }

      // Draw shapes within segment
      for (const shape of this.shapes) {
        const hueOffset = colorShift ? currentTime * colorSpeed * 50 : 0;
        const hue = (shape.hue + hueOffset) % 360;
        const saturation = 70 + trebleBoost * 30;
        const lightness = 50 + midBoost * 20;

        const pulseScale = 1 + bassBoost * 0.3;
        const distance = shape.distance * maxRadius * pulseScale;
        const x = Math.cos(shape.angle + currentTime * 0.2) * distance;
        const y = Math.sin(shape.angle + currentTime * 0.2) * distance;
        const size = shape.size * (20 + bassBoost * 15);

        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
        ctx.strokeStyle = `hsla(${(hue + 30) % 360}, ${saturation}%, ${lightness + 20}%, 0.9)`;
        ctx.lineWidth = 2;

        this.drawShape(ctx, x, y, size, shape.type);
      }

      ctx.restore();
    }

    ctx.restore();

    // Center glow
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      100 + bassBoost * 50
    );
    const centerHue = colorShift ? (currentTime * colorSpeed * 30) % 360 : 280;
    glowGradient.addColorStop(0, `hsla(${centerHue}, 80%, 70%, ${0.4 + bassBoost * 0.3})`);
    glowGradient.addColorStop(0.5, `hsla(${centerHue}, 60%, 50%, 0.2)`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private initShapes(complexity: number): void {
    this.shapes = [];
    const count = Math.floor(10 + complexity * 20);

    for (let i = 0; i < count; i++) {
      this.shapes.push({
        angle: random(0, Math.PI * 2),
        distance: random(0.1, 0.9),
        size: random(0.5, 1.5),
        hue: random(0, 360),
        type: ['circle', 'triangle', 'diamond'][Math.floor(random(0, 3))] as
          | 'circle'
          | 'triangle'
          | 'diamond',
      });
    }
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    type: string
  ): void {
    ctx.beginPath();

    switch (type) {
      case 'circle':
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
      case 'triangle':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.866, y + size * 0.5);
        ctx.lineTo(x - size * 0.866, y + size * 0.5);
        ctx.closePath();
        break;
      case 'diamond':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.7, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.7, y);
        ctx.closePath();
        break;
    }

    ctx.fill();
    ctx.stroke();
  }

  reset(): void {
    this.initialized = false;
    this.shapes = [];
  }
}
