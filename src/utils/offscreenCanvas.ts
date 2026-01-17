/**
 * OffscreenCanvas Utilities
 * Provides utilities for rendering to offscreen canvas with automatic fallback
 */

export interface OffscreenRenderer {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  isOffscreen: boolean;
  transferToMain: (targetCtx: CanvasRenderingContext2D) => void;
  resize: (width: number, height: number) => void;
}

/**
 * Check if OffscreenCanvas is supported
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * Create an offscreen renderer with automatic fallback to standard canvas
 */
export function createOffscreenRenderer(width: number, height: number): OffscreenRenderer {
  // Try OffscreenCanvas first
  if (supportsOffscreenCanvas()) {
    try {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        return {
          canvas,
          ctx,
          isOffscreen: true,
          transferToMain: (targetCtx) => {
            // Use transferToImageBitmap for efficient zero-copy transfer
            const bitmap = canvas.transferToImageBitmap();
            targetCtx.drawImage(bitmap, 0, 0);
            bitmap.close(); // Free memory immediately
          },
          resize: (newWidth, newHeight) => {
            canvas.width = newWidth;
            canvas.height = newHeight;
          },
        };
      }
    } catch (e) {
      console.warn('OffscreenCanvas creation failed, falling back to standard canvas:', e);
    }
  }

  // Fallback to standard hidden canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  return {
    canvas,
    ctx,
    isOffscreen: false,
    transferToMain: (targetCtx) => {
      targetCtx.drawImage(canvas, 0, 0);
    },
    resize: (newWidth, newHeight) => {
      canvas.width = newWidth;
      canvas.height = newHeight;
    },
  };
}

/**
 * Create a simple offscreen canvas for double-buffering
 * Returns null if creation fails
 */
export function createSimpleOffscreenCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  } catch {
    return null;
  }
}
