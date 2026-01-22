/**
 * Electric Storm Background Effect
 * Lightning bolts, rain, dark clouds, dramatic atmosphere
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
}

interface Lightning {
  startX: number;
  active: boolean;
  timer: number;
  branches: { x: number; y: number }[][];
}

export class StormElectricEffect extends GenreBackgroundEffect {
  readonly id = 'storm-electric';
  readonly name = 'Electric Storm';
  readonly parameters: EffectParameter[] = [
    slider('rainIntensity', 'Rain Intensity', 0.7, 0, 1, 0.1),
    slider('lightningFrequency', 'Lightning Frequency', 0.5, 0, 1, 0.1),
    slider('cloudDarkness', 'Cloud Darkness', 0.6, 0.3, 1, 0.1),
    boolean('windEffect', 'Wind Effect', true),
    slider('flashIntensity', 'Flash Intensity', 0.8, 0, 1, 0.1),
  ];

  private raindrops: Raindrop[] = [];
  private lightning: Lightning = { startX: 0, active: false, timer: 0, branches: [] };
  private flashTimer = 0;
  private lastBeat = 0;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const rainIntensity = this.getParameter<number>('rainIntensity');
    const lightningFrequency = this.getParameter<number>('lightningFrequency');
    const cloudDarkness = this.getParameter<number>('cloudDarkness');
    const windEffect = this.getParameter<boolean>('windEffect');
    const flashIntensity = this.getParameter<number>('flashIntensity');

    if (!this.initialized) {
      this.initRain(width, height, rainIntensity);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const isBeat = audioData.isBeat;

    // Trigger lightning on beat
    if (isBeat && currentTime - this.lastBeat > 0.5 && random(0, 1) < lightningFrequency) {
      this.triggerLightning(width, height);
      this.flashTimer = 0.3;
      this.lastBeat = currentTime;
    }

    // Storm sky gradient
    const darkness = cloudDarkness * (0.8 + bassBoost * 0.2);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(
      0,
      `rgb(${20 * (1 - darkness)}, ${25 * (1 - darkness)}, ${40 * (1 - darkness)})`
    );
    skyGradient.addColorStop(
      0.4,
      `rgb(${30 * (1 - darkness)}, ${35 * (1 - darkness)}, ${50 * (1 - darkness)})`
    );
    skyGradient.addColorStop(
      1,
      `rgb(${15 * (1 - darkness)}, ${20 * (1 - darkness)}, ${30 * (1 - darkness)})`
    );
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw clouds
    this.drawClouds(ctx, width, height, currentTime, cloudDarkness, midBoost);

    // Lightning flash background
    if (this.flashTimer > 0) {
      const flashAlpha = this.flashTimer * flashIntensity;
      ctx.fillStyle = `rgba(200, 200, 255, ${flashAlpha * 0.4})`;
      ctx.fillRect(0, 0, width, height);
      this.flashTimer -= 0.016;
    }

    // Draw lightning
    if (this.lightning.active) {
      this.drawLightning(ctx, flashIntensity);
      this.lightning.timer -= 0.016;
      if (this.lightning.timer <= 0) {
        this.lightning.active = false;
      }
    }

    // Update and draw rain
    this.updateAndDrawRain(ctx, width, height, rainIntensity, windEffect, bassBoost);

    // Ground reflection
    this.drawGroundReflection(ctx, width, height, this.flashTimer > 0, flashIntensity);
  }

  private initRain(width: number, height: number, intensity: number): void {
    this.raindrops = [];
    const count = Math.floor(200 * intensity);
    for (let i = 0; i < count; i++) {
      this.raindrops.push({
        x: random(0, width),
        y: random(0, height),
        length: random(15, 30),
        speed: random(15, 25),
      });
    }
  }

  private drawClouds(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    darkness: number,
    midBoost: number
  ): void {
    const cloudCount = 8;

    for (let i = 0; i < cloudCount; i++) {
      const baseX = (i / cloudCount) * width * 1.5 - width * 0.25;
      const moveX = Math.sin(time * 0.1 + i) * 30;
      const x = baseX + moveX;
      const y = height * 0.1 + (i % 3) * height * 0.1;

      const cloudWidth = random(200, 400);
      const cloudHeight = random(60, 120);

      // Cloud gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, cloudWidth / 2);
      const baseColor = 40 - darkness * 30;
      gradient.addColorStop(
        0,
        `rgba(${baseColor + 20}, ${baseColor + 25}, ${baseColor + 40}, ${0.8 + midBoost * 0.2})`
      );
      gradient.addColorStop(0.5, `rgba(${baseColor}, ${baseColor + 5}, ${baseColor + 20}, 0.6)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, cloudWidth / 2, cloudHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private triggerLightning(width: number, height: number): void {
    this.lightning.startX = random(width * 0.2, width * 0.8);
    this.lightning.active = true;
    this.lightning.timer = 0.2;
    this.lightning.branches = [];

    // Generate main bolt with branches
    const mainBolt = this.generateBolt(this.lightning.startX, 0, height * 0.8);
    this.lightning.branches.push(mainBolt);

    // Add side branches
    const branchCount = Math.floor(random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      const startIdx = Math.floor(random(mainBolt.length * 0.2, mainBolt.length * 0.7));
      const startPoint = mainBolt[startIdx];
      const branch = this.generateBolt(
        startPoint.x,
        startPoint.y,
        startPoint.y + height * 0.2 + random(0, height * 0.2)
      );
      this.lightning.branches.push(branch);
    }
  }

  private generateBolt(startX: number, startY: number, endY: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    const segments = 15;
    const yStep = (endY - startY) / segments;

    for (let i = 0; i <= segments; i++) {
      points.push({ x, y });
      x += random(-30, 30);
      y += yStep;
    }

    return points;
  }

  private drawLightning(ctx: CanvasRenderingContext2D, intensity: number): void {
    const alpha = this.lightning.timer * 5 * intensity;

    for (const branch of this.lightning.branches) {
      if (branch.length < 2) continue;

      // Glow
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha * 0.3})`;
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(branch[0].x, branch[0].y);
      for (let i = 1; i < branch.length; i++) {
        ctx.lineTo(branch[i].x, branch[i].y);
      }
      ctx.stroke();

      // Core
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(branch[0].x, branch[0].y);
      for (let i = 1; i < branch.length; i++) {
        ctx.lineTo(branch[i].x, branch[i].y);
      }
      ctx.stroke();
    }
  }

  private updateAndDrawRain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    wind: boolean,
    bassBoost: number
  ): void {
    const windAngle = wind ? 0.3 : 0;
    const speedMultiplier = 1 + bassBoost * 0.3;

    ctx.strokeStyle = `rgba(150, 160, 180, ${0.3 + intensity * 0.3})`;
    ctx.lineWidth = 1;

    for (const drop of this.raindrops) {
      // Move
      drop.y += drop.speed * speedMultiplier;
      if (wind) {
        drop.x += drop.speed * 0.3;
      }

      // Reset
      if (drop.y > height) {
        drop.y = -drop.length;
        drop.x = random(0, width);
      }
      if (drop.x > width) {
        drop.x = 0;
      }

      // Draw
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(
        drop.x + Math.sin(windAngle) * drop.length,
        drop.y + Math.cos(windAngle) * drop.length
      );
      ctx.stroke();
    }
  }

  private drawGroundReflection(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    flash: boolean,
    intensity: number
  ): void {
    const reflectionY = height * 0.85;
    const gradient = ctx.createLinearGradient(0, reflectionY, 0, height);

    if (flash) {
      gradient.addColorStop(0, `rgba(100, 100, 120, ${0.1 + intensity * 0.2})`);
      gradient.addColorStop(0.5, `rgba(60, 60, 80, ${0.2 + intensity * 0.1})`);
    } else {
      gradient.addColorStop(0, 'rgba(30, 35, 50, 0.3)');
      gradient.addColorStop(0.5, 'rgba(20, 25, 40, 0.5)');
    }
    gradient.addColorStop(1, 'rgba(10, 15, 25, 0.8)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, reflectionY, width, height - reflectionY);
  }

  reset(): void {
    this.initialized = false;
    this.raindrops = [];
    this.lightning = { startX: 0, active: false, timer: 0, branches: [] };
    this.flashTimer = 0;
    this.lastBeat = 0;
  }
}
