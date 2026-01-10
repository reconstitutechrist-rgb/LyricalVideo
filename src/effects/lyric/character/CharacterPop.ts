/**
 * Character Pop Effect
 * Bounce-in animation per character with staggered timing
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { ExtendedEasings, clamp } from '../../utils/MathUtils';

export class CharacterPopEffect extends CharacterLyricEffect {
  readonly id = 'character-pop';
  readonly name = 'Character Pop';
  readonly parameters: EffectParameter[] = [
    slider('popScale', 'Pop Scale', 1.5, 1.1, 3, 0.1),
    slider('staggerDelay', 'Stagger Delay', 0.05, 0.01, 0.2, 0.01, 's'),
    enumParam('easing', 'Easing', 'bounce', [
      { value: 'bounce', label: 'Bounce' },
      { value: 'elastic', label: 'Elastic' },
      { value: 'easeOut', label: 'Ease Out' },
      { value: 'backOut', label: 'Back Out' },
    ]),
    slider('duration', 'Animation Duration', 0.5, 0.2, 2, 0.1, 's'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, fontSize, fontFamily, color, progress } = context;
    const characters = this.getCharacters(context);

    const popScale = this.getParameter<number>('popScale');
    const staggerDelay = this.getParameter<number>('staggerDelay');
    const easingType = this.getParameter<string>('easing');
    const duration = this.getParameter<number>('duration');

    // Calculate total animation time based on characters and stagger
    const totalDuration = staggerDelay * characters.length + duration;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      // Calculate this character's animation progress
      const charStartTime = char.index * staggerDelay;
      const charProgress = clamp((progress * totalDuration - charStartTime) / duration, 0, 1);

      // Get easing function
      let easedProgress: number;
      switch (easingType) {
        case 'bounce':
          easedProgress = ExtendedEasings.bounce(charProgress);
          break;
        case 'elastic':
          easedProgress = ExtendedEasings.elastic(charProgress);
          break;
        case 'backOut':
          easedProgress = ExtendedEasings.backOut(charProgress);
          break;
        default:
          easedProgress = ExtendedEasings.easeOut(charProgress);
      }

      // Calculate scale: start at 0, overshoot to popScale, settle at 1
      let scale: number;
      let opacity: number;

      if (charProgress === 0) {
        scale = 0;
        opacity = 0;
      } else if (charProgress < 0.5) {
        // Growing phase
        const growProgress = charProgress / 0.5;
        scale = growProgress * popScale;
        opacity = growProgress;
      } else {
        // Settling phase
        const settleProgress = (charProgress - 0.5) / 0.5;
        scale = popScale - (popScale - 1) * settleProgress;
        opacity = 1;
      }

      // Apply easing to make it bouncy
      if (easingType === 'bounce' || easingType === 'elastic') {
        scale = easedProgress * (scale > 1 ? popScale : 1);
        if (charProgress > 0) scale = Math.max(scale, 0.1);
      }

      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        scale,
        opacity,
      });
    }
  }
}
