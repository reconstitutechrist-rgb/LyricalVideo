/**
 * Wave 3D Effect
 * Characters follow a sine wave in Z-space (toward/away from camera)
 */

import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { WebGL3DEffect, Ease3D } from './WebGL3DEffect';
import { CharacterMesh } from '../../../../services/threeRenderer';

export class Wave3DEffect extends WebGL3DEffect {
  readonly id = 'wave-3d';
  readonly name = 'Wave 3D';
  readonly parameters: EffectParameter[] = [
    slider('amplitude', 'Wave Amplitude', 100, 20, 300, 10, 'px'),
    slider('frequency', 'Wave Frequency', 1, 0.5, 5, 0.1),
    slider('speed', 'Wave Speed', 2, 0.5, 10, 0.5),
    enumParam('waveType', 'Wave Type', 'sine', [
      { value: 'sine', label: 'Sine Wave' },
      { value: 'cosine', label: 'Cosine Wave' },
      { value: 'zigzag', label: 'Zigzag' },
      { value: 'pulse', label: 'Pulse' },
    ]),
    enumParam('axis', 'Wave Axis', 'z', [
      { value: 'z', label: 'Z (Depth)' },
      { value: 'y', label: 'Y (Vertical)' },
      { value: 'both', label: 'Both Y + Z' },
    ]),
    boolean('audioReactive', 'Audio Reactive', true),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
    boolean('scaleWithWave', 'Scale With Wave', true),
    slider('rotationAmount', 'Rotation Amount', 15, 0, 45, 1, 'deg'),
  ];

  protected applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void {
    const amplitude = this.getParameter<number>('amplitude');
    const frequency = this.getParameter<number>('frequency');
    const speed = this.getParameter<number>('speed');
    const waveType = this.getParameter<string>('waveType');
    const axis = this.getParameter<string>('axis');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');
    const scaleWithWave = this.getParameter<boolean>('scaleWithWave');
    const rotationAmount = this.getParameter<number>('rotationAmount');

    const { currentTime, progress, audioData } = context;

    // Audio reactivity
    let amplitudeBoost = 1;
    let speedBoost = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      const trebleNorm = audioData.treble / 255;
      amplitudeBoost = 1 + bassNorm * audioIntensity;
      speedBoost = 1 + trebleNorm * audioIntensity * 0.5;
    }

    const effectiveAmplitude = amplitude * amplitudeBoost;
    const effectiveSpeed = speed * speedBoost;
    const rotationRad = (rotationAmount * Math.PI) / 180;

    // Entry animation
    const entryProgress = Ease3D.easeOut(Math.min(progress * 2, 1));

    const totalChars = meshes.length;

    meshes.forEach((charMesh, index) => {
      const { mesh, originalPosition } = charMesh;
      if (!mesh) return;

      // Calculate wave phase for this character
      const charPhase = (index / totalChars) * Math.PI * 2 * frequency;
      const timePhase = currentTime * effectiveSpeed;
      const phase = charPhase + timePhase;

      // Calculate wave value based on type
      let waveValue = 0;
      switch (waveType) {
        case 'sine':
          waveValue = Math.sin(phase);
          break;
        case 'cosine':
          waveValue = Math.cos(phase);
          break;
        case 'zigzag':
          waveValue = Math.abs((phase % (Math.PI * 2)) / Math.PI - 1) * 2 - 1;
          break;
        case 'pulse':
          waveValue = Math.sin(phase) > 0.5 ? 1 : -1;
          break;
      }

      // Apply amplitude and entry animation
      waveValue *= effectiveAmplitude * entryProgress;

      // Reset to original position
      mesh.position.copy(originalPosition);

      // Apply wave offset based on axis
      switch (axis) {
        case 'z':
          mesh.position.z = waveValue;
          break;
        case 'y':
          mesh.position.y += waveValue * 0.5;
          break;
        case 'both':
          mesh.position.z = waveValue;
          mesh.position.y += waveValue * 0.3;
          break;
      }

      // Apply rotation based on wave position
      const rotationPhase = waveValue / effectiveAmplitude;
      mesh.rotation.x = rotationPhase * rotationRad * entryProgress;

      // Scale with wave (closer = larger)
      if (scaleWithWave) {
        const depthFactor = 1 + (waveValue / effectiveAmplitude) * 0.3;
        mesh.scale.setScalar(Math.max(0.7, depthFactor));

        // Adjust opacity with depth
        mesh.fillOpacity = 0.7 + (1 + waveValue / effectiveAmplitude) * 0.15;
      } else {
        mesh.scale.setScalar(1);
        mesh.fillOpacity = 1;
      }
    });
  }
}
