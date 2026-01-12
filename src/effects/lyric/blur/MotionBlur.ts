/**
 * Motion Blur Effect
 * Per-character motion blur based on velocity tracking
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';

interface VelocityState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  velocityX: number;
  velocityY: number;
  lastTime: number;
}

export class MotionBlurEffect extends CharacterLyricEffect {
  readonly id = 'motion-blur';
  readonly name = 'Motion Blur';
  readonly parameters: EffectParameter[] = [
    enumParam('motionType', 'Motion Type', 'wave', [
      { value: 'wave', label: 'Wave Motion' },
      { value: 'bounce', label: 'Bounce Motion' },
      { value: 'shake', label: 'Shake Motion' },
      { value: 'spiral', label: 'Spiral Motion' },
      { value: 'custom', label: 'Custom (Use with other effects)' },
    ]),
    slider('motionAmount', 'Motion Amount', 50, 10, 200, 5, 'px'),
    slider('motionSpeed', 'Motion Speed', 2, 0.5, 10, 0.5),
    slider('blurSamples', 'Blur Samples', 5, 2, 15, 1),
    slider('blurLength', 'Blur Trail Length', 1, 0.2, 3, 0.1),
    enumParam('blurStyle', 'Blur Style', 'trail', [
      { value: 'trail', label: 'Trail (Fade Behind)' },
      { value: 'stretch', label: 'Stretch' },
      { value: 'echo', label: 'Echo (Multiple Copies)' },
      { value: 'smear', label: 'Smear' },
    ]),
    slider('trailOpacity', 'Trail Opacity', 0.5, 0.1, 1, 0.05),
    boolean('colorShift', 'Color Shift', false),
    slider('colorShiftAmount', 'Color Shift Amount', 20, 0, 100, 5),
    boolean('audioReactive', 'Audio Reactive', false),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
  ];

  private velocityStates: Map<string, VelocityState[]> = new Map();
  private lastLyricId: string = '';

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, fontSize, fontFamily, color, currentTime, audioData, lyric } = context;

    const motionType = this.getParameter<string>('motionType');
    const motionAmount = this.getParameter<number>('motionAmount');
    const motionSpeed = this.getParameter<number>('motionSpeed');
    const blurSamples = this.getParameter<number>('blurSamples');
    const blurLength = this.getParameter<number>('blurLength');
    const blurStyle = this.getParameter<string>('blurStyle');
    const trailOpacity = this.getParameter<number>('trailOpacity');
    const colorShift = this.getParameter<boolean>('colorShift');
    const colorShiftAmount = this.getParameter<number>('colorShiftAmount');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');

    const characters = this.getCharacters(context);
    const lyricId = lyric.id;

    // Audio modulation
    let audioMod = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      audioMod = 1 + bassNorm * audioIntensity;
    }

    // Initialize or get velocity states
    if (this.lastLyricId !== lyricId || !this.velocityStates.has(lyricId)) {
      this.velocityStates.set(
        lyricId,
        characters.map((char) => ({
          x: char.x,
          y: char.y,
          prevX: char.x,
          prevY: char.y,
          velocityX: 0,
          velocityY: 0,
          lastTime: currentTime,
        }))
      );
      this.lastLyricId = lyricId;
    }

    const states = this.velocityStates.get(lyricId)!;

    // Calculate motion for each character
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const state = states[i];
      if (!state) continue;

      // Calculate new position based on motion type
      let newX = char.originalX;
      let newY = char.originalY;

      if (motionType !== 'custom') {
        const motion = this.calculateMotion(
          motionType,
          i,
          characters.length,
          currentTime,
          motionAmount * audioMod,
          motionSpeed
        );
        newX += motion.x;
        newY += motion.y;
      }

      // Update velocity
      const dt = Math.max(0.001, currentTime - state.lastTime);
      state.velocityX = (newX - state.prevX) / dt;
      state.velocityY = (newY - state.prevY) / dt;
      state.prevX = state.x;
      state.prevY = state.y;
      state.x = newX;
      state.y = newY;
      state.lastTime = currentTime;
    }

    // Render characters with motion blur
    ctx.save();

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const state = states[i];
      if (!state || char.char === ' ') continue;

      const velocity = Math.sqrt(
        state.velocityX * state.velocityX + state.velocityY * state.velocityY
      );
      const blurIntensity = Math.min(1, velocity / 500) * blurLength;

      if (blurIntensity > 0.01) {
        // Draw blur trail
        this.drawBlurTrail(ctx, char.char, state.x, state.y, state.velocityX, state.velocityY, {
          fontSize,
          fontFamily,
          color,
          samples: blurSamples,
          intensity: blurIntensity,
          style: blurStyle,
          trailOpacity,
          colorShift,
          colorShiftAmount,
        });
      }

      // Draw main character
      this.drawCharacter(ctx, char.char, state.x, state.y, {
        fontSize,
        fontFamily,
        color,
      });
    }

    ctx.restore();
  }

  private calculateMotion(
    type: string,
    index: number,
    total: number,
    time: number,
    amount: number,
    speed: number
  ): { x: number; y: number } {
    const phase = (index / total) * Math.PI * 2;
    const t = time * speed;

    switch (type) {
      case 'wave':
        return {
          x: 0,
          y: Math.sin(t + phase) * amount,
        };

      case 'bounce':
        return {
          x: 0,
          y: Math.abs(Math.sin(t + phase)) * amount,
        };

      case 'shake':
        return {
          x: Math.sin(t * 10 + phase * 3) * amount * 0.3,
          y: Math.cos(t * 8 + phase * 2) * amount * 0.3,
        };

      case 'spiral': {
        const radius = amount * (0.5 + 0.5 * Math.sin(t * 0.5));
        return {
          x: Math.cos(t + phase) * radius,
          y: Math.sin(t + phase) * radius,
        };
      }

      default:
        return { x: 0, y: 0 };
    }
  }

  private drawBlurTrail(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    options: {
      fontSize: number;
      fontFamily: string;
      color: string;
      samples: number;
      intensity: number;
      style: string;
      trailOpacity: number;
      colorShift: boolean;
      colorShiftAmount: number;
    }
  ): void {
    const {
      fontSize,
      fontFamily,
      color,
      samples,
      intensity,
      style,
      trailOpacity,
      colorShift,
      colorShiftAmount,
    } = options;

    // Normalize velocity for trail direction
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 1) return;

    const dirX = vx / speed;
    const dirY = vy / speed;
    const trailLength = speed * intensity * 0.02;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    switch (style) {
      case 'trail':
        // Fading trail behind the character
        for (let i = samples - 1; i >= 0; i--) {
          const t = (i + 1) / samples;
          const trailX = x - dirX * trailLength * t;
          const trailY = y - dirY * trailLength * t;
          const alpha = trailOpacity * (1 - t);

          ctx.globalAlpha = alpha;

          if (colorShift) {
            // Shift hue based on trail position
            const hueShift = colorShiftAmount * t;
            ctx.fillStyle = this.shiftHue(color, hueShift);
          } else {
            ctx.fillStyle = color;
          }

          ctx.fillText(char, trailX, trailY);
        }
        break;

      case 'stretch': {
        // Stretch character in motion direction
        ctx.save();
        ctx.translate(x, y);
        const angle = Math.atan2(dirY, dirX);
        ctx.rotate(angle);
        ctx.scale(1 + intensity * 0.5, 1);
        ctx.rotate(-angle);
        ctx.globalAlpha = trailOpacity;
        ctx.fillStyle = color;
        ctx.fillText(char, 0, 0);
        ctx.restore();
        break;
      }

      case 'echo':
        // Multiple copies at decreasing opacity
        for (let i = samples - 1; i >= 0; i--) {
          const t = (i + 1) / samples;
          const echoX = x - dirX * trailLength * t;
          const echoY = y - dirY * trailLength * t;
          const alpha = trailOpacity * Math.pow(1 - t, 2);

          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillText(char, echoX, echoY);
        }
        break;

      case 'smear':
        // Blended smear effect using line
        ctx.save();
        ctx.globalAlpha = trailOpacity * 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = fontSize * 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dirX * trailLength, y - dirY * trailLength);
        ctx.stroke();
        ctx.restore();
        break;
    }

    ctx.globalAlpha = 1;
  }

  private shiftHue(color: string, amount: number): string {
    // Simple hue shift for hex colors
    if (!color.startsWith('#')) return color;

    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Convert to HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r / 255) {
        h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
      } else if (max === g / 255) {
        h = ((b / 255 - r / 255) / d + 2) / 6;
      } else {
        h = ((r / 255 - g / 255) / d + 4) / 6;
      }
    }

    // Shift hue
    h = (h + amount / 360) % 1;
    if (h < 0) h += 1;

    // Convert back to RGB
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let newR: number, newG: number, newB: number;
    if (s === 0) {
      newR = newG = newB = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      newR = hue2rgb(p, q, h + 1 / 3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }

  reset(): void {
    super.reset();
    this.velocityStates.clear();
    this.lastLyricId = '';
  }
}
