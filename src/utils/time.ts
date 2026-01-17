/**
 * Time Utility Functions
 * Centralized time formatting utilities used across the application
 */

/**
 * Format time in seconds to MM:SS or MM:SS.ms format
 * @param seconds - Time in seconds
 * @param showMs - Whether to show milliseconds (default: false for simple display)
 * @returns Formatted time string
 */
export const formatTime = (seconds: number, showMs: boolean = false): string => {
  // Handle edge cases
  if (!Number.isFinite(seconds) || seconds < 0) {
    return showMs ? '0:00.00' : '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (showMs) {
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time with precision control for different use cases
 * @param seconds - Time in seconds
 * @param precision - Number of decimal places for seconds (0, 1, 2, or 3)
 * @returns Formatted time string
 */
export const formatTimePrecise = (seconds: number, precision: 0 | 1 | 2 | 3 = 2): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return precision === 0 ? '0:00' : `0:00.${'0'.repeat(precision)}`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (precision === 0) {
    return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}`;
  }

  const secsFixed = secs.toFixed(precision);
  const [whole, decimal] = secsFixed.split('.');
  return `${mins}:${whole.padStart(2, '0')}.${decimal}`;
};

/**
 * Parse time string back to seconds
 * Supports formats: MM:SS, MM:SS.ms, SS, SS.ms
 * @param timeStr - Time string to parse
 * @returns Time in seconds, or NaN if invalid
 */
export const parseTime = (timeStr: string): number => {
  const trimmed = timeStr.trim();

  // Handle MM:SS or MM:SS.ms format
  if (trimmed.includes(':')) {
    const [minsStr, secsStr] = trimmed.split(':');
    const mins = parseInt(minsStr, 10);
    const secs = parseFloat(secsStr);

    if (isNaN(mins) || isNaN(secs)) return NaN;
    return mins * 60 + secs;
  }

  // Handle plain seconds
  const secs = parseFloat(trimmed);
  return isNaN(secs) ? NaN : secs;
};
