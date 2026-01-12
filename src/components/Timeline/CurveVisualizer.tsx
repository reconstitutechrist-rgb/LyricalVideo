import React, { useMemo } from 'react';
import { EasingType } from '../../../types';

interface CurveVisualizerProps {
  easing: EasingType;
  width?: number;
  height?: number;
}

// Easing functions
const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  elastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
};

export const CurveVisualizer: React.FC<CurveVisualizerProps> = ({
  easing,
  width = 200,
  height = 80,
}) => {
  const padding = 8;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Generate path data for the curve
  const pathData = useMemo(() => {
    const easingFn = easingFunctions[easing] || easingFunctions.linear;
    const points: string[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = padding + t * graphWidth;
      // Invert Y because SVG Y axis goes down
      const y = padding + (1 - easingFn(t)) * graphHeight;
      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }

    return points.join(' ');
  }, [easing, graphWidth, graphHeight]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: React.ReactElement[] = [];
    const gridCount = 4;

    for (let i = 0; i <= gridCount; i++) {
      const x = padding + (i / gridCount) * graphWidth;
      const y = padding + (i / gridCount) * graphHeight;

      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={height - padding}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      );
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      );
    }

    return lines;
  }, [graphWidth, graphHeight, width, height]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-gray-500"
      >
        {/* Grid */}
        {gridLines}

        {/* Diagonal reference line (linear) */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={padding}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="4 4"
        />

        {/* Easing curve */}
        <path
          d={pathData}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start point */}
        <circle cx={padding} cy={height - padding} r={3} fill="#22d3ee" />

        {/* End point */}
        <circle cx={width - padding} cy={padding} r={3} fill="#22d3ee" />
      </svg>

      {/* Easing name label */}
      <div className="px-2 py-1 text-[10px] text-gray-500 text-center border-t border-gray-800">
        {easing.charAt(0).toUpperCase() + easing.slice(1).replace(/([A-Z])/g, ' $1')}
      </div>
    </div>
  );
};

export default CurveVisualizer;
