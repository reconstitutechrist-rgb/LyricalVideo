/**
 * Particle System
 * Reusable particle class for effects
 */

import { ColorPalette } from '../../../types';
import { getRandomPaletteColor } from '../utils/CanvasUtils';

/**
 * Individual particle for visual effects
 */
export class Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  speedX: number;
  speedY: number;
  color: string;
  history: { x: number; y: number }[];
  life: number;
  maxLife: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;

  constructor(w: number, h: number, palette: ColorPalette) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.color = this.getColor(palette);
    this.history = [];
    this.life = 1;
    this.maxLife = 1;
    this.opacity = 1;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }

  getColor(palette: ColorPalette): string {
    if (palette === 'neon') return `hsla(${Math.random() * 60 + 280}, 100%, 50%, 0.6)`;
    if (palette === 'sunset') return `hsla(${Math.random() * 60 + 10}, 100%, 60%, 0.6)`;
    if (palette === 'ocean') return `hsla(${Math.random() * 50 + 180}, 80%, 60%, 0.6)`;
    if (palette === 'matrix') return `hsla(${Math.random() * 40 + 100}, 100%, 50%, 0.7)`;
    if (palette === 'fire') return `hsla(${Math.random() * 30}, 100%, 50%, 0.7)`;
    return `hsla(${Math.random() * 360}, 100%, 50%, 0.5)`;
  }

  updateColor(palette: ColorPalette, sentimentColor?: string) {
    if (sentimentColor) {
      this.color = sentimentColor;
    } else {
      this.color = this.getColor(palette);
    }
  }

  update(
    motionFreq: number,
    pulseFreq: number,
    w: number,
    h: number,
    speedMult: number,
    intensity: number,
    speedXFac: number,
    speedYFac: number,
    trailsEnabled: boolean
  ) {
    // Pulse drives size
    const boost = 1 + (pulseFreq / 255) * 2 * intensity;
    const motionBoost = 1 + motionFreq / 255;

    this.x += this.speedX * speedMult * speedXFac * motionBoost;
    this.y += this.speedY * speedMult * speedYFac * motionBoost;

    if (this.x > w) this.x = 0;
    if (this.x < 0) this.x = w;
    if (this.y > h) this.y = 0;
    if (this.y < 0) this.y = h;

    this.size = this.baseSize * boost;
    this.rotation += this.rotationSpeed;

    if (trailsEnabled) {
      this.history.push({ x: this.x, y: this.y });
      const limit = Math.floor(5 + 15 * intensity * speedMult);
      while (this.history.length > limit) {
        this.history.shift();
      }
    } else {
      this.history = [];
    }
  }

  draw(ctx: CanvasRenderingContext2D, trailsEnabled: boolean) {
    ctx.globalAlpha = this.opacity * this.life;

    if (trailsEnabled && this.history.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (const point of this.history) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size / 2;
      ctx.stroke();
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  /**
   * Reset particle to a new position
   */
  reset(x: number, y: number, palette: ColorPalette) {
    this.x = x;
    this.y = y;
    this.color = this.getColor(palette);
    this.history = [];
    this.life = 1;
    this.opacity = 1;
  }
}

/**
 * Particle pool for efficient particle management
 */
export class ParticlePool {
  private pool: Particle[] = [];
  private activeCount: number = 0;
  private width: number;
  private height: number;
  private palette: ColorPalette;

  constructor(width: number, height: number, palette: ColorPalette, initialSize: number = 100) {
    this.width = width;
    this.height = height;
    this.palette = palette;

    // Pre-allocate particles
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Particle(width, height, palette));
    }
  }

  /**
   * Acquire a particle from the pool
   */
  acquire(): Particle | null {
    if (this.activeCount < this.pool.length) {
      const particle = this.pool[this.activeCount];
      this.activeCount++;
      return particle;
    }

    // Grow pool if needed
    if (this.pool.length < 1000) {
      const particle = new Particle(this.width, this.height, this.palette);
      this.pool.push(particle);
      this.activeCount++;
      return particle;
    }

    return null;
  }

  /**
   * Release a particle back to the pool
   */
  release(particle: Particle): void {
    const index = this.pool.indexOf(particle);
    if (index !== -1 && index < this.activeCount) {
      // Swap with last active particle
      const lastActive = this.activeCount - 1;
      [this.pool[index], this.pool[lastActive]] = [this.pool[lastActive], this.pool[index]];
      this.activeCount--;
    }
  }

  /**
   * Get all active particles
   */
  getActive(): Particle[] {
    return this.pool.slice(0, this.activeCount);
  }

  /**
   * Reset all particles
   */
  reset(): void {
    this.activeCount = 0;
  }

  /**
   * Update pool dimensions
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Update pool palette
   */
  setPalette(palette: ColorPalette): void {
    this.palette = palette;
  }

  get size(): number {
    return this.activeCount;
  }
}

/**
 * Text particle for text dissolution effects
 */
export interface TextParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

/**
 * Create a text particle
 */
export function createTextParticle(
  x: number,
  y: number,
  char: string,
  size: number,
  color: string
): TextParticle {
  return {
    x,
    y,
    originX: x,
    originY: y,
    vx: 0,
    vy: 0,
    char,
    size,
    color,
    opacity: 1,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    life: 1,
  };
}
