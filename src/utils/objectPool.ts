/**
 * Generic Object Pool
 * High-performance reusable object pooling to avoid GC pressure
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Factory function to create new objects
 */
export type ObjectFactory<T> = () => T;

/**
 * Function to reset an object to its initial state
 */
export type ObjectReset<T> = (obj: T) => void;

/**
 * Pool configuration options
 */
export interface PoolConfig {
  /**
   * Initial pool size
   * @default 50
   */
  initialSize?: number;

  /**
   * Maximum pool size (prevents unbounded growth)
   * @default 1000
   */
  maxSize?: number;

  /**
   * Number of objects to pre-warm on creation
   * @default initialSize
   */
  warmupSize?: number;

  /**
   * Growth factor when pool needs to expand
   * @default 2
   */
  growthFactor?: number;
}

/**
 * Pool statistics for monitoring
 */
export interface PoolStats {
  totalSize: number;
  activeCount: number;
  availableCount: number;
  acquisitions: number;
  releases: number;
  misses: number;
}

// ============================================================================
// Generic Object Pool
// ============================================================================

/**
 * Generic object pool for any type
 *
 * @example
 * // Create a pool of Vector2 objects
 * const vectorPool = new ObjectPool(
 *   () => ({ x: 0, y: 0 }),
 *   (v) => { v.x = 0; v.y = 0; }
 * );
 *
 * // Acquire and use
 * const vec = vectorPool.acquire();
 * vec.x = 100;
 * vec.y = 200;
 *
 * // Release back to pool
 * vectorPool.release(vec);
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private activeSet: Set<T> = new Set();
  private factory: ObjectFactory<T>;
  private reset: ObjectReset<T>;
  private maxSize: number;
  private growthFactor: number;

  // Statistics
  private stats: PoolStats = {
    totalSize: 0,
    activeCount: 0,
    availableCount: 0,
    acquisitions: 0,
    releases: 0,
    misses: 0,
  };

  constructor(factory: ObjectFactory<T>, reset: ObjectReset<T>, config: PoolConfig = {}) {
    const { initialSize = 50, maxSize = 1000, warmupSize = initialSize, growthFactor = 2 } = config;

    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    this.growthFactor = growthFactor;

    // Pre-allocate objects
    this.warmup(warmupSize);
  }

  /**
   * Pre-allocate objects in the pool
   */
  private warmup(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.pool.length);
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.factory());
    }
    this.stats.totalSize = this.pool.length;
    this.stats.availableCount = this.pool.length;
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T | null {
    this.stats.acquisitions++;

    // Try to get from available pool
    if (this.pool.length > this.activeSet.size) {
      // Find first inactive object
      for (const obj of this.pool) {
        if (!this.activeSet.has(obj)) {
          this.activeSet.add(obj);
          this.stats.activeCount = this.activeSet.size;
          this.stats.availableCount = this.pool.length - this.activeSet.size;
          return obj;
        }
      }
    }

    // Need to grow pool
    if (this.pool.length < this.maxSize) {
      this.stats.misses++;
      const growBy = Math.min(
        Math.ceil(this.pool.length * (this.growthFactor - 1)),
        this.maxSize - this.pool.length
      );

      for (let i = 0; i < growBy; i++) {
        this.pool.push(this.factory());
      }
      this.stats.totalSize = this.pool.length;

      const obj = this.pool[this.pool.length - growBy];
      this.activeSet.add(obj);
      this.stats.activeCount = this.activeSet.size;
      this.stats.availableCount = this.pool.length - this.activeSet.size;
      return obj;
    }

    // Pool exhausted
    this.stats.misses++;
    return null;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (this.activeSet.has(obj)) {
      this.reset(obj);
      this.activeSet.delete(obj);
      this.stats.releases++;
      this.stats.activeCount = this.activeSet.size;
      this.stats.availableCount = this.pool.length - this.activeSet.size;
    }
  }

  /**
   * Release all active objects back to the pool
   */
  releaseAll(): void {
    for (const obj of this.activeSet) {
      this.reset(obj);
    }
    this.stats.releases += this.activeSet.size;
    this.activeSet.clear();
    this.stats.activeCount = 0;
    this.stats.availableCount = this.pool.length;
  }

  /**
   * Get all currently active objects
   */
  getActive(): T[] {
    return Array.from(this.activeSet);
  }

  /**
   * Iterate over active objects without creating an array
   */
  forEachActive(callback: (obj: T) => void): void {
    for (const obj of this.activeSet) {
      callback(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Get current active count
   */
  get activeCount(): number {
    return this.activeSet.size;
  }

  /**
   * Get total pool size
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * Check if pool has available objects
   */
  hasAvailable(): boolean {
    return this.activeSet.size < this.pool.length || this.pool.length < this.maxSize;
  }

  /**
   * Clear the pool completely
   */
  clear(): void {
    this.pool = [];
    this.activeSet.clear();
    this.stats = {
      totalSize: 0,
      activeCount: 0,
      availableCount: 0,
      acquisitions: 0,
      releases: 0,
      misses: 0,
    };
  }
}

// ============================================================================
// Pre-configured Pool Factories
// ============================================================================

/**
 * Vector2 object for 2D positions/velocities
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Create a pool for Vector2 objects
 */
export function createVector2Pool(config?: PoolConfig): ObjectPool<Vector2> {
  return new ObjectPool<Vector2>(
    () => ({ x: 0, y: 0 }),
    (v) => {
      v.x = 0;
      v.y = 0;
    },
    config
  );
}

/**
 * Fragment object for explosion/shatter effects
 */
export interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  life: number;
  color: string;
  char?: string;
}

/**
 * Create a pool for Fragment objects
 */
export function createFragmentPool(config?: PoolConfig): ObjectPool<Fragment> {
  return new ObjectPool<Fragment>(
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      size: 1,
      opacity: 1,
      life: 1,
      color: '#ffffff',
      char: undefined,
    }),
    (f) => {
      f.x = 0;
      f.y = 0;
      f.vx = 0;
      f.vy = 0;
      f.rotation = 0;
      f.rotationSpeed = 0;
      f.size = 1;
      f.opacity = 1;
      f.life = 1;
      f.color = '#ffffff';
      f.char = undefined;
    },
    config
  );
}

/**
 * Trail point for motion trails
 */
export interface TrailPoint {
  x: number;
  y: number;
  age: number;
  opacity: number;
}

/**
 * Create a pool for TrailPoint objects
 */
export function createTrailPointPool(config?: PoolConfig): ObjectPool<TrailPoint> {
  return new ObjectPool<TrailPoint>(
    () => ({ x: 0, y: 0, age: 0, opacity: 1 }),
    (t) => {
      t.x = 0;
      t.y = 0;
      t.age = 0;
      t.opacity = 1;
    },
    config
  );
}

/**
 * Spark object for spark/ember effects
 */
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  opacity: number;
  life: number;
  maxLife: number;
  gravity: number;
}

/**
 * Create a pool for Spark objects
 */
export function createSparkPool(config?: PoolConfig): ObjectPool<Spark> {
  return new ObjectPool<Spark>(
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 2,
      hue: 30,
      saturation: 100,
      lightness: 50,
      opacity: 1,
      life: 1,
      maxLife: 1,
      gravity: 0.1,
    }),
    (s) => {
      s.x = 0;
      s.y = 0;
      s.vx = 0;
      s.vy = 0;
      s.size = 2;
      s.hue = 30;
      s.saturation = 100;
      s.lightness = 50;
      s.opacity = 1;
      s.life = 1;
      s.maxLife = 1;
      s.gravity = 0.1;
    },
    config
  );
}

// ============================================================================
// Typed Array Pool for Float32Array reuse
// ============================================================================

/**
 * Pool for typed arrays to avoid allocation overhead
 */
export class TypedArrayPool {
  private pools: Map<number, Float32Array[]> = new Map();
  private maxPoolSize: number;

  constructor(maxPoolSize: number = 20) {
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Acquire a Float32Array of the specified size
   */
  acquire(size: number): Float32Array {
    const pool = this.pools.get(size);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    return new Float32Array(size);
  }

  /**
   * Release a Float32Array back to the pool
   */
  release(array: Float32Array): void {
    const size = array.length;
    let pool = this.pools.get(size);
    if (!pool) {
      pool = [];
      this.pools.set(size, pool);
    }
    if (pool.length < this.maxPoolSize) {
      // Zero out for reuse
      array.fill(0);
      pool.push(array);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
  }
}

// Singleton typed array pool
export const typedArrayPool = new TypedArrayPool();
