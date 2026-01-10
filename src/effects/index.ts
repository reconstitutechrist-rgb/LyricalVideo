/**
 * Effects System - Main Export
 *
 * This module provides the complete effect system for LyricalVideo including:
 * - Core effect infrastructure (base classes, registry, composer)
 * - Lyric effects (character, physics, 3D transforms)
 * - Background effects (existing styles, genre-aware)
 * - Utility functions (math, canvas helpers)
 */

// Core exports
export * from './core';
export * from './utils';
export * from './particle';

// Effect categories
export * from './lyric';
export * from './background';

// Import registration functions
import { registerLyricEffects } from './lyric';
import { registerBackgroundEffects } from './background';

/**
 * Initialize and register all effects
 * Call this once at app startup
 */
export function initializeEffects(): void {
  registerLyricEffects();
  registerBackgroundEffects();
  console.log('Effects system initialized');
}
