import React, { useState, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  VideoPlan,
  VideoPlanMood,
  VideoPlanColorPalette,
  VideoPlanVisualStyle,
  LyricLine,
  EmotionalPeak,
} from '../../../types';
import { toast } from '../../stores';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { MoodCard } from './MoodCard';
import { ColorPaletteCard } from './ColorPaletteCard';
import { VisualStyleCard } from './VisualStyleCard';
import { PlanEffectCard } from './PlanEffectCard';
import { PeakVisualsCard } from './PeakVisualsCard';
import { PlanSummaryModal } from './PlanSummaryModal';
import { BackgroundStrategyCard } from './BackgroundStrategyCard';
import { ConversationalOnboarding } from './ConversationalOnboarding';

// Simplified stages: audio-lyrics (combined) -> vision -> generating
type OnboardingStage = 'audio-lyrics' | 'vision' | 'generating';

interface VideoPlanPanelProps {
  plan: VideoPlan | null;
  lyrics: LyricLine[];
  isGenerating: boolean;
  onRegenerate: () => void;
  onApply: () => void | Promise<void>;
  onModifyViaChat: (instruction: string) => Promise<void>;
  onMoodEdit: (mood: VideoPlanMood) => void;
  onPaletteEdit: (palette: VideoPlanColorPalette) => void;
  onStyleEdit: (style: VideoPlanVisualStyle) => void;
  onRegeneratePeakVisual: (peak: EmotionalPeak) => void;
  regeneratingPeakId: string | null;
  onBackgroundToggle: () => void;
  onBackgroundRegenerate: () => void;
  isRegeneratingBackground: boolean;
  onClose: () => void;
  // Props for conversational onboarding
  audioFile: File | null;
  onFileDrop: (file: File) => void;
  onVisionSubmit: (vision: string) => void;
  processingStatus: string;
  isProcessingAudio: boolean;
  // New props for transcription workflow
  currentLyrics: string;
  onLyricsChange: (lyrics: string) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
  onLyricsContinue: () => void;
}

export const VideoPlanPanel: React.FC<VideoPlanPanelProps> = ({
  plan,
  lyrics,
  isGenerating,
  onRegenerate,
  onApply,
  onModifyViaChat,
  onMoodEdit,
  onPaletteEdit,
  onStyleEdit,
  onRegeneratePeakVisual,
  regeneratingPeakId,
  onBackgroundToggle,
  onBackgroundRegenerate,
  isRegeneratingBackground,
  onClose,
  // Onboarding props
  audioFile,
  onFileDrop,
  onVisionSubmit,
  processingStatus,
  isProcessingAudio,
  // Transcription workflow props
  currentLyrics,
  onLyricsChange,
  onTranscribe,
  isTranscribing,
  onLyricsContinue,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Onboarding stage management - start with audio-lyrics (combined stage)
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>('audio-lyrics');

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isModifying) return;

    const instruction = chatInput.trim();
    setIsModifying(true);
    setChatInput(''); // Clear input immediately for better UX

    try {
      await onModifyViaChat(instruction);
      toast.success('Plan Updated', 'Your modification has been applied.');
    } catch (err) {
      console.error('Failed to modify plan:', err);
      toast.error('Modification Failed', 'Could not update the plan. Please try again.');
      // Restore input so user doesn't lose their text
      setChatInput(instruction);
    } finally {
      setIsModifying(false);
    }
  };

  const handleApplyConfirm = () => {
    setShowSummary(false);
    onApply();
  };

  // Drag-and-drop handlers for the entire panel
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!audioFile) {
        setIsDragOver(true);
      }
    },
    [audioFile]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!audioFile) {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
          // Stay on audio-lyrics stage, just update the file
          onFileDrop(file);
        }
      }
    },
    [audioFile, onFileDrop]
  );

  // No longer need to watch for audio processing completion since we have combined audio-lyrics stage
  // The user manually clicks "Continue" to proceed to vision stage

  // Handle plan generation failure - reset to vision stage so user can retry
  React.useEffect(() => {
    if (onboardingStage === 'generating' && !isGenerating && !plan && !isProcessingAudio) {
      // Generation finished but no plan was created - this means it failed
      // Reset to vision stage so user can try again
      setOnboardingStage('vision');
    }
  }, [onboardingStage, isGenerating, plan, isProcessingAudio]);

  // Onboarding flow handlers
  const handleFileDropFromBubble = (file: File) => {
    onFileDrop(file);
  };

  const handleLyricsContinue = () => {
    onLyricsContinue();
    setOnboardingStage('vision');
  };

  const handleVisionSubmit = (vision: string) => {
    onVisionSubmit(vision);
    setOnboardingStage('generating');
  };

  const handleSkipVision = () => {
    onVisionSubmit('');
    setOnboardingStage('generating');
  };

  // Determine what to show
  const showOnboarding = !plan;
  const audioFileName = audioFile?.name || null;

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 flex flex-col z-40 shadow-2xl transition-all duration-300 ${
          isDragOver ? 'border-l-cyan-500/50 shadow-[0_0_30px_rgba(0,212,255,0.2)]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {showOnboarding ? 'AI Director' : 'Video Plan'}
            </h2>
            {plan && (
              <div className="text-xs text-gray-400">
                v{plan.version} - {plan.status}
              </div>
            )}
            {showOnboarding && (
              <div className="text-xs text-cyan-400">Ready to create your video</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plan && (
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
                title="Regenerate plan"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              title="Close panel"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conditional content: Onboarding or Plan */}
        {showOnboarding ? (
          <ConversationalOnboarding
            stage={onboardingStage}
            audioFile={audioFile}
            audioFileName={audioFileName}
            lyrics={currentLyrics}
            isTranscribing={isTranscribing}
            isProcessing={isProcessingAudio}
            processingStatus={processingStatus}
            onFileDrop={handleFileDropFromBubble}
            onTranscribe={onTranscribe}
            onLyricsChange={onLyricsChange}
            onLyricsContinue={handleLyricsContinue}
            onVisionSubmit={handleVisionSubmit}
            onSkipVision={handleSkipVision}
          />
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* User's Creative Vision (if provided) */}
              {plan.userCreativeVision && (
                <div className="bg-gray-800 rounded-lg border border-purple-500/30 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-400 mb-2">
                    <SparklesIcon className="w-4 h-4" />
                    Your Creative Vision
                  </div>
                  <p className="text-sm text-gray-300 italic">"{plan.userCreativeVision}"</p>
                </div>
              )}

              {/* Confidence indicator */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
                <h3 className="text-xs font-medium text-gray-400 mb-2">AI Analysis Confidence</h3>
                <ConfidenceIndicator
                  confidence={plan.analysis.confidence}
                  disagreements={plan.analysis.disagreements}
                />
              </div>

              {/* Mood card */}
              <MoodCard mood={plan.mood} onEdit={onMoodEdit} />

              {/* Color palette card */}
              <ColorPaletteCard palette={plan.colorPalette} onEdit={onPaletteEdit} />

              {/* Visual style card */}
              <VisualStyleCard style={plan.visualStyle} onEdit={onStyleEdit} />

              {/* Background Strategy (AI-decided video vs image) */}
              <BackgroundStrategyCard
                strategy={plan.backgroundStrategy}
                sharedBackground={plan.hybridVisuals.sharedBackground}
                onToggleType={onBackgroundToggle}
                onRegenerate={onBackgroundRegenerate}
                isRegenerating={isRegeneratingBackground}
              />

              {/* Background effect */}
              <PlanEffectCard effect={plan.backgroundEffect} type="background" />

              {/* Lyric effects */}
              {plan.lyricEffects.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-gray-400 px-1">Lyric Effects</h3>
                  {plan.lyricEffects.map((effect, idx) => (
                    <PlanEffectCard key={idx} effect={effect} type="lyric" />
                  ))}
                </div>
              )}

              {/* Peak visuals */}
              <PeakVisualsCard
                peakVisuals={plan.hybridVisuals.peakVisuals}
                emotionalPeaks={plan.emotionalPeaks}
                lyrics={lyrics}
                onRegeneratePeak={onRegeneratePeakVisual}
                isRegenerating={regeneratingPeakId}
              />

              {/* AI Summary */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
                <h3 className="text-xs font-medium text-gray-400 mb-2">AI Summary</h3>
                <p className="text-sm text-gray-300">{plan.summary}</p>
              </div>
            </div>

            {/* Chat input for modifications */}
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800">
              <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Modify plan: 'make it more energetic'..."
                    disabled={isModifying}
                    className="w-full bg-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isModifying}
                  className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isModifying ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>

            {/* Apply button */}
            <div className="px-4 py-3 border-t border-gray-700">
              <button
                onClick={() => setShowSummary(true)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                <CheckIcon className="w-5 h-5" />
                Review & Apply Plan
              </button>
            </div>
          </>
        )}
      </div>

      {/* Summary modal */}
      {showSummary && plan && (
        <PlanSummaryModal
          plan={plan}
          onConfirm={handleApplyConfirm}
          onCancel={() => setShowSummary(false)}
        />
      )}
    </>
  );
};
