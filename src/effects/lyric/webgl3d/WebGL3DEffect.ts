/**
 * WebGL 3D Effect Base Class
 * Foundation for true 3D text effects using Three.js
 */

import * as THREE from 'three';
import { LyricEffect, LyricEffectContext } from '../../core/Effect';
import { ThreeRenderer, CharacterMesh, getThreeRenderer } from '../../../../services/threeRenderer';
import { Easings } from '../../utils/MathUtils';

/**
 * Extended context for 3D effects
 */
export interface WebGL3DContext extends LyricEffectContext {
  renderer: ThreeRenderer;
  characterMeshes: CharacterMesh[];
}

/**
 * Base class for WebGL 3D lyric effects
 */
export abstract class WebGL3DEffect extends LyricEffect {
  protected renderer: ThreeRenderer | null = null;
  protected currentLyricId: string = '';
  protected meshesInitialized: boolean = false;

  /**
   * Flag to indicate this effect uses WebGL
   */
  readonly isWebGL3D: boolean = true;

  /**
   * Initialize the Three.js renderer for this effect
   */
  protected initRenderer(width: number, height: number): ThreeRenderer {
    if (!this.renderer || this.needsResize(width, height)) {
      this.renderer = getThreeRenderer(width, height);
    }
    return this.renderer;
  }

  /**
   * Check if renderer needs resize
   */
  private needsResize(width: number, height: number): boolean {
    if (!this.renderer) return true;
    return this.renderer.width !== width || this.renderer.height !== height;
  }

  /**
   * Create character meshes for the current lyric
   */
  protected createMeshes(context: LyricEffectContext): CharacterMesh[] {
    const lyricId = context.lyric.id;

    // Only recreate meshes if lyric changed
    if (this.currentLyricId !== lyricId) {
      this.currentLyricId = lyricId;
      this.meshesInitialized = false;
    }

    if (!this.meshesInitialized && this.renderer) {
      const meshes = this.renderer.createCharacterMeshes(lyricId, context.text, {
        text: context.text,
        fontSize: context.fontSize,
        color: context.color,
        fontFamily: context.fontFamily,
      });
      this.meshesInitialized = true;
      return meshes;
    }

    return this.renderer?.getMeshes(lyricId) || [];
  }

  /**
   * Apply 3D transformations to character meshes
   * Override this in subclasses to implement specific effects
   */
  protected abstract applyTransforms(meshes: CharacterMesh[], context: LyricEffectContext): void;

  /**
   * Main render function - handles setup and compositing
   */
  renderLyric(context: LyricEffectContext): void {
    const { ctx, width, height } = context;

    // Initialize renderer
    this.initRenderer(width, height);
    if (!this.renderer) return;

    // Create or get character meshes
    const meshes = this.createMeshes(context);
    if (meshes.length === 0) return;

    // Apply effect-specific transformations
    this.applyTransforms(meshes, context);

    // Render Three.js scene to offscreen canvas
    const threeCanvas = this.renderer.render();

    // Composite onto main canvas
    ctx.save();
    ctx.drawImage(threeCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Reset effect state
   */
  reset(): void {
    super.reset();
    this.meshesInitialized = false;
    this.currentLyricId = '';
    if (this.renderer) {
      this.renderer.clearAll();
    }
  }

  /**
   * Cleanup when effect is deactivated
   */
  onDeactivate(): void {
    super.onDeactivate();
    this.reset();
  }
}

/**
 * Utility: Convert hex color string to THREE color
 */
export function colorToThree(color: string): THREE.Color {
  return new THREE.Color(color);
}

/**
 * Utility: Ease functions for 3D animations
 * Re-exported from MathUtils for backward compatibility
 */
export const Ease3D = Easings;
