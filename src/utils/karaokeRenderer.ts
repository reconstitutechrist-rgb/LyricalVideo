/**
 * Karaoke-style word highlighting renderer
 * Renders text with word-by-word highlighting based on timing
 */

import { LyricLine, WordTiming } from '../../types';

export interface KaraokeRenderOptions {
  textColor: string;
  highlightColor: string;
  activeColor?: string;
  fontSize: number;
  glowEnabled?: boolean;
}

/**
 * Render karaoke-style text with word-by-word highlighting
 */
export const renderKaraokeText = (
  ctx: CanvasRenderingContext2D,
  line: LyricLine,
  time: number,
  options: KaraokeRenderOptions
): void => {
  const { textColor, highlightColor, activeColor = '#00ffff' } = options;

  if (!line.words || line.words.length === 0) {
    ctx.fillStyle = textColor;
    ctx.fillText(line.text, 0, 0);
    return;
  }

  // Build full text with spaces for width calculation
  const wordsWithSpaces = line.words.map((w, i) =>
    i < line.words!.length - 1 ? w.text + ' ' : w.text
  );
  const fullText = wordsWithSpaces.join('');
  const totalWidth = ctx.measureText(fullText).width;

  // Start position (centered)
  let xPos = -totalWidth / 2;

  // Define colors for different states
  const pastColor = highlightColor; // Already sung words
  const futureColor = textColor; // Not yet sung

  // Save text alignment since we'll draw left-aligned
  ctx.save();
  ctx.textAlign = 'left';

  line.words.forEach((word: WordTiming, idx: number) => {
    const isActive = time >= word.startTime && time < word.endTime;
    const isPast = time >= word.endTime;
    const wordText = idx < line.words!.length - 1 ? word.text + ' ' : word.text;
    const wordWidth = ctx.measureText(wordText).width;

    // Set fill style based on state
    if (isPast) {
      ctx.fillStyle = pastColor;
      ctx.shadowColor = pastColor;
      ctx.shadowBlur = 8;
      ctx.fillText(wordText, xPos, 0);
    } else if (isActive) {
      // Calculate progress through the word for gradient effect
      const wordDuration = word.endTime - word.startTime;
      const wordProgress =
        wordDuration > 0 ? Math.min(1, (time - word.startTime) / wordDuration) : 0;

      // Active word gets a pulsing glow effect
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 15 + Math.sin(time * 10) * 5; // Pulsing glow

      // Scale active word slightly from its center
      ctx.save();
      const scale = 1 + wordProgress * 0.08;
      const wordCenterX = xPos + wordWidth / 2;
      ctx.translate(wordCenterX, 0);
      ctx.scale(scale, scale);
      ctx.translate(-wordCenterX, 0);
      ctx.fillText(wordText, xPos, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = futureColor;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillText(wordText, xPos, 0);
    }

    // Move to next word position
    xPos += wordWidth;
  });

  // Restore original state
  ctx.restore();
  ctx.shadowBlur = 0;
};

/**
 * Calculate the width of a lyric line for positioning
 */
export const measureLyricWidth = (ctx: CanvasRenderingContext2D, line: LyricLine): number => {
  if (!line.words || line.words.length === 0) {
    return ctx.measureText(line.text).width;
  }

  const wordsWithSpaces = line.words.map((w, i) =>
    i < line.words!.length - 1 ? w.text + ' ' : w.text
  );
  return ctx.measureText(wordsWithSpaces.join('')).width;
};

/**
 * Get the current word being sung
 */
export const getCurrentWord = (line: LyricLine, time: number): WordTiming | null => {
  if (!line.words) return null;
  return line.words.find((w) => time >= w.startTime && time < w.endTime) || null;
};

/**
 * Calculate progress through the current lyric line (0-1)
 */
export const getLyricProgress = (line: LyricLine, time: number): number => {
  const duration = line.endTime - line.startTime;
  if (duration <= 0) return 0;
  const elapsed = time - line.startTime;
  return Math.max(0, Math.min(1, elapsed / duration));
};
