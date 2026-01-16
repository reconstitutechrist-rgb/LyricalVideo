/**
 * Confidence Validation Utilities
 * Validates and filters transcription confidence levels
 */

import { LyricLine, WordTiming } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ConfidenceThresholds {
  /**
   * Minimum confidence for high quality (green indicator)
   * Values >= high are considered high confidence
   * @default 0.8
   */
  high: number;

  /**
   * Minimum confidence for medium quality (yellow indicator)
   * Values >= medium but < high are medium confidence
   * Values < medium are low confidence (red indicator)
   * @default 0.5
   */
  medium: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface ConfidenceStats {
  /** Total number of words */
  totalWords: number;
  /** Words with high confidence */
  highConfidenceWords: number;
  /** Words with medium confidence */
  mediumConfidenceWords: number;
  /** Words with low confidence */
  lowConfidenceWords: number;
  /** Words without confidence data */
  unknownConfidenceWords: number;
  /** Average confidence across all words */
  averageConfidence: number;
  /** Percentage of words meeting high threshold */
  highConfidencePercent: number;
  /** Total number of lines */
  totalLines: number;
  /** Lines flagged as potentially inaccurate */
  flaggedLines: number;
}

export interface WordConfidenceInfo {
  word: WordTiming;
  level: ConfidenceLevel;
  confidence: number;
  needsReview: boolean;
}

export interface LineConfidenceInfo {
  line: LyricLine;
  level: ConfidenceLevel;
  confidence: number;
  lowConfidenceWords: WordConfidenceInfo[];
  needsReview: boolean;
}

// ============================================================================
// Default Thresholds
// ============================================================================

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  high: 0.8,
  medium: 0.5,
};

// ============================================================================
// Confidence Level Helpers
// ============================================================================

/**
 * Get confidence level for a given value
 */
export function getConfidenceLevel(
  confidence: number | undefined,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceLevel {
  if (confidence === undefined || confidence === null) {
    return 'unknown';
  }
  if (confidence >= thresholds.high) {
    return 'high';
  }
  if (confidence >= thresholds.medium) {
    return 'medium';
  }
  return 'low';
}

/**
 * Get color for confidence level
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return '#22c55e'; // green-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#ef4444'; // red-500
    case 'unknown':
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get Tailwind class for confidence level
 */
export function getConfidenceTailwindClass(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-green-500 bg-green-500/10 border-green-500/30';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'unknown':
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
  }
}

/**
 * Get label for confidence level
 */
export function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High Confidence';
    case 'medium':
      return 'Medium Confidence';
    case 'low':
      return 'Low Confidence';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

// ============================================================================
// Word-Level Analysis
// ============================================================================

/**
 * Analyze confidence for a single word
 */
export function analyzeWordConfidence(
  word: WordTiming,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): WordConfidenceInfo {
  const confidence = word.confidence ?? 0;
  const level = getConfidenceLevel(word.confidence, thresholds);
  const needsReview = level === 'low' || level === 'unknown';

  return {
    word,
    level,
    confidence,
    needsReview,
  };
}

/**
 * Get all low-confidence words from a line
 */
export function getLowConfidenceWords(
  line: LyricLine,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): WordConfidenceInfo[] {
  if (!line.words) return [];

  return line.words
    .map((word) => analyzeWordConfidence(word, thresholds))
    .filter((info) => info.needsReview);
}

// ============================================================================
// Line-Level Analysis
// ============================================================================

/**
 * Analyze confidence for a lyric line
 */
export function analyzeLineConfidence(
  line: LyricLine,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): LineConfidenceInfo {
  const confidence = line.syncConfidence ?? 0;
  const level = getConfidenceLevel(line.syncConfidence, thresholds);
  const lowConfidenceWords = getLowConfidenceWords(line, thresholds);
  const needsReview = level === 'low' || level === 'unknown' || lowConfidenceWords.length > 0;

  return {
    line,
    level,
    confidence,
    lowConfidenceWords,
    needsReview,
  };
}

/**
 * Get lines that need review (low confidence or have low-confidence words)
 */
export function getLinesNeedingReview(
  lyrics: LyricLine[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): LineConfidenceInfo[] {
  return lyrics
    .map((line) => analyzeLineConfidence(line, thresholds))
    .filter((info) => info.needsReview);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculate confidence statistics for lyrics
 */
export function calculateConfidenceStats(
  lyrics: LyricLine[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceStats {
  let totalWords = 0;
  let highConfidenceWords = 0;
  let mediumConfidenceWords = 0;
  let lowConfidenceWords = 0;
  let unknownConfidenceWords = 0;
  let confidenceSum = 0;
  let wordsWithConfidence = 0;
  let flaggedLines = 0;

  for (const line of lyrics) {
    const lineInfo = analyzeLineConfidence(line, thresholds);
    if (lineInfo.needsReview) {
      flaggedLines++;
    }

    if (line.words) {
      for (const word of line.words) {
        totalWords++;
        const wordInfo = analyzeWordConfidence(word, thresholds);

        switch (wordInfo.level) {
          case 'high':
            highConfidenceWords++;
            break;
          case 'medium':
            mediumConfidenceWords++;
            break;
          case 'low':
            lowConfidenceWords++;
            break;
          case 'unknown':
            unknownConfidenceWords++;
            break;
        }

        if (word.confidence !== undefined) {
          confidenceSum += word.confidence;
          wordsWithConfidence++;
        }
      }
    }
  }

  const averageConfidence = wordsWithConfidence > 0 ? confidenceSum / wordsWithConfidence : 0;
  const highConfidencePercent = totalWords > 0 ? (highConfidenceWords / totalWords) * 100 : 0;

  return {
    totalWords,
    highConfidenceWords,
    mediumConfidenceWords,
    lowConfidenceWords,
    unknownConfidenceWords,
    averageConfidence,
    highConfidencePercent,
    totalLines: lyrics.length,
    flaggedLines,
  };
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter lyrics to only include high-confidence words
 * Returns a new array with modified lyrics (does not mutate original)
 */
export function filterLowConfidenceWords(
  lyrics: LyricLine[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): LyricLine[] {
  return lyrics.map((line) => {
    if (!line.words) return line;

    const filteredWords = line.words.filter((word) => {
      const level = getConfidenceLevel(word.confidence, thresholds);
      return level === 'high' || level === 'medium';
    });

    // Rebuild text from filtered words
    const newText = filteredWords.map((w) => w.text).join(' ');

    return {
      ...line,
      text: newText || line.text,
      words: filteredWords.length > 0 ? filteredWords : undefined,
    };
  });
}

/**
 * Mark low-confidence words in text with indicators
 * Returns HTML string with span wrappers
 */
export function markLowConfidenceWords(
  line: LyricLine,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): string {
  if (!line.words) return line.text;

  return line.words
    .map((word) => {
      const level = getConfidenceLevel(word.confidence, thresholds);
      if (level === 'low' || level === 'unknown') {
        return `<span class="low-confidence" data-confidence="${word.confidence ?? 0}">${word.text}</span>`;
      }
      return word.text;
    })
    .join(' ');
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if lyrics meet minimum quality threshold
 */
export function meetsQualityThreshold(
  lyrics: LyricLine[],
  minHighConfidencePercent: number = 70,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): boolean {
  const stats = calculateConfidenceStats(lyrics, thresholds);
  return stats.highConfidencePercent >= minHighConfidencePercent;
}

/**
 * Generate quality report for lyrics
 */
export function generateQualityReport(
  lyrics: LyricLine[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): {
  stats: ConfidenceStats;
  summary: string;
  recommendations: string[];
} {
  const stats = calculateConfidenceStats(lyrics, thresholds);
  const recommendations: string[] = [];

  // Generate summary
  let summary: string;
  if (stats.highConfidencePercent >= 90) {
    summary = 'Excellent transcription quality - minimal review needed.';
  } else if (stats.highConfidencePercent >= 70) {
    summary = 'Good transcription quality - some words may need review.';
  } else if (stats.highConfidencePercent >= 50) {
    summary = 'Moderate transcription quality - manual review recommended.';
  } else {
    summary = 'Low transcription quality - significant manual review required.';
  }

  // Generate recommendations
  if (stats.lowConfidenceWords > 0) {
    recommendations.push(`Review ${stats.lowConfidenceWords} low-confidence words for accuracy.`);
  }

  if (stats.unknownConfidenceWords > 0) {
    recommendations.push(
      `${stats.unknownConfidenceWords} words have no confidence data - re-sync recommended.`
    );
  }

  if (stats.flaggedLines > 0) {
    recommendations.push(`${stats.flaggedLines} lines have potential timing issues.`);
  }

  if (stats.averageConfidence < 0.7) {
    recommendations.push(
      'Consider re-syncing with clearer audio or providing more accurate lyrics.'
    );
  }

  return {
    stats,
    summary,
    recommendations,
  };
}
