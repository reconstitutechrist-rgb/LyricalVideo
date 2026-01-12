/**
 * Explode 3D Effect
 * Characters explode outward in true 3D space
 */

import * as THREE from 'three';
import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { WebGL3DEffect, Ease3D } from './WebGL3DEffect';
import { CharacterMesh } from '../../../../services/threeRenderer';

interface ParticleState {
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  startTime: number;
}

export class Explode3DEffect extends WebGL3DEffect {
  readonly id = 'explode-3d';
  readonly name = 'Explode 3D';
  readonly parameters: EffectParameter[] = [
    slider('explosionForce', 'Explosion Force', 300, 50, 800, 10, 'px'),
    slider('explosionSpeed', 'Explosion Speed', 2, 0.5, 5, 0.1),
    enumParam('timing', 'Timing', 'end', [
      { value: 'start', label: 'On Entry' },
      { value: 'end', label: 'On Exit' },
      { value: 'middle', label: 'Mid-way' },
      { value: 'audio', label: 'On Bass Hit' },
    ]),
    slider('triggerThreshold', 'Trigger Point', 0.7, 0, 1, 0.05),
    boolean('randomDirection', 'Random Directions', true),
    slider('gravity', 'Gravity', 0.5, 0, 2, 0.1),
    boolean('audioReactive', 'Audio Reactive', true),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
    slider('rotationSpeed', 'Rotation Speed', 2, 0, 10, 0.5),
    boolean('fadeOut', 'Fade Out', true),
  ];

  // State for each character's particle physics
  private particleStates: Map<string, ParticleState[]> = new Map();
  private isExploding: boolean = false;
  private explodeStartTime: number = 0;
  private lastBassHit: number = 0;

  protected applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void {
    const explosionForce = this.getParameter<number>('explosionForce');
    const explosionSpeed = this.getParameter<number>('explosionSpeed');
    const timing = this.getParameter<string>('timing');
    const triggerThreshold = this.getParameter<number>('triggerThreshold');
    const randomDirection = this.getParameter<boolean>('randomDirection');
    const gravity = this.getParameter<number>('gravity');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');
    const rotationSpeed = this.getParameter<number>('rotationSpeed');
    const fadeOut = this.getParameter<boolean>('fadeOut');

    const { currentTime, progress, audioData, lyric } = context;
    const lyricId = lyric.id;

    // Determine if we should trigger explosion
    let shouldExplode = false;
    switch (timing) {
      case 'start':
        shouldExplode = progress >= 0.1 && progress < triggerThreshold;
        break;
      case 'end':
        shouldExplode = progress >= triggerThreshold;
        break;
      case 'middle':
        shouldExplode = progress >= 0.4 && progress <= 0.6;
        break;
      case 'audio': {
        // Trigger on bass hit
        const bassNorm = audioData.bass / 255;
        if (bassNorm > 0.8 && currentTime - this.lastBassHit > 0.5) {
          shouldExplode = true;
          this.lastBassHit = currentTime;
        }
        break;
      }
    }

    // Initialize or get particle states
    if (!this.particleStates.has(lyricId)) {
      const states: ParticleState[] = meshes.map((_, index) => {
        const angle = randomDirection
          ? Math.random() * Math.PI * 2
          : (index / meshes.length) * Math.PI * 2;
        const elevation = randomDirection ? (Math.random() - 0.5) * Math.PI : Math.sin(index) * 0.5;

        const velocity = new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation),
          Math.sin(elevation) + 0.5,
          Math.sin(angle) * Math.cos(elevation)
        ).multiplyScalar(explosionForce * (0.5 + Math.random() * 0.5));

        const rotationVelocity = new THREE.Vector3(
          (Math.random() - 0.5) * rotationSpeed,
          (Math.random() - 0.5) * rotationSpeed,
          (Math.random() - 0.5) * rotationSpeed
        );

        return {
          velocity,
          rotationVelocity,
          startTime: 0,
        };
      });
      this.particleStates.set(lyricId, states);
    }

    // Start explosion
    if (shouldExplode && !this.isExploding) {
      this.isExploding = true;
      this.explodeStartTime = currentTime;
    }

    // Audio boost
    let forceBoost = 1;
    if (audioReactive && this.isExploding) {
      const bassNorm = audioData.bass / 255;
      forceBoost = 1 + bassNorm * audioIntensity;
    }

    const states = this.particleStates.get(lyricId) || [];
    const _explosionDuration = 2 / explosionSpeed; // Duration for full explosion animation
    const timeSinceExplosion = this.isExploding ? currentTime - this.explodeStartTime : 0;

    meshes.forEach((charMesh, index) => {
      const { mesh, originalPosition } = charMesh;
      if (!mesh) return;

      const state = states[index];
      if (!state) return;

      if (!this.isExploding) {
        // Before explosion - entry animation
        const entryProgress = Ease3D.easeOut(Math.min(progress * 3, 1));
        mesh.position.copy(originalPosition);
        mesh.scale.setScalar(entryProgress);
        mesh.rotation.set(0, 0, 0);
        mesh.fillOpacity = entryProgress;
      } else {
        // During explosion
        const t = Math.min(timeSinceExplosion * explosionSpeed, 1);
        const easedT = Ease3D.easeOut(t);

        // Calculate position with physics
        const displacement = state.velocity.clone().multiplyScalar(easedT * forceBoost);

        // Apply gravity
        displacement.y -= gravity * 100 * t * t;

        mesh.position.copy(originalPosition).add(displacement);

        // Apply rotation
        mesh.rotation.x = state.rotationVelocity.x * timeSinceExplosion;
        mesh.rotation.y = state.rotationVelocity.y * timeSinceExplosion;
        mesh.rotation.z = state.rotationVelocity.z * timeSinceExplosion;

        // Fade out
        if (fadeOut) {
          mesh.fillOpacity = 1 - easedT;
        }

        // Scale down slightly as they fly away
        mesh.scale.setScalar(1 - easedT * 0.3);
      }
    });
  }

  reset(): void {
    super.reset();
    this.particleStates.clear();
    this.isExploding = false;
    this.explodeStartTime = 0;
  }
}
