import React, { useState } from 'react';
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
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { MoodCard } from './MoodCard';
import { ColorPaletteCard } from './ColorPaletteCard';
import { VisualStyleCard } from './VisualStyleCard';
import { PlanEffectCard } from './PlanEffectCard';
import { PeakVisualsCard } from './PeakVisualsCard';
import { PlanSummaryModal } from './PlanSummaryModal';
import { BackgroundStrategyCard } from './BackgroundStrategyCard';

interface VideoPlanPanelProps {
  plan: VideoPlan;
  lyrics: LyricLine[];
  isGenerating: boolean;
  onRegenerate: () => void;
  onApply: () => void;
  onModifyViaChat: (instruction: string) => void;
  onMoodEdit: (mood: VideoPlanMood) => void;
  onPaletteEdit: (palette: VideoPlanColorPalette) => void;
  onStyleEdit: (style: VideoPlanVisualStyle) => void;
  onRegeneratePeakVisual: (peak: EmotionalPeak) => void;
  regeneratingPeakId: string | null;
  onBackgroundToggle: () => void;
  onBackgroundRegenerate: () => void;
  isRegeneratingBackground: boolean;
  onClose: () => void;
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
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isModifying) return;

    setIsModifying(true);
    await onModifyViaChat(chatInput.trim());
    setChatInput('');
    setIsModifying(false);
  };

  const handleApplyConfirm = () => {
    setShowSummary(false);
    onApply();
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 flex flex-col z-40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Video Plan</h2>
            <div className="text-xs text-gray-400">
              v{plan.version} - {plan.status}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              title="Regenerate plan"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              title="Close panel"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

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
      </div>

      {/* Summary modal */}
      {showSummary && (
        <PlanSummaryModal
          plan={plan}
          onConfirm={handleApplyConfirm}
          onCancel={() => setShowSummary(false)}
        />
      )}
    </>
  );
};
