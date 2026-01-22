/**
 * Synthwave Sunset Background Effect
 * 80s aesthetic with palm trees, sun, neon grid horizon
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';

export class SynthwaveSunsetEffect extends GenreBackgroundEffect {
  readonly id = 'synthwave-sunset';
  readonly name = 'Synthwave Sunset';
  readonly parameters: EffectParameter[] = [
    slider('sunSize', 'Sun Size', 0.6, 0.3, 1, 0.1),
    slider('gridSpeed', 'Grid Speed', 0.5, 0, 1, 0.1),
    slider('neonIntensity', 'Neon Intensity', 0.8, 0.3, 1, 0.1),
    boolean('showPalmTrees', 'Palm Trees', true),
    boolean('scanlines', 'Scanlines', true),
  ];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const sunSize = this.getParameter<number>('sunSize');
    const gridSpeed = this.getParameter<number>('gridSpeed');
    const neonIntensity = this.getParameter<number>('neonIntensity');
    const showPalmTrees = this.getParameter<boolean>('showPalmTrees');
    const scanlines = this.getParameter<boolean>('scanlines');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    const horizonY = height * 0.5;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, '#0a0020');
    skyGradient.addColorStop(0.3, '#1a0040');
    skyGradient.addColorStop(0.6, '#400060');
    skyGradient.addColorStop(0.8, '#ff0080');
    skyGradient.addColorStop(1, '#ff6600');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Sun
    this.drawSun(ctx, width, height, horizonY, sunSize, bassBoost, neonIntensity);

    // Ground (reflection gradient)
    const groundGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGradient.addColorStop(0, '#200040');
    groundGradient.addColorStop(0.3, '#100020');
    groundGradient.addColorStop(1, '#000010');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Neon grid
    this.drawGrid(ctx, width, height, horizonY, currentTime, gridSpeed, neonIntensity, bassBoost);

    // Palm trees
    if (showPalmTrees) {
      this.drawPalmTree(ctx, width * 0.1, horizonY, height * 0.35, currentTime, bassBoost);
      this.drawPalmTree(ctx, width * 0.9, horizonY, height * 0.3, currentTime, bassBoost);
    }

    // Stars
    this.drawStars(ctx, width, horizonY * 0.6, currentTime, trebleBoost);

    // Horizontal neon lines in sky
    this.drawNeonLines(ctx, width, horizonY, neonIntensity, midBoost);

    // Scanlines overlay
    if (scanlines) {
      this.drawScanlines(ctx, width, height);
    }
  }

  private drawSun(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    sizeMultiplier: number,
    bassBoost: number,
    intensity: number
  ): void {
    const sunRadius = Math.min(width, height) * 0.2 * sizeMultiplier * (1 + bassBoost * 0.1);
    const sunX = width / 2;
    const sunY = horizonY - sunRadius * 0.3;

    // Sun glow
    const glowGradient = ctx.createRadialGradient(
      sunX,
      sunY,
      sunRadius * 0.8,
      sunX,
      sunY,
      sunRadius * 2
    );
    glowGradient.addColorStop(0, `rgba(255, 100, 0, ${0.5 * intensity})`);
    glowGradient.addColorStop(0.5, `rgba(255, 0, 100, ${0.2 * intensity})`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Sun body with stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    // Sun gradient
    const sunGradient = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGradient.addColorStop(0, '#ffff00');
    sunGradient.addColorStop(0.5, '#ff6600');
    sunGradient.addColorStop(1, '#ff0066');
    ctx.fillStyle = sunGradient;
    ctx.fill();

    // Horizontal stripes (retrowave sun effect)
    ctx.fillStyle = '#0a0020';
    const stripeCount = 8;
    for (let i = 0; i < stripeCount; i++) {
      const stripeY = sunY - sunRadius + (i * 2 + 1) * (sunRadius / stripeCount);
      const stripeHeight = (sunRadius / stripeCount) * 0.8 * (i / stripeCount);
      if (stripeY > sunY - sunRadius * 0.3) {
        ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeHeight);
      }
    }

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    time: number,
    speed: number,
    intensity: number,
    bassBoost: number
  ): void {
    const gridHeight = height - horizonY;
    const perspective = 0.85;

    ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 * intensity + bassBoost * 0.3})`;
    ctx.lineWidth = 2;

    // Horizontal lines (moving towards viewer)
    const lineCount = 20;
    const moveOffset = (time * speed * 2) % 1;

    for (let i = 0; i < lineCount; i++) {
      const t = (i / lineCount + moveOffset) % 1;
      const y = horizonY + Math.pow(t, perspective) * gridHeight;

      if (y > horizonY) {
        ctx.globalAlpha = Math.pow(t, 0.5) * intensity;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Vertical lines (converging to horizon)
    ctx.globalAlpha = intensity;
    const verticalCount = 15;
    const vanishX = width / 2;

    for (let i = 0; i <= verticalCount; i++) {
      const ratio = i / verticalCount;
      const bottomX = ratio * width;
      const topX = vanishX + (bottomX - vanishX) * 0.1;

      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawPalmTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    treeHeight: number,
    time: number,
    bassBoost: number
  ): void {
    const sway = Math.sin(time * 0.5) * 5 * (1 + bassBoost * 0.5);

    ctx.fillStyle = '#000000';

    // Trunk
    ctx.beginPath();
    ctx.moveTo(x - 8, groundY);
    ctx.quadraticCurveTo(
      x - 5 + sway * 0.3,
      groundY - treeHeight * 0.5,
      x + sway,
      groundY - treeHeight
    );
    ctx.quadraticCurveTo(x + 5 + sway * 0.3, groundY - treeHeight * 0.5, x + 8, groundY);
    ctx.fill();

    // Fronds
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI - Math.PI / 2 + Math.sin(time * 0.3 + i) * 0.1;
      const length = treeHeight * 0.4;

      ctx.beginPath();
      ctx.moveTo(x + sway, groundY - treeHeight);

      const endX = x + sway + Math.cos(angle) * length;
      const endY = groundY - treeHeight + Math.sin(angle) * length;
      const ctrlX = x + sway + Math.cos(angle) * length * 0.5;
      const ctrlY = groundY - treeHeight + Math.sin(angle) * length * 0.3;

      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.quadraticCurveTo(ctrlX, ctrlY + 10, x + sway, groundY - treeHeight + 5);
      ctx.fill();
    }
  }

  private drawStars(
    ctx: CanvasRenderingContext2D,
    width: number,
    maxY: number,
    time: number,
    trebleBoost: number
  ): void {
    const starCount = 50;

    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 97.3) % maxY;
      const twinkle = Math.sin(time * 3 + i) * 0.3 + 0.7;
      const size = 1 + (i % 2) + trebleBoost * 2;

      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawNeonLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    intensity: number,
    midBoost: number
  ): void {
    const lines = [
      { y: horizonY * 0.3, color: '#00ffff', width: 2 },
      { y: horizonY * 0.5, color: '#ff00ff', width: 1.5 },
      { y: horizonY * 0.7, color: '#ff0080', width: 1 },
    ];

    for (const line of lines) {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width * (1 + midBoost * 0.5);
      ctx.globalAlpha = 0.3 * intensity;
      ctx.beginPath();
      ctx.moveTo(0, line.y);
      ctx.lineTo(width, line.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  }

  reset(): void {
    // No persistent state to reset
  }
}
