/**
 * Web Worker for waveform data generation
 * Offloads CPU-intensive peak calculation from main thread
 */

export interface WaveformWorkerInput {
  channelData: Float32Array;
  targetWidth: number;
  normalize: boolean;
}

export interface WaveformWorkerOutput {
  peaks: Float32Array;
  maxPeak: number;
}

self.onmessage = (e: MessageEvent<WaveformWorkerInput>) => {
  const { channelData, targetWidth, normalize } = e.data;

  const samplesPerPixel = Math.floor(channelData.length / targetWidth);
  const peaks = new Float32Array(targetWidth);
  let maxPeak = 0;

  // Find peak magnitude per pixel
  for (let i = 0; i < targetWidth; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, channelData.length);
    let max = 0;

    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }

    peaks[i] = max;
    if (max > maxPeak) maxPeak = max;
  }

  // Normalize to 0-1 range if requested
  if (normalize && maxPeak > 0) {
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = peaks[i] / maxPeak;
    }
  }

  // Transfer the array back (zero-copy)
  self.postMessage({ peaks, maxPeak } as WaveformWorkerOutput, { transfer: [peaks.buffer] });
};
