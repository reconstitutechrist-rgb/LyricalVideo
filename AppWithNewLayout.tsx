/**
 * AppWithNewLayout - A modern, cleaner layout for Lyrical Flow
 *
 * This component wraps the existing App functionality with a new UI design:
 * - Slim icon sidebar instead of wide control panel
 * - Slide-out panels for settings
 * - Draggable chat window
 * - Bottom timeline panel
 *
 * All business logic and functionality is preserved from the original App.tsx
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAbortableRequest, isAbortError } from './src/hooks/useAbortableRequest';
import { useAutoSave } from './src/hooks/useAutoSave';
import {
  useAudioStore,
  useLyricsStore,
  useVisualSettingsStore,
  useExportStore,
  useChatStore,
  useVideoPlanStore,
  toast,
} from './src/stores';
import {
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  PhotoIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  FilmIcon,
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  XMarkIcon,
  EyeDropperIcon,
  LanguageIcon,
  SpeakerWaveIcon,
  BoltIcon,
  PlusCircleIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CursorArrowRaysIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  BackwardIcon,
} from '@heroicons/react/24/solid';
import Visualizer from './components/Visualizer';
import Waveform from './components/Waveform';
import { decodeAudio } from './utils/audio';
import { formatTime } from './src/utils/time';
import {
  analyzeAudioAndGetLyrics,
  sendChatMessage,
  generateBackground,
  generateVideoBackground,
  transcribeMicrophone,
  analyzeImage,
  detectMusicGenre,
  modifyVideoPlan,
  syncLyricsWithPrecision,
} from './services/geminiService';
import * as aiOrchestrator from './services/aiOrchestrator';
import { aiControlService, AIControlCommand } from './src/systems/aiControl';
import './src/styles/aiControl.css';
import { initializeEffects } from './src/effects';
import { EffectPanel } from './src/components/EffectPanel';
import { VideoPlanPanel } from './src/components/VideoPlanPanel';
import { ExportSettingsPanel } from './src/components/ExportSettingsPanel';
import { Timeline } from './src/components/Timeline';
import { SyncPanel } from './src/components/SyncPanel';
import { WaveformEditor } from './src/components/WaveformEditor';
import { SlideOutPanel, DraggableChat } from './src/components/layout';
import {
  AppState,
  LyricLine,
  VisualStyle,
  ChatMessage,
  AspectRatio,
  ImageSize,
  ColorPalette,
  TextAnimationStyle,
  BlendMode,
  FontFamily,
  FrequencyBand,
  TextKeyframe,
  EasingType,
  MotionPreset,
  ExportSettings,
  ExportProgress,
  DEFAULT_EXPORT_SETTINGS,
  TimingPrecision,
} from './types';
import type {
  VideoPlan,
  VideoPlanMood,
  VideoPlanColorPalette,
  VideoPlanVisualStyle,
  EmotionalPeak,
} from './types';

const fonts: FontFamily[] = ['Space Grotesk', 'Inter', 'Roboto', 'Montserrat', 'Cinzel'];
const freqBands: FrequencyBand[] = ['bass', 'mid', 'treble', 'avg'];
const blendModes: BlendMode[] = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];
const easings: EasingType[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce'];

const MOTION_PRESETS: MotionPreset[] = [
  {
    label: 'Cinematic Rise',
    keyframes: [
      { time: 0, x: 0, y: 50, scale: 0.9, rotation: 0, opacity: 0, easing: 'easeOut' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.8, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: -50, scale: 1.1, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Elastic Bounce',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 0, rotation: 0, opacity: 0, easing: 'bounce' },
      { time: 0.3, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: 0, scale: 0, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Neon Flicker',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 1, rotation: 0, opacity: 0, easing: 'linear' },
      { time: 0.1, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.2, easing: 'linear' },
      { time: 0.3, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1.05, rotation: 0, opacity: 1, easing: 'easeOut' },
      { time: 1, x: 0, y: 0, scale: 1.1, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Spiral In',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 0, rotation: -180, opacity: 0, easing: 'easeOut' },
      { time: 0.4, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: 0, scale: 1.5, rotation: 45, opacity: 0 },
    ],
  },
  {
    label: 'Slow Drift',
    keyframes: [
      { time: 0, x: -30, y: 0, scale: 1, rotation: 0, opacity: 0, easing: 'easeOut' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.8, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 30, y: 0, scale: 1, rotation: 0, opacity: 0 },
    ],
  },
];

interface GenerateBackgroundArgs {
  prompt: string;
  aspectRatio?: AspectRatio;
  resolution?: ImageSize;
}

const AppWithNewLayout = () => {
  // === STATE ===
  const [state, setState] = useState<AppState>({
    audioFile: null,
    audioUrl: null,
    lyrics: [],
    userProvidedLyrics: '',
    userCreativeVision: '',
    metadata: null,
    currentStyle: VisualStyle.NEON_PULSE,
    backgroundAsset: null,
    currentTime: 0,
    isPlaying: false,
    isRecording: false,
    aspectRatio: '16:9',
    visualSettings: {
      particleSpeed: 1.0,
      speedX: 1.0,
      speedY: 1.0,
      intensity: 1.0,
      palette: 'neon',
      colorPalette: 'neon',
      dynamicBackgroundOpacity: false,
      dynamicBackgroundPulse: false,
      textAnimation: 'KINETIC',
      backgroundBlendMode: 'source-over',
      blendMode: 'source-over',
      fontFamily: 'Space Grotesk',
      textStagger: 0.05,
      textRevealDuration: 0.5,
      kineticRotationRange: 0.5,
      kineticOffsetRange: 30,
      glitchFrequency: 0.5,
      trailsEnabled: true,
      particleTrails: true,
      cameraShake: true,
      cameraShakeIntensity: 1.5,
      shakeIntensity: 1.5,
      reactivityIntensity: 1.0,
      lyricsOnlyMode: false,
      fontSizeScale: 1.0,
      frequencyMapping: { pulse: 'bass', motion: 'mid', color: 'treble' },
    },
    audioBuffer: null,
    lyricEffects: [],
    backgroundEffects: [],
    detectedGenre: null,
    genreOverride: null,
    syncPrecision: 'word' as TimingPrecision,
    isSyncing: false,
    syncProgress: 0,
    lastSyncConfidence: null,
  });

  // Genre detection status
  const [isDetectingGenre, setIsDetectingGenre] = useState(false);

  // ============================================================================
  // Video Plan Store (Zustand)
  // ============================================================================
  const videoPlanStore = useVideoPlanStore();
  const {
    videoPlan,
    showPlanPanel,
    isGeneratingPlan,
    regeneratingPeakId,
    isRegeneratingBackground,
    setVideoPlan: setVideoPlanDirect,
    setShowPlanPanel,
    setIsGeneratingPlan,
    setRegeneratingPeakId,
    setIsRegeneratingBackground,
    pushToHistory: pushVideoPlanToHistory,
  } = videoPlanStore;

  const setVideoPlan = useCallback(
    (updater: VideoPlan | null | ((prev: VideoPlan | null) => VideoPlan | null)) => {
      if (typeof updater === 'function') {
        const newPlan = updater(videoPlanStore.videoPlan);
        setVideoPlanDirect(newPlan);
      } else {
        setVideoPlanDirect(updater);
      }
    },
    [videoPlanStore.videoPlan, setVideoPlanDirect]
  );

  // ============================================================================
  // Peak Visual Time-Switching
  // ============================================================================
  const currentBackgroundAsset = useMemo(() => {
    if (!videoPlan?.hybridVisuals) {
      return state.backgroundAsset;
    }

    const { sharedBackground, peakVisuals } = videoPlan.hybridVisuals;
    const currentTime = state.currentTime;

    if (videoPlan.emotionalPeaks && peakVisuals.length > 0) {
      for (const peak of videoPlan.emotionalPeaks) {
        if (currentTime >= peak.startTime && currentTime <= peak.endTime) {
          const peakVisual = peakVisuals.find((v) => v.peakId === peak.id);
          if (peakVisual?.asset) {
            return peakVisual.asset;
          }
        }
      }
    }

    return sharedBackground || state.backgroundAsset;
  }, [videoPlan, state.currentTime, state.backgroundAsset]);

  // ============================================================================
  // Chat Store (Zustand)
  // ============================================================================
  const chatStore = useChatStore();
  const {
    messages: chatMessages,
    chatInput,
    setChatInput,
    setMessages: setMessagesStore,
  } = chatStore;

  // Legacy-compatible setChatMessages wrapper for gradual migration
  const setChatMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      if (typeof updater === 'function') {
        const newMessages = updater(chatMessages);
        setMessagesStore(newMessages);
      } else {
        setMessagesStore(updater);
      }
    },
    [chatMessages, setMessagesStore]
  );

  // AI Control State
  const [aiControlPending, setAiControlPending] = useState<{
    message: string;
    commands: AIControlCommand[];
    controlNames: string[];
  } | null>(null);

  // Layout state
  const [activePanel, setActivePanel] = useState<
    'source' | 'styles' | 'effects' | 'advanced' | null
  >(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedLyricIndices, setSelectedLyricIndices] = useState<Set<number>>(new Set());
  const [activeKeyframeIndex, setActiveKeyframeIndex] = useState<number | null>(null);
  const [showGenModal, setShowGenModal] = useState<'image' | 'video' | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [targetSize, setTargetSize] = useState<ImageSize>('2K');
  const [genAspectRatio, setGenAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [showWaveformEditor, setShowWaveformEditor] = useState(false);
  const [selectedWaveformLyricIndex, setSelectedWaveformLyricIndex] = useState<number | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [bulkTimeShift, setBulkTimeShift] = useState<string>('0.1');
  const [audioDuration, setAudioDuration] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);
  const exportProgressIntervalRef = useRef<number | null>(null);
  const audioEndedHandlerRef = useRef<(() => void) | null>(null);

  // ============================================================================
  // Audio Store (Zustand)
  // ============================================================================
  const audioStore = useAudioStore();

  useEffect(() => {
    if (state.isPlaying !== audioStore.isPlaying) {
      setState((prev) => ({ ...prev, isPlaying: audioStore.isPlaying }));
    }
  }, [audioStore.isPlaying, state.isPlaying]);

  useEffect(() => {
    if (Math.abs(state.currentTime - audioStore.currentTime) > 0.1) {
      setState((prev) => ({ ...prev, currentTime: audioStore.currentTime }));
    }
  }, [audioStore.currentTime, state.currentTime]);

  useEffect(() => {
    if (state.audioFile !== audioStore.audioFile) {
      audioStore.setAudioFile(state.audioFile);
    }
    if (state.audioBuffer !== audioStore.audioBuffer) {
      audioStore.setAudioBuffer(state.audioBuffer);
    }
  }, [state.audioFile, state.audioBuffer, audioStore]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (audioStore.isPlaying) {
      audio.play().catch(() => {
        audioStore.setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [audioStore.isPlaying, audioStore]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      audioStore.setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioStore]);

  // ============================================================================
  // Lyrics Store (Zustand)
  // ============================================================================
  const lyricsStore = useLyricsStore();

  const stateLyricsRef = useRef(state.lyrics);
  useEffect(() => {
    const stateLyrics = state.lyrics;
    const storeLyrics = lyricsStore.lyrics;

    if (stateLyrics === storeLyrics) return;
    if (stateLyrics.length === 0 && storeLyrics.length === 0) return;

    if (stateLyrics !== stateLyricsRef.current && stateLyrics.length > 0) {
      stateLyricsRef.current = stateLyrics;
      lyricsStore.setLyrics(stateLyrics);
    }
  }, [state.lyrics, lyricsStore]);

  const storeLyricsRef = useRef(lyricsStore.lyrics);
  useEffect(() => {
    const stateLyrics = state.lyrics;
    const storeLyrics = lyricsStore.lyrics;

    if (storeLyrics === stateLyrics) return;
    if (storeLyrics.length === 0 && stateLyrics.length === 0) return;

    if (storeLyrics !== storeLyricsRef.current && storeLyrics.length > 0) {
      storeLyricsRef.current = storeLyrics;
      setState((prev) => ({ ...prev, lyrics: storeLyrics }));
    }
  }, [lyricsStore.lyrics, state.lyrics]);

  useEffect(() => {
    if (state.userProvidedLyrics !== lyricsStore.userProvidedLyrics) {
      lyricsStore.setUserProvidedLyrics(state.userProvidedLyrics);
    }
  }, [state.userProvidedLyrics, lyricsStore]);

  useEffect(() => {
    if (state.syncPrecision !== lyricsStore.syncPrecision) {
      lyricsStore.setSyncPrecision(state.syncPrecision);
    }
    if (state.isSyncing !== lyricsStore.isSyncing) {
      lyricsStore.setSyncing(state.isSyncing, state.syncProgress);
    }
    if (state.lastSyncConfidence !== lyricsStore.lastSyncConfidence) {
      lyricsStore.setSyncConfidence(state.lastSyncConfidence);
    }
  }, [
    state.syncPrecision,
    state.isSyncing,
    state.syncProgress,
    state.lastSyncConfidence,
    lyricsStore,
  ]);

  // ============================================================================
  // Visual Settings Store (Zustand)
  // ============================================================================
  const visualSettingsStore = useVisualSettingsStore();

  useEffect(() => {
    if (state.currentStyle !== visualSettingsStore.currentStyle) {
      visualSettingsStore.setCurrentStyle(state.currentStyle);
    }
    if (state.aspectRatio !== visualSettingsStore.aspectRatio) {
      visualSettingsStore.setAspectRatio(state.aspectRatio);
    }
  }, [state.currentStyle, state.aspectRatio, visualSettingsStore]);

  useEffect(() => {
    if (
      JSON.stringify(state.visualSettings) !== JSON.stringify(visualSettingsStore.visualSettings)
    ) {
      visualSettingsStore.setVisualSettings(state.visualSettings);
    }
  }, [state.visualSettings, visualSettingsStore]);

  useEffect(() => {
    if (state.backgroundAsset !== visualSettingsStore.backgroundAsset) {
      visualSettingsStore.setBackgroundAsset(state.backgroundAsset);
    }
  }, [state.backgroundAsset, visualSettingsStore]);

  const stateLyricEffectsRef = useRef(state.lyricEffects);
  useEffect(() => {
    if (state.lyricEffects !== stateLyricEffectsRef.current) {
      stateLyricEffectsRef.current = state.lyricEffects;
      visualSettingsStore.setLyricEffects(state.lyricEffects);
    }
  }, [state.lyricEffects, visualSettingsStore]);

  const stateBgEffectsRef = useRef(state.backgroundEffects);
  useEffect(() => {
    if (state.backgroundEffects !== stateBgEffectsRef.current) {
      stateBgEffectsRef.current = state.backgroundEffects;
      visualSettingsStore.setBackgroundEffects(state.backgroundEffects);
    }
  }, [state.backgroundEffects, visualSettingsStore]);

  useEffect(() => {
    if (state.detectedGenre !== visualSettingsStore.detectedGenre) {
      visualSettingsStore.setDetectedGenre(state.detectedGenre);
    }
    if (state.genreOverride !== visualSettingsStore.genreOverride) {
      visualSettingsStore.setGenreOverride(state.genreOverride);
    }
  }, [state.detectedGenre, state.genreOverride, visualSettingsStore]);

  // ============================================================================
  // Export Store (Zustand)
  // ============================================================================
  const exportStore = useExportStore();

  useEffect(() => {
    if (JSON.stringify(exportSettings) !== JSON.stringify(exportStore.settings)) {
      exportStore.setSettings(exportSettings);
    }
  }, [exportSettings, exportStore]);

  useEffect(() => {
    if (JSON.stringify(exportProgress) !== JSON.stringify(exportStore.progress)) {
      exportStore.setProgress(exportProgress);
    }
  }, [exportProgress, exportStore]);

  useEffect(() => {
    if (state.isRecording !== exportStore.isRecording) {
      exportStore.setIsRecording(state.isRecording);
    }
  }, [state.isRecording, exportStore]);

  useEffect(() => {
    if (showExportSettings !== exportStore.showExportSettings) {
      exportStore.setShowExportSettings(showExportSettings);
    }
  }, [showExportSettings, exportStore]);

  // Initialize effects system on mount
  useEffect(() => {
    initializeEffects();
  }, []);

  // ============================================================================
  // Auto-Save System
  // ============================================================================
  const { restore: restoreProject, clear: clearAutoSave } = useAutoSave({
    debounceMs: 2000,
    enabled: true,
    onSave: () => {},
    onRestore: (data) => {
      setState((prev) => ({
        ...prev,
        lyrics: data.lyrics,
        userProvidedLyrics: data.userProvidedLyrics,
        currentStyle: data.currentStyle,
        aspectRatio: data.aspectRatio,
        visualSettings: data.visualSettings,
      }));
      toast.success('Session Restored', 'Your previous work has been restored');
      setShowRestorePrompt(false);
    },
  });

  useEffect(() => {
    const checkAutoSave = async () => {
      try {
        const { loadProject } = await import('./src/hooks/useAutoSave');
        const data = await loadProject('autosave');
        if (data && data.lyrics && data.lyrics.length > 0) {
          setShowRestorePrompt(true);
        }
      } catch (_err) {
        // Silently ignore - no previous session to restore
      }
    };
    checkAutoSave();
  }, []);

  const handleRestoreSession = useCallback(async () => {
    await restoreProject();
  }, [restoreProject]);

  const handleDismissRestore = useCallback(async () => {
    setShowRestorePrompt(false);
    await clearAutoSave();
  }, [clearAutoSave]);

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (audioStore.audioFile && !state.isRecording) {
            audioStore.togglePlay();
          }
          break;

        case 'ArrowLeft':
          if (e.shiftKey && audioElementRef.current) {
            e.preventDefault();
            const newTime = Math.max(0, audioElementRef.current.currentTime - 5);
            audioElementRef.current.currentTime = newTime;
            audioStore.setCurrentTime(newTime);
          }
          break;

        case 'ArrowRight':
          if (e.shiftKey && audioElementRef.current) {
            e.preventDefault();
            const duration = audioElementRef.current.duration || 0;
            const newTime = Math.min(duration, audioElementRef.current.currentTime + 5);
            audioElementRef.current.currentTime = newTime;
            audioStore.setCurrentTime(newTime);
          }
          break;

        case 'KeyM':
          if (audioElementRef.current) {
            e.preventDefault();
            audioElementRef.current.muted = !audioElementRef.current.muted;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioStore, state.isRecording]);

  // ============================================================================
  // AI Request Hooks
  // ============================================================================
  const planRequest = useAbortableRequest<VideoPlan>({
    throttleMs: 2000,
    requestType: 'PLAN_GENERATION',
    onThrottled: (_waitMs, msg) => {
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
    },
  });
  const planModifyRequest = useAbortableRequest<VideoPlan>({
    throttleMs: 2000,
    requestType: 'PLAN_GENERATION',
    onThrottled: (_waitMs, msg) => {
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
    },
  });
  const chatRequest = useAbortableRequest<{
    text: string;
    functionCalls: Array<{ name?: string; args?: Record<string, unknown> }>;
  }>({
    throttleMs: 1000,
    requestType: 'CHAT',
    onThrottled: (_waitMs, msg) => {
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
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
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
    },
  });
  const syncRequest = useAbortableRequest<{
    lyrics: LyricLine[];
    metadata: typeof state.metadata;
    overallConfidence: number;
    processingTimeMs?: number;
  }>({
    throttleMs: 2000,
    requestType: 'SYNC',
    onThrottled: (_waitMs, msg) => {
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
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
      setChatMessages((prev) => [...prev, { role: 'model', text: msg, timestamp: new Date() }]);
    },
  });

  // ============================================================================
  // File Upload Handler
  // ============================================================================
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setIsProcessing(true);

      try {
        const buffer = await decodeAudio(file);

        const { lyrics, metadata } = await analyzeAudioAndGetLyrics(file, state.userProvidedLyrics);
        setState((prev) => ({
          ...prev,
          audioFile: file,
          audioUrl: url,
          lyrics,
          metadata,
          audioBuffer: buffer,
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Analyzed "${metadata.title}" (${metadata.genre}). Lyrics aligned and ready!`,
            timestamp: new Date(),
          },
        ]);

        // Generate full video plan
        setIsGeneratingPlan(true);
        setIsDetectingGenre(true);

        aiOrchestrator
          .generateFullVideoPlan(
            file,
            state.userProvidedLyrics,
            state.userCreativeVision,
            state.aspectRatio,
            (status) => {
              setChatMessages((prev) => [
                ...prev,
                { role: 'model', text: status, timestamp: new Date() },
              ]);
            }
          )
          .then((plan) => {
            setVideoPlan(plan);
            setShowPlanPanel(true);
            setState((prev) => ({
              ...prev,
              detectedGenre: plan.analysis.consensusGenre,
            }));
            setChatMessages((prev) => [
              ...prev,
              {
                role: 'model',
                text: `Video plan created! Genre: ${plan.analysis.consensusGenre} (${Math.round(plan.analysis.confidence * 100)}% confidence). Found ${plan.emotionalPeaks.length} emotional peaks.`,
                timestamp: new Date(),
              },
            ]);
          })
          .catch((_err) => {
            toast.error('Plan Generation Failed', 'Falling back to genre detection');
            detectMusicGenre(file)
              .then((result) => {
                setState((prev) => ({
                  ...prev,
                  detectedGenre: result.genre,
                }));
                setChatMessages((prev) => [
                  ...prev,
                  {
                    role: 'model',
                    text: `Genre detected: ${result.genre} (${Math.round(result.confidence * 100)}% confidence).`,
                    timestamp: new Date(),
                  },
                ]);
              })
              .catch((_genreErr) => {
                toast.warning(
                  'Genre Detection Failed',
                  'You can still proceed with manual settings'
                );
              });
          })
          .finally(() => {
            setIsGeneratingPlan(false);
            setIsDetectingGenre(false);
          });
      } catch (_err) {
        toast.error('Audio Analysis Failed', 'Please try again');
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'Error analyzing audio. Please try again.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    },
    [
      state.userProvidedLyrics,
      state.userCreativeVision,
      state.aspectRatio,
      setVideoPlan,
      setShowPlanPanel,
      setIsGeneratingPlan,
    ]
  );

  const togglePlay = useCallback(() => {
    audioStore.togglePlay();
  }, [audioStore]);

  // ============================================================================
  // Export System
  // ============================================================================
  useEffect(() => {
    return () => {
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }
      if (audioEndedHandlerRef.current && audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
        audioEndedHandlerRef.current = null;
      }
    };
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startExport = useCallback(() => {
    if (!canvasRef.current || !mediaStreamDestRef.current || !audioElementRef.current) return;

    if (exportProgressIntervalRef.current) {
      clearInterval(exportProgressIntervalRef.current);
      exportProgressIntervalRef.current = null;
    }
    if (audioEndedHandlerRef.current && audioElementRef.current) {
      audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
      audioEndedHandlerRef.current = null;
    }

    const audio = audioElementRef.current;
    const duration = audio.duration;

    if (!duration || duration === 0) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Cannot export: No audio loaded or audio has no duration.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const canvasStream = canvasRef.current.captureStream(exportSettings.framerate);
    const audioStream = mediaStreamDestRef.current.stream;

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    recordedChunksRef.current = [];

    setExportProgress({ stage: 'recording', percent: 0, message: 'Exporting video...' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }

      const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

      if (exportSettings.format === 'mp4') {
        setExportProgress({ stage: 'converting', percent: 0, message: 'Loading FFmpeg...' });
        try {
          const { convertWebMToMP4 } = await import('./services/ffmpegService');
          setExportProgress({ stage: 'converting', percent: 5, message: 'Converting to MP4...' });
          const mp4Blob = await convertWebMToMP4(webmBlob, {
            quality: exportSettings.quality,
            framerate: exportSettings.framerate,
            onProgress: (percent) => {
              const scaledPercent = 5 + Math.round(percent * 0.9);
              setExportProgress({
                stage: 'converting',
                percent: scaledPercent,
                message: 'Converting to MP4...',
              });
            },
          });
          setExportProgress({ stage: 'complete', percent: 100, message: 'Download starting...' });
          downloadBlob(mp4Blob, `lyrical-flow-${Date.now()}.mp4`);
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: `Exported ${exportSettings.resolution} MP4 at ${exportSettings.framerate}fps (${exportSettings.quality} quality)`,
              timestamp: new Date(),
            },
          ]);
        } catch (_error) {
          toast.warning('MP4 Conversion Failed', 'Downloading as WebM instead');
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: 'MP4 conversion failed. Downloading as WebM instead.',
              timestamp: new Date(),
            },
          ]);
          downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
        }
      } else {
        downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Exported ${exportSettings.resolution} WebM at ${exportSettings.framerate}fps`,
            timestamp: new Date(),
          },
        ]);
      }

      setExportProgress(null);
    };

    const handleAudioEnded = () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audioEndedHandlerRef.current = null;
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setState((prev) => ({ ...prev, isRecording: false, isPlaying: false }));
      }, 100);
    };

    audioEndedHandlerRef.current = handleAudioEnded;
    audio.addEventListener('ended', handleAudioEnded);

    mediaRecorderRef.current = recorder;
    recorder.start();

    audio.currentTime = 0;
    audio.play();

    setState((prev) => ({ ...prev, isRecording: true, isPlaying: true }));
    setShowExportSettings(false);

    exportProgressIntervalRef.current = window.setInterval(() => {
      if (audioElementRef.current) {
        const currentTime = audioElementRef.current.currentTime;
        const percent = Math.round((currentTime / duration) * 100);
        setExportProgress({
          stage: 'recording',
          percent,
          message: `Exporting... ${formatTime(currentTime)} / ${formatTime(duration)}`,
        });
      }
    }, 250);
  }, [exportSettings]);

  const cancelExport = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioElementRef.current) {
      if (audioEndedHandlerRef.current) {
        audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
        audioEndedHandlerRef.current = null;
      }
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }

    if (exportProgressIntervalRef.current) {
      clearInterval(exportProgressIntervalRef.current);
      exportProgressIntervalRef.current = null;
    }

    setState((prev) => ({ ...prev, isRecording: false, isPlaying: false }));
    setExportProgress(null);

    setChatMessages((prev) => [
      ...prev,
      { role: 'model', text: 'Export cancelled.', timestamp: new Date() },
    ]);
  }, []);

  // ============================================================================
  // Lyric Sync Handler
  // ============================================================================
  const handleLyricSync = useCallback(async () => {
    if (!state.audioFile) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Please upload an audio file first.', timestamp: new Date() },
      ]);
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    try {
      const result = await syncRequest.execute(async (signal) => {
        return syncLyricsWithPrecision(
          state.audioFile!,
          {
            precision: state.syncPrecision,
            userLyrics: state.userProvidedLyrics || undefined,
          },
          (progress) => {
            setState((prev) => ({ ...prev, syncProgress: progress }));
          },
          signal
        );
      });

      if (result) {
        setState((prev) => ({
          ...prev,
          lyrics: result.lyrics,
          metadata: result.metadata,
          lastSyncConfidence: result.overallConfidence,
          isSyncing: false,
          syncProgress: 100,
        }));

        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Lyrics synced with ${state.syncPrecision}-level precision! Confidence: ${Math.round(result.overallConfidence * 100)}%. ${result.processingTimeMs ? `(${(result.processingTimeMs / 1000).toFixed(1)}s)` : ''}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setState((prev) => ({ ...prev, isSyncing: false, syncProgress: 0 }));
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Sync Failed', 'Could not sync lyrics with audio');
        setState((prev) => ({ ...prev, isSyncing: false, syncProgress: 0 }));
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'Failed to sync lyrics. Please try again.',
            timestamp: new Date(),
          },
        ]);
      } else {
        setState((prev) => ({ ...prev, isSyncing: false, syncProgress: 0 }));
      }
    }
  }, [state.audioFile, state.syncPrecision, state.userProvidedLyrics, syncRequest]);

  // ============================================================================
  // Microphone Recording
  // ============================================================================
  const startMicRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      micChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          micChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(micChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setIsProcessing(true);
        try {
          const transcription = await transcribeMicrophone(blob);
          setState((prev) => ({
            ...prev,
            userProvidedLyrics: prev.userProvidedLyrics
              ? `${prev.userProvidedLyrics}\n${transcription}`
              : transcription,
          }));
          setChatMessages((prev) => [
            ...prev,
            { role: 'model', text: `Transcribed: "${transcription}"`, timestamp: new Date() },
          ]);
        } catch (_err) {
          toast.error('Transcription Failed', 'Could not transcribe audio');
          setChatMessages((prev) => [
            ...prev,
            { role: 'model', text: 'Failed to transcribe audio.', timestamp: new Date() },
          ]);
        } finally {
          setIsProcessing(false);
        }
      };

      micRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMic(true);
    } catch (_err) {
      toast.error('Microphone Access Denied', 'Please grant microphone permissions');
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Microphone access denied.', timestamp: new Date() },
      ]);
    }
  }, []);

  const stopMicRecording = useCallback(() => {
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      micRecorderRef.current.stop();
    }
    setIsRecordingMic(false);
  }, []);

  // ============================================================================
  // Image Analysis
  // ============================================================================
  const handleImageAnalysis = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const analysis = await analyzeImage(file);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: `Image Analysis:\n${analysis}`, timestamp: new Date() },
      ]);
    } catch (_err) {
      toast.error('Image Analysis Failed', 'Could not analyze the image');
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to analyze image.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ============================================================================
  // Background Generation
  // ============================================================================
  const handleGenerate = useCallback(async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    const currentPrompt = genPrompt;
    const currentModal = showGenModal;

    try {
      const result = await backgroundRequest.execute(async (signal) => {
        if (currentModal === 'image') {
          const url = await generateBackground(
            currentPrompt,
            state.aspectRatio,
            targetSize,
            signal
          );
          return { type: 'image' as const, url, prompt: currentPrompt };
        } else if (currentModal === 'video') {
          const url = await generateVideoBackground(
            currentPrompt,
            genAspectRatio,
            '1080p',
            undefined,
            signal
          );
          return { type: 'video' as const, url, prompt: currentPrompt };
        }
        return null;
      });

      if (result) {
        setState((prev) => ({
          ...prev,
          backgroundAsset: result,
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Generated background ${result.type}: "${currentPrompt}"`,
            timestamp: new Date(),
          },
        ]);
        setShowGenModal(null);
        setGenPrompt('');
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Generation Failed', 'Please try again');
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Failed to generate. Please try again.', timestamp: new Date() },
        ]);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [genPrompt, showGenModal, state.aspectRatio, targetSize, genAspectRatio, backgroundRequest]);

  // ============================================================================
  // Video Plan Handlers
  // ============================================================================
  const handleRegeneratePlan = useCallback(async () => {
    if (!state.audioFile) return;

    setIsGeneratingPlan(true);

    try {
      const plan = await planRequest.execute(async (signal) => {
        return aiOrchestrator.generateFullVideoPlan(
          state.audioFile!,
          state.userProvidedLyrics,
          state.userCreativeVision,
          state.aspectRatio,
          (status) => {
            setChatMessages((prev) => [
              ...prev,
              { role: 'model', text: status, timestamp: new Date() },
            ]);
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
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Failed to regenerate video plan.', timestamp: new Date() },
        ]);
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [
    state.audioFile,
    state.userProvidedLyrics,
    state.userCreativeVision,
    state.aspectRatio,
    videoPlan,
    planRequest,
    pushVideoPlanToHistory,
    setVideoPlan,
    setIsGeneratingPlan,
  ]);

  const handleApplyPlan = useCallback(() => {
    if (!videoPlan) return;

    setState((prev) => ({
      ...prev,
      currentStyle: videoPlan.visualStyle.style,
      visualSettings: {
        ...prev.visualSettings,
        textAnimation: videoPlan.visualStyle.textAnimation,
        fontFamily: videoPlan.visualStyle.fontFamily,
        backgroundBlendMode: videoPlan.visualStyle.blendMode,
        intensity: videoPlan.visualStyle.intensity,
        particleSpeed: videoPlan.visualStyle.particleSpeed,
      },
      backgroundEffects: videoPlan.backgroundEffect
        ? [{ effectId: videoPlan.backgroundEffect.effectId, parameters: {}, enabled: true }]
        : [],
      lyricEffects: videoPlan.lyricEffects.map((e) => ({
        effectId: e.effectId,
        parameters: {},
        enabled: true,
      })),
    }));

    setVideoPlan({ ...videoPlan, status: 'applied' });

    setChatMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: 'Video plan applied! Your settings have been updated.',
        timestamp: new Date(),
      },
    ]);
  }, [videoPlan, setVideoPlan]);

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
          setChatMessages((prev) => [
            ...prev,
            { role: 'model', text: `Plan updated: ${modifiedPlan.summary}`, timestamp: new Date() },
          ]);
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Plan Modification Failed', 'Please try again');
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: 'Failed to modify the plan. Please try again.',
              timestamp: new Date(),
            },
          ]);
        }
      }
    },
    [videoPlan, planModifyRequest, pushVideoPlanToHistory, setVideoPlan]
  );

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

  const handleRegeneratePeakVisual = useCallback(
    async (peak: EmotionalPeak) => {
      if (!videoPlan) return;

      setRegeneratingPeakId(peak.id);
      try {
        const newVisual = await peakVisualRequest.execute(async (signal) => {
          return aiOrchestrator.regeneratePeakVisual(
            peak,
            state.lyrics,
            videoPlan,
            state.aspectRatio,
            signal
          );
        });

        if (newVisual) {
          setVideoPlan((prev) => {
            if (!prev) return prev;
            const existingIndex = prev.hybridVisuals.peakVisuals.findIndex(
              (v) => v.peakId === peak.id
            );
            const newPeakVisuals = [...prev.hybridVisuals.peakVisuals];

            if (existingIndex >= 0) {
              newPeakVisuals[existingIndex] = newVisual;
            } else {
              newPeakVisuals.push(newVisual);
            }

            return {
              ...prev,
              hybridVisuals: { ...prev.hybridVisuals, peakVisuals: newPeakVisuals },
            };
          });
        }
      } catch (err) {
        if (!isAbortError(err)) {
          toast.error('Visual Generation Failed', 'Could not generate peak visual');
          setChatMessages((prev) => [
            ...prev,
            { role: 'model', text: 'Failed to generate peak visual.', timestamp: new Date() },
          ]);
        }
      } finally {
        setRegeneratingPeakId(null);
      }
    },
    [
      videoPlan,
      state.lyrics,
      state.aspectRatio,
      peakVisualRequest,
      setVideoPlan,
      setRegeneratingPeakId,
    ]
  );

  const handleBackgroundToggle = useCallback(async () => {
    if (!videoPlan || !state.audioFile) return;

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
            state.aspectRatio === '9:16' ? '9:16' : '16:9',
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
            state.aspectRatio,
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

      if (newBackground) {
        setVideoPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            backgroundStrategy: newStrategy,
            hybridVisuals: { ...prev.hybridVisuals, sharedBackground: newBackground },
          };
        });
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Background Toggle Failed', 'Could not generate new background');
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Failed to generate new background.', timestamp: new Date() },
        ]);
      }
    } finally {
      setIsRegeneratingBackground(false);
    }
  }, [
    videoPlan,
    state.audioFile,
    state.aspectRatio,
    backgroundRequest,
    setVideoPlan,
    setIsRegeneratingBackground,
  ]);

  const handleBackgroundRegenerate = useCallback(async () => {
    if (!videoPlan || !state.audioFile) return;

    setIsRegeneratingBackground(true);

    try {
      const newBackground = await backgroundRequest.execute(async (signal) => {
        if (videoPlan.backgroundStrategy.useVideo && videoPlan.backgroundStrategy.videoPrompt) {
          const videoUrl = await generateVideoBackground(
            videoPlan.backgroundStrategy.videoPrompt,
            state.aspectRatio === '9:16' ? '9:16' : '16:9',
            '1080p',
            undefined,
            signal
          );
          return {
            type: 'video' as const,
            url: videoUrl,
            prompt: videoPlan.backgroundStrategy.videoPrompt,
          };
        } else if (
          !videoPlan.backgroundStrategy.useVideo &&
          videoPlan.backgroundStrategy.imagePrompt
        ) {
          const imageUrl = await generateBackground(
            videoPlan.backgroundStrategy.imagePrompt,
            state.aspectRatio,
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

      if (newBackground) {
        setVideoPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hybridVisuals: { ...prev.hybridVisuals, sharedBackground: newBackground },
          };
        });
      }
    } catch (err) {
      if (!isAbortError(err)) {
        toast.error('Background Regeneration Failed', 'Please try again');
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Failed to regenerate background.', timestamp: new Date() },
        ]);
      }
    } finally {
      setIsRegeneratingBackground(false);
    }
  }, [
    videoPlan,
    state.audioFile,
    state.aspectRatio,
    backgroundRequest,
    setVideoPlan,
    setIsRegeneratingBackground,
  ]);

  // ============================================================================
  // Visual Settings Handlers
  // ============================================================================
  const updateVisualSetting = useCallback(
    <K extends keyof AppState['visualSettings']>(key: K, value: AppState['visualSettings'][K]) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, [key]: value },
      }));
    },
    []
  );

  const updateFrequencyMapping = useCallback(
    (key: 'pulse' | 'motion' | 'color', value: FrequencyBand) => {
      setState((prev) => ({
        ...prev,
        visualSettings: {
          ...prev.visualSettings,
          frequencyMapping: { ...prev.visualSettings.frequencyMapping, [key]: value },
        },
      }));
    },
    []
  );

  // ============================================================================
  // Lyric Update Handler
  // ============================================================================
  const handleLyricUpdate = useCallback((index: number, updates: Partial<LyricLine>) => {
    setState((prev) => ({
      ...prev,
      lyrics: prev.lyrics.map((l, i) => (i === index ? { ...l, ...updates } : l)),
    }));
  }, []);

  const updateLyric = useCallback(
    (index: number, field: keyof LyricLine, value: LyricLine[keyof LyricLine]) => {
      setState((prev) => {
        const newLyrics = [...prev.lyrics];
        newLyrics[index] = { ...newLyrics[index], [field]: value };
        return { ...prev, lyrics: newLyrics };
      });
    },
    []
  );

  const applyMotionPreset = useCallback(
    (lyricIndex: number, presetIndex: number) => {
      if (presetIndex < 0) return;
      const preset = MOTION_PRESETS[presetIndex];
      updateLyric(lyricIndex, 'keyframes', preset.keyframes);
    },
    [updateLyric]
  );

  const addKeyframe = useCallback(
    (lyricIndex: number) => {
      const line = state.lyrics[lyricIndex];
      const newKeyframes = line.keyframes ? [...line.keyframes] : [];

      let defaultTime = 1.0;
      if (newKeyframes.length > 0) {
        const lastTime = newKeyframes[newKeyframes.length - 1].time;
        if (lastTime < 0.9) defaultTime = lastTime + 0.1;
      }

      newKeyframes.push({
        time: defaultTime,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        easing: 'linear',
      });
      updateLyric(lyricIndex, 'keyframes', newKeyframes);
      setActiveKeyframeIndex(newKeyframes.length - 1);
    },
    [state.lyrics, updateLyric]
  );

  const removeKeyframe = useCallback(
    (lyricIndex: number, kfIndex: number) => {
      const line = state.lyrics[lyricIndex];
      if (!line.keyframes) return;
      const newKeyframes = line.keyframes.filter((_, i) => i !== kfIndex);
      updateLyric(lyricIndex, 'keyframes', newKeyframes);
    },
    [state.lyrics, updateLyric]
  );

  const toggleLyricSelection = useCallback((index: number) => {
    setSelectedLyricIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        setActiveKeyframeIndex(null);
      } else {
        newSet.clear();
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const updateKeyframe = useCallback(
    (
      lyricIndex: number,
      kfIndex: number,
      field: keyof TextKeyframe,
      value: TextKeyframe[keyof TextKeyframe]
    ) => {
      const line = state.lyrics[lyricIndex];
      if (!line.keyframes) return;
      const newKeyframes = [...line.keyframes];
      newKeyframes[kfIndex] = { ...newKeyframes[kfIndex], [field]: value };
      updateLyric(lyricIndex, 'keyframes', newKeyframes);
    },
    [state.lyrics, updateLyric]
  );

  const selectAllLyrics = useCallback(() => {
    if (selectedLyricIndices.size === state.lyrics.length) {
      setSelectedLyricIndices(new Set());
    } else {
      setSelectedLyricIndices(new Set(state.lyrics.map((_, i) => i)));
    }
  }, [selectedLyricIndices.size, state.lyrics]);

  const applyBulkTimeShift = useCallback(() => {
    const shift = parseFloat(bulkTimeShift);
    if (isNaN(shift) || shift === 0 || selectedLyricIndices.size === 0) return;
    const newLyrics = state.lyrics.map((line, idx) => {
      if (selectedLyricIndices.has(idx)) {
        return {
          ...line,
          startTime: Number((line.startTime + shift).toFixed(2)),
          endTime: Number((line.endTime + shift).toFixed(2)),
        };
      }
      return line;
    });
    setState((prev) => ({ ...prev, lyrics: newLyrics }));
  }, [bulkTimeShift, selectedLyricIndices, state.lyrics]);

  const applyTextTransform = useCallback(
    (type: 'upper' | 'lower' | 'capitalize') => {
      if (selectedLyricIndices.size === 0) return;
      const newLyrics = state.lyrics.map((line, idx) => {
        if (selectedLyricIndices.has(idx)) {
          let text = line.text;
          if (type === 'upper') text = text.toUpperCase();
          else if (type === 'lower') text = text.toLowerCase();
          else if (type === 'capitalize')
            text = text.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
          return { ...line, text };
        }
        return line;
      });
      setState((prev) => ({ ...prev, lyrics: newLyrics }));
    },
    [selectedLyricIndices, state.lyrics]
  );

  const applyOverride = useCallback(
    (type: 'style' | 'palette', value: string | undefined) => {
      if (selectedLyricIndices.size === 0) return;
      const newLyrics = state.lyrics.map((line, idx) => {
        if (selectedLyricIndices.has(idx)) {
          if (type === 'style') return { ...line, styleOverride: value as VisualStyle | undefined };
          if (type === 'palette')
            return { ...line, paletteOverride: value as ColorPalette | undefined };
        }
        return line;
      });
      setState((prev) => ({ ...prev, lyrics: newLyrics }));
    },
    [selectedLyricIndices, state.lyrics]
  );

  // ============================================================================
  // Audio Duration Tracking
  // ============================================================================
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleDurationChange = () => {
      setAudioDuration(audio.duration);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);

    if (audio.duration) {
      setAudioDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [state.audioUrl]);

  // ============================================================================
  // AI Control Handlers
  // ============================================================================
  const handleAiControlApply = useCallback(() => {
    if (!aiControlPending) return;

    const result = aiControlService.applyPendingCommands();
    setChatMessages((prev) => [
      ...prev,
      { role: 'model', text: result.message, timestamp: new Date() },
    ]);
    setAiControlPending(null);
  }, [aiControlPending, setChatMessages]);

  const handleAiControlShowOnly = useCallback(() => {
    if (!aiControlPending) return;

    aiControlService.cancelPendingCommands();
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: 'No problem! The control is highlighted on the left panel. You can adjust it manually.',
        timestamp: new Date(),
      },
    ]);
    setAiControlPending(null);
  }, [aiControlPending, setChatMessages]);

  const onKeyframePositionUpdate = useCallback(
    (lyricIndex: number, kfIndex: number, x: number, y: number) => {
      setState((prev) => {
        const newLyrics = [...prev.lyrics];
        const line = newLyrics[lyricIndex];
        if (line.keyframes && line.keyframes[kfIndex]) {
          const newKeyframes = [...line.keyframes];
          newKeyframes[kfIndex] = { ...newKeyframes[kfIndex], x, y };
          newLyrics[lyricIndex] = { ...line, keyframes: newKeyframes };
        }
        return { ...prev, lyrics: newLyrics };
      });
    },
    []
  );

  // === RENDER ===
  return (
    <div className="h-screen w-full bg-gray-950 text-white overflow-hidden relative font-sans">
      {/* AUTO-SAVE RESTORE PROMPT */}
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/20 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Previous Session Found</h3>
            <p className="text-sm text-slate-300 mb-4">
              We found an auto-saved session from your previous work. Would you like to restore it?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDismissRestore}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={handleRestoreSession}
                className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Restore Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]"></div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 h-full flex">
        {/* LEFT SIDEBAR - Minimal Icons */}
        <div className="w-16 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-blue-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
            <MusicalNoteIcon className="w-5 h-5 text-white" />
          </div>

          {/* Nav Icons */}
          <div className="flex-1 flex flex-col gap-2">
            <button
              onClick={() => setActivePanel(activePanel === 'source' ? null : 'source')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activePanel === 'source'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title="Source Material"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'styles' ? null : 'styles')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activePanel === 'styles'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title="Visual Styles"
            >
              <PaintBrushIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'effects' ? null : 'effects')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activePanel === 'effects'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title="FX Settings"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'advanced' ? null : 'advanced')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activePanel === 'advanced'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title="Advanced Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            <div className="h-px w-6 mx-auto bg-white/10 my-2"></div>

            <button
              onClick={() => setTimelineOpen(!timelineOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                timelineOpen
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
              }`}
              title="Timeline"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>

            {state.audioBuffer && (
              <button
                onClick={() => setShowWaveformEditor(!showWaveformEditor)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  showWaveformEditor
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                    : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
                }`}
                title="Waveform Editor"
              >
                <SpeakerWaveIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Chat Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              chatOpen
                ? 'bg-gradient-to-br from-amber-500 to-blue-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
            }`}
            title="AI Chat"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-14 bg-black/30 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">
                <span className="bg-gradient-to-r from-amber-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                  Lyrical Flow
                </span>
              </h1>
              {state.metadata && (
                <span className="text-sm text-white/50">
                  {state.metadata.title}{' '}
                  {state.metadata.artist !== 'Unknown' && `• ${state.metadata.artist}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Aspect Ratio */}
              <select
                value={state.aspectRatio}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, aspectRatio: e.target.value as AspectRatio }))
                }
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>

              {/* Export Settings Toggle */}
              <button
                onClick={() => setShowExportSettings(!showExportSettings)}
                className={`p-2 rounded-lg transition-all ${
                  showExportSettings
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
                title="Export Settings"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </button>

              <button
                onClick={state.isRecording ? cancelExport : startExport}
                disabled={!state.audioUrl}
                className={`px-5 py-2 font-semibold text-sm rounded-lg transition-all shadow-lg ${
                  state.isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/20'
                    : state.audioUrl
                      ? 'bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white shadow-amber-500/20 hover:shadow-amber-500/40'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {state.isRecording ? 'Cancel' : 'Export'}
              </button>
            </div>
          </header>

          {/* Canvas Area */}
          <div
            className={`flex-1 flex items-center justify-center p-8 transition-all ${timelineOpen || showWaveformEditor ? 'pb-4' : ''}`}
          >
            <div
              className={`aspect-video w-full max-w-5xl bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl ${timelineOpen || showWaveformEditor ? 'max-h-[calc(100%-320px)]' : ''}`}
            >
              {/* VISUALIZER */}
              <Visualizer
                ref={canvasRef}
                audioUrl={state.audioUrl}
                lyrics={state.lyrics}
                currentTime={state.currentTime}
                isPlaying={state.isPlaying}
                style={state.currentStyle}
                backgroundAsset={currentBackgroundAsset}
                aspectRatio={state.aspectRatio}
                settings={state.visualSettings}
                onTimeUpdate={(t) => setState((prev) => ({ ...prev, currentTime: t }))}
                setAudioElement={(el) => (audioElementRef.current = el)}
                setMediaStreamDestination={(d) => (mediaStreamDestRef.current = d)}
                editMode={editMode}
                activeKeyframeIndex={activeKeyframeIndex}
                selectedLyricIndex={
                  selectedLyricIndices.size === 1 ? Array.from(selectedLyricIndices)[0] : null
                }
                onKeyframeUpdate={onKeyframePositionUpdate}
                lyricEffects={state.lyricEffects}
                backgroundEffects={state.backgroundEffects}
                activeGenre={state.genreOverride ?? state.detectedGenre}
                exportResolution={exportSettings.resolution}
              />

              {/* Playback Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl z-20">
                <button
                  onClick={() => {
                    if (audioElementRef.current) {
                      audioElementRef.current.currentTime = 0;
                    }
                  }}
                  className="text-white/50 hover:text-white transition-colors"
                  title="Restart"
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                  {state.isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6 ml-1" />
                  )}
                </button>

                <div className="flex flex-col gap-1 w-64">
                  <input
                    type="range"
                    min="0"
                    max={audioElementRef.current?.duration || 100}
                    value={state.currentTime}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      if (audioElementRef.current) audioElementRef.current.currentTime = t;
                      setState((prev) => ({ ...prev, currentTime: t }));
                    }}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>{formatTime(state.currentTime)}</span>
                    <span>{formatTime(audioElementRef.current?.duration || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Export Progress Indicator */}
              {exportProgress && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur border border-blue-500/30 rounded-xl px-4 py-3 z-30 min-w-64">
                  <div className="flex justify-between text-xs text-blue-200 mb-2">
                    <span>{exportProgress.message}</span>
                    <span>{exportProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-blue-900/50 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Export Settings Panel (popover) */}
              {showExportSettings && (
                <div className="absolute top-6 right-6 w-80 z-30">
                  <ExportSettingsPanel
                    settings={exportSettings}
                    onChange={setExportSettings}
                    progress={exportProgress}
                    isRecording={state.isRecording}
                    aspectRatio={state.aspectRatio}
                    onAspectRatioChange={(ar) => setState((prev) => ({ ...prev, aspectRatio: ar }))}
                  />
                </div>
              )}

              {/* Empty state */}
              {!state.audioUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <MusicalNoteIcon className="w-16 h-16 text-white/20 mb-4" />
                  <p className="text-white/40 text-lg">Upload audio to get started</p>
                  <button
                    onClick={() => setActivePanel('source')}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-blue-500 rounded-lg text-sm font-medium hover:from-amber-400 hover:to-blue-400 hover:border-amber-400 hover:bg-amber-500/10 transition-all"
                  >
                    Upload Audio
                  </button>
                  {/* Corner Decorations */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-500/30 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-500/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blue-500/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-500/30 rounded-br-lg"></div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Timeline Panel */}
          {timelineOpen && (
            <div className="h-80 bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80">Timeline</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      editMode
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {editMode ? 'Done' : 'Edit'}
                  </button>
                </div>
              </div>

              {state.lyrics.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-white/30">
                  <p>No lyrics yet. Upload audio and they'll appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.lyrics.map((line, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        state.currentTime >= line.startTime && state.currentTime <= line.endTime
                          ? 'bg-amber-500/20 border-amber-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        if (audioElementRef.current) {
                          audioElementRef.current.currentTime = line.startTime;
                        }
                      }}
                    >
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>{formatTime(line.startTime)}</span>
                        {line.section && <span className="text-amber-400">{line.section}</span>}
                      </div>
                      <p className="text-white/90">{line.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Waveform Editor */}
          {showWaveformEditor && state.audioBuffer && (
            <div className="h-80 bg-slate-900/95 backdrop-blur border-t border-white/10">
              <WaveformEditor
                audioBuffer={state.audioBuffer}
                duration={audioElementRef.current?.duration || 0}
                currentTime={state.currentTime}
                onSeek={(t) => {
                  if (audioElementRef.current) audioElementRef.current.currentTime = t;
                  setState((prev) => ({ ...prev, currentTime: t }));
                }}
                lyrics={state.lyrics}
                onLyricUpdate={handleLyricUpdate}
                syncPrecision={state.syncPrecision}
                isPlaying={state.isPlaying}
                onPlayPause={togglePlay}
                selectedLyricIndex={selectedWaveformLyricIndex}
                onSelectLyric={setSelectedWaveformLyricIndex}
              />
            </div>
          )}
        </div>
      </div>

      {/* SLIDE-OUT PANELS */}
      <SlideOutPanel
        isOpen={activePanel === 'source'}
        onClose={() => setActivePanel(null)}
        title="Source Material"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-white/50 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3 text-blue-400" />
              Creative Vision
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 focus:border-amber-500/50 outline-none resize-none h-24"
              placeholder="Describe your vision..."
              value={state.userCreativeVision}
              onChange={(e) =>
                setState((prev) => ({ ...prev, userCreativeVision: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50 flex items-center gap-1">
              <LanguageIcon className="w-3 h-3 text-amber-400" />
              Lyrics
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 focus:border-amber-500/50 outline-none resize-none h-32"
              placeholder="Paste lyrics for perfect sync..."
              value={state.userProvidedLyrics}
              onChange={(e) =>
                setState((prev) => ({ ...prev, userProvidedLyrics: e.target.value }))
              }
            />
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <label className="relative flex flex-col items-center justify-center h-20 bg-black/40 rounded-xl cursor-pointer border border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-2">
                <MusicalNoteIcon className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold text-white">
                  {state.audioFile ? 'Change Song' : 'Upload Audio'}
                </span>
              </div>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={isRecordingMic ? stopMicRecording : startMicRecording}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                isRecordingMic
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MicrophoneIcon className="w-4 h-4" />
              {isRecordingMic ? 'Stop' : 'Speak'}
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer transition-all">
              <EyeDropperIcon className="w-4 h-4" />
              Analyze Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageAnalysis}
                className="hidden"
              />
            </label>
          </div>

          {state.audioFile && (
            <SyncPanel
              precision={state.syncPrecision}
              onPrecisionChange={(p) => setState((prev) => ({ ...prev, syncPrecision: p }))}
              userLyrics={state.userProvidedLyrics}
              onLyricsChange={(lyrics) =>
                setState((prev) => ({ ...prev, userProvidedLyrics: lyrics }))
              }
              onSync={handleLyricSync}
              isSyncing={state.isSyncing}
              syncProgress={state.syncProgress}
              lastSyncConfidence={state.lastSyncConfidence}
              disabled={!state.audioFile}
            />
          )}
        </div>
      </SlideOutPanel>

      <SlideOutPanel
        isOpen={activePanel === 'styles'}
        onClose={() => setActivePanel(null)}
        title="Visual Styles"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Style
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(VisualStyle).map((style) => (
                <button
                  key={style}
                  onClick={() => setState((prev) => ({ ...prev, currentStyle: style }))}
                  className={`p-3 text-xs font-medium rounded-lg border transition-all ${
                    state.currentStyle === style
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {style.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Color Palette
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['neon', 'sunset', 'ocean', 'matrix', 'fire'] as ColorPalette[]).map((p) => (
                <button
                  key={p}
                  onClick={() => updateVisualSetting('palette', p)}
                  className={`px-3 py-2 text-xs rounded-lg border capitalize transition-all ${
                    state.visualSettings.palette === p
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Background
            </h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowGenModal('image')}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 rounded-lg text-xs font-medium transition-all"
              >
                <PhotoIcon className="w-4 h-4" />
                Generate Image
              </button>
              <button
                onClick={() => setShowGenModal('video')}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 rounded-lg text-xs font-medium transition-all"
              >
                <VideoCameraIcon className="w-4 h-4" />
                Generate Video
              </button>
            </div>
            {state.backgroundAsset && (
              <div className="space-y-2">
                <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                  {state.backgroundAsset.type === 'image' ? (
                    <img
                      src={state.backgroundAsset.url}
                      alt="Background"
                      className="w-full h-full object-cover"
                    />
                  ) : state.backgroundAsset.type === 'video' ? (
                    <video
                      src={state.backgroundAsset.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-white/50">
                      Extended Video ({state.backgroundAsset.segments?.length || 0} segments)
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setState((prev) => ({ ...prev, backgroundAsset: null }))}
                  className="w-full py-2 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Remove Background
                </button>
              </div>
            )}
          </div>
        </div>
      </SlideOutPanel>

      <SlideOutPanel
        isOpen={activePanel === 'effects'}
        onClose={() => setActivePanel(null)}
        title="FX Settings"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Text Styling
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 block mb-2">Font Family</label>
                <select
                  value={state.visualSettings.fontFamily}
                  onChange={(e) => updateVisualSetting('fontFamily', e.target.value as FontFamily)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {fonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 block mb-2">Entry Animation</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'NONE',
                      'TYPEWRITER',
                      'FADE_CHARS',
                      'KINETIC',
                      'BOUNCE',
                    ] as TextAnimationStyle[]
                  ).map((anim) => (
                    <button
                      key={anim}
                      onClick={() => updateVisualSetting('textAnimation', anim)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                        state.visualSettings.textAnimation === anim
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {anim.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Animation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Animation Speed</span>
                  <span className="text-amber-400">{state.visualSettings.particleSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={state.visualSettings.particleSpeed}
                  onChange={(e) => updateVisualSetting('particleSpeed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Reactivity Intensity</span>
                  <span className="text-amber-400">{state.visualSettings.intensity}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={state.visualSettings.intensity}
                  onChange={(e) => updateVisualSetting('intensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Effects
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Bass Camera Shake</span>
                  <button
                    onClick={() =>
                      updateVisualSetting('cameraShake', !state.visualSettings.cameraShake)
                    }
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${state.visualSettings.cameraShake ? 'bg-amber-500' : 'bg-white/20'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.cameraShake ? 'translate-x-5' : 'translate-x-0'}`}
                    ></div>
                  </button>
                </div>
                {state.visualSettings.cameraShake && (
                  <div>
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>Intensity</span>
                      <span>{state.visualSettings.cameraShakeIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={state.visualSettings.cameraShakeIntensity}
                      onChange={(e) =>
                        updateVisualSetting('cameraShakeIntensity', parseFloat(e.target.value))
                      }
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-white/80">Dynamic Background Pulse</span>
                <button
                  onClick={() =>
                    updateVisualSetting(
                      'dynamicBackgroundOpacity',
                      !state.visualSettings.dynamicBackgroundOpacity
                    )
                  }
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${state.visualSettings.dynamicBackgroundOpacity ? 'bg-amber-500' : 'bg-white/20'}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.dynamicBackgroundOpacity ? 'translate-x-5' : 'translate-x-0'}`}
                  ></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-white/80">Particle Trails</span>
                <button
                  onClick={() =>
                    updateVisualSetting('trailsEnabled', !state.visualSettings.trailsEnabled)
                  }
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${state.visualSettings.trailsEnabled ? 'bg-amber-500' : 'bg-white/20'}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.trailsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </SlideOutPanel>

      <SlideOutPanel
        isOpen={activePanel === 'advanced'}
        onClose={() => setActivePanel(null)}
        title="Advanced Settings"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Frequency Mapping
            </h3>
            <p className="text-[10px] text-white/30 mb-3">
              Control which audio frequencies drive visual effects
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 block mb-1">Pulse (Scale/Size)</label>
                <select
                  value={state.visualSettings.frequencyMapping.pulse}
                  onChange={(e) => updateFrequencyMapping('pulse', e.target.value as FrequencyBand)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {freqBands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Motion (Movement)</label>
                <select
                  value={state.visualSettings.frequencyMapping.motion}
                  onChange={(e) =>
                    updateFrequencyMapping('motion', e.target.value as FrequencyBand)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {freqBands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Color (Glow/Shift)</label>
                <select
                  value={state.visualSettings.frequencyMapping.color}
                  onChange={(e) => updateFrequencyMapping('color', e.target.value as FrequencyBand)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {freqBands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Blend Mode
            </h3>
            <select
              value={state.visualSettings.backgroundBlendMode}
              onChange={(e) =>
                updateVisualSetting('backgroundBlendMode', e.target.value as BlendMode)
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {blendModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <EffectPanel
            lyricEffects={state.lyricEffects || []}
            onLyricEffectsChange={(effects) =>
              setState((prev) => ({ ...prev, lyricEffects: effects }))
            }
            backgroundEffects={state.backgroundEffects || []}
            onBackgroundEffectsChange={(effects) =>
              setState((prev) => ({ ...prev, backgroundEffects: effects }))
            }
            detectedGenre={state.detectedGenre}
            genreOverride={state.genreOverride}
            onGenreOverride={(genre) => setState((prev) => ({ ...prev, genreOverride: genre }))}
            genreConfidence={0.85}
            isDetectingGenre={isDetectingGenre}
          />
        </div>
      </SlideOutPanel>

      {/* DRAGGABLE CHAT */}
      <DraggableChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isMinimized={chatMinimized}
        onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        messages={chatMessages}
        onSendMessage={async (message) => {
          const userMsg: ChatMessage = { role: 'user', text: message, timestamp: new Date() };
          setChatMessages((prev) => [...prev, userMsg]);
          setIsProcessing(true);

          try {
            // Check if this is an AI control command
            if (aiControlService.isControlCommand(message)) {
              const controlResult = await aiControlService.processMessage(message);

              if (controlResult.success && controlResult.requiresConfirmation) {
                setAiControlPending({
                  message: controlResult.message,
                  commands: controlResult.pendingCommands || [],
                  controlNames: controlResult.controlsHighlighted,
                });

                setChatMessages((prev) => [
                  ...prev,
                  { role: 'model', text: controlResult.message, timestamp: new Date() },
                ]);
                setIsProcessing(false);
                return;
              }
            }

            // Regular chat handling with throttling/abort support
            const response = await chatRequest.execute(async (signal) => {
              const history = chatMessages.map((m) => ({
                role: m.role,
                parts: [{ text: m.text }],
              }));
              return sendChatMessage(history, message, signal);
            });

            if (response) {
              if (response.text) {
                setChatMessages((prev) => [
                  ...prev,
                  { role: 'model', text: response.text || '', timestamp: new Date() },
                ]);
              }

              if (response.functionCalls) {
                for (const call of response.functionCalls) {
                  if (call.name === 'generateBackgroundImage') {
                    const args = call.args as unknown as GenerateBackgroundArgs;
                    setChatMessages((prev) => [
                      ...prev,
                      {
                        role: 'model',
                        text: `Generating: "${args.prompt}"...`,
                        timestamp: new Date(),
                      },
                    ]);
                    const url = await generateBackground(
                      args.prompt,
                      args.aspectRatio || '16:9',
                      args.resolution || '1K'
                    );
                    setState((prev) => ({
                      ...prev,
                      backgroundAsset: { type: 'image', url, prompt: args.prompt },
                    }));
                    setChatMessages((prev) => [
                      ...prev,
                      { role: 'model', text: 'Background generated!', timestamp: new Date() },
                    ]);
                  }
                }
              }
            }
          } catch (err) {
            if (!isAbortError(err)) {
              toast.error('Chat Error', 'Sorry, I encountered an error');
              setChatMessages((prev) => [
                ...prev,
                { role: 'model', text: 'Sorry, I encountered an error.', timestamp: new Date() },
              ]);
            }
          } finally {
            setIsProcessing(false);
          }
        }}
        isProcessing={isProcessing}
        onFileUpload={async (file, type) => {
          if (type === 'audio') {
            const event = {
              target: { files: [file] },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileUpload(event);
          } else {
            const url = URL.createObjectURL(file);
            setState((prev) => ({
              ...prev,
              backgroundAsset: { type: 'image', url, prompt: 'User uploaded' },
            }));
            setChatMessages((prev) => [
              ...prev,
              { role: 'model', text: 'Background applied!', timestamp: new Date() },
            ]);
          }
        }}
      />

      {/* AI Control Pending Confirmation */}
      {aiControlPending && (
        <div className="fixed bottom-24 right-8 z-50 bg-slate-800/95 backdrop-blur border border-blue-500/30 rounded-xl p-4 shadow-2xl max-w-sm">
          <p className="text-sm text-white/80 mb-3">{aiControlPending.message}</p>
          <div className="flex gap-2">
            <button
              onClick={handleAiControlApply}
              className="flex-1 px-4 py-2 text-xs font-medium bg-gradient-to-r from-blue-600 to-amber-500 text-white rounded-lg hover:from-blue-500 hover:to-amber-400 transition-all"
            >
              Apply Changes
            </button>
            <button
              onClick={handleAiControlShowOnly}
              className="flex-1 px-4 py-2 text-xs font-medium bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all"
            >
              Just Show Me
            </button>
          </div>
        </div>
      )}

      {/* GENERATION MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {showGenModal === 'image' ? (
                  <>
                    <PhotoIcon className="w-5 h-5 text-blue-400" /> Generate Image
                  </>
                ) : (
                  <>
                    <FilmIcon className="w-5 h-5 text-blue-400" /> Generate Video
                  </>
                )}
              </h2>
              <button
                onClick={() => setShowGenModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prompt</label>
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder={
                    showGenModal === 'image'
                      ? 'Describe the background...'
                      : 'Describe the video...'
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 outline-none resize-none h-24"
                />
              </div>

              {showGenModal === 'image' ? (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Resolution</label>
                  <div className="flex gap-2">
                    {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setTargetSize(size)}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                          targetSize === size
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(['16:9', '9:16'] as const).map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setGenAspectRatio(ar)}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                          genAspectRatio === ar
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !genPrompt.trim()}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isGenerating || !genPrompt.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : showGenModal === 'image'
                      ? 'bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>{' '}
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" /> Generate{' '}
                    {showGenModal === 'image' ? 'Image' : 'Video'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO PLAN PANEL */}
      {showPlanPanel && (
        <VideoPlanPanel
          plan={videoPlan}
          lyrics={state.lyrics}
          isGenerating={isGeneratingPlan}
          onRegenerate={handleRegeneratePlan}
          onApply={handleApplyPlan}
          onModifyViaChat={handleModifyPlanViaChat}
          onMoodEdit={handleMoodEdit}
          onPaletteEdit={handlePaletteEdit}
          onStyleEdit={handleStyleEdit}
          onRegeneratePeakVisual={handleRegeneratePeakVisual}
          regeneratingPeakId={regeneratingPeakId}
          onBackgroundToggle={handleBackgroundToggle}
          onBackgroundRegenerate={handleBackgroundRegenerate}
          isRegeneratingBackground={isRegeneratingBackground}
          onClose={() => setShowPlanPanel(false)}
          audioFile={state.audioFile}
          onFileDrop={async (file: File) => {
            const url = URL.createObjectURL(file);
            setIsProcessing(true);
            setProcessingStatus('Decoding audio...');
            try {
              const buffer = await decodeAudio(file);
              setProcessingStatus('Audio ready!');
              setState((prev) => ({
                ...prev,
                audioFile: file,
                audioUrl: url,
                audioBuffer: buffer,
              }));
            } catch (_err) {
              toast.error('Audio Processing Failed', 'Please try again');
            } finally {
              setIsProcessing(false);
              setProcessingStatus('');
            }
          }}
          onLyricsSubmit={(lyrics) => {
            setState((prev) => ({ ...prev, userProvidedLyrics: lyrics }));
          }}
          onVisionSubmit={async (vision) => {
            setState((prev) => ({ ...prev, userCreativeVision: vision }));
            const file = state.audioFile;
            if (!file) return;

            setIsProcessing(true);
            setProcessingStatus('Analyzing lyrics...');

            try {
              const { lyrics, metadata } = await analyzeAudioAndGetLyrics(
                file,
                state.userProvidedLyrics
              );
              setState((prev) => ({
                ...prev,
                lyrics,
                metadata,
              }));
              setChatMessages((prev) => [
                ...prev,
                {
                  role: 'model',
                  text: `Analyzed "${metadata.title}" (${metadata.genre}). Lyrics aligned and ready!`,
                  timestamp: new Date(),
                },
              ]);

              setIsGeneratingPlan(true);
              setIsDetectingGenre(true);
              setProcessingStatus('Generating video plan...');

              aiOrchestrator
                .generateFullVideoPlan(
                  file,
                  state.userProvidedLyrics,
                  vision,
                  state.aspectRatio,
                  (status) => {
                    setProcessingStatus(status);
                    setChatMessages((prev) => [
                      ...prev,
                      { role: 'model', text: status, timestamp: new Date() },
                    ]);
                  }
                )
                .then((plan) => {
                  setVideoPlan(plan);
                  setShowPlanPanel(true);
                  setState((prev) => ({
                    ...prev,
                    detectedGenre: plan.analysis.consensusGenre,
                  }));
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      role: 'model',
                      text: `Video plan created! Genre: ${plan.analysis.consensusGenre} (${Math.round(plan.analysis.confidence * 100)}% confidence). Found ${plan.emotionalPeaks.length} emotional peaks.`,
                      timestamp: new Date(),
                    },
                  ]);
                })
                .catch((_err) => {
                  toast.error('Plan Generation Failed', 'Falling back to genre detection');
                  detectMusicGenre(file)
                    .then((result) => {
                      setState((prev) => ({
                        ...prev,
                        detectedGenre: result.genre,
                      }));
                    })
                    .catch((_genreErr) => {
                      toast.warning(
                        'Genre Detection Failed',
                        'You can still proceed with manual settings'
                      );
                    });
                })
                .finally(() => {
                  setIsGeneratingPlan(false);
                  setIsDetectingGenre(false);
                  setProcessingStatus('');
                });
            } catch (_err) {
              toast.error('Audio Analysis Failed', 'Please try again');
            } finally {
              setIsProcessing(false);
            }
          }}
          processingStatus={processingStatus}
          isProcessingAudio={isProcessing}
        />
      )}
    </div>
  );
};

export default AppWithNewLayout;
