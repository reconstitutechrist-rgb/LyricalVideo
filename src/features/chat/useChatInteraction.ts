/**
 * Chat Interaction Hook
 * Encapsulates chat-related logic for AI interactions
 */

import { useCallback } from 'react';
import { useChatStore } from '../../stores';
import { sendChatMessage } from '../../../services/geminiService';
import { useAbortableRequest, isAbortError } from '../../hooks/useAbortableRequest';
import type { ChatMessage } from '../../../types';

interface UseChatInteractionReturn {
  // State from store
  messages: ChatMessage[];
  chatInput: string;
  isProcessing: boolean;

  // Actions
  setChatInput: (input: string) => void;
  addModelMessage: (text: string) => void;
  addUserMessage: (text: string) => void;
  addStatusMessage: (text: string) => void;
  clearInput: () => void;
  setIsProcessing: (processing: boolean) => void;
  prepareUserMessage: () => {
    message: ChatMessage;
    history: { role: string; content: string }[];
  } | null;

  // Chat request (for custom submission handling)
  executeChatRequest: (
    history: { role: string; parts: { text: string }[] }[],
    message: string
  ) => Promise<string | null>;

  // Abort controls
  abortChat: () => void;
  isChatInProgress: boolean;
}

/**
 * Hook to manage chat interactions with AI
 * Provides chat state and utilities from the chat store
 *
 * Note: AI control command processing is handled at the App level
 * to access full application state (lyrics, selections, etc.)
 */
export const useChatInteraction = (): UseChatInteractionReturn => {
  const chatStore = useChatStore();
  const {
    messages,
    chatInput,
    isProcessing,
    setChatInput,
    addModelMessage,
    addUserMessage,
    clearInput,
    setIsProcessing,
    prepareUserMessage,
  } = chatStore;

  // Abortable request for chat - returns object with text property
  const chatRequest = useAbortableRequest<{ text: string }>({
    onError: (err) => {
      if (!isAbortError(err)) {
        addModelMessage('Sorry, I encountered an error. Please try again.');
      }
    },
  });

  // Add a status message (convenience wrapper for model messages)
  const addStatusMessage = useCallback(
    (text: string) => {
      addModelMessage(text);
    },
    [addModelMessage]
  );

  // Execute a chat request to the AI
  const executeChatRequest = useCallback(
    async (
      history: { role: string; parts: { text: string }[] }[],
      message: string
    ): Promise<string | null> => {
      try {
        const response = await chatRequest.execute(async (signal) => {
          return sendChatMessage(history, message, signal);
        });

        return response?.text ?? null;
      } catch (err) {
        if (!isAbortError(err)) {
          throw err;
        }
        return null;
      }
    },
    [chatRequest]
  );

  return {
    // State
    messages,
    chatInput,
    isProcessing,

    // Actions
    setChatInput,
    addModelMessage,
    addUserMessage,
    addStatusMessage,
    clearInput,
    setIsProcessing,
    prepareUserMessage,

    // Chat request
    executeChatRequest,

    // Abort controls
    abortChat: chatRequest.abort,
    isChatInProgress: chatRequest.isInProgress,
  };
};

export default useChatInteraction;
