import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfidenceIndicatorProps {
  confidence: number;
  disagreements?: string[];
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  disagreements,
}) => {
  const percentage = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.8;
  const isMediumConfidence = confidence >= 0.6 && confidence < 0.8;

  const getColorClass = () => {
    if (isHighConfidence) return 'text-green-400';
    if (isMediumConfidence) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBgColorClass = () => {
    if (isHighConfidence) return 'bg-green-400';
    if (isMediumConfidence) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isHighConfidence ? (
          <CheckCircleIcon className={`w-5 h-5 ${getColorClass()}`} />
        ) : (
          <ExclamationTriangleIcon className={`w-5 h-5 ${getColorClass()}`} />
        )}
        <span className={`text-sm font-medium ${getColorClass()}`}>{percentage}% Confidence</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBgColorClass()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Disagreements */}
      {disagreements && disagreements.length > 0 && (
        <div className="mt-1 text-xs text-gray-400">
          <span className="font-medium">AI disagreements:</span>
          <ul className="mt-1 space-y-0.5">
            {disagreements.map((d, i) => (
              <li key={i} className="text-yellow-400/80">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
