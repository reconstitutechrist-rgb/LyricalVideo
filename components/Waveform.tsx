import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  startTime: number;
  endTime: number;
  color?: string;
}

const Waveform: React.FC<WaveformProps> = ({
  audioBuffer,
  startTime,
  endTime,
  color = '#ec4899',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Data Extraction
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const sampleRate = audioBuffer.sampleRate;

    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const totalSamples = endSample - startSample;

    if (totalSamples <= 0) return;

    // Downsampling
    const step = Math.ceil(totalSamples / width);
    const amp = height / 2;

    ctx.fillStyle = color;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      const datumStart = startSample + i * step;
      // safe check bounds
      if (datumStart >= channelData.length) break;

      for (let j = 0; j < step; j++) {
        const idx = datumStart + j;
        if (idx < channelData.length) {
          const datum = channelData[idx];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
      }

      // Draw visual bar
      // Use root mean square or just peak? Peak is simpler for visualizer
      // Normalize to canvas height
      // Centered
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;

      ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
    }
  }, [audioBuffer, startTime, endTime, color]);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-full opacity-30" />;
};

export default Waveform;
