/**
 * Particle Burst Effect
 * Particles burst from text on entry
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, random } from '../../utils/MathUtils';
import { hsl, getPaletteColors } from '../../utils/CanvasUtils';
import { ColorPalette } from '../../../../types';

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  trailIndex: number; // Circular buffer write index
  trailLength: number; // Current valid entries count
}

export class ParticleBurstEffect extends CharacterLyricEffect {
  readonly id = 'particle-burst';
  readonly name = 'Particle Burst';
  readonly parameters: EffectParameter[] = [
    slider('burstCount', 'Particle Count', 80, 20, 300, 10),
    slider('burstRadius', 'Burst Radius', 150, 50, 400, 10, 'px'),
    slider('particleSize', 'Particle Size', 3, 1, 10, 0.5),
    slider('trailLength', 'Trail Length', 5, 0, 20, 1),
    enumParam('colorMode', 'Color Mode', 'palette', [
      { value: 'inherit', label: 'Inherit Text Color' },
      { value: 'rainbow', label: 'Rainbow' },
      { value: 'palette', label: 'Use Palette' },
    ]),
    slider('burstDuration', 'Burst Duration', 0.5, 0.2, 2, 0.1, 's'),
    slider('gravity', 'Gravity', 0.3, 0, 1, 0.05),
  ];

  private particles: Map<string, BurstParticle[]> = new Map();
  private lastLyricId: string = '';
  private burstTriggered: boolean = false;

  renderLyric(context: LyricEffectContext): void {
    const {
      ctx,
      lyric,
      text: _text,
      fontSize,
      fontFamily,
      color,
      progress,
      currentTime: _currentTime,
      x,
      y,
      palette,
    } = context;
    const characters = this.getCharacters(context);

    const burstCount = this.getParameter<number>('burstCount');
    const burstRadius = this.getParameter<number>('burstRadius');
    const particleSize = this.getParameter<number>('particleSize');
    const trailLength = this.getParameter<number>('trailLength');
    const colorMode = this.getParameter<string>('colorMode');
    const burstDuration = this.getParameter<number>('burstDuration');
    const gravity = this.getParameter<number>('gravity') * 200;

    // Reset for new lyric
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.burstTriggered = false;
      this.particles.delete(lyric.id);
    }

    // Trigger burst at start
    if (!this.burstTriggered && progress > 0) {
      this.burstTriggered = true;
      this.createBurst(x, y, burstCount, burstRadius, particleSize, color, colorMode, palette);
    }

    // Draw text
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Fade in text as particles disperse
    const textOpacity = clamp(progress / 0.3, 0, 1);

    for (const char of characters) {
      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        opacity: textOpacity,
      });
    }

    // Update and draw particles
    const particles = this.particles.get(lyric.id) || [];
    const deltaTime = 0.016;

    for (const p of particles) {
      if (p.life <= 0) continue;

      // Update trail using circular buffer - O(1) instead of O(n) shift()
      if (trailLength > 0) {
        if (p.trail.length < trailLength) {
          // Growth phase - array not yet full
          p.trail.push({ x: p.x, y: p.y });
          p.trailLength = p.trail.length;
        } else {
          // Circular write - O(1) operation
          const idx = p.trailIndex % trailLength;
          p.trail[idx] = { x: p.x, y: p.y };
          p.trailIndex++;
          p.trailLength = Math.min(p.trailLength + 1, trailLength);
        }
      }

      // Apply gravity
      p.vy += gravity * deltaTime;

      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Decay life
      p.life -= deltaTime / burstDuration;

      // Draw trail - iterate circular buffer in correct order
      if (p.trailLength > 1) {
        ctx.beginPath();
        const len = p.trail.length;
        const startIdx = (p.trailIndex - p.trailLength + len) % len;

        const firstPoint = p.trail[startIdx];
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < p.trailLength; i++) {
          const idx = (startIdx + i) % len;
          ctx.lineTo(p.trail[idx].x, p.trail[idx].y);
        }
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.5 * p.life;
        ctx.globalAlpha = p.life * 0.5;
        ctx.stroke();
      }

      // Draw particle
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private createBurst(
    centerX: number,
    centerY: number,
    count: number,
    radius: number,
    size: number,
    textColor: string,
    colorMode: string,
    palette: ColorPalette
  ): void {
    const particles: BurstParticle[] = [];
    const paletteColors = getPaletteColors(palette);

    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(radius * 0.5, radius * 2);

      let particleColor: string;
      switch (colorMode) {
        case 'inherit':
          particleColor = textColor;
          break;
        case 'rainbow':
          particleColor = hsl((i / count) * 360, 80, 60);
          break;
        case 'palette':
        default:
          particleColor = paletteColors[i % paletteColors.length];
          break;
      }

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - speed * 0.3, // Initial upward bias
        size: random(size * 0.5, size * 1.5),
        color: particleColor,
        life: 1,
        maxLife: 1,
        trail: [],
        trailIndex: 0,
        trailLength: 0,
      });
    }

    this.particles.set(this.lastLyricId, particles);
  }

  reset(): void {
    this.lastLyricId = '';
    this.burstTriggered = false;
    this.particles.clear();
  }
}
