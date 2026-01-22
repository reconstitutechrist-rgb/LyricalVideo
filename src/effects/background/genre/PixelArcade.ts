/**
 * Pixel Arcade Background Effect
 * 8-bit blocks, retro game aesthetic, pixel art style
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface PixelBlock {
  x: number;
  y: number;
  hue: number;
  speed: number;
  size: number;
}

export class PixelArcadeEffect extends GenreBackgroundEffect {
  readonly id = 'pixel-arcade';
  readonly name = 'Pixel Arcade';
  readonly parameters: EffectParameter[] = [
    slider('pixelSize', 'Pixel Size', 16, 8, 32, 4),
    slider('blockCount', 'Falling Blocks', 20, 10, 40, 1),
    slider('animationSpeed', 'Animation Speed', 0.6, 0.2, 1, 0.1),
    boolean('scanlines', 'CRT Scanlines', true),
    boolean('showScore', 'Show Score', true),
  ];

  private blocks: PixelBlock[] = [];
  private score = 0;
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const pixelSize = this.getParameter<number>('pixelSize');
    const blockCount = this.getParameter<number>('blockCount');
    const animationSpeed = this.getParameter<number>('animationSpeed');
    const scanlines = this.getParameter<boolean>('scanlines');
    const showScore = this.getParameter<boolean>('showScore');

    if (!this.initialized || this.blocks.length !== blockCount) {
      this.initBlocks(width, height, blockCount);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    if (isBeat) {
      this.score += 100;
    }

    // Dark retro background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Pixel grid background
    this.drawPixelGrid(ctx, width, height, pixelSize, currentTime, midBoost);

    // Falling blocks
    this.updateAndDrawBlocks(ctx, width, height, pixelSize, animationSpeed, bassBoost, trebleBoost);

    // Border frame
    this.drawArcadeBorder(ctx, width, height, pixelSize, currentTime);

    // Score display
    if (showScore) {
      this.drawScore(ctx, width, pixelSize);
    }

    // Power-up sparkles on beat
    if (isBeat) {
      this.drawPowerUp(ctx, width, height, pixelSize);
    }

    // CRT scanlines
    if (scanlines) {
      this.drawScanlines(ctx, width, height);
    }

    // Screen curvature vignette
    this.drawCRTVignette(ctx, width, height);
  }

  private initBlocks(width: number, height: number, count: number): void {
    this.blocks = [];
    for (let i = 0; i < count; i++) {
      this.blocks.push({
        x: random(0, width),
        y: random(-height, 0),
        hue: random(0, 360),
        speed: random(1, 3),
        size: random(2, 4),
      });
    }
  }

  private drawPixelGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelSize: number,
    time: number,
    midBoost: number
  ): void {
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Create subtle animated pattern
        const wave = Math.sin(time * 0.5 + col * 0.1 + row * 0.1);
        if (wave > 0.95 - midBoost * 0.1) {
          const hue = (time * 20 + col * 10 + row * 10) % 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 20%, 0.5)`;
          ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize - 1, pixelSize - 1);
        }
      }
    }
  }

  private updateAndDrawBlocks(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelSize: number,
    speed: number,
    bassBoost: number,
    trebleBoost: number
  ): void {
    for (const block of this.blocks) {
      // Move block down
      block.y += block.speed * speed * 3 * (1 + bassBoost * 0.5);

      // Reset if off screen
      if (block.y > height) {
        block.y = -pixelSize * block.size;
        block.x = Math.floor(random(0, width / pixelSize)) * pixelSize;
        block.hue = random(0, 360);
      }

      // Draw pixelated block (Tetris-like)
      const blockSize = pixelSize * block.size;
      const x = Math.floor(block.x / pixelSize) * pixelSize;
      const y = Math.floor(block.y / pixelSize) * pixelSize;

      // Block glow
      const glowSize = blockSize + 8 + trebleBoost * 8;
      const gradient = ctx.createRadialGradient(
        x + blockSize / 2,
        y + blockSize / 2,
        blockSize / 4,
        x + blockSize / 2,
        y + blockSize / 2,
        glowSize
      );
      gradient.addColorStop(0, `hsla(${block.hue}, 100%, 50%, 0.3)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 10, y - 10, blockSize + 20, blockSize + 20);

      // Draw block with pixel detail
      for (let py = 0; py < block.size; py++) {
        for (let px = 0; px < block.size; px++) {
          const shade = 50 + (px + py) * 5;
          ctx.fillStyle = `hsl(${block.hue}, 80%, ${shade}%)`;
          ctx.fillRect(x + px * pixelSize, y + py * pixelSize, pixelSize - 1, pixelSize - 1);

          // Highlight
          ctx.fillStyle = `hsla(${block.hue}, 100%, 80%, 0.5)`;
          ctx.fillRect(x + px * pixelSize, y + py * pixelSize, pixelSize / 3, pixelSize / 3);
        }
      }
    }
  }

  private drawArcadeBorder(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelSize: number,
    time: number
  ): void {
    const borderSize = pixelSize * 2;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    // Animated border
    for (let i = 0; i < width; i += pixelSize) {
      const colorIndex = Math.floor((i / pixelSize + time * 5) % colors.length);

      // Top
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(i, 0, pixelSize - 1, borderSize - 1);

      // Bottom
      ctx.fillStyle = colors[(colorIndex + 3) % colors.length];
      ctx.fillRect(i, height - borderSize, pixelSize - 1, borderSize - 1);
    }

    for (let i = 0; i < height; i += pixelSize) {
      const colorIndex = Math.floor((i / pixelSize + time * 5) % colors.length);

      // Left
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(0, i, borderSize - 1, pixelSize - 1);

      // Right
      ctx.fillStyle = colors[(colorIndex + 3) % colors.length];
      ctx.fillRect(width - borderSize, i, borderSize - 1, pixelSize - 1);
    }
  }

  private drawScore(ctx: CanvasRenderingContext2D, width: number, pixelSize: number): void {
    const scoreText = `SCORE: ${String(this.score).padStart(8, '0')}`;

    ctx.font = `${pixelSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    // Shadow
    ctx.fillStyle = '#000000';
    ctx.fillText(scoreText, width / 2 + 2, pixelSize * 4 + 2);

    // Text
    ctx.fillStyle = '#00ff00';
    ctx.fillText(scoreText, width / 2, pixelSize * 4);
  }

  private drawPowerUp(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelSize: number
  ): void {
    const x = random(pixelSize * 3, width - pixelSize * 3);
    const y = random(pixelSize * 6, height - pixelSize * 3);

    // Power-up star
    const colors = ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'];
    const color = colors[Math.floor(random(0, colors.length))];

    ctx.fillStyle = color;

    // Simple pixelated star
    const size = pixelSize * 2;
    ctx.fillRect(x - size / 2, y - size * 1.5, size, size);
    ctx.fillRect(x - size * 1.5, y - size / 2, size * 3, size);
    ctx.fillRect(x - size / 2, y + size / 2, size, size);
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
  }

  private drawCRTVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0.5, 'transparent');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.initialized = false;
    this.blocks = [];
    this.score = 0;
  }
}
