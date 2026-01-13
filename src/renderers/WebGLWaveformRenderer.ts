/**
 * WebGL Waveform Renderer
 * GPU-accelerated waveform visualization using Three.js
 */

import * as THREE from 'three';

export class WebGLWaveformRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;
  private lines: THREE.LineSegments | null = null;

  private maxBars: number;
  private positions: Float32Array;

  private width: number;
  private height: number;

  constructor(width: number, height: number, maxBars: number = 4000) {
    this.width = width;
    this.height = height;
    this.maxBars = maxBars;

    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Orthographic camera for 2D rendering
    this.camera = new THREE.OrthographicCamera(0, width, height, 0, 0.1, 1000);
    this.camera.position.z = 100;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    // Each bar needs 2 vertices (top and bottom of line segment)
    // LineSegments draws pairs of vertices as disconnected lines
    this.positions = new Float32Array(maxBars * 2 * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Line material with gradient color
    this.material = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.9,
    });

    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.scene.add(this.lines);
  }

  /**
   * Update waveform data
   */
  updateWaveform(
    peaks: Float32Array,
    startPeak: number,
    endPeak: number,
    pixelsPerPeak: number,
    scrollOffset: number,
    primaryColor: string = '#3b82f6'
  ): void {
    const centerY = this.height / 2;
    const maxBarHeight = (this.height / 2) * 0.9;
    let vertexIndex = 0;

    // Update material color
    this.material.color.set(primaryColor);

    // Generate line segments for visible waveform bars
    for (let i = Math.max(0, startPeak); i < Math.min(peaks.length, endPeak); i++) {
      if (vertexIndex >= this.maxBars * 2 * 3) break;

      const x = i * pixelsPerPeak - scrollOffset;
      const barHeight = peaks[i] * maxBarHeight;

      // Bottom vertex
      this.positions[vertexIndex++] = x;
      this.positions[vertexIndex++] = centerY - barHeight;
      this.positions[vertexIndex++] = 0;

      // Top vertex
      this.positions[vertexIndex++] = x;
      this.positions[vertexIndex++] = centerY + barHeight;
      this.positions[vertexIndex++] = 0;
    }

    // Mark for update and set draw range
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, vertexIndex / 3);
  }

  /**
   * Render and return canvas for compositing
   */
  render(): HTMLCanvasElement {
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.setSize(width, height);
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Set waveform color
   */
  setColor(color: string): void {
    this.material.color.set(color);
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
   * Dispose of WebGL resources
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
