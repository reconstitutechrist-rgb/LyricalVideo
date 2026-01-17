/**
 * Request Controller Utilities
 * Provides throttling, AbortController management, and race condition prevention for AI requests
 */

// ============================================================================
// Types
// ============================================================================

export interface RequestOptions {
  /** Minimum interval between requests in ms (default: 2000) */
  throttleMs?: number;
  /** External abort signal to chain */
  signal?: AbortSignal;
}

export interface RequestController<T> {
  /** Execute a request with throttling and abort support */
  execute: (fn: (signal: AbortSignal) => Promise<T>) => Promise<T>;
  /** Abort the current in-flight request */
  abort: () => void;
  /** Check if a request is currently in progress */
  isInProgress: () => boolean;
  /** Get the current request ID (for detecting stale responses) */
  getRequestId: () => number;
  /** Get the AbortSignal for the current request */
  getSignal: () => AbortSignal | null;
}

// ============================================================================
// AbortError Detection
// ============================================================================

/**
 * Check if an error is an abort/cancellation error
 * Works with both DOMException AbortError and custom abort errors
 */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.toLowerCase().includes('aborted') ||
      error.message.toLowerCase().includes('cancelled') ||
      error.message.toLowerCase().includes('canceled')
    );
  }
  return false;
};

/**
 * Create an AbortError with a custom message
 */
export const createAbortError = (message: string = 'Request aborted'): DOMException => {
  return new DOMException(message, 'AbortError');
};

// ============================================================================
// Abort-aware Delay
// ============================================================================

/**
 * Promise-based delay that can be aborted
 * Useful for retry delays that should be cancellable
 */
export const abortableDelay = (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(createAbortError());
    };

    signal?.addEventListener('abort', abortHandler, { once: true });

    // Clean up listener after timeout completes
    setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
    }, ms + 1);
  });
};

// ============================================================================
// Request Controller Factory
// ============================================================================

/**
 * Create a request controller for managing AI requests
 *
 * Features:
 * - Throttle: Prevents requests within throttleMs of each other
 * - Auto-abort: Cancels previous request when new one starts
 * - Request versioning: Detects stale responses
 *
 * @example
 * const controller = createRequestController<VideoPlan>({ throttleMs: 2000 });
 *
 * const result = await controller.execute(async (signal) => {
 *   return await generateVideoPlan(audioFile, signal);
 * });
 */
export const createRequestController = <T>(options: RequestOptions = {}): RequestController<T> => {
  const { throttleMs = 2000 } = options;

  let abortController: AbortController | null = null;
  let lastRequestTime = 0;
  let isRunning = false;
  let requestId = 0;

  return {
    execute: async (fn: (signal: AbortSignal) => Promise<T>): Promise<T> => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      // Throttle check
      if (timeSinceLastRequest < throttleMs && isRunning) {
        const waitTime = throttleMs - timeSinceLastRequest;
        throw new Error(`Request throttled. Please wait ${Math.ceil(waitTime / 1000)} second(s).`);
      }

      // Abort any in-flight request
      if (abortController) {
        abortController.abort();
      }

      // Create new controller
      abortController = new AbortController();
      lastRequestTime = now;
      isRunning = true;
      requestId++;
      const currentId = requestId;

      try {
        const result = await fn(abortController.signal);

        // Check if superseded by newer request
        if (currentId !== requestId) {
          throw createAbortError('Request superseded by newer request');
        }

        return result;
      } finally {
        if (currentId === requestId) {
          isRunning = false;
        }
      }
    },

    abort: () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      isRunning = false;
    },

    isInProgress: () => isRunning,

    getRequestId: () => requestId,

    getSignal: () => abortController?.signal ?? null,
  };
};

// ============================================================================
// Throttle Error Messages
// ============================================================================

export const THROTTLE_MESSAGES = {
  PLAN_GENERATION: 'Please wait before regenerating the video plan.',
  CHAT: 'Please wait before sending another message.',
  BACKGROUND: 'Please wait before generating another background.',
  SYNC: 'Please wait before re-syncing lyrics.',
  DEFAULT: 'Please wait before making another request.',
} as const;

/**
 * Get a user-friendly throttle message based on request type
 */
export const getThrottleMessage = (
  type: keyof typeof THROTTLE_MESSAGES,
  waitTimeMs?: number
): string => {
  const base = THROTTLE_MESSAGES[type] || THROTTLE_MESSAGES.DEFAULT;
  if (waitTimeMs && waitTimeMs > 0) {
    return `${base} (${Math.ceil(waitTimeMs / 1000)}s)`;
  }
  return base;
};
