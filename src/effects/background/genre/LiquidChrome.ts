/**
 * Liquid Chrome Background Effect
 * Metallic flowing reflections, mercury-like surface
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class LiquidChromeEffect extends GenreBackgroundEffect {
  readonly id = 'liquid-chrome';
  readonly name = 'Liquid Chrome';
  readonly parameters: EffectParameter[] = [
    slider('flowSpeed', 'Flow Speed', 0.5, 0.1, 1, 0.1),
    slider('reflectivity', 'Reflectivity', 0.7, 0.3, 1, 0.1),
    slider('distortion', 'Distortion', 0.5, 0, 1, 0.1),
    boolean('colorTint', 'Color Tint', true),
    slider('rippleCount', 'Ripple Count', 5, 2, 10, 1),
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const flowSpeed = this.getParameter<number>('flowSpeed');
    const reflectivity = this.getParameter<number>('reflectivity');
    const distortion = this.getParameter<number>('distortion');
    const colorTint = this.getParameter<boolean>('colorTint');
    const rippleCount = this.getParameter<number>('rippleCount');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Base metallic gradient
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#1a1a2e');
    baseGradient.addColorStop(0.5, '#2a2a4e');
    baseGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw chrome layers
    this.drawChromeLayer(ctx, width, height, currentTime, flowSpeed, reflectivity, bassBoost, 0);
    this.drawChromeLayer(
      ctx,
      width,
      height,
      currentTime,
      flowSpeed * 0.7,
      reflectivity * 0.8,
      midBoost,
      1
    );

    // Draw ripples
    this.drawRipples(
      ctx,
      width,
      height,
      currentTime,
      rippleCount,
      distortion,
      bassBoost,
      trebleBoost
    );

    // Color tint overlay
    if (colorTint) {
      this.drawColorTint(ctx, width, height, currentTime, midBoost);
    }

    // Specular highlights
    this.drawSpecularHighlights(ctx, width, height, currentTime, reflectivity, trebleBoost);

    // Edge reflections
    this.drawEdgeReflections(ctx, width, height, currentTime, reflectivity, bassBoost);
  }

  private drawChromeLayer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    reflect: number,
    audioBoost: number,
    layer: number
  ): void {
    const resolution = 20;
    const cellWidth = width / resolution;
    const cellHeight = height / resolution;

    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const x = col * cellWidth;
        const y = row * cellHeight;

        // Calculate chrome value using multiple sine waves
        const noise1 =
          Math.sin(x * 0.01 + time * speed + layer) * Math.cos(y * 0.01 + time * speed * 0.7);
        const noise2 = Math.sin(x * 0.02 + y * 0.02 + time * speed * 1.3) * 0.5;
        const noise3 = Math.cos(x * 0.015 - y * 0.01 + time * speed * 0.9 + layer * 2) * 0.3;

        const chromeValue = (noise1 + noise2 + noise3 + 1) / 2;
        const brightness = 40 + chromeValue * 60 * reflect + audioBoost * 30;

        // Create metallic gradient for cell
        const cellGradient = ctx.createLinearGradient(x, y, x + cellWidth, y + cellHeight);

        const baseColor = Math.floor(brightness);
        const highlightColor = Math.floor(brightness + 30);
        const shadowColor = Math.floor(brightness - 20);

        cellGradient.addColorStop(0, `rgb(${shadowColor}, ${shadowColor}, ${shadowColor + 10})`);
        cellGradient.addColorStop(0.5, `rgb(${baseColor}, ${baseColor}, ${baseColor + 15})`);
        cellGradient.addColorStop(
          1,
          `rgb(${highlightColor}, ${highlightColor}, ${highlightColor + 20})`
        );

        ctx.fillStyle = cellGradient;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      }
    }
  }

  private drawRipples(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    count: number,
    distortion: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    for (let i = 0; i < count; i++) {
      const rippleX = width * (0.2 + (i % 3) * 0.3);
      const rippleY = height * (0.3 + Math.floor(i / 3) * 0.4);
      const phase = time * 2 + i * 1.5;
      const maxRadius = 150 + bassBoost * 100;
      const radius = ((phase % 3) / 3) * maxRadius;

      if (radius > 10) {
        const alpha = (1 - radius / maxRadius) * 0.3 * distortion;

        // Ripple gradient
        const gradient = ctx.createRadialGradient(
          rippleX,
          rippleY,
          radius - 10,
          rippleX,
          rippleY,
          radius + 10
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.5})`);
        gradient.addColorStop(0.5, `rgba(200, 200, 220, ${alpha})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(rippleX, rippleY, radius + 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawColorTint(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    midBoost: number
  ): void {
    // Subtle color reflections
    const tintGradient = ctx.createRadialGradient(
      width * 0.3,
      height * 0.3,
      0,
      width * 0.3,
      height * 0.3,
      width * 0.6
    );

    const hue1 = (time * 20) % 360;
    const hue2 = (hue1 + 180) % 360;

    tintGradient.addColorStop(0, `hsla(${hue1}, 50%, 50%, ${0.1 + midBoost * 0.1})`);
    tintGradient.addColorStop(0.5, 'transparent');
    tintGradient.addColorStop(1, `hsla(${hue2}, 40%, 40%, ${0.05 + midBoost * 0.05})`);

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tintGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawSpecularHighlights(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    reflectivity: number,
    trebleBoost: number
  ): void {
    const highlightCount = 5;

    for (let i = 0; i < highlightCount; i++) {
      const x = width * (0.2 + (Math.sin(time * 0.3 + i * 2) + 1) * 0.3);
      const y = height * (0.2 + (Math.cos(time * 0.4 + i * 1.5) + 1) * 0.3);
      const size = 30 + trebleBoost * 50;

      const highlight = ctx.createRadialGradient(x, y, 0, x, y, size);
      highlight.addColorStop(0, `rgba(255, 255, 255, ${0.3 * reflectivity})`);
      highlight.addColorStop(0.3, `rgba(255, 255, 255, ${0.1 * reflectivity})`);
      highlight.addColorStop(1, 'transparent');

      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEdgeReflections(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    reflectivity: number,
    bassBoost: number
  ): void {
    // Top edge reflection
    const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2);
    topGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * reflectivity})`);
    topGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, height * 0.2);

    // Bottom edge shadow
    const bottomGradient = ctx.createLinearGradient(0, height * 0.8, 0, height);
    bottomGradient.addColorStop(0, 'transparent');
    bottomGradient.addColorStop(1, `rgba(0, 0, 0, ${0.3 + bassBoost * 0.2})`);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, height * 0.8, width, height * 0.2);

    // Moving highlight streak
    const streakX = ((time * 100 * reflectivity) % (width + 200)) - 100;
    const streakGradient = ctx.createLinearGradient(streakX - 50, 0, streakX + 50, 0);
    streakGradient.addColorStop(0, 'transparent');
    streakGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * reflectivity})`);
    streakGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = streakGradient;
    ctx.fillRect(streakX - 50, 0, 100, height);
  }

  reset(): void {
    // No persistent state to reset
  }
}
