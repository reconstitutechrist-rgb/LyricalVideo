/**
 * useAbortableRequest Hook
 * React hook for managing AI requests with throttling, abort, and lifecycle cleanup
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { isAbortError, getThrottleMessage, THROTTLE_MESSAGES } from '../utils/requestController';

// ============================================================================
// Types
// ============================================================================

export interface UseAbortableRequestOptions {
  /** Minimum interval between requests in ms (default: 2000) */
  throttleMs?: number;
  /** Callback when request is throttled */
  onThrottled?: (waitTimeMs: number, message: string) => void;
  /** Callback when request is aborted */
  onAborted?: () => void;
  /** Callback when request fails with non-abort error */
  onError?: (error: Error) => void;
  /** Type of request for throttle messages */
  requestType?: keyof typeof THROTTLE_MESSAGES;
}

export interface UseAbortableRequestReturn<T> {
  /** Execute a request with the abort signal */
  execute: (fn: (signal: AbortSignal) => Promise<T>) => Promise<T | null>;
  /** Abort the current in-flight request */
  abort: () => void;
  /** Whether a request is currently in progress */
  isInProgress: boolean;
  /** Current request ID (increments with each new request) */
  requestId: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing abortable AI requests with throttling
 *
 * @example
 * const planRequest = useAbortableRequest<VideoPlan>({
 *   throttleMs: 2000,
 *   onThrottled: (waitMs, msg) => showToast(msg),
 *   requestType: 'PLAN_GENERATION'
 * });
 *
 * const handleRegenerate = async () => {
 *   const plan = await planRequest.execute(async (signal) => {
 *     return generateVideoPlan(audioFile, signal);
 *   });
 *   if (plan) {
 *     setVideoPlan(plan);
 *   }
 * };
 */
export function useAbortableRequest<T>(
  options: UseAbortableRequestOptions = {}
): UseAbortableRequestReturn<T> {
  const { throttleMs = 2000, onThrottled, onAborted, onError, requestType = 'DEFAULT' } = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const requestIdRef = useRef<number>(0);
  const [isInProgress, setIsInProgress] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(0);

  // Cleanup on unmount - abort any pending request
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const execute = useCallback(
    async (fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;

      // Throttle check - only if a request is in progress or too soon
      if (timeSinceLastRequest < throttleMs) {
        const waitTime = throttleMs - timeSinceLastRequest;
        const message = getThrottleMessage(requestType, waitTime);
        onThrottled?.(waitTime, message);
        return null;
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new controller
      abortControllerRef.current = new AbortController();
      lastRequestTimeRef.current = now;
      requestIdRef.current++;
      const thisRequestId = requestIdRef.current;

      setIsInProgress(true);
      setCurrentRequestId(thisRequestId);

      try {
        const result = await fn(abortControllerRef.current.signal);

        // Check if superseded by newer request
        if (thisRequestId !== requestIdRef.current) {
          return null;
        }

        return result;
      } catch (error) {
        // Handle abort errors silently
        if (isAbortError(error)) {
          onAborted?.();
          return null;
        }

        // Handle other errors
        onError?.(error as Error);
        throw error;
      } finally {
        // Only update state if this is still the current request
        if (thisRequestId === requestIdRef.current) {
          setIsInProgress(false);
        }
      }
    },
    [throttleMs, onThrottled, onAborted, onError, requestType]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsInProgress(false);
  }, []);

  return {
    execute,
    abort,
    isInProgress,
    requestId: currentRequestId,
  };
}

// ============================================================================
// Convenience Hooks for Specific Request Types
// ============================================================================

/**
 * Hook for video plan generation requests
 */
export function usePlanRequest<T>(
  onThrottled?: (waitTimeMs: number, message: string) => void
): UseAbortableRequestReturn<T> {
  return useAbortableRequest<T>({
    throttleMs: 2000,
    requestType: 'PLAN_GENERATION',
    onThrottled,
  });
}

/**
 * Hook for chat requests (faster throttle)
 */
export function useChatRequest<T>(
  onThrottled?: (waitTimeMs: number, message: string) => void
): UseAbortableRequestReturn<T> {
  return useAbortableRequest<T>({
    throttleMs: 1000,
    requestType: 'CHAT',
    onThrottled,
  });
}

/**
 * Hook for background generation requests (slower throttle - expensive)
 */
export function useBackgroundRequest<T>(
  onThrottled?: (waitTimeMs: number, message: string) => void
): UseAbortableRequestReturn<T> {
  return useAbortableRequest<T>({
    throttleMs: 3000,
    requestType: 'BACKGROUND',
    onThrottled,
  });
}

/**
 * Hook for lyric sync requests
 */
export function useSyncRequest<T>(
  onThrottled?: (waitTimeMs: number, message: string) => void
): UseAbortableRequestReturn<T> {
  return useAbortableRequest<T>({
    throttleMs: 2000,
    requestType: 'SYNC',
    onThrottled,
  });
}

// Re-export utilities for convenience
export { isAbortError, createAbortError } from '../utils/requestController';
