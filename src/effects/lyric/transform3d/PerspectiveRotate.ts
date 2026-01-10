/**
 * Perspective Rotate Effect
 * Simulates 3D perspective rotation of text
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { lerp, clamp } from '../../utils/MathUtils';

export class PerspectiveRotateEffect extends CharacterLyricEffect {
  readonly id = 'perspective-rotate';
  readonly name = 'Perspective Rotate';
  readonly parameters: EffectParameter[] = [
    slider('rotationX', 'X Rotation', 0, -45, 45, 1, 'deg'),
    slider('rotationY', 'Y Rotation', 15, -45, 45, 1, 'deg'),
    slider('vanishingPointX', 'Vanishing Point X', 0.5, 0, 1, 0.05),
    slider('vanishingPointY', 'Vanishing Point Y', 0.5, 0, 1, 0.05),
    slider('depth', 'Depth Effect', 0.3, 0, 1, 0.05),
    slider('animationSpeed', 'Animation Speed', 0, 0, 2, 0.1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, fontSize, fontFamily, color, currentTime, width, height } = context;
    const characters = this.getCharacters(context);

    let rotationX = this.getParameter<number>('rotationX');
    let rotationY = this.getParameter<number>('rotationY');
    const vanishingPointX = this.getParameter<number>('vanishingPointX');
    const vanishingPointY = this.getParameter<number>('vanishingPointY');
    const depth = this.getParameter<number>('depth');
    const animationSpeed = this.getParameter<number>('animationSpeed');

    // Animate rotation if speed > 0
    if (animationSpeed > 0) {
      rotationX = rotationX * Math.sin(currentTime * animationSpeed);
      rotationY = rotationY * Math.cos(currentTime * animationSpeed * 0.7);
    }

    // Convert to radians
    const rotXRad = (rotationX * Math.PI) / 180;
    const rotYRad = (rotationY * Math.PI) / 180;

    // Calculate vanishing point in canvas coordinates
    const vpX = width * vanishingPointX;
    const vpY = height * vanishingPointY;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const char of characters) {
      // Calculate distance from vanishing point
      const dx = char.x - vpX;
      const dy = char.y - vpY;

      // Calculate perspective transformations
      // X rotation affects Y position and scale
      const xRotEffect = Math.cos(rotXRad);
      const yOffset = dy * (1 - xRotEffect) * depth;
      const scaleFromXRot = 1 - Math.abs(Math.sin(rotXRad)) * depth * 0.5;

      // Y rotation affects X position and scale
      const yRotEffect = Math.cos(rotYRad);
      const xOffset = dx * (1 - yRotEffect) * depth;
      const scaleFromYRot = 1 - Math.abs(Math.sin(rotYRad)) * depth * 0.5;

      // Combined scale
      const scale = scaleFromXRot * scaleFromYRot;

      // Calculate skew for perspective effect
      const skewX = Math.sin(rotYRad) * 0.3 * depth;
      const skewY = Math.sin(rotXRad) * 0.3 * depth;

      // Depth-based opacity
      const distanceFromVP = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(width * width + height * height) / 2;
      const depthOpacity = 1 - (distanceFromVP / maxDist) * depth * 0.3;

      ctx.save();

      // Apply perspective transformation
      ctx.translate(char.x + xOffset * 0.5, char.y + yOffset * 0.5);
      ctx.transform(scale, skewY, skewX, scale, 0, 0);
      ctx.translate(-char.x, -char.y);

      ctx.globalAlpha = clamp(depthOpacity, 0.3, 1);
      ctx.fillStyle = color;
      ctx.fillText(char.char, char.x, char.y);

      ctx.restore();
    }
  }
}
