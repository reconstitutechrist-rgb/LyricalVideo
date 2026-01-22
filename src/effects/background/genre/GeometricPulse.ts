/**
 * Geometric Pulse Background Effect
 * Concentric polygons pulsing with bass, rhythmic geometric patterns
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class GeometricPulseEffect extends GenreBackgroundEffect {
  readonly id = 'geometric-pulse';
  readonly name = 'Geometric Pulse';
  readonly parameters: EffectParameter[] = [
    slider('sides', 'Polygon Sides', 6, 3, 12, 1),
    slider('layers', 'Layers', 8, 3, 15, 1),
    slider('pulseIntensity', 'Pulse Intensity', 0.7, 0, 1, 0.05),
    slider('rotationSpeed', 'Rotation Speed', 0.3, 0, 1, 0.05),
    boolean('alternateRotation', 'Alternate Rotation', true),
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const sides = this.getParameter<number>('sides');
    const layers = this.getParameter<number>('layers');
    const pulseIntensity = this.getParameter<number>('pulseIntensity');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const alternateRotation = this.getParameter<boolean>('alternateRotation');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Dark gradient background
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, '#0d0d1a');
    gradient.addColorStop(1, '#050510');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    // Draw concentric polygons
    for (let i = layers; i > 0; i--) {
      const layerRatio = i / layers;
      const baseRadius = maxRadius * layerRatio;

      // Pulse effect based on bass
      const pulseOffset = isBeat ? 20 * pulseIntensity : 0;
      const audioPulse = bassBoost * 30 * pulseIntensity * layerRatio;
      const radius = baseRadius + audioPulse + pulseOffset;

      // Rotation with alternating direction
      const direction = alternateRotation && i % 2 === 0 ? -1 : 1;
      const rotation = currentTime * rotationSpeed * direction + (i * Math.PI) / layers;

      // Color based on layer and audio
      const hue = (240 + i * 20 + midBoost * 60) % 360;
      const saturation = 60 + trebleBoost * 40;
      const lightness = 30 + layerRatio * 30 + bassBoost * 20;
      const alpha = 0.3 + layerRatio * 0.4;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // Draw polygon
      ctx.beginPath();
      for (let j = 0; j < sides; j++) {
        const angle = (j / sides) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Fill with gradient
      const fillGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      fillGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.5})`);
      fillGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness * 0.5}%, ${alpha})`);
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // Stroke
      ctx.strokeStyle = `hsla(${hue}, ${saturation + 20}%, ${lightness + 30}%, ${alpha + 0.2})`;
      ctx.lineWidth = 2 + bassBoost * 2;
      ctx.stroke();

      ctx.restore();
    }

    // Central glow on beat
    if (isBeat || bassBoost > 0.6) {
      const glowRadius = 50 + bassBoost * 100;
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius
      );
      glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 + bassBoost * 0.4})`);
      glowGradient.addColorStop(0.3, `rgba(180, 100, 255, ${0.2 + bassBoost * 0.2})`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius + 20 + bassBoost * 30, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100, 50, 200, ${0.2 + midBoost * 0.3})`;
    ctx.lineWidth = 3 + trebleBoost * 5;
    ctx.stroke();
  }

  reset(): void {
    // No persistent state to reset
  }
}
