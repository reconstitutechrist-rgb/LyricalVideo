/**
 * Effect Registry
 * Central registration and management of all effects
 */

import { Effect, LyricEffect, BackgroundEffect, EffectCategory } from './Effect';

/**
 * Effect metadata for UI display
 */
export interface EffectMetadata {
  id: string;
  name: string;
  category: EffectCategory;
  description?: string;
  icon?: string;
  tags?: string[];
}

/**
 * Effect constructor type
 */
type EffectConstructor<T extends Effect = Effect> = new () => T;

/**
 * Registry entry
 */
interface RegistryEntry<T extends Effect = Effect> {
  constructor: EffectConstructor<T>;
  metadata: EffectMetadata;
}

/**
 * Central registry for all effects
 */
class EffectRegistryClass {
  private effects: Map<string, RegistryEntry> = new Map();
  private lyricEffects: Map<string, RegistryEntry<LyricEffect>> = new Map();
  private backgroundEffects: Map<string, RegistryEntry<BackgroundEffect>> = new Map();

  /**
   * Register an effect
   */
  register<T extends Effect>(
    constructor: EffectConstructor<T>,
    metadata?: Partial<EffectMetadata>
  ): void {
    // Create a temporary instance to get the effect info
    const instance = new constructor();

    const fullMetadata: EffectMetadata = {
      id: instance.id,
      name: instance.name,
      category: instance.category,
      ...metadata,
    };

    const entry: RegistryEntry<T> = {
      constructor,
      metadata: fullMetadata,
    };

    this.effects.set(instance.id, entry as RegistryEntry);

    // Also register in category-specific maps
    if (instance.category === 'lyric') {
      this.lyricEffects.set(instance.id, entry as unknown as RegistryEntry<LyricEffect>);
    } else if (instance.category === 'background') {
      this.backgroundEffects.set(instance.id, entry as unknown as RegistryEntry<BackgroundEffect>);
    }
  }

  /**
   * Create a new instance of an effect
   */
  create<T extends Effect>(id: string): T | null {
    const entry = this.effects.get(id);
    if (!entry) {
      console.warn(`Effect not found: ${id}`);
      return null;
    }
    const instance = new entry.constructor() as T;
    instance.init();
    return instance;
  }

  /**
   * Create a lyric effect instance
   */
  createLyricEffect(id: string): LyricEffect | null {
    const entry = this.lyricEffects.get(id);
    if (!entry) {
      console.warn(`Lyric effect not found: ${id}`);
      return null;
    }
    const instance = new entry.constructor();
    instance.init();
    return instance;
  }

  /**
   * Create a background effect instance
   */
  createBackgroundEffect(id: string): BackgroundEffect | null {
    const entry = this.backgroundEffects.get(id);
    if (!entry) {
      console.warn(`Background effect not found: ${id}`);
      return null;
    }
    const instance = new entry.constructor();
    instance.init();
    return instance;
  }

  /**
   * Get metadata for an effect
   */
  getMetadata(id: string): EffectMetadata | null {
    const entry = this.effects.get(id);
    return entry?.metadata || null;
  }

  /**
   * Get all registered effects
   */
  getAll(): EffectMetadata[] {
    return Array.from(this.effects.values()).map((e) => e.metadata);
  }

  /**
   * Get all lyric effects
   */
  getLyricEffects(): EffectMetadata[] {
    return Array.from(this.lyricEffects.values()).map((e) => e.metadata);
  }

  /**
   * Get all background effects
   */
  getBackgroundEffects(): EffectMetadata[] {
    return Array.from(this.backgroundEffects.values()).map((e) => e.metadata);
  }

  /**
   * Get effects by tag
   */
  getByTag(tag: string): EffectMetadata[] {
    return this.getAll().filter((m) => m.tags?.includes(tag));
  }

  /**
   * Check if an effect exists
   */
  has(id: string): boolean {
    return this.effects.has(id);
  }

  /**
   * Get the number of registered effects
   */
  get size(): number {
    return this.effects.size;
  }
}

// Singleton instance
export const EffectRegistry = new EffectRegistryClass();

/**
 * Decorator to auto-register effects
 */
export function RegisterEffect(metadata?: Partial<EffectMetadata>) {
  return function <T extends Effect>(constructor: EffectConstructor<T>) {
    EffectRegistry.register(constructor, metadata);
    return constructor;
  };
}
