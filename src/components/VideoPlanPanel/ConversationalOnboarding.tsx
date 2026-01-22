import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { ChatBubble } from './ChatBubble';
import { AudioLyricsUploader } from './AudioLyricsUploader';
import { LyricsInputBubble } from './LyricsInputBubble';

// Simplified stages: audio-lyrics (combined) -> vision -> generating
type OnboardingStage = 'audio-lyrics' | 'vision' | 'generating';

interface ConversationalOnboardingProps {
  stage: OnboardingStage;
  audioFile: File | null;
  audioFileName: string | null;
  lyrics: string;
  isTranscribing: boolean;
  isProcessing: boolean;
  processingStatus: string;
  onFileDrop: (file: File) => void;
  onTranscribe: () => void;
  onLyricsChange: (lyrics: string) => void;
  onLyricsContinue: () => void;
  onVisionSubmit: (vision: string) => void;
  onSkipVision: () => void;
}

export const ConversationalOnboarding: React.FC<ConversationalOnboardingProps> = ({
  stage,
  audioFile,
  audioFileName,
  lyrics,
  isTranscribing,
  isProcessing,
  processingStatus,
  onFileDrop,
  onTranscribe,
  onLyricsChange,
  onLyricsContinue,
  onVisionSubmit,
  onSkipVision,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Audio + Lyrics stage (combined) */}
      {stage === 'audio-lyrics' && (
        <>
          <ChatBubble message="Welcome to Lyrical Flow! Upload your audio and add lyrics to get started." />
          <div className="mt-4">
            <AudioLyricsUploader
              audioFile={audioFile}
              lyrics={lyrics}
              isTranscribing={isTranscribing}
              isProcessing={isProcessing}
              onFileSelect={onFileDrop}
              onTranscribe={onTranscribe}
              onLyricsChange={onLyricsChange}
              onContinue={onLyricsContinue}
            />
          </div>
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
          {lyrics && (
            <div className="flex justify-end mb-3">
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-xs text-green-400 mb-1">Lyrics loaded</p>
                <p className="text-xs text-gray-400 line-clamp-2">{lyrics.slice(0, 100)}...</p>
              </div>
            </div>
          )}
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
