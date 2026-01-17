/**
 * Chat Store
 * Manages chat/AI interaction state including messages, input, and processing status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatMessage } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ChatState {
  // Chat messages
  messages: ChatMessage[];

  // Input state
  chatInput: string;

  // Processing state
  isProcessing: boolean;
}

export interface ChatActions {
  // Message management
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (text: string) => void;
  addModelMessage: (text: string) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;

  // Input management
  setChatInput: (input: string) => void;
  clearInput: () => void;

  // Processing state
  setIsProcessing: (processing: boolean) => void;

  // Convenience method for sending a message
  prepareUserMessage: () => {
    message: ChatMessage;
    history: { role: string; content: string }[];
  } | null;

  // Reset
  reset: () => void;
}

export type ChatStore = ChatState & ChatActions;

// ============================================================================
// Initial State
// ============================================================================

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text: "Welcome to Lyrical Flow AI! I'm your AI director. Upload an audio file to begin, or describe your creative vision for the lyric video.",
  timestamp: new Date(),
};

const initialState: ChatState = {
  messages: [WELCOME_MESSAGE],
  chatInput: '',
  isProcessing: false,
};

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] }), false, 'addMessage'),

      addUserMessage: (text) =>
        set(
          (state) => ({
            messages: [...state.messages, { role: 'user' as const, text, timestamp: new Date() }],
          }),
          false,
          'addUserMessage'
        ),

      addModelMessage: (text) =>
        set(
          (state) => ({
            messages: [...state.messages, { role: 'model' as const, text, timestamp: new Date() }],
          }),
          false,
          'addModelMessage'
        ),

      clearMessages: () => set({ messages: [WELCOME_MESSAGE] }, false, 'clearMessages'),

      setMessages: (messages) => set({ messages }, false, 'setMessages'),

      setChatInput: (chatInput) => set({ chatInput }, false, 'setChatInput'),

      clearInput: () => set({ chatInput: '' }, false, 'clearInput'),

      setIsProcessing: (isProcessing) => set({ isProcessing }, false, 'setIsProcessing'),

      prepareUserMessage: () => {
        const { chatInput, messages } = get();
        if (!chatInput.trim()) return null;

        const userMessage: ChatMessage = {
          role: 'user',
          text: chatInput,
          timestamp: new Date(),
        };

        const history = messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.text,
        }));

        return { message: userMessage, history };
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'chat-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectMessageCount = (state: ChatStore): number => state.messages.length;

export const selectHasMessages = (state: ChatStore): boolean => state.messages.length > 1; // > 1 because of welcome message

export const selectLastMessage = (state: ChatStore): ChatMessage | null =>
  state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;

export const selectLastModelMessage = (state: ChatStore): ChatMessage | null => {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    if (state.messages[i].role === 'model') {
      return state.messages[i];
    }
  }
  return null;
};

export const selectChatHistory = (state: ChatStore): { role: string; content: string }[] =>
  state.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    content: m.text,
  }));

export const selectCanSendMessage = (state: ChatStore): boolean =>
  state.chatInput.trim().length > 0 && !state.isProcessing;
