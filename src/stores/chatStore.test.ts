/**
 * Chat Store Tests
 * Unit tests for the chat/AI interaction store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useChatStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have a welcome message', () => {
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('model');
      expect(messages[0].text).toContain('Welcome');
    });

    it('should have empty chat input', () => {
      expect(useChatStore.getState().chatInput).toBe('');
    });

    it('should not be processing', () => {
      expect(useChatStore.getState().isProcessing).toBe(false);
    });
  });

  describe('addUserMessage', () => {
    it('should add a user message', () => {
      useChatStore.getState().addUserMessage('Hello, AI!');

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2); // Welcome + user message
      expect(messages[1].role).toBe('user');
      expect(messages[1].text).toBe('Hello, AI!');
      expect(messages[1].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('addModelMessage', () => {
    it('should add a model message', () => {
      useChatStore.getState().addModelMessage('Hello, human!');

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2); // Welcome + model message
      expect(messages[1].role).toBe('model');
      expect(messages[1].text).toBe('Hello, human!');
    });
  });

  describe('addMessage', () => {
    it('should add a custom message', () => {
      const customMessage = {
        role: 'user' as const,
        text: 'Custom message',
        timestamp: new Date(),
      };

      useChatStore.getState().addMessage(customMessage);

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[1]).toEqual(customMessage);
    });
  });

  describe('setChatInput', () => {
    it('should update chat input', () => {
      useChatStore.getState().setChatInput('New input');
      expect(useChatStore.getState().chatInput).toBe('New input');
    });
  });

  describe('clearInput', () => {
    it('should clear chat input', () => {
      useChatStore.getState().setChatInput('Some text');
      useChatStore.getState().clearInput();
      expect(useChatStore.getState().chatInput).toBe('');
    });
  });

  describe('setIsProcessing', () => {
    it('should set processing state', () => {
      useChatStore.getState().setIsProcessing(true);
      expect(useChatStore.getState().isProcessing).toBe(true);

      useChatStore.getState().setIsProcessing(false);
      expect(useChatStore.getState().isProcessing).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('should reset to only welcome message', () => {
      useChatStore.getState().addUserMessage('Message 1');
      useChatStore.getState().addModelMessage('Response 1');

      useChatStore.getState().clearMessages();

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('model');
      expect(messages[0].text).toContain('Welcome');
    });
  });

  describe('setMessages', () => {
    it('should replace all messages', () => {
      const newMessages = [
        { role: 'user' as const, text: 'First', timestamp: new Date() },
        { role: 'model' as const, text: 'Second', timestamp: new Date() },
      ];

      useChatStore.getState().setMessages(newMessages);

      expect(useChatStore.getState().messages).toEqual(newMessages);
    });
  });

  describe('prepareUserMessage', () => {
    it('should return null for empty input', () => {
      useChatStore.getState().setChatInput('');
      expect(useChatStore.getState().prepareUserMessage()).toBeNull();

      useChatStore.getState().setChatInput('   ');
      expect(useChatStore.getState().prepareUserMessage()).toBeNull();
    });

    it('should return message and history for valid input', () => {
      useChatStore.getState().setChatInput('Test message');

      const result = useChatStore.getState().prepareUserMessage();

      expect(result).not.toBeNull();
      expect(result!.message.role).toBe('user');
      expect(result!.message.text).toBe('Test message');
      expect(result!.history).toHaveLength(1); // Welcome message
      expect(result!.history[0].role).toBe('model');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useChatStore.getState().addUserMessage('Message');
      useChatStore.getState().setChatInput('Input');
      useChatStore.getState().setIsProcessing(true);

      useChatStore.getState().reset();

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1); // Welcome message
      expect(state.chatInput).toBe('');
      expect(state.isProcessing).toBe(false);
    });
  });
});
