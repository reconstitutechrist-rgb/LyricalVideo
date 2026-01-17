/**
 * WebGL Renderers
 * GPU-accelerated rendering utilities
 */

export { WebGLParticleRenderer, type ParticleData } from './WebGLParticleRenderer';
export { WebGLWaveformRenderer } from './WebGLWaveformRenderer';
export {
  WebGLEffectsRenderer,
  type FilmGrainOptions,
  type VignetteOptions,
  type ChromaticAberrationOptions,
} from './WebGLEffectsRenderer';

/**
 * Particle System
 */
export { Particle, type ParticlePosition } from './Particle';

/**
 * Visual Style Renderers
 */
export * from './visualStyles';

/**
 * Check if WebGL is supported in the current environment
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
