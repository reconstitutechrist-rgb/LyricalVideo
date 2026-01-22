/**
 * Film Projector Background Effect
 * Dust, scratches, frame flicker, old cinema aesthetic
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Scratch {
  x: number;
  length: number;
  width: number;
  opacity: number;
  speed: number;
}

interface DustParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export class FilmProjectorEffect extends GenreBackgroundEffect {
  readonly id = 'film-projector';
  readonly name = 'Film Projector';
  readonly parameters: EffectParameter[] = [
    slider('scratchDensity', 'Scratch Density', 0.5, 0, 1, 0.1),
    slider('dustAmount', 'Dust Amount', 0.5, 0, 1, 0.1),
    slider('flickerIntensity', 'Flicker Intensity', 0.4, 0, 1, 0.1),
    boolean('sepiaTone', 'Sepia Tone', true),
    boolean('frameJitter', 'Frame Jitter', true),
  ];

  private scratches: Scratch[] = [];
  private dust: DustParticle[] = [];
  private flickerValue = 1;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const scratchDensity = this.getParameter<number>('scratchDensity');
    const dustAmount = this.getParameter<number>('dustAmount');
    const flickerIntensity = this.getParameter<number>('flickerIntensity');
    const sepiaTone = this.getParameter<boolean>('sepiaTone');
    const frameJitter = this.getParameter<boolean>('frameJitter');

    if (!this.initialized) {
      this.initScratches(width, scratchDensity);
      this.initDust(width, height, dustAmount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const isBeat = audioData.isBeat;

    // Update flicker
    this.flickerValue = 0.85 + random(0, 0.15) * flickerIntensity;
    if (random(0, 1) < 0.02 * flickerIntensity) {
      this.flickerValue = 0.6 + random(0, 0.2);
    }

    // Apply frame jitter
    ctx.save();
    if (frameJitter) {
      const jitterX = random(-2, 2) * flickerIntensity;
      const jitterY = random(-2, 2) * flickerIntensity;
      ctx.translate(jitterX, jitterY);
    }

    // Base background with flicker
    if (sepiaTone) {
      const brightness = Math.floor(245 * this.flickerValue);
      const r = brightness;
      const g = Math.floor(brightness * 0.9);
      const b = Math.floor(brightness * 0.7);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
      const brightness = Math.floor(240 * this.flickerValue);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    }
    ctx.fillRect(0, 0, width, height);

    // Film grain
    this.drawFilmGrain(ctx, width, height, sepiaTone);

    // Vignette
    this.drawVignette(ctx, width, height);

    // Scratches
    this.updateAndDrawScratches(ctx, width, height, scratchDensity, sepiaTone);

    // Dust particles
    this.drawDust(ctx, width, height, dustAmount, currentTime, midBoost);

    // Light leaks
    if (random(0, 1) < 0.01 * flickerIntensity || isBeat) {
      this.drawLightLeak(ctx, width, height, sepiaTone);
    }

    // Film sprocket holes (edges)
    this.drawSprocketHoles(ctx, width, height);

    // Frame counter
    this.drawFrameCounter(ctx, width, height, currentTime);

    ctx.restore();

    // Occasional frame skip
    if (random(0, 1) < 0.005 * flickerIntensity) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  private initScratches(width: number, density: number): void {
    this.scratches = [];
    const count = Math.floor(3 + density * 5);

    for (let i = 0; i < count; i++) {
      this.scratches.push({
        x: random(0, width),
        length: random(100, 500),
        width: random(0.5, 2),
        opacity: random(0.1, 0.4),
        speed: random(2, 8),
      });
    }
  }

  private initDust(width: number, height: number, amount: number): void {
    this.dust = [];
    const count = Math.floor(20 + amount * 50);

    for (let i = 0; i < count; i++) {
      this.dust.push({
        x: random(0, width),
        y: random(0, height),
        size: random(1, 4),
        opacity: random(0.1, 0.5),
      });
    }
  }

  private drawFilmGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sepia: boolean
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (random(0, 1) - 0.5) * 30;
      data[i] += noise; // R
      data[i + 1] += noise * (sepia ? 0.9 : 1); // G
      data[i + 2] += noise * (sepia ? 0.7 : 1); // B
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0.3, 'transparent');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private updateAndDrawScratches(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: number,
    sepia: boolean
  ): void {
    for (const scratch of this.scratches) {
      // Move scratch down
      scratch.x += random(-0.5, 0.5);

      // Wrap around
      if (scratch.x < -10) scratch.x = width + 10;
      if (scratch.x > width + 10) scratch.x = -10;

      // Draw scratch
      const scratchColor = sepia
        ? `rgba(60, 50, 40, ${scratch.opacity * density})`
        : `rgba(50, 50, 50, ${scratch.opacity * density})`;

      ctx.strokeStyle = scratchColor;
      ctx.lineWidth = scratch.width;
      ctx.beginPath();
      ctx.moveTo(scratch.x, 0);

      // Wavy scratch line
      let y = 0;
      while (y < height) {
        y += 20;
        const wobble = random(-3, 3);
        ctx.lineTo(scratch.x + wobble, y);
      }

      ctx.stroke();
    }

    // Add random temporary scratches
    if (random(0, 1) < 0.1 * density) {
      const tempX = random(0, width);
      ctx.strokeStyle = sepia ? 'rgba(80, 70, 60, 0.3)' : 'rgba(80, 80, 80, 0.3)';
      ctx.lineWidth = random(0.5, 1.5);
      ctx.beginPath();
      ctx.moveTo(tempX, 0);
      ctx.lineTo(tempX + random(-5, 5), height);
      ctx.stroke();
    }
  }

  private drawDust(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number,
    time: number,
    midBoost: number
  ): void {
    for (const particle of this.dust) {
      // Slow movement
      particle.x += random(-0.5, 0.5);
      particle.y += random(-0.3, 0.5);

      // Wrap around
      if (particle.y > height) particle.y = -particle.size;
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;

      // Draw dust
      const flicker = random(0.5, 1);
      ctx.fillStyle = `rgba(30, 30, 30, ${particle.opacity * amount * flicker})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add random hair/fiber artifacts
    if (random(0, 1) < 0.02 * amount) {
      ctx.strokeStyle = `rgba(20, 20, 20, ${0.2 + midBoost * 0.2})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const startX = random(0, width);
      const startY = random(0, height);
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        startX + random(-20, 20),
        startY + random(-20, 20),
        startX + random(-30, 30),
        startY + random(-30, 30),
        startX + random(-40, 40),
        startY + random(-40, 40)
      );
      ctx.stroke();
    }
  }

  private drawLightLeak(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sepia: boolean
  ): void {
    const side = random(0, 1) < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? 0 : width;
    const leakWidth = random(50, 150);

    const gradient = ctx.createLinearGradient(
      side === 'left' ? 0 : width,
      0,
      side === 'left' ? leakWidth : width - leakWidth,
      0
    );

    if (sepia) {
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 180, 80, 0.2)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 180, 0.2)');
    }
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawSprocketHoles(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const holeWidth = 15;
    const holeHeight = 10;
    const spacing = 25;
    const margin = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

    // Left side holes
    for (let y = spacing; y < height; y += spacing) {
      ctx.fillRect(margin, y, holeWidth, holeHeight);
    }

    // Right side holes
    for (let y = spacing; y < height; y += spacing) {
      ctx.fillRect(width - margin - holeWidth, y, holeWidth, holeHeight);
    }
  }

  private drawFrameCounter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ): void {
    const frame = Math.floor(time * 24) % 10000;
    const frameStr = String(frame).padStart(4, '0');

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(frameStr, width - 40, height - 10);
  }

  reset(): void {
    this.initialized = false;
    this.scratches = [];
    this.dust = [];
    this.flickerValue = 1;
  }
}
