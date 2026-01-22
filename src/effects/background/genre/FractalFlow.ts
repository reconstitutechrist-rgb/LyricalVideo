/**
 * Fractal Flow Background Effect
 * Perlin noise-inspired organic flowing patterns
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class FractalFlowEffect extends GenreBackgroundEffect {
  readonly id = 'fractal-flow';
  readonly name = 'Fractal Flow';
  readonly parameters: EffectParameter[] = [
    slider('flowSpeed', 'Flow Speed', 0.5, 0.1, 1, 0.05),
    slider('density', 'Pattern Density', 0.6, 0.3, 1, 0.1),
    slider('colorRange', 'Color Range', 0.7, 0, 1, 0.1),
    boolean('darkMode', 'Dark Mode', true),
    slider('waveAmplitude', 'Wave Amplitude', 0.5, 0, 1, 0.1),
  ];

  private noiseOffset = 0;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const flowSpeed = this.getParameter<number>('flowSpeed');
    const density = this.getParameter<number>('density');
    const colorRange = this.getParameter<number>('colorRange');
    const darkMode = this.getParameter<boolean>('darkMode');
    const waveAmplitude = this.getParameter<number>('waveAmplitude');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    this.noiseOffset += flowSpeed * 0.02 * (1 + bassBoost * 0.5);

    // Background
    if (darkMode) {
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0a0a15');
      bgGradient.addColorStop(0.5, '#0f0a1a');
      bgGradient.addColorStop(1, '#050510');
      ctx.fillStyle = bgGradient;
    } else {
      ctx.fillStyle = '#f0f0f5';
    }
    ctx.fillRect(0, 0, width, height);

    // Draw flowing lines
    const lineCount = Math.floor(20 + density * 40);
    const stepY = height / lineCount;

    for (let i = 0; i < lineCount; i++) {
      const baseY = i * stepY;
      const hue = (200 + i * colorRange * 5 + currentTime * 20) % 360;
      const saturation = 50 + midBoost * 30;
      const lightness = darkMode ? 40 + trebleBoost * 30 : 30 + trebleBoost * 20;
      const alpha = 0.3 + (i / lineCount) * 0.4;

      ctx.beginPath();
      ctx.moveTo(0, baseY);

      // Draw wavy line with pseudo-noise
      for (let x = 0; x <= width; x += 5) {
        const noiseValue = this.pseudoNoise(
          x * 0.005 + this.noiseOffset,
          i * 0.3,
          currentTime * 0.1
        );
        const amplitude = (30 + bassBoost * 50) * waveAmplitude;
        const y = baseY + noiseValue * amplitude;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.lineWidth = 2 + bassBoost * 3;
      ctx.stroke();

      // Add glow effect on high audio
      if (bassBoost > 0.5 && i % 3 === 0) {
        ctx.strokeStyle = `hsla(${hue}, ${saturation + 20}%, ${lightness + 20}%, ${alpha * 0.5})`;
        ctx.lineWidth = 8 + bassBoost * 10;
        ctx.stroke();
      }
    }

    // Add floating particles
    const particleCount = Math.floor(15 + density * 25);
    for (let i = 0; i < particleCount; i++) {
      const px = this.pseudoNoise(i * 0.5, currentTime * 0.1, 0) * width;
      const py = this.pseudoNoise(i * 0.7, 0, currentTime * 0.1) * height;
      const size = 3 + trebleBoost * 8;
      const hue = (280 + i * 10) % 360;

      const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
      particleGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${0.6 + midBoost * 0.4})`);
      particleGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(px, py, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central glow
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.5
    );
    const glowHue = (240 + currentTime * 10) % 360;
    glowGradient.addColorStop(0, `hsla(${glowHue}, 60%, 50%, ${0.1 + bassBoost * 0.15})`);
    glowGradient.addColorStop(0.5, `hsla(${glowHue}, 40%, 30%, ${0.05 + midBoost * 0.1})`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private pseudoNoise(x: number, y: number, z: number): number {
    // Simple pseudo-noise function
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    const base = n - Math.floor(n);

    // Add octaves for more natural look
    const octave2 = Math.sin(x * 25.123 + y * 156.456 + z * 75.438) * 21879.2726;
    const o2 = (octave2 - Math.floor(octave2)) * 0.5;

    const octave3 = Math.sin(x * 50.246 + y * 312.912 + z * 150.876) * 10939.6363;
    const o3 = (octave3 - Math.floor(octave3)) * 0.25;

    return ((base + o2 + o3) / 1.75) * 2 - 1; // Normalize to -1 to 1
  }

  reset(): void {
    this.noiseOffset = 0;
  }
}
