/**
 * Effect Composer
 * Manages effect stacking, composition, and rendering order
 */

import {
  Effect,
  LyricEffect,
  BackgroundEffect,
  EffectContext,
  LyricEffectContext,
  EffectInstance,
} from './Effect';
import { EffectRegistry } from './EffectRegistry';
import { ParameterValues } from './ParameterTypes';
import { FrameBudgetManager, EffectPriority } from '../../utils/frameBudget';

/**
 * Active effect with its runtime instance
 */
interface ActiveEffect<T extends Effect = Effect> {
  instance: T;
  config: EffectInstance;
}

/**
 * Effect Composer - orchestrates effect rendering
 */
export class EffectComposer {
  private backgroundEffects: ActiveEffect<BackgroundEffect>[] = [];
  private lyricEffects: ActiveEffect<LyricEffect>[] = [];
  private lastFrameTime: number = 0;

  // Frame budget management
  private frameBudget: FrameBudgetManager | null = null;
  private budgetEnabled: boolean = false;

  /**
   * Set the active background effects
   */
  setBackgroundEffects(effects: EffectInstance[]): void {
    // Deactivate old effects
    for (const active of this.backgroundEffects) {
      active.instance.onDeactivate();
    }

    // Create new effect instances
    this.backgroundEffects = [];
    for (const config of effects) {
      if (!config.enabled) continue;

      const instance = EffectRegistry.createBackgroundEffect(config.effectId);
      if (instance) {
        instance.setParameterValues(config.parameters);
        instance.onActivate();
        this.backgroundEffects.push({ instance, config });
      }
    }
  }

  /**
   * Set the active lyric effects
   */
  setLyricEffects(effects: EffectInstance[]): void {
    // Deactivate old effects
    for (const active of this.lyricEffects) {
      active.instance.onDeactivate();
    }

    // Create new effect instances
    this.lyricEffects = [];
    for (const config of effects) {
      if (!config.enabled) continue;

      const instance = EffectRegistry.createLyricEffect(config.effectId);
      if (instance) {
        instance.setParameterValues(config.parameters);
        instance.onActivate();
        this.lyricEffects.push({ instance, config });
      }
    }
  }

  /**
   * Update a single effect's parameters
   */
  updateEffectParameters(
    effectId: string,
    category: 'lyric' | 'background',
    parameters: ParameterValues
  ): void {
    const effects = category === 'lyric' ? this.lyricEffects : this.backgroundEffects;
    const active = effects.find((e) => e.config.effectId === effectId);
    if (active) {
      active.instance.setParameterValues(parameters);
      active.config.parameters = { ...active.config.parameters, ...parameters };
    }
  }

  /**
   * Enable frame budget management
   */
  enableFrameBudget(targetFPS: number = 60): void {
    this.frameBudget = new FrameBudgetManager({ targetFPS, adaptiveQuality: true });
    this.budgetEnabled = true;
  }

  /**
   * Disable frame budget management
   */
  disableFrameBudget(): void {
    this.budgetEnabled = false;
  }

  /**
   * Get current frame budget stats
   */
  getFrameBudgetStats() {
    return this.frameBudget?.getStats() ?? null;
  }

  /**
   * Get current quality level from budget manager
   */
  getQualityLevel(): number {
    return this.frameBudget?.getQualityLevel() ?? 1;
  }

  /**
   * Begin frame budget timing (call at start of render loop)
   */
  beginFrame(): void {
    this.frameBudget?.begin();
  }

  /**
   * End frame budget timing (call at end of render loop)
   */
  endFrame(): void {
    this.frameBudget?.end();
  }

  /**
   * Render all background effects
   */
  renderBackground(context: EffectContext): void {
    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = now;

    const ctx = context.ctx;

    for (let i = 0; i < this.backgroundEffects.length; i++) {
      const active = this.backgroundEffects[i];

      // Check frame budget if enabled (background effects are normal priority)
      if (this.budgetEnabled && this.frameBudget) {
        // First effect is higher priority
        const priority = i === 0 ? EffectPriority.HIGH : EffectPriority.NORMAL;
        if (!this.frameBudget.hasTimeFor(priority, 2)) {
          continue; // Skip this effect to maintain frame rate
        }
      }

      ctx.save();
      try {
        active.instance.render({
          ...context,
          deltaTime,
        });
      } catch (error) {
        console.error(`Error rendering background effect ${active.config.effectId}:`, error);
      }
      ctx.restore();
    }
  }

  /**
   * Render all lyric effects for a given lyric
   */
  renderLyric(context: LyricEffectContext): void {
    const ctx = context.ctx;

    // If no lyric effects, render text normally
    if (this.lyricEffects.length === 0) {
      this.renderDefaultText(context);
      return;
    }

    // Apply each lyric effect in order
    // Lyrics are critical priority - they should always render
    for (let i = 0; i < this.lyricEffects.length; i++) {
      const active = this.lyricEffects[i];

      // Check frame budget if enabled
      // First lyric effect is critical (text must show), others are high priority
      if (this.budgetEnabled && this.frameBudget && i > 0) {
        if (!this.frameBudget.hasTimeFor(EffectPriority.HIGH, 2)) {
          // Skip remaining effects to maintain frame rate
          // First effect (i=0) has already rendered, so no fallback needed
          break;
        }
      }

      ctx.save();
      try {
        active.instance.renderLyric(context);
      } catch (error) {
        console.error(`Error rendering lyric effect ${active.config.effectId}:`, error);
      }
      ctx.restore();
    }
  }

  /**
   * Default text rendering when no lyric effects are active
   */
  private renderDefaultText(context: LyricEffectContext): void {
    const { ctx, text, x, y, fontSize, fontFamily, color } = context;

    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  /**
   * Reset all effects (e.g., when changing lyrics)
   */
  resetAll(): void {
    for (const active of this.backgroundEffects) {
      active.instance.reset();
    }
    for (const active of this.lyricEffects) {
      active.instance.reset();
    }
  }

  /**
   * Reset lyric effects only
   */
  resetLyricEffects(): void {
    for (const active of this.lyricEffects) {
      active.instance.reset();
    }
  }

  /**
   * Get active background effect IDs
   */
  getActiveBackgroundEffects(): string[] {
    return this.backgroundEffects.map((e) => e.config.effectId);
  }

  /**
   * Get active lyric effect IDs
   */
  getActiveLyricEffects(): string[] {
    return this.lyricEffects.map((e) => e.config.effectId);
  }

  /**
   * Dispose all effects and clean up
   */
  dispose(): void {
    for (const active of this.backgroundEffects) {
      active.instance.onDeactivate();
    }
    for (const active of this.lyricEffects) {
      active.instance.onDeactivate();
    }
    this.backgroundEffects = [];
    this.lyricEffects = [];
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.dispose();
  }

  /**
   * Add a single effect to the composer
   */
  addEffect(effect: Effect): void {
    const config: EffectInstance = {
      effectId: effect.id,
      parameters: effect.getParameterValues(),
      enabled: true,
    };

    if (effect.category === 'lyric') {
      effect.onActivate();
      this.lyricEffects.push({
        instance: effect as LyricEffect,
        config,
      });
    } else if (effect.category === 'background') {
      effect.onActivate();
      this.backgroundEffects.push({
        instance: effect as BackgroundEffect,
        config,
      });
    }
  }

  /**
   * Remove a single effect by ID
   */
  removeEffect(effectId: string): void {
    const lyricIndex = this.lyricEffects.findIndex((e) => e.config.effectId === effectId);
    if (lyricIndex >= 0) {
      this.lyricEffects[lyricIndex].instance.onDeactivate();
      this.lyricEffects.splice(lyricIndex, 1);
      return;
    }

    const bgIndex = this.backgroundEffects.findIndex((e) => e.config.effectId === effectId);
    if (bgIndex >= 0) {
      this.backgroundEffects[bgIndex].instance.onDeactivate();
      this.backgroundEffects.splice(bgIndex, 1);
    }
  }
}

// Singleton instance for global use
export const globalComposer = new EffectComposer();
