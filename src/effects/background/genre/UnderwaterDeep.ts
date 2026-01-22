/**
 * Underwater Deep Background Effect
 * Bubbles, caustics, light rays, and ocean atmosphere
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
}

export class UnderwaterDeepEffect extends GenreBackgroundEffect {
  readonly id = 'underwater-deep';
  readonly name = 'Underwater Deep';
  readonly parameters: EffectParameter[] = [
    slider('depth', 'Depth', 0.6, 0, 1, 0.1),
    slider('bubbleCount', 'Bubble Count', 25, 10, 50, 1),
    slider('lightIntensity', 'Light Rays', 0.7, 0, 1, 0.1),
    boolean('caustics', 'Caustic Patterns', true),
    slider('currentSpeed', 'Current Speed', 0.4, 0, 1, 0.1),
  ];

  private bubbles: Bubble[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const depth = this.getParameter<number>('depth');
    const bubbleCount = this.getParameter<number>('bubbleCount');
    const lightIntensity = this.getParameter<number>('lightIntensity');
    const caustics = this.getParameter<boolean>('caustics');
    const currentSpeed = this.getParameter<number>('currentSpeed');

    if (!this.initialized || this.bubbles.length !== bubbleCount) {
      this.initBubbles(width, height, bubbleCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Deep ocean gradient
    const depthFactor = 0.3 + depth * 0.7;
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(
      0,
      `rgba(0, ${80 * (1 - depthFactor)}, ${120 * (1 - depthFactor) + 50}, 1)`
    );
    bgGradient.addColorStop(
      0.3,
      `rgba(0, ${40 * (1 - depthFactor)}, ${80 * (1 - depthFactor) + 30}, 1)`
    );
    bgGradient.addColorStop(
      0.7,
      `rgba(0, ${20 * (1 - depthFactor)}, ${50 * (1 - depthFactor) + 20}, 1)`
    );
    bgGradient.addColorStop(1, `rgba(0, 5, ${30 * (1 - depthFactor) + 10}, 1)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw caustic patterns
    if (caustics) {
      this.drawCaustics(ctx, width, height, currentTime, currentSpeed, midBoost);
    }

    // Draw light rays from surface
    if (lightIntensity > 0) {
      this.drawLightRays(ctx, width, height, currentTime, lightIntensity, bassBoost);
    }

    // Update and draw bubbles
    this.updateAndDrawBubbles(
      ctx,
      width,
      height,
      currentTime,
      currentSpeed,
      bassBoost,
      trebleBoost
    );

    // Particles/debris floating
    this.drawFloatingParticles(ctx, width, height, currentTime, currentSpeed, midBoost);

    // Depth fog at bottom
    const fogGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    fogGradient.addColorStop(0, 'transparent');
    fogGradient.addColorStop(1, `rgba(0, 10, 30, ${0.5 + depth * 0.3})`);
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private initBubbles(width: number, height: number, count: number): void {
    this.bubbles = [];
    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: random(0, width),
        y: random(0, height),
        size: random(3, 15),
        speed: random(30, 80),
        wobble: random(10, 30),
        wobbleSpeed: random(2, 5),
      });
    }
  }

  private drawCaustics(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    midBoost: number
  ): void {
    const cellSize = 80;
    const cols = Math.ceil(width / cellSize) + 1;
    const rows = Math.ceil(height / cellSize) + 1;

    ctx.save();
    ctx.globalAlpha = 0.15 + midBoost * 0.1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseX = col * cellSize;
        const baseY = row * cellSize;

        // Animated distortion
        const distortX = Math.sin(time * speed + row * 0.5 + col * 0.3) * 20;
        const distortY = Math.cos(time * speed * 0.7 + row * 0.3 + col * 0.5) * 20;

        const x = baseX + distortX;
        const y = baseY + distortY;

        // Draw caustic cell
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x + cellSize * 0.3 + distortX * 0.5,
          y + cellSize * 0.2,
          x + cellSize * 0.7 + distortY * 0.5,
          y + cellSize * 0.3,
          x + cellSize,
          y
        );
        ctx.bezierCurveTo(
          x + cellSize + distortX * 0.3,
          y + cellSize * 0.5,
          x + cellSize * 0.8,
          y + cellSize + distortY * 0.3,
          x + cellSize * 0.5,
          y + cellSize
        );
        ctx.bezierCurveTo(
          x + cellSize * 0.2,
          y + cellSize * 0.8,
          x - distortX * 0.3,
          y + cellSize * 0.5,
          x,
          y
        );

        ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawLightRays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    intensity: number,
    bassBoost: number
  ): void {
    const rayCount = 5;

    for (let i = 0; i < rayCount; i++) {
      const baseX = (i / rayCount) * width + width / (rayCount * 2);
      const sway = Math.sin(time * 0.3 + i * 0.5) * 50;
      const x = baseX + sway;

      const gradient = ctx.createLinearGradient(x, 0, x + 100, height);
      const alpha = (0.1 + bassBoost * 0.15) * intensity;
      gradient.addColorStop(0, `rgba(200, 230, 255, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(150, 200, 255, ${alpha * 0.7})`);
      gradient.addColorStop(0.7, `rgba(100, 180, 255, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - 20, 0);
      ctx.lineTo(x + 80 + sway * 0.5, height);
      ctx.lineTo(x + 150 + sway * 0.5, height);
      ctx.lineTo(x + 50, 0);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndDrawBubbles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    for (const bubble of this.bubbles) {
      // Move bubble up
      bubble.y -= bubble.speed * 0.016 * (1 + bassBoost * 0.5);

      // Reset if off screen
      if (bubble.y < -bubble.size) {
        bubble.y = height + bubble.size;
        bubble.x = random(0, width);
      }

      // Wobble
      const wobbleX = Math.sin(time * bubble.wobbleSpeed + bubble.y * 0.01) * bubble.wobble * speed;
      const x = bubble.x + wobbleX;

      // Draw bubble
      const size = bubble.size * (1 + trebleBoost * 0.3);

      // Bubble gradient
      const gradient = ctx.createRadialGradient(
        x - size * 0.3,
        bubble.y - size * 0.3,
        0,
        x,
        bubble.y,
        size
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 180, 255, 0.1)');

      ctx.beginPath();
      ctx.arc(x, bubble.y, size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bubble rim
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Highlight
      ctx.beginPath();
      ctx.arc(x - size * 0.3, bubble.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    }
  }

  private drawFloatingParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    midBoost: number
  ): void {
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const x = (i * 137.5 + time * 10 * speed) % width;
      const y = (i * 97.3 + time * 5 * speed) % height;
      const size = 1 + (i % 3);
      const alpha = 0.2 + midBoost * 0.2;

      ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  reset(): void {
    this.initialized = false;
    this.bubbles = [];
  }
}
