/**
 * Explode/Shatter Effect
 * Text shatters into fragments that explode outward
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, random, degToRad } from '../../utils/MathUtils';

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  color: string;
  shape: 'triangle' | 'square' | 'random';
}

export class ExplodeEffect extends CharacterLyricEffect {
  readonly id = 'explode-shatter';
  readonly name = 'Explode/Shatter';
  readonly parameters: EffectParameter[] = [
    slider('explosionForce', 'Explosion Force', 5, 1, 15, 0.5),
    slider('fragmentCount', 'Fragments per Char', 8, 3, 25, 1),
    enumParam('fragmentShape', 'Fragment Shape', 'triangle', [
      { value: 'triangle', label: 'Triangle' },
      { value: 'square', label: 'Square' },
      { value: 'random', label: 'Random' },
    ]),
    slider('decay', 'Decay Speed', 1, 0.3, 3, 0.1),
    slider('gravity', 'Gravity', 0.5, 0, 2, 0.1),
    slider('triggerPoint', 'Trigger Point', 0.7, 0.3, 0.95, 0.05),
  ];

  private fragments: Map<string, Fragment[]> = new Map();
  private lastLyricId: string = '';
  private explodeTime: number = 0;

  renderLyric(context: LyricEffectContext): void {
    const { ctx, lyric, text, fontSize, fontFamily, color, progress, currentTime } = context;
    const characters = this.getCharacters(context);

    const explosionForce = this.getParameter<number>('explosionForce') * 50;
    const fragmentCount = this.getParameter<number>('fragmentCount');
    const fragmentShape = this.getParameter<string>('fragmentShape') as
      | 'triangle'
      | 'square'
      | 'random';
    const decay = this.getParameter<number>('decay');
    const gravity = this.getParameter<number>('gravity') * 200;
    const triggerPoint = this.getParameter<number>('triggerPoint');

    // Initialize for new lyric
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.explodeTime = 0;
      this.fragments.delete(lyric.id);
    }

    const hasExploded = this.fragments.has(lyric.id);
    const shouldExplode = progress >= triggerPoint;

    // Draw normal text before explosion
    if (!shouldExplode) {
      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Add shake effect as we approach trigger point
      const shakeIntensity = clamp((progress - triggerPoint + 0.1) / 0.1, 0, 1) * 3;

      for (const char of characters) {
        const shakeX = shakeIntensity > 0 ? random(-shakeIntensity, shakeIntensity) : 0;
        const shakeY = shakeIntensity > 0 ? random(-shakeIntensity, shakeIntensity) : 0;

        this.drawCharacter(ctx, char.char, char.x, char.y, {
          fontSize,
          fontFamily,
          color,
          offsetX: shakeX,
          offsetY: shakeY,
        });
      }
      return;
    }

    // Create fragments on explosion
    if (!hasExploded) {
      this.explodeTime = currentTime;
      this.createFragments(
        characters,
        fontSize,
        color,
        fragmentCount,
        explosionForce,
        fragmentShape
      );
    }

    // Update and draw fragments
    const fragments = this.fragments.get(lyric.id) || [];
    const deltaTime = 0.016;
    const elapsed = currentTime - this.explodeTime;

    for (const frag of fragments) {
      // Apply gravity
      frag.vy += gravity * deltaTime;

      // Update position
      frag.x += frag.vx * deltaTime;
      frag.y += frag.vy * deltaTime;
      frag.rotation += frag.rotationSpeed;

      // Decay opacity
      frag.opacity = Math.max(0, 1 - elapsed * decay);

      // Draw fragment
      if (frag.opacity > 0) {
        this.drawFragment(ctx, frag);
      }
    }
  }

  private createFragments(
    characters: { char: string; x: number; y: number }[],
    fontSize: number,
    color: string,
    fragmentCount: number,
    force: number,
    shape: 'triangle' | 'square' | 'random'
  ): void {
    const fragments: Fragment[] = [];

    for (const char of characters) {
      if (char.char === ' ') continue;

      for (let i = 0; i < fragmentCount; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(force * 0.5, force);

        let fragShape = shape;
        if (shape === 'random') {
          fragShape = Math.random() > 0.5 ? 'triangle' : 'square';
        }

        fragments.push({
          x: char.x + random(-fontSize / 4, fontSize / 4),
          y: char.y + random(-fontSize / 4, fontSize / 4),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - force * 0.5, // Initial upward bias
          rotation: random(0, Math.PI * 2),
          rotationSpeed: random(-0.3, 0.3),
          size: random(fontSize / 8, fontSize / 3),
          opacity: 1,
          color,
          shape: fragShape as 'triangle' | 'square',
        });
      }
    }

    this.fragments.set(this.lastLyricId, fragments);
  }

  private drawFragment(ctx: CanvasRenderingContext2D, frag: Fragment): void {
    ctx.save();
    ctx.globalAlpha = frag.opacity;
    ctx.fillStyle = frag.color;
    ctx.translate(frag.x, frag.y);
    ctx.rotate(frag.rotation);

    if (frag.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -frag.size / 2);
      ctx.lineTo(-frag.size / 2, frag.size / 2);
      ctx.lineTo(frag.size / 2, frag.size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-frag.size / 2, -frag.size / 2, frag.size, frag.size);
    }

    ctx.restore();
  }

  reset(): void {
    this.lastLyricId = '';
    this.fragments.clear();
  }
}
