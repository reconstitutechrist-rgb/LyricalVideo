/**
 * Zoom Crash Effect
 * Text zooms in rapidly from infinity and crashes into place with bounce
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp } from '../../utils/MathUtils';

export class ZoomCrashEffect extends CharacterLyricEffect {
  readonly id = 'zoom-crash';
  readonly name = 'Zoom Crash';
  readonly parameters: EffectParameter[] = [
    slider('zoomDuration', 'Zoom Duration', 0.4, 0.2, 1, 0.05, 's'),
    slider('bounceAmount', 'Bounce Amount', 0.3, 0, 0.5, 0.05),
    boolean('motionBlur', 'Motion Blur', true),
    slider('impactShake', 'Impact Shake', 10, 0, 20, 1, 'px'),
    enumParam('direction', 'Direction', 'center', [
      { value: 'center', label: 'Center' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ]),
    slider('stagger', 'Stagger', 0.02, 0, 0.1, 0.005, 's'),
  ];

  private shakeOffset = { x: 0, y: 0 };
  private lastImpactTime = 0;

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, currentTime } = context;
    const characters = this.getCharacters(context);

    const zoomDuration = this.getParameter<number>('zoomDuration');
    const bounceAmount = this.getParameter<number>('bounceAmount');
    const motionBlur = this.getParameter<boolean>('motionBlur');
    const impactShake = this.getParameter<number>('impactShake');
    const direction = this.getParameter<string>('direction');
    const stagger = this.getParameter<number>('stagger');

    const totalDuration = stagger * characters.length + zoomDuration;

    // Update shake decay
    this.shakeOffset.x *= 0.85;
    this.shakeOffset.y *= 0.85;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const charStartTime = char.index * stagger;
      const charProgress = clamp((progress * totalDuration - charStartTime) / zoomDuration, 0, 1);

      if (charProgress <= 0) continue;

      // Calculate scale with bounce
      let scale: number;
      let offsetX = 0;
      let offsetY = 0;
      let opacity = 1;

      if (charProgress < 0.6) {
        // Zoom in phase (from far away)
        const zoomProgress = charProgress / 0.6;
        scale = 0.01 + zoomProgress * (1.3 - 0.01); // Start tiny, overshoot to 1.3
        opacity = Math.min(1, zoomProgress * 2);

        // Direction-based offset
        const distance = (1 - zoomProgress) * 500;
        switch (direction) {
          case 'top':
            offsetY = -distance;
            break;
          case 'bottom':
            offsetY = distance;
            break;
          case 'left':
            offsetX = -distance;
            break;
          case 'right':
            offsetX = distance;
            break;
          default: // center - no offset, just scale
            break;
        }
      } else if (charProgress < 0.7) {
        // Impact moment
        const impactProgress = (charProgress - 0.6) / 0.1;
        scale = 1.3 - impactProgress * 0.3 * (1 - bounceAmount);

        // Trigger shake on impact
        if (charProgress >= 0.6 && currentTime - this.lastImpactTime > 0.05) {
          this.shakeOffset.x = (Math.random() - 0.5) * impactShake;
          this.shakeOffset.y = (Math.random() - 0.5) * impactShake;
          this.lastImpactTime = currentTime;
        }
      } else {
        // Bounce settle phase
        const settleProgress = (charProgress - 0.7) / 0.3;
        const bounce = Math.sin(settleProgress * Math.PI * 2) * bounceAmount * (1 - settleProgress);
        scale = 1 + bounce;
      }

      // Apply global shake to all characters
      const finalOffsetX = offsetX + this.shakeOffset.x;
      const finalOffsetY = offsetY + this.shakeOffset.y;

      // Draw motion blur trail during zoom
      if (motionBlur && charProgress < 0.5 && charProgress > 0) {
        ctx.save();
        const blurCount = 5;
        for (let i = blurCount; i >= 1; i--) {
          const trailProgress = Math.max(0, charProgress - i * 0.02);
          const trailScale = 0.01 + (trailProgress / 0.6) * 1.29;
          const trailOpacity = 0.1 * (1 - i / blurCount);

          let trailOffsetX = 0;
          let trailOffsetY = 0;
          const trailDistance = (1 - trailProgress / 0.6) * 500;

          switch (direction) {
            case 'top':
              trailOffsetY = -trailDistance;
              break;
            case 'bottom':
              trailOffsetY = trailDistance;
              break;
            case 'left':
              trailOffsetX = -trailDistance;
              break;
            case 'right':
              trailOffsetX = trailDistance;
              break;
          }

          ctx.globalAlpha = trailOpacity;
          ctx.save();
          ctx.translate(char.x + trailOffsetX, char.y + trailOffsetY);
          ctx.scale(trailScale, trailScale);
          ctx.fillStyle = color;
          ctx.fillText(char.char, 0, 0);
          ctx.restore();
        }
        ctx.restore();
      }

      // Draw main character
      this.drawCharacter(ctx, char.char, char.x + finalOffsetX, char.y + finalOffsetY, {
        fontSize,
        fontFamily,
        color,
        scale,
        opacity,
      });
    }
  }

  reset(): void {
    this.shakeOffset = { x: 0, y: 0 };
    this.lastImpactTime = 0;
  }
}
