/**
 * Rock/Energy Background Effect
 * High energy, aggressive, stage lighting vibes
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

export class RockEnergyEffect extends GenreBackgroundEffect {
  readonly id = 'rock-energy';
  readonly name = 'Rock/Energy';
  readonly parameters: EffectParameter[] = [
    slider('distortionLevel', 'Distortion Level', 0.6, 0, 1, 0.05),
    slider('flashIntensity', 'Flash Intensity', 0.7, 0, 1, 0.05),
    slider('smokeAmount', 'Smoke Amount', 0.4, 0, 1, 0.05),
    boolean('lightningEffect', 'Lightning Effect', true),
    slider('redTint', 'Red Tint', 0.5, 0, 1, 0.05),
  ];

  private flashTimer = 0;
  private lightningPoints: { x: number; y: number }[] = [];
  private smokeParticles: { x: number; y: number; size: number; opacity: number }[] = [];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const distortionLevel = this.getParameter<number>('distortionLevel');
    const flashIntensity = this.getParameter<number>('flashIntensity');
    const smokeAmount = this.getParameter<number>('smokeAmount');
    const lightningEffect = this.getParameter<boolean>('lightningEffect');
    const redTint = this.getParameter<number>('redTint');

    // Dark, aggressive base
    const redValue = Math.floor(20 + redTint * 30);
    this.drawGradient(
      ctx,
      width,
      height,
      [`rgb(${redValue}, 5, 10)`, '#0a0a0a', '#050505'],
      'radial'
    );

    // Smoke effect
    if (smokeAmount > 0) {
      this.updateAndDrawSmoke(ctx, width, height, smokeAmount, audioData.bass);
    }

    // Stage lighting beams
    this.drawStageLights(ctx, width, height, audioData, currentTime);

    // Bass-triggered flash
    if (audioData.bass > 200 && flashIntensity > 0) {
      this.flashTimer = 0.1;
    }

    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 100, 50, ${this.flashTimer * flashIntensity})`;
      ctx.fillRect(0, 0, width, height);
      this.flashTimer -= deltaTime;
    }

    // Lightning effect on high treble
    if (lightningEffect && audioData.treble > 180) {
      this.drawLightning(ctx, width, height);
    }

    // Distortion/chromatic aberration simulation
    if (distortionLevel > 0 && audioData.bass > 150) {
      this.drawDistortion(ctx, width, height, distortionLevel, audioData.bass);
    }

    // Edge glow
    this.drawEdgeGlow(ctx, width, height, audioData.mid, redTint);

    // Heavy vignette
    this.addVignette(ctx, width, height, 0.6);
  }

  private drawStageLights(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    audioData: { bass: number; mid: number; treble: number },
    time: number
  ): void {
    const numLights = 5;
    const colors = ['#ff0000', '#ff6600', '#ff0066', '#ffff00', '#ff3300'];

    for (let i = 0; i < numLights; i++) {
      const x = (width / (numLights + 1)) * (i + 1);
      const angle = Math.sin(time * 2 + i) * 0.3;
      const intensity = 0.1 + (audioData.mid / 255) * 0.2;

      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(angle);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, colors[i % colors.length]);
      gradient.addColorStop(0.3, `rgba(255, 100, 50, ${intensity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(50, 0);
      ctx.lineTo(150, height);
      ctx.lineTo(-150, height);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private updateAndDrawSmoke(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number,
    bass: number
  ): void {
    // Add new particles
    if (this.smokeParticles.length < 50 * amount) {
      this.smokeParticles.push({
        x: random(0, width),
        y: height + 50,
        size: random(100, 300),
        opacity: random(0.1, 0.3),
      });
    }

    // Update and draw
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];

      // Rise and drift
      p.y -= 0.5 + (bass / 255) * 2;
      p.x += Math.sin(p.y * 0.01) * 0.5;
      p.opacity -= 0.001;

      // Remove dead particles
      if (p.y < -p.size || p.opacity <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      // Draw smoke blob
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(50, 50, 50, ${p.opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLightning(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const startX = random(width * 0.2, width * 0.8);
    let x = startX;
    let y = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(x, y);

    while (y < height * 0.7) {
      x += random(-30, 30);
      y += random(20, 50);
      ctx.lineTo(x, y);

      // Branch
      if (Math.random() > 0.7) {
        const branchX = x + random(-50, 50);
        const branchY = y + random(30, 60);
        ctx.moveTo(x, y);
        ctx.lineTo(branchX, branchY);
        ctx.moveTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawDistortion(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    level: number,
    bass: number
  ): void {
    // Chromatic aberration simulation
    const offset = level * 5 * (bass / 255);

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255, 0, 0, ${level * 0.1})`;
    ctx.fillRect(-offset, 0, width, height);
    ctx.fillStyle = `rgba(0, 255, 255, ${level * 0.1})`;
    ctx.fillRect(offset, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawEdgeGlow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mid: number,
    redTint: number
  ): void {
    const intensity = 0.3 + (mid / 255) * 0.3;
    const red = Math.floor(255 * redTint);

    // Top and bottom glow
    const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2);
    topGradient.addColorStop(0, `rgba(${red}, 50, 0, ${intensity})`);
    topGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, height * 0.2);

    const bottomGradient = ctx.createLinearGradient(0, height, 0, height * 0.8);
    bottomGradient.addColorStop(0, `rgba(${red}, 50, 0, ${intensity})`);
    bottomGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
  }

  reset(): void {
    this.flashTimer = 0;
    this.smokeParticles = [];
  }
}
