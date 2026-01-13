/**
 * Scatter Effect
 * Characters scatter outward then reassemble
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { ExtendedEasings, clamp, random, degToRad } from '../../utils/MathUtils';

interface ScatterState {
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
}

export class ScatterEffect extends CharacterLyricEffect {
  readonly id = 'scatter';
  readonly name = 'Scatter';
  readonly parameters: EffectParameter[] = [
    slider('scatterRadius', 'Scatter Radius', 150, 50, 500, 10, 'px'),
    slider('scatterDuration', 'Animation Duration', 0.8, 0.2, 3, 0.1, 's'),
    enumParam('easing', 'Reassemble Easing', 'easeOut', [
      { value: 'easeOut', label: 'Ease Out' },
      { value: 'bounce', label: 'Bounce' },
      { value: 'elastic', label: 'Elastic' },
      { value: 'linear', label: 'Linear' },
    ]),
    boolean('rotateChars', 'Rotate Characters', true),
    enumParam('direction', 'Scatter Direction', 'outward', [
      { value: 'outward', label: 'Outward' },
      { value: 'inward', label: 'Inward (Start scattered)' },
    ]),
  ];

  private scatterStates: Map<string, ScatterState[]> = new Map();
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
      width: _width,
      height: _height,
    } = context;
    const characters = this.getCharacters(context);

    const scatterRadius = this.getParameter<number>('scatterRadius');
    const scatterDuration = this.getParameter<number>('scatterDuration');
    const easingType = this.getParameter<string>('easing');
    const rotateChars = this.getParameter<boolean>('rotateChars');
    const direction = this.getParameter<string>('direction');

    // Initialize scatter states for new lyric
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.initializeScatterStates(lyric.id, characters.length, scatterRadius);
    }

    const states = this.scatterStates.get(lyric.id) || [];

    // Calculate animation progress
    const animProgress = clamp(
      progress / (scatterDuration / (lyric.endTime - lyric.startTime)),
      0,
      1
    );

    // Get easing function
    let easedProgress: number;
    switch (easingType) {
      case 'bounce':
        easedProgress = ExtendedEasings.bounce(animProgress);
        break;
      case 'elastic':
        easedProgress = ExtendedEasings.elastic(animProgress);
        break;
      case 'linear':
        easedProgress = animProgress;
        break;
      default:
        easedProgress = ExtendedEasings.easeOut(animProgress);
    }

    // For inward direction, start scattered and assemble
    // For outward direction, start assembled and scatter
    const effectiveProgress = direction === 'inward' ? easedProgress : 1 - easedProgress;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const state = states[char.index];
      if (!state) continue;

      // Interpolate from scattered to assembled position
      const offsetX = state.offsetX * (1 - effectiveProgress);
      const offsetY = state.offsetY * (1 - effectiveProgress);
      const rotation = rotateChars ? state.rotation * (1 - effectiveProgress) : 0;
      const scale = 1 + (state.scale - 1) * (1 - effectiveProgress);
      const opacity =
        direction === 'inward'
          ? clamp(animProgress * 2, 0, 1) // Fade in as assembling
          : clamp((1 - animProgress) * 2 + 0.5, 0, 1); // Fade out as scattering

      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        scale,
        rotation: degToRad(rotation),
        opacity,
        offsetX,
        offsetY,
      });
    }
  }

  private initializeScatterStates(lyricId: string, count: number, radius: number): void {
    const states: ScatterState[] = [];

    for (let i = 0; i < count; i++) {
      // Random angle for scatter direction
      const angle = random(0, Math.PI * 2);
      const distance = random(radius * 0.5, radius);

      states.push({
        offsetX: Math.cos(angle) * distance,
        offsetY: Math.sin(angle) * distance,
        rotation: random(-180, 180),
        scale: random(0.5, 1.5),
      });
    }

    this.scatterStates.set(lyricId, states);
  }

  reset(): void {
    this.lastLyricId = '';
    this.scatterStates.clear();
  }
}
