/**
 * Extrude 3D Effect
 * Text with true 3D depth/extrusion effect using multiple layered meshes
 */

import * as THREE from 'three';
import { Text as TroikaText } from 'troika-three-text';
import { LyricEffectContext } from '../../core/Effect';
import { EffectParameter, slider, enumParam, boolean } from '../../core/ParameterTypes';
import { WebGL3DEffect, Ease3D, colorToThree } from './WebGL3DEffect';
import { CharacterMesh, getThreeRenderer } from '../../../../services/threeRenderer';

interface ExtrusionLayer {
  mesh: TroikaText;
  zOffset: number;
  darkness: number;
}

export class Extrude3DEffect extends WebGL3DEffect {
  readonly id = 'extrude-3d';
  readonly name = 'Extrude 3D';
  readonly parameters: EffectParameter[] = [
    slider('depth', 'Extrusion Depth', 20, 5, 100, 1, 'px'),
    slider('bevelSize', 'Bevel Size', 2, 0, 10, 0.5, 'px'),
    enumParam('extrudeDirection', 'Extrude Direction', 'back', [
      { value: 'back', label: 'Into Screen' },
      { value: 'forward', label: 'Out of Screen' },
      { value: 'animated', label: 'Animated' },
    ]),
    slider('rotationY', 'Y Rotation', 15, -45, 45, 1, 'deg'),
    slider('rotationX', 'X Rotation', -10, -45, 45, 1, 'deg'),
    slider('layerCount', 'Layer Count', 5, 2, 15, 1),
    boolean('audioReactive', 'Audio Reactive', true),
    slider('audioIntensity', 'Audio Intensity', 0.5, 0, 2, 0.1),
    slider('animationSpeed', 'Animation Speed', 0.5, 0, 3, 0.1),
  ];

  // Cache for extrusion layers per character
  private extrusionLayers: Map<string, ExtrusionLayer[][]> = new Map();
  private currentLyricText: string = '';

  /**
   * Create extrusion layers for each character
   */
  private createExtrusionLayers(meshes: CharacterMesh[], context: LyricEffectContext): void {
    const lyricId = context.lyric.id;
    const depth = this.getParameter<number>('depth');
    const layerCount = this.getParameter<number>('layerCount');

    // Check if we need to recreate layers
    if (this.extrusionLayers.has(lyricId) && this.currentLyricText === context.text) {
      return;
    }

    // Clear old layers
    this.clearExtrusionLayers(lyricId);
    this.currentLyricText = context.text;

    const renderer = getThreeRenderer(context.width, context.height);
    const scene = renderer.getScene();
    const allLayers: ExtrusionLayer[][] = [];

    // Create extrusion layers for each character
    meshes.forEach((charMesh) => {
      if (!charMesh.mesh) {
        allLayers.push([]);
        return;
      }

      const charLayers: ExtrusionLayer[] = [];
      const layerStep = depth / layerCount;

      // Create layers behind the main character (going into the screen)
      for (let i = 1; i <= layerCount; i++) {
        const layer = new TroikaText();
        layer.text = charMesh.char;
        layer.fontSize = charMesh.mesh.fontSize;
        layer.color = charMesh.mesh.color;
        layer.anchorX = 'center';
        layer.anchorY = 'middle';

        // Position at character's position but offset in Z
        layer.position.copy(charMesh.originalPosition);

        const zOffset = -layerStep * i;
        const darkness = 1 - (i / layerCount) * 0.7; // Darker as it goes back

        layer.sync();
        scene.add(layer);

        charLayers.push({
          mesh: layer,
          zOffset,
          darkness,
        });
      }

      allLayers.push(charLayers);
    });

    this.extrusionLayers.set(lyricId, allLayers);
  }

  /**
   * Clear extrusion layers for a lyric
   */
  private clearExtrusionLayers(lyricId: string): void {
    const layers = this.extrusionLayers.get(lyricId);
    if (layers) {
      const renderer = this.renderer;
      if (renderer) {
        const scene = renderer.getScene();
        layers.forEach((charLayers) => {
          charLayers.forEach((layer) => {
            scene.remove(layer.mesh);
            layer.mesh.dispose();
          });
        });
      }
      this.extrusionLayers.delete(lyricId);
    }
  }

  protected applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void {
    const depth = this.getParameter<number>('depth');
    const bevelSize = this.getParameter<number>('bevelSize');
    const extrudeDirection = this.getParameter<string>('extrudeDirection');
    let rotationY = this.getParameter<number>('rotationY');
    let rotationX = this.getParameter<number>('rotationX');
    const audioReactive = this.getParameter<boolean>('audioReactive');
    const audioIntensity = this.getParameter<number>('audioIntensity');
    const animationSpeed = this.getParameter<number>('animationSpeed');

    const { currentTime, progress, audioData, color, lyric } = context;
    const lyricId = lyric.id;

    // Create extrusion layers if needed
    this.createExtrusionLayers(meshes, context);

    // Audio reactivity
    let audioBoost = 1;
    let depthBoost = 1;
    if (audioReactive) {
      const bassNorm = audioData.bass / 255;
      audioBoost = 1 + bassNorm * audioIntensity * 0.5;
      depthBoost = 1 + bassNorm * audioIntensity;
    }

    // Animate rotation
    if (animationSpeed > 0) {
      const time = currentTime * animationSpeed;
      rotationY += Math.sin(time) * 10;
      rotationX += Math.cos(time * 0.7) * 5;
    }

    // Convert to radians
    const rotYRad = ((rotationY * Math.PI) / 180) * audioBoost;
    const rotXRad = ((rotationX * Math.PI) / 180) * audioBoost;

    // Calculate extrusion direction multiplier
    let extrudeMultiplier = 1;
    if (extrudeDirection === 'forward') {
      extrudeMultiplier = -1;
    } else if (extrudeDirection === 'animated') {
      extrudeMultiplier = Math.sin(currentTime * 2);
    }

    // Entry animation
    const entryProgress = Ease3D.easeOut(Math.min(progress * 3, 1));

    // Get extrusion layers for this lyric
    const allLayers = this.extrusionLayers.get(lyricId) || [];
    const baseColor = colorToThree(color);

    meshes.forEach((charMesh, charIndex) => {
      const { mesh, originalPosition } = charMesh;
      if (!mesh) return;

      // Apply rotation and position to main mesh (front face)
      mesh.rotation.set(rotXRad * entryProgress, rotYRad * entryProgress, 0);
      mesh.position.copy(originalPosition);
      mesh.position.z = 0;

      // Main text styling
      mesh.color = color;
      mesh.fillOpacity = 1;
      mesh.outlineWidth = bevelSize * entryProgress;
      mesh.outlineColor = baseColor.clone().multiplyScalar(0.3).getHex();

      // Update extrusion layers for this character
      const charLayers = allLayers[charIndex] || [];
      charLayers.forEach((layer) => {
        // Copy rotation from main mesh
        layer.mesh.rotation.copy(mesh.rotation);

        // Position layer at original position plus Z offset
        layer.mesh.position.copy(originalPosition);
        layer.mesh.position.z = layer.zOffset * extrudeMultiplier * depthBoost * entryProgress;

        // Apply darkness based on layer depth
        const layerColor = baseColor.clone().multiplyScalar(layer.darkness);
        layer.mesh.color = layerColor.getHex();
        layer.mesh.fillOpacity = entryProgress;
      });
    });
  }

  reset(): void {
    super.reset();
    // Clear all extrusion layers
    this.extrusionLayers.forEach((_, lyricId) => {
      this.clearExtrusionLayers(lyricId);
    });
    this.extrusionLayers.clear();
    this.currentLyricText = '';
  }

  onDeactivate(): void {
    super.onDeactivate();
    this.reset();
  }
}
