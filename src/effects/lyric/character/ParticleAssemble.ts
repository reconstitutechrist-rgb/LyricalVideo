/**
 * Particle Assemble Effect
 * Text forms from scattered particles that converge into letter shapes
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, random, ExtendedEasings } from '../../utils/MathUtils';

interface Particle {
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  size: number;
  delay: number;
}

export class ParticleAssembleEffect extends CharacterLyricEffect {
  readonly id = 'particle-assemble';
  readonly name = 'Particle Assemble';
  readonly parameters: EffectParameter[] = [
    slider('particleDensity', 'Particle Density', 80, 30, 200, 10),
    slider('assembleTime', 'Assemble Time', 1.5, 0.5, 3, 0.1, 's'),
    slider('particleSize', 'Particle Size', 2, 1, 5, 0.5),
    slider('trailLength', 'Trail Length', 5, 0, 20, 1),
    boolean('disperseOnBeat', 'Disperse on Beat', true),
  ];

  private particles: Map<number, Particle[]> = new Map();
  private initialized = false;
  private lastBeatTime = 0;
  private disperseAmount = 0;

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, audioData, currentTime, width, height } =
      context;
    const characters = this.getCharacters(context);

    const particleDensity = this.getParameter<number>('particleDensity');
    const _assembleTime = this.getParameter<number>('assembleTime');
    const particleSize = this.getParameter<number>('particleSize');
    const trailLength = this.getParameter<number>('trailLength');
    const disperseOnBeat = this.getParameter<boolean>('disperseOnBeat');

    // Initialize particles for each character
    if (!this.initialized) {
      this.initializeParticles(characters, width, height, particleDensity);
      this.initialized = true;
    }

    // Handle beat dispersion
    if (disperseOnBeat && audioData?.isBeat && currentTime - this.lastBeatTime > 0.3) {
      this.disperseAmount = 0.3;
      this.lastBeatTime = currentTime;
    }
    this.disperseAmount *= 0.95; // Decay dispersion

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;

    for (const char of characters) {
      const charParticles = this.particles.get(char.index);
      if (!charParticles) continue;

      const charProgress = clamp(progress * (1 + char.index * 0.1), 0, 1);
      const _eased = ExtendedEasings.easeOut(charProgress);

      for (const particle of charParticles) {
        // Calculate particle position
        const particleProgress = clamp(
          (charProgress - particle.delay) / (1 - particle.delay),
          0,
          1
        );
        const particleEased = ExtendedEasings.easeOut(particleProgress);

        // Interpolate from start to target
        let x = particle.startX + (particle.targetX - particle.startX) * particleEased;
        let y = particle.startY + (particle.targetY - particle.startY) * particleEased;

        // Add dispersion offset
        if (this.disperseAmount > 0) {
          x += (Math.random() - 0.5) * this.disperseAmount * 100;
          y += (Math.random() - 0.5) * this.disperseAmount * 100;
        }

        // Draw trail
        if (trailLength > 0 && particleProgress < 1) {
          const trailOpacity = 0.3 * (1 - particleProgress);
          ctx.save();
          ctx.strokeStyle = color;
          ctx.globalAlpha = trailOpacity;
          ctx.lineWidth = particleSize * 0.5;
          ctx.beginPath();

          for (let t = 0; t < trailLength; t++) {
            const trailProgress = Math.max(0, particleProgress - t * 0.03);
            const trailEased = ExtendedEasings.easeOut(trailProgress);
            const tx = particle.startX + (particle.targetX - particle.startX) * trailEased;
            const ty = particle.startY + (particle.targetY - particle.startY) * trailEased;

            if (t === 0) {
              ctx.moveTo(tx, ty);
            } else {
              ctx.lineTo(tx, ty);
            }
          }
          ctx.stroke();
          ctx.restore();
        }

        // Draw particle
        const size = particleSize * (1 - particleProgress * 0.5);
        const opacity = particleProgress < 0.9 ? 1 : (1 - particleProgress) * 10;

        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw the character once particles have mostly assembled
      if (charProgress > 0.7) {
        const textOpacity = (charProgress - 0.7) / 0.3;
        ctx.save();
        ctx.globalAlpha = textOpacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px "${fontFamily}"`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(char.char, char.x, char.y);
        ctx.restore();
      }
    }
  }

  private initializeParticles(
    characters: { index: number; x: number; y: number; char: string }[],
    width: number,
    height: number,
    density: number
  ): void {
    this.particles.clear();

    for (const char of characters) {
      const charParticles: Particle[] = [];
      const particleCount = Math.floor(density / characters.length);

      for (let i = 0; i < particleCount; i++) {
        // Random start position (scattered across screen)
        const angle = random(0, Math.PI * 2);
        const distance = random(100, Math.max(width, height) * 0.7);

        charParticles.push({
          targetX: char.x + random(-5, 15), // Slight variation around target
          targetY: char.y + random(-5, 5),
          startX: char.x + Math.cos(angle) * distance,
          startY: char.y + Math.sin(angle) * distance,
          size: random(1, 3),
          delay: random(0, 0.3), // Staggered start
        });
      }

      this.particles.set(char.index, charParticles);
    }
  }

  reset(): void {
    this.initialized = false;
    this.particles.clear();
    this.disperseAmount = 0;
  }
}
