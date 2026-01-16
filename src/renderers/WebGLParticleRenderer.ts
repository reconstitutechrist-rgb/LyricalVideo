/**
 * WebGL Particle Renderer
 * GPU-accelerated particle rendering using Three.js Points
 */

import * as THREE from 'three';

export interface ParticleData {
  x: number;
  y: number;
  size: number;
  r: number;
  g: number;
  b: number;
  opacity: number;
}

export class WebGLParticleRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particles: THREE.Points | null = null;

  private maxParticles: number;
  private positions: Float32Array;
  private sizes: Float32Array;
  private colors: Float32Array;

  private width: number;
  private height: number;

  constructor(width: number, height: number, maxParticles: number = 500) {
    this.width = width;
    this.height = height;
    this.maxParticles = maxParticles;

    // Create offscreen canvas for rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    // Initialize Three.js scene
    this.scene = new THREE.Scene();

    // Orthographic camera for 2D-like rendering (Y flipped for canvas coordinates)
    this.camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
    this.camera.position.z = 100;

    // WebGL renderer with transparency
    // Note: antialias disabled for particles as point sprites don't benefit from it
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });

    // Set pixel ratio for high-DPI displays (capped at 2 for performance)
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    // Pre-allocate typed arrays for buffer attributes
    this.positions = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.colors = new Float32Array(maxParticles * 3);

    // Create particle geometry with buffer attributes
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Particle material with vertex colors
    this.particleMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  /**
   * Update particle data - call each frame before render()
   */
  updateParticles(particleData: ParticleData[], count: number): void {
    const actualCount = Math.min(count, this.maxParticles);

    for (let i = 0; i < actualCount; i++) {
      const p = particleData[i];
      const i3 = i * 3;

      // Position (flip Y for canvas coordinates)
      this.positions[i3] = p.x;
      this.positions[i3 + 1] = this.height - p.y;
      this.positions[i3 + 2] = 0;

      // Size
      this.sizes[i] = p.size * 2;

      // Color (RGB 0-1 range)
      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;
    }

    // Mark buffer attributes as needing update
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;

    // Set draw range to only render active particles
    this.particleGeometry.setDrawRange(0, actualCount);
  }

  /**
   * Render particles and return canvas for compositing
   */
  render(): HTMLCanvasElement {
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Update canvas with pixel ratio consideration
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.camera.right = width;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Check if WebGL is supported
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  /**
   * Dispose of all WebGL resources
   */
  dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.renderer.dispose();
  }
}
