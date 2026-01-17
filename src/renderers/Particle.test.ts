/**
 * Particle Class Tests
 * Unit tests for particle rendering and physics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Particle } from './Particle';

describe('Particle', () => {
  let particle: Particle;

  beforeEach(() => {
    // Use fixed random for consistent tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    particle = new Particle(800, 600, 'neon');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with random position', () => {
      expect(particle.x).toBe(400); // 0.5 * 800
      expect(particle.y).toBe(300); // 0.5 * 600
    });

    it('should initialize with random size', () => {
      // baseSize = Math.random() * 3 + 1 = 0.5 * 3 + 1 = 2.5
      expect(particle.baseSize).toBe(2.5);
      expect(particle.size).toBe(2.5);
    });

    it('should initialize with random speed', () => {
      // speedX = (Math.random() - 0.5) * 2 = (0.5 - 0.5) * 2 = 0
      expect(particle.speedX).toBe(0);
      expect(particle.speedY).toBe(0);
    });

    it('should initialize empty history', () => {
      expect(particle.history).toEqual([]);
      expect(particle.historyIndex).toBe(0);
      expect(particle.historyLength).toBe(0);
    });
  });

  describe('getColor', () => {
    it('should return neon colors', () => {
      const color = particle.getColor('neon');
      expect(color).toMatch(/hsla\(\d+,\s*100%,\s*50%,\s*0\.6\)/);
    });

    it('should return sunset colors', () => {
      const color = particle.getColor('sunset');
      expect(color).toMatch(/hsla\(\d+,\s*100%,\s*60%,\s*0\.6\)/);
    });

    it('should return ocean colors', () => {
      const color = particle.getColor('ocean');
      expect(color).toMatch(/hsla\(\d+,\s*80%,\s*60%,\s*0\.6\)/);
    });

    it('should return matrix colors', () => {
      const color = particle.getColor('matrix');
      expect(color).toMatch(/hsla\(\d+,\s*100%,\s*50%,\s*0\.7\)/);
    });

    it('should return fire colors', () => {
      const color = particle.getColor('fire');
      expect(color).toMatch(/hsla\(\d+,\s*100%,\s*50%,\s*0\.7\)/);
    });

    it('should return pastel colors', () => {
      const color = particle.getColor('pastel');
      expect(color).toMatch(/hsla\(\d+,\s*\d+%,\s*\d+%,\s*0\.6\)/);
    });

    it('should return grayscale colors', () => {
      const color = particle.getColor('grayscale');
      expect(color).toMatch(/hsla\(0,\s*[\d.]+%,\s*\d+%,\s*0\.7\)/);
    });

    it('should return cyberpunk colors', () => {
      const color = particle.getColor('cyberpunk');
      expect(color).toMatch(/hsla\(\d+,\s*\d+%,\s*\d+%,\s*0\.8\)/);
    });
  });

  describe('updateColor', () => {
    it('should use sentiment color when provided', () => {
      particle.updateColor('neon', '#ff0000');
      expect(particle.color).toBe('#ff0000');
    });

    it('should generate palette color when no sentiment', () => {
      particle.updateColor('ocean');
      expect(particle.color).toMatch(/hsla/);
    });
  });

  describe('update', () => {
    it('should update position based on speed', () => {
      particle.speedX = 2;
      particle.speedY = 3;
      particle.update(128, 128, 800, 600, 1, 1, 1, 1, false);

      // Position changes based on speed and motion boost
      expect(particle.x).not.toBe(400);
      expect(particle.y).not.toBe(300);
    });

    it('should wrap position around edges', () => {
      particle.x = 805;
      particle.y = 605;
      particle.update(0, 0, 800, 600, 1, 1, 1, 1, false);

      expect(particle.x).toBe(0);
      expect(particle.y).toBe(0);
    });

    it('should update size based on pulse frequency', () => {
      const initialSize = particle.size;
      particle.update(128, 255, 800, 600, 1, 1, 1, 1, false);

      expect(particle.size).toBeGreaterThan(initialSize);
    });

    it('should build history when trails enabled', () => {
      particle.update(0, 0, 800, 600, 1, 1, 1, 1, true);
      particle.update(0, 0, 800, 600, 1, 1, 1, 1, true);

      expect(particle.historyLength).toBe(2);
    });

    it('should clear history when trails disabled', () => {
      particle.update(0, 0, 800, 600, 1, 1, 1, 1, true);
      particle.update(0, 0, 800, 600, 1, 1, 1, 1, false);

      expect(particle.history).toEqual([]);
      expect(particle.historyLength).toBe(0);
    });

    it('should use circular buffer for trails', () => {
      // Fill history beyond limit
      for (let i = 0; i < 30; i++) {
        particle.x = i;
        particle.y = i;
        particle.update(0, 0, 800, 600, 1, 1, 1, 1, true);
      }

      // History should be capped
      expect(particle.history.length).toBeLessThanOrEqual(20);
    });
  });

  describe('draw', () => {
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;
    });

    it('should draw particle circle', () => {
      particle.draw(mockCtx, false);

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalledWith(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
      );
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw trail when enabled and has history', () => {
      // Build some history
      for (let i = 0; i < 5; i++) {
        particle.x = i * 10;
        particle.y = i * 10;
        particle.update(0, 0, 800, 600, 1, 1, 1, 1, true);
      }

      particle.draw(mockCtx, true);

      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should not draw trail when disabled', () => {
      particle.draw(mockCtx, false);

      expect(mockCtx.moveTo).not.toHaveBeenCalled();
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });
  });
});
