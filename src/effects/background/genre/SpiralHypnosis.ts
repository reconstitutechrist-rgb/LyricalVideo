/**
 * Spiral Hypnosis Background Effect
 * Rotating spirals with depth illusion and hypnotic patterns
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class SpiralHypnosisEffect extends GenreBackgroundEffect {
  readonly id = 'spiral-hypnosis';
  readonly name = 'Spiral Hypnosis';
  readonly parameters: EffectParameter[] = [
    slider('spiralCount', 'Spiral Arms', 4, 2, 8, 1),
    slider('rotationSpeed', 'Rotation Speed', 0.4, 0.1, 1, 0.05),
    slider('depth', 'Depth Effect', 0.7, 0, 1, 0.1),
    boolean('colorful', 'Colorful Mode', true),
    slider('tunnelSpeed', 'Tunnel Speed', 0.5, 0, 1, 0.1),
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const spiralCount = this.getParameter<number>('spiralCount');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const depth = this.getParameter<number>('depth');
    const colorful = this.getParameter<boolean>('colorful');
    const tunnelSpeed = this.getParameter<number>('tunnelSpeed');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Deep black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) * 0.8;

    // Tunnel zoom effect
    const tunnelOffset = (currentTime * tunnelSpeed) % 1;

    // Draw multiple spiral layers for depth
    const layers = 12;
    for (let layer = layers; layer > 0; layer--) {
      const layerRatio = layer / layers;
      const layerDepth = (layerRatio + tunnelOffset) % 1;
      const scale = 0.1 + layerDepth * 0.9;
      const radius = maxRadius * scale;

      const rotation = currentTime * rotationSpeed * (1 + bassBoost * 0.5);
      const layerRotation = rotation + layer * 0.2;

      // Color based on depth and audio
      let hue: number;
      if (colorful) {
        hue = (layerDepth * 360 + currentTime * 30 + midBoost * 60) % 360;
      } else {
        hue = 270; // Purple monochrome
      }
      const saturation = 60 + trebleBoost * 40;
      const lightness = 20 + layerDepth * 40 + bassBoost * 20;
      const alpha = (0.3 + layerDepth * 0.5) * (1 + depth * 0.3);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(layerRotation);

      // Draw spiral arms
      for (let arm = 0; arm < spiralCount; arm++) {
        const armAngle = (arm / spiralCount) * Math.PI * 2;

        ctx.save();
        ctx.rotate(armAngle);

        // Spiral path
        ctx.beginPath();
        const spiralTurns = 2 + depth;
        const points = 60;

        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const r = radius * t;
          const theta = t * Math.PI * 2 * spiralTurns;
          const x = Math.cos(theta) * r;
          const y = Math.sin(theta) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, radius, 0);
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`);
        gradient.addColorStop(
          1,
          `hsla(${(hue + 60) % 360}, ${saturation}%, ${lightness + 20}%, ${alpha * 0.3})`
        );

        ctx.strokeStyle = gradient;
        ctx.lineWidth = (3 + bassBoost * 4) * scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
    }

    // Pulsing center
    const pulseSize = 30 + bassBoost * 50 + (isBeat ? 30 : 0);
    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      pulseSize
    );
    const centerHue = colorful ? (currentTime * 50) % 360 : 280;
    centerGradient.addColorStop(0, `hsla(${centerHue}, 100%, 90%, ${0.8 + bassBoost * 0.2})`);
    centerGradient.addColorStop(0.3, `hsla(${centerHue}, 80%, 60%, 0.6)`);
    centerGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Outer vignette for depth
    const vignetteGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      maxRadius * 0.3,
      centerX,
      centerY,
      maxRadius
    );
    vignetteGradient.addColorStop(0, 'transparent');
    vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    // No persistent state to reset
  }
}
