/**
 * Forest Fireflies Background Effect
 * Glowing particles, tree silhouettes, magical forest atmosphere
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface Firefly {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  brightness: number;
  hue: number;
  speed: number;
  glowPhase: number;
}

export class ForestFirefliesEffect extends GenreBackgroundEffect {
  readonly id = 'forest-fireflies';
  readonly name = 'Forest Fireflies';
  readonly parameters: EffectParameter[] = [
    slider('fireflyCount', 'Firefly Count', 40, 15, 80, 1),
    slider('glowIntensity', 'Glow Intensity', 0.8, 0.3, 1, 0.1),
    slider('treeCount', 'Tree Silhouettes', 5, 2, 10, 1),
    boolean('moonlight', 'Show Moon', true),
    slider('mistDensity', 'Mist Density', 0.4, 0, 1, 0.1),
  ];

  private fireflies: Firefly[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const fireflyCount = this.getParameter<number>('fireflyCount');
    const glowIntensity = this.getParameter<number>('glowIntensity');
    const treeCount = this.getParameter<number>('treeCount');
    const moonlight = this.getParameter<boolean>('moonlight');
    const mistDensity = this.getParameter<number>('mistDensity');

    if (!this.initialized || this.fireflies.length !== fireflyCount) {
      this.initFireflies(width, height, fireflyCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;

    // Night sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#0a0a20');
    skyGradient.addColorStop(0.4, '#0f1525');
    skyGradient.addColorStop(0.7, '#101820');
    skyGradient.addColorStop(1, '#050810');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw moon
    if (moonlight) {
      this.drawMoon(ctx, width, height, bassBoost);
    }

    // Draw distant trees
    this.drawTrees(ctx, width, height, treeCount);

    // Draw mist layers
    if (mistDensity > 0) {
      this.drawMist(ctx, width, height, currentTime, mistDensity, midBoost);
    }

    // Update and draw fireflies
    this.updateAndDrawFireflies(
      ctx,
      width,
      height,
      currentTime,
      glowIntensity,
      bassBoost,
      trebleBoost
    );

    // Ground silhouette
    this.drawGround(ctx, width, height);
  }

  private initFireflies(width: number, height: number, count: number): void {
    this.fireflies = [];
    for (let i = 0; i < count; i++) {
      const x = random(0, width);
      const y = random(height * 0.2, height * 0.8);
      this.fireflies.push({
        x,
        y,
        targetX: x + random(-100, 100),
        targetY: y + random(-50, 50),
        size: random(2, 5),
        brightness: random(0.5, 1),
        hue: random(40, 80), // Yellow to green
        speed: random(0.3, 0.8),
        glowPhase: random(0, Math.PI * 2),
      });
    }
  }

  private drawMoon(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bassBoost: number
  ): void {
    const moonX = width * 0.8;
    const moonY = height * 0.15;
    const moonRadius = 40 + bassBoost * 10;

    // Moon glow
    const glowGradient = ctx.createRadialGradient(
      moonX,
      moonY,
      moonRadius * 0.5,
      moonX,
      moonY,
      moonRadius * 4
    );
    glowGradient.addColorStop(0, 'rgba(200, 200, 180, 0.3)');
    glowGradient.addColorStop(0.3, 'rgba(150, 150, 130, 0.15)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    // Moon body
    const moonGradient = ctx.createRadialGradient(
      moonX - moonRadius * 0.3,
      moonY - moonRadius * 0.3,
      0,
      moonX,
      moonY,
      moonRadius
    );
    moonGradient.addColorStop(0, '#fffff0');
    moonGradient.addColorStop(0.5, '#f0f0d0');
    moonGradient.addColorStop(1, '#d0d0b0');
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTrees(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + width / count / 2;
      const treeHeight = height * random(0.4, 0.7);
      const baseWidth = random(60, 120);

      ctx.fillStyle = '#050810';

      // Tree trunk
      ctx.fillRect(x - 10, height - treeHeight * 0.3, 20, treeHeight * 0.3);

      // Tree canopy (triangular pine shape)
      ctx.beginPath();
      ctx.moveTo(x, height - treeHeight);
      ctx.lineTo(x + baseWidth, height - treeHeight * 0.3);
      ctx.lineTo(x - baseWidth, height - treeHeight * 0.3);
      ctx.closePath();
      ctx.fill();

      // Second layer
      ctx.beginPath();
      ctx.moveTo(x, height - treeHeight * 0.85);
      ctx.lineTo(x + baseWidth * 0.8, height - treeHeight * 0.4);
      ctx.lineTo(x - baseWidth * 0.8, height - treeHeight * 0.4);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawMist(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    density: number,
    midBoost: number
  ): void {
    const layers = 3;

    for (let layer = 0; layer < layers; layer++) {
      const y = height * (0.5 + layer * 0.15);
      const alpha = (0.05 + density * 0.1) * (1 + midBoost * 0.3);

      ctx.save();

      // Animated wavy mist
      ctx.beginPath();
      ctx.moveTo(0, y);

      for (let x = 0; x <= width; x += 20) {
        const wave = Math.sin(x * 0.01 + time * 0.5 + layer) * 30;
        ctx.lineTo(x, y + wave);
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const mistGradient = ctx.createLinearGradient(0, y - 50, 0, y + 100);
      mistGradient.addColorStop(0, 'transparent');
      mistGradient.addColorStop(0.3, `rgba(100, 120, 140, ${alpha})`);
      mistGradient.addColorStop(0.7, `rgba(80, 100, 120, ${alpha * 0.7})`);
      mistGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = mistGradient;
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndDrawFireflies(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    intensity: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    for (const firefly of this.fireflies) {
      // Move towards target
      const dx = firefly.targetX - firefly.x;
      const dy = firefly.targetY - firefly.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        // Pick new target
        firefly.targetX = firefly.x + random(-100, 100);
        firefly.targetY = firefly.y + random(-50, 50);
        // Keep in bounds
        firefly.targetX = Math.max(50, Math.min(width - 50, firefly.targetX));
        firefly.targetY = Math.max(height * 0.2, Math.min(height * 0.8, firefly.targetY));
      } else {
        firefly.x += (dx / dist) * firefly.speed * (1 + bassBoost * 0.5);
        firefly.y += (dy / dist) * firefly.speed * (1 + bassBoost * 0.5);
      }

      // Pulsing glow
      const pulse = Math.sin(time * 3 + firefly.glowPhase) * 0.3 + 0.7;
      const glow = pulse * firefly.brightness * intensity * (1 + trebleBoost * 0.5);
      const size = firefly.size * (1 + bassBoost * 0.3);

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        firefly.x,
        firefly.y,
        0,
        firefly.x,
        firefly.y,
        size * 8
      );
      glowGradient.addColorStop(0, `hsla(${firefly.hue}, 100%, 70%, ${glow * 0.8})`);
      glowGradient.addColorStop(0.2, `hsla(${firefly.hue}, 90%, 60%, ${glow * 0.4})`);
      glowGradient.addColorStop(0.5, `hsla(${firefly.hue}, 80%, 50%, ${glow * 0.1})`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, size * 8, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `hsla(${firefly.hue}, 100%, 90%, ${glow})`;
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const groundGradient = ctx.createLinearGradient(0, height * 0.85, 0, height);
    groundGradient.addColorStop(0, 'transparent');
    groundGradient.addColorStop(0.3, 'rgba(5, 8, 16, 0.5)');
    groundGradient.addColorStop(1, '#050810');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height * 0.85, width, height * 0.15);
  }

  reset(): void {
    this.initialized = false;
    this.fireflies = [];
  }
}
