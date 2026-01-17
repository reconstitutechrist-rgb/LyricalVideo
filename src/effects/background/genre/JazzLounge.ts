/**
 * Jazz/Lounge Background Effect
 * Sophisticated club ambiance with spotlight and smoke
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, color } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface SmokeWisp {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  phase: number;
}

export class JazzLoungeEffect extends GenreBackgroundEffect {
  readonly id = 'jazz-lounge';
  readonly name = 'Jazz/Lounge';
  readonly parameters: EffectParameter[] = [
    slider('spotlightSway', 'Spotlight Sway', 0.5, 0, 1, 0.05),
    slider('smokeDensity', 'Smoke Density', 0.5, 0, 1, 0.05),
    slider('artDecoIntensity', 'Art Deco Elements', 0.4, 0, 1, 0.05),
    color('warmLighting', 'Warm Lighting', '#d4af37'),
    boolean('vinylRecord', 'Show Vinyl Record', true),
  ];

  private smokeWisps: SmokeWisp[] = [];
  private spotlightAngle = 0;
  private vinylRotation = 0;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const spotlightSway = this.getParameter<number>('spotlightSway');
    const smokeDensity = this.getParameter<number>('smokeDensity');
    const artDecoIntensity = this.getParameter<number>('artDecoIntensity');
    const warmLighting = this.getParameter<string>('warmLighting');
    const vinylRecord = this.getParameter<boolean>('vinylRecord');

    // Initialize
    if (!this.initialized) {
      this.initSmoke(width, height, smokeDensity);
      this.initialized = true;
    }

    // Deep blue/purple background
    this.drawBackground(ctx, width, height);

    // Art deco geometric patterns
    if (artDecoIntensity > 0) {
      this.drawArtDeco(ctx, width, height, artDecoIntensity, currentTime);
    }

    // Smoke wisps
    this.updateAndDrawSmoke(ctx, width, height, smokeDensity, currentTime);

    // Moving spotlight
    this.drawSpotlight(ctx, width, height, spotlightSway, audioData.mid, currentTime);

    // Warm ambient glow
    this.drawWarmGlow(ctx, width, height, warmLighting, audioData.bass);

    // Vinyl record in corner
    if (vinylRecord) {
      this.drawVinylRecord(ctx, width, height, audioData.bass, deltaTime);
    }

    // Soft vignette
    this.addVignette(ctx, width, height, 0.5);
  }

  private initSmoke(width: number, height: number, density: number): void {
    this.smokeWisps = [];
    const count = Math.floor(15 * density);
    for (let i = 0; i < count; i++) {
      this.smokeWisps.push({
        x: random(0, width),
        y: random(height * 0.3, height * 0.8),
        size: random(50, 150),
        opacity: random(0.05, 0.15),
        speed: random(0.2, 0.5),
        drift: random(-0.3, 0.3),
        phase: random(0, Math.PI * 2),
      });
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#0d0d25');
    gradient.addColorStop(1, '#050515');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawArtDeco(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    time: number
  ): void {
    ctx.save();
    ctx.globalAlpha = intensity * 0.1;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;

    // Vertical lines
    const lineCount = 10;
    for (let i = 0; i <= lineCount; i++) {
      const x = (width / lineCount) * i;
      const pulse = Math.sin(time * 0.5 + i * 0.3) * 0.5 + 0.5;

      ctx.globalAlpha = intensity * 0.05 * pulse;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal decorative lines
    ctx.globalAlpha = intensity * 0.08;
    for (let i = 0; i < 3; i++) {
      const y = height * 0.2 + i * 30;
      ctx.beginPath();
      ctx.moveTo(width * 0.1, y);
      ctx.lineTo(width * 0.9, y);
      ctx.stroke();
    }

    // Art deco fan shape at top
    ctx.globalAlpha = intensity * 0.1;
    const fanCenter = { x: width / 2, y: 0 };
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 12) * i - Math.PI / 2 + Math.PI / 24;
      ctx.beginPath();
      ctx.moveTo(fanCenter.x, fanCenter.y);
      ctx.lineTo(
        fanCenter.x + Math.cos(angle) * height * 0.3,
        fanCenter.y + Math.sin(angle) * height * 0.3
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private updateAndDrawSmoke(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    density: number,
    time: number
  ): void {
    for (const wisp of this.smokeWisps) {
      wisp.y -= wisp.speed;
      wisp.x += wisp.drift + Math.sin(time + wisp.phase) * 0.3;

      if (wisp.y < -wisp.size) {
        wisp.y = height + wisp.size;
        wisp.x = random(0, width);
      }

      const gradient = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.size);
      gradient.addColorStop(0, `rgba(150, 150, 170, ${wisp.opacity})`);
      gradient.addColorStop(0.5, `rgba(120, 120, 140, ${wisp.opacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, wisp.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSpotlight(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sway: number,
    mid: number,
    time: number
  ): void {
    this.spotlightAngle = Math.sin(time * 0.3) * sway * 0.5;
    const intensity = 0.15 + (mid / 255) * 0.1;

    const spotX = width / 2 + Math.sin(this.spotlightAngle) * width * 0.3;
    const spotY = height * 0.4;

    // Main spotlight beam
    ctx.save();

    const gradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, height * 0.6);
    gradient.addColorStop(0, `rgba(255, 245, 200, ${intensity})`);
    gradient.addColorStop(0.3, `rgba(255, 240, 180, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(spotX, spotY, height * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Spotlight cone from top
    const coneGradient = ctx.createLinearGradient(spotX, 0, spotX, spotY);
    coneGradient.addColorStop(0, `rgba(255, 245, 200, ${intensity * 0.3})`);
    coneGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coneGradient;
    ctx.beginPath();
    ctx.moveTo(spotX - 20, 0);
    ctx.lineTo(spotX - 100, spotY);
    ctx.lineTo(spotX + 100, spotY);
    ctx.lineTo(spotX + 20, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawWarmGlow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string,
    bass: number
  ): void {
    const intensity = 0.05 + (bass / 255) * 0.05;

    // Multiple warm spots
    const spots = [
      { x: width * 0.1, y: height * 0.9 },
      { x: width * 0.9, y: height * 0.9 },
      { x: width * 0.5, y: height * 0.8 },
    ];

    for (const spot of spots) {
      const gradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, width * 0.3);
      gradient.addColorStop(
        0,
        color +
          Math.floor(intensity * 255)
            .toString(16)
            .padStart(2, '0')
      );
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawVinylRecord(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bass: number,
    deltaTime: number
  ): void {
    const centerX = width * 0.1;
    const centerY = height * 0.1;
    const radius = Math.min(width, height) * 0.08;

    // Rotation speed based on bass
    const rotationSpeed = 1 + (bass / 255) * 0.5;
    this.vinylRotation += deltaTime * rotationSpeed;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.vinylRotation);

    // Record body
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Grooves
    ctx.strokeStyle = 'rgba(40, 40, 40, 0.8)';
    ctx.lineWidth = 0.5;
    for (let r = radius * 0.3; r < radius * 0.95; r += 3) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Center hole
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Light reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, -0.3, 0.3);
    ctx.stroke();

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.smokeWisps = [];
    this.spotlightAngle = 0;
    this.vinylRotation = 0;
  }
}
