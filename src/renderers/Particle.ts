/**
 * Particle Class - uses circular buffer for O(1) trail updates
 * Extracted from Visualizer.tsx for modularity and reusability
 */

import { ColorPalette } from '../../types';

export interface ParticlePosition {
  x: number;
  y: number;
}

export class Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  speedX: number;
  speedY: number;
  color: string;
  history: ParticlePosition[];
  historyIndex: number; // Circular buffer write index
  historyLength: number; // Current valid entries count

  constructor(w: number, h: number, palette: ColorPalette) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.color = this.getColor(palette);
    this.history = [];
    this.historyIndex = 0;
    this.historyLength = 0;
  }

  getColor(palette: ColorPalette): string {
    // Original palettes
    if (palette === 'neon') return `hsla(${Math.random() * 60 + 280}, 100%, 50%, 0.6)`;
    if (palette === 'sunset') return `hsla(${Math.random() * 60 + 10}, 100%, 60%, 0.6)`;
    if (palette === 'ocean') return `hsla(${Math.random() * 50 + 180}, 80%, 60%, 0.6)`;
    if (palette === 'matrix') return `hsla(${Math.random() * 40 + 100}, 100%, 50%, 0.7)`;
    if (palette === 'fire') return `hsla(${Math.random() * 30}, 100%, 50%, 0.7)`;
    // Pastels & Soft
    if (palette === 'pastel')
      return `hsla(${Math.random() * 360}, ${40 + Math.random() * 20}%, ${75 + Math.random() * 10}%, 0.6)`;
    if (palette === 'grayscale')
      return `hsla(0, ${Math.random() * 5}%, ${20 + Math.random() * 70}%, 0.7)`;
    if (palette === 'sepia')
      return `hsla(${25 + Math.random() * 20}, ${30 + Math.random() * 20}%, ${30 + Math.random() * 40}%, 0.7)`;
    // Seasonal
    if (palette === 'autumn')
      return `hsla(${Math.random() * 50}, ${60 + Math.random() * 30}%, ${40 + Math.random() * 20}%, 0.7)`;
    if (palette === 'winter')
      return `hsla(${190 + Math.random() * 50}, ${30 + Math.random() * 40}%, ${60 + Math.random() * 30}%, 0.6)`;
    if (palette === 'spring') {
      const cluster = Math.random() > 0.5 ? 60 + Math.random() * 60 : 300 + Math.random() * 40;
      return `hsla(${cluster}, ${50 + Math.random() * 30}%, ${55 + Math.random() * 20}%, 0.6)`;
    }
    // High contrast & Nature
    if (palette === 'cyberpunk') {
      const isCyan = Math.random() > 0.5;
      const hue = isCyan ? 170 + Math.random() * 30 : 300 + Math.random() * 30;
      return `hsla(${hue}, ${90 + Math.random() * 10}%, ${50 + Math.random() * 20}%, 0.8)`;
    }
    if (palette === 'nature') {
      const clusters = [80 + Math.random() * 60, 200 + Math.random() * 20, 20 + Math.random() * 20];
      const hue = clusters[Math.floor(Math.random() * 3)];
      return `hsla(${hue}, ${40 + Math.random() * 30}%, ${35 + Math.random() * 30}%, 0.6)`;
    }
    return `hsla(${Math.random() * 360}, 100%, 50%, 0.5)`;
  }

  updateColor(palette: ColorPalette, sentimentColor?: string): void {
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
  ): void {
    // Pulse drives size
    const boost = 1 + (pulseFreq / 255) * 2 * intensity;
    const motionBoost = 1 + motionFreq / 255;

    this.x += this.speedX * speedMult * speedXFac * motionBoost;
    this.y += this.speedY * speedMult * speedYFac * motionBoost;

    // Wrap around edges
    if (this.x > w) this.x = 0;
    if (this.x < 0) this.x = w;
    if (this.y > h) this.y = 0;
    if (this.y < 0) this.y = h;

    this.size = this.baseSize * boost;

    if (trailsEnabled) {
      const limit = Math.floor(5 + 15 * intensity * speedMult);

      // Circular buffer - O(1) instead of O(n) shift()
      if (this.history.length < limit) {
        this.history.push({ x: this.x, y: this.y });
        this.historyLength = this.history.length;
      } else {
        const idx = this.historyIndex % limit;
        this.history[idx] = { x: this.x, y: this.y };
        this.historyIndex++;
        this.historyLength = Math.min(this.historyLength + 1, limit);

        if (this.history.length > limit) {
          this.history.length = limit;
          this.historyIndex = 0;
          this.historyLength = limit;
        }
      }
    } else {
      this.history = [];
      this.historyIndex = 0;
      this.historyLength = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, trailsEnabled: boolean): void {
    if (trailsEnabled && this.historyLength > 0) {
      ctx.beginPath();

      // Iterate circular buffer from oldest to newest
      const len = this.history.length;
      const startIdx = (this.historyIndex - this.historyLength + len) % len;

      const firstPoint = this.history[startIdx];
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < this.historyLength; i++) {
        const idx = (startIdx + i) % len;
        const point = this.history[idx];
        ctx.lineTo(point.x, point.y);
      }

      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size / 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
