/**
 * WebGL Effects Renderer
 * GPU-accelerated post-processing effects like film grain
 */

// ============================================================================
// Shader Sources
// ============================================================================

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FILM_GRAIN_FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_intensity;
  uniform vec2 u_resolution;

  varying vec2 v_texCoord;

  // Pseudo-random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Film grain noise with temporal variation
  float filmGrain(vec2 uv, float time) {
    // Create animated grain by using time as seed
    vec2 seed = uv + vec2(time, time * 0.7);
    float grain = random(seed) * 2.0 - 1.0;
    return grain;
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    // Calculate grain with temporal variation for animation
    float grain = filmGrain(v_texCoord * u_resolution, u_time);

    // Apply grain to all channels equally
    float grainAmount = grain * u_intensity;

    color.rgb += vec3(grainAmount);

    // Clamp to valid range
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    gl_FragColor = color;
  }
`;

const VIGNETTE_FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform float u_intensity;
  uniform float u_radius;
  uniform float u_softness;

  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    // Calculate distance from center
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(v_texCoord, center);

    // Create vignette falloff
    float vignette = smoothstep(u_radius, u_radius - u_softness, dist);
    vignette = mix(1.0 - u_intensity, 1.0, vignette);

    color.rgb *= vignette;

    gl_FragColor = color;
  }
`;

const CHROMATIC_ABERRATION_FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform float u_offset;
  uniform vec2 u_resolution;

  varying vec2 v_texCoord;

  void main() {
    vec2 direction = v_texCoord - vec2(0.5);
    float dist = length(direction);
    direction = normalize(direction);

    // Offset increases towards edges
    vec2 offset = direction * u_offset * dist / u_resolution;

    float r = texture2D(u_texture, v_texCoord + offset).r;
    float g = texture2D(u_texture, v_texCoord).g;
    float b = texture2D(u_texture, v_texCoord - offset).b;
    float a = texture2D(u_texture, v_texCoord).a;

    gl_FragColor = vec4(r, g, b, a);
  }
`;

// ============================================================================
// Types
// ============================================================================

export interface FilmGrainOptions {
  intensity: number; // 0-1
  animated: boolean;
}

export interface VignetteOptions {
  intensity: number; // 0-1
  radius: number; // 0-1
  softness: number; // 0-1
}

export interface ChromaticAberrationOptions {
  offset: number; // Pixel offset
}

// ============================================================================
// WebGL Effects Renderer
// ============================================================================

export class WebGLEffectsRenderer {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;

  // Shader programs
  private filmGrainProgram: WebGLProgram | null = null;
  private vignetteProgram: WebGLProgram | null = null;
  private chromaticProgram: WebGLProgram | null = null;

  // Buffers
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  // Textures
  private inputTexture: WebGLTexture | null = null;

  // Framebuffers for ping-pong rendering
  private framebuffers: WebGLFramebuffer[] = [];
  private fbTextures: WebGLTexture[] = [];

  // Time for animation
  private startTime: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.initGL();
  }

  private initGL(): void {
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      console.warn('WebGL not available for effects renderer');
      return;
    }

    this.gl = gl;
    this.startTime = performance.now();

    // Create shader programs
    this.filmGrainProgram = this.createProgram(VERTEX_SHADER, FILM_GRAIN_FRAGMENT_SHADER);
    this.vignetteProgram = this.createProgram(VERTEX_SHADER, VIGNETTE_FRAGMENT_SHADER);
    this.chromaticProgram = this.createProgram(VERTEX_SHADER, CHROMATIC_ABERRATION_FRAGMENT_SHADER);

    // Create buffers
    this.createBuffers();

    // Create framebuffers for multi-pass rendering
    this.createFramebuffers();

    // Create input texture
    this.inputTexture = gl.createTexture();
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;

    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) return null;

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    // Clean up shaders
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private createBuffers(): void {
    const gl = this.gl;
    if (!gl) return;

    // Full-screen quad vertices
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    // Texture coordinates
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  }

  private createFramebuffers(): void {
    const gl = this.gl;
    if (!gl) return;

    // Create 2 framebuffers for ping-pong rendering
    for (let i = 0; i < 2; i++) {
      const fb = gl.createFramebuffer();
      const tex = gl.createTexture();

      if (!fb || !tex) continue;

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this.width,
        this.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      this.framebuffers.push(fb);
      this.fbTextures.push(tex);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private setupAttributes(program: WebGLProgram): void {
    const gl = this.gl;
    if (!gl) return;

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
  }

  /**
   * Upload a source canvas as input texture
   */
  uploadTexture(source: HTMLCanvasElement | ImageData): void {
    const gl = this.gl;
    if (!gl || !this.inputTexture) return;

    gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * Apply film grain effect
   */
  applyFilmGrain(options: FilmGrainOptions): void {
    const gl = this.gl;
    if (!gl || !this.filmGrainProgram) return;

    gl.useProgram(this.filmGrainProgram);
    this.setupAttributes(this.filmGrainProgram);

    // Set uniforms
    const textureLoc = gl.getUniformLocation(this.filmGrainProgram, 'u_texture');
    const timeLoc = gl.getUniformLocation(this.filmGrainProgram, 'u_time');
    const intensityLoc = gl.getUniformLocation(this.filmGrainProgram, 'u_intensity');
    const resolutionLoc = gl.getUniformLocation(this.filmGrainProgram, 'u_resolution');

    gl.uniform1i(textureLoc, 0);
    gl.uniform1f(timeLoc, options.animated ? (performance.now() - this.startTime) / 1000 : 0);
    gl.uniform1f(intensityLoc, options.intensity);
    gl.uniform2f(resolutionLoc, this.width, this.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Apply vignette effect
   */
  applyVignette(options: VignetteOptions): void {
    const gl = this.gl;
    if (!gl || !this.vignetteProgram) return;

    gl.useProgram(this.vignetteProgram);
    this.setupAttributes(this.vignetteProgram);

    const textureLoc = gl.getUniformLocation(this.vignetteProgram, 'u_texture');
    const intensityLoc = gl.getUniformLocation(this.vignetteProgram, 'u_intensity');
    const radiusLoc = gl.getUniformLocation(this.vignetteProgram, 'u_radius');
    const softnessLoc = gl.getUniformLocation(this.vignetteProgram, 'u_softness');

    gl.uniform1i(textureLoc, 0);
    gl.uniform1f(intensityLoc, options.intensity);
    gl.uniform1f(radiusLoc, options.radius);
    gl.uniform1f(softnessLoc, options.softness);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Apply chromatic aberration effect
   */
  applyChromaticAberration(options: ChromaticAberrationOptions): void {
    const gl = this.gl;
    if (!gl || !this.chromaticProgram) return;

    gl.useProgram(this.chromaticProgram);
    this.setupAttributes(this.chromaticProgram);

    const textureLoc = gl.getUniformLocation(this.chromaticProgram, 'u_texture');
    const offsetLoc = gl.getUniformLocation(this.chromaticProgram, 'u_offset');
    const resolutionLoc = gl.getUniformLocation(this.chromaticProgram, 'u_resolution');

    gl.uniform1i(textureLoc, 0);
    gl.uniform1f(offsetLoc, options.offset);
    gl.uniform2f(resolutionLoc, this.width, this.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Process source with multiple effects
   */
  process(
    source: HTMLCanvasElement,
    effects: {
      filmGrain?: FilmGrainOptions;
      vignette?: VignetteOptions;
      chromaticAberration?: ChromaticAberrationOptions;
    }
  ): HTMLCanvasElement {
    const gl = this.gl;
    if (!gl) return source;

    const effectsList = Object.entries(effects).filter(([, v]) => v !== undefined);

    // If no effects enabled, return source directly to avoid stale canvas
    if (effectsList.length === 0) {
      return source;
    }

    // Upload source texture
    this.uploadTexture(source);

    gl.viewport(0, 0, this.width, this.height);
    gl.activeTexture(gl.TEXTURE0);

    let currentTexture = this.inputTexture;
    let currentFbIndex = 0;

    for (let i = 0; i < effectsList.length; i++) {
      const [effectName, options] = effectsList[i];
      const isLast = i === effectsList.length - 1;

      // Bind input texture
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);

      // Render to framebuffer or screen
      if (isLast) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[currentFbIndex]);
      }

      // Apply effect
      switch (effectName) {
        case 'filmGrain':
          this.applyFilmGrain(options as FilmGrainOptions);
          break;
        case 'vignette':
          this.applyVignette(options as VignetteOptions);
          break;
        case 'chromaticAberration':
          this.applyChromaticAberration(options as ChromaticAberrationOptions);
          break;
      }

      // Swap for next pass
      if (!isLast) {
        currentTexture = this.fbTextures[currentFbIndex];
        currentFbIndex = 1 - currentFbIndex;
      }
    }

    return this.canvas;
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    const gl = this.gl;
    if (!gl) return;

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // Recreate framebuffer textures with new size
    for (let i = 0; i < this.fbTextures.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.fbTextures[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
  }

  /**
   * Check if WebGL is supported
   */
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  /**
   * Get the output canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    const gl = this.gl;
    if (!gl) return;

    // Delete programs
    if (this.filmGrainProgram) gl.deleteProgram(this.filmGrainProgram);
    if (this.vignetteProgram) gl.deleteProgram(this.vignetteProgram);
    if (this.chromaticProgram) gl.deleteProgram(this.chromaticProgram);

    // Delete buffers
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);

    // Delete textures
    if (this.inputTexture) gl.deleteTexture(this.inputTexture);
    for (const tex of this.fbTextures) {
      gl.deleteTexture(tex);
    }

    // Delete framebuffers
    for (const fb of this.framebuffers) {
      gl.deleteFramebuffer(fb);
    }

    this.gl = null;
  }
}
