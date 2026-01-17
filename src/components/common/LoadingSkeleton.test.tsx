/**
 * LoadingSkeleton Component Tests
 * Unit tests for skeleton loading states
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonWaveform,
  SkeletonLyricLine,
  SkeletonLyricsList,
  AIProcessingIndicator,
  SkeletonCircularProgress,
} from './LoadingSkeleton';

describe('LoadingSkeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-shimmer');
      expect(skeleton).toHaveClass('rounded');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('custom-class');
    });

    it('should apply width and height styles', () => {
      render(<Skeleton width={100} height={50} data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
    });
  });

  describe('SkeletonText', () => {
    it('should render default 1 line', () => {
      const { container } = render(<SkeletonText />);
      const lines = container.querySelectorAll('.animate-shimmer');
      expect(lines).toHaveLength(1);
    });

    it('should render specified number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />);
      const lines = container.querySelectorAll('.animate-shimmer');
      expect(lines).toHaveLength(5);
    });
  });

  describe('SkeletonCard', () => {
    it('should render card structure', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should contain multiple skeleton elements', () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('.animate-shimmer');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonWaveform', () => {
    it('should render waveform container', () => {
      const { container } = render(<SkeletonWaveform />);
      expect(container.querySelector('.h-24')).toBeInTheDocument();
    });

    it('should render multiple bars', () => {
      const { container } = render(<SkeletonWaveform />);
      const bars = container.querySelectorAll('.w-1');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonLyricLine', () => {
    it('should render lyric line skeleton', () => {
      const { container } = render(<SkeletonLyricLine />);
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });

    it('should have time and text skeletons', () => {
      const { container } = render(<SkeletonLyricLine />);
      const skeletons = container.querySelectorAll('.animate-shimmer');
      expect(skeletons.length).toBe(3); // start time, text, end time
    });
  });

  describe('SkeletonLyricsList', () => {
    it('should render default 8 lines', () => {
      const { container } = render(<SkeletonLyricsList />);
      const lines = container.querySelectorAll('.flex.items-center');
      expect(lines).toHaveLength(8);
    });

    it('should render specified count of lines', () => {
      const { container } = render(<SkeletonLyricsList count={3} />);
      const lines = container.querySelectorAll('.flex.items-center');
      expect(lines).toHaveLength(3);
    });
  });

  describe('AIProcessingIndicator', () => {
    it('should render default message', () => {
      render(<AIProcessingIndicator />);
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
    });

    it('should render custom message', () => {
      render(<AIProcessingIndicator message="Analyzing audio..." />);
      expect(screen.getByText('Analyzing audio...')).toBeInTheDocument();
    });

    it('should render animated dots', () => {
      const { container } = render(<AIProcessingIndicator />);
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });

  describe('SkeletonCircularProgress', () => {
    it('should render with default size', () => {
      const { container } = render(<SkeletonCircularProgress />);
      const circle = container.querySelector('.rounded-full');
      expect(circle).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('should render with custom size', () => {
      const { container } = render(<SkeletonCircularProgress size={64} />);
      const circle = container.querySelector('.rounded-full');
      expect(circle).toHaveStyle({ width: '64px', height: '64px' });
    });

    it('should have spinning animation', () => {
      const { container } = render(<SkeletonCircularProgress />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
