/**
 * Perspective Rotate 3D Effect
 * True 3D rotation of text with proper perspective and depth
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, boolean } from '../../core/ParameterTypes';
import { WebGL3DEffect, Ease3D } from './WebGL3DEffect';
import { CharacterMesh } from '../../../../services/threeRenderer';

export class PerspectiveRotate3DEffect extends WebGL3DEffect {
  readonly id = 'perspective-rotate-3d';
  readonly name = 'Perspective Rotate 3D';
  readonly parameters: EffectParameter[] = [
    slider('rotationX', 'X Rotation', 0, -90, 90, 1, 'deg'),
    slider('rotationY', 'Y Rotation', 30, -90, 90, 1, 'deg'),
    slider('rotationZ', 'Z Rotation', 0, -180, 180, 1, 'deg'),
    slider('animationSpeed', 'Animation Speed', 1, 0, 5, 0.1),
    boolean('audioReactive', 'Audio Reactive', true),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
    boolean('perCharacter', 'Per-Character Animation', false),
    slider('stagger', 'Character Stagger', 0.1, 0, 0.5, 0.01, 's'),
  ];

  protected applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void {
    let rotationX = this.getParameter<number>('rotationX');
    let rotationY = this.getParameter<number>('rotationY');
    let rotationZ = this.getParameter<number>('rotationZ');
    const animationSpeed = this.getParameter<number>('animationSpeed');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');
    const perCharacter = this.getParameter<boolean>('perCharacter');
    const stagger = this.getParameter<number>('stagger');

    const { currentTime, progress, audioData } = context;

    // Audio reactivity
    let audioBoost = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      const midNorm = audioData.mid / 255;
      audioBoost = 1 + (bassNorm * 0.5 + midNorm * 0.3) * audioIntensity;
    }

    // Animate rotation if speed > 0
    if (animationSpeed > 0) {
      const time = currentTime * animationSpeed;
      rotationX = rotationX * Math.sin(time);
      rotationY = rotationY * Math.cos(time * 0.7);
      rotationZ = rotationZ * Math.sin(time * 0.5);
    }

    // Convert to radians
    const rotXRad = ((rotationX * Math.PI) / 180) * audioBoost;
    const rotYRad = ((rotationY * Math.PI) / 180) * audioBoost;
    const rotZRad = (rotationZ * Math.PI) / 180;

    meshes.forEach((charMesh, index) => {
      const { mesh, originalPosition } = charMesh;
      if (!mesh) return;

      let charRotX = rotXRad;
      let charRotY = rotYRad;
      let charRotZ = rotZRad;

      if (perCharacter) {
        // Staggered per-character animation
        const charProgress = Math.max(0, progress - index * stagger);
        const easedProgress = Ease3D.easeOut(Math.min(charProgress * 2, 1));

        charRotX *= easedProgress;
        charRotY *= easedProgress;
        charRotZ *= easedProgress;

        // Add wave-like offset per character
        const waveOffset = Math.sin(currentTime * 2 + index * 0.3);
        charRotY += waveOffset * 0.2;
      }

      // Apply rotation
      mesh.rotation.set(charRotX, charRotY, charRotZ);

      // Reset position to original
      mesh.position.copy(originalPosition);

      // Calculate opacity based on rotation (fade when facing away)
      const facingCamera = Math.cos(charRotY) * Math.cos(charRotX);
      mesh.fillOpacity = Math.max(0.3, facingCamera);
    });
  }
}
