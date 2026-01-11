import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface ChatBubbleProps {
  message: string;
  isAI?: boolean;
  children?: React.ReactNode;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isAI = true, children }) => {
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
          isAI
            ? 'chat-ai-bubble bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-cyan-500/20'
            : 'chat-user-bubble bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30'
        }`}
      >
        {isAI && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <SparklesIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium text-cyan-400">AI Director</span>
          </div>
        )}
        <p className="text-sm text-gray-200 leading-relaxed">{message}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};
