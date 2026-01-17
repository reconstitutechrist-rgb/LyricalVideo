/**
 * Three.js Renderer Service
 * Manages WebGL scene for true 3D text rendering
 */

import * as THREE from 'three';
import { Text as TroikaText } from 'troika-three-text';
import { fontService } from './fontService';

/**
 * Get font URL for custom fonts
 */
function getFontUrl(fontFamily: string): string | null {
  return fontService.getFontUrl(fontFamily);
}

export interface TextOptions {
  text: string;
  fontSize: number;
  color: string | number;
  fontFamily?: string;
  fontWeight?: string | number;
  outlineWidth?: number;
  outlineColor?: string | number;
  glowColor?: string | number;
  glowBlur?: number;
}

export interface CharacterMesh {
  mesh: TroikaText;
  char: string;
  index: number;
  originalPosition: THREE.Vector3;
}

/**
 * ThreeRenderer - Manages a Three.js scene for 3D text effects
 * Renders to an offscreen canvas that can be composited onto the main visualization
 */
export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private _width: number;
  private _height: number;
  private textMeshes: Map<string, CharacterMesh[]> = new Map();
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  /** Get current width */
  get width(): number {
    return this._width;
  }

  /** Get current height */
  get height(): number {
    return this._height;
  }

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;

    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Camera positioned to match 2D coordinate system
    // FOV and distance calculated so that 1 unit ≈ 1 pixel at z=0
    const fov = 50;
    const aspect = width / height;
    const distance = height / (2 * Math.tan((fov * Math.PI) / 360));

    this.camera = new THREE.PerspectiveCamera(fov, aspect, 1, distance * 3);
    this.camera.position.z = distance;

    // WebGL renderer with transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(0, 0, 1);
    this.scene.add(this.directionalLight);
  }

  /**
   * Create individual character meshes for per-character 3D effects
   */
  createCharacterMeshes(id: string, text: string, options: TextOptions): CharacterMesh[] {
    // Clear existing meshes for this id
    this.clearMeshes(id);

    const characters: CharacterMesh[] = [];
    const chars = text.split('');

    // Calculate total width for centering
    const charWidth = options.fontSize * 0.6; // Approximate
    const totalWidth = chars.length * charWidth;
    const startX = -totalWidth / 2;

    chars.forEach((char, index) => {
      if (char === ' ') {
        // Skip spaces but account for width
        characters.push({
          mesh: null as unknown as TroikaText,
          char,
          index,
          originalPosition: new THREE.Vector3(startX + index * charWidth, 0, 0),
        });
        return;
      }

      const mesh = new TroikaText();
      mesh.text = char;
      mesh.fontSize = options.fontSize;
      mesh.color = options.color;
      mesh.anchorX = 'center';
      mesh.anchorY = 'middle';

      if (options.fontFamily) {
        // Check if it's a custom font with a URL
        const fontUrl = getFontUrl(options.fontFamily as string);
        if (fontUrl) {
          mesh.font = fontUrl;
        }
      }

      if (options.outlineWidth && options.outlineWidth > 0) {
        mesh.outlineWidth = options.outlineWidth;
        mesh.outlineColor = options.outlineColor || 0x000000;
      }

      // Position character
      const x = startX + index * charWidth + charWidth / 2;
      mesh.position.set(x, 0, 0);

      // Sync to ensure geometry is ready
      mesh.sync();

      this.scene.add(mesh);

      characters.push({
        mesh,
        char,
        index,
        originalPosition: new THREE.Vector3(x, 0, 0),
      });
    });

    this.textMeshes.set(id, characters);
    return characters;
  }

  /**
   * Create a single text mesh (for whole-word effects)
   */
  createTextMesh(id: string, options: TextOptions): TroikaText {
    this.clearMeshes(id);

    const mesh = new TroikaText();
    mesh.text = options.text;
    mesh.fontSize = options.fontSize;
    mesh.color = options.color;
    mesh.anchorX = 'center';
    mesh.anchorY = 'middle';

    if (options.fontFamily) {
      const fontUrl = getFontUrl(options.fontFamily as string);
      if (fontUrl) {
        mesh.font = fontUrl;
      }
    }

    if (options.outlineWidth && options.outlineWidth > 0) {
      mesh.outlineWidth = options.outlineWidth;
      mesh.outlineColor = options.outlineColor || 0x000000;
    }

    mesh.sync();
    this.scene.add(mesh);

    this.textMeshes.set(id, [
      {
        mesh,
        char: options.text,
        index: 0,
        originalPosition: new THREE.Vector3(0, 0, 0),
      },
    ]);

    return mesh;
  }

  /**
   * Get meshes by id
   */
  getMeshes(id: string): CharacterMesh[] | undefined {
    return this.textMeshes.get(id);
  }

  /**
   * Clear meshes for a specific id
   */
  clearMeshes(id: string): void {
    const meshes = this.textMeshes.get(id);
    if (meshes) {
      meshes.forEach(({ mesh }) => {
        if (mesh) {
          this.scene.remove(mesh);
          mesh.dispose();
        }
      });
      this.textMeshes.delete(id);
    }
  }

  /**
   * Clear all meshes
   */
  clearAll(): void {
    this.textMeshes.forEach((meshes, id) => {
      this.clearMeshes(id);
    });
    this.textMeshes.clear();
  }

  /**
   * Set lighting configuration
   */
  setLighting(ambient: number, directional: number, lightPosition?: THREE.Vector3): void {
    this.ambientLight.intensity = ambient;
    this.directionalLight.intensity = directional;
    if (lightPosition) {
      this.directionalLight.position.copy(lightPosition);
    }
  }

  /**
   * Update camera position for effects
   */
  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Get camera for advanced effects
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get scene for advanced effects
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Recalculate camera distance
    const fov = 50;
    const distance = height / (2 * Math.tan((fov * Math.PI) / 360));
    this.camera.position.z = distance;
  }

  /**
   * Render the scene and return the canvas
   */
  render(): HTMLCanvasElement {
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearAll();
    this.renderer.dispose();
  }
}

// Singleton instance for global access
let globalRenderer: ThreeRenderer | null = null;

export function getThreeRenderer(width: number, height: number): ThreeRenderer {
  if (!globalRenderer || globalRenderer.width !== width || globalRenderer.height !== height) {
    globalRenderer?.dispose();
    globalRenderer = new ThreeRenderer(width, height);
  }
  return globalRenderer;
}

export function disposeThreeRenderer(): void {
  globalRenderer?.dispose();
  globalRenderer = null;
}
