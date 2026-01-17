/**
 * Orbit 3D Effect
 * Characters orbit around a center point in true 3D space
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { WebGL3DEffect, Ease3D } from './WebGL3DEffect';
import { CharacterMesh } from '../../../../services/threeRenderer';

export class Orbit3DEffect extends WebGL3DEffect {
  readonly id = 'orbit-3d';
  readonly name = 'Orbit 3D';
  readonly parameters: EffectParameter[] = [
    slider('radius', 'Orbit Radius', 150, 50, 400, 10, 'px'),
    slider('speed', 'Orbit Speed', 1, 0.1, 5, 0.1),
    enumParam('orbitPlane', 'Orbit Plane', 'xz', [
      { value: 'xy', label: 'XY (Flat Circle)' },
      { value: 'xz', label: 'XZ (Horizontal)' },
      { value: 'yz', label: 'YZ (Vertical Side)' },
      { value: 'sphere', label: 'Spherical' },
    ]),
    slider('tiltAngle', 'Tilt Angle', 30, 0, 90, 5, 'deg'),
    boolean('faceCamera', 'Face Camera', true),
    boolean('audioReactive', 'Audio Reactive', true),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
    slider('stagger', 'Character Spread', 0.5, 0, 2, 0.1),
    boolean('scaleWithDepth', 'Scale With Depth', true),
  ];

  protected applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void {
    const radius = this.getParameter<number>('radius');
    const speed = this.getParameter<number>('speed');
    const orbitPlane = this.getParameter<string>('orbitPlane');
    const tiltAngle = this.getParameter<number>('tiltAngle');
    const faceCamera = this.getParameter<boolean>('faceCamera');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');
    const stagger = this.getParameter<number>('stagger');
    const scaleWithDepth = this.getParameter<boolean>('scaleWithDepth');

    const { currentTime, progress, audioData } = context;

    // Audio reactivity
    let radiusBoost = 1;
    let speedBoost = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      const midNorm = audioData.mid / 255;
      radiusBoost = 1 + bassNorm * audioIntensity * 0.3;
      speedBoost = 1 + midNorm * audioIntensity * 0.5;
    }

    const effectiveRadius = radius * radiusBoost;
    const effectiveSpeed = speed * speedBoost;
    const tiltRad = (tiltAngle * Math.PI) / 180;
    const totalChars = meshes.filter((m) => m.mesh).length;

    // Entry animation
    const entryProgress = Ease3D.easeOut(Math.min(progress * 2, 1));

    meshes.forEach((charMesh, index) => {
      const { mesh } = charMesh;
      if (!mesh) return;

      // Calculate base angle for this character
      const charOffset = (index / totalChars) * Math.PI * 2 * stagger;
      const baseAngle = currentTime * effectiveSpeed + charOffset;

      let x = 0,
        y = 0,
        z = 0;

      switch (orbitPlane) {
        case 'xy':
          // Flat circle in XY plane
          x = Math.cos(baseAngle) * effectiveRadius;
          y = Math.sin(baseAngle) * effectiveRadius;
          z = 0;
          break;

        case 'xz':
          // Horizontal orbit (like planets around sun)
          x = Math.cos(baseAngle) * effectiveRadius;
          y = Math.sin(tiltRad) * Math.sin(baseAngle) * effectiveRadius * 0.3;
          z = Math.sin(baseAngle) * effectiveRadius;
          break;

        case 'yz':
          // Vertical side orbit
          x = Math.sin(tiltRad) * Math.sin(baseAngle) * effectiveRadius * 0.3;
          y = Math.cos(baseAngle) * effectiveRadius;
          z = Math.sin(baseAngle) * effectiveRadius;
          break;

        case 'sphere': {
          // Spherical distribution
          const phi = baseAngle;
          const theta = (index / totalChars) * Math.PI;
          x = Math.sin(theta) * Math.cos(phi) * effectiveRadius;
          y = Math.sin(theta) * Math.sin(phi) * effectiveRadius * 0.5;
          z = Math.cos(theta) * effectiveRadius;
          break;
        }
      }

      // Apply entry animation
      x *= entryProgress;
      y *= entryProgress;
      z *= entryProgress;

      // Set position
      mesh.position.set(x, y, z);

      // Face camera if enabled
      if (faceCamera) {
        // Characters always face the camera
        mesh.rotation.set(0, 0, 0);
      } else {
        // Rotate based on orbit position
        mesh.rotation.y = -baseAngle;
        mesh.rotation.x = tiltRad;
      }

      // Scale with depth for perspective effect
      if (scaleWithDepth) {
        const depthFactor = 1 + (z / (effectiveRadius * 2)) * 0.5;
        mesh.scale.setScalar(Math.max(0.5, depthFactor));

        // Also adjust opacity
        mesh.fillOpacity = 0.6 + (1 + z / effectiveRadius) * 0.2;
      } else {
        mesh.scale.setScalar(1);
        mesh.fillOpacity = 1;
      }
    });
  }
}
