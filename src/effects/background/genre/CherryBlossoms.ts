/**
 * Cherry Blossoms Background Effect
 * Falling petals with soft pink aesthetic and serene atmosphere
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Petal {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  hue: number;
}

export class CherryBlossomsEffect extends GenreBackgroundEffect {
  readonly id = 'cherry-blossoms';
  readonly name = 'Cherry Blossoms';
  readonly parameters: EffectParameter[] = [
    slider('petalCount', 'Petal Count', 50, 20, 100, 5),
    slider('fallSpeed', 'Fall Speed', 0.5, 0.2, 1, 0.1),
    slider('windStrength', 'Wind Strength', 0.5, 0, 1, 0.1),
    boolean('showBranches', 'Show Branches', true),
    slider('bloomIntensity', 'Bloom Intensity', 0.7, 0, 1, 0.1),
  ];

  private petals: Petal[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const petalCount = this.getParameter<number>('petalCount');
    const fallSpeed = this.getParameter<number>('fallSpeed');
    const windStrength = this.getParameter<number>('windStrength');
    const showBranches = this.getParameter<boolean>('showBranches');
    const bloomIntensity = this.getParameter<number>('bloomIntensity');

    if (!this.initialized || this.petals.length !== petalCount) {
      this.initPetals(width, height, petalCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Soft gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#fce4ec');
    skyGradient.addColorStop(0.3, '#f8bbd9');
    skyGradient.addColorStop(0.6, '#f5f5f5');
    skyGradient.addColorStop(1, '#fff8e1');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw branches
    if (showBranches) {
      this.drawBranches(ctx, width, height, currentTime, bassBoost);
    }

    // Draw clustered blossoms on branches
    if (showBranches) {
      this.drawBranchBlossoms(ctx, width, height, bloomIntensity, midBoost);
    }

    // Update and draw falling petals
    this.updateAndDrawPetals(
      ctx,
      width,
      height,
      currentTime,
      fallSpeed,
      windStrength,
      bassBoost,
      trebleBoost
    );

    // Soft bloom overlay
    this.drawBloomOverlay(ctx, width, height, bloomIntensity, midBoost);
  }

  private initPetals(width: number, height: number, count: number): void {
    this.petals = [];
    for (let i = 0; i < count; i++) {
      this.petals.push({
        x: random(0, width),
        y: random(-height * 0.2, height),
        size: random(8, 18),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.05, 0.05),
        fallSpeed: random(0.8, 1.5),
        swayPhase: random(0, Math.PI * 2),
        swaySpeed: random(1, 3),
        hue: random(340, 360), // Pink range
      });
    }
  }

  private drawBranches(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    bassBoost: number
  ): void {
    // Main branches
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Left branch
    ctx.beginPath();
    ctx.moveTo(-50, height * 0.2);
    const sway = Math.sin(time * 0.5) * 5 * (1 + bassBoost);
    ctx.bezierCurveTo(
      width * 0.2,
      height * 0.15 + sway,
      width * 0.35,
      height * 0.25 + sway,
      width * 0.45,
      height * 0.2 + sway
    );
    ctx.stroke();

    // Sub-branches
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.18 + sway * 0.5);
    ctx.bezierCurveTo(
      width * 0.28,
      height * 0.12,
      width * 0.32,
      height * 0.08,
      width * 0.35,
      height * 0.05
    );
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.22 + sway * 0.3);
    ctx.bezierCurveTo(
      width * 0.38,
      height * 0.18,
      width * 0.42,
      height * 0.15,
      width * 0.48,
      height * 0.12
    );
    ctx.stroke();

    // Right branch
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width + 50, height * 0.3);
    ctx.bezierCurveTo(
      width * 0.8,
      height * 0.28 - sway,
      width * 0.65,
      height * 0.35 - sway,
      width * 0.55,
      height * 0.32 - sway
    );
    ctx.stroke();
  }

  private drawBranchBlossoms(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    midBoost: number
  ): void {
    const clusters = [
      { x: width * 0.2, y: height * 0.17, count: 8 },
      { x: width * 0.3, y: height * 0.12, count: 6 },
      { x: width * 0.38, y: height * 0.2, count: 10 },
      { x: width * 0.45, y: height * 0.18, count: 7 },
      { x: width * 0.7, y: height * 0.3, count: 9 },
      { x: width * 0.6, y: height * 0.33, count: 5 },
    ];

    for (const cluster of clusters) {
      for (let i = 0; i < cluster.count; i++) {
        const angle = (i / cluster.count) * Math.PI * 2;
        const dist = random(10, 30) * intensity;
        const x = cluster.x + Math.cos(angle) * dist;
        const y = cluster.y + Math.sin(angle) * dist;
        const size = random(6, 12) * (1 + midBoost * 0.3);

        // Blossom
        this.drawBlossom(ctx, x, y, size, intensity);
      }
    }
  }

  private drawBlossom(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    intensity: number
  ): void {
    const petalCount = 5;

    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.ellipse(0, -size * 0.8, size * 0.4, size * 0.7, 0, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(0, -size * 0.6, 0, 0, -size * 0.8, size);
      gradient.addColorStop(0, `rgba(255, 200, 210, ${0.9 * intensity})`);
      gradient.addColorStop(0.5, `rgba(255, 180, 200, ${0.8 * intensity})`);
      gradient.addColorStop(1, `rgba(255, 150, 180, ${0.6 * intensity})`);

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();

    ctx.restore();
  }

  private updateAndDrawPetals(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    wind: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    for (const petal of this.petals) {
      // Update position
      petal.y += petal.fallSpeed * speed * 2 * (1 + bassBoost * 0.3);
      petal.x += Math.sin(time * petal.swaySpeed + petal.swayPhase) * wind * 2;
      petal.x += wind * 0.5; // Constant drift
      petal.rotation += petal.rotationSpeed;

      // Reset if off screen
      if (petal.y > height + petal.size) {
        petal.y = -petal.size * 2;
        petal.x = random(0, width);
      }
      if (petal.x > width + petal.size) {
        petal.x = -petal.size;
      }
      if (petal.x < -petal.size) {
        petal.x = width + petal.size;
      }

      // Draw petal
      const size = petal.size * (1 + trebleBoost * 0.2);

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);

      // Petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.6, size, 0, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, `hsla(${petal.hue}, 100%, 92%, 0.9)`);
      gradient.addColorStop(0.5, `hsla(${petal.hue}, 90%, 85%, 0.8)`);
      gradient.addColorStop(1, `hsla(${petal.hue}, 80%, 80%, 0.6)`);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Subtle edge
      ctx.strokeStyle = `hsla(${petal.hue}, 70%, 75%, 0.3)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawBloomOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    midBoost: number
  ): void {
    // Soft pink bloom overlay
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 3,
      0,
      width / 2,
      height / 3,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, `rgba(255, 200, 220, ${0.1 * intensity * (1 + midBoost * 0.5)})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 200, ${0.05 * intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Warm light from corner
    const sunGradient = ctx.createRadialGradient(
      width * 0.9,
      height * 0.1,
      0,
      width * 0.9,
      height * 0.1,
      width * 0.5
    );
    sunGradient.addColorStop(0, `rgba(255, 245, 200, ${0.2 * intensity})`);
    sunGradient.addColorStop(0.3, `rgba(255, 230, 180, ${0.1 * intensity})`);
    sunGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.initialized = false;
    this.petals = [];
  }
}
