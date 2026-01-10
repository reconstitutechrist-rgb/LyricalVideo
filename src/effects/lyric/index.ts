/**
 * Lyric Effects - Barrel Export and Registration
 */

import { EffectRegistry } from '../core/EffectRegistry';

// Base class
export * from './LyricEffect';

// Character-level effects
export * from './character';

// 3D transform effects
export * from './transform3d';

// Physics-based effects
export * from './physics';

// Import all effects for registration
import { WaveEffect } from './character/Wave';
import { RainbowCycleEffect } from './character/RainbowCycle';
import { CharacterPopEffect } from './character/CharacterPop';
import { LetterShuffleEffect } from './character/LetterShuffle';
import { ScatterEffect } from './character/Scatter';

import { TwistEffect } from './transform3d/Twist';
import { FlipEffect } from './transform3d/Flip';
import { PerspectiveRotateEffect } from './transform3d/PerspectiveRotate';
import { DepthZoomEffect } from './transform3d/DepthZoom';

import { WindDissolveEffect } from './physics/WindDissolve';
import { GravityFallEffect } from './physics/GravityFall';
import { ExplodeEffect } from './physics/Explode';
import { ParticleBurstEffect } from './physics/ParticleBurst';

/**
 * Register all lyric effects with the registry
 */
export function registerLyricEffects(): void {
  // Character-level effects
  EffectRegistry.register(WaveEffect, {
    description: 'Sine wave animation applied to each character',
    tags: ['character', 'wave', 'motion'],
  });

  EffectRegistry.register(RainbowCycleEffect, {
    description: 'Cycling rainbow colors for each character',
    tags: ['character', 'color', 'rainbow'],
  });

  EffectRegistry.register(CharacterPopEffect, {
    description: 'Bouncy pop-in animation for each character',
    tags: ['character', 'pop', 'bounce', 'entrance'],
  });

  EffectRegistry.register(LetterShuffleEffect, {
    description: 'Scrambled letters that reveal the correct text',
    tags: ['character', 'shuffle', 'reveal', 'glitch'],
  });

  EffectRegistry.register(ScatterEffect, {
    description: 'Characters scatter and reassemble',
    tags: ['character', 'scatter', 'motion'],
  });

  // 3D transform effects
  EffectRegistry.register(TwistEffect, {
    description: 'Simulated 3D twist transformation',
    tags: ['3d', 'twist', 'perspective'],
  });

  EffectRegistry.register(FlipEffect, {
    description: 'Simulated 3D flip animation',
    tags: ['3d', 'flip', 'rotation'],
  });

  EffectRegistry.register(PerspectiveRotateEffect, {
    description: 'Perspective-based rotation with vanishing point',
    tags: ['3d', 'perspective', 'rotation'],
  });

  EffectRegistry.register(DepthZoomEffect, {
    description: 'Zoom effect with depth blur simulation',
    tags: ['3d', 'zoom', 'depth', 'blur'],
  });

  // Physics-based effects
  EffectRegistry.register(WindDissolveEffect, {
    description: 'Text dissolves into wind-blown particles',
    tags: ['physics', 'wind', 'particles', 'dissolve'],
  });

  EffectRegistry.register(GravityFallEffect, {
    description: 'Characters fall with gravity and bounce',
    tags: ['physics', 'gravity', 'fall', 'bounce'],
  });

  EffectRegistry.register(ExplodeEffect, {
    description: 'Text shatters into exploding fragments',
    tags: ['physics', 'explode', 'shatter', 'fragments'],
  });

  EffectRegistry.register(ParticleBurstEffect, {
    description: 'Particles burst from text on appearance',
    tags: ['physics', 'particles', 'burst', 'entrance'],
  });
}
