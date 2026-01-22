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

// Abstract/Geometric effects
import { KaleidoscopeDreamEffect } from './genre/KaleidoscopeDream';
import { GeometricPulseEffect } from './genre/GeometricPulse';
import { FractalFlowEffect } from './genre/FractalFlow';
import { SpiralHypnosisEffect } from './genre/SpiralHypnosis';
import { SacredGeometryEffect } from './genre/SacredGeometry';

// Nature/Organic effects
import { AuroraWavesEffect } from './genre/AuroraWaves';
import { UnderwaterDeepEffect } from './genre/UnderwaterDeep';
import { ForestFirefliesEffect } from './genre/ForestFireflies';
import { StormElectricEffect } from './genre/StormElectric';
import { CherryBlossomsEffect } from './genre/CherryBlossoms';

// Retro/Vintage effects
import { SynthwaveSunsetEffect } from './genre/SynthwaveSunset';
import { DiscoFeverEffect } from './genre/DiscoFever';
import { PixelArcadeEffect } from './genre/PixelArcade';
import { VHSGlitchEffect } from './genre/VHSGlitch';
import { FilmProjectorEffect } from './genre/FilmProjector';

// Energy/Motion effects
import { WaveformBarsEffect } from './genre/WaveformBars';
import { PulseRingsEffect } from './genre/PulseRings';
import { ParticleVortexEffect } from './genre/ParticleVortex';
import { LiquidChromeEffect } from './genre/LiquidChrome';
import { NeonRainEffect } from './genre/NeonRain';

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

  // Abstract/Geometric effects
  EffectRegistry.register(KaleidoscopeDreamEffect, {
    description: 'Mirrored rotating segments with color shifting',
    tags: ['abstract', 'geometric', 'trippy', 'psychedelic'],
  });

  EffectRegistry.register(GeometricPulseEffect, {
    description: 'Concentric polygons pulsing with bass',
    tags: ['abstract', 'geometric', 'pulse', 'minimal'],
  });

  EffectRegistry.register(FractalFlowEffect, {
    description: 'Organic flowing patterns with perlin noise',
    tags: ['abstract', 'organic', 'flow', 'ambient'],
  });

  EffectRegistry.register(SpiralHypnosisEffect, {
    description: 'Rotating spirals with depth illusion',
    tags: ['abstract', 'spiral', 'hypnotic', 'trippy'],
  });

  EffectRegistry.register(SacredGeometryEffect, {
    description: 'Flower of life and metatron cube patterns',
    tags: ['abstract', 'geometric', 'sacred', 'spiritual'],
  });

  // Nature/Organic effects
  EffectRegistry.register(AuroraWavesEffect, {
    description: 'Northern lights flowing curtains',
    tags: ['nature', 'aurora', 'ethereal', 'calm'],
  });

  EffectRegistry.register(UnderwaterDeepEffect, {
    description: 'Bubbles, caustics, and ocean light rays',
    tags: ['nature', 'underwater', 'ocean', 'serene'],
  });

  EffectRegistry.register(ForestFirefliesEffect, {
    description: 'Glowing particles in magical forest',
    tags: ['nature', 'forest', 'fireflies', 'magical'],
  });

  EffectRegistry.register(StormElectricEffect, {
    description: 'Lightning bolts, rain, and dark clouds',
    tags: ['nature', 'storm', 'lightning', 'dramatic'],
  });

  EffectRegistry.register(CherryBlossomsEffect, {
    description: 'Falling petals with soft pink aesthetic',
    tags: ['nature', 'cherry', 'blossoms', 'serene', 'japanese'],
  });

  // Retro/Vintage effects
  EffectRegistry.register(SynthwaveSunsetEffect, {
    description: 'Palm trees, sun, and neon grid horizon',
    tags: ['retro', 'synthwave', '80s', 'neon', 'sunset'],
  });

  EffectRegistry.register(DiscoFeverEffect, {
    description: 'Mirror ball, light beams, and dance floor',
    tags: ['retro', 'disco', '70s', 'party', 'dance'],
  });

  EffectRegistry.register(PixelArcadeEffect, {
    description: '8-bit blocks and retro game aesthetic',
    tags: ['retro', 'pixel', 'arcade', '8bit', 'game'],
  });

  EffectRegistry.register(VHSGlitchEffect, {
    description: 'Tracking lines, RGB split, tape noise',
    tags: ['retro', 'vhs', 'glitch', 'distortion', 'analog'],
  });

  EffectRegistry.register(FilmProjectorEffect, {
    description: 'Dust, scratches, and frame flicker',
    tags: ['retro', 'film', 'vintage', 'cinema', 'grain'],
  });

  // Energy/Motion effects
  EffectRegistry.register(WaveformBarsEffect, {
    description: 'Classic audio spectrum visualization',
    tags: ['energy', 'waveform', 'spectrum', 'audio', 'bars'],
  });

  EffectRegistry.register(PulseRingsEffect, {
    description: 'Expanding circles synced to beat',
    tags: ['energy', 'pulse', 'rings', 'beat', 'ripple'],
  });

  EffectRegistry.register(ParticleVortexEffect, {
    description: 'Swirling particles into center',
    tags: ['energy', 'vortex', 'particles', 'spiral', 'galaxy'],
  });

  EffectRegistry.register(LiquidChromeEffect, {
    description: 'Metallic flowing reflections',
    tags: ['energy', 'chrome', 'liquid', 'metallic', 'futuristic'],
  });

  EffectRegistry.register(NeonRainEffect, {
    description: 'Matrix-style falling characters',
    tags: ['energy', 'matrix', 'neon', 'rain', 'cyber'],
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
    // Genre effects
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
    // New effect mappings
    psychedelic: 'kaleidoscope-dream',
    trance: 'spiral-hypnosis',
    meditation: 'sacred-geometry',
    newage: 'sacred-geometry',
    nature: 'aurora-waves',
    aquatic: 'underwater-deep',
    forest: 'forest-fireflies',
    storm: 'storm-electric',
    japanese: 'cherry-blossoms',
    anime: 'cherry-blossoms',
    synthwave: 'synthwave-sunset',
    retrowave: 'synthwave-sunset',
    disco: 'disco-fever',
    funk: 'disco-fever',
    chiptune: 'pixel-arcade',
    '8bit': 'pixel-arcade',
    vaporwave: 'vhs-glitch',
    cinematic: 'film-projector',
    orchestral: 'film-projector',
    dnb: 'waveform-bars',
    'drum and bass': 'waveform-bars',
    dubstep: 'pulse-rings',
    bass: 'pulse-rings',
    progressive: 'particle-vortex',
    industrial: 'liquid-chrome',
    cyberpunk: 'neon-rain',
    darkwave: 'neon-rain',
  };

  return genreMap[genre.toLowerCase()] || 'electronic-edm';
}
