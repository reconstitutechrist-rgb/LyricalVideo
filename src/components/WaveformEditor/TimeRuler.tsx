import React, { useMemo } from 'react';
import { TimeRulerProps } from './types';
import { formatTime, getTimeRulerIntervals } from '../../../services/audioAnalysisService';

export const TimeRuler: React.FC<TimeRulerProps> = ({
  duration,
  width,
  height = 24,
  zoom,
  scrollOffset,
}) => {
  const markers = useMemo(() => {
    const { major, minor } = getTimeRulerIntervals(zoom, duration);
    const totalWidth = width * zoom;
    const pixelsPerSecond = totalWidth / duration;

    const result: { time: number; x: number; isMajor: boolean; label: string }[] = [];

    // Calculate visible time range
    const startTime = scrollOffset / pixelsPerSecond;
    const endTime = (scrollOffset + width) / pixelsPerSecond;

    // Generate minor markers
    const minorStart = Math.floor(startTime / minor) * minor;
    for (let t = minorStart; t <= endTime + minor; t += minor) {
      if (t < 0) continue;
      const x = t * pixelsPerSecond - scrollOffset;
      if (x >= -10 && x <= width + 10) {
        const isMajor = Math.abs(t % major) < 0.001 || Math.abs((t % major) - major) < 0.001;
        result.push({
          time: t,
          x,
          isMajor,
          label: isMajor ? formatTime(t, zoom >= 2) : '',
        });
      }
    }

    return result;
  }, [duration, width, zoom, scrollOffset]);

  return (
    <div
      className="time-ruler relative bg-gray-800/50 border-b border-gray-700"
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      {markers.map(({ time, x, isMajor, label }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${x}px`, transform: 'translateX(-50%)' }}
        >
          <div className={`w-px ${isMajor ? 'h-3 bg-gray-500' : 'h-1.5 bg-gray-600'}`} />
          {label && (
            <span className="text-[9px] text-gray-400 mt-0.5 whitespace-nowrap">{label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TimeRuler;
