/**
 * Wave Effect
 * Sine wave animation applied per character
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';

export class WaveEffect extends CharacterLyricEffect {
  readonly id = 'wave';
  readonly name = 'Wave';
  readonly parameters: EffectParameter[] = [
    slider('height', 'Wave Height', 20, 5, 100, 1, 'px'),
    slider('speed', 'Wave Speed', 2, 0.5, 10, 0.1),
    slider('wavelength', 'Wavelength', 8, 2, 20, 1),
    enumParam('direction', 'Direction', 'horizontal', [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
      { value: 'diagonal', label: 'Diagonal' },
    ]),
    slider('phase', 'Phase Offset', 0, 0, 360, 1, 'deg'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, fontSize, fontFamily, color, currentTime } = context;
    const characters = this.getCharacters(context);

    const height = this.getParameter<number>('height');
    const speed = this.getParameter<number>('speed');
    const wavelength = this.getParameter<number>('wavelength');
    const direction = this.getParameter<string>('direction');
    const phase = this.getParameter<number>('phase');

    const phaseRad = (phase * Math.PI) / 180;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const waveOffset =
        Math.sin(char.index / wavelength + currentTime * speed + phaseRad) * height;

      let offsetX = 0;
      let offsetY = 0;

      switch (direction) {
        case 'horizontal':
          offsetX = waveOffset;
          break;
        case 'vertical':
          offsetY = waveOffset;
          break;
        case 'diagonal':
          offsetX = waveOffset * 0.7;
          offsetY = waveOffset * 0.7;
          break;
      }

      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        offsetX,
        offsetY,
      });
    }
  }
}
