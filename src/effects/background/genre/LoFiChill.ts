/**
 * Lo-Fi/Chill Background Effect
 * Cozy aesthetic with rain, steam, and warm lighting
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, color } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface SteamParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
}

export class LoFiChillEffect extends GenreBackgroundEffect {
  readonly id = 'lofi-chill';
  readonly name = 'Lo-Fi/Chill';
  readonly parameters: EffectParameter[] = [
    slider('rainDensity', 'Rain Density', 0.5, 0, 1, 0.05),
    slider('steamAmount', 'Steam Amount', 0.3, 0, 1, 0.05),
    color('warmth', 'Warmth Color', '#ffa500'),
    slider('grainIntensity', 'Film Grain', 0.1, 0, 0.3, 0.02),
    boolean('windowFog', 'Window Fog Effect', true),
  ];

  private rainDrops: RainDrop[] = [];
  private steamParticles: SteamParticle[] = [];
  private initialized = false;
  private noiseOffset = 0;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const rainDensity = this.getParameter<number>('rainDensity');
    const steamAmount = this.getParameter<number>('steamAmount');
    const warmth = this.getParameter<string>('warmth');
    const grainIntensity = this.getParameter<number>('grainIntensity');
    const windowFog = this.getParameter<boolean>('windowFog');

    // Initialize
    if (!this.initialized) {
      this.initRain(width, height, rainDensity);
      this.initSteam(width, height, steamAmount);
      this.initialized = true;
    }

    // Dark cozy background
    this.drawBackground(ctx, width, height, warmth);

    // Window fog effect
    if (windowFog) {
      this.drawWindowFog(ctx, width, height, currentTime);
    }

    // Rain
    this.updateAndDrawRain(ctx, width, height, rainDensity, audioData.mid);

    // Steam particles
    this.updateAndDrawSteam(ctx, width, height, steamAmount, audioData.bass);

    // Warm light overlay
    this.drawWarmLightOverlay(ctx, width, height, warmth, audioData.treble);

    // Film grain
    if (grainIntensity > 0) {
      this.drawGrain(ctx, width, height, grainIntensity);
    }

    // Vignette for cozy feel
    this.addVignette(ctx, width, height, 0.6);

    this.noiseOffset += deltaTime * 0.5;
  }

  private initRain(width: number, height: number, density: number): void {
    this.rainDrops = [];
    const count = Math.floor(200 * density);
    for (let i = 0; i < count; i++) {
      this.rainDrops.push({
        x: random(0, width),
        y: random(-height, height),
        length: random(10, 30),
        speed: random(8, 15),
        opacity: random(0.1, 0.4),
      });
    }
  }

  private initSteam(width: number, height: number, amount: number): void {
    this.steamParticles = [];
    const count = Math.floor(30 * amount);
    for (let i = 0; i < count; i++) {
      this.steamParticles.push({
        x: random(width * 0.3, width * 0.7),
        y: random(height * 0.6, height),
        size: random(20, 60),
        opacity: random(0.1, 0.3),
        speed: random(0.3, 1),
        drift: random(-0.5, 0.5),
      });
    }
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    warmth: string
  ): void {
    // Dark blue-purple gradient with warm undertones
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle warm glow at bottom (like lamp light)
    const warmGradient = ctx.createRadialGradient(
      width * 0.3,
      height * 0.8,
      0,
      width * 0.3,
      height * 0.8,
      height * 0.5
    );
    warmGradient.addColorStop(0, warmth + '30');
    warmGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = warmGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawWindowFog(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ): void {
    // Condensation effect on window
    ctx.save();
    ctx.globalAlpha = 0.05;

    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(time * 0.1 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 0.15 + i * 0.5) * 0.5 + 0.5) * height;
      const radius = 50 + Math.sin(time + i) * 20;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(200, 200, 220, 0.3)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private updateAndDrawRain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: number,
    mid: number
  ): void {
    const speedBoost = 1 + (mid / 255) * 0.5;

    ctx.save();
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
    ctx.lineWidth = 1;

    for (const drop of this.rainDrops) {
      drop.y += drop.speed * speedBoost;

      if (drop.y > height) {
        drop.y = -drop.length;
        drop.x = random(0, width);
      }

      ctx.globalAlpha = drop.opacity;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 1, drop.y + drop.length);
      ctx.stroke();
    }

    ctx.restore();
  }

  private updateAndDrawSteam(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number,
    bass: number
  ): void {
    const bassBoost = 1 + (bass / 255) * 0.3;

    for (const particle of this.steamParticles) {
      particle.y -= particle.speed * bassBoost;
      particle.x += particle.drift;
      particle.opacity *= 0.995;

      if (particle.y < height * 0.2 || particle.opacity < 0.01) {
        particle.y = random(height * 0.7, height);
        particle.x = random(width * 0.3, width * 0.7);
        particle.opacity = random(0.1, 0.3);
      }

      ctx.save();
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      );
      gradient.addColorStop(0, `rgba(200, 200, 220, ${particle.opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawWarmLightOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    warmth: string,
    treble: number
  ): void {
    const intensity = 0.05 + (treble / 255) * 0.1;

    const gradient = ctx.createRadialGradient(
      width * 0.7,
      height * 0.3,
      0,
      width * 0.7,
      height * 0.3,
      width * 0.5
    );
    gradient.addColorStop(
      0,
      warmth +
        Math.floor(intensity * 255)
          .toString(16)
          .padStart(2, '0')
    );
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity * 100;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  reset(): void {
    this.initialized = false;
    this.rainDrops = [];
    this.steamParticles = [];
  }
}
