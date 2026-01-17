/**
 * ChatPanel Component
 * Right sidebar containing AI Director chat interface.
 * Extracted from LyricalFlowUI for better maintainability.
 */

import React, { useRef, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { ChatMessage } from '../../../../../types';
import { SoundWave } from '../../subcomponents';
import { ConfirmationBubble } from '../../../AIControl/ConfirmationBubble';

export interface ChatPanelProps {
  // State
  chatMessages: ChatMessage[];
  chatInput: string;
  isProcessing: boolean;

  // AI Control
  aiControlPending?: {
    message: string;
    commands: unknown[];
    controlNames: string[];
  } | null;

  // Callbacks
  onChatToggle: () => void;
  onChatInputChange: (value: string) => void;
  onChatSubmit: () => void;
  onAiControlApply?: () => void;
  onAiControlShowOnly?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  chatInput,
  isProcessing,
  aiControlPending,
  onChatToggle,
  onChatInputChange,
  onChatSubmit,
  onAiControlApply,
  onAiControlShowOnly,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, isProcessing]);

  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onChatSubmit();
    }
  };

  return (
    <aside
      className="w-72 tablet:w-80 flex flex-col z-30 relative glass-panel"
      aria-label="AI Director Chat"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize resize-handle"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="p-3 border-b border-cyan-500/20 flex justify-between items-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 136, 255, 0.05), rgba(0, 255, 204, 0.08))',
          }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-cyan-500/30 loading-pulse bg-gradient-to-br from-cyan-500/30 to-blue-500/30">
            <SparklesIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold">AI Director</h3>
            <p className="text-[9px] text-cyan-400/60">Always listening</p>
          </div>
        </div>
        <button
          onClick={onChatToggle}
          className="text-slate-400 hover:text-white transition relative z-10"
          aria-label="Close chat"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar"
        role="log"
        aria-label="Chat messages"
      >
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-2.5 rounded-xl text-[10px] leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'chat-bubble-user text-white rounded-br-sm'
                  : 'chat-bubble-ai text-slate-300 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[8px] text-slate-600 mt-1 mx-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-[10px] text-cyan-400">
            <SparklesIcon className="w-4 h-4" />
            <span>Creating...</span>
            <SoundWave count={5} />
          </div>
        )}

        {/* AI Control Confirmation */}
        {aiControlPending && onAiControlApply && onAiControlShowOnly && (
          <div className="mt-2">
            <ConfirmationBubble
              onApply={onAiControlApply}
              onShowOnly={onAiControlShowOnly}
              controlNames={aiControlPending.controlNames}
            />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cyan-500/20">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for ideas..."
            className="w-full rounded-full py-2.5 pl-3 pr-10 text-[10px] text-white outline-none placeholder-slate-500 glass-card border border-cyan-500/20 focus:border-cyan-500/50"
            aria-label="Chat message input"
          />
          <button
            onClick={onChatSubmit}
            disabled={!chatInput.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center btn-gradient-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {['Generate BG', 'Suggest style', 'Help'].map((action) => (
            <button
              key={action}
              onClick={() => onChatInputChange(action)}
              className="px-2 py-1 rounded-full text-[9px] text-slate-400 hover:text-cyan-300 glass-card border border-cyan-500/10 transition"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ChatPanel;
