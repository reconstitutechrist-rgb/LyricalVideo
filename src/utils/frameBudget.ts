/**
 * Frame Budget Management
 * Tracks rendering time to maintain target frame rate
 */

// ============================================================================
// Types
// ============================================================================

export interface FrameBudgetConfig {
  /**
   * Target frames per second
   * @default 60
   */
  targetFPS: number;

  /**
   * Whether to enable adaptive quality scaling
   * @default true
   */
  adaptiveQuality: boolean;

  /**
   * Minimum quality level (0-1) when scaling down
   * @default 0.5
   */
  minQuality: number;

  /**
   * Number of frames to average for performance tracking
   * @default 30
   */
  sampleSize: number;
}

export interface FrameBudgetStats {
  /**
   * Average frame time in milliseconds
   */
  averageFrameTime: number;

  /**
   * Current FPS
   */
  currentFPS: number;

  /**
   * Current quality level (0-1)
   */
  qualityLevel: number;

  /**
   * Whether we're meeting the target FPS
   */
  isOnTarget: boolean;

  /**
   * Percentage of budget used (can exceed 100%)
   */
  budgetUsed: number;

  /**
   * Number of frames that exceeded budget
   */
  droppedFrames: number;

  /**
   * Total frames tracked
   */
  totalFrames: number;
}

export enum EffectPriority {
  /**
   * Critical effects that should always render (e.g., lyrics text)
   */
  CRITICAL = 0,

  /**
   * High priority effects (e.g., main animations)
   */
  HIGH = 1,

  /**
   * Normal priority effects (e.g., background effects)
   */
  NORMAL = 2,

  /**
   * Low priority effects (e.g., particles, decorations)
   */
  LOW = 3,
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: FrameBudgetConfig = {
  targetFPS: 60,
  adaptiveQuality: true,
  minQuality: 0.5,
  sampleSize: 30,
};

// ============================================================================
// Frame Budget Manager
// ============================================================================

export class FrameBudgetManager {
  private config: FrameBudgetConfig;
  private budgetMs: number;

  // Frame timing
  private frameStartTime: number = 0;
  private frameEndTime: number = 0;
  private frameTimes: number[] = [];
  private droppedFrameCount: number = 0;
  private totalFrameCount: number = 0;

  // Quality scaling
  private currentQuality: number = 1;
  private qualityAdjustmentRate: number = 0.02;

  // Priority tracking within frame
  private currentPriority: EffectPriority = EffectPriority.CRITICAL;
  private priorityBudgets: Map<EffectPriority, number> = new Map();

  constructor(config: Partial<FrameBudgetConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.budgetMs = 1000 / this.config.targetFPS;
    this.initializePriorityBudgets();
  }

  /**
   * Initialize budget allocation per priority level
   */
  private initializePriorityBudgets(): void {
    // Allocate budget: 30% critical, 30% high, 25% normal, 15% low
    this.priorityBudgets.set(EffectPriority.CRITICAL, this.budgetMs * 0.3);
    this.priorityBudgets.set(EffectPriority.HIGH, this.budgetMs * 0.3);
    this.priorityBudgets.set(EffectPriority.NORMAL, this.budgetMs * 0.25);
    this.priorityBudgets.set(EffectPriority.LOW, this.budgetMs * 0.15);
  }

  /**
   * Start timing a new frame
   */
  begin(): void {
    this.frameStartTime = performance.now();
    this.currentPriority = EffectPriority.CRITICAL;
  }

  /**
   * End frame timing and update statistics
   */
  end(): void {
    this.frameEndTime = performance.now();
    const frameTime = this.frameEndTime - this.frameStartTime;

    // Track frame time
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }

    this.totalFrameCount++;

    // Track dropped frames (exceeded budget)
    if (frameTime > this.budgetMs) {
      this.droppedFrameCount++;
    }

    // Adaptive quality scaling
    if (this.config.adaptiveQuality) {
      this.adjustQuality(frameTime);
    }
  }

  /**
   * Check if there's budget remaining for an effect with given priority
   */
  hasTimeFor(priority: EffectPriority = EffectPriority.NORMAL, estimatedMs: number = 1): boolean {
    const elapsed = performance.now() - this.frameStartTime;
    const remaining = this.budgetMs - elapsed;

    // Critical effects always run
    if (priority === EffectPriority.CRITICAL) {
      return true;
    }

    // Check if we have time
    if (remaining < estimatedMs) {
      return false;
    }

    // Check priority-specific budget
    const priorityBudget = this.priorityBudgets.get(priority) || 0;
    const priorityUsed = this.getPriorityTimeUsed(priority);

    return priorityUsed + estimatedMs <= priorityBudget;
  }

  /**
   * Get time used by a specific priority level (estimated)
   */
  private getPriorityTimeUsed(_priority: EffectPriority): number {
    // Simplified: assume even distribution
    const elapsed = performance.now() - this.frameStartTime;
    return elapsed / 4; // Divide among 4 priority levels
  }

  /**
   * Get remaining time in current frame budget
   */
  getRemainingTime(): number {
    return Math.max(0, this.budgetMs - (performance.now() - this.frameStartTime));
  }

  /**
   * Get elapsed time in current frame
   */
  getElapsedTime(): number {
    return performance.now() - this.frameStartTime;
  }

  /**
   * Get percentage of budget used
   */
  getBudgetUsedPercent(): number {
    const elapsed = performance.now() - this.frameStartTime;
    return (elapsed / this.budgetMs) * 100;
  }

  /**
   * Adjust quality based on frame performance
   */
  private adjustQuality(frameTime: number): void {
    const ratio = frameTime / this.budgetMs;

    if (ratio > 1.2) {
      // Exceeding budget significantly - reduce quality faster
      this.currentQuality = Math.max(
        this.config.minQuality,
        this.currentQuality - this.qualityAdjustmentRate * 2
      );
    } else if (ratio > 1.0) {
      // Slightly over budget - reduce quality slowly
      this.currentQuality = Math.max(
        this.config.minQuality,
        this.currentQuality - this.qualityAdjustmentRate
      );
    } else if (ratio < 0.7 && this.currentQuality < 1) {
      // Well under budget - increase quality
      this.currentQuality = Math.min(1, this.currentQuality + this.qualityAdjustmentRate);
    }
  }

  /**
   * Get current quality level (0-1)
   */
  getQualityLevel(): number {
    return this.currentQuality;
  }

  /**
   * Get frame budget statistics
   */
  getStats(): FrameBudgetStats {
    const avgFrameTime =
      this.frameTimes.length > 0
        ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        : 0;

    return {
      averageFrameTime: avgFrameTime,
      currentFPS: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      qualityLevel: this.currentQuality,
      isOnTarget: avgFrameTime <= this.budgetMs,
      budgetUsed: (avgFrameTime / this.budgetMs) * 100,
      droppedFrames: this.droppedFrameCount,
      totalFrames: this.totalFrameCount,
    };
  }

  /**
   * Get drop rate as percentage
   */
  getDropRate(): number {
    if (this.totalFrameCount === 0) return 0;
    return (this.droppedFrameCount / this.totalFrameCount) * 100;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.frameTimes = [];
    this.droppedFrameCount = 0;
    this.totalFrameCount = 0;
    this.currentQuality = 1;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<FrameBudgetConfig>): void {
    this.config = { ...this.config, ...config };
    this.budgetMs = 1000 / this.config.targetFPS;
    this.initializePriorityBudgets();
  }

  /**
   * Get current configuration
   */
  getConfig(): FrameBudgetConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const frameBudget = new FrameBudgetManager();

// ============================================================================
// React Hook
// ============================================================================

import { useRef, useCallback, useState, useEffect } from 'react';

interface UseFrameBudgetOptions {
  targetFPS?: number;
  adaptiveQuality?: boolean;
  updateInterval?: number; // ms between stats updates
}

interface UseFrameBudgetReturn {
  begin: () => void;
  end: () => void;
  hasTimeFor: (priority?: EffectPriority, estimatedMs?: number) => boolean;
  getQualityLevel: () => number;
  stats: FrameBudgetStats;
}

/**
 * React hook for frame budget management
 */
export function useFrameBudget(options: UseFrameBudgetOptions = {}): UseFrameBudgetReturn {
  const { targetFPS = 60, adaptiveQuality = true, updateInterval = 1000 } = options;

  const managerRef = useRef<FrameBudgetManager>(
    new FrameBudgetManager({ targetFPS, adaptiveQuality })
  );

  const [stats, setStats] = useState<FrameBudgetStats>(managerRef.current.getStats());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(managerRef.current.getStats());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const begin = useCallback(() => {
    managerRef.current.begin();
  }, []);

  const end = useCallback(() => {
    managerRef.current.end();
  }, []);

  const hasTimeFor = useCallback(
    (priority: EffectPriority = EffectPriority.NORMAL, estimatedMs: number = 1) => {
      return managerRef.current.hasTimeFor(priority, estimatedMs);
    },
    []
  );

  const getQualityLevel = useCallback(() => {
    return managerRef.current.getQualityLevel();
  }, []);

  return {
    begin,
    end,
    hasTimeFor,
    getQualityLevel,
    stats,
  };
}
