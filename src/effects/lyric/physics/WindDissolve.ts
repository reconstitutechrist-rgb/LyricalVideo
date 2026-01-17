/**
 * Wind Dissolve Effect
 * Text dissolves into particles that drift away like wind
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { noise2D, degToRad, clamp, random } from '../../utils/MathUtils';
import { TextParticle, createTextParticle } from '../../particle/Particle';

interface WindParticle extends TextParticle {
  noiseOffsetX: number;
  noiseOffsetY: number;
}

export class WindDissolveEffect extends CharacterLyricEffect {
  readonly id = 'wind-dissolve';
  readonly name = 'Wind Dissolve';
  readonly parameters: EffectParameter[] = [
    slider('windDirection', 'Wind Direction', 90, 0, 360, 5, 'deg'),
    slider('windStrength', 'Wind Strength', 1, 0.1, 3, 0.1),
    slider('particlesPerChar', 'Particles per Char', 5, 1, 15, 1),
    slider('dissolveSpeed', 'Dissolve Speed', 1, 0.3, 3, 0.1),
    slider('turbulence', 'Turbulence', 0.3, 0, 1, 0.05),
  ];

  private particles: Map<string, WindParticle[]> = new Map();
  private lastLyricId: string = '';

  renderLyric(context: LyricEffectContext): void {
    const {
      ctx,
      lyric,
      text: _text,
      fontSize,
      fontFamily,
      color,
      progress,
      currentTime,
      width: _width,
      height: _height,
    } = context;
    const characters = this.getCharacters(context);

    const windDirection = degToRad(this.getParameter<number>('windDirection'));
    const windStrength = this.getParameter<number>('windStrength');
    const particlesPerChar = this.getParameter<number>('particlesPerChar');
    const dissolveSpeed = this.getParameter<number>('dissolveSpeed');
    const turbulence = this.getParameter<number>('turbulence');

    // Initialize particles for new lyric
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.initializeParticles(characters, fontSize, color, particlesPerChar);
    }

    const particles = this.particles.get(lyric.id) || [];

    // Calculate dissolve progress (starts at 50% of lyric duration)
    const dissolveStart = 0.5;
    const dissolveProgress = clamp(
      ((progress - dissolveStart) / (1 - dissolveStart)) * dissolveSpeed,
      0,
      1
    );

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Draw characters with fading opacity
    if (dissolveProgress < 1) {
      const charOpacity = 1 - dissolveProgress;
      for (const char of characters) {
        this.drawCharacter(ctx, char.char, char.x, char.y, {
          fontSize,
          fontFamily,
          color,
          opacity: charOpacity,
        });
      }
    }

    // Draw and update particles
    if (dissolveProgress > 0) {
      const windX = Math.cos(windDirection) * windStrength * 100;
      const windY = Math.sin(windDirection) * windStrength * 100;

      for (const particle of particles) {
        // Update particle position with wind and turbulence
        const noiseX = noise2D(particle.x * 0.01 + particle.noiseOffsetX, currentTime * 0.5);
        const noiseY = noise2D(particle.y * 0.01 + particle.noiseOffsetY, currentTime * 0.5 + 100);

        particle.vx = windX + noiseX * turbulence * 50;
        particle.vy = windY + noiseY * turbulence * 50;

        particle.x += particle.vx * 0.016 * dissolveProgress;
        particle.y += particle.vy * 0.016 * dissolveProgress;
        particle.rotation += particle.rotationSpeed;
        particle.life = Math.max(0, 1 - dissolveProgress * 1.5);

        // Draw particle (as a small character fragment or dot)
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life * particle.opacity;
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.fillStyle = particle.color;

          // Draw as small dot
          ctx.beginPath();
          ctx.arc(0, 0, particle.size * (0.5 + particle.life * 0.5), 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }
  }

  private initializeParticles(
    characters: { char: string; x: number; y: number }[],
    fontSize: number,
    color: string,
    particlesPerChar: number
  ): void {
    const particles: WindParticle[] = [];

    for (const char of characters) {
      if (char.char === ' ') continue;

      for (let i = 0; i < particlesPerChar; i++) {
        const offsetX = random(-fontSize / 4, fontSize / 4);
        const offsetY = random(-fontSize / 4, fontSize / 4);

        particles.push({
          ...createTextParticle(char.x + offsetX, char.y + offsetY, char.char, random(2, 5), color),
          noiseOffsetX: random(0, 1000),
          noiseOffsetY: random(0, 1000),
        });
      }
    }

    this.particles.set(this.lastLyricId, particles);
  }

  reset(): void {
    this.lastLyricId = '';
    this.particles.clear();
  }
}
