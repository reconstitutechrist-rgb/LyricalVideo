import React from 'react';
import {
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  FilmIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { VideoPlan } from '../../../types';

interface PlanSummaryModalProps {
  plan: VideoPlan;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PlanSummaryModal: React.FC<PlanSummaryModalProps> = ({
  plan,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Apply Video Plan</h2>
          </div>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Rationale */}
          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300 italic">{plan.rationale}</p>
          </div>

          {/* Summary section */}
          <h3 className="text-sm font-medium text-gray-400 mb-2">Changes to Apply:</h3>

          <div className="space-y-3">
            {/* Mood */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Mood</div>
              <div className="flex-1 text-sm text-white">
                {plan.mood.primary}
                <span className="text-gray-400 text-xs ml-2">
                  ({plan.mood.intensity} intensity)
                </span>
              </div>
            </div>

            {/* Color Palette */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Palette</div>
              <div className="flex-1">
                <div className="text-sm text-white mb-1">{plan.colorPalette.name}</div>
                <div className="flex gap-1">
                  {[
                    plan.colorPalette.primary,
                    plan.colorPalette.secondary,
                    plan.colorPalette.accent,
                    plan.colorPalette.background,
                    plan.colorPalette.text,
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Style */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Style</div>
              <div className="flex-1 text-sm text-white">
                {plan.visualStyle.style.replace(/_/g, ' ')}
                <span className="text-gray-400 text-xs block">
                  {plan.visualStyle.fontFamily} / {plan.visualStyle.textAnimation}
                </span>
              </div>
            </div>

            {/* Background Effect */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Effect</div>
              <div className="flex-1 text-sm text-white">{plan.backgroundEffect.name}</div>
            </div>

            {/* Background Strategy */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Background</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-white">
                  {plan.backgroundStrategy.useVideo ? (
                    <>
                      <FilmIcon className="w-4 h-4 text-purple-400" />
                      <span>Motion Video</span>
                    </>
                  ) : (
                    <>
                      <PhotoIcon className="w-4 h-4 text-blue-400" />
                      <span>Static Image</span>
                    </>
                  )}
                  {plan.hybridVisuals.sharedBackground && (
                    <span className="text-green-400 text-xs">(Generated)</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{plan.backgroundStrategy.reasoning}</p>
              </div>
            </div>

            {/* Lyric Effects */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Effects</div>
              <div className="flex-1 text-sm text-white">
                {plan.lyricEffects.map((e) => e.name).join(', ') || 'None'}
              </div>
            </div>

            {/* Peak Visuals */}
            <div className="flex items-start gap-3 p-2 bg-gray-700/30 rounded">
              <div className="w-24 text-xs text-gray-400">Peak Visuals</div>
              <div className="flex-1 text-sm text-white">
                {plan.hybridVisuals.peakVisuals.length} unique visuals
              </div>
            </div>
          </div>

          {/* Summary text */}
          <div className="mt-4 p-3 border border-gray-600 rounded-lg">
            <h4 className="text-xs font-medium text-gray-400 mb-1">AI Summary</h4>
            <p className="text-sm text-gray-300">{plan.summary}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-700">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-300 hover:text-white">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <CheckIcon className="w-4 h-4" />
            Apply Plan
          </button>
        </div>
      </div>
    </div>
  );
};
