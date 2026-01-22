/**
 * Disco Fever Background Effect
 * Mirror ball, light beams, dance floor tiles, 70s party vibes
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface LightBeam {
  angle: number;
  hue: number;
  speed: number;
  width: number;
}

export class DiscoFeverEffect extends GenreBackgroundEffect {
  readonly id = 'disco-fever';
  readonly name = 'Disco Fever';
  readonly parameters: EffectParameter[] = [
    slider('beamCount', 'Light Beams', 8, 4, 16, 1),
    slider('rotationSpeed', 'Rotation Speed', 0.5, 0.1, 1, 0.1),
    slider('floorTiles', 'Floor Tiles', 8, 4, 16, 1),
    boolean('mirrorBall', 'Mirror Ball', true),
    slider('colorSpeed', 'Color Speed', 0.5, 0.1, 1, 0.1),
  ];

  private beams: LightBeam[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const beamCount = this.getParameter<number>('beamCount');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const floorTiles = this.getParameter<number>('floorTiles');
    const mirrorBall = this.getParameter<boolean>('mirrorBall');
    const colorSpeed = this.getParameter<number>('colorSpeed');

    if (!this.initialized || this.beams.length !== beamCount) {
      this.initBeams(beamCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Dark background
    ctx.fillStyle = '#0a0010';
    ctx.fillRect(0, 0, width, height);

    // Dance floor
    this.drawDanceFloor(ctx, width, height, floorTiles, currentTime, colorSpeed, bassBoost, isBeat);

    // Light beams from mirror ball
    this.drawLightBeams(ctx, width, height, currentTime, rotationSpeed, midBoost, trebleBoost);

    // Mirror ball
    if (mirrorBall) {
      this.drawMirrorBall(ctx, width, height, currentTime, bassBoost, trebleBoost);
    }

    // Atmospheric fog
    this.drawFog(ctx, width, height, currentTime, midBoost);

    // Sparkles
    this.drawSparkles(ctx, width, height, currentTime, trebleBoost, isBeat);
  }

  private initBeams(count: number): void {
    this.beams = [];
    for (let i = 0; i < count; i++) {
      this.beams.push({
        angle: (i / count) * Math.PI * 2,
        hue: random(0, 360),
        speed: random(0.5, 1.5),
        width: random(20, 40),
      });
    }
  }

  private drawDanceFloor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tiles: number,
    time: number,
    colorSpeed: number,
    bassBoost: number,
    isBeat: boolean
  ): void {
    const floorY = height * 0.6;
    const floorHeight = height - floorY;
    const perspective = 0.3;

    // Floor perspective gradient
    const floorGradient = ctx.createLinearGradient(0, floorY, 0, height);
    floorGradient.addColorStop(0, 'rgba(20, 0, 40, 0.8)');
    floorGradient.addColorStop(1, 'rgba(10, 0, 20, 1)');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, floorY, width, floorHeight);

    // Tiles
    const tileWidth = width / tiles;

    for (let row = 0; row < tiles / 2; row++) {
      for (let col = 0; col < tiles; col++) {
        // Perspective calculation
        const rowRatio = row / (tiles / 2);
        const y = floorY + rowRatio * floorHeight;
        const tileH = (floorHeight / (tiles / 2)) * (1 - rowRatio * perspective);

        const x = col * tileWidth;

        // Checkerboard color with pulsing
        const isLight = (row + col) % 2 === 0;
        const hue = (time * colorSpeed * 50 + col * 30 + row * 20) % 360;
        const pulse = isBeat ? 0.3 : 0;
        const brightness = isLight ? 40 + bassBoost * 30 + pulse * 20 : 15;

        ctx.fillStyle = `hsl(${hue}, 80%, ${brightness}%)`;
        ctx.fillRect(x, y, tileWidth + 1, tileH + 1);

        // Tile border
        ctx.strokeStyle = `hsl(${hue}, 60%, ${brightness + 20}%)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileWidth, tileH);
      }
    }
  }

  private drawLightBeams(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    speed: number,
    midBoost: number,
    trebleBoost: number
  ): void {
    const ballX = width / 2;
    const ballY = height * 0.15;

    for (const beam of this.beams) {
      const angle = beam.angle + time * speed * beam.speed;
      const beamLength = Math.max(width, height);

      const endX = ballX + Math.cos(angle) * beamLength;
      const endY = ballY + Math.sin(angle) * beamLength;

      // Beam gradient
      const gradient = ctx.createLinearGradient(ballX, ballY, endX, endY);
      const hue = (beam.hue + time * 30) % 360;
      const alpha = 0.2 + midBoost * 0.2 + trebleBoost * 0.1;

      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 90%, 60%, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'transparent');

      // Draw beam as triangle
      ctx.beginPath();
      ctx.moveTo(ballX, ballY);
      const perpAngle = angle + Math.PI / 2;
      const beamWidth = beam.width * (1 + midBoost * 0.5);
      ctx.lineTo(endX + Math.cos(perpAngle) * beamWidth, endY + Math.sin(perpAngle) * beamWidth);
      ctx.lineTo(endX - Math.cos(perpAngle) * beamWidth, endY - Math.sin(perpAngle) * beamWidth);
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  private drawMirrorBall(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    const ballX = width / 2;
    const ballY = height * 0.15;
    const radius = 40 + bassBoost * 10;

    // Ball glow
    const glowGradient = ctx.createRadialGradient(ballX, ballY, radius, ballX, ballY, radius * 2.5);
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 + trebleBoost * 0.2})`);
    glowGradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.1)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    const ballGradient = ctx.createRadialGradient(
      ballX - radius * 0.3,
      ballY - radius * 0.3,
      0,
      ballX,
      ballY,
      radius
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.5, '#c0c0c0');
    ballGradient.addColorStop(1, '#808080');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Mirror facets
    ctx.save();
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.clip();

    const facetSize = 8;
    for (let y = ballY - radius; y < ballY + radius; y += facetSize) {
      for (let x = ballX - radius; x < ballX + radius; x += facetSize) {
        const dx = x - ballX;
        const dy = y - ballY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const sparkle = Math.sin(time * 5 + x * 0.1 + y * 0.1);
          if (sparkle > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkle})`;
          } else {
            const shade = 180 + sparkle * 40;
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          }
          ctx.fillRect(x, y, facetSize - 1, facetSize - 1);
        }
      }
    }

    ctx.restore();

    // String/mount
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ballX, ballY - radius);
    ctx.lineTo(ballX, 0);
    ctx.stroke();
  }

  private drawFog(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    midBoost: number
  ): void {
    const fogY = height * 0.5;

    for (let i = 0; i < 3; i++) {
      const y = fogY + i * height * 0.1;
      const wave = Math.sin(time * 0.3 + i) * 20;

      const fogGradient = ctx.createLinearGradient(0, y - 50, 0, y + 50);
      fogGradient.addColorStop(0, 'transparent');
      fogGradient.addColorStop(0.5, `rgba(100, 50, 150, ${0.1 + midBoost * 0.1})`);
      fogGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, y - 50 + wave, width, 100);
    }
  }

  private drawSparkles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    trebleBoost: number,
    isBeat: boolean
  ): void {
    const sparkleCount = isBeat ? 30 : 15;

    for (let i = 0; i < sparkleCount; i++) {
      const x = (i * 137.5 + time * 100) % width;
      const y = (i * 97.3 + time * 50) % height;
      const size = 2 + trebleBoost * 4;
      const twinkle = Math.sin(time * 10 + i * 2) * 0.5 + 0.5;

      if (twinkle > 0.5) {
        const hue = (i * 30 + time * 100) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${twinkle})`;

        // Star shape
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const angle = (j / 4) * Math.PI * 2;
          const px = x + Math.cos(angle) * size;
          const py = y + Math.sin(angle) * size;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          const midAngle = angle + Math.PI / 4;
          ctx.lineTo(x + Math.cos(midAngle) * size * 0.3, y + Math.sin(midAngle) * size * 0.3);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  reset(): void {
    this.initialized = false;
    this.beams = [];
  }
}
