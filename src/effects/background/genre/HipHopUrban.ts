/**
 * Hip-Hop/Urban Background Effect
 * Bold geometric shapes, graffiti-inspired, street vibes
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random, clamp } from '../../utils/MathUtils';

interface GraffitiShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  type: 'rect' | 'triangle' | 'circle';
  vx: number;
  vy: number;
}

export class HipHopUrbanEffect extends GenreBackgroundEffect {
  readonly id = 'hiphop-urban';
  readonly name = 'Hip-Hop/Urban';
  readonly parameters: EffectParameter[] = [
    slider('shapeCount', 'Shape Count', 15, 5, 40, 1),
    slider('colorIntensity', 'Color Intensity', 0.8, 0.3, 1, 0.05),
    boolean('streetLights', 'Street Light Effect', true),
    slider('vinylScratch', 'Vinyl Scratch Effect', 0.3, 0, 1, 0.05),
    slider('gridIntensity', 'Grid Intensity', 0.2, 0, 0.5, 0.05),
  ];

  private shapes: GraffitiShape[] = [];
  private initialized = false;
  private scratchOffset = 0;

  private readonly colors = [
    '#FFD700', // Gold
    '#FF6B35', // Orange
    '#4ECDC4', // Teal
    '#FF3366', // Pink
    '#7B68EE', // Purple
    '#32CD32', // Lime
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const shapeCount = this.getParameter<number>('shapeCount');
    const colorIntensity = this.getParameter<number>('colorIntensity');
    const streetLights = this.getParameter<boolean>('streetLights');
    const vinylScratch = this.getParameter<number>('vinylScratch');
    const gridIntensity = this.getParameter<number>('gridIntensity');

    // Initialize shapes
    if (!this.initialized || this.shapes.length !== shapeCount) {
      this.initShapes(width, height, shapeCount);
      this.initialized = true;
    }

    // Dark background with slight color
    this.drawGradient(ctx, width, height, ['#1a1a2e', '#16213e', '#0f0f23'], 'vertical');

    // Grid pattern (urban aesthetic)
    if (gridIntensity > 0) {
      this.drawGrid(ctx, width, height, gridIntensity, audioData.bass);
    }

    // Update vinyl scratch effect
    this.scratchOffset = (this.scratchOffset + vinylScratch * 10) % 360;

    // Draw geometric shapes
    for (const shape of this.shapes) {
      // Bass-reactive movement
      const bassBoost = audioData.bass / 255;
      shape.x += shape.vx * (1 + bassBoost);
      shape.y += shape.vy * (1 + bassBoost);

      // Wrap around
      if (shape.x < -shape.size) shape.x = width + shape.size;
      if (shape.x > width + shape.size) shape.x = -shape.size;
      if (shape.y < -shape.size) shape.y = height + shape.size;
      if (shape.y > height + shape.size) shape.y = -shape.size;

      // Rotate with music
      shape.rotation += 0.01 * (1 + audioData.mid / 255);

      this.drawShape(ctx, shape, colorIntensity, bassBoost);
    }

    // Street light effect (spotlight from top)
    if (streetLights) {
      this.drawStreetLights(ctx, width, height, audioData.treble);
    }

    // Vinyl scratch lines
    if (vinylScratch > 0) {
      this.drawVinylScratch(ctx, width, height, vinylScratch, currentTime);
    }

    // Vignette for depth
    this.addVignette(ctx, width, height, 0.4);
  }

  private initShapes(width: number, height: number, count: number): void {
    this.shapes = [];
    for (let i = 0; i < count; i++) {
      this.shapes.push({
        x: random(0, width),
        y: random(0, height),
        size: random(30, 120),
        rotation: random(0, Math.PI * 2),
        color: this.colors[Math.floor(random(0, this.colors.length))],
        type: ['rect', 'triangle', 'circle'][Math.floor(random(0, 3))] as
          | 'rect'
          | 'triangle'
          | 'circle',
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
      });
    }
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: GraffitiShape,
    intensity: number,
    bassBoost: number
  ): void {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);

    const scale = 1 + bassBoost * 0.2;
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.4 * intensity;
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 3;

    const size = shape.size;

    switch (shape.type) {
      case 'rect':
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.globalAlpha = 0.1 * intensity;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 0.1 * intensity;
        ctx.fill();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.1 * intensity;
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    bass: number
  ): void {
    const gridSize = 50 + (bass / 255) * 20;
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private drawStreetLights(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    treble: number
  ): void {
    const lightIntensity = 0.1 + (treble / 255) * 0.2;

    // Create spotlight gradient from top
    const gradient = ctx.createRadialGradient(
      width / 2,
      -height * 0.2,
      0,
      width / 2,
      height * 0.5,
      height
    );
    gradient.addColorStop(0, `rgba(255, 200, 100, ${lightIntensity})`);
    gradient.addColorStop(0.3, `rgba(255, 200, 100, ${lightIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawVinylScratch(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    time: number
  ): void {
    ctx.save();
    ctx.globalAlpha = intensity * 0.3;

    // Horizontal scratch lines
    for (let i = 0; i < 3; i++) {
      const y = height * 0.3 + ((time * 50 + i * 100) % height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.shapes = [];
  }
}
