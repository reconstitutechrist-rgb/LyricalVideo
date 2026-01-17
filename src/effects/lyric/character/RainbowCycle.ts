/**
 * Rainbow Cycle Effect
 * HSL color cycling per character
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { hsl } from '../../utils/CanvasUtils';

export class RainbowCycleEffect extends CharacterLyricEffect {
  readonly id = 'rainbow-cycle';
  readonly name = 'Rainbow Cycle';
  readonly parameters: EffectParameter[] = [
    slider('speed', 'Cycle Speed', 1, 0.1, 5, 0.1),
    slider('saturation', 'Saturation', 80, 0, 100, 1, '%'),
    slider('lightness', 'Lightness', 60, 20, 80, 1, '%'),
    slider('offset', 'Color Offset', 30, 0, 120, 1, 'deg'),
    slider('glowIntensity', 'Glow Intensity', 15, 0, 50, 1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text: _text, fontSize, fontFamily, currentTime } = context;
    const characters = this.getCharacters(context);

    const speed = this.getParameter<number>('speed');
    const saturation = this.getParameter<number>('saturation');
    const lightness = this.getParameter<number>('lightness');
    const offset = this.getParameter<number>('offset');
    const glowIntensity = this.getParameter<number>('glowIntensity');

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      // Calculate hue based on character index and time
      const hue = (char.index * offset + currentTime * speed * 100) % 360;
      const charColor = hsl(hue, saturation, lightness);
      const glowColor = hsl(hue, saturation, lightness + 20);

      if (glowIntensity > 0) {
        this.drawCharacterWithGlow(ctx, char.char, char.x, char.y, {
          fontSize,
          fontFamily,
          color: charColor,
          glowColor,
          glowBlur: glowIntensity,
        });
      } else {
        this.drawCharacter(ctx, char.char, char.x, char.y, {
          fontSize,
          fontFamily,
          color: charColor,
        });
      }
    }
  }
}
