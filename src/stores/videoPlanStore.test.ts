/**
 * Video Plan Store Tests
 * Unit tests for the video plan state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVideoPlanStore } from './videoPlanStore';
import type { VideoPlan } from '../../types';
import { Genre, VisualStyle } from '../../types';

// Mock video plan for testing
const createMockVideoPlan = (overrides: Partial<VideoPlan> = {}): VideoPlan => ({
  id: 'test-plan-id',
  createdAt: new Date(),
  version: 1,
  status: 'draft',
  analysis: {
    geminiResult: {
      genre: Genre.POP,
      confidence: 0.9,
      suggestedStyle: 'NEON_PULSE',
      mood: 'energetic',
    },
    claudeResult: {
      genre: Genre.POP,
      confidence: 0.85,
      suggestedStyle: 'NEON_PULSE',
      mood: 'energetic',
    },
    consensusGenre: Genre.POP,
    consensusMood: 'energetic',
    confidence: 0.9,
  },
  mood: {
    primary: 'Energetic',
    secondary: 'Uplifting',
    intensity: 'high',
    description: 'Test mood description',
  },
  colorPalette: {
    name: 'Test Palette',
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
    background: '#000000',
    text: '#ffffff',
    previewGradient: 'linear-gradient(to right, #ff0000, #00ff00)',
  },
  visualStyle: {
    style: VisualStyle.NEON_PULSE,
    textAnimation: 'KINETIC',
    fontFamily: 'default',
    blendMode: 'source-over',
    intensity: 0.8,
    particleSpeed: 1.0,
  },
  backgroundStrategy: {
    useVideo: false,
    imagePrompt: 'Test image prompt',
    videoPrompt: null,
    reasoning: 'Test background reasoning',
  },
  backgroundEffect: {
    effectId: 'test-bg-effect',
    name: 'Test Background Effect',
    description: 'A test background effect',
    parameters: {},
  },
  lyricEffects: [],
  emotionalPeaks: [],
  hybridVisuals: {
    sharedBackground: null,
    peakVisuals: [],
  },
  summary: 'Test video plan summary',
  rationale: 'Test rationale',
  ...overrides,
});

describe('videoPlanStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useVideoPlanStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have null video plan', () => {
      expect(useVideoPlanStore.getState().videoPlan).toBeNull();
    });

    it('should have empty history', () => {
      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(0);
    });

    it('should show plan panel by default', () => {
      expect(useVideoPlanStore.getState().showPlanPanel).toBe(true);
    });

    it('should not be generating by default', () => {
      expect(useVideoPlanStore.getState().isGeneratingPlan).toBe(false);
    });

    it('should not have a regenerating peak ID', () => {
      expect(useVideoPlanStore.getState().regeneratingPeakId).toBeNull();
    });
  });

  describe('setVideoPlan', () => {
    it('should set the video plan', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);

      expect(useVideoPlanStore.getState().videoPlan).toEqual(mockPlan);
    });

    it('should allow setting to null', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);
      useVideoPlanStore.getState().setVideoPlan(null);

      expect(useVideoPlanStore.getState().videoPlan).toBeNull();
    });
  });

  describe('updateVideoPlan', () => {
    it('should update specific properties', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);

      useVideoPlanStore.getState().updateVideoPlan({ summary: 'Updated summary' });

      expect(useVideoPlanStore.getState().videoPlan?.summary).toBe('Updated summary');
    });

    it('should not update if no plan exists', () => {
      useVideoPlanStore.getState().updateVideoPlan({ summary: 'Updated summary' });

      expect(useVideoPlanStore.getState().videoPlan).toBeNull();
    });
  });

  describe('pushToHistory', () => {
    it('should add current plan to history', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);
      useVideoPlanStore.getState().pushToHistory();

      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(1);
      expect(useVideoPlanStore.getState().videoPlanHistory[0]).toEqual(mockPlan);
    });

    it('should not add to history if no plan exists', () => {
      useVideoPlanStore.getState().pushToHistory();

      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(0);
    });

    it('should accumulate history', () => {
      const plan1 = createMockVideoPlan({ version: 1 });
      const plan2 = createMockVideoPlan({ version: 2 });

      useVideoPlanStore.getState().setVideoPlan(plan1);
      useVideoPlanStore.getState().pushToHistory();
      useVideoPlanStore.getState().setVideoPlan(plan2);
      useVideoPlanStore.getState().pushToHistory();

      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(2);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);
      useVideoPlanStore.getState().pushToHistory();
      useVideoPlanStore.getState().pushToHistory();

      useVideoPlanStore.getState().clearHistory();

      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(0);
    });
  });

  describe('UI toggles', () => {
    it('setShowPlanPanel should update visibility', () => {
      useVideoPlanStore.getState().setShowPlanPanel(false);
      expect(useVideoPlanStore.getState().showPlanPanel).toBe(false);

      useVideoPlanStore.getState().setShowPlanPanel(true);
      expect(useVideoPlanStore.getState().showPlanPanel).toBe(true);
    });

    it('togglePlanPanel should toggle visibility', () => {
      const initial = useVideoPlanStore.getState().showPlanPanel;
      useVideoPlanStore.getState().togglePlanPanel();
      expect(useVideoPlanStore.getState().showPlanPanel).toBe(!initial);
    });
  });

  describe('loading states', () => {
    it('setIsGeneratingPlan should update state', () => {
      useVideoPlanStore.getState().setIsGeneratingPlan(true);
      expect(useVideoPlanStore.getState().isGeneratingPlan).toBe(true);
    });

    it('setRegeneratingPeakId should update state', () => {
      useVideoPlanStore.getState().setRegeneratingPeakId('peak-123');
      expect(useVideoPlanStore.getState().regeneratingPeakId).toBe('peak-123');
    });

    it('setIsRegeneratingBackground should update state', () => {
      useVideoPlanStore.getState().setIsRegeneratingBackground(true);
      expect(useVideoPlanStore.getState().isRegeneratingBackground).toBe(true);
    });
  });

  describe('updateMood', () => {
    it('should update mood and push to history', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);

      const newMood = {
        primary: 'Calm',
        secondary: 'Peaceful',
        intensity: 'low' as const,
        description: 'A calm and peaceful mood',
      };
      useVideoPlanStore.getState().updateMood(newMood);

      expect(useVideoPlanStore.getState().videoPlan?.mood).toEqual(newMood);
      expect(useVideoPlanStore.getState().videoPlan?.version).toBe(2);
      expect(useVideoPlanStore.getState().videoPlanHistory).toHaveLength(1);
    });
  });

  describe('updateColorPalette', () => {
    it('should update color palette and push to history', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);

      const newPalette = {
        name: 'New Palette',
        primary: '#ffffff',
        secondary: '#000000',
        accent: '#ff00ff',
        background: '#333333',
        text: '#000000',
        previewGradient: 'linear-gradient(to right, #ffffff, #000000)',
      };
      useVideoPlanStore.getState().updateColorPalette(newPalette);

      expect(useVideoPlanStore.getState().videoPlan?.colorPalette).toEqual(newPalette);
      expect(useVideoPlanStore.getState().videoPlan?.version).toBe(2);
    });
  });

  describe('markAsApplied', () => {
    it('should set status to applied', () => {
      const mockPlan = createMockVideoPlan({ status: 'draft' });
      useVideoPlanStore.getState().setVideoPlan(mockPlan);

      useVideoPlanStore.getState().markAsApplied();

      expect(useVideoPlanStore.getState().videoPlan?.status).toBe('applied');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const mockPlan = createMockVideoPlan();
      useVideoPlanStore.getState().setVideoPlan(mockPlan);
      useVideoPlanStore.getState().pushToHistory();
      useVideoPlanStore.getState().setIsGeneratingPlan(true);
      useVideoPlanStore.getState().setShowPlanPanel(false);

      useVideoPlanStore.getState().reset();

      const state = useVideoPlanStore.getState();
      expect(state.videoPlan).toBeNull();
      expect(state.videoPlanHistory).toHaveLength(0);
      expect(state.isGeneratingPlan).toBe(false);
      expect(state.showPlanPanel).toBe(true);
    });
  });
});
