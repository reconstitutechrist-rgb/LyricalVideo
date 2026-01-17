import React from 'react';
import { CheckIcon, EyeIcon } from '@heroicons/react/24/solid';

interface ConfirmationBubbleProps {
  /** Called when user clicks "Apply Change" */
  onApply: () => void;
  /** Called when user clicks "Just Show Me" */
  onShowOnly: () => void;
  /** Optional: controls that will be affected */
  controlNames?: string[];
  /** Optional: scope description */
  scope?: string;
}

/**
 * ConfirmationBubble displays two action buttons after AI identifies a control:
 * - "Apply Change" - executes the AI's suggested change
 * - "Just Show Me" - keeps the highlight but doesn't change anything
 */
export const ConfirmationBubble: React.FC<ConfirmationBubbleProps> = ({
  onApply,
  onShowOnly,
  controlNames,
  scope,
}) => {
  return (
    <div className="flex flex-col gap-2 mt-3">
      {/* Optional context info */}
      {(controlNames?.length || scope) && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {controlNames?.map((name) => (
            <span
              key={name}
              className="inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            >
              {name}
            </span>
          ))}
          {scope && (
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {scope}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
        >
          <CheckIcon className="w-3.5 h-3.5" />
          Apply Change
        </button>
        <button
          onClick={onShowOnly}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 text-[10px] font-medium rounded-lg transition-all border border-gray-600"
        >
          <EyeIcon className="w-3.5 h-3.5" />
          Just Show Me
        </button>
      </div>
    </div>
  );
};

export default ConfirmationBubble;
