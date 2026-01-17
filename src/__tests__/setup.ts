/**
 * Vitest Test Setup
 * Configure global test utilities and mocks
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock IndexedDB for auto-save tests
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      objectStoreNames: { contains: vi.fn(() => false) },
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          get: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
      })),
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
});

// Mock AudioContext
class MockAudioContext {
  createMediaElementSource = vi.fn(() => ({
    connect: vi.fn(),
  }));
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
  }));
  createMediaStreamDestination = vi.fn(() => ({
    stream: new MediaStream(),
  }));
  destination = {};
}

Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = vi.fn(() => 'mock-blob-url');
URL.revokeObjectURL = vi.fn();
