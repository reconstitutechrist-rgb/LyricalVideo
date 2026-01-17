import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ExportQuality } from '../types';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Initialize FFmpeg.wasm instance
 * Loads the WASM binaries from CDN on first call
 */
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpegLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Set up progress logging
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  // Load FFmpeg WASM from unpkg CDN
  // Using the multi-threaded core for better performance
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegLoaded = true;
  return ffmpeg;
}

/**
 * Quality preset mapping to CRF values
 * CRF (Constant Rate Factor): Lower = better quality, larger file
 * - 15: Nearly lossless, very large files
 * - 18: High quality, large files
 * - 23: Good quality, reasonable file size (default for x264)
 * - 28: Lower quality, smaller files
 */
const CRF_MAP: Record<ExportQuality, number> = {
  ultra: 15,
  high: 18,
  medium: 23,
  low: 28,
};

/**
 * Audio bitrate presets
 */
const AUDIO_BITRATE_MAP: Record<ExportQuality, string> = {
  ultra: '320k',
  high: '256k',
  medium: '192k',
  low: '128k',
};

export interface ConvertOptions {
  quality: ExportQuality;
  framerate: number;
  onProgress?: (percent: number) => void;
}

/**
 * Convert WebM video to MP4 using FFmpeg.wasm
 * Records are typically VP8/VP9 + Opus, converted to H.264 + AAC
 */
export async function convertWebMToMP4(webmBlob: Blob, options: ConvertOptions): Promise<Blob> {
  const { quality, framerate, onProgress } = options;

  // Initialize FFmpeg if not already loaded
  const ff = await initFFmpeg(onProgress);

  const crf = CRF_MAP[quality];
  const audioBitrate = AUDIO_BITRATE_MAP[quality];

  // Write input file to FFmpeg virtual filesystem
  await ff.writeFile('input.webm', await fetchFile(webmBlob));

  // Run FFmpeg conversion
  // Using libx264 for H.264 video and aac for audio
  // -pix_fmt yuv420p ensures compatibility with most players
  await ff.exec([
    '-i',
    'input.webm',
    '-c:v',
    'libx264',
    '-preset',
    'medium', // Balance between speed and compression
    '-crf',
    String(crf),
    '-c:a',
    'aac',
    '-b:a',
    audioBitrate,
    '-r',
    String(framerate),
    '-pix_fmt',
    'yuv420p', // Required for QuickTime/iOS compatibility
    '-movflags',
    '+faststart', // Enable streaming/progressive download
    'output.mp4',
  ]);

  // Read output file from virtual filesystem
  const data = await ff.readFile('output.mp4');

  // Clean up virtual filesystem
  await ff.deleteFile('input.webm');
  await ff.deleteFile('output.mp4');

  // Convert Uint8Array to Blob
  return new Blob([data], { type: 'video/mp4' });
}

/**
 * Get estimated file size multiplier based on quality
 * Useful for UI feedback before export
 */
export function getQualitySizeMultiplier(quality: ExportQuality): number {
  const multipliers: Record<ExportQuality, number> = {
    ultra: 2.5,
    high: 1.5,
    medium: 1.0,
    low: 0.6,
  };
  return multipliers[quality];
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
  return ffmpegLoaded;
}

/**
 * Unload FFmpeg to free memory (optional)
 */
export function unloadFFmpeg(): void {
  if (ffmpeg) {
    ffmpeg = null;
    ffmpegLoaded = false;
  }
}
