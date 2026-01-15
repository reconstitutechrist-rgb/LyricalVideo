/**
 * Reggae/Tropical Background Effect
 * Island vibes with palm trees, sunset, and rastafarian colors
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Palm {
  x: number;
  baseY: number;
  trunkHeight: number;
  frondCount: number;
  swayPhase: number;
  swaySpeed: number;
}

interface Wave {
  y: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  drift: number;
}

export class ReggaeTropicalEffect extends GenreBackgroundEffect {
  readonly id = 'reggae-tropical';
  readonly name = 'Reggae/Tropical';
  readonly parameters: EffectParameter[] = [
    slider('sunsetPosition', 'Sunset Position', 0.6, 0.4, 0.8, 0.05),
    slider('palmCount', 'Palm Trees', 3, 1, 5, 1),
    slider('waveAmplitude', 'Wave Amplitude', 30, 10, 50, 5),
    boolean('smokeParticles', 'Smoke Particles', true),
    boolean('rastaColors', 'Rasta Colors', true),
  ];

  private palms: Palm[] = [];
  private waves: Wave[] = [];
  private smoke: SmokeParticle[] = [];
  private initialized = false;

  private readonly rastaGreen = '#006400';
  private readonly rastaYellow = '#ffd700';
  private readonly rastaRed = '#dc143c';

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const sunsetPosition = this.getParameter<number>('sunsetPosition');
    const palmCount = this.getParameter<number>('palmCount');
    const waveAmplitude = this.getParameter<number>('waveAmplitude');
    const smokeEnabled = this.getParameter<boolean>('smokeParticles');
    const rastaColors = this.getParameter<boolean>('rastaColors');

    // Initialize
    if (!this.initialized || this.palms.length !== palmCount) {
      this.initPalms(width, height, palmCount);
      this.initWaves(height);
      this.initialized = true;
    }

    // Sunset gradient background
    this.drawSunsetBackground(ctx, width, height, sunsetPosition, rastaColors, audioData.bass);

    // Sun
    this.drawSun(ctx, width, height, sunsetPosition, audioData.mid);

    // Ocean waves
    this.drawWaves(ctx, width, height, waveAmplitude, currentTime, audioData.bass);

    // Palm trees
    this.drawPalms(ctx, width, height, currentTime, audioData.bass);

    // Smoke particles
    if (smokeEnabled) {
      this.updateAndDrawSmoke(ctx, width, height, deltaTime);
    }

    // Rasta stripe overlay
    if (rastaColors) {
      this.drawRastaStripes(ctx, width, height, audioData.treble);
    }
  }

  private initPalms(width: number, height: number, count: number): void {
    this.palms = [];
    for (let i = 0; i < count; i++) {
      const x = width * (0.15 + (i / count) * 0.7);
      this.palms.push({
        x,
        baseY: height * 0.75,
        trunkHeight: random(100, 180),
        frondCount: Math.floor(random(5, 8)),
        swayPhase: random(0, Math.PI * 2),
        swaySpeed: random(0.3, 0.6),
      });
    }
  }

  private initWaves(height: number): void {
    this.waves = [];
    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      this.waves.push({
        y: height * 0.8 + i * 15,
        amplitude: 20 - i * 3,
        frequency: 0.01 + i * 0.003,
        speed: 1.5 - i * 0.2,
        phase: random(0, Math.PI * 2),
      });
    }
  }

  private drawSunsetBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sunsetPos: number,
    rasta: boolean,
    bass: number
  ): void {
    const horizonY = height * sunsetPos;
    const _bassBoost = 1 + (bass / 255) * 0.2;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (rasta) {
      skyGradient.addColorStop(0, '#1a0a00');
      skyGradient.addColorStop(0.3, this.rastaRed);
      skyGradient.addColorStop(0.6, this.rastaYellow);
      skyGradient.addColorStop(1, '#ff6b00');
    } else {
      skyGradient.addColorStop(0, '#1a0a30');
      skyGradient.addColorStop(0.4, '#ff4500');
      skyGradient.addColorStop(0.7, '#ff8c00');
      skyGradient.addColorStop(1, '#ffd700');
    }

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    oceanGradient.addColorStop(0, '#004466');
    oceanGradient.addColorStop(0.5, '#003355');
    oceanGradient.addColorStop(1, '#002244');

    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  private drawSun(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sunsetPos: number,
    mid: number
  ): void {
    const sunX = width * 0.5;
    const sunY = height * sunsetPos;
    const baseRadius = Math.min(width, height) * 0.12;
    const pulseRadius = baseRadius * (1 + (mid / 255) * 0.1);

    // Sun glow
    const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, pulseRadius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.3)');
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, pulseRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun body
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, pulseRadius);
    sunGradient.addColorStop(0, '#ffff80');
    sunGradient.addColorStop(0.7, '#ffcc00');
    sunGradient.addColorStop(1, '#ff8800');

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWaves(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amplitude: number,
    time: number,
    bass: number
  ): void {
    const bassBoost = 1 + (bass / 255) * 0.3;

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      const alpha = 0.3 + (i / this.waves.length) * 0.3;

      ctx.save();
      ctx.fillStyle = `rgba(0, 100, 150, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 5) {
        const waveY =
          wave.y +
          Math.sin(x * wave.frequency + time * wave.speed + wave.phase) *
            wave.amplitude *
            bassBoost;
        ctx.lineTo(x, waveY);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPalms(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    bass: number
  ): void {
    for (const palm of this.palms) {
      const sway = Math.sin(time * palm.swaySpeed + palm.swayPhase) * 15;
      const bassSway = (bass / 255) * 10;
      const totalSway = sway + bassSway;

      // Trunk
      ctx.save();
      ctx.strokeStyle = '#3d2914';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(palm.x, palm.baseY);
      ctx.quadraticCurveTo(
        palm.x + totalSway * 0.3,
        palm.baseY - palm.trunkHeight * 0.5,
        palm.x + totalSway,
        palm.baseY - palm.trunkHeight
      );
      ctx.stroke();

      // Fronds
      const topX = palm.x + totalSway;
      const topY = palm.baseY - palm.trunkHeight;

      for (let i = 0; i < palm.frondCount; i++) {
        const angle = (i / palm.frondCount) * Math.PI - Math.PI * 0.5;
        const frondLength = 80 + random(-20, 20);
        const frondSway = Math.sin(time * 1.5 + i) * 5;

        const endX = topX + Math.cos(angle + frondSway * 0.02) * frondLength;
        const endY = topY + Math.sin(angle) * frondLength * 0.6;

        // Frond stem
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo((topX + endX) / 2, (topY + endY) / 2 - 20, endX, endY);
        ctx.stroke();

        // Frond leaves
        ctx.fillStyle = '#228b22';
        for (let j = 0.2; j < 1; j += 0.15) {
          const leafX = topX + (endX - topX) * j;
          const leafY = topY + (endY - topY) * j - 20 * (1 - j);
          const leafSize = 15 * (1 - j * 0.5);

          ctx.beginPath();
          ctx.ellipse(leafX, leafY, leafSize, 3, angle, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private updateAndDrawSmoke(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _deltaTime: number
  ): void {
    // Add new smoke
    if (Math.random() < 0.1 && this.smoke.length < 20) {
      this.smoke.push({
        x: random(width * 0.3, width * 0.7),
        y: height * 0.7,
        size: random(20, 40),
        opacity: random(0.2, 0.4),
        drift: random(-0.5, 0.5),
      });
    }

    // Update and draw
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.y -= 1;
      s.x += s.drift + Math.sin(s.y * 0.02) * 0.5;
      s.size *= 1.01;
      s.opacity *= 0.98;

      if (s.opacity < 0.01 || s.y < height * 0.2) {
        this.smoke.splice(i, 1);
        continue;
      }

      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      gradient.addColorStop(0, `rgba(200, 200, 180, ${s.opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawRastaStripes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    treble: number
  ): void {
    const intensity = 0.05 + (treble / 255) * 0.05;

    ctx.save();
    ctx.globalAlpha = intensity;

    // Top stripe - red
    ctx.fillStyle = this.rastaRed;
    ctx.fillRect(0, 0, width, 5);

    // Middle stripe - yellow
    ctx.fillStyle = this.rastaYellow;
    ctx.fillRect(0, 5, width, 5);

    // Bottom stripe - green
    ctx.fillStyle = this.rastaGreen;
    ctx.fillRect(0, 10, width, 5);

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.palms = [];
    this.waves = [];
    this.smoke = [];
  }
}
