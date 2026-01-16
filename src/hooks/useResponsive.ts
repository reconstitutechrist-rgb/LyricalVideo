/**
 * useResponsive Hook
 * Provides responsive breakpoint detection and mobile-specific utilities.
 */

import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'tablet' | 'desktop' | 'lg' | 'xl';

export interface ResponsiveState {
  // Current breakpoint
  breakpoint: Breakpoint;

  // Boolean flags for common checks
  isMobile: boolean; // xs or sm
  isTablet: boolean; // tablet
  isDesktop: boolean; // desktop or larger
  isTouchDevice: boolean; // Has touch capability

  // Screen dimensions
  width: number;
  height: number;

  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
}

// Breakpoint values in pixels (must match tailwind.config.js)
const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  tablet: 768,
  desktop: 1024,
  lg: 1280,
  xl: 1536,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function isTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initial state for SSR or before hydration
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    const breakpoint = getBreakpoint(width);

    return {
      breakpoint,
      isMobile: breakpoint === 'xs' || breakpoint === 'sm',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop' || breakpoint === 'lg' || breakpoint === 'xl',
      isTouchDevice: isTouchCapable(),
      width,
      height,
      isPortrait: height > width,
      isLandscape: width >= height,
    };
  });

  const updateState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    setState({
      breakpoint,
      isMobile: breakpoint === 'xs' || breakpoint === 'sm',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop' || breakpoint === 'lg' || breakpoint === 'xl',
      isTouchDevice: isTouchCapable(),
      width,
      height,
      isPortrait: height > width,
      isLandscape: width >= height,
    });
  }, []);

  useEffect(() => {
    // Update on mount
    updateState();

    // Listen for resize
    window.addEventListener('resize', updateState);

    // Listen for orientation change (mobile)
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, [updateState]);

  return state;
}

/**
 * Hook for checking if current width is at least a given breakpoint
 */
export function useBreakpoint(minBreakpoint: Breakpoint): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[minBreakpoint];
}

/**
 * Hook for checking if current width is below a given breakpoint
 */
export function useMaxBreakpoint(maxBreakpoint: Breakpoint): boolean {
  const { width } = useResponsive();
  return width < BREAKPOINTS[maxBreakpoint];
}
