/**
 * Lyric Effects - Barrel Export and Registration
 */

import { EffectRegistry } from '../core/EffectRegistry';

// Base class
export * from './LyricEffect';

// Character-level effects
export * from './character';

// 3D transform effects (Canvas 2D simulated)
export * from './transform3d';

// Physics-based effects
export * from './physics';

// WebGL 3D effects (true 3D with Three.js)
export * from './webgl3d';

// Mask effects
export * from './mask';

// Path effects
export * from './path';

// Blur effects
export * from './blur';

// Import all effects for registration
import { WaveEffect } from './character/Wave';
import { RainbowCycleEffect } from './character/RainbowCycle';
import { CharacterPopEffect } from './character/CharacterPop';
import { LetterShuffleEffect } from './character/LetterShuffle';
import { ScatterEffect } from './character/Scatter';
// New character effects
import { GlitchRevealEffect } from './character/GlitchReveal';
import { LiquidMorphEffect } from './character/LiquidMorph';
import { NeonFlickerEffect } from './character/NeonFlicker';
import { ParticleAssembleEffect } from './character/ParticleAssemble';
import { TypewriterModernEffect } from './character/TypewriterModern';
import { ZoomCrashEffect } from './character/ZoomCrash';
import { HandwrittenStrokeEffect } from './character/HandwrittenStroke';
import { SplitRevealEffect } from './character/SplitReveal';

import { TwistEffect } from './transform3d/Twist';
import { FlipEffect } from './transform3d/Flip';
import { PerspectiveRotateEffect } from './transform3d/PerspectiveRotate';
import { DepthZoomEffect } from './transform3d/DepthZoom';

import { WindDissolveEffect } from './physics/WindDissolve';
import { GravityFallEffect } from './physics/GravityFall';
import { ExplodeEffect } from './physics/Explode';
import { ParticleBurstEffect } from './physics/ParticleBurst';

// WebGL 3D effects
import { PerspectiveRotate3DEffect } from './webgl3d/PerspectiveRotate3D';
import { Extrude3DEffect } from './webgl3d/Extrude3D';
import { Orbit3DEffect } from './webgl3d/Orbit3D';
import { Wave3DEffect } from './webgl3d/Wave3D';
import { Explode3DEffect } from './webgl3d/Explode3D';

// Mask effects
import { CircleMaskEffect } from './mask/CircleMask';
import { RectangleMaskEffect } from './mask/RectangleMask';
import { ShapeMaskEffect } from './mask/ShapeMask';

// Path effects
import { TextPathEffect } from './path/TextPath';

// Blur effects
import { MotionBlurEffect } from './blur/MotionBlur';

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

  // New character-level effects
  EffectRegistry.register(GlitchRevealEffect, {
    description: 'Characters scramble as random symbols then resolve',
    tags: ['character', 'glitch', 'reveal', 'digital'],
  });

  EffectRegistry.register(LiquidMorphEffect, {
    description: 'Letters melt and flow into place like liquid mercury',
    tags: ['character', 'liquid', 'morph', 'metallic'],
  });

  EffectRegistry.register(NeonFlickerEffect, {
    description: 'Letters turn on like neon signs with flicker',
    tags: ['character', 'neon', 'flicker', 'glow'],
  });

  EffectRegistry.register(ParticleAssembleEffect, {
    description: 'Scattered particles converge to form text',
    tags: ['character', 'particle', 'assemble', 'converge'],
  });

  EffectRegistry.register(TypewriterModernEffect, {
    description: 'Enhanced typewriter with cursor and typos',
    tags: ['character', 'typewriter', 'cursor', 'typing'],
  });

  EffectRegistry.register(ZoomCrashEffect, {
    description: 'Text zooms from infinity and crashes into place',
    tags: ['character', 'zoom', 'crash', 'impact'],
  });

  EffectRegistry.register(HandwrittenStrokeEffect, {
    description: 'Letters drawn stroke by stroke like handwriting',
    tags: ['character', 'handwritten', 'stroke', 'draw'],
  });

  EffectRegistry.register(SplitRevealEffect, {
    description: 'Text splits apart and reassembles',
    tags: ['character', 'split', 'reveal', 'assemble'],
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

  // WebGL 3D effects (true 3D with Three.js)
  EffectRegistry.register(PerspectiveRotate3DEffect, {
    description: 'True 3D rotation with WebGL perspective',
    tags: ['webgl', '3d', 'rotation', 'perspective'],
  });

  EffectRegistry.register(Extrude3DEffect, {
    description: '3D extruded text with depth',
    tags: ['webgl', '3d', 'extrude', 'depth'],
  });

  EffectRegistry.register(Orbit3DEffect, {
    description: 'Characters orbit in true 3D space',
    tags: ['webgl', '3d', 'orbit', 'motion'],
  });

  EffectRegistry.register(Wave3DEffect, {
    description: 'Sine wave in Z-space (depth)',
    tags: ['webgl', '3d', 'wave', 'depth'],
  });

  EffectRegistry.register(Explode3DEffect, {
    description: 'Characters explode in true 3D',
    tags: ['webgl', '3d', 'explode', 'physics'],
  });

  // Mask effects
  EffectRegistry.register(CircleMaskEffect, {
    description: 'Text revealed through animated circular mask',
    tags: ['mask', 'circle', 'reveal', 'clip'],
  });

  EffectRegistry.register(RectangleMaskEffect, {
    description: 'Text revealed through animated rectangular mask',
    tags: ['mask', 'rectangle', 'wipe', 'reveal'],
  });

  EffectRegistry.register(ShapeMaskEffect, {
    description: 'Text revealed through shape masks (heart, star, polygon)',
    tags: ['mask', 'shape', 'heart', 'star', 'polygon'],
  });

  // Path effects
  EffectRegistry.register(TextPathEffect, {
    description: 'Text follows and animates along bezier curve paths',
    tags: ['path', 'bezier', 'curve', 'motion'],
  });

  // Blur effects
  EffectRegistry.register(MotionBlurEffect, {
    description: 'Per-character motion blur based on velocity',
    tags: ['blur', 'motion', 'velocity', 'trail'],
  });
}
