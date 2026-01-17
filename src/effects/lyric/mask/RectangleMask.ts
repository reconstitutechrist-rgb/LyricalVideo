/**
 * Rectangle Mask Effect
 * Text revealed through an animated rectangular mask
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';

export class RectangleMaskEffect extends CharacterLyricEffect {
  readonly id = 'rectangle-mask';
  readonly name = 'Rectangle Mask';
  readonly parameters: EffectParameter[] = [
    slider('maskWidth', 'Max Width', 400, 50, 800, 10, 'px'),
    slider('maskHeight', 'Max Height', 100, 20, 300, 5, 'px'),
    enumParam('animation', 'Animation', 'wipe-right', [
      { value: 'wipe-right', label: 'Wipe Right' },
      { value: 'wipe-left', label: 'Wipe Left' },
      { value: 'wipe-down', label: 'Wipe Down' },
      { value: 'wipe-up', label: 'Wipe Up' },
      { value: 'expand-center', label: 'Expand from Center' },
      { value: 'expand-horizontal', label: 'Expand Horizontal' },
      { value: 'expand-vertical', label: 'Expand Vertical' },
    ]),
    slider('cornerRadius', 'Corner Radius', 0, 0, 50, 2, 'px'),
    slider('offsetX', 'X Offset', 0, -300, 300, 5, 'px'),
    slider('offsetY', 'Y Offset', 0, -200, 200, 5, 'px'),
    boolean('softEdge', 'Soft Edge', false),
    slider('feather', 'Edge Feather', 20, 0, 100, 5, 'px'),
    boolean('audioReactive', 'Audio Reactive', false),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
  ];

  renderLyric(context: LyricEffectContext): void {
    const { ctx, text, x, y, fontSize, fontFamily, color, progress, audioData } = context;

    const maskWidth = this.getParameter<number>('maskWidth');
    const maskHeight = this.getParameter<number>('maskHeight');
    const animation = this.getParameter<string>('animation');
    const cornerRadius = this.getParameter<number>('cornerRadius');
    const offsetX = this.getParameter<number>('offsetX');
    const offsetY = this.getParameter<number>('offsetY');
    const softEdge = this.getParameter<boolean>('softEdge');
    const feather = this.getParameter<number>('feather');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');

    // Calculate animated rectangle bounds
    let rectX = x - maskWidth / 2 + offsetX;
    let rectY = y - maskHeight / 2 + offsetY;
    let rectW = maskWidth;
    let rectH = maskHeight;

    const easedProgress = this.easeOut(progress);

    // Audio reactivity boost
    let audioBoost = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      audioBoost = 1 + bassNorm * audioIntensity * 0.2;
    }

    switch (animation) {
      case 'wipe-right':
        rectX = x - maskWidth / 2 + offsetX;
        rectW = maskWidth * easedProgress * audioBoost;
        break;
      case 'wipe-left':
        rectW = maskWidth * easedProgress * audioBoost;
        rectX = x + maskWidth / 2 - rectW + offsetX;
        break;
      case 'wipe-down':
        rectY = y - maskHeight / 2 + offsetY;
        rectH = maskHeight * easedProgress * audioBoost;
        break;
      case 'wipe-up':
        rectH = maskHeight * easedProgress * audioBoost;
        rectY = y + maskHeight / 2 - rectH + offsetY;
        break;
      case 'expand-center':
        rectW = maskWidth * easedProgress * audioBoost;
        rectH = maskHeight * easedProgress * audioBoost;
        rectX = x - rectW / 2 + offsetX;
        rectY = y - rectH / 2 + offsetY;
        break;
      case 'expand-horizontal':
        rectW = maskWidth * easedProgress * audioBoost;
        rectX = x - rectW / 2 + offsetX;
        break;
      case 'expand-vertical':
        rectH = maskHeight * easedProgress * audioBoost;
        rectY = y - rectH / 2 + offsetY;
        break;
    }

    ctx.save();

    if (softEdge && feather > 0) {
      // Create soft edge with gradient
      this.drawSoftEdgeMask(
        ctx,
        text,
        x,
        y,
        fontSize,
        fontFamily,
        color,
        rectX,
        rectY,
        rectW,
        rectH,
        cornerRadius,
        feather
      );
    } else {
      // Hard edge clip with rounded corners
      ctx.beginPath();
      this.roundedRect(ctx, rectX, rectY, rectW, rectH, cornerRadius);
      ctx.clip();

      // Draw text
      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    if (w < 0 || h < 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawSoftEdgeMask(
    ctx: CanvasRenderingContext2D,
    text: string,
    textX: number,
    textY: number,
    fontSize: number,
    fontFamily: string,
    color: string,
    rectX: number,
    rectY: number,
    rectW: number,
    rectH: number,
    cornerRadius: number,
    feather: number
  ): void {
    // Draw text to offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = ctx.canvas.width;
    offscreen.height = ctx.canvas.height;
    const offCtx = offscreen.getContext('2d')!;

    offCtx.font = `bold ${fontSize}px "${fontFamily}"`;
    offCtx.fillStyle = color;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(text, textX, textY);

    // Create feathered mask
    offCtx.globalCompositeOperation = 'destination-in';

    // Draw solid center
    offCtx.fillStyle = 'white';
    offCtx.beginPath();
    this.roundedRect(
      offCtx,
      rectX + feather / 2,
      rectY + feather / 2,
      Math.max(0, rectW - feather),
      Math.max(0, rectH - feather),
      Math.max(0, cornerRadius - feather / 2)
    );
    offCtx.fill();

    // Draw gradient edges using multiple passes
    offCtx.globalCompositeOperation = 'destination-over';
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const alpha = 1 - i / steps;
      const expand = (feather / 2) * (i / steps);
      offCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      offCtx.beginPath();
      this.roundedRect(
        offCtx,
        rectX + feather / 2 - expand,
        rectY + feather / 2 - expand,
        Math.max(0, rectW - feather + expand * 2),
        Math.max(0, rectH - feather + expand * 2),
        cornerRadius
      );
      offCtx.fill();
    }

    ctx.drawImage(offscreen, 0, 0);
  }

  private easeOut(t: number): number {
    return t * (2 - t);
  }
}
