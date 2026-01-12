/**
 * Base Effect System
 * Provides the foundation for all visual effects in LyricalVideo
 */

import { EffectParameter, ParameterValues, getDefaultValues } from './ParameterTypes';
import { LyricLine, VisualSettings, ColorPalette } from '../../../types';

/**
 * Audio frequency data passed to effects
 */
export interface AudioData {
  // Frequency bands (0-255)
  bass: number;
  mid: number;
  treble: number;
  average: number;
  raw: Uint8Array; // Full frequency data

  // Beat detection
  isBeat: boolean; // True on beat frames
  beatIntensity: number; // 0-1 strength of detected beat
  timeSinceBeat: number; // Seconds since last beat (for decay effects)

  // Rhythm info
  bpm: number; // Estimated tempo
  beatPhase: number; // 0-1 position within current beat

  // Energy dynamics
  energy: number; // 0-1 overall energy level
  energyDelta: number; // Rate of change (positive = buildup)

  // Spectral features
  spectralCentroid: number; // "Brightness" of sound
  spectralFlux: number; // Rate of spectral change (onset indicator)
}

/**
 * Context provided to effects during rendering
 */
export interface EffectContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  currentTime: number;
  deltaTime: number;
  audioData: AudioData;
  settings: VisualSettings;
  palette: ColorPalette;
}

/**
 * Additional context for lyric effects
 */
export interface LyricEffectContext extends EffectContext {
  lyric: LyricLine;
  progress: number; // 0-1 progress through the lyric
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

/**
 * Effect categories
 */
export type EffectCategory = 'lyric' | 'background' | 'overlay';

/**
 * Base abstract class for all effects
 */
export abstract class Effect {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: EffectCategory;
  abstract readonly parameters: EffectParameter[];

  protected paramValues: ParameterValues = {};
  protected isActive: boolean = false;

  constructor() {
    // Initialize with default values after parameters are defined
    setTimeout(() => {
      this.paramValues = getDefaultValues(this.parameters);
    }, 0);
  }

  /**
   * Initialize parameter values
   */
  init(): void {
    this.paramValues = getDefaultValues(this.parameters);
  }

  /**
   * Set a parameter value
   */
  setParameter(id: string, value: number | string | boolean): void {
    this.paramValues[id] = value;
  }

  /**
   * Get a parameter value
   */
  getParameter<T extends number | string | boolean>(id: string): T {
    return this.paramValues[id] as T;
  }

  /**
   * Get all parameter values
   */
  getParameterValues(): ParameterValues {
    return { ...this.paramValues };
  }

  /**
   * Set all parameter values at once
   */
  setParameterValues(values: ParameterValues): void {
    this.paramValues = { ...this.paramValues, ...values };
  }

  /**
   * Called when effect is activated
   */
  onActivate(): void {
    this.isActive = true;
  }

  /**
   * Called when effect is deactivated
   */
  onDeactivate(): void {
    this.isActive = false;
  }

  /**
   * Reset effect state (e.g., for new lyric line)
   */
  reset(): void {
    // Override in subclasses if needed
  }

  /**
   * Render the effect - must be implemented by subclasses
   */
  abstract render(context: EffectContext): void;
}

/**
 * Base class for lyric/text effects
 */
export abstract class LyricEffect extends Effect {
  readonly category: EffectCategory = 'lyric';

  /**
   * Render the lyric effect
   */
  abstract renderLyric(context: LyricEffectContext): void;

  /**
   * Default render delegates to renderLyric (should not be called directly for lyric effects)
   */
  render(_context: EffectContext): void {
    console.warn(`LyricEffect.render() called directly on ${this.id}. Use renderLyric() instead.`);
  }
}

/**
 * Base class for background effects
 */
export abstract class BackgroundEffect extends Effect {
  readonly category: EffectCategory = 'background';
}

/**
 * Instance of an effect with its parameter values
 */
export interface EffectInstance {
  effectId: string;
  parameters: ParameterValues;
  enabled: boolean;
}

/**
 * Create an effect instance
 */
export function createEffectInstance(
  effectId: string,
  parameters?: ParameterValues
): EffectInstance {
  return {
    effectId,
    parameters: parameters || {},
    enabled: true,
  };
}
