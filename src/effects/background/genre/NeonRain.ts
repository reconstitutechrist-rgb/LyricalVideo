/**
 * Neon Rain Background Effect
 * Matrix-style falling characters with neon glow
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface RainColumn {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
  hue: number;
}

export class NeonRainEffect extends GenreBackgroundEffect {
  readonly id = 'neon-rain';
  readonly name = 'Neon Rain';
  readonly parameters: EffectParameter[] = [
    slider('columnDensity', 'Column Density', 0.6, 0.3, 1, 0.1),
    slider('fallSpeed', 'Fall Speed', 0.6, 0.2, 1, 0.1),
    slider('glowIntensity', 'Glow Intensity', 0.7, 0.3, 1, 0.1),
    boolean('multiColor', 'Multi Color', false),
    boolean('katakana', 'Use Katakana', true),
  ];

  private columns: RainColumn[] = [];
  private charSet: string[] = [];
  private initialized = false;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const columnDensity = this.getParameter<number>('columnDensity');
    const fallSpeed = this.getParameter<number>('fallSpeed');
    const glowIntensity = this.getParameter<number>('glowIntensity');
    const multiColor = this.getParameter<boolean>('multiColor');
    const katakana = this.getParameter<boolean>('katakana');

    if (!this.initialized) {
      this.initCharSet(katakana);
      this.initColumns(width, height, columnDensity);
      this.initialized = true;
    }

    // Audio reactivity
    const bassBoost = audioData.bass / 255;
    const midBoost = audioData.mid / 255;
    const trebleBoost = audioData.treble / 255;
    const isBeat = audioData.isBeat;

    // Dark background with slight fade for trail effect
    ctx.fillStyle = 'rgba(0, 5, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Occasional full clear for visual interest
    if (isBeat && random(0, 1) < 0.1) {
      ctx.fillStyle = 'rgba(0, 5, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);
    }

    const fontSize = 16;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';

    // Update and draw columns
    for (const column of this.columns) {
      // Move column down
      column.y += column.speed * fallSpeed * 3 * (1 + bassBoost * 0.5);

      // Reset if off screen
      if (column.y - column.length * fontSize > height) {
        column.y = -random(0, height * 0.5);
        column.speed = random(1, 3);
        column.length = Math.floor(random(5, 20));
        this.randomizeChars(column);
        if (multiColor) {
          column.hue = random(0, 360);
        }
      }

      // Occasionally change characters
      if (random(0, 1) < 0.02) {
        const charIndex = Math.floor(random(0, column.chars.length));
        column.chars[charIndex] = this.charSet[Math.floor(random(0, this.charSet.length))];
      }

      // Draw column
      for (let i = 0; i < column.chars.length; i++) {
        const charY = column.y - i * fontSize;

        if (charY < 0 || charY > height) continue;

        // Calculate fade based on position in column
        const fadeRatio = i / column.chars.length;
        const alpha = (1 - fadeRatio) * (0.7 + trebleBoost * 0.3);

        // Determine color
        const hue = multiColor ? column.hue : 120; // Default green
        const saturation = 80 + midBoost * 20;

        if (i === 0) {
          // Head character is brightest (white/bright)
          ctx.fillStyle = `hsla(${hue}, ${saturation}%, 90%, ${alpha + 0.3})`;

          // Glow effect for head
          if (glowIntensity > 0) {
            ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
            ctx.shadowBlur = 15 * glowIntensity;
          }
        } else if (i < 3) {
          // Near-head characters are bright
          const lightness = 70 - i * 10;
          ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
          ctx.shadowBlur = 8 * glowIntensity;
        } else {
          // Trailing characters fade
          const lightness = 50 - fadeRatio * 30;
          ctx.fillStyle = `hsla(${hue}, ${saturation - fadeRatio * 30}%, ${lightness}%, ${alpha * 0.8})`;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(column.chars[i], column.x, charY);
      }

      ctx.shadowBlur = 0;
    }

    // Add random flash characters on beat
    if (isBeat) {
      this.drawBeatFlash(ctx, width, height, fontSize, multiColor);
    }

    // Scan line effect
    this.drawScanLines(ctx, width, height, currentTime);

    // Vignette
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0.5, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  private initCharSet(useKatakana: boolean): void {
    if (useKatakana) {
      // Katakana characters
      this.charSet = [];
      for (let i = 0x30a0; i <= 0x30ff; i++) {
        this.charSet.push(String.fromCharCode(i));
      }
    } else {
      // ASCII characters
      this.charSet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*'.split(
        ''
      );
    }
  }

  private initColumns(width: number, height: number, density: number): void {
    this.columns = [];
    const columnWidth = 20;
    const columnCount = Math.floor((width / columnWidth) * density);

    for (let i = 0; i < columnCount; i++) {
      const column: RainColumn = {
        x: (i / columnCount) * width + columnWidth / 2,
        y: random(-height, 0),
        speed: random(1, 3),
        length: Math.floor(random(5, 20)),
        chars: [],
        hue: random(0, 360),
      };
      this.randomizeChars(column);
      this.columns.push(column);
    }
  }

  private randomizeChars(column: RainColumn): void {
    column.chars = [];
    for (let i = 0; i < column.length; i++) {
      column.chars.push(this.charSet[Math.floor(random(0, this.charSet.length))]);
    }
  }

  private drawBeatFlash(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fontSize: number,
    multiColor: boolean
  ): void {
    const flashCount = 10;

    for (let i = 0; i < flashCount; i++) {
      const x = random(0, width);
      const y = random(0, height);
      const char = this.charSet[Math.floor(random(0, this.charSet.length))];
      const hue = multiColor ? random(0, 360) : 120;

      ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
      ctx.shadowBlur = 20;
      ctx.font = `${fontSize * 1.5}px monospace`;
      ctx.fillText(char, x, y);
    }

    ctx.shadowBlur = 0;
    ctx.font = `${fontSize}px monospace`;
  }

  private drawScanLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }

    // Moving scan line
    const scanY = (time * 100) % height;
    const scanGradient = ctx.createLinearGradient(0, scanY - 5, 0, scanY + 5);
    scanGradient.addColorStop(0, 'transparent');
    scanGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.05)');
    scanGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, scanY - 5, width, 10);
  }

  reset(): void {
    this.initialized = false;
    this.columns = [];
    this.charSet = [];
  }
}
