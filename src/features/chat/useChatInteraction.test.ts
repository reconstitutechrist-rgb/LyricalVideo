/**
 * Tests for useChatInteraction hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatInteraction } from './useChatInteraction';
import { useChatStore } from '../../stores';

// Mock the geminiService
vi.mock('../../../services/geminiService', () => ({
  sendChatMessage: vi.fn().mockResolvedValue({ text: 'AI response' }),
}));

// Mock the useAbortableRequest hook
vi.mock('../../hooks/useAbortableRequest', () => ({
  useAbortableRequest: () => ({
    execute: vi.fn().mockResolvedValue({ text: 'AI response' }),
    abort: vi.fn(),
    isInProgress: false,
    requestId: 1,
  }),
  isAbortError: vi.fn().mockReturnValue(false),
}));

describe('useChatInteraction', () => {
  beforeEach(() => {
    // Reset the chat store before each test
    useChatStore.getState().reset();
  });

  describe('initial state', () => {
    it('should return messages from store', () => {
      const { result } = renderHook(() => useChatInteraction());

      // Should have the welcome message
      expect(result.current.messages.length).toBeGreaterThan(0);
      expect(result.current.messages[0].role).toBe('model');
    });

    it('should return empty chat input initially', () => {
      const { result } = renderHook(() => useChatInteraction());

      expect(result.current.chatInput).toBe('');
    });

    it('should not be processing initially', () => {
      const { result } = renderHook(() => useChatInteraction());

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('setChatInput', () => {
    it('should update chat input', () => {
      const { result } = renderHook(() => useChatInteraction());

      act(() => {
        result.current.setChatInput('Hello AI');
      });

      expect(result.current.chatInput).toBe('Hello AI');
    });
  });

  describe('addModelMessage', () => {
    it('should add a model message', () => {
      const { result } = renderHook(() => useChatInteraction());
      const initialCount = result.current.messages.length;

      act(() => {
        result.current.addModelMessage('Test model message');
      });

      expect(result.current.messages.length).toBe(initialCount + 1);
      expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({
        role: 'model',
        text: 'Test model message',
      });
    });
  });

  describe('addUserMessage', () => {
    it('should add a user message', () => {
      const { result } = renderHook(() => useChatInteraction());
      const initialCount = result.current.messages.length;

      act(() => {
        result.current.addUserMessage('Test user message');
      });

      expect(result.current.messages.length).toBe(initialCount + 1);
      expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({
        role: 'user',
        text: 'Test user message',
      });
    });
  });

  describe('addStatusMessage', () => {
    it('should add a status message as model role', () => {
      const { result } = renderHook(() => useChatInteraction());
      const initialCount = result.current.messages.length;

      act(() => {
        result.current.addStatusMessage('Processing complete');
      });

      expect(result.current.messages.length).toBe(initialCount + 1);
      expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({
        role: 'model',
        text: 'Processing complete',
      });
    });
  });

  describe('clearInput', () => {
    it('should clear the chat input', () => {
      const { result } = renderHook(() => useChatInteraction());

      act(() => {
        result.current.setChatInput('Some text');
      });
      expect(result.current.chatInput).toBe('Some text');

      act(() => {
        result.current.clearInput();
      });
      expect(result.current.chatInput).toBe('');
    });
  });

  describe('setIsProcessing', () => {
    it('should update processing state', () => {
      const { result } = renderHook(() => useChatInteraction());

      expect(result.current.isProcessing).toBe(false);

      act(() => {
        result.current.setIsProcessing(true);
      });
      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.setIsProcessing(false);
      });
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('prepareUserMessage', () => {
    it('should return null when chat input is empty', () => {
      const { result } = renderHook(() => useChatInteraction());

      const prepared = result.current.prepareUserMessage();
      expect(prepared).toBeNull();
    });

    it('should return message and history when chat input has content', () => {
      const { result } = renderHook(() => useChatInteraction());

      act(() => {
        result.current.setChatInput('Test message');
      });

      const prepared = result.current.prepareUserMessage();
      expect(prepared).not.toBeNull();
      expect(prepared?.message.text).toBe('Test message');
      expect(prepared?.message.role).toBe('user');
      expect(prepared?.history).toBeDefined();
      expect(Array.isArray(prepared?.history)).toBe(true);
    });
  });

  describe('abort controls', () => {
    it('should provide abortChat function', () => {
      const { result } = renderHook(() => useChatInteraction());

      expect(typeof result.current.abortChat).toBe('function');
    });

    it('should provide isChatInProgress state', () => {
      const { result } = renderHook(() => useChatInteraction());

      expect(typeof result.current.isChatInProgress).toBe('boolean');
    });
  });
});
