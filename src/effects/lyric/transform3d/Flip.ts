/**
 * Flip Effect
 * Simulated 3D flip animation
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, ExtendedEasings } from '../../utils/MathUtils';

export class FlipEffect extends CharacterLyricEffect {
  readonly id = 'flip-3d';
  readonly name = 'Flip 3D';
  readonly parameters: EffectParameter[] = [
    enumParam('flipAxis', 'Flip Axis', 'horizontal', [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
    ]),
    slider('flipCount', 'Flip Count', 1, 1, 5, 1),
    slider('flipDuration', 'Flip Duration', 0.8, 0.2, 3, 0.1, 's'),
    slider('stagger', 'Character Stagger', 0.03, 0, 0.2, 0.01, 's'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, lyric, text, fontSize, fontFamily, color, progress } = context;
    const characters = this.getCharacters(context);

    const flipAxis = this.getParameter<string>('flipAxis');
    const flipCount = this.getParameter<number>('flipCount');
    const flipDuration = this.getParameter<number>('flipDuration');
    const stagger = this.getParameter<number>('stagger');

    const lyricDuration = lyric.endTime - lyric.startTime;
    const totalDuration = stagger * characters.length + flipDuration;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      // Calculate this character's flip progress
      const charStartTime = char.index * stagger;
      const charProgress = clamp((progress * lyricDuration - charStartTime) / flipDuration, 0, 1);

      // Apply easing
      const easedProgress = ExtendedEasings.easeInOut(charProgress);

      // Calculate flip angle (full rotation = 180 degrees * flipCount * 2)
      const flipAngle = easedProgress * Math.PI * flipCount;

      // Calculate scale based on flip angle
      let scaleX = 1;
      let scaleY = 1;

      if (flipAxis === 'horizontal') {
        // Flip around vertical axis
        scaleX = Math.cos(flipAngle);
      } else {
        // Flip around horizontal axis
        scaleY = Math.cos(flipAngle);
      }

      // Determine opacity based on which "side" is showing
      const isBackSide = Math.cos(flipAngle) < 0;
      const opacity = isBackSide ? 0.5 : 1;

      // Calculate slight depth offset
      const depthOffset = Math.sin(flipAngle) * (fontSize / 3);

      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        scale: Math.max(0.01, Math.abs(flipAxis === 'horizontal' ? scaleX : scaleY)),
        opacity,
        offsetX: flipAxis === 'horizontal' ? depthOffset * 0.3 : 0,
        offsetY: flipAxis === 'vertical' ? depthOffset * 0.3 : 0,
      });
    }
  }
}
