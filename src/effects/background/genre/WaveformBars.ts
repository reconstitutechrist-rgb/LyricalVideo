/**
 * Waveform Bars Background Effect
 * Classic audio spectrum visualization with animated bars
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class WaveformBarsEffect extends GenreBackgroundEffect {
  readonly id = 'waveform-bars';
  readonly name = 'Waveform Bars';
  readonly parameters: EffectParameter[] = [
    slider('barCount', 'Bar Count', 32, 16, 64, 4),
    slider('sensitivity', 'Sensitivity', 0.7, 0.3, 1, 0.1),
    slider('smoothing', 'Smoothing', 0.5, 0, 1, 0.1),
    boolean('mirror', 'Mirror Mode', true),
    boolean('glow', 'Glow Effect', true),
  ];

  private barHeights: number[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const barCount = this.getParameter<number>('barCount');
    const sensitivity = this.getParameter<number>('sensitivity');
    const smoothing = this.getParameter<number>('smoothing');
    const mirror = this.getParameter<boolean>('mirror');
    const glow = this.getParameter<boolean>('glow');

    if (!this.initialized || this.barHeights.length !== barCount) {
      this.barHeights = new Array(barCount).fill(0);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0a0015');
    bgGradient.addColorStop(0.5, '#0f0020');
    bgGradient.addColorStop(1, '#050010');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Calculate bar properties
    const barWidth = width / barCount;
    const gap = barWidth * 0.2;
    const maxBarHeight = mirror ? height * 0.4 : height * 0.7;

    // Update bar heights with smoothing
    for (let i = 0; i < barCount; i++) {
      // Simulate frequency data distribution
      const freq = i / barCount;
      let targetHeight: number;

      if (freq < 0.15) {
        // Bass region
        targetHeight = bassBoost * maxBarHeight;
      } else if (freq < 0.5) {
        // Mid region
        targetHeight = midBoost * maxBarHeight * 0.8;
      } else {
        // Treble region
        targetHeight = trebleBoost * maxBarHeight * 0.6;
      }

      // Add some variation
      const variation = Math.sin(currentTime * 3 + i * 0.5) * 0.2 + 0.8;
      targetHeight *= variation * sensitivity;

      // Smooth transition
      this.barHeights[i] += (targetHeight - this.barHeights[i]) * (1 - smoothing * 0.9);
    }

    // Draw bars
    const centerY = mirror ? height / 2 : height;

    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth + gap / 2;
      const barH = this.barHeights[i];

      // Color based on height and position
      const hue = ((i / barCount) * 60 + 240 + currentTime * 20) % 360;
      const saturation = 70 + (barH / maxBarHeight) * 30;
      const lightness = 40 + (barH / maxBarHeight) * 30;

      // Glow effect
      if (glow && barH > 10) {
        const glowGradient = ctx.createLinearGradient(
          x,
          centerY - barH - 20,
          x,
          centerY + (mirror ? barH + 20 : 0)
        );
        glowGradient.addColorStop(0, 'transparent');
        glowGradient.addColorStop(0.3, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
        glowGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`);
        glowGradient.addColorStop(0.7, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
        glowGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - 5, centerY - barH - 20, barWidth - gap + 10, barH * 2 + 40);
      }

      // Main bar gradient
      const barGradient = ctx.createLinearGradient(x, centerY - barH, x, centerY);
      barGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`);
      barGradient.addColorStop(0.5, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      barGradient.addColorStop(1, `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%)`);

      ctx.fillStyle = barGradient;

      if (mirror) {
        // Top bar (going up)
        ctx.fillRect(x, centerY - barH, barWidth - gap, barH);
        // Bottom bar (going down)
        ctx.fillRect(x, centerY, barWidth - gap, barH);
      } else {
        // Single bar from bottom
        ctx.fillRect(x, height - barH, barWidth - gap, barH);
      }

      // Top cap
      ctx.fillStyle = `hsl(${hue}, 100%, ${lightness + 30}%)`;
      if (mirror) {
        ctx.fillRect(x, centerY - barH - 3, barWidth - gap, 3);
        ctx.fillRect(x, centerY + barH, barWidth - gap, 3);
      } else {
        ctx.fillRect(x, height - barH - 3, barWidth - gap, 3);
      }
    }

    // Center line in mirror mode
    if (mirror) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + bassBoost * 0.3})`;
      ctx.fillRect(0, centerY - 1, width, 2);
    }

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = height / 10;
    for (let y = gridSpacing; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  reset(): void {
    this.initialized = false;
    this.barHeights = [];
  }
}
