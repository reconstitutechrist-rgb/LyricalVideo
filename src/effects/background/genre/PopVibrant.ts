/**
 * Pop/Vibrant Background Effect
 * Bright, playful, bouncy shapes and confetti
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random, ExtendedEasings } from '../../utils/MathUtils';

interface PopShape {
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'circle' | 'square' | 'star' | 'heart';
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  bouncePhase: number;
}

interface Confetti {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  vy: number;
  vx: number;
}

export class PopVibrantEffect extends GenreBackgroundEffect {
  readonly id = 'pop-vibrant';
  readonly name = 'Pop/Vibrant';
  readonly parameters: EffectParameter[] = [
    slider('colorSaturation', 'Color Saturation', 1.2, 0.5, 1.5, 0.05),
    slider('shapeCount', 'Shape Count', 15, 5, 40, 1),
    slider('bounceEnergy', 'Bounce Energy', 0.7, 0, 1, 0.05),
    boolean('confetti', 'Confetti Effect', true),
    slider('confettiDensity', 'Confetti Density', 0.5, 0, 1, 0.1),
  ];

  private shapes: PopShape[] = [];
  private confettiPieces: Confetti[] = [];
  private initialized = false;

  private readonly colors = [
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#F38181', // Pink
    '#AA96DA', // Lavender
    '#FCBAD3', // Light Pink
    '#A8D8EA', // Light Blue
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const colorSaturation = this.getParameter<number>('colorSaturation');
    const shapeCount = this.getParameter<number>('shapeCount');
    const bounceEnergy = this.getParameter<number>('bounceEnergy');
    const confetti = this.getParameter<boolean>('confetti');
    const confettiDensity = this.getParameter<number>('confettiDensity');

    // Initialize
    if (!this.initialized || this.shapes.length !== shapeCount) {
      this.initShapes(width, height, shapeCount);
      this.initialized = true;
    }

    // Vibrant gradient background
    this.drawVibrantBackground(ctx, width, height, currentTime, colorSaturation);

    // Bouncing shapes
    this.updateAndDrawShapes(ctx, width, height, bounceEnergy, audioData.bass, currentTime);

    // Confetti
    if (confetti) {
      this.updateAndDrawConfetti(ctx, width, height, confettiDensity, audioData.treble);
    }

    // Light overlay for pop effect
    this.drawLightOverlay(ctx, width, height, audioData.mid);
  }

  private initShapes(width: number, height: number, count: number): void {
    this.shapes = [];
    const types: ('circle' | 'square' | 'star' | 'heart')[] = ['circle', 'square', 'star', 'heart'];

    for (let i = 0; i < count; i++) {
      this.shapes.push({
        x: random(0, width),
        y: random(0, height),
        size: random(30, 100),
        color: this.colors[Math.floor(random(0, this.colors.length))],
        type: types[Math.floor(random(0, types.length))],
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.02, 0.02),
        vx: random(-1, 1),
        vy: random(-1, 1),
        bouncePhase: random(0, 1), // 0-1 range for use with modulo in bounce cycle
      });
    }
  }

  private drawVibrantBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    saturation: number
  ): void {
    // Animated multi-color gradient
    const hue1 = (time * 10) % 360;
    const hue2 = (hue1 + 60) % 360;
    const hue3 = (hue1 + 180) % 360;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `hsl(${hue1}, ${70 * saturation}%, 85%)`);
    gradient.addColorStop(0.5, `hsl(${hue2}, ${70 * saturation}%, 80%)`);
    gradient.addColorStop(1, `hsl(${hue3}, ${70 * saturation}%, 85%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private updateAndDrawShapes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bounceEnergy: number,
    bass: number,
    time: number
  ): void {
    const bassBoost = bass / 255;

    for (const shape of this.shapes) {
      // Bounce animation using ExtendedEasings for dynamic pop effect
      // Create a cycling 0-1 value from time, then apply bounce easing
      const cyclePosition = (time * 1.5 + shape.bouncePhase) % 1;
      const bounceValue = ExtendedEasings.bounce(cyclePosition);
      const bounce = (bounceValue - 0.5) * 2 * bounceEnergy * 25;

      // Scale also uses bounce easing for extra pop on bass hits
      const scaleBase = 1 + bassBoost * 0.3 * bounceEnergy;
      const scaleBounce =
        bassBoost > 0.5 ? ExtendedEasings.elastic((bassBoost - 0.5) * 2) * 0.2 : 0;
      const scale = scaleBase + scaleBounce * bounceEnergy;

      // Move shapes
      shape.x += shape.vx * (1 + bassBoost);
      shape.y += shape.vy * (1 + bassBoost);
      shape.rotation += shape.rotationSpeed;

      // Wrap around
      if (shape.x < -shape.size) shape.x = width + shape.size;
      if (shape.x > width + shape.size) shape.x = -shape.size;
      if (shape.y < -shape.size) shape.y = height + shape.size;
      if (shape.y > height + shape.size) shape.y = -shape.size;

      ctx.save();
      ctx.translate(shape.x, shape.y + bounce);
      ctx.rotate(shape.rotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = 0.6;

      this.drawShape(ctx, shape);

      ctx.restore();
    }
  }

  private drawShape(ctx: CanvasRenderingContext2D, shape: PopShape): void {
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    const size = shape.size / 2;

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'square':
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.strokeRect(-size, -size, size * 2, size * 2);
        break;

      case 'star':
        this.drawStar(ctx, 0, 0, 5, size, size / 2);
        break;

      case 'heart':
        this.drawHeart(ctx, 0, 0, size);
        break;
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    points: number,
    outer: number,
    inner: number
  ): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.2, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size * 1.2, x + size, y + size, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
    ctx.fill();
    ctx.stroke();
  }

  private updateAndDrawConfetti(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: number,
    treble: number
  ): void {
    // Add confetti on treble hits
    if (treble > 180 && this.confettiPieces.length < 100 * density) {
      for (let i = 0; i < 5; i++) {
        this.confettiPieces.push({
          x: random(0, width),
          y: -10,
          size: random(5, 15),
          color: this.colors[Math.floor(random(0, this.colors.length))],
          rotation: random(0, Math.PI * 2),
          rotationSpeed: random(-0.1, 0.1),
          vy: random(2, 5),
          vx: random(-1, 1),
        });
      }
    }

    // Update and draw
    for (let i = this.confettiPieces.length - 1; i >= 0; i--) {
      const c = this.confettiPieces[i];

      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;
      c.vy += 0.1; // Gravity

      // Remove off-screen
      if (c.y > height + 20) {
        this.confettiPieces.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }
  }

  private drawLightOverlay(
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
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.initialized = false;
    this.shapes = [];
    this.confettiPieces = [];
  }
}
