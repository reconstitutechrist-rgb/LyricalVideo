import React, { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/solid';
import { ChatMessage } from '../../../types';

// Grip icon for dragging
const GripIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
  </svg>
);

interface DraggableChatProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onFileUpload?: (file: File, type: 'image' | 'audio') => void;
}

export const DraggableChat: React.FC<DraggableChatProps> = ({
  isOpen,
  onClose,
  isMinimized,
  onToggleMinimize,
  messages,
  onSendMessage,
  isProcessing,
  onFileUpload,
}) => {
  const [position, setPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 440 : 500,
    y: 80,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header-drag')) {
      setIsDragging(true);
      const rect = chatRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 420));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      const isImage = file.type.startsWith('image/');
      onFileUpload(file, isImage ? 'image' : 'audio');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={chatRef}
      className={`fixed z-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing select-none' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '300px' : '420px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`bg-black/85 backdrop-blur-2xl rounded-2xl border border-amber-500/20 shadow-2xl shadow-black/50 overflow-hidden flex flex-col ${isMinimized ? 'h-auto' : 'h-[520px]'}`}
      >
        {/* Chat Header - Draggable */}
        <div className="chat-header-drag p-4 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing bg-gradient-to-r from-amber-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-blue-400 animate-pulse"></div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-blue-500 to-blue-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">AI Director</h3>
              {!isMinimized && <p className="text-xs text-amber-400/70">Drag to move</p>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="text-white/30 mr-2">
              <GripIcon />
            </div>
            <button
              onClick={onToggleMinimize}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              {isMinimized ? (
                <ChevronRightIcon className="w-4 h-4 rotate-90" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 -rotate-90" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-3'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-blue-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-blue-500 text-white rounded-tr-none'
                        : 'bg-white/5 backdrop-blur rounded-tl-none border border-white/5 text-white/90'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-blue-500 flex-shrink-0 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></span>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/30">
              <form onSubmit={handleSubmit} className="relative flex gap-2">
                {/* File Upload Button */}
                {onFileUpload && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="audio/*,image/*"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-amber-400 transition-colors flex-shrink-0"
                      title="Upload audio or image"
                    >
                      <ArrowUpTrayIcon className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Describe your vision..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-white hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DraggableChat;
