import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { ChatBubble } from './ChatBubble';
import { AudioDropzoneBubble } from './AudioDropzoneBubble';
import { LyricsInputBubble } from './LyricsInputBubble';

type OnboardingStage = 'welcome' | 'uploading' | 'lyrics' | 'vision' | 'generating';

interface ConversationalOnboardingProps {
  stage: OnboardingStage;
  audioFileName: string | null;
  processingStatus: string;
  onFileDrop: (file: File) => void;
  onLyricsSubmit: (lyrics: string) => void;
  onSkipLyrics: () => void;
  onVisionSubmit: (vision: string) => void;
  onSkipVision: () => void;
}

export const ConversationalOnboarding: React.FC<ConversationalOnboardingProps> = ({
  stage,
  audioFileName,
  processingStatus,
  onFileDrop,
  onLyricsSubmit,
  onSkipLyrics,
  onVisionSubmit,
  onSkipVision,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Welcome message - always shown */}
      <ChatBubble message="Welcome to Lyrical Flow! I'm your AI Director. Drop an audio file below to get started." />

      {/* Dropzone - shown in welcome stage */}
      {stage === 'welcome' && (
        <AudioDropzoneBubble onFileSelect={onFileDrop} isProcessing={false} />
      )}

      {/* Uploading/Processing state */}
      {stage === 'uploading' && (
        <>
          <div className="flex justify-end mb-3">
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30 rounded-2xl px-4 py-2">
              <p className="text-sm text-gray-200">{audioFileName}</p>
            </div>
          </div>
          <ChatBubble message={`Analyzing "${audioFileName}"...`}>
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="w-4 h-4 text-cyan-400 animate-spin" />
              <div className="flex-1">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{processingStatus}</p>
          </ChatBubble>
        </>
      )}

      {/* Lyrics stage */}
      {stage === 'lyrics' && (
        <>
          <div className="flex justify-end mb-3">
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30 rounded-2xl px-4 py-2">
              <p className="text-sm text-gray-200">{audioFileName}</p>
            </div>
          </div>
          <ChatBubble message="Great track! Would you like to add lyrics for better sync? (optional)" />
          <LyricsInputBubble
            onSubmit={onLyricsSubmit}
            onSkip={onSkipLyrics}
            placeholder="Paste lyrics here..."
            submitLabel="Submit Lyrics"
            skipLabel="Skip"
          />
        </>
      )}

      {/* Vision stage */}
      {stage === 'vision' && (
        <>
          <div className="flex justify-end mb-3">
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30 rounded-2xl px-4 py-2">
              <p className="text-sm text-gray-200">{audioFileName}</p>
            </div>
          </div>
          <ChatBubble message="Any creative vision for this video? Describe the mood or style you're going for. (optional)" />
          <LyricsInputBubble
            onSubmit={onVisionSubmit}
            onSkip={onSkipVision}
            placeholder="Dark and moody with neon accents..."
            submitLabel="Generate Plan"
            skipLabel="Use AI Defaults"
            isVisionInput
          />
        </>
      )}

      {/* Generating plan state */}
      {stage === 'generating' && (
        <>
          <div className="flex justify-end mb-3">
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30 rounded-2xl px-4 py-2">
              <p className="text-sm text-gray-200">{audioFileName}</p>
            </div>
          </div>
          <ChatBubble message="Generating your video plan...">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="w-4 h-4 text-cyan-400 animate-spin" />
              <div className="flex-1">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {processingStatus || 'Analyzing audio and generating plan...'}
            </p>
          </ChatBubble>
        </>
      )}
    </div>
  );
};
