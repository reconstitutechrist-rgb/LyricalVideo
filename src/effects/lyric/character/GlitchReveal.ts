/**
 * Glitch Reveal Effect
 * Characters scramble as random symbols then resolve to correct text
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp } from '../../utils/MathUtils';

export class GlitchRevealEffect extends CharacterLyricEffect {
  readonly id = 'glitch-reveal';
  readonly name = 'Glitch Reveal';
  readonly parameters: EffectParameter[] = [
    slider('revealSpeed', 'Reveal Speed', 1.5, 0.5, 3, 0.1, 's'),
    slider('scrambleIntensity', 'Scramble Intensity', 0.8, 0, 1, 0.05),
    enumParam('characterSet', 'Character Set', 'matrix', [
      { value: 'ascii', label: 'ASCII' },
      { value: 'matrix', label: 'Matrix' },
      { value: 'unicode', label: 'Unicode Blocks' },
      { value: 'binary', label: 'Binary' },
    ]),
    slider('staggerDelay', 'Stagger Delay', 0.03, 0.01, 0.1, 0.01, 's'),
  ];

  private readonly charSets: Record<string, string> = {
    ascii:
      '!@#$%^&*()[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    matrix:
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789',
    unicode: '░▒▓█▄▀■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯▰▱',
    binary: '01',
  };

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, audioData } = context;
    const characters = this.getCharacters(context);

    const revealSpeed = this.getParameter<number>('revealSpeed');
    const scrambleIntensity = this.getParameter<number>('scrambleIntensity');
    const charSetName = this.getParameter<string>('characterSet');
    const staggerDelay = this.getParameter<number>('staggerDelay');

    const charSet = this.charSets[charSetName] || this.charSets.matrix;
    const totalDuration = staggerDelay * characters.length + revealSpeed;

    // Audio reactivity - treble increases scramble
    const trebleBoost = audioData ? (audioData.treble / 255) * 0.3 : 0;
    const effectiveScramble = Math.min(1, scrambleIntensity + trebleBoost);

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const charStartTime = char.index * staggerDelay;
      const charProgress = clamp((progress * totalDuration - charStartTime) / revealSpeed, 0, 1);

      let displayChar = char.char;
      let charColor = color;
      let scale = 1;
      let opacity = 1;

      if (charProgress < 1) {
        // Still scrambling
        const scrambleChance = (1 - charProgress) * effectiveScramble;

        if (Math.random() < scrambleChance) {
          // Show random character
          displayChar = charSet[Math.floor(Math.random() * charSet.length)];

          // Glitch colors
          const colorChoice = Math.random();
          if (colorChoice < 0.15) {
            charColor = '#ff0000';
          } else if (colorChoice < 0.3) {
            charColor = '#00ff00';
          } else if (colorChoice < 0.45) {
            charColor = '#0000ff';
          }

          // Slight position jitter
          scale = 0.9 + Math.random() * 0.2;
        }

        // Fade in
        opacity = Math.min(1, charProgress * 2);
      }

      // Draw character
      this.drawCharacter(ctx, displayChar, char.x, char.y, {
        fontSize,
        fontFamily,
        color: charColor,
        scale,
        opacity,
        offsetX: charProgress < 1 ? (Math.random() - 0.5) * 4 * (1 - charProgress) : 0,
        offsetY: charProgress < 1 ? (Math.random() - 0.5) * 4 * (1 - charProgress) : 0,
      });
    }
  }
}
