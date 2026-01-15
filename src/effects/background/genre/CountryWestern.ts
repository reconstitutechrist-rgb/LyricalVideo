/**
 * Country/Western Background Effect
 * Desert sunset, dusty trails, and rustic Americana
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, enumParam } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface DustParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
}

interface Tumbleweed {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
}

export class CountryWesternEffect extends GenreBackgroundEffect {
  readonly id = 'country-western';
  readonly name = 'Country/Western';
  readonly parameters: EffectParameter[] = [
    slider('sunsetIntensity', 'Sunset Intensity', 0.8, 0, 1, 0.05),
    slider('dustAmount', 'Dust Amount', 0.5, 0, 1, 0.05),
    enumParam('silhouetteType', 'Silhouette Type', 'cacti', [
      { value: 'cacti', label: 'Cacti' },
      { value: 'mountains', label: 'Mountains' },
      { value: 'horses', label: 'Horses' },
      { value: 'mixed', label: 'Mixed' },
    ]),
    slider('rusticOverlay', 'Rustic Overlay', 0.3, 0, 1, 0.05),
    boolean('tumbleweeds', 'Tumbleweeds', true),
  ];

  private dustParticles: DustParticle[] = [];
  private tumbleweeds: Tumbleweed[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime, deltaTime } = context;

    const sunsetIntensity = this.getParameter<number>('sunsetIntensity');
    const dustAmount = this.getParameter<number>('dustAmount');
    const silhouetteType = this.getParameter<string>('silhouetteType');
    const rusticOverlay = this.getParameter<number>('rusticOverlay');
    const tumbleweeds = this.getParameter<boolean>('tumbleweeds');

    // Initialize
    if (!this.initialized) {
      this.initDust(width, height, dustAmount);
      this.initialized = true;
    }

    // Desert sunset gradient
    this.drawSunsetBackground(ctx, width, height, sunsetIntensity, audioData.bass);

    // Sun
    this.drawSun(ctx, width, height, audioData.mid);

    // Silhouettes
    this.drawSilhouettes(ctx, width, height, silhouetteType);

    // Ground
    this.drawDesertGround(ctx, width, height);

    // Dust particles
    this.updateAndDrawDust(ctx, width, height, dustAmount, deltaTime);

    // Tumbleweeds
    if (tumbleweeds) {
      this.updateAndDrawTumbleweeds(ctx, width, height, deltaTime, audioData.treble);
    }

    // Rustic/sepia overlay
    if (rusticOverlay > 0) {
      this.drawRusticOverlay(ctx, width, height, rusticOverlay);
    }

    // Heat shimmer effect
    this.drawHeatShimmer(ctx, width, height, currentTime, audioData.energy);

    // Vignette
    this.addVignette(ctx, width, height, 0.4);
  }

  private initDust(width: number, height: number, amount: number): void {
    this.dustParticles = [];
    const count = Math.floor(100 * amount);

    for (let i = 0; i < count; i++) {
      this.dustParticles.push({
        x: random(0, width),
        y: random(height * 0.5, height),
        size: random(1, 4),
        opacity: random(0.1, 0.4),
        vx: random(0.5, 2),
        vy: random(-0.5, 0.5),
      });
    }
  }

  private drawSunsetBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    bass: number
  ): void {
    const bassBoost = 1 + (bass / 255) * 0.2;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    // Sunset colors with intensity control
    const orangeIntensity = Math.floor(100 + intensity * 155);
    const redIntensity = Math.floor(50 + intensity * 100);

    gradient.addColorStop(0, `rgb(${Math.floor(30 * bassBoost)}, 10, 40)`);
    gradient.addColorStop(0.3, `rgb(${redIntensity}, 30, 50)`);
    gradient.addColorStop(0.5, `rgb(${orangeIntensity}, 60, 30)`);
    gradient.addColorStop(0.7, `rgb(255, ${Math.floor(140 * intensity)}, 50)`);
    gradient.addColorStop(
      0.85,
      `rgb(255, ${Math.floor(200 * intensity)}, ${Math.floor(100 * intensity)})`
    );
    gradient.addColorStop(1, '#8b4513');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawSun(ctx: CanvasRenderingContext2D, width: number, height: number, mid: number): void {
    const sunX = width * 0.7;
    const sunY = height * 0.4;
    const baseRadius = Math.min(width, height) * 0.15;
    const pulseRadius = baseRadius * (1 + (mid / 255) * 0.05);

    // Sun glow
    const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, pulseRadius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
    glowGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.2)');
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, pulseRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun body
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, pulseRadius);
    sunGradient.addColorStop(0, '#fff8dc');
    sunGradient.addColorStop(0.5, '#ffd700');
    sunGradient.addColorStop(1, '#ff8c00');

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSilhouettes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: string
  ): void {
    ctx.save();
    ctx.fillStyle = '#1a0a00';

    const horizonY = height * 0.75;

    if (type === 'cacti' || type === 'mixed') {
      this.drawCactus(ctx, width * 0.15, horizonY, 80);
      this.drawCactus(ctx, width * 0.85, horizonY, 100);
      if (type === 'mixed') {
        this.drawCactus(ctx, width * 0.5, horizonY, 60);
      }
    }

    if (type === 'mountains' || type === 'mixed') {
      this.drawMountains(ctx, width, height, horizonY);
    }

    if (type === 'horses') {
      this.drawHorseSilhouette(ctx, width * 0.3, horizonY, 0.8);
      this.drawHorseSilhouette(ctx, width * 0.6, horizonY, 1);
    }

    ctx.restore();
  }

  private drawCactus(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    height: number
  ): void {
    const trunkWidth = height * 0.15;

    // Main trunk
    ctx.fillRect(x - trunkWidth / 2, baseY - height, trunkWidth, height);

    // Arms
    const armY = baseY - height * 0.6;
    const armWidth = trunkWidth * 0.8;
    const armLength = height * 0.3;

    // Left arm
    ctx.fillRect(x - trunkWidth / 2 - armLength, armY, armLength, armWidth);
    ctx.fillRect(x - trunkWidth / 2 - armLength, armY - armLength * 0.6, armWidth, armLength * 0.6);

    // Right arm
    ctx.fillRect(x + trunkWidth / 2, armY - height * 0.1, armLength, armWidth);
    ctx.fillRect(
      x + trunkWidth / 2 + armLength - armWidth,
      armY - height * 0.1 - armLength * 0.5,
      armWidth,
      armLength * 0.5
    );
  }

  private drawMountains(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number
  ): void {
    // Background mountains
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width * 0.2, horizonY - 80);
    ctx.lineTo(width * 0.35, horizonY - 120);
    ctx.lineTo(width * 0.5, horizonY - 60);
    ctx.lineTo(width * 0.7, horizonY - 150);
    ctx.lineTo(width * 0.85, horizonY - 90);
    ctx.lineTo(width, horizonY - 40);
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fill();
  }

  private drawHorseSilhouette(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    scale: number
  ): void {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);

    // Simplified horse shape
    ctx.beginPath();
    // Body
    ctx.ellipse(0, -30, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(35, -50, 15, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(20, -50, 20, 25);

    // Legs
    ctx.fillRect(-25, -15, 8, 35);
    ctx.fillRect(-10, -15, 8, 35);
    ctx.fillRect(10, -15, 8, 35);
    ctx.fillRect(25, -15, 8, 35);

    // Tail
    ctx.beginPath();
    ctx.moveTo(-40, -25);
    ctx.quadraticCurveTo(-60, -20, -55, 0);
    ctx.quadraticCurveTo(-50, -15, -40, -20);
    ctx.fill();

    ctx.restore();
  }

  private drawDesertGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const groundY = height * 0.85;

    const gradient = ctx.createLinearGradient(0, groundY, 0, height);
    gradient.addColorStop(0, '#8b4513');
    gradient.addColorStop(0.5, '#a0522d');
    gradient.addColorStop(1, '#654321');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, width, height - groundY);
  }

  private updateAndDrawDust(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _amount: number,
    _deltaTime: number
  ): void {
    for (const dust of this.dustParticles) {
      dust.x += dust.vx;
      dust.y += dust.vy;

      // Wrap around
      if (dust.x > width) {
        dust.x = 0;
        dust.y = random(height * 0.5, height);
      }

      ctx.save();
      ctx.fillStyle = `rgba(210, 180, 140, ${dust.opacity})`;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndDrawTumbleweeds(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    deltaTime: number,
    treble: number
  ): void {
    // Add new tumbleweeds occasionally
    if (Math.random() < 0.005 && this.tumbleweeds.length < 3) {
      this.tumbleweeds.push({
        x: -50,
        y: height * random(0.7, 0.9),
        size: random(20, 40),
        rotation: 0,
        speed: random(2, 4),
      });
    }

    const speedBoost = 1 + (treble / 255) * 0.5;

    for (let i = this.tumbleweeds.length - 1; i >= 0; i--) {
      const tw = this.tumbleweeds[i];

      tw.x += tw.speed * speedBoost;
      tw.rotation += 0.1 * speedBoost;
      tw.y += Math.sin(tw.rotation) * 2;

      if (tw.x > width + 50) {
        this.tumbleweeds.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(tw.x, tw.y);
      ctx.rotate(tw.rotation);

      // Draw tumbleweed as crossed lines
      ctx.strokeStyle = '#5c4033';
      ctx.lineWidth = 2;

      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(angle) * tw.size, -Math.sin(angle) * tw.size);
        ctx.lineTo(Math.cos(angle) * tw.size, Math.sin(angle) * tw.size);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawRusticOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    // Sepia/grain overlay
    ctx.save();
    ctx.globalAlpha = intensity * 0.3;
    ctx.fillStyle = '#704214';
    ctx.fillRect(0, 0, width, height);

    // Film grain
    ctx.globalAlpha = intensity * 0.1;
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(random(0, width), random(0, height), 1, 1);
    }

    ctx.restore();
  }

  private drawHeatShimmer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    energy: number
  ): void {
    const intensity = energy * 0.1;
    const shimmerY = height * 0.8;

    ctx.save();
    ctx.globalAlpha = intensity;

    for (let x = 0; x < width; x += 20) {
      const offset = Math.sin(time * 2 + x * 0.05) * 3;
      ctx.fillStyle = 'rgba(255, 200, 150, 0.1)';
      ctx.fillRect(x, shimmerY + offset, 10, 30);
    }

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.dustParticles = [];
    this.tumbleweeds = [];
  }
}
