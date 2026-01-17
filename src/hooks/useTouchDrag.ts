/**
 * useTouchDrag Hook
 * Provides unified touch and mouse drag handling for interactive components.
 * Supports both click/tap for selection and drag for continuous updates.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

export interface TouchDragOptions {
  /** Called when drag starts (mousedown/touchstart) */
  onDragStart?: (position: Position, event: MouseEvent | TouchEvent) => void;
  /** Called during drag (mousemove/touchmove) */
  onDrag?: (position: Position, delta: Delta, event: MouseEvent | TouchEvent) => void;
  /** Called when drag ends (mouseup/touchend) */
  onDragEnd?: (position: Position, event: MouseEvent | TouchEvent) => void;
  /** Called on tap/click (when drag distance is minimal) */
  onTap?: (position: Position, event: MouseEvent | TouchEvent) => void;
  /** Minimum drag distance (in px) to distinguish from tap */
  tapThreshold?: number;
  /** Whether to prevent default on touch events (prevents scroll during drag) */
  preventScroll?: boolean;
  /** Whether drag is currently enabled */
  enabled?: boolean;
}

export interface Position {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

export interface Delta {
  dx: number;
  dy: number;
}

export interface TouchDragReturn {
  /** Props to spread on the draggable element */
  dragProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  /** Whether currently dragging */
  isDragging: boolean;
  /** Current position during drag */
  currentPosition: Position | null;
}

function getPositionFromEvent(
  event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  element: HTMLElement
): Position {
  const rect = element.getBoundingClientRect();

  let clientX: number;
  let clientY: number;

  if ('touches' in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ('changedTouches' in event && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else if ('clientX' in event) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    clientX = 0;
    clientY = 0;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    clientX,
    clientY,
  };
}

export function useTouchDrag(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TouchDragOptions = {}
): TouchDragReturn {
  const {
    onDragStart,
    onDrag,
    onDragEnd,
    onTap,
    tapThreshold = 5,
    preventScroll = true,
    enabled = true,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);

  const startPositionRef = useRef<Position | null>(null);
  const hasDraggedRef = useRef(false);

  // Handle drag move
  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!elementRef.current || !startPositionRef.current) return;

      const position = getPositionFromEvent(event, elementRef.current);
      const delta: Delta = {
        dx: position.x - startPositionRef.current.x,
        dy: position.y - startPositionRef.current.y,
      };

      // Check if we've moved enough to count as a drag
      const distance = Math.sqrt(delta.dx * delta.dx + delta.dy * delta.dy);
      if (distance > tapThreshold) {
        hasDraggedRef.current = true;
      }

      setCurrentPosition(position);

      if (hasDraggedRef.current) {
        onDrag?.(position, delta, event);
      }
    },
    [elementRef, onDrag, tapThreshold]
  );

  // Handle drag end
  const handleEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!elementRef.current || !startPositionRef.current) return;

      const position = getPositionFromEvent(event, elementRef.current);

      if (!hasDraggedRef.current) {
        // This was a tap, not a drag
        onTap?.(position, event);
      } else {
        onDragEnd?.(position, event);
      }

      setIsDragging(false);
      setCurrentPosition(null);
      startPositionRef.current = null;
      hasDraggedRef.current = false;

      // Remove global listeners
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    },
    [elementRef, onDragEnd, onTap, handleMove]
  );

  // Handle drag start (mouse)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !elementRef.current) return;

      const position = getPositionFromEvent(e, elementRef.current);
      startPositionRef.current = position;
      hasDraggedRef.current = false;

      setIsDragging(true);
      setCurrentPosition(position);
      onDragStart?.(position, e.nativeEvent);

      // Add global listeners
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
    },
    [enabled, elementRef, onDragStart, handleMove, handleEnd]
  );

  // Handle drag start (touch)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !elementRef.current) return;
      if (e.touches.length !== 1) return; // Only single touch

      const position = getPositionFromEvent(e, elementRef.current);
      startPositionRef.current = position;
      hasDraggedRef.current = false;

      setIsDragging(true);
      setCurrentPosition(position);
      onDragStart?.(position, e.nativeEvent);

      // Add global listeners with passive: false to allow preventDefault
      const moveOptions = preventScroll ? { passive: false } : { passive: true };
      window.addEventListener('touchmove', handleMove, moveOptions);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    },
    [enabled, elementRef, onDragStart, handleMove, handleEnd, preventScroll]
  );

  // Prevent scroll during touch drag if needed
  useEffect(() => {
    if (!isDragging || !preventScroll) return;

    const preventScrollHandler = (e: TouchEvent) => {
      if (hasDraggedRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventScrollHandler, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScrollHandler);
    };
  }, [isDragging, preventScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [handleMove, handleEnd]);

  return {
    dragProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      style: {
        touchAction: preventScroll ? 'none' : 'auto',
        cursor: isDragging ? 'grabbing' : 'pointer',
      },
    },
    isDragging,
    currentPosition,
  };
}
