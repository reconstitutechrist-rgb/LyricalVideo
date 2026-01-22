/**
 * Sacred Geometry Background Effect
 * Flower of life, Metatron's cube, and geometric sacred patterns
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class SacredGeometryEffect extends GenreBackgroundEffect {
  readonly id = 'sacred-geometry';
  readonly name = 'Sacred Geometry';
  readonly parameters: EffectParameter[] = [
    slider('complexity', 'Pattern Complexity', 0.6, 0.3, 1, 0.1),
    slider('rotationSpeed', 'Rotation Speed', 0.2, 0, 0.5, 0.05),
    slider('glowIntensity', 'Glow Intensity', 0.7, 0, 1, 0.1),
    boolean('showFlowerOfLife', 'Flower of Life', true),
    boolean('showMetatron', "Metatron's Cube", true),
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const complexity = this.getParameter<number>('complexity');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const glowIntensity = this.getParameter<number>('glowIntensity');
    const showFlowerOfLife = this.getParameter<boolean>('showFlowerOfLife');
    const showMetatron = this.getParameter<boolean>('showMetatron');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Dark cosmic background
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, '#0a0520');
    bgGradient.addColorStop(0.5, '#050210');
    bgGradient.addColorStop(1, '#000005');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    const rotation = currentTime * rotationSpeed;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Glow effect settings
    const glowColor = `rgba(200, 150, 255, ${glowIntensity * (0.3 + bassBoost * 0.4)})`;
    const lineColor = `rgba(255, 220, 180, ${0.6 + midBoost * 0.4})`;

    // Draw Flower of Life
    if (showFlowerOfLife) {
      this.drawFlowerOfLife(
        ctx,
        baseRadius,
        complexity,
        lineColor,
        glowColor,
        bassBoost,
        trebleBoost
      );
    }

    // Draw Metatron's Cube
    if (showMetatron) {
      const metatronRadius = baseRadius * 0.8;
      ctx.save();
      ctx.rotate(Math.PI / 6 + currentTime * rotationSpeed * 0.5);
      this.drawMetatronsCube(ctx, metatronRadius, lineColor, glowColor, midBoost, isBeat);
      ctx.restore();
    }

    ctx.restore();

    // Pulsing central glow
    const pulseIntensity = 0.15 + bassBoost * 0.3 + (isBeat ? 0.2 : 0);
    const centerGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      baseRadius * 0.5
    );
    centerGlow.addColorStop(0, `rgba(255, 200, 150, ${pulseIntensity})`);
    centerGlow.addColorStop(0.5, `rgba(200, 150, 255, ${pulseIntensity * 0.5})`);
    centerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    // Outer ring glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.1 + bassBoost * 20, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 100, 200, ${0.2 + trebleBoost * 0.3})`;
    ctx.lineWidth = 2 + bassBoost * 3;
    ctx.stroke();
  }

  private drawFlowerOfLife(
    ctx: CanvasRenderingContext2D,
    radius: number,
    complexity: number,
    lineColor: string,
    glowColor: string,
    bassBoost: number,
    trebleBoost: number
  ): void {
    const circleRadius = radius / 3;
    const layers = Math.floor(1 + complexity * 2);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5 + bassBoost * 1.5;

    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // First ring of 6 circles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * circleRadius;
      const y = Math.sin(angle) * circleRadius;

      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Additional layers
    if (layers >= 2) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
        const x = Math.cos(angle) * circleRadius * 2;
        const y = Math.sin(angle) * circleRadius * 2;

        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Intermediate circles
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(angle) * circleRadius * Math.sqrt(3);
        const y = Math.sin(angle) * circleRadius * Math.sqrt(3);

        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Outer boundary circle
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius * 3 + trebleBoost * 10, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2 + bassBoost * 2;
    ctx.stroke();
  }

  private drawMetatronsCube(
    ctx: CanvasRenderingContext2D,
    radius: number,
    lineColor: string,
    glowColor: string,
    midBoost: number,
    isBeat: boolean
  ): void {
    // 13 circles of Metatron's Cube
    const positions: [number, number][] = [
      [0, 0], // Center
    ];

    // Inner hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.5;
      const y = Math.sin(angle) * radius * 0.5;
      positions.push([x, y]);
    }

    // Outer hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions.push([x, y]);
    }

    // Draw connecting lines (the "cube" structure)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 0.5 + midBoost;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        ctx.beginPath();
        ctx.moveTo(positions[i][0], positions[i][1]);
        ctx.lineTo(positions[j][0], positions[j][1]);
        ctx.stroke();
      }
    }

    // Draw circles at each position
    const circleRadius = radius * 0.15 * (isBeat ? 1.3 : 1);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;

    for (const [x, y] of positions) {
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, circleRadius);
      gradient.addColorStop(0, `rgba(255, 220, 180, ${0.2 + midBoost * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  reset(): void {
    // No persistent state to reset
  }
}
