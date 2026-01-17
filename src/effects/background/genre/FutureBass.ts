/**
 * Future Bass Background Effect
 * Colorful, kawaii-influenced visuals with soft gradients and geometric shapes
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random, ExtendedEasings } from '../../utils/MathUtils';

interface FloatingShape {
  x: number;
  y: number;
  size: number;
  type: 'circle' | 'triangle' | 'diamond' | 'star';
  hue: number;
  rotation: number;
  rotationSpeed: number;
  floatPhase: number;
  floatSpeed: number;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

export class FutureBassEffect extends GenreBackgroundEffect {
  readonly id = 'future-bass';
  readonly name = 'Future Bass';
  readonly parameters: EffectParameter[] = [
    slider('shapeCount', 'Shape Count', 15, 5, 30, 1),
    slider('sparkleIntensity', 'Sparkle Intensity', 0.5, 0, 1, 0.05),
    slider('bubbleRadius', 'Bubble Size', 60, 20, 100, 5),
    slider('colorSpeed', 'Color Cycle Speed', 0.5, 0.1, 2, 0.1),
    boolean('kawaii', 'Kawaii Mode', true),
  ];

  private shapes: FloatingShape[] = [];
  private sparkles: Sparkle[] = [];
  private initialized = false;
  private gradientHue = 0;

  private readonly pastelColors = [
    { h: 350, s: 70, l: 85 }, // Pink
    { h: 280, s: 60, l: 85 }, // Lavender
    { h: 200, s: 70, l: 85 }, // Sky blue
    { h: 170, s: 60, l: 85 }, // Mint
    { h: 45, s: 80, l: 85 }, // Peach
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const shapeCount = this.getParameter<number>('shapeCount');
    const sparkleIntensity = this.getParameter<number>('sparkleIntensity');
    const bubbleRadius = this.getParameter<number>('bubbleRadius');
    const colorSpeed = this.getParameter<number>('colorSpeed');
    const kawaii = this.getParameter<boolean>('kawaii');

    // Initialize
    if (!this.initialized || this.shapes.length !== shapeCount) {
      this.initShapes(width, height, shapeCount, bubbleRadius);
      this.initialized = true;
    }

    // Update gradient hue
    this.gradientHue = (this.gradientHue + deltaTime * colorSpeed * 20) % 360;

    // Animated pastel gradient background
    this.drawGradientBackground(ctx, width, height, audioData.bass);

    // Floating shapes
    this.updateAndDrawShapes(ctx, width, height, currentTime, audioData, bubbleRadius);

    // Sparkles
    this.updateAndDrawSparkles(ctx, width, height, sparkleIntensity, audioData.treble);

    // Kawaii decorations
    if (kawaii) {
      this.drawKawaiiDecorations(ctx, width, height, currentTime, audioData.mid);
    }

    // Soft glow overlay
    this.drawSoftGlow(ctx, width, height, audioData.mid);

    // Light vignette (inverted - brighter edges)
    this.drawSoftVignette(ctx, width, height);
  }

  private initShapes(width: number, height: number, count: number, maxSize: number): void {
    this.shapes = [];
    const types: ('circle' | 'triangle' | 'diamond' | 'star')[] = [
      'circle',
      'triangle',
      'diamond',
      'star',
    ];

    for (let i = 0; i < count; i++) {
      const colorIndex = Math.floor(random(0, this.pastelColors.length));
      this.shapes.push({
        x: random(0, width),
        y: random(0, height),
        size: random(maxSize * 0.3, maxSize),
        type: types[Math.floor(random(0, types.length))],
        hue: this.pastelColors[colorIndex].h,
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.01, 0.01),
        floatPhase: random(0, Math.PI * 2),
        floatSpeed: random(0.5, 1.5),
      });
    }
  }

  private drawGradientBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number
  ): void {
    const bassPulse = 1 + (bass / 255) * 0.1;

    // Multi-point gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    const hue1 = this.gradientHue;
    const hue2 = (this.gradientHue + 60) % 360;
    const hue3 = (this.gradientHue + 180) % 360;

    gradient.addColorStop(0, `hsl(${hue1}, 70%, ${85 * bassPulse}%)`);
    gradient.addColorStop(0.5, `hsl(${hue2}, 65%, ${88 * bassPulse}%)`);
    gradient.addColorStop(1, `hsl(${hue3}, 70%, ${85 * bassPulse}%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private updateAndDrawShapes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    audioData: { bass: number; mid: number; treble: number; isBeat: boolean },
    _maxSize: number
  ): void {
    const bassScale = 1 + (audioData.bass / 255) * 0.3;

    for (const shape of this.shapes) {
      // Float animation
      const floatY = Math.sin(time * shape.floatSpeed + shape.floatPhase) * 20;
      const floatX = Math.cos(time * shape.floatSpeed * 0.7 + shape.floatPhase) * 10;

      shape.rotation += shape.rotationSpeed;

      // Beat bounce
      let bounceScale = 1;
      if (audioData.isBeat) {
        bounceScale = 1.2;
      }

      const currentSize = shape.size * bassScale * bounceScale;

      ctx.save();
      ctx.translate(shape.x + floatX, shape.y + floatY);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = 0.6;

      // Soft shadow
      ctx.shadowColor = `hsla(${shape.hue}, 70%, 50%, 0.3)`;
      ctx.shadowBlur = 20;

      const colorIndex = this.pastelColors.findIndex((c) => c.h === shape.hue);
      const color = this.pastelColors[colorIndex >= 0 ? colorIndex : 0];
      ctx.fillStyle = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
      ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l - 20}%, 0.5)`;
      ctx.lineWidth = 2;

      this.drawShape(ctx, shape.type, currentSize);

      ctx.restore();
    }
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    type: 'circle' | 'triangle' | 'diamond' | 'star',
    size: number
  ): void {
    ctx.beginPath();

    switch (type) {
      case 'circle':
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        break;

      case 'triangle': {
        const triSize = size / 2;
        ctx.moveTo(0, -triSize);
        ctx.lineTo(triSize * 0.866, triSize * 0.5);
        ctx.lineTo(-triSize * 0.866, triSize * 0.5);
        ctx.closePath();
        break;
      }

      case 'diamond': {
        const diamSize = size / 2;
        ctx.moveTo(0, -diamSize);
        ctx.lineTo(diamSize * 0.7, 0);
        ctx.lineTo(0, diamSize);
        ctx.lineTo(-diamSize * 0.7, 0);
        ctx.closePath();
        break;
      }

      case 'star': {
        const outer = size / 2;
        const inner = size / 4;
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          if (i === 0) {
            ctx.moveTo(Math.cos(outerAngle) * outer, Math.sin(outerAngle) * outer);
          } else {
            ctx.lineTo(Math.cos(outerAngle) * outer, Math.sin(outerAngle) * outer);
          }
          ctx.lineTo(Math.cos(innerAngle) * inner, Math.sin(innerAngle) * inner);
        }
        ctx.closePath();
        break;
      }
    }

    ctx.fill();
    ctx.stroke();
  }

  private updateAndDrawSparkles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    treble: number
  ): void {
    // Add sparkles on treble
    if (treble > 150 && Math.random() < intensity * 0.5) {
      const colorIndex = Math.floor(random(0, this.pastelColors.length));
      this.sparkles.push({
        x: random(0, width),
        y: random(0, height),
        size: random(3, 8),
        life: 0,
        maxLife: random(20, 40),
        hue: this.pastelColors[colorIndex].h,
      });
    }

    // Update and draw
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i];
      sparkle.life++;

      if (sparkle.life > sparkle.maxLife) {
        this.sparkles.splice(i, 1);
        continue;
      }

      const progress = sparkle.life / sparkle.maxLife;
      const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const scale = ExtendedEasings.elastic(progress < 0.5 ? progress * 2 : 1);

      ctx.save();
      ctx.translate(sparkle.x, sparkle.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      // Draw 4-point sparkle
      ctx.fillStyle = `hsl(${sparkle.hue}, 80%, 90%)`;
      ctx.beginPath();

      for (let j = 0; j < 4; j++) {
        const angle = (j * Math.PI) / 2;
        const outerX = Math.cos(angle) * sparkle.size;
        const outerY = Math.sin(angle) * sparkle.size;
        const innerAngle = angle + Math.PI / 4;
        const innerX = Math.cos(innerAngle) * sparkle.size * 0.3;
        const innerY = Math.sin(innerAngle) * sparkle.size * 0.3;

        if (j === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private drawKawaiiDecorations(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    mid: number
  ): void {
    const bounce = Math.sin(time * 3) * 5;
    const scale = 1 + (mid / 255) * 0.2;

    // Small decorative hearts in corners
    ctx.save();
    ctx.globalAlpha = 0.3;

    const positions = [
      { x: 50, y: 50 },
      { x: width - 50, y: 50 },
      { x: 50, y: height - 50 },
      { x: width - 50, y: height - 50 },
    ];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const colorIndex = i % this.pastelColors.length;
      const color = this.pastelColors[colorIndex];

      ctx.save();
      ctx.translate(pos.x, pos.y + bounce);
      ctx.scale(scale * 0.5, scale * 0.5);

      ctx.fillStyle = `hsl(${color.h}, ${color.s}%, ${color.l - 10}%)`;
      this.drawHeart(ctx, 20);

      ctx.restore();
    }

    ctx.restore();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.3, -size, size * 0.5, 0, size);
    ctx.bezierCurveTo(size, size * 0.5, size, -size * 0.3, 0, size * 0.3);
    ctx.fill();
  }

  private drawSoftGlow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mid: number
  ): void {
    const intensity = 0.05 + (mid / 255) * 0.1;

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.5
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawSoftVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Very soft vignette
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(255, 200, 255, 0.1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.initialized = false;
    this.shapes = [];
    this.sparkles = [];
    this.gradientHue = 0;
  }
}
