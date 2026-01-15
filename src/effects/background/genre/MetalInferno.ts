/**
 * Metal/Inferno Background Effect
 * Intense fire, smoke, and aggressive visuals for heavy metal
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Flame {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  phase: number;
}

interface Ember {
  x: number;
  y: number;
  size: number;
  speed: number;
  life: number;
  maxLife: number;
}

interface Lightning {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
}

export class MetalInfernoEffect extends GenreBackgroundEffect {
  readonly id = 'metal-inferno';
  readonly name = 'Metal/Inferno';
  readonly parameters: EffectParameter[] = [
    slider('flameHeight', 'Flame Height', 0.4, 0.2, 0.6, 0.05),
    slider('smokeOpacity', 'Smoke Opacity', 0.5, 0, 0.8, 0.05),
    slider('lightningFrequency', 'Lightning Frequency', 0.3, 0, 1, 0.05),
    slider('aggression', 'Aggression', 0.7, 0, 1, 0.05),
    boolean('embers', 'Ember Particles', true),
  ];

  private flames: Flame[] = [];
  private embers: Ember[] = [];
  private lightnings: Lightning[] = [];
  private flashIntensity = 0;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const flameHeight = this.getParameter<number>('flameHeight');
    const smokeOpacity = this.getParameter<number>('smokeOpacity');
    const lightningFrequency = this.getParameter<number>('lightningFrequency');
    const aggression = this.getParameter<number>('aggression');
    const embersEnabled = this.getParameter<boolean>('embers');

    // Initialize
    if (!this.initialized) {
      this.initFlames(width, height, flameHeight);
      this.initialized = true;
    }

    // Dark background with red tint
    this.drawBackground(ctx, width, height, audioData.bass);

    // Smoke
    this.drawSmoke(ctx, width, height, smokeOpacity, currentTime);

    // Flames
    this.updateAndDrawFlames(ctx, width, height, flameHeight, audioData.bass, currentTime);

    // Embers
    if (embersEnabled) {
      this.updateAndDrawEmbers(ctx, width, height, audioData.mid);
    }

    // Lightning on treble hits
    if (audioData.treble > 200 * (1 - lightningFrequency) && Math.random() < 0.3) {
      this.addLightning(width, height);
    }
    this.updateAndDrawLightning(ctx, deltaTime);

    // Flash on bass hits
    if (audioData.isBeat && audioData.bass > 180) {
      this.flashIntensity = 0.3 * aggression;
    }
    this.drawFlash(ctx, width, height);

    // Aggressive camera shake simulation via edge distortion
    if (aggression > 0.5 && audioData.bass > 150) {
      this.drawEdgeDistortion(ctx, width, height, aggression, audioData.bass);
    }

    // Dark vignette
    this.addVignette(ctx, width, height, 0.7);
  }

  private initFlames(width: number, height: number, _flameHeight: number): void {
    this.flames = [];
    const count = Math.floor(width / 20);
    for (let i = 0; i < count; i++) {
      this.flames.push({
        x: (i / count) * width,
        y: height,
        size: random(40, 100),
        speed: random(2, 5),
        wobble: random(0.5, 1.5),
        phase: random(0, Math.PI * 2),
      });
    }
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number
  ): void {
    const redTint = 0.1 + (bass / 255) * 0.2;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgb(${Math.floor(30 + redTint * 50)}, 5, 5)`);
    gradient.addColorStop(0.5, `rgb(${Math.floor(20 + redTint * 40)}, 0, 0)`);
    gradient.addColorStop(1, `rgb(${Math.floor(40 + redTint * 60)}, 10, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawSmoke(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opacity: number,
    time: number
  ): void {
    ctx.save();

    for (let i = 0; i < 5; i++) {
      const x = width * (0.2 + i * 0.15);
      const y = height * 0.4 + Math.sin(time + i) * 30;
      const radius = 150 + Math.sin(time * 0.5 + i) * 50;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(50, 50, 50, ${opacity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(30, 30, 30, ${opacity * 0.3})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private updateAndDrawFlames(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    flameHeight: number,
    bass: number,
    time: number
  ): void {
    const bassBoost = 1 + (bass / 255) * 0.5;
    const baseHeight = height * flameHeight * bassBoost;

    for (const flame of this.flames) {
      const wobble = Math.sin(time * flame.wobble + flame.phase) * 20;
      const currentHeight = baseHeight * random(0.8, 1.2);

      // Flame gradient
      const gradient = ctx.createLinearGradient(flame.x, height, flame.x, height - currentHeight);
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
      gradient.addColorStop(0.3, 'rgba(255, 50, 0, 0.7)');
      gradient.addColorStop(0.6, 'rgba(200, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(flame.x - flame.size / 2, height);
      ctx.quadraticCurveTo(
        flame.x + wobble,
        height - currentHeight * 0.6,
        flame.x,
        height - currentHeight
      );
      ctx.quadraticCurveTo(
        flame.x - wobble,
        height - currentHeight * 0.6,
        flame.x + flame.size / 2,
        height
      );
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndDrawEmbers(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mid: number
  ): void {
    // Add new embers
    if (Math.random() < 0.3 + (mid / 255) * 0.3) {
      this.embers.push({
        x: random(0, width),
        y: height,
        size: random(2, 6),
        speed: random(2, 5),
        life: 0,
        maxLife: random(60, 120),
      });
    }

    // Update and draw
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const ember = this.embers[i];
      ember.y -= ember.speed;
      ember.x += Math.sin(ember.life * 0.1) * 2;
      ember.life++;

      if (ember.life > ember.maxLife || ember.y < 0) {
        this.embers.splice(i, 1);
        continue;
      }

      const alpha = 1 - ember.life / ember.maxLife;
      const hue = 30 - (ember.life / ember.maxLife) * 30; // Orange to red

      ctx.save();
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
      ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${alpha})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private addLightning(width: number, height: number): void {
    const points: { x: number; y: number }[] = [];
    let x = random(width * 0.2, width * 0.8);
    let y = 0;

    points.push({ x, y });

    while (y < height * 0.7) {
      x += random(-50, 50);
      y += random(20, 60);
      points.push({ x, y });
    }

    this.lightnings.push({
      points,
      life: 0,
      maxLife: 10,
    });
  }

  private updateAndDrawLightning(ctx: CanvasRenderingContext2D, deltaTime: number): void {
    for (let i = this.lightnings.length - 1; i >= 0; i--) {
      const lightning = this.lightnings[i];
      lightning.life += deltaTime * 60;

      if (lightning.life > lightning.maxLife) {
        this.lightnings.splice(i, 1);
        continue;
      }

      const alpha = 1 - lightning.life / lightning.maxLife;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 255, 200, 1)';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(lightning.points[0].x, lightning.points[0].y);
      for (let j = 1; j < lightning.points.length; j++) {
        ctx.lineTo(lightning.points[j].x, lightning.points[j].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.flashIntensity > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 200, 150, ${this.flashIntensity})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      this.flashIntensity *= 0.85;
    }
  }

  private drawEdgeDistortion(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    aggression: number,
    bass: number
  ): void {
    const intensity = (bass / 255) * aggression * 0.3;

    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.2})`;
    ctx.fillRect(0, 0, width, 5);
    ctx.fillRect(0, height - 5, width, 5);
    ctx.fillRect(0, 0, 5, height);
    ctx.fillRect(width - 5, 0, 5, height);
    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.flames = [];
    this.embers = [];
    this.lightnings = [];
    this.flashIntensity = 0;
  }
}
