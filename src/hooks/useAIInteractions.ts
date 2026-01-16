/**
 * useAIInteractions Hook
 * Manages AI orchestration, chat, video plan generation, and background generation.
 * Extracted from App.tsx to reduce monolithic component size.
 */

import { useCallback, useState } from 'react';
import { useAbortableRequest, isAbortError } from './useAbortableRequest';
import { useChatStore, useVideoPlanStore, toast } from '../stores';
import {
  sendChatMessage,
  generateBackground,
  generateVideoBackground,
  modifyVideoPlan,
  syncLyricsWithPrecision,
  detectMusicGenre,
} from '../../services/geminiService';
import * as aiOrchestrator from '../../services/aiOrchestrator';
import { aiControlService, AIControlCommand } from '../systems/aiControl';
import { ChatMessage, LyricLine, AspectRatio, ImageSize, TimingPrecision } from '../../types';
import type {
  VideoPlan,
  VideoPlanMood,
  VideoPlanColorPalette,
  VideoPlanVisualStyle,
  EmotionalPeak,
} from '../../types';

export interface AIControlPending {
  message: string;
  commands: AIControlCommand[];
  controlNames: string[];
}

export interface AIInteractionsOptions {
  aspectRatio: AspectRatio;
  onStatusUpdate?: (status: string) => void;
  onGenreDetected?: (genre: string) => void;
  onLyricsUpdate?: (lyrics: LyricLine[], metadata: unknown) => void;
  onBackgroundGenerated?: (asset: { type: 'image' | 'video'; url: string; prompt: string }) => void;
}

export interface AIInteractionsReturn {
  // Chat state
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  addChatMessage: (message: ChatMessage) => void;

  // AI Control state
  aiControlPending: AIControlPending | null;

  // Loading states
  isProcessing: boolean;
  isGeneratingPlan: boolean;
  isDetectingGenre: boolean;
  isRegeneratingBackground: boolean;
  regeneratingPeakId: string | null;
  isSyncing: boolean;
  syncProgress: number;

  // Chat actions
  handleChatSubmit: () => Promise<void>;
  handleAiControlApply: () => void;
  handleAiControlShowOnly: () => void;

  // Video Plan actions
  videoPlan: VideoPlan | null;
  showPlanPanel: boolean;
  setShowPlanPanel: (show: boolean) => void;
  generateVideoPlan: (
    audioFile: File,
    userLyrics: string,
    creativeVision: string
  ) => Promise<VideoPlan | null>;
  handleRegeneratePlan: (
    audioFile: File,
    userLyrics: string,
    creativeVision: string
  ) => Promise<void>;
  handleApplyPlan: (onApply: (plan: VideoPlan) => void) => void;
  handleModifyPlanViaChat: (instruction: string) => Promise<void>;
  handleMoodEdit: (mood: VideoPlanMood) => void;
  handlePaletteEdit: (palette: VideoPlanColorPalette) => void;
  handleStyleEdit: (style: VideoPlanVisualStyle) => void;
  handleRegeneratePeakVisual: (peak: EmotionalPeak, lyrics: LyricLine[]) => Promise<void>;
  handleBackgroundToggle: (lyrics: LyricLine[]) => Promise<void>;
  handleBackgroundRegenerate: () => Promise<void>;

  // Background generation
  generateBackgroundImage: (
    prompt: string,
    targetSize: ImageSize
  ) => Promise<{ type: 'image'; url: string; prompt: string } | null>;
  generateBackgroundVideo: (
    prompt: string,
    videoAspectRatio: '16:9' | '9:16'
  ) => Promise<{ type: 'video'; url: string; prompt: string } | null>;

  // Lyrics sync
  handleLyricSync: (
    audioFile: File,
    precision: TimingPrecision,
    userLyrics?: string
  ) => Promise<{ lyrics: LyricLine[]; metadata: unknown; confidence: number } | null>;

  // Genre detection
  detectGenre: (audioFile: File) => Promise<{ genre: string; confidence: number } | null>;
}

export function useAIInteractions(options: AIInteractionsOptions): AIInteractionsReturn {
  const { aspectRatio, onStatusUpdate, onGenreDetected, onBackgroundGenerated } = options;

  // Stores
  const chatStore = useChatStore();
  const videoPlanStore = useVideoPlanStore();

  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetectingGenre, setIsDetectingGenre] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [aiControlPending, setAiControlPending] = useState<AIControlPending | null>(null);

  // Destructure from stores
  const {
    messages: chatMessages,
    chatInput,
    setChatInput,
    addMessage: addChatMessage,
    setMessages: setChatMessages,
  } = chatStore;

  const {
    videoPlan,
    showPlanPanel,
    isGeneratingPlan,
    regeneratingPeakId,
    isRegeneratingBackground,
    setVideoPlan,
    setShowPlanPanel,
    setIsGeneratingPlan,
    setRegeneratingPeakId,
    setIsRegeneratingBackground,
    pushToHistory: pushVideoPlanToHistory,
  } = videoPlanStore;

  // Abortable request hooks
  const planRequest = useAbortableRequest<VideoPlan>({
    throttleMs: 2000,
    requestType: 'PLAN_GENERATION',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  const planModifyRequest = useAbortableRequest<VideoPlan>({
    throttleMs: 2000,
    requestType: 'PLAN_GENERATION',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  const chatRequest = useAbortableRequest<{
    text: string;
    functionCalls: Array<{ name?: string; args?: Record<string, unknown> }>;
  }>({
    throttleMs: 1000,
    requestType: 'CHAT',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  const backgroundRequest = useAbortableRequest<{
    type: 'image' | 'video';
    url: string;
    prompt: string;
  } | null>({
    throttleMs: 3000,
    requestType: 'BACKGROUND',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  const syncRequest = useAbortableRequest<{
    lyrics: LyricLine[];
    metadata: unknown;
    overallConfidence: number;
    processingTimeMs?: number;
  }>({
    throttleMs: 2000,
    requestType: 'SYNC',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  const peakVisualRequest = useAbortableRequest<{
    peakId: string;
    lyricIndices: number[];
    asset: { type: 'image' | 'video'; url: string; prompt: string };
    transitionIn: 'fade' | 'cut' | 'dissolve';
    transitionOut: 'fade' | 'cut' | 'dissolve';
  }>({
    throttleMs: 3000,
    requestType: 'BACKGROUND',
    onThrottled: (_waitMs, msg) => {
      addChatMessage({ role: 'model', text: msg, timestamp: new Date() });
    },
  });

  // Chat submit handler
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    const userMsg: ChatMessage = { role: 'user', text: userMessage, timestamp: new Date() };
    addChatMessage(userMsg);
    setChatInput('');
    setIsProcessing(true);

    try {
      // Check if this is an AI control command
      if (aiControlService.isControlCommand(userMessage)) {
        const controlResult = await aiControlService.processMessage(userMessage);

        if (controlResult.success && controlResult.requiresConfirmation) {
          setAiControlPending({
            message: controlResult.message,
            commands: controlResult.pendingCommands || [],
            controlNames: controlResult.controlsHighlighted,
          });

          addChatMessage({
            role: 'model',
            text: controlResult.message,
            timestamp: new Date(),
          });
          setIsProcessing(false);
          return;
        }
      }

      // Regular chat handling
      const response = await chatRequest.execute(async (signal) => {
        const history = chatMessages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));
        return sendChatMessage(history, userMessage, signal);
      });

      if (response) {
        if (response.text) {
          addChatMessage({ role: 'model', text: response.text, timestamp: new Date() });
        }

        // Handle function calls
        if (response.functionCalls) {
          for (const call of response.functionCalls) {
            if (call.name === 'generateBackgroundImage') {
              const args = call.args as Record<string, unknown>;
              addChatMessage({
                role: 'model',
                text: `Generating background image: ${args.prompt}...`,
                timestamp: new Date(),
              });

              const url = await generateBackground(
                args.prompt as string,
                (args.aspectRatio as AspectRatio) || '16:9',
                (args.resolution as ImageSize) || '1K'
              );

              onBackgroundGenerated?.({
                type: 'image',
                url,
                prompt: args.prompt as string,
              });

              addChatMessage({
                role: 'model',
                text: 'Background generated!',
                timestamp: new Date(),
              });
            }
          }
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Chat Error', 'Sorry, I encountered an error');
        addChatMessage({
          role: 'model',
          text: 'Sorry, I encountered an error.',
          timestamp: new Date(),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, chatRequest, addChatMessage, setChatInput, onBackgroundGenerated]);

  // AI control handlers
  const handleAiControlApply = useCallback(() => {
    if (!aiControlPending) return;

    const result = aiControlService.applyPendingCommands();
    addChatMessage({ role: 'model', text: result.message, timestamp: new Date() });
    setAiControlPending(null);
  }, [aiControlPending, addChatMessage]);

  const handleAiControlShowOnly = useCallback(() => {
    if (!aiControlPending) return;

    aiControlService.cancelPendingCommands();
    addChatMessage({
      role: 'model',
      text: 'No problem! The control is highlighted on the left panel. You can adjust it manually.',
      timestamp: new Date(),
    });
    setAiControlPending(null);
  }, [aiControlPending, addChatMessage]);

  // Generate video plan
  const generateVideoPlan = useCallback(
    async (
      audioFile: File,
      userLyrics: string,
      creativeVision: string
    ): Promise<VideoPlan | null> => {
      setIsGeneratingPlan(true);
      setIsDetectingGenre(true);

      try {
        const plan = await aiOrchestrator.generateFullVideoPlan(
          audioFile,
          userLyrics,
          creativeVision,
          aspectRatio,
          (status) => {
            onStatusUpdate?.(status);
            addChatMessage({ role: 'model', text: status, timestamp: new Date() });
          }
        );

        setVideoPlan(plan);
        setShowPlanPanel(true);
        onGenreDetected?.(plan.analysis.consensusGenre);

        addChatMessage({
          role: 'model',
          text: `Video plan created! Genre: ${plan.analysis.consensusGenre} (${Math.round(plan.analysis.confidence * 100)}% confidence). Found ${plan.emotionalPeaks.length} emotional peaks.`,
          timestamp: new Date(),
        });

        return plan;
      } catch (err) {
        toast.error('Plan Generation Failed', 'Falling back to genre detection');

        // Fallback to genre detection
        try {
          const result = await detectMusicGenre(audioFile);
          onGenreDetected?.(result.genre);
          addChatMessage({
            role: 'model',
            text: `Genre detected: ${result.genre} (${Math.round(result.confidence * 100)}% confidence). Video plan generation failed.`,
            timestamp: new Date(),
          });
        } catch {
          toast.warning('Genre Detection Failed', 'Proceed with manual settings');
        }

        return null;
      } finally {
        setIsGeneratingPlan(false);
        setIsDetectingGenre(false);
      }
    },
    [
      aspectRatio,
      onStatusUpdate,
      onGenreDetected,
      addChatMessage,
      setVideoPlan,
      setShowPlanPanel,
      setIsGeneratingPlan,
    ]
  );

  // Regenerate plan
  const handleRegeneratePlan = useCallback(
    async (audioFile: File, userLyrics: string, creativeVision: string) => {
      setIsGeneratingPlan(true);

      try {
        const plan = await planRequest.execute(async (signal) => {
          return aiOrchestrator.generateFullVideoPlan(
            audioFile,
            userLyrics,
            creativeVision,
            aspectRatio,
            (status) => {
              addChatMessage({ role: 'model', text: status, timestamp: new Date() });
            },
            signal
          );
        });

        if (plan) {
          if (videoPlan) {
            pushVideoPlanToHistory();
          }
          setVideoPlan(plan);
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Plan Regeneration Failed', 'Could not regenerate video plan');
        }
      } finally {
        setIsGeneratingPlan(false);
      }
    },
    [
      aspectRatio,
      videoPlan,
      planRequest,
      addChatMessage,
      setVideoPlan,
      pushVideoPlanToHistory,
      setIsGeneratingPlan,
    ]
  );

  // Apply plan
  const handleApplyPlan = useCallback(
    (onApply: (plan: VideoPlan) => void) => {
      if (!videoPlan) return;

      onApply(videoPlan);
      setVideoPlan({ ...videoPlan, status: 'applied' });

      addChatMessage({
        role: 'model',
        text: 'Video plan applied! Your settings have been updated.',
        timestamp: new Date(),
      });
    },
    [videoPlan, setVideoPlan, addChatMessage]
  );

  // Modify plan via chat
  const handleModifyPlanViaChat = useCallback(
    async (instruction: string) => {
      if (!videoPlan) return;

      try {
        const modifiedPlan = await planModifyRequest.execute(async (signal) => {
          return modifyVideoPlan(videoPlan, instruction, signal);
        });

        if (modifiedPlan) {
          pushVideoPlanToHistory();
          setVideoPlan(modifiedPlan);
          addChatMessage({
            role: 'model',
            text: `Plan updated: ${modifiedPlan.summary}`,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Plan Modification Failed', 'Please try again');
        }
      }
    },
    [videoPlan, planModifyRequest, pushVideoPlanToHistory, setVideoPlan, addChatMessage]
  );

  // Edit handlers
  const handleMoodEdit = useCallback(
    (mood: VideoPlanMood) => {
      if (!videoPlan) return;
      pushVideoPlanToHistory();
      setVideoPlan({ ...videoPlan, mood, version: videoPlan.version + 1 });
    },
    [videoPlan, pushVideoPlanToHistory, setVideoPlan]
  );

  const handlePaletteEdit = useCallback(
    (colorPalette: VideoPlanColorPalette) => {
      if (!videoPlan) return;
      pushVideoPlanToHistory();
      setVideoPlan({ ...videoPlan, colorPalette, version: videoPlan.version + 1 });
    },
    [videoPlan, pushVideoPlanToHistory, setVideoPlan]
  );

  const handleStyleEdit = useCallback(
    (visualStyle: VideoPlanVisualStyle) => {
      if (!videoPlan) return;
      pushVideoPlanToHistory();
      setVideoPlan({ ...videoPlan, visualStyle, version: videoPlan.version + 1 });
    },
    [videoPlan, pushVideoPlanToHistory, setVideoPlan]
  );

  // Regenerate peak visual
  const handleRegeneratePeakVisual = useCallback(
    async (peak: EmotionalPeak, lyrics: LyricLine[]) => {
      if (!videoPlan) return;

      setRegeneratingPeakId(peak.id);

      try {
        const newVisual = await peakVisualRequest.execute(async (signal) => {
          return aiOrchestrator.regeneratePeakVisual(peak, lyrics, videoPlan, aspectRatio, signal);
        });

        if (newVisual && videoPlan) {
          const existingIndex = videoPlan.hybridVisuals.peakVisuals.findIndex(
            (v) => v.peakId === peak.id
          );
          const newPeakVisuals = [...videoPlan.hybridVisuals.peakVisuals];

          if (existingIndex >= 0) {
            newPeakVisuals[existingIndex] = newVisual;
          } else {
            newPeakVisuals.push(newVisual);
          }

          setVideoPlan({
            ...videoPlan,
            hybridVisuals: { ...videoPlan.hybridVisuals, peakVisuals: newPeakVisuals },
          });
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Visual Generation Failed', 'Could not generate peak visual');
        }
      } finally {
        setRegeneratingPeakId(null);
      }
    },
    [videoPlan, aspectRatio, peakVisualRequest, setRegeneratingPeakId, setVideoPlan]
  );

  // Background toggle (video ↔ image)
  const handleBackgroundToggle = useCallback(
    async (lyrics: LyricLine[]) => {
      if (!videoPlan) return;

      const newUseVideo = !videoPlan.backgroundStrategy.useVideo;
      setIsRegeneratingBackground(true);

      try {
        const newStrategy = {
          ...videoPlan.backgroundStrategy,
          useVideo: newUseVideo,
          reasoning: newUseVideo
            ? 'User switched to motion video background'
            : 'User switched to static image background',
        };

        const newBackground = await backgroundRequest.execute(async (signal) => {
          if (newUseVideo && videoPlan.backgroundStrategy.videoPrompt) {
            const videoUrl = await generateVideoBackground(
              videoPlan.backgroundStrategy.videoPrompt,
              aspectRatio === '9:16' ? '9:16' : '16:9',
              '1080p',
              undefined,
              signal
            );
            return {
              type: 'video' as const,
              url: videoUrl,
              prompt: videoPlan.backgroundStrategy.videoPrompt,
            };
          } else if (!newUseVideo && videoPlan.backgroundStrategy.imagePrompt) {
            const imageUrl = await generateBackground(
              videoPlan.backgroundStrategy.imagePrompt,
              aspectRatio,
              '2K',
              signal
            );
            return {
              type: 'image' as const,
              url: imageUrl,
              prompt: videoPlan.backgroundStrategy.imagePrompt,
            };
          }
          return null;
        });

        if (newBackground && videoPlan) {
          setVideoPlan({
            ...videoPlan,
            backgroundStrategy: newStrategy,
            hybridVisuals: { ...videoPlan.hybridVisuals, sharedBackground: newBackground },
          });
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Background Toggle Failed', 'Could not generate new background');
        }
      } finally {
        setIsRegeneratingBackground(false);
      }
    },
    [videoPlan, aspectRatio, backgroundRequest, setIsRegeneratingBackground, setVideoPlan]
  );

  // Background regenerate
  const handleBackgroundRegenerate = useCallback(async () => {
    if (!videoPlan) return;

    setIsRegeneratingBackground(true);

    try {
      const newBackground = await backgroundRequest.execute(async (signal) => {
        if (videoPlan.backgroundStrategy.useVideo && videoPlan.backgroundStrategy.videoPrompt) {
          const videoUrl = await generateVideoBackground(
            videoPlan.backgroundStrategy.videoPrompt,
            aspectRatio === '9:16' ? '9:16' : '16:9',
            '1080p',
            undefined,
            signal
          );
          return {
            type: 'video' as const,
            url: videoUrl,
            prompt: videoPlan.backgroundStrategy.videoPrompt,
          };
        } else if (videoPlan.backgroundStrategy.imagePrompt) {
          const imageUrl = await generateBackground(
            videoPlan.backgroundStrategy.imagePrompt,
            aspectRatio,
            '2K',
            signal
          );
          return {
            type: 'image' as const,
            url: imageUrl,
            prompt: videoPlan.backgroundStrategy.imagePrompt,
          };
        }
        return null;
      });

      if (newBackground && videoPlan) {
        setVideoPlan({
          ...videoPlan,
          hybridVisuals: { ...videoPlan.hybridVisuals, sharedBackground: newBackground },
        });
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Background Regeneration Failed', 'Please try again');
      }
    } finally {
      setIsRegeneratingBackground(false);
    }
  }, [videoPlan, aspectRatio, backgroundRequest, setIsRegeneratingBackground, setVideoPlan]);

  // Generate background image
  const generateBackgroundImage = useCallback(
    async (
      prompt: string,
      targetSize: ImageSize
    ): Promise<{ type: 'image'; url: string; prompt: string } | null> => {
      try {
        const url = await generateBackground(prompt, aspectRatio, targetSize);
        const result = { type: 'image' as const, url, prompt };
        onBackgroundGenerated?.(result);
        return result;
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Image Generation Failed', 'Please try again');
        }
        return null;
      }
    },
    [aspectRatio, onBackgroundGenerated]
  );

  // Generate background video
  const generateBackgroundVideo = useCallback(
    async (
      prompt: string,
      videoAspectRatio: '16:9' | '9:16'
    ): Promise<{ type: 'video'; url: string; prompt: string } | null> => {
      try {
        const url = await generateVideoBackground(prompt, videoAspectRatio, '1080p', undefined);
        const result = { type: 'video' as const, url, prompt };
        onBackgroundGenerated?.(result);
        return result;
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Video Generation Failed', 'Please try again');
        }
        return null;
      }
    },
    [onBackgroundGenerated]
  );

  // Lyrics sync
  const handleLyricSync = useCallback(
    async (
      audioFile: File,
      precision: TimingPrecision,
      userLyrics?: string
    ): Promise<{ lyrics: LyricLine[]; metadata: unknown; confidence: number } | null> => {
      setIsSyncing(true);
      setSyncProgress(0);

      try {
        const result = await syncRequest.execute(async (signal) => {
          return syncLyricsWithPrecision(
            audioFile,
            {
              precision,
              userLyrics,
            },
            (progress) => {
              setSyncProgress(progress);
            },
            signal
          );
        });

        if (result) {
          addChatMessage({
            role: 'model',
            text: `Lyrics synced with ${precision}-level precision! Confidence: ${Math.round(result.overallConfidence * 100)}%.`,
            timestamp: new Date(),
          });

          return {
            lyrics: result.lyrics,
            metadata: result.metadata,
            confidence: result.overallConfidence,
          };
        }

        return null;
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Sync Failed', 'Could not sync lyrics with audio');
        }
        return null;
      } finally {
        setIsSyncing(false);
        setSyncProgress(0);
      }
    },
    [syncRequest, addChatMessage]
  );

  // Genre detection
  const detectGenre = useCallback(
    async (audioFile: File): Promise<{ genre: string; confidence: number } | null> => {
      setIsDetectingGenre(true);

      try {
        const result = await detectMusicGenre(audioFile);
        onGenreDetected?.(result.genre);
        return result;
      } catch (err) {
        toast.error('Genre Detection Failed', 'Could not detect genre');
        return null;
      } finally {
        setIsDetectingGenre(false);
      }
    },
    [onGenreDetected]
  );

  return {
    // Chat state
    chatMessages,
    chatInput,
    setChatInput,
    addChatMessage,

    // AI Control state
    aiControlPending,

    // Loading states
    isProcessing,
    isGeneratingPlan,
    isDetectingGenre,
    isRegeneratingBackground,
    regeneratingPeakId,
    isSyncing,
    syncProgress,

    // Chat actions
    handleChatSubmit,
    handleAiControlApply,
    handleAiControlShowOnly,

    // Video Plan actions
    videoPlan,
    showPlanPanel,
    setShowPlanPanel,
    generateVideoPlan,
    handleRegeneratePlan,
    handleApplyPlan,
    handleModifyPlanViaChat,
    handleMoodEdit,
    handlePaletteEdit,
    handleStyleEdit,
    handleRegeneratePeakVisual,
    handleBackgroundToggle,
    handleBackgroundRegenerate,

    // Background generation
    generateBackgroundImage,
    generateBackgroundVideo,

    // Lyrics sync
    handleLyricSync,

    // Genre detection
    detectGenre,
  };
}
