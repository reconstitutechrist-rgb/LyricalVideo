/**
 * Visual Style Rendering Functions
 * Each style is extracted as a standalone function for maintainability
 */

import { ColorPalette, VisualSettings } from '../../../types';

export interface StyleRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  currentTime: number;
  pulse: number;
  intensity: number;
  frequencies: {
    bass: number;
    mid: number;
    treble: number;
    average: number;
  };
  motionFreqValue: number;
  pulseFreqValue: number;
  colorFreqValue: number;
  dataArray: Uint8Array | null;
  palette: ColorPalette;
  sentimentColor?: string;
  settings: VisualSettings;
}

/**
 * Liquid Dream Style - Flowing waves
 */
export const renderLiquidDream = (context: StyleRenderContext): void => {
  const { ctx, width, height, time, pulse, sentimentColor, motionFreqValue, settings } = context;

  ctx.lineWidth = 2 * settings.intensity;
  const step = width > 1920 ? 20 : width > 1280 ? 15 : 10;
  const waveMotion = motionFreqValue / 255;
  const timeOffset = time * 10 + 200;
  const timeWaveOffset = time * (1 + waveMotion);

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.strokeStyle = sentimentColor || `hsla(${i * 40 + timeOffset}, 70%, 60%, 0.5)`;

    const wavePhase = time + i;
    const amplitude1 = 50 * pulse;
    const amplitude2 = 20;

    const y0 =
      height / 2 + Math.sin(wavePhase) * amplitude1 + Math.sin(-timeWaveOffset) * amplitude2;
    ctx.moveTo(0, y0);

    for (let x = step; x <= width; x += step) {
      const y =
        height / 2 +
        Math.sin(x * 0.01 + wavePhase) * amplitude1 +
        Math.sin(x * 0.02 - timeWaveOffset) * amplitude2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

/**
 * Glitch Cyber Style - Digital distortion
 */
export const renderGlitchCyber = (context: StyleRenderContext): void => {
  const { ctx, width, height, sentimentColor, motionFreqValue, settings } = context;

  ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * settings.intensity})`;
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 2);

  if (
    Math.random() < settings.glitchFrequency * 0.4 ||
    motionFreqValue > 200 - settings.glitchFrequency * 100
  ) {
    const numGlitches = Math.floor(Math.random() * 5 * settings.intensity) + 1;
    for (let k = 0; k < numGlitches; k++) {
      const hSlice = Math.random() * height;
      const hSize = Math.random() * 50 * settings.intensity;
      ctx.fillStyle = sentimentColor || 'rgba(0, 255, 0, 0.5)';
      ctx.fillRect(0, hSlice, width, hSize);
    }
  }
};

/**
 * Kaleidoscope Style - Rotating symmetrical patterns
 */
export const renderKaleidoscope = (context: StyleRenderContext): void => {
  const { ctx, width, height, time, palette, sentimentColor, pulseFreqValue, dataArray, settings } =
    context;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(time * 0.1);

  const segments = 8;
  const angleStep = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    ctx.save();
    ctx.rotate(i * angleStep);

    const drawSlice = () => {
      ctx.beginPath();
      const dataLen = 20;
      let prevX = 0;
      let prevY = 0;
      for (let j = 0; j < dataLen; j++) {
        const index = j * 3;
        const val = dataArray ? dataArray[index] : 0;
        const intensityMult = pulseFreqValue / 255 + 0.5;
        const normalized = (val / 255) * settings.intensity * intensityMult;
        const dist = j * (Math.min(width, height) / 2 / dataLen) * 0.8 + 20;
        const x = dist;
        const y = normalized * 40 * Math.sin(time * 2 + j);

        let strokeStyle = '';
        let fillStyle = '';

        if (sentimentColor) {
          strokeStyle = sentimentColor;
          fillStyle = sentimentColor;
        } else {
          let hue = (time * 10 + j * 10) % 360;
          if (palette === 'neon') hue = 280 + j * 5 + val / 2;
          else if (palette === 'sunset') hue = 10 + j * 5;
          else if (palette === 'ocean') hue = 180 + j * 5;
          else if (palette === 'matrix') hue = 100 + val;
          else if (palette === 'fire') hue = j * 3;
          strokeStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
          fillStyle = `hsla(${hue}, 80%, 60%, 0.4)`;
        }

        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = 2;
        if (j > 0) {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, 2 + normalized * 10, 0, Math.PI * 2);
        ctx.fill();
        prevX = x;
        prevY = y;
      }
    };

    drawSlice();
    ctx.scale(1, -1);
    drawSlice();
    ctx.restore();
  }
  ctx.restore();
};

/**
 * Chromatic Wave Style - Overlapping color waves
 */
export const renderChromaticWave = (context: StyleRenderContext): void => {
  const {
    ctx,
    width,
    height,
    time,
    palette,
    sentimentColor,
    colorFreqValue,
    pulseFreqValue,
    dataArray,
    frequencies,
    settings,
  } = context;

  const layers = 5;

  for (let i = 0; i < layers; i++) {
    ctx.beginPath();

    let hue = 0;
    const freqMod = (colorFreqValue / 255) * 50;

    if (palette === 'neon') hue = 280 + i * 15 + freqMod;
    else if (palette === 'sunset') hue = 340 + i * 20 + freqMod;
    else if (palette === 'ocean') hue = 190 + i * 10 + freqMod;
    else if (palette === 'matrix') hue = 100 + i * 5 + freqMod;
    else if (palette === 'fire') hue = 0 + i * 10 + freqMod;
    else hue = (time * 20 + i * 30) % 360;

    const saturation = 70 + (pulseFreqValue / 255) * 30;
    const lightness = 50 + i * 5;
    const alpha = (0.4 / (i + 1)) * settings.intensity;

    ctx.fillStyle =
      sentimentColor && i === 0
        ? sentimentColor
        : `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${alpha + 0.2})`;
    ctx.lineWidth = 2;

    const waveSpeed = time * (0.5 + i * 0.1) * (context.motionFreqValue / 255 + 0.5);
    const amplitude = (height / 6) * settings.intensity * (frequencies.bass / 100 + 0.5);
    const frequency = 0.005 + i * 0.002;
    const verticalShift = height / 2 + i * 20 - layers * 10;

    ctx.moveTo(0, height);

    for (let x = 0; x <= width; x += 15) {
      const y1 = Math.sin(x * frequency + waveSpeed) * amplitude;
      const y2 = Math.cos(x * frequency * 2.3 - waveSpeed * 0.8) * (amplitude * 0.5);
      const audioIdx = Math.floor((x / width) * 50) + i * 10;
      const audioNoise = (dataArray?.[audioIdx % 128] || 0) * 0.2 * settings.intensity;
      ctx.lineTo(x, verticalShift + y1 + y2 - audioNoise);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    ctx.stroke();
  }
};

/**
 * Aurora Borealis Style - Northern lights effect
 */
export const renderAuroraBorealis = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  const curtainCount = 5;
  const waveOffset = currentTime * 0.3;

  for (let c = 0; c < curtainCount; c++) {
    const hue = (120 + c * 40 + Math.sin(currentTime * 0.2 + c) * 30) % 360;
    const saturation = 70 + (frequencies.bass / 255) * 20;
    const lightness = 40 + (frequencies.treble / 255) * 20;

    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.15 * settings.intensity})`;

    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let y = 0; y <= height; y += 10) {
      const noise1 = Math.sin(y * 0.01 + waveOffset + c * 0.5) * 100;
      const noise2 = Math.cos(y * 0.02 - waveOffset * 0.7 + c) * 50;
      const audioOffset = (frequencies.mid / 255) * 30 * Math.sin(y * 0.015 + c);
      const x = width * (0.15 + c * 0.15) + noise1 + noise2 + audioOffset;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width * (0.25 + c * 0.15), height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }
};

/**
 * Water Ripple Style - Concentric waves
 */
export const renderWaterRipple = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  const rippleCount = 8;
  const rippleSpeed = currentTime * 2;
  const bassPulse = 1 + (frequencies.bass / 255) * 0.5;

  ctx.fillStyle = '#001830';
  ctx.fillRect(0, 0, width, height);

  for (let r = rippleCount; r >= 0; r--) {
    const baseRadius = (r / rippleCount) * Math.max(width, height) * 0.8;
    const animatedRadius = baseRadius + ((rippleSpeed * 50) % (Math.max(width, height) * 0.8));
    const alpha = 0.15 * (1 - r / rippleCount) * settings.intensity;

    ctx.strokeStyle = `hsla(${200 + r * 10}, 80%, ${50 + (frequencies.treble / 255) * 20}%, ${alpha})`;
    ctx.lineWidth = 2 + (frequencies.bass / 255) * 3;

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, animatedRadius * bassPulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Caustic light patterns
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2 + currentTime * 0.5;
    const dist = 100 + Math.sin(currentTime + i) * 50;
    const x = width / 2 + Math.cos(angle) * dist;
    const y = height / 2 + Math.sin(angle) * dist * 0.5;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, `rgba(100, 200, 255, ${0.1 * settings.intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * Fire Embers Style - Rising particles with flames
 */
export const renderFireEmbers = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  const emberCount = 50;
  const flameHeight = height * 0.6;

  // Dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a0a00');
  bgGrad.addColorStop(0.5, '#2a0a00');
  bgGrad.addColorStop(1, '#4a1a00');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw flames
  for (let f = 0; f < 20; f++) {
    const flameX = (f / 20) * width;
    const waveOffset = Math.sin(currentTime * 3 + f) * 20;
    const flameH = flameHeight * (0.5 + (frequencies.bass / 255) * 0.5 + Math.random() * 0.3);

    const flameGrad = ctx.createLinearGradient(flameX, height, flameX, height - flameH);
    flameGrad.addColorStop(0, `rgba(255, 100, 0, ${0.9 * settings.intensity})`);
    flameGrad.addColorStop(0.3, `rgba(255, 50, 0, ${0.6 * settings.intensity})`);
    flameGrad.addColorStop(0.6, `rgba(200, 0, 0, ${0.3 * settings.intensity})`);
    flameGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(flameX - 30, height);
    ctx.quadraticCurveTo(flameX + waveOffset, height - flameH * 0.6, flameX, height - flameH);
    ctx.quadraticCurveTo(flameX - waveOffset, height - flameH * 0.6, flameX + 30, height);
    ctx.fill();
  }

  // Draw embers
  for (let e = 0; e < emberCount; e++) {
    const seed = e * 1.618;
    const emberX = ((seed * 234.5) % 1) * width;
    const emberY = height - ((currentTime * 100 + seed * 200) % height);
    const emberSize = 2 + Math.sin(currentTime + e) * 1.5;
    const hue = 30 - (emberY / height) * 30;

    ctx.fillStyle = `hsla(${hue}, 100%, ${50 + (emberY / height) * 20}%, ${0.8 * settings.intensity})`;
    ctx.beginPath();
    ctx.arc(emberX + Math.sin(currentTime * 2 + e) * 10, emberY, emberSize, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * VHS Retro Style - 80s aesthetic
 */
export const renderVhsRetro = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // Scanlines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }

  // Tracking distortion
  const trackingNoise = settings.intensity * 0.5;
  for (let i = 0; i < 3; i++) {
    const bandY = ((currentTime * 50 + i * 100) % (height + 50)) - 25;
    const bandHeight = 10 + Math.random() * 20;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * trackingNoise})`;
    ctx.fillRect(0, bandY, width, bandHeight);
  }

  // Static noise
  const staticIntensity = 0.1 + (frequencies.treble / 255) * 0.2;
  for (let i = 0; i < 100 * staticIntensity; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
    ctx.fillRect(x, y, size, size);
  }

  // Color bleed
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, `rgba(255, 0, 0, ${0.05 * settings.intensity})`);
  gradient.addColorStop(0.5, 'transparent');
  gradient.addColorStop(1, `rgba(0, 255, 255, ${0.05 * settings.intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Film Noir Style - Black and white dramatic
 */
export const renderFilmNoir = (context: StyleRenderContext): void => {
  const { ctx, width, height, settings } = context;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  // Spotlight
  const spotlight = ctx.createRadialGradient(
    width / 2,
    -height * 0.2,
    0,
    width / 2,
    height * 0.5,
    height
  );
  spotlight.addColorStop(0, `rgba(255, 255, 255, ${0.15 * settings.intensity})`);
  spotlight.addColorStop(0.5, `rgba(128, 128, 128, ${0.05 * settings.intensity})`);
  spotlight.addColorStop(1, 'transparent');
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, width, height);

  // Film grain
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const brightness = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${0.05 * settings.intensity})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Occasional flicker
  if (Math.random() < 0.02 * settings.intensity) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }
};

/**
 * Fractal Zoom Style - Spiraling patterns
 */
export const renderFractalZoom = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  const zoomSpeed = currentTime * 0.3;
  const zoom = 1 + (zoomSpeed % 1) * 2;
  const colorCycles = 5;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.max(width, height);

  for (let ring = 30; ring >= 0; ring--) {
    const radius = (ring / 30) * maxRadius * zoom;
    const hue = (ring * colorCycles * 12 + currentTime * 50) % 360;
    const saturation = 80 + (frequencies.bass / 255) * 20;
    const lightness = 30 + (ring / 30) * 30;

    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.3 * settings.intensity})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let a = 0; a < Math.PI * 8; a += 0.1) {
      const r = radius * (a / (Math.PI * 8));
      const x = centerX + Math.cos(a + zoomSpeed) * r;
      const y = centerY + Math.sin(a + zoomSpeed) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

/**
 * Particle Nebula Style - Starfield with gas clouds
 */
export const renderParticleNebula = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, width, height);

  // Nebula clouds
  const cloudCount = 4;
  const hues = [280, 200, 320, 240];

  for (let c = 0; c < cloudCount; c++) {
    const cloudX = width * (0.2 + c * 0.2) + Math.sin(currentTime * 0.2 + c) * 50;
    const cloudY = height * (0.3 + Math.sin(c) * 0.2) + Math.cos(currentTime * 0.15 + c) * 30;
    const cloudRadius = 200 + (frequencies.bass / 255) * 100;

    const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudRadius);
    gradient.addColorStop(0, `hsla(${hues[c]}, 70%, 40%, ${0.2 * settings.intensity})`);
    gradient.addColorStop(0.5, `hsla(${hues[c]}, 60%, 30%, ${0.1 * settings.intensity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars with parallax
  for (let layer = 0; layer < 3; layer++) {
    const starCount = 100 + layer * 50;
    const layerSpeed = (layer + 1) * 0.1;
    const drift = currentTime * layerSpeed * 20;

    for (let s = 0; s < starCount; s++) {
      const seed = s * 1.618 + layer * 100;
      const baseX = ((seed * 123.456) % 1) * width;
      const baseY = ((seed * 789.012) % 1) * height;
      const x = (baseX - drift + width * 10) % width;
      const y = baseY;
      const size = (3 - layer) * 0.5 + Math.sin(currentTime * 3 + s) * 0.3;
      const brightness = 0.3 + (2 - layer) * 0.2 + Math.sin(currentTime * 2 + s * 0.1) * 0.2;

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * settings.intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

/**
 * Geometric Morph Style - Tessellating shapes
 */
export const renderGeometricMorph = (context: StyleRenderContext): void => {
  const { ctx, width, height, currentTime, frequencies, settings } = context;

  const gridSize = 8;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  const morphPhase = currentTime * 0.5;

  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      const distFromCenter = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
      const normalizedDist = distFromCenter / (Math.max(width, height) / 2);

      const hue = ((row + col) * 30 + currentTime * 20) % 360;
      const pulse = 0.5 + (frequencies.bass / 255) * 0.5;
      const size = (cellWidth * 0.4 + Math.sin(morphPhase + row + col) * 10) * pulse;
      const rotation = morphPhase + normalizedDist * 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      const shapePhase = (morphPhase + row * 0.1 + col * 0.1) % 3;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${0.4 * settings.intensity})`;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.6 * settings.intensity})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (shapePhase < 1) {
        // Triangle
        for (let p = 0; p < 3; p++) {
          const angle = (p / 3) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else if (shapePhase < 2) {
        // Hexagon
        for (let p = 0; p < 6; p++) {
          const angle = (p / 6) * Math.PI * 2;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else {
        // Square
        ctx.rect(-size, -size, size * 2, size * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }
};
