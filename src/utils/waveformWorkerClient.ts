/**
 * Waveform Worker Client
 * Provides a Promise-based API for the waveform Web Worker
 */

import type { WaveformWorkerInput, WaveformWorkerOutput } from '../workers/waveformWorker';

let workerInstance: Worker | null = null;
let pendingResolve: ((result: WaveformWorkerOutput) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;

/**
 * Get or create the worker instance
 */
function getWorker(): Worker {
  if (!workerInstance) {
    // Vite worker import syntax
    workerInstance = new Worker(new URL('../workers/waveformWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerInstance.onmessage = (e: MessageEvent<WaveformWorkerOutput>) => {
      if (pendingResolve) {
        pendingResolve(e.data);
        pendingResolve = null;
        pendingReject = null;
      }
    };

    workerInstance.onerror = (e) => {
      if (pendingReject) {
        pendingReject(new Error(`Worker error: ${e.message}`));
        pendingResolve = null;
        pendingReject = null;
      }
    };
  }
  return workerInstance;
}

/**
 * Generate waveform data asynchronously using Web Worker
 * @param channelData - Audio channel data (Float32Array)
 * @param targetWidth - Number of peaks to generate
 * @param normalize - Whether to normalize peaks to 0-1 range
 * @returns Promise resolving to Float32Array of peaks
 */
export async function generateWaveformDataAsync(
  channelData: Float32Array,
  targetWidth: number,
  normalize: boolean
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();

    // Store callbacks for when worker responds
    pendingResolve = (result) => resolve(result.peaks);
    pendingReject = reject;

    // Create input with a copy of channelData since we're transferring
    const input: WaveformWorkerInput = {
      channelData: channelData.slice(),
      targetWidth,
      normalize,
    };

    // Transfer the buffer to worker (zero-copy)
    worker.postMessage(input, { transfer: [input.channelData.buffer] });
  });
}

/**
 * Check if Web Workers are supported
 */
export function supportsWebWorker(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Terminate the worker instance
 * Call this when the worker is no longer needed to free resources
 */
export function terminateWaveformWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    pendingResolve = null;
    pendingReject = null;
  }
}
