import React, { useRef, useEffect } from 'react';
import { WaveformCanvasProps } from './types';
import { createOffscreenRenderer, OffscreenRenderer } from '../../utils/offscreenCanvas';

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  peaks,
  width,
  height,
  zoom,
  scrollOffset,
  duration: _duration,
  primaryColor = '#3b82f6',
  secondaryColor = '#1e40af',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<OffscreenRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    const mainCtx = canvas.getContext('2d');
    if (!mainCtx) return;

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const scaledWidth = width * dpr;
    const scaledHeight = height * dpr;

    // Initialize or resize offscreen canvas
    if (!offscreenRef.current) {
      offscreenRef.current = createOffscreenRenderer(scaledWidth, scaledHeight);
    } else {
      offscreenRef.current.resize(scaledWidth, scaledHeight);
    }

    const { ctx } = offscreenRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr);

    // Clear offscreen canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible range (viewport culling)
    const totalWidth = width * zoom;
    const pixelsPerPeak = totalWidth / peaks.length;
    const startPeak = Math.floor(scrollOffset / pixelsPerPeak);
    const endPeak = Math.ceil((scrollOffset + width) / pixelsPerPeak);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.5, secondaryColor);
    gradient.addColorStop(1, primaryColor);

    ctx.fillStyle = gradient;

    // Draw waveform bars to offscreen canvas
    const centerY = height / 2;
    const maxBarHeight = (height / 2) * 0.9;

    for (let i = Math.max(0, startPeak); i < Math.min(peaks.length, endPeak); i++) {
      const x = i * pixelsPerPeak - scrollOffset;
      const barHeight = peaks[i] * maxBarHeight;

      // Draw mirrored bars (top and bottom)
      ctx.fillRect(x, centerY - barHeight, Math.max(1, pixelsPerPeak - 1), barHeight * 2);
    }

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Transfer offscreen canvas to main canvas
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    mainCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before transfer
    offscreenRef.current.transferToMain(mainCtx);
  }, [peaks, width, height, zoom, scrollOffset, primaryColor, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
      className="waveform-canvas"
    />
  );
};

export default WaveformCanvas;
