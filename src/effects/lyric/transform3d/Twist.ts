/**
 * Twist Effect
 * 3D-like twist transformation per character
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { degToRad } from '../../utils/MathUtils';

export class TwistEffect extends CharacterLyricEffect {
  readonly id = 'twist-3d';
  readonly name = 'Twist 3D';
  readonly parameters: EffectParameter[] = [
    slider('twistAngle', 'Twist Angle', 45, -180, 180, 5, 'deg'),
    enumParam('twistAxis', 'Twist Axis', 'y', [
      { value: 'x', label: 'X Axis (Vertical)' },
      { value: 'y', label: 'Y Axis (Horizontal)' },
      { value: 'z', label: 'Z Axis (Rotation)' },
    ]),
    slider('twistSpeed', 'Twist Speed', 1, 0.1, 5, 0.1),
    slider('perspective', 'Perspective', 500, 100, 1000, 50, 'px'),
    slider('waveAmount', 'Wave Amount', 0.5, 0, 2, 0.1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const {
      ctx,
      text: _text,
      fontSize,
      fontFamily,
      color,
      currentTime,
      progress: _progress,
    } = context;
    const characters = this.getCharacters(context);

    const twistAngle = this.getParameter<number>('twistAngle');
    const twistAxis = this.getParameter<string>('twistAxis');
    const twistSpeed = this.getParameter<number>('twistSpeed');
    const _perspective = this.getParameter<number>('perspective');
    const waveAmount = this.getParameter<number>('waveAmount');

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const totalChars = characters.length;
    const _centerIndex = totalChars / 2;

    for (const char of characters) {
      // Calculate wave offset based on character position and time
      const wavePhase = (char.index / totalChars) * Math.PI * 2 + currentTime * twistSpeed;
      const waveValue = Math.sin(wavePhase) * waveAmount;

      // Calculate the twist angle for this character
      const charTwistAngle = degToRad(twistAngle * waveValue);

      // Simulate 3D transformation based on axis
      let scaleX = 1;
      let scaleY = 1;
      let rotation = 0;
      let offsetX = 0;
      let offsetY = 0;
      let opacity = 1;

      switch (twistAxis) {
        case 'x':
          // Vertical twist (like flipping a card top to bottom)
          scaleY = Math.cos(charTwistAngle);
          offsetY = Math.sin(charTwistAngle) * (fontSize / 4);
          // Fade when "facing away"
          opacity = Math.abs(scaleY) < 0.1 ? 0.3 : 1;
          break;

        case 'y': {
          // Horizontal twist (like flipping a card left to right)
          scaleX = Math.cos(charTwistAngle);
          offsetX = Math.sin(charTwistAngle) * (fontSize / 4);
          // Simulate perspective depth
          const depth = Math.sin(charTwistAngle);
          const perspectiveScale = 1 + depth * 0.2;
          scaleX *= perspectiveScale;
          scaleY = perspectiveScale;
          opacity = Math.abs(scaleX) < 0.1 ? 0.3 : 1;
          break;
        }

        case 'z':
          // Z-axis rotation (flat rotation)
          rotation = charTwistAngle;
          break;
      }

      this.drawCharacter(ctx, char.char, char.x, char.y, {
        fontSize,
        fontFamily,
        color,
        scale: Math.max(0.01, scaleX), // Prevent zero scale
        rotation,
        opacity,
        offsetX,
        offsetY,
      });
    }
  }
}
