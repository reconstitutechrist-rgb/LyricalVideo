/**
 * Karaoke Renderer Tests
 * Unit tests for karaoke text rendering utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measureLyricWidth, getCurrentWord, getLyricProgress } from './karaokeRenderer';
import type { LyricLine } from '../../types';

describe('karaokeRenderer', () => {
  // Mock canvas context
  const mockCtx = {
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('measureLyricWidth', () => {
    it('should measure simple text without words', () => {
      const line: LyricLine = {
        id: '1',
        text: 'Hello World',
        startTime: 0,
        endTime: 5,
      };
      const width = measureLyricWidth(mockCtx, line);
      expect(width).toBe(110); // 11 chars * 10px
    });

    it('should measure text with word timings', () => {
      const line: LyricLine = {
        id: '1',
        text: 'Hello World',
        startTime: 0,
        endTime: 5,
        words: [
          { id: 'w1', text: 'Hello', startTime: 0, endTime: 2 },
          { id: 'w2', text: 'World', startTime: 2, endTime: 5 },
        ],
      };
      const width = measureLyricWidth(mockCtx, line);
      // "Hello " + "World" = 6 + 5 = 11 chars * 10px
      expect(width).toBe(110);
    });
  });

  describe('getCurrentWord', () => {
    const line: LyricLine = {
      id: '1',
      text: 'Hello World Test',
      startTime: 0,
      endTime: 6,
      words: [
        { id: 'w1', text: 'Hello', startTime: 0, endTime: 2 },
        { id: 'w2', text: 'World', startTime: 2, endTime: 4 },
        { id: 'w3', text: 'Test', startTime: 4, endTime: 6 },
      ],
    };

    it('should return first word at time 0', () => {
      const word = getCurrentWord(line, 0);
      expect(word?.text).toBe('Hello');
    });

    it('should return second word at time 2.5', () => {
      const word = getCurrentWord(line, 2.5);
      expect(word?.text).toBe('World');
    });

    it('should return last word at time 5', () => {
      const word = getCurrentWord(line, 5);
      expect(word?.text).toBe('Test');
    });

    it('should return null after end time', () => {
      const word = getCurrentWord(line, 7);
      expect(word).toBeNull();
    });

    it('should return null for line without words', () => {
      const lineWithoutWords: LyricLine = {
        id: '2',
        text: 'No words',
        startTime: 0,
        endTime: 5,
      };
      const word = getCurrentWord(lineWithoutWords, 2);
      expect(word).toBeNull();
    });
  });

  describe('getLyricProgress', () => {
    const line: LyricLine = {
      id: '1',
      text: 'Test line',
      startTime: 10,
      endTime: 20,
    };

    it('should return 0 at start time', () => {
      expect(getLyricProgress(line, 10)).toBe(0);
    });

    it('should return 0.5 at midpoint', () => {
      expect(getLyricProgress(line, 15)).toBe(0.5);
    });

    it('should return 1 at end time', () => {
      expect(getLyricProgress(line, 20)).toBe(1);
    });

    it('should clamp to 0 before start', () => {
      expect(getLyricProgress(line, 5)).toBe(0);
    });

    it('should clamp to 1 after end', () => {
      expect(getLyricProgress(line, 25)).toBe(1);
    });

    it('should handle zero-duration line', () => {
      const zeroDurationLine: LyricLine = {
        id: '2',
        text: 'Zero',
        startTime: 5,
        endTime: 5,
      };
      expect(getLyricProgress(zeroDurationLine, 5)).toBe(0);
    });
  });
});
