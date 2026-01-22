/**
 * VHS Glitch Background Effect
 * Tracking lines, RGB split, tape noise, retro video distortion
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

export class VHSGlitchEffect extends GenreBackgroundEffect {
  readonly id = 'vhs-glitch';
  readonly name = 'VHS Glitch';
  readonly parameters: EffectParameter[] = [
    slider('glitchIntensity', 'Glitch Intensity', 0.5, 0, 1, 0.1),
    slider('trackingError', 'Tracking Error', 0.4, 0, 1, 0.1),
    slider('noiseAmount', 'Noise Amount', 0.5, 0, 1, 0.1),
    boolean('rgbSplit', 'RGB Split', true),
    boolean('timestamp', 'Show Timestamp', true),
  ];

  private glitchTimer = 0;
  private glitchActive = false;
  private glitchOffset = 0;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const glitchIntensity = this.getParameter<number>('glitchIntensity');
    const trackingError = this.getParameter<number>('trackingError');
    const noiseAmount = this.getParameter<number>('noiseAmount');
    const rgbSplit = this.getParameter<boolean>('rgbSplit');
    const timestamp = this.getParameter<boolean>('timestamp');

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const isBeat = audioData.isBeat;

    // Trigger glitch on beat
    if (isBeat && random(0, 1) < glitchIntensity) {
      this.glitchActive = true;
      this.glitchTimer = 0.1 + random(0, 0.2);
      this.glitchOffset = random(-30, 30);
    }

    if (this.glitchTimer > 0) {
      this.glitchTimer -= 0.016;
    } else {
      this.glitchActive = false;
    }

    // Base gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1a0a2e');
    bgGradient.addColorStop(0.5, '#0f0f2f');
    bgGradient.addColorStop(1, '#0a0520');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // VHS color bars background pattern
    this.drawColorBars(ctx, width, height, currentTime, midBoost);

    // Tracking error lines
    this.drawTrackingError(ctx, width, height, currentTime, trackingError, bassBoost);

    // RGB split effect
    if (rgbSplit) {
      this.drawRGBSplit(ctx, width, height, glitchIntensity, this.glitchActive);
    }

    // Horizontal glitch displacement
    if (this.glitchActive) {
      this.drawGlitchDisplacement(ctx, width, height, glitchIntensity);
    }

    // Static noise
    this.drawNoise(ctx, width, height, noiseAmount, this.glitchActive);

    // Scanlines
    this.drawScanlines(ctx, width, height);

    // VHS timestamp
    if (timestamp) {
      this.drawTimestamp(ctx, width, height, currentTime);
    }

    // VHS edge distortion
    this.drawEdgeDistortion(ctx, width, height);

    // Play/Pause indicator
    this.drawPlayIndicator(ctx, width, height);
  }

  private drawColorBars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    midBoost: number
  ): void {
    const barHeight = 4;
    const speed = 0.5;

    for (let y = 0; y < height; y += barHeight * 3) {
      const yOffset = (y + time * 50 * speed) % height;
      const hue = (y * 0.5 + time * 20) % 360;
      const alpha = 0.05 + midBoost * 0.05;

      ctx.fillStyle = `hsla(${hue}, 60%, 40%, ${alpha})`;
      ctx.fillRect(0, yOffset, width, barHeight);
    }
  }

  private drawTrackingError(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    intensity: number,
    bassBoost: number
  ): void {
    const lineCount = Math.floor(3 + intensity * 5);

    for (let i = 0; i < lineCount; i++) {
      const y = ((time * 100 + i * 200) % (height + 100)) - 50;
      const lineHeight = 2 + random(0, 5) + bassBoost * 10;
      const offset = Math.sin(time * 2 + i) * 20 * intensity;

      // White tracking line
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + intensity * 0.4})`;
      ctx.fillRect(offset, y, width, lineHeight);

      // Color fringing
      ctx.fillStyle = `rgba(255, 0, 100, ${0.2 * intensity})`;
      ctx.fillRect(offset - 3, y, width, lineHeight * 0.5);

      ctx.fillStyle = `rgba(0, 255, 255, ${0.2 * intensity})`;
      ctx.fillRect(offset + 3, y + lineHeight * 0.5, width, lineHeight * 0.5);
    }
  }

  private drawRGBSplit(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    glitchActive: boolean
  ): void {
    const offset = glitchActive ? 5 + intensity * 15 : 2 + intensity * 3;

    // Create color channel overlays
    ctx.globalCompositeOperation = 'screen';

    // Red channel shift
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + intensity * 0.1})`;
    ctx.fillRect(-offset, 0, width, height);

    // Blue channel shift
    ctx.fillStyle = `rgba(0, 0, 255, ${0.1 + intensity * 0.1})`;
    ctx.fillRect(offset, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
  }

  private drawGlitchDisplacement(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    const sliceCount = Math.floor(5 + intensity * 10);

    for (let i = 0; i < sliceCount; i++) {
      const y = random(0, height);
      const sliceHeight = random(2, 20);
      const offset = random(-50, 50) * intensity + this.glitchOffset;

      // Draw displaced slice
      ctx.fillStyle = `rgba(${random(100, 255)}, ${random(100, 255)}, ${random(100, 255)}, 0.8)`;
      ctx.fillRect(offset, y, width, sliceHeight);
    }
  }

  private drawNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number,
    intense: boolean
  ): void {
    const noiseIntensity = intense ? amount * 1.5 : amount;
    const pixelSize = intense ? 4 : 2;

    ctx.globalAlpha = 0.05 + noiseIntensity * 0.15;

    for (let x = 0; x < width; x += pixelSize) {
      for (let y = 0; y < height; y += pixelSize) {
        if (random(0, 1) > 0.7) {
          const brightness = random(0, 255);
          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1);
    }
  }

  private drawTimestamp(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ): void {
    const date = new Date(1995, 5, 15, 14, 30, Math.floor(time) % 60);
    const dateStr = date
      .toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
      .toUpperCase();
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'left';

    // Timestamp background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(width - 180, height - 50, 170, 40);

    // Timestamp text with slight jitter
    const jitterX = random(-1, 1);
    const jitterY = random(-1, 1);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(dateStr, width - 170 + jitterX, height - 32 + jitterY);
    ctx.fillText(timeStr, width - 170 + jitterX, height - 18 + jitterY);
  }

  private drawEdgeDistortion(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Top edge noise
    const topGradient = ctx.createLinearGradient(0, 0, 0, 30);
    topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    topGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, 30);

    // Bottom edge noise
    const bottomGradient = ctx.createLinearGradient(0, height - 30, 0, height);
    bottomGradient.addColorStop(0, 'transparent');
    bottomGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, height - 30, width, 30);
  }

  private drawPlayIndicator(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // PLAY text
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    // Play triangle
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20, 35);
    ctx.lineTo(35, 27.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillText('PLAY', 45, 32);

    // SP indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('SP', 20, height - 20);
  }

  reset(): void {
    this.glitchTimer = 0;
    this.glitchActive = false;
    this.glitchOffset = 0;
  }
}
