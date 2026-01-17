/**
 * Neon Flicker Effect
 * Letters turn on like neon signs with buzzing flicker effect
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { clamp } from '../../utils/MathUtils';

export class NeonFlickerEffect extends CharacterLyricEffect {
  readonly id = 'neon-flicker';
  readonly name = 'Neon Flicker';
  readonly parameters: EffectParameter[] = [
    slider('flickerRate', 'Flicker Rate', 0.4, 0.1, 1, 0.05),
    slider('glowLayers', 'Glow Layers', 3, 1, 5, 1),
    slider('buzzyness', 'Buzzyness', 0.5, 0, 1, 0.05),
    slider('staggerDelay', 'Stagger Delay', 0.08, 0, 0.2, 0.01, 's'),
    slider('warmupTime', 'Warmup Time', 0.3, 0.1, 1, 0.05, 's'),
  ];

  // Track flicker state per character
  private flickerStates: Map<number, { nextFlicker: number; isOn: boolean }> = new Map();

  renderLyric(context: LyricEffectContext): void {
    const { ctx, fontSize, fontFamily, color, progress, audioData, currentTime } = context;
    const characters = this.getCharacters(context);

    const flickerRate = this.getParameter<number>('flickerRate');
    const glowLayers = this.getParameter<number>('glowLayers');
    const buzzyness = this.getParameter<number>('buzzyness');
    const staggerDelay = this.getParameter<number>('staggerDelay');
    const warmupTime = this.getParameter<number>('warmupTime');

    const totalDuration = staggerDelay * characters.length + warmupTime;

    // Bass stabilizes flicker (louder = steadier)
    const bassStabilize = audioData ? (audioData.bass / 255) * 0.5 : 0;
    const effectiveFlicker = Math.max(0.1, flickerRate * (1 - bassStabilize));

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      const charStartTime = char.index * staggerDelay;
      const charProgress = clamp((progress * totalDuration - charStartTime) / warmupTime, 0, 1);

      if (charProgress <= 0) continue;

      // Initialize flicker state for this character
      if (!this.flickerStates.has(char.index)) {
        this.flickerStates.set(char.index, {
          nextFlicker: currentTime + Math.random() * 0.1,
          isOn: true,
        });
      }

      const state = this.flickerStates.get(char.index)!;

      // Update flicker state
      if (currentTime >= state.nextFlicker && charProgress < 0.9) {
        state.isOn = !state.isOn || Math.random() > effectiveFlicker;
        state.nextFlicker = currentTime + 0.02 + Math.random() * 0.1 * (1 - effectiveFlicker);
      }

      // After warmup, stay on
      if (charProgress >= 0.9) {
        state.isOn = true;
      }

      // Calculate intensity
      let intensity = charProgress;

      // Flicker modulation
      if (!state.isOn) {
        intensity *= 0.1 + Math.random() * 0.2;
      }

      // Buzzy variation
      const buzz = Math.sin(currentTime * 100 + char.index * 50) * buzzyness * 0.1;
      intensity = Math.max(0.1, Math.min(1, intensity + buzz));

      // Glow color based on original color
      const glowColor = this.getGlowColor(color);

      ctx.save();
      ctx.translate(char.x, char.y);

      // Draw multiple glow layers
      for (let layer = glowLayers; layer >= 0; layer--) {
        const layerOpacity = intensity * (layer === 0 ? 1 : 0.3 / layer);
        const blurAmount = layer * 8 * intensity;

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = blurAmount;
        ctx.globalAlpha = layerOpacity;

        // Inner layers are brighter
        ctx.fillStyle = layer === 0 ? '#ffffff' : glowColor;
        ctx.font = `bold ${fontSize}px "${fontFamily}"`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(char.char, 0, 0);

        ctx.restore();
      }

      // Final bright core
      ctx.globalAlpha = intensity;
      ctx.fillStyle = color;
      ctx.fillText(char.char, 0, 0);

      ctx.restore();
    }
  }

  private getGlowColor(color: string): string {
    // Make the glow color more saturated/vibrant
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    // Boost the dominant channel for neon effect
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    if (max === rgb.r) return '#ff6666';
    if (max === rgb.g) return '#66ff66';
    return '#6666ff';
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

  reset(): void {
    this.flickerStates.clear();
  }
}
