/**
 * Ambient/Space Background Effect
 * Ethereal space environment for ambient/chillout music
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number; // 0-2 for parallax
}

interface NebulaCloud {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  hue: number;
  opacity: number;
  rotation: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
}

export class AmbientSpaceEffect extends GenreBackgroundEffect {
  readonly id = 'ambient-space';
  readonly name = 'Ambient/Space';
  readonly parameters: EffectParameter[] = [
    slider('starDensity', 'Star Density', 500, 100, 2000, 50),
    slider('nebulaOpacity', 'Nebula Opacity', 0.5, 0, 1, 0.05),
    slider('shootingStarRate', 'Shooting Stars', 0.02, 0, 0.1, 0.01),
    boolean('auroraEnabled', 'Aurora Effect', true),
    slider('driftSpeed', 'Drift Speed', 0.3, 0.1, 1, 0.05),
  ];

  private stars: Star[] = [];
  private nebulaClouds: NebulaCloud[] = [];
  private shootingStars: ShootingStar[] = [];
  private initialized = false;
  private driftOffset = 0;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const starDensity = this.getParameter<number>('starDensity');
    const nebulaOpacity = this.getParameter<number>('nebulaOpacity');
    const shootingStarRate = this.getParameter<number>('shootingStarRate');
    const auroraEnabled = this.getParameter<boolean>('auroraEnabled');
    const driftSpeed = this.getParameter<number>('driftSpeed');

    // Initialize
    if (!this.initialized || this.stars.length !== starDensity) {
      this.initStars(width, height, starDensity);
      this.initNebula(width, height);
      this.initialized = true;
    }

    // Update drift
    this.driftOffset += deltaTime * driftSpeed * 10;

    // Deep space background
    this.drawSpaceBackground(ctx, width, height);

    // Nebula clouds
    this.drawNebula(ctx, width, height, nebulaOpacity, audioData.bass);

    // Aurora effect
    if (auroraEnabled) {
      this.drawAurora(ctx, width, height, currentTime, audioData.mid);
    }

    // Stars with parallax
    this.drawStars(ctx, width, height, currentTime, audioData.treble);

    // Shooting stars
    if (Math.random() < shootingStarRate) {
      this.addShootingStar(width, height);
    }
    this.updateAndDrawShootingStars(ctx, deltaTime);

    // Subtle cosmic dust overlay
    this.drawCosmicDust(ctx, width, height, audioData.energy);
  }

  private initStars(width: number, height: number, count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: random(0, width),
        y: random(0, height),
        size: random(0.5, 2.5),
        brightness: random(0.3, 1),
        twinkleSpeed: random(0.5, 3),
        twinklePhase: random(0, Math.PI * 2),
        layer: Math.floor(random(0, 3)),
      });
    }
  }

  private initNebula(width: number, height: number): void {
    this.nebulaClouds = [];
    const cloudCount = 5;

    const hues = [280, 200, 320, 180, 260]; // Purples, blues, magentas

    for (let i = 0; i < cloudCount; i++) {
      this.nebulaClouds.push({
        x: random(width * 0.1, width * 0.9),
        y: random(height * 0.1, height * 0.9),
        radiusX: random(150, 400),
        radiusY: random(100, 300),
        hue: hues[i % hues.length],
        opacity: random(0.1, 0.3),
        rotation: random(0, Math.PI * 2),
      });
    }
  }

  private drawSpaceBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Deep space gradient
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );
    gradient.addColorStop(0, '#0a0a15');
    gradient.addColorStop(0.5, '#050510');
    gradient.addColorStop(1, '#000005');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawNebula(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opacity: number,
    bass: number
  ): void {
    const bassPulse = 1 + (bass / 255) * 0.2;

    for (const cloud of this.nebulaClouds) {
      ctx.save();
      ctx.translate(cloud.x, cloud.y);
      ctx.rotate(cloud.rotation);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radiusX * bassPulse);

      gradient.addColorStop(0, `hsla(${cloud.hue}, 70%, 50%, ${cloud.opacity * opacity})`);
      gradient.addColorStop(0.4, `hsla(${cloud.hue}, 60%, 40%, ${cloud.opacity * opacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, cloud.radiusX * bassPulse, cloud.radiusY * bassPulse, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawAurora(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    mid: number
  ): void {
    const intensity = 0.1 + (mid / 255) * 0.15;

    ctx.save();

    // Multiple aurora bands
    for (let band = 0; band < 3; band++) {
      const baseY = height * 0.3 + band * 40;
      const hue = 120 + band * 30 + Math.sin(time * 0.2) * 20; // Green to cyan

      ctx.beginPath();
      ctx.moveTo(0, baseY);

      for (let x = 0; x <= width; x += 10) {
        const y =
          baseY +
          Math.sin(x * 0.01 + time * 0.5 + band) * 30 +
          Math.sin(x * 0.02 + time * 0.3) * 20;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();

      const auroraGradient = ctx.createLinearGradient(0, 0, 0, baseY + 100);
      auroraGradient.addColorStop(0, 'transparent');
      auroraGradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${intensity})`);
      auroraGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = auroraGradient;
      ctx.fill();
    }

    ctx.restore();
  }

  private drawStars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    treble: number
  ): void {
    const trebleBoost = 1 + (treble / 255) * 0.5;

    for (const star of this.stars) {
      // Parallax drift
      const parallaxSpeed = (star.layer + 1) * 0.2;
      const driftX = (this.driftOffset * parallaxSpeed) % width;
      const starX = (star.x - driftX + width) % width;

      // Twinkle effect
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
      const brightness = star.brightness * twinkle * trebleBoost;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = star.size * 2;

      ctx.beginPath();
      ctx.arc(starX, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private addShootingStar(width: number, height: number): void {
    const startX = random(0, width);
    const startY = random(0, height * 0.3);
    const angle = random(Math.PI * 0.1, Math.PI * 0.4);
    const speed = random(15, 25);

    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: random(50, 150),
      life: 0,
      maxLife: random(30, 60),
    });
  }

  private updateAndDrawShootingStars(ctx: CanvasRenderingContext2D, deltaTime: number): void {
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i];
      star.x += star.vx;
      star.y += star.vy;
      star.life += deltaTime * 60;

      if (star.life > star.maxLife) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      const progress = star.life / star.maxLife;
      const alpha = 1 - progress;

      // Calculate tail position
      const tailX = star.x - (star.vx / Math.sqrt(star.vx ** 2 + star.vy ** 2)) * star.length;
      const tailY = star.y - (star.vy / Math.sqrt(star.vx ** 2 + star.vy ** 2)) * star.length;

      ctx.save();

      // Trail gradient
      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();

      // Head glow
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawCosmicDust(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    energy: number
  ): void {
    const intensity = 0.02 + energy * 0.02;

    ctx.save();
    ctx.globalAlpha = intensity;

    // Subtle dust particles using noise-like pattern
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 0.7 + this.driftOffset * 0.01) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 0.5 + this.driftOffset * 0.008) * 0.5 + 0.5) * height;

      ctx.fillStyle = 'rgba(200, 180, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.stars = [];
    this.nebulaClouds = [];
    this.shootingStars = [];
    this.driftOffset = 0;
  }
}
