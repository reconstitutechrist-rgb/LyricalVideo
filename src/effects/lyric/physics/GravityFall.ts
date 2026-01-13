/**
 * Gravity Fall Effect
 * Characters fall with gravity and optional bounce
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { random } from '../../utils/MathUtils';
import { PhysicsBody, createPhysicsBody, updatePhysicsBody } from '../../utils/MathUtils';

interface FallingChar extends PhysicsBody {
  char: string;
  originalX: number;
  originalY: number;
  width: number;
  fallen: boolean;
}

export class GravityFallEffect extends CharacterLyricEffect {
  readonly id = 'gravity-fall';
  readonly name = 'Gravity Fall';
  readonly parameters: EffectParameter[] = [
    slider('gravity', 'Gravity', 1, 0.1, 5, 0.1),
    slider('bounce', 'Bounce Factor', 0.5, 0, 1, 0.05),
    slider('staggerDelay', 'Stagger Delay', 0.05, 0, 0.3, 0.01, 's'),
    boolean('rotation', 'Enable Rotation', true),
    slider('rotationSpeed', 'Rotation Speed', 1, 0.1, 3, 0.1),
    slider('groundLevel', 'Ground Level', 0.9, 0.5, 1, 0.05),
  ];

  private fallingChars: Map<string, FallingChar[]> = new Map();
  private lastLyricId: string = '';
  private startTime: number = 0;

  renderLyric(context: LyricEffectContext): void {
    const {
      ctx,
      lyric,
      text: _text,
      fontSize,
      fontFamily,
      color,
      progress: _progress,
      currentTime,
      height,
    } = context;
    const characters = this.getCharacters(context);

    const gravity = this.getParameter<number>('gravity') * 500;
    const bounceCoeff = this.getParameter<number>('bounce');
    const staggerDelay = this.getParameter<number>('staggerDelay');
    const enableRotation = this.getParameter<boolean>('rotation');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const groundLevel = this.getParameter<number>('groundLevel') * height;

    // Initialize for new lyric
    if (lyric.id !== this.lastLyricId) {
      this.lastLyricId = lyric.id;
      this.startTime = currentTime;
      this.initializeFallingChars(characters);
    }

    const elapsed = currentTime - this.startTime;
    const fallingChars = this.fallingChars.get(lyric.id) || [];

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const deltaTime = 0.016; // Approximate 60fps

    for (let i = 0; i < fallingChars.length; i++) {
      const fc = fallingChars[i];
      const charStartTime = i * staggerDelay;

      if (elapsed < charStartTime) {
        // Not started falling yet - draw at original position
        this.drawCharacter(ctx, fc.char, fc.originalX, fc.originalY, {
          fontSize,
          fontFamily,
          color,
        });
        continue;
      }

      if (!fc.fallen) {
        // Apply gravity
        fc.acceleration.y = gravity;
        updatePhysicsBody(fc, deltaTime);

        // Check ground collision
        if (fc.position.y >= groundLevel) {
          fc.position.y = groundLevel;

          if (Math.abs(fc.velocity.y) < 20) {
            // Stop bouncing
            fc.velocity.y = 0;
            fc.fallen = true;
          } else {
            // Bounce
            fc.velocity.y = -fc.velocity.y * bounceCoeff;
            fc.velocity.x *= 0.8; // Friction
          }
        }

        // Update rotation
        if (enableRotation) {
          fc.angularVelocity = fc.velocity.x * 0.01 * rotationSpeed;
          fc.rotation += fc.angularVelocity;
        }
      }

      // Draw character at current position
      this.drawCharacter(ctx, fc.char, fc.position.x, fc.position.y, {
        fontSize,
        fontFamily,
        color,
        rotation: fc.rotation,
      });
    }
  }

  private initializeFallingChars(
    characters: { char: string; x: number; y: number; width: number }[]
  ): void {
    const fallingChars: FallingChar[] = characters.map((char) => ({
      ...createPhysicsBody(char.x, char.y),
      char: char.char,
      originalX: char.x,
      originalY: char.y,
      width: char.width,
      fallen: false,
      velocity: { x: random(-30, 30), y: 0 },
    }));

    this.fallingChars.set(this.lastLyricId, fallingChars);
  }

  reset(): void {
    this.lastLyricId = '';
    this.fallingChars.clear();
  }
}
