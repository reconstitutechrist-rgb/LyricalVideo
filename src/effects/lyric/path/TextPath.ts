/**
 * Text Path Effect
 * Characters follow and animate along bezier curve paths
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { CharacterLyricEffect } from '../LyricEffect';
import { BezierPath, PathPresets, PathPoint } from './BezierUtils';

export class TextPathEffect extends CharacterLyricEffect {
  readonly id = 'text-path';
  readonly name = 'Text Path';
  readonly parameters: EffectParameter[] = [
    enumParam('pathType', 'Path Type', 'wave', [
      { value: 'wave', label: 'Wave' },
      { value: 'circle', label: 'Circle' },
      { value: 'arc', label: 'Arc' },
      { value: 's-curve', label: 'S-Curve' },
      { value: 'line', label: 'Diagonal Line' },
    ]),
    slider('pathWidth', 'Path Width', 400, 100, 800, 10, 'px'),
    slider('pathHeight', 'Path Height/Amplitude', 80, 20, 300, 10, 'px'),
    slider('waveCycles', 'Wave Cycles', 1, 0.5, 4, 0.5),
    enumParam('animation', 'Animation', 'static', [
      { value: 'static', label: 'Static on Path' },
      { value: 'flow', label: 'Flow Along Path' },
      { value: 'reveal', label: 'Reveal Along Path' },
      { value: 'assemble', label: 'Assemble to Path' },
    ]),
    slider('animationSpeed', 'Animation Speed', 1, 0.1, 5, 0.1),
    slider('offsetX', 'X Offset', 0, -300, 300, 10, 'px'),
    slider('offsetY', 'Y Offset', 0, -200, 200, 10, 'px'),
    boolean('rotateChars', 'Rotate Characters', true),
    slider('charSpacing', 'Character Spacing', 1, 0.5, 2, 0.1),
    slider('arcStartAngle', 'Arc Start Angle', -90, -180, 180, 10, 'deg'),
    slider('arcEndAngle', 'Arc End Angle', 90, -180, 180, 10, 'deg'),
    boolean('audioReactive', 'Audio Reactive', false),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
  ];

  private pathCache: Map<string, BezierPath> = new Map();
  private scatterOffsets: Map<string, { x: number; y: number }[]> = new Map();

  renderLyric(context: LyricEffectContext): void {
    const {
      ctx,
      text: _text,
      x,
      y,
      fontSize,
      fontFamily,
      color,
      progress,
      currentTime,
      audioData,
      lyric,
    } = context;

    const pathType = this.getParameter<string>('pathType');
    const pathWidth = this.getParameter<number>('pathWidth');
    const pathHeight = this.getParameter<number>('pathHeight');
    const waveCycles = this.getParameter<number>('waveCycles');
    const animation = this.getParameter<string>('animation');
    const animationSpeed = this.getParameter<number>('animationSpeed');
    const offsetX = this.getParameter<number>('offsetX');
    const offsetY = this.getParameter<number>('offsetY');
    const rotateChars = this.getParameter<boolean>('rotateChars');
    const charSpacing = this.getParameter<number>('charSpacing');
    const arcStartAngle = this.getParameter<number>('arcStartAngle');
    const arcEndAngle = this.getParameter<number>('arcEndAngle');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');

    const characters = this.getCharacters(context);
    const charCount = characters.filter((c) => c.char !== ' ').length;

    // Audio modulation
    let audioMod = 0;
    if (audioReactive) {
      const midNorm = audioData.mid / 255;
      audioMod = midNorm * audioIntensity;
    }

    // Get or create path
    const pathKey = `${pathType}-${pathWidth}-${pathHeight}-${waveCycles}-${arcStartAngle}-${arcEndAngle}`;
    let path = this.pathCache.get(pathKey);

    if (!path) {
      path = this.createPath(
        pathType,
        pathWidth,
        pathHeight + audioMod * 50,
        waveCycles,
        arcStartAngle,
        arcEndAngle
      );
      this.pathCache.set(pathKey, path);
    }

    // Calculate animation offset
    let flowOffset = 0;
    let revealProgress = 1;
    let assembleProgress = 1;

    switch (animation) {
      case 'flow':
        flowOffset = (currentTime * animationSpeed * 0.1) % 1;
        break;
      case 'reveal':
        revealProgress = this.easeOut(Math.min(progress * 2, 1));
        break;
      case 'assemble':
        assembleProgress = this.easeOut(Math.min(progress * 2, 1));
        break;
    }

    // Sample points along path for each character
    const pathPoints = this.distributeCharacters(path, charCount, charSpacing, flowOffset);

    // Generate scatter offsets once per lyric for assemble animation
    const lyricId = lyric.id;
    if (!this.scatterOffsets.has(lyricId)) {
      const offsets = characters.map(() => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      }));
      this.scatterOffsets.set(lyricId, offsets);
    }
    const scatterOffsetsForLyric = this.scatterOffsets.get(lyricId)!;

    ctx.save();
    ctx.translate(x + offsetX, y + offsetY);

    let pathIndex = 0;
    for (let i = 0; i < characters.length; i++) {
      const charData = characters[i];
      if (charData.char === ' ') continue;

      const pathPoint = pathPoints[pathIndex] || { x: 0, y: 0, angle: 0, t: 0 };

      // Animation-specific modifications
      let charX = pathPoint.x;
      let charY = pathPoint.y;
      let charAngle = rotateChars ? pathPoint.angle : 0;
      let charOpacity = 1;
      let charScale = 1;

      // Apply animation-specific modifications
      if (animation === 'reveal') {
        // Characters appear as the reveal progresses
        if (pathPoint.t > revealProgress) {
          charOpacity = 0;
        } else {
          const localProgress = (revealProgress - pathPoint.t) / 0.2;
          charOpacity = Math.min(1, Math.max(0, localProgress));
          charScale = 0.5 + 0.5 * Math.min(1, localProgress);
        }
      } else if (animation === 'assemble') {
        // Characters start scattered and move to path positions
        // Use cached offsets to avoid jitter from per-frame randomness
        const cachedOffset = scatterOffsetsForLyric[pathIndex] || { x: 0, y: 0 };
        const scatterX = cachedOffset.x * pathWidth * (1 - assembleProgress);
        const scatterY = cachedOffset.y * pathHeight * (1 - assembleProgress);
        charX =
          charX * assembleProgress + (charData.originalX - x) * (1 - assembleProgress) + scatterX;
        charY = charY * assembleProgress + scatterY;
        charAngle *= assembleProgress;
      }

      // Audio-reactive bounce
      if (audioReactive) {
        const bounce = Math.sin(currentTime * 10 + i * 0.5) * audioMod * 10;
        charY += bounce;
      }

      this.drawCharacter(ctx, charData.char, charX, charY, {
        fontSize,
        fontFamily,
        color,
        rotation: charAngle,
        opacity: charOpacity,
        scale: charScale,
      });

      pathIndex++;
    }

    ctx.restore();
  }

  private createPath(
    type: string,
    width: number,
    height: number,
    cycles: number,
    arcStart: number,
    arcEnd: number
  ): BezierPath {
    const arcStartRad = (arcStart * Math.PI) / 180;
    const arcEndRad = (arcEnd * Math.PI) / 180;

    switch (type) {
      case 'wave':
        return PathPresets.wave(width, height, cycles);
      case 'circle':
        return PathPresets.circle(Math.min(width, height) / 2);
      case 'arc':
        return PathPresets.arc(Math.min(width, height) / 2, arcStartRad, arcEndRad);
      case 's-curve':
        return PathPresets.sCurve(width, height);
      case 'line':
        return PathPresets.line(-width / 2, height / 2, width / 2, -height / 2);
      default:
        return PathPresets.wave(width, height, cycles);
    }
  }

  private distributeCharacters(
    path: BezierPath,
    count: number,
    spacing: number,
    offset: number
  ): PathPoint[] {
    const points: PathPoint[] = [];
    const totalSpan = 1 / spacing; // How much of the path to use

    for (let i = 0; i < count; i++) {
      // Distribute characters along path with spacing
      let t = (i / Math.max(1, count - 1)) * totalSpan;

      // Apply flow offset with wrapping
      t = (t + offset) % 1;
      if (t < 0) t += 1;

      // Center the text on the path
      t = Math.max(0, Math.min(1, t + (1 - totalSpan) / 2));

      points.push(path.getPoint(t));
    }

    return points;
  }

  private easeOut(t: number): number {
    return t * (2 - t);
  }

  reset(): void {
    super.reset();
    this.pathCache.clear();
    this.scatterOffsets.clear();
  }
}
