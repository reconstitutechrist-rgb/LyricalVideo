import React, { useRef, useEffect } from 'react';
import { WaveformCanvasProps } from './types';

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  peaks,
  width,
  height,
  zoom,
  scrollOffset,
  duration,
  primaryColor = '#3b82f6',
  secondaryColor = '#1e40af',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible range
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

    // Draw waveform bars
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
