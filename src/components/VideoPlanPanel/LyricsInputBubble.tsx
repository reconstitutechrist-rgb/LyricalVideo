import React, { useState } from 'react';
import { PaperAirplaneIcon, ForwardIcon } from '@heroicons/react/24/solid';

interface LyricsInputBubbleProps {
  onSubmit: (lyrics: string) => void;
  onSkip: () => void;
  placeholder?: string;
  submitLabel?: string;
  skipLabel?: string;
  isVisionInput?: boolean;
}

export const LyricsInputBubble: React.FC<LyricsInputBubbleProps> = ({
  onSubmit,
  onSkip,
  placeholder = 'Paste lyrics here...',
  submitLabel = 'Submit Lyrics',
  skipLabel = 'Skip',
  isVisionInput = false,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="mb-3">
      <div className="chat-lyrics-input bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-cyan-500/15 rounded-2xl p-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={isVisionInput ? 2 : 4}
          className="
            w-full
            bg-black/30
            border border-cyan-500/10
            rounded-xl
            px-3 py-2
            text-sm text-gray-200
            placeholder-gray-500
            resize-none
            focus:outline-none focus:border-cyan-500/40
            transition-colors duration-200
          "
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-2
              bg-gradient-to-r from-cyan-600 to-blue-600
              hover:from-cyan-500 hover:to-blue-500
              disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
              text-white text-sm font-medium
              rounded-xl
              transition-all duration-200
            "
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {submitLabel}
          </button>
          <button
            onClick={onSkip}
            className="
              flex items-center justify-center gap-2
              px-4 py-2
              bg-gray-700/50
              hover:bg-gray-600/50
              text-gray-300 text-sm font-medium
              rounded-xl
              border border-gray-600/50
              transition-all duration-200
            "
          >
            <ForwardIcon className="w-4 h-4" />
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
