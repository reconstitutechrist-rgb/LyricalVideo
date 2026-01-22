/**
 * Aurora Waves Background Effect
 * Northern lights flowing curtains with ethereal colors
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface AuroraCurtain {
  x: number;
  height: number;
  speed: number;
  hue: number;
  phase: number;
  width: number;
}

export class AuroraWavesEffect extends GenreBackgroundEffect {
  readonly id = 'aurora-waves';
  readonly name = 'Aurora Borealis';
  readonly parameters: EffectParameter[] = [
    slider('intensity', 'Aurora Intensity', 0.7, 0.3, 1, 0.1),
    slider('speed', 'Flow Speed', 0.5, 0.1, 1, 0.1),
    slider('curtainCount', 'Curtain Count', 5, 3, 10, 1),
    boolean('showStars', 'Show Stars', true),
    slider('colorVariation', 'Color Variation', 0.6, 0, 1, 0.1),
  ];

  private curtains: AuroraCurtain[] = [];
  private stars: { x: number; y: number; size: number; twinkle: number }[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const intensity = this.getParameter<number>('intensity');
    const speed = this.getParameter<number>('speed');
    const curtainCount = this.getParameter<number>('curtainCount');
    const showStars = this.getParameter<boolean>('showStars');
    const colorVariation = this.getParameter<number>('colorVariation');

    if (!this.initialized || this.curtains.length !== curtainCount) {
      this.initCurtains(width, height, curtainCount);
      this.initStars(width, height);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Night sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#000510');
    skyGradient.addColorStop(0.3, '#051025');
    skyGradient.addColorStop(0.6, '#0a1530');
    skyGradient.addColorStop(1, '#0f1a20');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    if (showStars) {
      for (const star of this.stars) {
        const twinkle = Math.sin(currentTime * star.twinkle + star.x) * 0.3 + 0.7;
        const alpha = twinkle * (0.5 + trebleBoost * 0.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw aurora curtains
    for (const curtain of this.curtains) {
      this.drawAuroraCurtain(
        ctx,
        curtain,
        width,
        height,
        currentTime,
        speed,
        intensity,
        colorVariation,
        bassBoost,
        midBoost
      );
    }

    // Add overall glow
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      height * 0.3,
      0,
      width / 2,
      height * 0.3,
      width * 0.6
    );
    const glowHue = (120 + currentTime * 10 * colorVariation) % 360;
    glowGradient.addColorStop(0, `hsla(${glowHue}, 70%, 50%, ${0.1 + bassBoost * 0.15})`);
    glowGradient.addColorStop(0.5, `hsla(${glowHue + 40}, 60%, 40%, ${0.05 + midBoost * 0.1})`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private initCurtains(width: number, height: number, count: number): void {
    this.curtains = [];
    for (let i = 0; i < count; i++) {
      this.curtains.push({
        x: (i / count) * width + random(-50, 50),
        height: random(height * 0.3, height * 0.7),
        speed: random(0.5, 1.5),
        hue: random(80, 180), // Green to cyan range
        phase: random(0, Math.PI * 2),
        width: random(100, 200),
      });
    }
  }

  private initStars(width: number, height: number): void {
    this.stars = [];
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: random(0, width),
        y: random(0, height * 0.6),
        size: random(0.5, 2),
        twinkle: random(2, 8),
      });
    }
  }

  private drawAuroraCurtain(
    ctx: CanvasRenderingContext2D,
    curtain: AuroraCurtain,
    width: number,
    height: number,
    time: number,
    speed: number,
    intensity: number,
    colorVariation: number,
    bassBoost: number,
    midBoost: number
  ): void {
    const points = 30;
    const waveTime = time * speed * curtain.speed;

    // Create curtain path
    ctx.beginPath();

    const baseY = height * 0.1;
    const curtainHeight = curtain.height * (1 + bassBoost * 0.3) * intensity;

    // Top edge (straight)
    ctx.moveTo(curtain.x - curtain.width / 2, baseY);

    // Right edge with wave
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const wave = Math.sin(t * Math.PI * 3 + waveTime + curtain.phase) * 30;
      const x = curtain.x + curtain.width / 2 + wave * (1 + midBoost * 0.5);
      const y = baseY + t * curtainHeight;
      ctx.lineTo(x, y);
    }

    // Bottom edge (with fade)
    ctx.lineTo(curtain.x - curtain.width / 2, baseY + curtainHeight);

    // Left edge with wave
    for (let i = points; i >= 0; i--) {
      const t = i / points;
      const wave = Math.sin(t * Math.PI * 3 + waveTime + curtain.phase + 0.5) * 30;
      const x = curtain.x - curtain.width / 2 + wave * (1 + midBoost * 0.5);
      const y = baseY + t * curtainHeight;
      ctx.lineTo(x, y);
    }

    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(curtain.x, baseY, curtain.x, baseY + curtainHeight);

    const hue = (curtain.hue + time * 20 * colorVariation) % 360;
    const hue2 = (hue + 60) % 360;

    gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${0.7 * intensity})`);
    gradient.addColorStop(0.3, `hsla(${hue}, 70%, 50%, ${0.5 * intensity})`);
    gradient.addColorStop(0.6, `hsla(${hue2}, 60%, 40%, ${0.3 * intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add bright edge
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${0.3 + bassBoost * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  reset(): void {
    this.initialized = false;
    this.curtains = [];
    this.stars = [];
  }
}
