/**
 * Math Utilities for Effects
 * Includes easing functions, noise, physics helpers
 */

/**
 * Easing function type
 */
export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'bounce'
  | 'elastic'
  | 'back';

/**
 * Easing functions
 */
export const Easings: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
  back: (t) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
};

/**
 * Additional easing functions for effects
 */
export const ExtendedEasings = {
  ...Easings,
  elastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
  back: (t: number): number => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  backOut: (t: number): number => {
    const s = 1.70158;
    t = t - 1;
    return t * t * ((s + 1) * t + s) + 1;
  },
};

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Simple 2D vector
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Add two vectors
 */
export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract two vectors
 */
export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scale a vector
 */
export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

/**
 * Get vector length
 */
export function vec2Length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector
 */
export function vec2Normalize(v: Vec2): Vec2 {
  const len = vec2Length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Rotate a vector by angle (radians)
 */
export function vec2Rotate(v: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * Simple Perlin-like noise (simplified implementation)
 */
class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const perm: number[] = [];
    for (let i = 0; i < 256; i++) perm[i] = i;

    // Simple shuffle based on seed
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    // Duplicate for overflow
    return [...perm, ...perm];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Get 2D noise value (-1 to 1)
   */
  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const p = this.permutation;
    const A = p[X] + Y;
    const B = p[X + 1] + Y;

    return lerp(
      lerp(this.grad(p[A], x, y), this.grad(p[B], x - 1, y), u),
      lerp(this.grad(p[A + 1], x, y - 1), this.grad(p[B + 1], x - 1, y - 1), u),
      v
    );
  }
}

// Global noise instance
const noiseInstance = new PerlinNoise(12345);

/**
 * Get Perlin noise value at coordinates
 */
export function noise2D(x: number, y: number): number {
  return noiseInstance.noise2D(x, y);
}

/**
 * Get turbulent noise (multiple octaves)
 */
export function turbulence(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += Math.abs(noise2D(x * frequency, y * frequency)) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

/**
 * Physics constants and helpers
 */
export const GRAVITY = 9.8; // pixels per second squared (scaled for visuals)

/**
 * Simple physics body
 */
export interface PhysicsBody {
  position: Vec2;
  velocity: Vec2;
  acceleration: Vec2;
  mass: number;
  rotation: number;
  angularVelocity: number;
}

/**
 * Create a physics body
 */
export function createPhysicsBody(x: number, y: number, mass: number = 1): PhysicsBody {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    mass,
    rotation: 0,
    angularVelocity: 0,
  };
}

/**
 * Update physics body
 */
export function updatePhysicsBody(body: PhysicsBody, deltaTime: number): void {
  // Update velocity
  body.velocity.x += body.acceleration.x * deltaTime;
  body.velocity.y += body.acceleration.y * deltaTime;

  // Update position
  body.position.x += body.velocity.x * deltaTime;
  body.position.y += body.velocity.y * deltaTime;

  // Update rotation
  body.rotation += body.angularVelocity * deltaTime;
}

/**
 * Apply force to physics body
 */
export function applyForce(body: PhysicsBody, force: Vec2): void {
  body.acceleration.x += force.x / body.mass;
  body.acceleration.y += force.y / body.mass;
}

/**
 * Random number in range
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer in range (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

/**
 * Random item from array
 */
export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
