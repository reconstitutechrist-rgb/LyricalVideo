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
// New effects
import { LoFiChillEffect } from './genre/LoFiChill';
import { MetalInfernoEffect } from './genre/MetalInferno';
import { JazzLoungeEffect } from './genre/JazzLounge';
import { ReggaeTropicalEffect } from './genre/ReggaeTropical';
import { AmbientSpaceEffect } from './genre/AmbientSpace';
import { PunkZineEffect } from './genre/PunkZine';
import { CountryWesternEffect } from './genre/CountryWestern';
import { FutureBassEffect } from './genre/FutureBass';

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

  // New genre effects
  EffectRegistry.register(LoFiChillEffect, {
    description: 'Cozy aesthetic with rain, steam, and warm lighting',
    tags: ['genre', 'lofi', 'chill', 'cozy', 'ambient'],
  });

  EffectRegistry.register(MetalInfernoEffect, {
    description: 'Intense fire, smoke, and aggressive visuals',
    tags: ['genre', 'metal', 'fire', 'aggressive', 'intense'],
  });

  EffectRegistry.register(JazzLoungeEffect, {
    description: 'Sophisticated club ambiance with spotlight and smoke',
    tags: ['genre', 'jazz', 'lounge', 'sophisticated', 'club'],
  });

  EffectRegistry.register(ReggaeTropicalEffect, {
    description: 'Island vibes with palm trees, sunset, and rasta colors',
    tags: ['genre', 'reggae', 'tropical', 'island', 'caribbean'],
  });

  EffectRegistry.register(AmbientSpaceEffect, {
    description: 'Ethereal space environment with stars and nebula',
    tags: ['genre', 'ambient', 'space', 'cosmic', 'ethereal'],
  });

  EffectRegistry.register(PunkZineEffect, {
    description: 'DIY punk zine aesthetic with collage and rough textures',
    tags: ['genre', 'punk', 'zine', 'diy', 'collage'],
  });

  EffectRegistry.register(CountryWesternEffect, {
    description: 'Desert sunset, dusty trails, and rustic Americana',
    tags: ['genre', 'country', 'western', 'desert', 'rustic'],
  });

  EffectRegistry.register(FutureBassEffect, {
    description: 'Colorful kawaii visuals with soft gradients and shapes',
    tags: ['genre', 'futurebass', 'kawaii', 'pastel', 'colorful'],
  });
}

/**
 * Map genre to recommended background effect
 */
export function getRecommendedBackgroundForGenre(genre: string): string {
  const genreMap: Record<string, string> = {
    // Original mappings
    hiphop: 'hiphop-urban',
    rock: 'rock-energy',
    electronic: 'electronic-edm',
    edm: 'electronic-edm',
    classical: 'classical-elegant',
    pop: 'pop-vibrant',
    indie: 'indie-dreamy',
    folk: 'indie-dreamy',
    rnb: 'hiphop-urban',
    // New mappings
    metal: 'metal-inferno',
    jazz: 'jazz-lounge',
    lofi: 'lofi-chill',
    'lo-fi': 'lofi-chill',
    chill: 'lofi-chill',
    reggae: 'reggae-tropical',
    tropical: 'reggae-tropical',
    caribbean: 'reggae-tropical',
    ambient: 'ambient-space',
    chillout: 'ambient-space',
    space: 'ambient-space',
    punk: 'punk-zine',
    hardcore: 'punk-zine',
    country: 'country-western',
    western: 'country-western',
    americana: 'country-western',
    futurebass: 'future-bass',
    'future bass': 'future-bass',
    kawaii: 'future-bass',
    house: 'electronic-edm',
    techno: 'electronic-edm',
    trap: 'hiphop-urban',
  };

  return genreMap[genre.toLowerCase()] || 'electronic-edm';
}
