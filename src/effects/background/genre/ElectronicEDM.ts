/**
 * Electronic/EDM Background Effect
 * Neon grids, laser beams, synthwave aesthetics
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Laser {
  startX: number;
  startY: number;
  angle: number;
  color: string;
  speed: number;
}

export class ElectronicEDMEffect extends GenreBackgroundEffect {
  readonly id = 'electronic-edm';
  readonly name = 'Electronic/EDM';
  readonly parameters: EffectParameter[] = [
    slider('laserDensity', 'Laser Density', 0.5, 0, 1, 0.05),
    slider('gridIntensity', 'Grid Intensity', 0.4, 0, 1, 0.05),
    boolean('waveformDisplay', 'Waveform Display', true),
    slider('neonGlow', 'Neon Glow', 0.7, 0, 1, 0.05),
    slider('horizonHeight', 'Horizon Height', 0.6, 0.4, 0.8, 0.05),
  ];

  private lasers: Laser[] = [];
  private gridOffset = 0;

  private readonly neonColors = ['#ff00ff', '#00ffff', '#ff0066', '#00ff99', '#ffff00'];

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const laserDensity = this.getParameter<number>('laserDensity');
    const gridIntensity = this.getParameter<number>('gridIntensity');
    const waveformDisplay = this.getParameter<boolean>('waveformDisplay');
    const neonGlow = this.getParameter<number>('neonGlow');
    const horizonHeight = this.getParameter<number>('horizonHeight');

    // Synthwave gradient background
    const horizonY = height * horizonHeight;
    this.drawSynthwaveBackground(ctx, width, height, horizonY);

    // Perspective grid
    if (gridIntensity > 0) {
      this.drawPerspectiveGrid(
        ctx,
        width,
        height,
        horizonY,
        gridIntensity,
        audioData.bass,
        currentTime
      );
    }

    // Sun/orb at horizon
    this.drawSynthwaveSun(ctx, width, horizonY, audioData.mid, neonGlow);

    // Lasers
    if (laserDensity > 0) {
      this.updateAndDrawLasers(ctx, width, height, laserDensity, audioData, currentTime);
    }

    // Waveform visualization
    if (waveformDisplay && audioData.raw) {
      this.drawWaveform(ctx, width, height, audioData.raw, neonGlow);
    }

    // Scanlines
    this.drawScanlines(ctx, width, height, 0.05);

    // Glow overlay
    if (neonGlow > 0.5) {
      ctx.fillStyle = `rgba(150, 0, 255, ${(neonGlow - 0.5) * 0.1})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawSynthwaveBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number
  ): void {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, '#0a0020');
    skyGradient.addColorStop(0.5, '#1a0040');
    skyGradient.addColorStop(1, '#ff0080');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGradient.addColorStop(0, '#200040');
    groundGradient.addColorStop(1, '#000010');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  private drawPerspectiveGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    intensity: number,
    bass: number,
    _time: number
  ): void {
    const vanishX = width / 2;
    const gridSpeed = 50 + (bass / 255) * 100;
    this.gridOffset = (this.gridOffset + gridSpeed * 0.016) % 100;

    ctx.strokeStyle = `rgba(255, 0, 255, ${intensity * 0.6})`;
    ctx.lineWidth = 1;

    // Horizontal lines (moving toward viewer)
    const numHorizontalLines = 20;
    for (let i = 0; i < numHorizontalLines; i++) {
      const baseY =
        horizonY + ((i + this.gridOffset / 100) / numHorizontalLines) * (height - horizonY);
      const perspective = (baseY - horizonY) / (height - horizonY);
      const lineWidth = perspective * width * 1.5;
      const startX = vanishX - lineWidth / 2;
      const endX = vanishX + lineWidth / 2;

      ctx.globalAlpha = perspective * intensity;
      ctx.beginPath();
      ctx.moveTo(startX, baseY);
      ctx.lineTo(endX, baseY);
      ctx.stroke();
    }

    // Vertical lines (converging to vanishing point)
    ctx.globalAlpha = intensity * 0.6;
    const numVerticalLines = 15;
    for (let i = 0; i <= numVerticalLines; i++) {
      const bottomX = (i / numVerticalLines) * width;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawSynthwaveSun(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    mid: number,
    glow: number
  ): void {
    const centerX = width / 2;
    const radius = 80 + (mid / 255) * 20;

    // Glow
    const glowRadius = radius * 2;
    const glowGradient = ctx.createRadialGradient(
      centerX,
      horizonY,
      radius,
      centerX,
      horizonY,
      glowRadius
    );
    glowGradient.addColorStop(0, `rgba(255, 100, 0, ${glow * 0.5})`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, horizonY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sun with horizontal stripes
    const sunGradient = ctx.createLinearGradient(
      centerX,
      horizonY - radius,
      centerX,
      horizonY + radius
    );
    sunGradient.addColorStop(0, '#ffff00');
    sunGradient.addColorStop(0.5, '#ff6600');
    sunGradient.addColorStop(1, '#ff0066');

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX, horizonY, radius, Math.PI, 0); // Only top half
    ctx.fill();

    // Stripe cutouts
    ctx.fillStyle = '#0a0020';
    const stripeCount = 5;
    for (let i = 0; i < stripeCount; i++) {
      const y = horizonY - radius + (i * 2 + 1) * (radius / (stripeCount * 2));
      const stripeWidth = Math.sqrt(radius * radius - Math.pow(y - horizonY, 2)) * 2;
      ctx.fillRect(centerX - stripeWidth / 2, y, stripeWidth, 3);
    }
  }

  private updateAndDrawLasers(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: number,
    audioData: { bass: number; mid: number; treble: number },
    _time: number
  ): void {
    // Add new lasers based on audio
    if (audioData.treble > 150 && this.lasers.length < 10 * density && Math.random() > 0.7) {
      this.lasers.push({
        startX: random(0, width),
        startY: 0,
        angle: random(Math.PI * 0.3, Math.PI * 0.7),
        color: this.neonColors[Math.floor(random(0, this.neonColors.length))],
        speed: random(2, 5),
      });
    }

    // Update and draw lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.startY += laser.speed;

      // Remove off-screen lasers
      if (laser.startY > height) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Draw laser beam
      const endX = laser.startX + Math.cos(laser.angle) * height * 2;
      const endY = laser.startY + Math.sin(laser.angle) * height * 2;

      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(laser.startX, laser.startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }
  }

  private drawWaveform(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    raw: Uint8Array,
    glow: number
  ): void {
    const centerY = height * 0.3;
    const waveHeight = 50;

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10 * glow;

    ctx.beginPath();
    const sliceWidth = width / raw.length;

    for (let i = 0; i < raw.length; i++) {
      const x = i * sliceWidth;
      const y = centerY + (raw[i] / 128 - 1) * waveHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawScanlines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opacity: number
  ): void {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  }

  reset(): void {
    this.lasers = [];
    this.gridOffset = 0;
  }
}
