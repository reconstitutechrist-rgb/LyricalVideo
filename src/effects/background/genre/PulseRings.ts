/**
 * Pulse Rings Background Effect
 * Expanding circles synced to beat, ripple visualization
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  hue: number;
  thickness: number;
  speed: number;
  alpha: number;
}

export class PulseRingsEffect extends GenreBackgroundEffect {
  readonly id = 'pulse-rings';
  readonly name = 'Pulse Rings';
  readonly parameters: EffectParameter[] = [
    slider('ringSpeed', 'Ring Speed', 0.6, 0.2, 1, 0.1),
    slider('maxRings', 'Max Rings', 10, 5, 20, 1),
    slider('thickness', 'Ring Thickness', 0.5, 0.1, 1, 0.1),
    boolean('multiColor', 'Multi Color', true),
    boolean('randomPosition', 'Random Position', false),
  ];

  private rings: Ring[] = [];
  private lastBeatTime = 0;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const ringSpeed = this.getParameter<number>('ringSpeed');
    const maxRings = this.getParameter<number>('maxRings');
    const thickness = this.getParameter<number>('thickness');
    const multiColor = this.getParameter<boolean>('multiColor');
    const randomPosition = this.getParameter<boolean>('randomPosition');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const isBeat = audioData.isBeat;

    // Dark background
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, '#0a0520');
    bgGradient.addColorStop(0.5, '#050210');
    bgGradient.addColorStop(1, '#000005');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Spawn new ring on beat
    if (isBeat && currentTime - this.lastBeatTime > 0.15 && this.rings.length < maxRings) {
      const centerX = randomPosition ? random(width * 0.2, width * 0.8) : width / 2;
      const centerY = randomPosition ? random(height * 0.2, height * 0.8) : height / 2;

      this.rings.push({
        x: centerX,
        y: centerY,
        radius: 10 + bassBoost * 30,
        maxRadius: Math.max(width, height) * 0.8,
        hue: multiColor ? random(180, 300) : 260,
        thickness: (10 + thickness * 20) * (1 + bassBoost * 0.5),
        speed: (3 + ringSpeed * 5) * (1 + bassBoost * 0.3),
        alpha: 1,
      });

      this.lastBeatTime = currentTime;
    }

    // Update and draw rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];

      // Expand ring
      ring.radius += ring.speed * (1 + bassBoost * 0.5);
      ring.alpha = 1 - ring.radius / ring.maxRadius;

      // Remove if fully expanded
      if (ring.radius >= ring.maxRadius || ring.alpha <= 0) {
        this.rings.splice(i, 1);
        continue;
      }

      // Draw ring glow
      const glowRadius = ring.thickness * 3;
      const gradient = ctx.createRadialGradient(
        ring.x,
        ring.y,
        Math.max(0, ring.radius - glowRadius),
        ring.x,
        ring.y,
        ring.radius + glowRadius
      );

      const hue = ring.hue + ((currentTime * 20) % 60);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, `hsla(${hue}, 80%, 50%, ${ring.alpha * 0.2})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${ring.alpha * 0.6})`);
      gradient.addColorStop(0.7, `hsla(${hue}, 80%, 50%, ${ring.alpha * 0.2})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius + glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw main ring
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${ring.alpha})`;
      ctx.lineWidth = ring.thickness * ring.alpha;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner bright edge
      ctx.strokeStyle = `hsla(${hue}, 100%, 90%, ${ring.alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius - ring.thickness / 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Central pulsing core
    const coreSize = 30 + bassBoost * 50 + midBoost * 30;
    const coreGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      coreSize
    );

    const coreHue = multiColor ? (currentTime * 30) % 360 : 260;
    coreGradient.addColorStop(0, `hsla(${coreHue}, 100%, 80%, ${0.6 + bassBoost * 0.4})`);
    coreGradient.addColorStop(0.3, `hsla(${coreHue}, 90%, 60%, ${0.4 + bassBoost * 0.3})`);
    coreGradient.addColorStop(0.6, `hsla(${coreHue}, 80%, 50%, 0.2)`);
    coreGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Particle dust
    this.drawParticles(ctx, width, height, currentTime, midBoost, multiColor);
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    midBoost: number,
    multiColor: boolean
  ): void {
    const particleCount = 30;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * 0.2;
      const distance = 100 + Math.sin(time * 2 + i) * 50 + midBoost * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 2 + Math.sin(time * 3 + i * 0.5) * 1.5;

      const hue = multiColor ? (i * 10 + time * 20) % 360 : 260;
      ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${0.3 + midBoost * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  reset(): void {
    this.rings = [];
    this.lastBeatTime = 0;
  }
}
