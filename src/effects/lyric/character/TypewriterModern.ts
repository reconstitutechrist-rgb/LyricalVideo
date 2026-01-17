/**
 * Typewriter Modern Effect
 * Enhanced typewriter with cursor, typos, and audio-synced typing speed
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, enumParam } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { random } from '../../utils/MathUtils';

interface TypeState {
  visibleChars: number;
  typoIndex: number;
  typoChar: string;
  isCorrectingTypo: boolean;
  lastTypeTime: number;
  cursorBlink: boolean;
}

export class TypewriterModernEffect extends CharacterLyricEffect {
  readonly id = 'typewriter-modern';
  readonly name = 'Typewriter Modern';
  readonly parameters: EffectParameter[] = [
    slider('baseSpeed', 'Base Type Speed', 15, 5, 30, 1, 'char/s'),
    slider('typoRate', 'Typo Rate', 0.05, 0, 0.2, 0.01),
    slider('backspaceSpeed', 'Backspace Speed', 2, 1, 5, 0.5, 'x'),
    enumParam('cursorStyle', 'Cursor Style', 'line', [
      { value: 'line', label: 'Line |' },
      { value: 'block', label: 'Block █' },
      { value: 'underscore', label: 'Underscore _' },
    ]),
    boolean('audioSync', 'Audio Sync', true),
    slider('cursorBlinkRate', 'Cursor Blink', 0.5, 0.2, 1, 0.1, 's'),
  ];

  private state: TypeState | null = null;
  private typoChars = 'abcdefghijklmnopqrstuvwxyz';

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, fontSize, fontFamily, color, progress, audioData, currentTime } = context;
    const characters = this.getCharacters(context);

    const baseSpeed = this.getParameter<number>('baseSpeed');
    const typoRate = this.getParameter<number>('typoRate');
    const backspaceSpeed = this.getParameter<number>('backspaceSpeed');
    const cursorStyle = this.getParameter<string>('cursorStyle');
    const audioSync = this.getParameter<boolean>('audioSync');
    const cursorBlinkRate = this.getParameter<number>('cursorBlinkRate');

    // Initialize state
    if (!this.state) {
      this.state = {
        visibleChars: 0,
        typoIndex: -1,
        typoChar: '',
        isCorrectingTypo: false,
        lastTypeTime: currentTime,
        cursorBlink: true,
      };

      // Pre-determine typo position
      if (typoRate > 0 && Math.random() < typoRate * text.length) {
        this.state.typoIndex = Math.floor(random(2, text.length - 2));
        this.state.typoChar = this.typoChars[Math.floor(random(0, this.typoChars.length))];
      }
    }

    // Calculate typing speed (audio reactive)
    let _typeSpeed = baseSpeed;
    if (audioSync && audioData) {
      _typeSpeed = baseSpeed * (0.7 + (audioData.energy || 0.5) * 0.6);
    }

    // Calculate how many characters should be visible based on progress
    const targetChars = Math.floor(progress * text.length * 1.5);

    // Handle typo logic
    let displayText = '';
    let cursorPosition = 0;

    if (this.state.typoIndex >= 0 && this.state.visibleChars >= this.state.typoIndex) {
      if (!this.state.isCorrectingTypo && this.state.visibleChars === this.state.typoIndex) {
        // Show typo
        displayText = text.slice(0, this.state.typoIndex) + this.state.typoChar;
        cursorPosition = this.state.typoIndex + 1;

        // Start correction after brief pause
        if (currentTime - this.state.lastTypeTime > 0.3) {
          this.state.isCorrectingTypo = true;
          this.state.lastTypeTime = currentTime;
        }
      } else if (this.state.isCorrectingTypo) {
        // Correcting - show backspace animation
        const correctionProgress = (currentTime - this.state.lastTypeTime) * backspaceSpeed;
        if (correctionProgress < 0.2) {
          // Still showing typo
          displayText = text.slice(0, this.state.typoIndex) + this.state.typoChar;
          cursorPosition = this.state.typoIndex + 1;
        } else {
          // Typo removed, continue normally
          this.state.visibleChars = Math.min(targetChars, text.length);
          displayText = text.slice(0, this.state.visibleChars);
          cursorPosition = this.state.visibleChars;
          this.state.typoIndex = -1;
        }
      }
    } else {
      // Normal typing
      this.state.visibleChars = Math.min(targetChars, text.length);
      displayText = text.slice(0, this.state.visibleChars);
      cursorPosition = this.state.visibleChars;
    }

    // Update cursor blink
    const blinkCycle = Math.floor(currentTime / cursorBlinkRate) % 2;
    this.state.cursorBlink = blinkCycle === 0 || this.state.visibleChars < text.length;

    // Draw visible characters
    ctx.save();
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    for (let i = 0; i < displayText.length; i++) {
      const char = characters[i] || { x: 0, y: 0 };
      ctx.fillText(displayText[i], char.x, char.y);
    }

    // Draw cursor
    if (this.state.cursorBlink && cursorPosition <= characters.length) {
      const cursorX =
        cursorPosition > 0
          ? characters[cursorPosition - 1].x +
            ctx.measureText(displayText[cursorPosition - 1] || '').width
          : characters[0]?.x - 5 || 0;
      const cursorY = characters[0]?.y || 0;

      ctx.fillStyle = color;
      this.drawCursor(ctx, cursorX, cursorY, fontSize, cursorStyle);
    }

    ctx.restore();
  }

  private drawCursor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fontSize: number,
    style: string
  ): void {
    switch (style) {
      case 'block':
        ctx.fillRect(x + 2, y - fontSize / 2, fontSize * 0.6, fontSize);
        break;
      case 'underscore':
        ctx.fillRect(x + 2, y + fontSize * 0.3, fontSize * 0.6, 3);
        break;
      case 'line':
      default:
        ctx.fillRect(x + 2, y - fontSize / 2, 2, fontSize);
    }
  }

  reset(): void {
    this.state = null;
  }
}
