/**
 * Particle Vortex Background Effect
 * Swirling particles into center, spiral galaxy visualization
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface VortexParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  hue: number;
  trail: { x: number; y: number }[];
}

export class ParticleVortexEffect extends GenreBackgroundEffect {
  readonly id = 'particle-vortex';
  readonly name = 'Particle Vortex';
  readonly parameters: EffectParameter[] = [
    slider('particleCount', 'Particle Count', 100, 50, 200, 10),
    slider('rotationSpeed', 'Rotation Speed', 0.5, 0.1, 1, 0.1),
    slider('pullStrength', 'Pull Strength', 0.5, 0.1, 1, 0.1),
    boolean('trails', 'Show Trails', true),
    boolean('reverseOnBeat', 'Reverse on Beat', true),
  ];

  private particles: VortexParticle[] = [];
  private rotationDirection = 1;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const particleCount = this.getParameter<number>('particleCount');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const pullStrength = this.getParameter<number>('pullStrength');
    const trails = this.getParameter<boolean>('trails');
    const reverseOnBeat = this.getParameter<boolean>('reverseOnBeat');

    if (!this.initialized || this.particles.length !== particleCount) {
      this.initParticles(width, height, particleCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Reverse direction on beat
    if (reverseOnBeat && isBeat && random(0, 1) < 0.3) {
      this.rotationDirection *= -1;
    }

    // Dark space background
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, '#0f0520');
    bgGradient.addColorStop(0.3, '#080315');
    bgGradient.addColorStop(1, '#02010a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.max(width, height) * 0.6;

    // Update and draw particles
    for (const particle of this.particles) {
      // Rotate around center
      particle.angle +=
        rotationSpeed * 0.02 * this.rotationDirection * (1 + bassBoost * 0.5) * particle.speed;

      // Pull towards center (or push on bass hits)
      const pullForce = pullStrength * 0.5 * (bassBoost > 0.7 ? -1 : 1);
      particle.distance -= pullForce * particle.speed;

      // Reset if too close or too far
      if (particle.distance < 20) {
        particle.distance = maxDistance;
        particle.angle = random(0, Math.PI * 2);
        particle.hue = random(200, 320);
      }
      if (particle.distance > maxDistance) {
        particle.distance = 20 + random(0, 50);
      }

      // Calculate position
      const x = centerX + Math.cos(particle.angle) * particle.distance;
      const y = centerY + Math.sin(particle.angle) * particle.distance;

      // Update trail
      if (trails) {
        particle.trail.push({ x, y });
        if (particle.trail.length > 15) {
          particle.trail.shift();
        }

        // Draw trail
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        for (let i = 1; i < particle.trail.length; i++) {
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        const trailAlpha = 0.1 + (1 - particle.distance / maxDistance) * 0.3;
        ctx.strokeStyle = `hsla(${particle.hue}, 80%, 60%, ${trailAlpha})`;
        ctx.lineWidth = particle.size * 0.5;
        ctx.stroke();
      }

      // Draw particle
      const distanceRatio = 1 - particle.distance / maxDistance;
      const size = particle.size * (1 + distanceRatio * 2 + bassBoost);
      const alpha = 0.3 + distanceRatio * 0.7 + midBoost * 0.2;

      // Particle glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      glowGradient.addColorStop(0, `hsla(${particle.hue}, 90%, 70%, ${alpha})`);
      glowGradient.addColorStop(0.3, `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.5})`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.fillStyle = `hsla(${particle.hue}, 100%, 80%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central vortex core
    this.drawVortexCore(ctx, centerX, centerY, currentTime, bassBoost, trebleBoost);

    // Spiral arms overlay
    this.drawSpiralArms(ctx, centerX, centerY, maxDistance, currentTime, rotationSpeed, midBoost);
  }

  private initParticles(width: number, height: number, count: number): void {
    this.particles = [];
    const maxDistance = Math.max(width, height) * 0.6;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: random(0, Math.PI * 2),
        distance: random(50, maxDistance),
        speed: random(0.5, 1.5),
        size: random(2, 5),
        hue: random(200, 320),
        trail: [],
      });
    }
  }

  private drawVortexCore(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    const coreSize = 40 + bassBoost * 30;

    // Outer glow
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, coreSize * 2);
    outerGlow.addColorStop(0, `rgba(150, 50, 200, ${0.4 + bassBoost * 0.3})`);
    outerGlow.addColorStop(0.5, `rgba(100, 0, 150, ${0.2 + bassBoost * 0.2})`);
    outerGlow.addColorStop(1, 'transparent');

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, coreSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core with rotation
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 2);

    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 + trebleBoost * 0.1})`);
    coreGradient.addColorStop(0.2, `rgba(200, 100, 255, ${0.7 + bassBoost * 0.2})`);
    coreGradient.addColorStop(0.5, `rgba(100, 50, 200, 0.4)`);
    coreGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawSpiralArms(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    time: number,
    speed: number,
    midBoost: number
  ): void {
    const armCount = 2;
    const rotation = time * speed * this.rotationDirection;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    for (let arm = 0; arm < armCount; arm++) {
      const armAngle = (arm / armCount) * Math.PI * 2;

      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const spiralAngle = armAngle + t * Math.PI * 4;
        const radius = 30 + t * maxRadius * 0.8;
        const x = Math.cos(spiralAngle) * radius;
        const y = Math.sin(spiralAngle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = `rgba(150, 100, 200, ${0.1 + midBoost * 0.1})`;
      ctx.lineWidth = 20 + midBoost * 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.particles = [];
    this.rotationDirection = 1;
  }
}
