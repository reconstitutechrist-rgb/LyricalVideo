/**
 * LoadingSkeleton Components
 * Shimmer loading states for AI operations and async content.
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  'data-testid'?: string;
}

/**
 * Base skeleton with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  'data-testid': testId,
}) => {
  return (
    <div
      data-testid={testId}
      className={`animate-shimmer bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

/**
 * Text line skeleton
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={`w-full ${i === lines - 1 && lines > 1 ? 'w-3/4' : ''}`}
        />
      ))}
    </div>
  );
};

/**
 * Card skeleton for template-like content
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`rounded-xl border border-white/5 overflow-hidden ${className}`}>
      <Skeleton height={120} className="w-full" />
      <div className="p-4 space-y-2">
        <Skeleton height={20} className="w-3/4" />
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-1/2" />
      </div>
    </div>
  );
};

/**
 * Chat message skeleton
 */
export const SkeletonChatMessage: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl p-4 ${isUser ? 'bg-pink-500/20' : 'bg-slate-800'}`}>
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

/**
 * Lyric line skeleton
 */
export const SkeletonLyricLine: React.FC = () => {
  return (
    <div className="flex items-center gap-3 py-2 px-3">
      <Skeleton width={50} height={20} className="shrink-0" />
      <Skeleton height={20} className="flex-1" />
      <Skeleton width={50} height={20} className="shrink-0" />
    </div>
  );
};

/**
 * Full lyrics list skeleton
 */
export const SkeletonLyricsList: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="space-y-1">
      {[...Array(count)].map((_, i) => (
        <SkeletonLyricLine key={i} />
      ))}
    </div>
  );
};

/**
 * Waveform skeleton
 */
export const SkeletonWaveform: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative h-24 bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-end gap-1 h-16">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-pink-500/50 to-purple-500/50 rounded-full animate-shimmer"
              style={{
                height: `${30 + Math.sin(i * 0.3) * 20 + Math.random() * 20}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900 opacity-50" />
    </div>
  );
};

/**
 * AI processing indicator with animated dots
 */
export const AIProcessingIndicator: React.FC<{ message?: string }> = ({
  message = 'AI is thinking...',
}) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-300">{message}</span>
    </div>
  );
};

/**
 * Circular progress skeleton (for export)
 */
export const SkeletonCircularProgress: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <div
      className="relative rounded-full border-4 border-slate-700 animate-pulse"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" />
    </div>
  );
};

export default Skeleton;
