/**
 * Punk/Zine Background Effect
 * DIY punk zine aesthetic with collage, stamps, and rough textures
 */

import { EffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean, enumParam } from '../../core/ParameterTypes';
import { GenreBackgroundEffect } from '../BackgroundEffect';
import { random } from '../../utils/MathUtils';

interface InkSplatter {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
}

interface TornEdge {
  y: number;
  points: number[];
}

interface Scribble {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export class PunkZineEffect extends GenreBackgroundEffect {
  readonly id = 'punk-zine';
  readonly name = 'Punk/Zine';
  readonly parameters: EffectParameter[] = [
    enumParam('paperTexture', 'Paper Texture', 'newsprint', [
      { value: 'newsprint', label: 'Newsprint' },
      { value: 'cardboard', label: 'Cardboard' },
      { value: 'lined', label: 'Lined Paper' },
    ]),
    slider('inkSplatters', 'Ink Splatters', 0.5, 0, 1, 0.05),
    slider('halftoneSize', 'Halftone Size', 4, 2, 10, 1),
    boolean('tornEdges', 'Torn Edges', true),
    boolean('scribbles', 'Hand-drawn Scribbles', true),
  ];

  private splatters: InkSplatter[] = [];
  private tornEdge: TornEdge | null = null;
  private scribbles: Scribble[] = [];
  private initialized = false;
  private noisePattern: ImageData | null = null;

  render(context: EffectContext): void {
    const { ctx, width, height, audioData, currentTime } = context;

    const paperTexture = this.getParameter<string>('paperTexture');
    const inkSplatters = this.getParameter<number>('inkSplatters');
    const halftoneSize = this.getParameter<number>('halftoneSize');
    const tornEdges = this.getParameter<boolean>('tornEdges');
    const scribbles = this.getParameter<boolean>('scribbles');

    // Initialize
    if (!this.initialized) {
      this.initSplatters(width, height, inkSplatters);
      this.initTornEdge(width);
      this.initScribbles(width, height);
      this.initialized = true;
    }

    // Paper background
    this.drawPaperBackground(ctx, width, height, paperTexture);

    // Halftone dots overlay
    this.drawHalftone(ctx, width, height, halftoneSize, audioData.mid);

    // Ink splatters
    this.drawSplatters(ctx, audioData.bass);

    // Torn paper edges
    if (tornEdges && this.tornEdge) {
      this.drawTornEdges(ctx, width, height);
    }

    // Hand-drawn scribbles
    if (scribbles) {
      this.drawScribbles(ctx, currentTime, audioData.treble);
    }

    // Ransom note style overlays on beats
    if (audioData.isBeat) {
      this.drawRansomOverlay(ctx, width, height);
    }

    // Photocopy distortion
    this.drawPhotocopyEffect(ctx, width, height, audioData.energy);
  }

  private initSplatters(width: number, height: number, density: number): void {
    this.splatters = [];
    const count = Math.floor(10 * density);

    for (let i = 0; i < count; i++) {
      this.splatters.push({
        x: random(0, width),
        y: random(0, height),
        size: random(20, 80),
        rotation: random(0, Math.PI * 2),
        opacity: random(0.3, 0.8),
      });
    }
  }

  private initTornEdge(width: number): void {
    const points: number[] = [];
    for (let x = 0; x <= width; x += 10) {
      points.push(random(-15, 15));
    }
    this.tornEdge = { y: 50, points };
  }

  private initScribbles(width: number, height: number): void {
    this.scribbles = [];
    const colors = ['#000000', '#ff0000', '#0000ff'];

    for (let i = 0; i < 5; i++) {
      const points: { x: number; y: number }[] = [];
      let x = random(width * 0.1, width * 0.9);
      let y = random(height * 0.1, height * 0.9);

      for (let j = 0; j < 20; j++) {
        points.push({ x, y });
        x += random(-30, 30);
        y += random(-20, 20);
      }

      this.scribbles.push({
        points,
        color: colors[Math.floor(random(0, colors.length))],
        width: random(1, 3),
      });
    }
  }

  private drawPaperBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    texture: string
  ): void {
    // Base paper color
    let baseColor: string;
    switch (texture) {
      case 'cardboard':
        baseColor = '#c4a77d';
        break;
      case 'lined':
        baseColor = '#f5f5dc';
        break;
      case 'newsprint':
      default:
        baseColor = '#e8e4d9';
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Add texture
    if (texture === 'lined') {
      ctx.strokeStyle = '#add8e6';
      ctx.lineWidth = 1;
      for (let y = 30; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Red margin line
      ctx.strokeStyle = '#ffcccc';
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(80, height);
      ctx.stroke();
    } else if (texture === 'newsprint') {
      // Newsprint grain
      ctx.save();
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        ctx.fillRect(random(0, width), random(0, height), 1, 1);
      }
      ctx.restore();
    } else if (texture === 'cardboard') {
      // Cardboard fibers
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#8b6914';
      for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.moveTo(random(0, width), random(0, height));
        ctx.lineTo(random(0, width), random(0, height));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawHalftone(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dotSize: number,
    mid: number
  ): void {
    const spacing = dotSize * 3;
    const intensity = 0.05 + (mid / 255) * 0.1;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const size = dotSize * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawSplatters(ctx: CanvasRenderingContext2D, bass: number): void {
    const bassBoost = 1 + (bass / 255) * 0.3;

    for (const splatter of this.splatters) {
      ctx.save();
      ctx.translate(splatter.x, splatter.y);
      ctx.rotate(splatter.rotation);
      ctx.globalAlpha = splatter.opacity;

      // Main splatter blob
      ctx.fillStyle = '#000';
      ctx.beginPath();

      const size = splatter.size * bassBoost;
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = size * (0.5 + Math.random() * 0.5);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevAngle = ((i - 1) / points) * Math.PI * 2;
          const cpRadius = size * 0.7;
          const cpX = Math.cos((angle + prevAngle) / 2) * cpRadius;
          const cpY = Math.sin((angle + prevAngle) / 2) * cpRadius;
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Splatter droplets
      for (let i = 0; i < 5; i++) {
        const dropAngle = random(0, Math.PI * 2);
        const dropDist = size * random(1, 1.5);
        const dropX = Math.cos(dropAngle) * dropDist;
        const dropY = Math.sin(dropAngle) * dropDist;
        const dropSize = random(2, 6);

        ctx.beginPath();
        ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawTornEdges(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.tornEdge) return;

    ctx.save();

    // Top torn edge
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let i = 0; i < this.tornEdge.points.length; i++) {
      const x = (i / (this.tornEdge.points.length - 1)) * width;
      const y = this.tornEdge.y + this.tornEdge.points[i];
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fill();

    // Bottom torn edge (inverted)
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < this.tornEdge.points.length; i++) {
      const x = (i / (this.tornEdge.points.length - 1)) * width;
      const y = height - this.tornEdge.y - this.tornEdge.points[i];
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawScribbles(ctx: CanvasRenderingContext2D, time: number, treble: number): void {
    const wobble = (treble / 255) * 3;

    ctx.save();

    for (const scribble of this.scribbles) {
      ctx.strokeStyle = scribble.color;
      ctx.lineWidth = scribble.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.3;

      ctx.beginPath();
      for (let i = 0; i < scribble.points.length; i++) {
        const p = scribble.points[i];
        const x = p.x + Math.sin(time * 2 + i) * wobble;
        const y = p.y + Math.cos(time * 2 + i) * wobble;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawRansomOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Quick flash of cut-out letter style
    ctx.save();
    ctx.globalAlpha = 0.1;

    const x = random(width * 0.2, width * 0.8);
    const y = random(height * 0.2, height * 0.8);
    const w = random(50, 150);
    const h = random(30, 80);

    ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#000000';
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
  }

  private drawPhotocopyEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    energy: number
  ): void {
    // Photocopy distortion lines
    const intensity = energy * 0.3;

    ctx.save();
    ctx.globalAlpha = intensity;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Horizontal distortion bands
    for (let i = 0; i < 5; i++) {
      const y = random(0, height);
      const bandHeight = random(2, 8);

      ctx.fillStyle = `rgba(0, 0, 0, ${random(0.05, 0.15)})`;
      ctx.fillRect(0, y, width, bandHeight);
    }

    ctx.restore();
  }

  reset(): void {
    this.initialized = false;
    this.splatters = [];
    this.tornEdge = null;
    this.scribbles = [];
    this.noisePattern = null;
  }
}
