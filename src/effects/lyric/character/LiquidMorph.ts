/**
 * Liquid Morph Effect
 * Letters appear to melt/flow into place like liquid mercury
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp, ExtendedEasings } from '../../utils/MathUtils';

export class LiquidMorphEffect extends CharacterLyricEffect {
  readonly id = 'liquid-morph';
  readonly name = 'Liquid Morph';
  readonly parameters: EffectParameter[] = [
    slider('morphDuration', 'Morph Duration', 0.8, 0.3, 1.5, 0.1, 's'),
    slider('viscosity', 'Viscosity', 0.5, 0.1, 1, 0.05),
    boolean('metallic', 'Metallic Sheen', true),
    slider('drippiness', 'Drippiness', 0.5, 0, 1, 0.05),
    slider('stagger', 'Stagger', 0.04, 0.01, 0.1, 0.01, 's'),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, audioData, currentTime } = context;
    const characters = this.getCharacters(context);

    const morphDuration = this.getParameter<number>('morphDuration');
    const viscosity = this.getParameter<number>('viscosity');
    const metallic = this.getParameter<boolean>('metallic');
    const drippiness = this.getParameter<number>('drippiness');
    const stagger = this.getParameter<number>('stagger');

    const totalDuration = stagger * characters.length + morphDuration;

    // Bass affects the "wobble" of the liquid
    const bassWobble = audioData ? (audioData.bass / 255) * 0.2 : 0;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const charStartTime = char.index * stagger;
      const charProgress = clamp((progress * totalDuration - charStartTime) / morphDuration, 0, 1);

      if (charProgress <= 0) continue;

      // Liquid easing - slow start, fast middle, slow end (like mercury settling)
      const eased = this.liquidEase(charProgress, viscosity);

      // Calculate morphing transformations
      const scaleX = 0.3 + eased * 0.7;
      const scaleY = this.calculateVerticalStretch(charProgress, drippiness, eased);
      const offsetY = this.calculateDrip(charProgress, drippiness, fontSize);
      const opacity = Math.min(1, charProgress * 3);

      // Wobble effect
      const wobbleX = Math.sin(currentTime * 5 + char.index) * bassWobble * fontSize * 0.1;
      const wobbleY = Math.cos(currentTime * 4 + char.index) * bassWobble * fontSize * 0.05;

      ctx.save();
      ctx.translate(char.x + wobbleX, char.y + offsetY + wobbleY);
      ctx.scale(scaleX, scaleY);
      ctx.globalAlpha = opacity;

      if (metallic && charProgress > 0.3) {
        // Metallic gradient effect
        const gradient = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
        gradient.addColorStop(0, this.lightenColor(color, 0.4));
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(0.5, this.lightenColor(color, 0.3));
        gradient.addColorStop(0.7, this.darkenColor(color, 0.2));
        gradient.addColorStop(1, color);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = color;
      }

      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(char.char, 0, 0);

      ctx.restore();
    }
  }

  private liquidEase(t: number, viscosity: number): number {
    // Custom easing that simulates liquid behavior
    // Higher viscosity = slower, more sluggish movement
    const power = 2 + viscosity * 2;
    if (t < 0.5) {
      return Math.pow(2, power - 1) * Math.pow(t, power);
    }
    return 1 - Math.pow(-2 * t + 2, power) / 2;
  }

  private calculateVerticalStretch(progress: number, drippiness: number, _eased: number): number {
    if (progress < 0.3) {
      // Initial stretch phase - elongated like a droplet
      const stretchPhase = progress / 0.3;
      return 0.5 + stretchPhase * 0.5 + drippiness * 0.5 * (1 - stretchPhase);
    } else if (progress < 0.7) {
      // Compression phase
      const compressPhase = (progress - 0.3) / 0.4;
      return 1 + (1 - compressPhase) * drippiness * 0.3;
    } else {
      // Settlement phase
      const settlePhase = (progress - 0.7) / 0.3;
      const bounce = Math.sin(settlePhase * Math.PI * 2) * 0.05 * (1 - settlePhase);
      return 1 + bounce;
    }
  }

  private calculateDrip(progress: number, drippiness: number, fontSize: number): number {
    if (progress < 0.3) {
      // Dripping down phase
      const dripProgress = progress / 0.3;
      return dripProgress * drippiness * fontSize * 0.3;
    } else if (progress < 0.6) {
      // Bounce back
      const bounceProgress = (progress - 0.3) / 0.3;
      const maxDrip = drippiness * fontSize * 0.3;
      return maxDrip * (1 - ExtendedEasings.elastic(bounceProgress));
    }
    return 0;
  }

  private lightenColor(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    return `rgb(${Math.min(255, rgb.r + 255 * amount)}, ${Math.min(255, rgb.g + 255 * amount)}, ${Math.min(255, rgb.b + 255 * amount)})`;
  }

  private darkenColor(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    return `rgb(${Math.max(0, rgb.r * (1 - amount))}, ${Math.max(0, rgb.g * (1 - amount))}, ${Math.max(0, rgb.b * (1 - amount))})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}
