/**
 * Background Effects - Barrel Export and Registration
 */

import { EffectRegistry } from '../core/EffectRegistry';

// Base class
export * from './BackgroundEffect';

// Genre-aware effects
export * from './genre';

// Import all effects for registration
import { HipHopUrbanEffect } from './genre/HipHopUrban';
import { RockEnergyEffect } from './genre/RockEnergy';
import { ElectronicEDMEffect } from './genre/ElectronicEDM';
import { ClassicalElegantEffect } from './genre/ClassicalElegant';
import { PopVibrantEffect } from './genre/PopVibrant';
import { IndieDreamyEffect } from './genre/IndieDreamy';

/**
 * Register all background effects with the registry
 */
export function registerBackgroundEffects(): void {
  // Genre-aware effects
  EffectRegistry.register(HipHopUrbanEffect, {
    description: 'Bold geometric shapes with street vibes',
    tags: ['genre', 'hiphop', 'urban', 'bold'],
  });

  EffectRegistry.register(RockEnergyEffect, {
    description: 'High energy with stage lighting and distortion',
    tags: ['genre', 'rock', 'energy', 'aggressive'],
  });

  EffectRegistry.register(ElectronicEDMEffect, {
    description: 'Neon grids and synthwave aesthetics',
    tags: ['genre', 'electronic', 'edm', 'synthwave', 'neon'],
  });

  EffectRegistry.register(ClassicalElegantEffect, {
    description: 'Refined and minimal with soft particles',
    tags: ['genre', 'classical', 'elegant', 'minimal'],
  });

  EffectRegistry.register(PopVibrantEffect, {
    description: 'Bright and playful with bouncy shapes',
    tags: ['genre', 'pop', 'vibrant', 'colorful'],
  });

  EffectRegistry.register(IndieDreamyEffect, {
    description: 'Vintage soft bokeh with film grain',
    tags: ['genre', 'indie', 'dreamy', 'vintage'],
  });
}

/**
 * Map genre to recommended background effect
 */
export function getRecommendedBackgroundForGenre(genre: string): string {
  const genreMap: Record<string, string> = {
    hiphop: 'hiphop-urban',
    rock: 'rock-energy',
    metal: 'rock-energy',
    electronic: 'electronic-edm',
    edm: 'electronic-edm',
    classical: 'classical-elegant',
    jazz: 'classical-elegant',
    pop: 'pop-vibrant',
    indie: 'indie-dreamy',
    folk: 'indie-dreamy',
    rnb: 'hiphop-urban',
    country: 'indie-dreamy',
  };

  return genreMap[genre.toLowerCase()] || 'electronic-edm';
}
