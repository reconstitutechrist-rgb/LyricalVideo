/**
 * Classical/Elegant Background Effect
 * Refined, minimal, soft gradients with gentle particle movement
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random, noise2D } from '../../utils/MathUtils';

interface ElegantParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  type: 'dust' | 'notes' | 'stars';
}

export class ClassicalElegantEffect extends GenreBackgroundEffect {
  readonly id = 'classical-elegant';
  readonly name = 'Classical/Elegant';
  readonly parameters: EffectParameter[] = [
    enumParam('particleType', 'Particle Type', 'dust', [
      { value: 'dust', label: 'Dust Motes' },
      { value: 'notes', label: 'Music Notes' },
      { value: 'stars', label: 'Soft Stars' },
    ]),
    slider('vignetteStrength', 'Vignette Strength', 0.3, 0, 0.7, 0.05),
    enumParam('gradientStyle', 'Gradient Style', 'warm', [
      { value: 'warm', label: 'Warm' },
      { value: 'cool', label: 'Cool' },
      { value: 'neutral', label: 'Neutral' },
    ]),
    slider('particleCount', 'Particle Count', 30, 10, 80, 5),
    slider('glowIntensity', 'Glow Intensity', 0.3, 0, 0.6, 0.05),
  ];

  private particles: ElegantParticle[] = [];
  private initialized = false;

  private readonly gradients = {
    warm: ['#2d1b1b', '#4a2c2c', '#3d2424', '#1a0f0f'],
    cool: ['#1a1a2e', '#252540', '#1e1e35', '#0f0f1a'],
    neutral: ['#1c1c1c', '#2a2a2a', '#232323', '#141414'],
  };

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const particleType = this.getParameter<string>('particleType') as 'dust' | 'notes' | 'stars';
    const vignetteStrength = this.getParameter<number>('vignetteStrength');
    const gradientStyle = this.getParameter<string>('gradientStyle') as 'warm' | 'cool' | 'neutral';
    const particleCount = this.getParameter<number>('particleCount');
    const glowIntensity = this.getParameter<number>('glowIntensity');

    // Initialize particles
    if (!this.initialized || this.particles.length !== particleCount) {
      this.initParticles(width, height, particleCount, particleType);
      this.initialized = true;
    }

    // Elegant gradient background
    const colors = this.gradients[gradientStyle];
    this.drawElegantBackground(ctx, width, height, colors, currentTime);

    // Center glow
    if (glowIntensity > 0) {
      this.drawCenterGlow(ctx, width, height, glowIntensity, audioData.mid, gradientStyle);
    }

    // Floating particles
    this.updateAndDrawParticles(ctx, width, height, particleType, audioData.average, currentTime);

    // Subtle vignette
    if (vignetteStrength > 0) {
      this.addVignette(ctx, width, height, vignetteStrength);
    }

    // Film grain for texture
    this.addSubtleGrain(ctx, width, height);
  }

  private initParticles(
    width: number,
    height: number,
    count: number,
    type: 'dust' | 'notes' | 'stars'
  ): void {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: random(0, width),
        y: random(0, height),
        size: random(1, type === 'dust' ? 3 : 8),
        opacity: random(0.1, 0.4),
        speed: random(0.1, 0.5),
        type,
      });
    }
  }

  private drawElegantBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[],
    time: number
  ): void {
    // Animated gradient
    const shift = Math.sin(time * 0.1) * 0.1;

    const gradient = ctx.createRadialGradient(
      width * (0.5 + shift),
      height * 0.5,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height)
    );

    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.4, colors[1]);
    gradient.addColorStop(0.7, colors[2]);
    gradient.addColorStop(1, colors[3]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawCenterGlow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    mid: number,
    style: string
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4 + (mid / 255) * 50;

    let glowColor: string;
    switch (style) {
      case 'warm':
        glowColor = 'rgba(255, 200, 150';
        break;
      case 'cool':
        glowColor = 'rgba(150, 180, 255';
        break;
      default:
        glowColor = 'rgba(200, 200, 200';
    }

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `${glowColor}, ${intensity * 0.5})`);
    gradient.addColorStop(0.5, `${glowColor}, ${intensity * 0.2})`);
    gradient.addColorStop(1, `${glowColor}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private updateAndDrawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: string,
    average: number,
    time: number
  ): void {
    for (const p of this.particles) {
      // Gentle floating motion
      const noiseX = noise2D(p.x * 0.01, time * 0.2) * 2;
      const noiseY = noise2D(p.y * 0.01, time * 0.2 + 100) * 2;

      p.x += noiseX * p.speed;
      p.y -= p.speed * 0.3 + (average / 255) * p.speed;

      // Wrap around
      if (p.y < -10) p.y = height + 10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      // Pulsing opacity
      const pulsingOpacity = p.opacity * (0.8 + Math.sin(time * 2 + p.x) * 0.2);

      ctx.globalAlpha = pulsingOpacity;

      switch (type) {
        case 'dust':
          this.drawDust(ctx, p.x, p.y, p.size);
          break;
        case 'notes':
          this.drawMusicNote(ctx, p.x, p.y, p.size);
          break;
        case 'stars':
          this.drawSoftStar(ctx, p.x, p.y, p.size);
          break;
      }
    }

    ctx.globalAlpha = 1;
  }

  private drawDust(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMusicNote(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `${size * 3}px serif`;
    ctx.fillText('♪', x, y);
  }

  private drawSoftStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Center bright point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private addSubtleGrain(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 1000; i++) {
      const x = random(0, width);
      const y = random(0, height);
      const brightness = random(200, 255);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  reset(): void {
    this.initialized = false;
    this.particles = [];
  }
}
