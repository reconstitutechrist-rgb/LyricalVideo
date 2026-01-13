/**
 * Indie/Dreamy Background Effect
 * Vintage, soft, film grain, bokeh, muted colors
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, color } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random, noise2D } from '../../utils/MathUtils';
import { hexToRgb } from '../../utils/CanvasUtils';

interface BokehCircle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  hue: number;
}

export class IndieDreamyEffect extends GenreBackgroundEffect {
  readonly id = 'indie-dreamy';
  readonly name = 'Indie/Dreamy';
  readonly parameters: EffectParameter[] = [
    slider('filmGrain', 'Film Grain', 0.3, 0, 0.6, 0.05),
    slider('bokehAmount', 'Bokeh Amount', 0.5, 0, 1, 0.05),
    color('colorWash', 'Color Wash', '#e8d4c4'),
    slider('softness', 'Softness', 0.4, 0, 0.8, 0.05),
    slider('vintageAmount', 'Vintage Amount', 0.5, 0, 1, 0.05),
  ];

  private bokehCircles: BokehCircle[] = [];
  private initialized = false;
  private grainPattern: ImageData | null = null;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const filmGrain = this.getParameter<number>('filmGrain');
    const bokehAmount = this.getParameter<number>('bokehAmount');
    const colorWash = this.getParameter<string>('colorWash');
    const softness = this.getParameter<number>('softness');
    const vintageAmount = this.getParameter<number>('vintageAmount');

    // Initialize bokeh
    if (!this.initialized) {
      this.initBokeh(width, height, Math.floor(20 * bokehAmount));
      this.initialized = true;
    }

    // Dreamy base gradient
    this.drawDreamyBackground(ctx, width, height, colorWash, currentTime);

    // Soft bokeh circles
    if (bokehAmount > 0) {
      this.updateAndDrawBokeh(ctx, width, height, audioData.average, currentTime);
    }

    // Vintage color grading
    if (vintageAmount > 0) {
      this.applyVintageGrading(ctx, width, height, vintageAmount);
    }

    // Soft blur/glow overlay
    if (softness > 0) {
      this.drawSoftOverlay(ctx, width, height, softness);
    }

    // Film grain
    if (filmGrain > 0) {
      this.drawFilmGrain(ctx, width, height, filmGrain, currentTime);
    }

    // Light leak effect
    this.drawLightLeak(ctx, width, height, currentTime, audioData.mid);

    // Vignette
    this.addVignette(ctx, width, height, 0.5);
  }

  private initBokeh(width: number, height: number, count: number): void {
    this.bokehCircles = [];
    for (let i = 0; i < count; i++) {
      this.bokehCircles.push({
        x: random(0, width),
        y: random(0, height),
        size: random(30, 150),
        opacity: random(0.03, 0.15),
        speed: random(0.1, 0.3),
        hue: random(30, 60), // Warm tones
      });
    }
  }

  private drawDreamyBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colorWash: string,
    time: number
  ): void {
    const rgb = hexToRgb(colorWash) || { r: 232, g: 212, b: 196 };

    // Subtle animated gradient
    const shift = Math.sin(time * 0.1) * 20;

    const gradient = ctx.createRadialGradient(
      width * 0.3 + shift,
      height * 0.3,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height)
    );

    gradient.addColorStop(0, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    gradient.addColorStop(
      0.5,
      `rgb(${Math.floor(rgb.r * 0.7)}, ${Math.floor(rgb.g * 0.7)}, ${Math.floor(rgb.b * 0.7)})`
    );
    gradient.addColorStop(
      1,
      `rgb(${Math.floor(rgb.r * 0.4)}, ${Math.floor(rgb.g * 0.4)}, ${Math.floor(rgb.b * 0.4)})`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private updateAndDrawBokeh(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    average: number,
    time: number
  ): void {
    for (const bokeh of this.bokehCircles) {
      // Gentle drift
      const noiseX = noise2D(bokeh.x * 0.005, time * 0.1);
      const noiseY = noise2D(bokeh.y * 0.005, time * 0.1 + 100);

      bokeh.x += noiseX * bokeh.speed * 2;
      bokeh.y += noiseY * bokeh.speed - bokeh.speed * 0.2;

      // Wrap around
      if (bokeh.y < -bokeh.size) bokeh.y = height + bokeh.size;
      if (bokeh.x < -bokeh.size) bokeh.x = width + bokeh.size;
      if (bokeh.x > width + bokeh.size) bokeh.x = -bokeh.size;

      // Pulsing size
      const pulse = 1 + Math.sin(time * 0.5 + bokeh.x * 0.01) * 0.1;
      const audioBoost = 1 + (average / 255) * 0.2;

      // Draw bokeh circle
      const gradient = ctx.createRadialGradient(
        bokeh.x,
        bokeh.y,
        0,
        bokeh.x,
        bokeh.y,
        bokeh.size * pulse * audioBoost
      );

      gradient.addColorStop(0, `hsla(${bokeh.hue}, 40%, 80%, ${bokeh.opacity})`);
      gradient.addColorStop(0.7, `hsla(${bokeh.hue}, 40%, 80%, ${bokeh.opacity * 0.5})`);
      gradient.addColorStop(1, `hsla(${bokeh.hue}, 40%, 80%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bokeh.x, bokeh.y, bokeh.size * pulse * audioBoost, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private applyVintageGrading(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ): void {
    // Sepia-like overlay
    ctx.fillStyle = `rgba(112, 66, 20, ${amount * 0.15})`;
    ctx.fillRect(0, 0, width, height);

    // Fade blacks slightly
    ctx.fillStyle = `rgba(40, 40, 50, ${amount * 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }

  private drawSoftOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    softness: number
  ): void {
    // Central soft glow
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.6
    );

    gradient.addColorStop(0, `rgba(255, 245, 235, ${softness * 0.2})`);
    gradient.addColorStop(0.5, `rgba(255, 245, 235, ${softness * 0.1})`);
    gradient.addColorStop(1, 'rgba(255, 245, 235, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawFilmGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    _time: number
  ): void {
    // Animated grain
    ctx.globalAlpha = intensity;

    for (let i = 0; i < width * height * 0.002; i++) {
      const x = random(0, width);
      const y = random(0, height);
      const brightness = random(0, 255);

      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.globalAlpha = 1;
  }

  private drawLightLeak(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    mid: number
  ): void {
    const intensity = 0.05 + (mid / 255) * 0.1;
    const hue = ((time * 5) % 60) + 20; // Warm hues

    // Corner light leak
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
    gradient.addColorStop(0, `hsla(${hue}, 60%, 60%, ${intensity})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 60%, 60%, ${intensity * 0.3})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Opposite corner
    const gradient2 = ctx.createRadialGradient(width, height, 0, width, height, width * 0.4);
    gradient2.addColorStop(0, `hsla(${hue + 30}, 50%, 70%, ${intensity * 0.5})`);
    gradient2.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.initialized = false;
    this.bokehCircles = [];
  }
}
