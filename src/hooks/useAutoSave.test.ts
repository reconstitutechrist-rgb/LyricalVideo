/**
 * Tests for useAutoSave hook utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ProjectData } from './useAutoSave';
import { VisualStyle } from '../../types';
import type { VisualSettings } from '../../types';

// Mock IndexedDB
const mockStore: Map<string, unknown> = new Map();
const mockObjectStore = {
  put: vi.fn().mockImplementation((data: { id: string }) => {
    mockStore.set(data.id, data);
    return { onerror: null, onsuccess: null };
  }),
  get: vi.fn().mockImplementation((key: string) => {
    const data = mockStore.get(key);
    return {
      onerror: null,
      onsuccess: null,
      get result() {
        return data;
      },
    };
  }),
  delete: vi.fn().mockImplementation((key: string) => {
    mockStore.delete(key);
    return { onerror: null, onsuccess: null };
  }),
};

const mockTransaction = {
  objectStore: vi.fn().mockReturnValue(mockObjectStore),
};

const mockDb = {
  transaction: vi.fn().mockReturnValue(mockTransaction),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(true),
  },
};

// Mock localStorage
const localStorageMock: Map<string, string> = new Map();
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => localStorageMock.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => localStorageMock.set(key, value)),
    removeItem: vi.fn((key: string) => localStorageMock.delete(key)),
    clear: vi.fn(() => localStorageMock.clear()),
  },
  writable: true,
});

// Mock indexedDB
Object.defineProperty(global, 'indexedDB', {
  value: {
    open: vi.fn().mockReturnValue({
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: mockDb,
    }),
  },
  writable: true,
});

// Helper to create valid VisualSettings for tests
const createMockVisualSettings = (overrides: Partial<VisualSettings> = {}): VisualSettings => ({
  particleSpeed: 1.0,
  speedX: 1.0,
  speedY: 1.0,
  intensity: 1.0,
  palette: 'neon',
  colorPalette: 'neon',
  dynamicBackgroundOpacity: false,
  dynamicBackgroundPulse: false,
  textAnimation: 'NONE',
  backgroundBlendMode: 'source-over',
  blendMode: 'source-over',
  fontFamily: 'Montserrat',
  textStagger: 0.05,
  textRevealDuration: 0.3,
  kineticRotationRange: 10,
  kineticOffsetRange: 20,
  glitchFrequency: 0.1,
  trailsEnabled: false,
  particleTrails: false,
  cameraShake: false,
  cameraShakeIntensity: 1.0,
  shakeIntensity: 1.0,
  reactivityIntensity: 1.0,
  lyricsOnlyMode: false,
  fontSizeScale: 1.0,
  frequencyMapping: {
    pulse: 'bass',
    motion: 'mid',
    color: 'treble',
  },
  ...overrides,
});

describe('useAutoSave utilities', () => {
  beforeEach(() => {
    mockStore.clear();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('ProjectData interface', () => {
    it('should have correct structure', () => {
      const projectData: ProjectData = {
        version: 1,
        savedAt: '2024-01-15T12:00:00.000Z',
        lyrics: [
          {
            id: 'line-1',
            text: 'Test lyric',
            startTime: 0,
            endTime: 5,
          },
        ],
        userProvidedLyrics: 'Test lyrics text',
        visualSettings: createMockVisualSettings(),
        currentStyle: VisualStyle.NEON_PULSE,
        aspectRatio: '16:9',
      };

      expect(projectData.version).toBe(1);
      expect(projectData.savedAt).toBeDefined();
      expect(projectData.lyrics).toBeInstanceOf(Array);
      expect(projectData.visualSettings).toBeDefined();
      expect(projectData.currentStyle).toBe(VisualStyle.NEON_PULSE);
      expect(projectData.aspectRatio).toBe('16:9');
    });
  });

  describe('localStorage fallback', () => {
    it('should get and set items correctly', () => {
      const key = 'test-key';
      const value = 'test-value';

      localStorage.setItem(key, value);
      expect(localStorage.getItem(key)).toBe(value);
    });

    it('should return null for non-existent keys', () => {
      expect(localStorage.getItem('non-existent')).toBeNull();
    });

    it('should remove items correctly', () => {
      const key = 'remove-test';
      localStorage.setItem(key, 'value');
      localStorage.removeItem(key);
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('data serialization', () => {
    it('should serialize and deserialize project data', () => {
      const projectData: ProjectData = {
        version: 1,
        savedAt: new Date().toISOString(),
        lyrics: [
          {
            id: 'line-1',
            text: 'Test',
            startTime: 0,
            endTime: 1,
          },
        ],
        userProvidedLyrics: '',
        visualSettings: createMockVisualSettings({
          palette: 'ocean',
          colorPalette: 'ocean',
          textAnimation: 'TYPEWRITER',
          intensity: 0.8,
          particleSpeed: 1.2,
          trailsEnabled: true,
          particleTrails: true,
          backgroundBlendMode: 'multiply',
          blendMode: 'multiply',
        }),
        currentStyle: VisualStyle.LIQUID_DREAM,
        aspectRatio: '9:16',
      };

      const serialized = JSON.stringify(projectData);
      const deserialized = JSON.parse(serialized) as ProjectData;

      expect(deserialized.version).toBe(projectData.version);
      expect(deserialized.lyrics).toEqual(projectData.lyrics);
      expect(deserialized.visualSettings).toEqual(projectData.visualSettings);
      expect(deserialized.currentStyle).toBe(projectData.currentStyle);
      expect(deserialized.aspectRatio).toBe(projectData.aspectRatio);
    });

    it('should handle empty lyrics array', () => {
      const projectData: ProjectData = {
        version: 1,
        savedAt: new Date().toISOString(),
        lyrics: [],
        userProvidedLyrics: '',
        visualSettings: createMockVisualSettings(),
        currentStyle: VisualStyle.NEON_PULSE,
        aspectRatio: '16:9',
      };

      const serialized = JSON.stringify(projectData);
      const deserialized = JSON.parse(serialized) as ProjectData;

      expect(deserialized.lyrics).toEqual([]);
      expect(deserialized.lyrics.length).toBe(0);
    });
  });
});
