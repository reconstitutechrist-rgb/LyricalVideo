import React, { useState, useRef, useEffect } from 'react';
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
} from '@heroicons/react/24/solid';
import Visualizer from './components/Visualizer';
import Waveform from './components/Waveform';
import { decodeAudio } from './utils/audio';
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
import { initializeEffects } from './src/effects';
import { EffectPanel } from './src/components/EffectPanel';
import { VideoPlanPanel } from './src/components/VideoPlanPanel';
import { LyricalFlowWrapper } from './src/components/LyricalFlowUI';
import { ExportSettingsPanel } from './src/components/ExportSettingsPanel';
import { Timeline } from './src/components/Timeline';
import { SyncPanel } from './src/components/SyncPanel';
import { WaveformEditor } from './src/components/WaveformEditor';
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

// Motion Presets Definition
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

const MUSIC_SECTIONS = [
  'Intro',
  'Verse 1',
  'Verse 2',
  'Verse 3',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Outro',
  'Instrumental',
  'Hook',
];

const getSectionColorStyle = (section?: string) => {
  if (!section) return 'border-l-transparent';
  const s = section.toLowerCase();
  if (s.includes('chorus') || s.includes('hook')) return 'border-l-pink-500 bg-pink-500/5';
  if (s.includes('verse')) return 'border-l-blue-500 bg-blue-500/5';
  if (s.includes('bridge')) return 'border-l-purple-500 bg-purple-500/5';
  if (s.includes('intro') || s.includes('outro')) return 'border-l-yellow-500 bg-yellow-500/5';
  return 'border-l-slate-500 bg-slate-500/5';
};

const App = () => {
  // --- State ---
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
      colorPalette: 'neon', // UI-friendly alias
      dynamicBackgroundOpacity: false,
      dynamicBackgroundPulse: false, // UI-friendly alias
      textAnimation: 'KINETIC',
      backgroundBlendMode: 'source-over',
      blendMode: 'source-over', // UI-friendly alias
      fontFamily: 'Space Grotesk',
      textStagger: 0.05,
      textRevealDuration: 0.5,
      kineticRotationRange: 0.5,
      kineticOffsetRange: 30,
      glitchFrequency: 0.5,
      trailsEnabled: true,
      particleTrails: true, // UI-friendly alias
      cameraShake: true,
      cameraShakeIntensity: 1.5,
      shakeIntensity: 1.5, // UI-friendly alias
      reactivityIntensity: 1.0, // Overall audio reactivity
      frequencyMapping: {
        pulse: 'bass',
        motion: 'mid',
        color: 'treble',
      },
    },
    audioBuffer: null,
    // Effect system state
    lyricEffects: [],
    backgroundEffects: [],
    detectedGenre: null,
    genreOverride: null,
    // Lyric sync state
    syncPrecision: 'word' as TimingPrecision,
    isSyncing: false,
    syncProgress: 0,
    lastSyncConfidence: null,
  });

  // State for genre detection status
  const [isDetectingGenre, setIsDetectingGenre] = useState(false);

  // Video Plan state
  const [videoPlan, setVideoPlan] = useState<VideoPlan | null>(null);
  const [_videoPlanHistory, setVideoPlanHistory] = useState<VideoPlan[]>([]); // History for future undo feature
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showPlanPanel, setShowPlanPanel] = useState(true);
  const [regeneratingPeakId, setRegeneratingPeakId] = useState<string | null>(null);
  const [isRegeneratingBackground, setIsRegeneratingBackground] = useState(false);

  // New UI toggle and audio duration
  const [useNewUI, setUseNewUI] = useState(true);
  const [audioDuration, setAudioDuration] = useState(0);

  // Export settings for professional output quality
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedTimelineLyricIndex, setSelectedTimelineLyricIndex] = useState<number | null>(null);
  const [showWaveformEditor, setShowWaveformEditor] = useState(false);
  const [selectedWaveformLyricIndex, setSelectedWaveformLyricIndex] = useState<number | null>(null);

  // Initialize effects system on mount
  useEffect(() => {
    initializeEffects();
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Welcome to Lyrical Flow. I am your AI Director. Upload a track, and lets create something epic.',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Modals & Tools
  const [showGenModal, setShowGenModal] = useState<'image' | 'video' | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [targetSize, setTargetSize] = useState<ImageSize>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genAspectRatio, setGenAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Mic Recording State
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);

  // Editing State
  const [editMode, setEditMode] = useState(false);
  const [selectedLyricIndices, setSelectedLyricIndices] = useState<Set<number>>(new Set());
  const [activeKeyframeIndex, setActiveKeyframeIndex] = useState<number | null>(null); // For canvas editing
  const [bulkTimeShift, setBulkTimeShift] = useState<string>('0.1');

  // Refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // --- Logic ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setIsProcessing(true);

    try {
      // Decode for waveform
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

      // Generate full video plan with multi-AI analysis
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
              text: `Video plan created! Genre: ${plan.analysis.consensusGenre} (${Math.round(plan.analysis.confidence * 100)}% confidence). Found ${plan.emotionalPeaks.length} emotional peaks. Review and customize your plan!`,
              timestamp: new Date(),
            },
          ]);
        })
        .catch((err) => {
          console.error('Video plan generation failed:', err);
          // Fall back to just genre detection
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
                  text: `Genre detected: ${result.genre} (${Math.round(result.confidence * 100)}% confidence). Video plan generation failed, but you can still proceed with manual settings.`,
                  timestamp: new Date(),
                },
              ]);
            })
            .catch((genreErr) => {
              console.error('Genre detection also failed:', genreErr);
            });
        })
        .finally(() => {
          setIsGeneratingPlan(false);
          setIsDetectingGenre(false);
        });
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Error analyzing audio. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle file drop from AI panel onboarding - ONLY processes audio, does NOT generate plan
  // Plan generation is triggered separately after user completes onboarding flow
  const handleFileDrop = async (file: File) => {
    const url = URL.createObjectURL(file);
    setIsProcessing(true);
    setProcessingStatus('Decoding audio...');

    try {
      // Decode for waveform
      const buffer = await decodeAudio(file);
      setProcessingStatus('Audio ready!');

      setState((prev) => ({
        ...prev,
        audioFile: file,
        audioUrl: url,
        audioBuffer: buffer,
      }));

      // Don't generate plan yet - wait for user to complete onboarding
      // The onboarding flow will call generateVideoPlanFromOnboarding when ready
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Error processing audio. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle lyrics submit from AI panel onboarding
  const handleLyricsSubmitFromPanel = (lyrics: string) => {
    setState((prev) => ({ ...prev, userProvidedLyrics: lyrics }));
  };

  // Handle creative vision submit from AI panel onboarding - triggers plan generation
  const handleVisionSubmitFromPanel = async (vision: string) => {
    // Update vision in state
    setState((prev) => ({ ...prev, userCreativeVision: vision }));

    // Now generate the full video plan with the user's inputs
    const file = state.audioFile;
    if (!file) return;

    // Get the latest lyrics (may have been set by handleLyricsSubmitFromPanel)
    const currentLyrics = state.userProvidedLyrics;

    setIsProcessing(true);
    setProcessingStatus('Analyzing lyrics...');

    try {
      // Analyze lyrics with the user-provided lyrics
      const { lyrics, metadata } = await analyzeAudioAndGetLyrics(file, currentLyrics);
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

      // Generate full video plan with multi-AI analysis
      setIsGeneratingPlan(true);
      setIsDetectingGenre(true);
      setProcessingStatus('Generating video plan...');

      aiOrchestrator
        .generateFullVideoPlan(
          file,
          currentLyrics,
          vision, // Use the vision parameter directly (most up-to-date)
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
              text: `Video plan created! Genre: ${plan.analysis.consensusGenre} (${Math.round(plan.analysis.confidence * 100)}% confidence). Found ${plan.emotionalPeaks.length} emotional peaks. Review and customize your plan!`,
              timestamp: new Date(),
            },
          ]);
        })
        .catch((err) => {
          console.error('Video plan generation failed:', err);
          // Fall back to just genre detection
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
                  text: `Genre detected: ${result.genre} (${Math.round(result.confidence * 100)}% confidence). Video plan generation failed, but you can still proceed with manual settings.`,
                  timestamp: new Date(),
                },
              ]);
            })
            .catch((genreErr) => {
              console.error('Genre detection also failed:', genreErr);
            });
        })
        .finally(() => {
          setIsGeneratingPlan(false);
          setIsDetectingGenre(false);
          setProcessingStatus('');
        });
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Error analyzing audio. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // --- Lyric Editing Logic ---

  const updateLyric = (index: number, field: keyof LyricLine, value: any) => {
    const newLyrics = [...state.lyrics];
    newLyrics[index] = { ...newLyrics[index], [field]: value };
    setState((prev) => ({ ...prev, lyrics: newLyrics }));
  };

  const applyMotionPreset = (lyricIndex: number, presetIndex: number) => {
    if (presetIndex < 0) return;
    const preset = MOTION_PRESETS[presetIndex];
    updateLyric(lyricIndex, 'keyframes', preset.keyframes);
  };

  const updateKeyframe = (
    lyricIndex: number,
    kfIndex: number,
    field: keyof TextKeyframe,
    value: any
  ) => {
    const line = state.lyrics[lyricIndex];
    if (!line.keyframes) return;
    const newKeyframes = [...line.keyframes];
    newKeyframes[kfIndex] = { ...newKeyframes[kfIndex], [field]: value };
    updateLyric(lyricIndex, 'keyframes', newKeyframes);
  };

  const addKeyframe = (lyricIndex: number) => {
    const line = state.lyrics[lyricIndex];
    const newKeyframes = line.keyframes ? [...line.keyframes] : [];

    // Default to slightly after the last keyframe, or at 0.5/1.0
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
  };

  const removeKeyframe = (lyricIndex: number, kfIndex: number) => {
    const line = state.lyrics[lyricIndex];
    if (!line.keyframes) return;
    const newKeyframes = line.keyframes.filter((_, i) => i !== kfIndex);
    updateLyric(lyricIndex, 'keyframes', newKeyframes);
  };

  const toggleLyricSelection = (index: number) => {
    const newSet = new Set(selectedLyricIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
      // If deselected, clear active keyframe
      setActiveKeyframeIndex(null);
    } else {
      newSet.clear(); // Single select for complex editing focus? No, support multi for bulk actions, single for detailed.
      newSet.add(index);
    }
    setSelectedLyricIndices(newSet);
  };

  const selectAllLyrics = () => {
    if (selectedLyricIndices.size === state.lyrics.length) {
      setSelectedLyricIndices(new Set());
    } else {
      setSelectedLyricIndices(new Set(state.lyrics.map((_, i) => i)));
    }
  };

  // ... (Bulk actions logic remains same as previous step, omitting to save tokens unless requested, but reusing existing functions)
  const applyBulkTimeShift = () => {
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
  };
  const applyTextTransform = (type: 'upper' | 'lower' | 'capitalize') => {
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
  };
  const applyOverride = (type: 'style' | 'palette', value: string | undefined) => {
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
  };
  const updateVisualSetting = <K extends keyof AppState['visualSettings']>(
    key: K,
    value: AppState['visualSettings'][K]
  ) => {
    setState((prev) => ({ ...prev, visualSettings: { ...prev.visualSettings, [key]: value } }));
  };
  const updateFrequencyMapping = (
    key: keyof AppState['visualSettings']['frequencyMapping'],
    value: FrequencyBand
  ) => {
    setState((prev) => ({
      ...prev,
      visualSettings: {
        ...prev.visualSettings,
        frequencyMapping: { ...prev.visualSettings.frequencyMapping, [key]: value },
      },
    }));
  };

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
  const fonts: FontFamily[] = ['Space Grotesk', 'Inter', 'Roboto', 'Montserrat', 'Cinzel'];
  const freqBands: FrequencyBand[] = ['bass', 'mid', 'treble', 'avg'];
  const easings: EasingType[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce'];

  // Callback from visualizer canvas drag
  const onKeyframePositionUpdate = (lyricIndex: number, kfIndex: number, x: number, y: number) => {
    updateKeyframe(lyricIndex, kfIndex, 'x', x);
    updateKeyframe(lyricIndex, kfIndex, 'y', y);
  };

  // Handle background generation (image or video)
  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);

    try {
      if (showGenModal === 'image') {
        const url = await generateBackground(genPrompt, state.aspectRatio, targetSize);
        setState((prev) => ({
          ...prev,
          backgroundAsset: { type: 'image', url, prompt: genPrompt },
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Generated background image: "${genPrompt}"`,
            timestamp: new Date(),
          },
        ]);
      } else if (showGenModal === 'video') {
        const url = await generateVideoBackground(genPrompt, genAspectRatio);
        setState((prev) => ({
          ...prev,
          backgroundAsset: { type: 'video', url, prompt: genPrompt },
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: `Generated background video: "${genPrompt}"`,
            timestamp: new Date(),
          },
        ]);
      }
      setShowGenModal(null);
      setGenPrompt('');
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to generate. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export video - automated flow
  const exportProgressIntervalRef = useRef<number | null>(null);

  const startExport = () => {
    if (!canvasRef.current || !mediaStreamDestRef.current || !audioElementRef.current) return;

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

    // Use framerate from export settings
    const canvasStream = canvasRef.current.captureStream(exportSettings.framerate);
    const audioStream = mediaStreamDestRef.current.stream;

    // Combine canvas video with audio
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
      // Clear progress interval
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }

      const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

      if (exportSettings.format === 'mp4') {
        setExportProgress({ stage: 'converting', percent: 0, message: 'Loading FFmpeg...' });
        try {
          // Import dynamically to avoid loading FFmpeg until needed
          const { convertWebMToMP4 } = await import('./services/ffmpegService');
          setExportProgress({ stage: 'converting', percent: 5, message: 'Converting to MP4...' });
          const mp4Blob = await convertWebMToMP4(webmBlob, {
            quality: exportSettings.quality,
            framerate: exportSettings.framerate,
            onProgress: (percent) => {
              // Scale progress from 5-95% to leave room for loading and finalizing
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
        } catch (error) {
          console.error('MP4 conversion failed:', error);
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: 'MP4 conversion failed. Downloading as WebM instead.',
              timestamp: new Date(),
            },
          ]);
          // Fallback to WebM
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

    // Auto-stop when audio ends
    const handleAudioEnded = () => {
      audio.removeEventListener('ended', handleAudioEnded);
      // Small delay to ensure final frames are captured
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setState((prev) => ({ ...prev, isRecording: false, isPlaying: false }));
      }, 100);
    };

    audio.addEventListener('ended', handleAudioEnded);

    // Start recording
    mediaRecorderRef.current = recorder;
    recorder.start();

    // Seek to beginning and play
    audio.currentTime = 0;
    audio.play();

    setState((prev) => ({ ...prev, isRecording: true, isPlaying: true }));
    setShowExportSettings(false);

    // Update progress based on playback position
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
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to download a blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cancel export
  const cancelExport = () => {
    // Stop the recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop and reset audio
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }

    // Clear progress interval
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
  };

  // Handle microphone transcription
  const startMicRecording = async () => {
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
        } catch (err) {
          console.error(err);
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
    } catch (err) {
      console.error('Mic access denied:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Microphone access denied.', timestamp: new Date() },
      ]);
    }
  };

  const stopMicRecording = () => {
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      micRecorderRef.current.stop();
    }
    setIsRecordingMic(false);
  };

  // Handle image analysis
  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const analysis = await analyzeImage(file);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: `Image Analysis:\n${analysis}`, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to analyze image.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle lyric sync with precision
  const handleLyricSync = async () => {
    if (!state.audioFile) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Please upload an audio file first.', timestamp: new Date() },
      ]);
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    try {
      const result = await syncLyricsWithPrecision(
        state.audioFile,
        {
          precision: state.syncPrecision,
          userLyrics: state.userProvidedLyrics || undefined,
        },
        (progress) => {
          setState((prev) => ({ ...prev, syncProgress: progress }));
        }
      );

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
    } catch (err) {
      console.error('Sync failed:', err);
      setState((prev) => ({ ...prev, isSyncing: false, syncProgress: 0 }));
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to sync lyrics. Please try again.', timestamp: new Date() },
      ]);
    }
  };

  // Handle lyric update from WaveformEditor
  const handleLyricUpdate = (index: number, updates: Partial<LyricLine>) => {
    setState((prev) => ({
      ...prev,
      lyrics: prev.lyrics.map((l, i) => (i === index ? { ...l, ...updates } : l)),
    }));
  };

  // --- Video Plan Handlers ---

  const handleRegeneratePlan = async () => {
    if (!state.audioFile) return;

    setIsGeneratingPlan(true);
    try {
      const plan = await aiOrchestrator.generateFullVideoPlan(
        state.audioFile,
        state.userProvidedLyrics,
        state.userCreativeVision,
        state.aspectRatio,
        (status) => {
          setChatMessages((prev) => [
            ...prev,
            { role: 'model', text: status, timestamp: new Date() },
          ]);
        }
      );

      if (videoPlan) {
        setVideoPlanHistory((prev) => [...prev, videoPlan]);
      }
      setVideoPlan(plan);
    } catch (err) {
      console.error('Failed to regenerate plan:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to regenerate video plan.', timestamp: new Date() },
      ]);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleApplyPlan = () => {
    if (!videoPlan) return;

    // Apply visual settings from plan
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

    // Mark plan as applied
    setVideoPlan({ ...videoPlan, status: 'applied' });

    setChatMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: 'Video plan applied! Your settings have been updated.',
        timestamp: new Date(),
      },
    ]);
  };

  const handleModifyPlanViaChat = async (instruction: string) => {
    if (!videoPlan) return;

    try {
      const modifiedPlan = await modifyVideoPlan(videoPlan, instruction);
      setVideoPlanHistory((prev) => [...prev, videoPlan]);
      setVideoPlan(modifiedPlan);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: `Plan updated: ${modifiedPlan.summary}`, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error('Failed to modify plan:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Failed to modify the plan. Please try again.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleMoodEdit = (mood: VideoPlanMood) => {
    if (!videoPlan) return;
    setVideoPlanHistory((prev) => [...prev, videoPlan]);
    setVideoPlan({ ...videoPlan, mood, version: videoPlan.version + 1 });
  };

  const handlePaletteEdit = (colorPalette: VideoPlanColorPalette) => {
    if (!videoPlan) return;
    setVideoPlanHistory((prev) => [...prev, videoPlan]);
    setVideoPlan({ ...videoPlan, colorPalette, version: videoPlan.version + 1 });
  };

  const handleStyleEdit = (visualStyle: VideoPlanVisualStyle) => {
    if (!videoPlan) return;
    setVideoPlanHistory((prev) => [...prev, videoPlan]);
    setVideoPlan({ ...videoPlan, visualStyle, version: videoPlan.version + 1 });
  };

  const handleRegeneratePeakVisual = async (peak: EmotionalPeak) => {
    if (!videoPlan) return;

    setRegeneratingPeakId(peak.id);
    try {
      const newVisual = await aiOrchestrator.regeneratePeakVisual(
        peak,
        state.lyrics,
        videoPlan,
        state.aspectRatio
      );

      setVideoPlan((prev) => {
        if (!prev) return prev;
        const existingIndex = prev.hybridVisuals.peakVisuals.findIndex((v) => v.peakId === peak.id);
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
    } catch (err) {
      console.error('Failed to regenerate peak visual:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to generate peak visual.', timestamp: new Date() },
      ]);
    } finally {
      setRegeneratingPeakId(null);
    }
  };

  // Handle background type toggle (video ↔ image)
  const handleBackgroundToggle = async () => {
    if (!videoPlan || !state.audioFile) return;

    const newUseVideo = !videoPlan.backgroundStrategy.useVideo;
    setIsRegeneratingBackground(true);

    try {
      // Update strategy
      const newStrategy = {
        ...videoPlan.backgroundStrategy,
        useVideo: newUseVideo,
        reasoning: newUseVideo
          ? 'User switched to motion video background'
          : 'User switched to static image background',
      };

      // Generate new background
      let newBackground = null;
      if (newUseVideo && videoPlan.backgroundStrategy.videoPrompt) {
        const videoUrl = await generateVideoBackground(
          videoPlan.backgroundStrategy.videoPrompt,
          state.aspectRatio === '9:16' ? '9:16' : '16:9'
        );
        newBackground = {
          type: 'video' as const,
          url: videoUrl,
          prompt: videoPlan.backgroundStrategy.videoPrompt,
        };
      } else if (!newUseVideo && videoPlan.backgroundStrategy.imagePrompt) {
        const imageUrl = await generateBackground(
          videoPlan.backgroundStrategy.imagePrompt,
          state.aspectRatio,
          '2K'
        );
        newBackground = {
          type: 'image' as const,
          url: imageUrl,
          prompt: videoPlan.backgroundStrategy.imagePrompt,
        };
      }

      setVideoPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          backgroundStrategy: newStrategy,
          hybridVisuals: { ...prev.hybridVisuals, sharedBackground: newBackground },
        };
      });
    } catch (err) {
      console.error('Failed to toggle background:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to generate new background.', timestamp: new Date() },
      ]);
    } finally {
      setIsRegeneratingBackground(false);
    }
  };

  // Handle background regeneration
  const handleBackgroundRegenerate = async () => {
    if (!videoPlan || !state.audioFile) return;

    setIsRegeneratingBackground(true);

    try {
      let newBackground = null;
      if (videoPlan.backgroundStrategy.useVideo && videoPlan.backgroundStrategy.videoPrompt) {
        const videoUrl = await generateVideoBackground(
          videoPlan.backgroundStrategy.videoPrompt,
          state.aspectRatio === '9:16' ? '9:16' : '16:9'
        );
        newBackground = {
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
          '2K'
        );
        newBackground = {
          type: 'image' as const,
          url: imageUrl,
          prompt: videoPlan.backgroundStrategy.imagePrompt,
        };
      }

      setVideoPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hybridVisuals: { ...prev.hybridVisuals, sharedBackground: newBackground },
        };
      });
    } catch (err) {
      console.error('Failed to regenerate background:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Failed to regenerate background.', timestamp: new Date() },
      ]);
    } finally {
      setIsRegeneratingBackground(false);
    }
  };

  // Handle chat submit - extracted for reuse
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user' as const, text: chatInput, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      const response = await sendChatMessage(history, chatInput);

      if (response.text) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: response.text || '', timestamp: new Date() },
        ]);
      }

      // Handle function calls
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'generateBackgroundImage') {
            const args = call.args as Record<string, unknown>;
            setChatMessages((prev) => [
              ...prev,
              {
                role: 'model',
                text: `Generating background image: ${args.prompt}...`,
                timestamp: new Date(),
              },
            ]);
            const url = await generateBackground(
              args.prompt as string,
              (args.aspectRatio as AspectRatio) || '16:9',
              (args.resolution as ImageSize) || '1K'
            );
            setState((prev) => ({
              ...prev,
              backgroundAsset: { type: 'image', url, prompt: args.prompt as string },
            }));
            setChatMessages((prev) => [
              ...prev,
              { role: 'model', text: `Background generated!`, timestamp: new Date() },
            ]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Track audio duration
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

    // If already loaded
    if (audio.duration) {
      setAudioDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [state.audioUrl]);

  // Render new UI if enabled
  if (useNewUI) {
    return (
      <>
        <LyricalFlowWrapper
          state={state}
          setState={setState}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onChatSubmit={handleChatSubmit}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          isProcessing={isProcessing}
          onFileUpload={handleFileUpload}
          onImageAnalysis={handleImageAnalysis}
          onShowGenModal={setShowGenModal}
          audioRef={audioElementRef}
          duration={audioDuration}
          canvasRef={canvasRef}
          mediaStreamDestRef={mediaStreamDestRef}
        />

        {/* Hidden audio element */}
        {state.audioUrl && <audio ref={audioElementRef} src={state.audioUrl} className="hidden" />}

        {/* UI Toggle Button */}
        <button
          onClick={() => setUseNewUI(false)}
          className="fixed bottom-4 left-4 z-50 px-3 py-1.5 rounded-full text-xs bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          Switch to Classic UI
        </button>

        {/* Generation Modal */}
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  Generate {showGenModal === 'image' ? 'Background Image' : 'Background Video'}
                </h3>
                <button
                  onClick={() => setShowGenModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-pink-500 outline-none h-24 resize-none mb-4"
                placeholder="Describe your background..."
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !genPrompt.trim()}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isGenerating || !genPrompt.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate {showGenModal === 'image' ? 'Image' : 'Video'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Video Plan Panel */}
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
            onFileDrop={handleFileDrop}
            onLyricsSubmit={handleLyricsSubmitFromPanel}
            onVisionSubmit={handleVisionSubmitFromPanel}
            processingStatus={processingStatus}
            isProcessingAudio={isProcessing}
          />
        )}
      </>
    );
  }

  // Classic UI toggle button (shown in classic mode)
  const ClassicUIToggle = (
    <button
      onClick={() => setUseNewUI(true)}
      className="fixed bottom-4 left-4 z-50 px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition"
    >
      Try New UI
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden font-sans">
      {/* BACKGROUND AMBIENCE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px]"></div>
      </div>

      {/* LEFT: STUDIO PANEL */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-slate-900/80 backdrop-blur-xl z-10">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
            LYRICAL FLOW
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-widest mt-1 uppercase">
            AI Studio Pro
          </p>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. SETUP */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              01. Source Material
            </h3>
            {!state.audioFile && (
              <>
                {/* Creative Vision Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3 text-purple-400" />
                    Creative Vision (Optional)
                  </label>
                  <textarea
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-slate-300 focus:border-purple-500 outline-none transition-colors resize-none h-20"
                    placeholder="Describe your vision: 'Dark and moody with neon accents' or leave blank for AI to decide..."
                    value={state.userCreativeVision}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, userCreativeVision: e.target.value }))
                    }
                  />
                </div>
                {/* Lyrics Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 flex items-center gap-1">
                    <LanguageIcon className="w-3 h-3 text-pink-400" />
                    Lyrics (Optional)
                  </label>
                  <textarea
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-slate-300 focus:border-pink-500 outline-none transition-colors resize-none h-24"
                    placeholder="Paste accurate lyrics here for perfect sync..."
                    value={state.userProvidedLyrics}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, userProvidedLyrics: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <label className="relative flex flex-col items-center justify-center h-20 bg-slate-900 rounded-xl cursor-pointer border border-white/10 hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-2">
                  <MusicalNoteIcon className="w-5 h-5 text-pink-500" />
                  <span className="text-sm font-semibold text-white">
                    {state.audioFile ? 'Change Song' : 'Upload Audio'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Mic & Image Analysis Buttons */}
            <div className="flex gap-2">
              <button
                onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                  isRecordingMic
                    ? 'bg-red-500/20 border-red-500 text-red-300 animate-mic-pulse'
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <MicrophoneIcon className="w-4 h-4" />
                {isRecordingMic ? 'Stop' : 'Speak Lyrics'}
              </button>

              <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-slate-800 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition-all">
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
          </div>

          {/* LYRIC SYNC - Show when audio is uploaded */}
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

          {/* 2. VISUAL DIRECTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              02. Visual Direction
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(VisualStyle).map((style) => (
                <button
                  key={style}
                  onClick={() => setState((prev) => ({ ...prev, currentStyle: style }))}
                  className={`p-3 text-xs font-medium rounded-lg border transition-all duration-300 ${
                    state.currentStyle === style
                      ? 'border-pink-500 bg-pink-500/10 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {style.replace('_', ' ')}
                </button>
              ))}
            </div>
            {/* Aspect Ratio */}
            <div className="flex gap-2">
              {['9:16', '16:9', '1:1'].map((ar) => (
                <button
                  key={ar}
                  onClick={() => setState((prev) => ({ ...prev, aspectRatio: ar as AspectRatio }))}
                  className={`flex-1 py-1 text-xs rounded border ${state.aspectRatio === ar ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-slate-500'}`}
                >
                  {ar}
                </button>
              ))}
            </div>

            {/* Generate Background Button */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowGenModal('image')}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-xs font-medium transition-all"
              >
                <PhotoIcon className="w-4 h-4" />
                Generate BG
              </button>
              <button
                onClick={() => setShowGenModal('video')}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-medium transition-all"
              >
                <VideoCameraIcon className="w-4 h-4" />
                Generate Video
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                03. FX Customization
              </h3>
            </div>

            {/* Color Palette */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Color Palette</label>
              <div className="flex gap-1 flex-wrap">
                {(['neon', 'sunset', 'ocean', 'matrix', 'fire'] as ColorPalette[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateVisualSetting('palette', p)}
                    className={`px-2 py-1 text-[10px] rounded border capitalize ${state.visualSettings.palette === p ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-slate-800 border-white/5 text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Styling Group */}
            <div className="mt-3 p-2 bg-white/5 rounded border border-white/5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <LanguageIcon className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Text Styling
                </span>
              </div>

              {/* Font Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400">Font Family</label>
                <select
                  value={state.visualSettings.fontFamily}
                  onChange={(e) => updateVisualSetting('fontFamily', e.target.value as FontFamily)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-purple-500 transition-colors"
                >
                  {fonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Animation */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400">Entry Animation</label>
                <div className="grid grid-cols-2 gap-1">
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
                      className={`px-2 py-1 text-[9px] rounded border transition-all ${state.visualSettings.textAnimation === anim ? 'bg-pink-500/20 border-pink-500 text-pink-200' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-white/5'}`}
                    >
                      {anim.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Animation Speed</span>
                  <span>{state.visualSettings.particleSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={state.visualSettings.particleSpeed}
                  onChange={(e) => updateVisualSetting('particleSpeed', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Reactivity Intensity</span>
                  <span>{state.visualSettings.intensity}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={state.visualSettings.intensity}
                  onChange={(e) => updateVisualSetting('intensity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
            </div>

            {/* Camera Shake Toggle & Intensity */}
            <div className="flex flex-col gap-2 mt-2 p-2 bg-white/5 rounded border border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Bass Camera Shake</span>
                <button
                  onClick={() =>
                    updateVisualSetting('cameraShake', !state.visualSettings.cameraShake)
                  }
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${state.visualSettings.cameraShake ? 'bg-red-500' : 'bg-slate-700'}`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.cameraShake ? 'translate-x-4' : 'translate-x-0'}`}
                  ></div>
                </button>
              </div>

              {state.visualSettings.cameraShake && (
                <div className="animate-fadeIn">
                  <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                    <span>Shake Intensity</span>
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
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              )}
            </div>

            {/* Dynamic BG Opacity Toggle */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 p-1 bg-white/5 rounded">
              <span>Dynamic Background Pulse</span>
              <button
                onClick={() =>
                  updateVisualSetting(
                    'dynamicBackgroundOpacity',
                    !state.visualSettings.dynamicBackgroundOpacity
                  )
                }
                className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${state.visualSettings.dynamicBackgroundOpacity ? 'bg-pink-500' : 'bg-slate-700'}`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.dynamicBackgroundOpacity ? 'translate-x-4' : 'translate-x-0'}`}
                ></div>
              </button>
            </div>

            {/* Particle Trails Toggle */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 p-1 bg-white/5 rounded">
              <span>Particle Trails</span>
              <button
                onClick={() =>
                  updateVisualSetting('trailsEnabled', !state.visualSettings.trailsEnabled)
                }
                className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${state.visualSettings.trailsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${state.visualSettings.trailsEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                ></div>
              </button>
            </div>

            {/* Advanced Audio Reactivity */}
            <div className="mt-3 p-2 bg-white/5 rounded border border-white/5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <SpeakerWaveIcon className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Frequency Mapping
                </span>
              </div>

              {/* Pulse Mapping */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <BoltIcon className="w-3 h-3 text-pink-400" />
                  <span className="text-[10px] text-slate-400">Pulse</span>
                </div>
                <select
                  value={state.visualSettings.frequencyMapping.pulse}
                  onChange={(e) => updateFrequencyMapping('pulse', e.target.value as FrequencyBand)}
                  className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none"
                >
                  {freqBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motion Mapping */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 pl-4">Motion</span>
                <select
                  value={state.visualSettings.frequencyMapping.motion}
                  onChange={(e) =>
                    updateFrequencyMapping('motion', e.target.value as FrequencyBand)
                  }
                  className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none"
                >
                  {freqBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Mapping */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 pl-4">Color</span>
                <select
                  value={state.visualSettings.frequencyMapping.color}
                  onChange={(e) => updateFrequencyMapping('color', e.target.value as FrequencyBand)}
                  className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none"
                >
                  {freqBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blend Mode */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400">Blend Mode</span>
                <select
                  value={state.visualSettings.backgroundBlendMode}
                  onChange={(e) =>
                    updateVisualSetting('backgroundBlendMode', e.target.value as BlendMode)
                  }
                  className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] text-slate-300 outline-none"
                >
                  {blendModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. EFFECT STUDIO */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              04. Effect Studio
            </h3>
            <EffectPanel
              lyricEffects={state.lyricEffects}
              backgroundEffects={state.backgroundEffects}
              detectedGenre={state.detectedGenre}
              genreConfidence={0.85}
              genreOverride={state.genreOverride}
              isDetectingGenre={isDetectingGenre}
              onLyricEffectsChange={(effects) =>
                setState((prev) => ({ ...prev, lyricEffects: effects }))
              }
              onBackgroundEffectsChange={(effects) =>
                setState((prev) => ({ ...prev, backgroundEffects: effects }))
              }
              onGenreOverride={(genre) => setState((prev) => ({ ...prev, genreOverride: genre }))}
            />
          </div>

          {/* 5. LYRICS EDITOR */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                05. Timeline
              </h3>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  if (editMode) setSelectedLyricIndices(new Set());
                }}
                className={`text-xs flex items-center gap-1 transition-colors ${editMode ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <PencilSquareIcon className="w-3 h-3" />
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Bulk Action Bar */}
            {editMode && (
              <div className="p-2 bg-slate-800/50 rounded-lg border border-white/5 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px]">
                  <button
                    onClick={selectAllLyrics}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <ListBulletIcon className="w-3 h-3" />
                    {selectedLyricIndices.size === state.lyrics.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <span className="text-slate-500">{selectedLyricIndices.size} selected</span>
                </div>

                {/* Time Shift Controls */}
                {selectedLyricIndices.size > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400">Time Shift (sec)</span>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={bulkTimeShift}
                        onChange={(e) => setBulkTimeShift(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-cyan-400 w-16"
                        placeholder="0.1"
                      />
                      <button
                        onClick={applyBulkTimeShift}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] rounded font-medium"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Text Transform */}
                    <div className="flex items-center gap-1 pt-2">
                      <span className="text-[10px] text-slate-400 mr-1">Text:</span>
                      <button
                        onClick={() => applyTextTransform('upper')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-[9px] rounded text-slate-300"
                      >
                        UPPER
                      </button>
                      <button
                        onClick={() => applyTextTransform('lower')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-[9px] rounded text-slate-300"
                      >
                        lower
                      </button>
                      <button
                        onClick={() => applyTextTransform('capitalize')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-[9px] rounded text-slate-300"
                      >
                        Title
                      </button>
                    </div>

                    {/* Style Override */}
                    <div className="flex flex-col gap-1 pt-2">
                      <span className="text-[10px] text-slate-400">Style Override</span>
                      <select
                        onChange={(e) => applyOverride('style', e.target.value || undefined)}
                        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none"
                        defaultValue=""
                      >
                        <option value="">No Override</option>
                        {Object.values(VisualStyle).map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Palette Override */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Palette Override</span>
                      <select
                        onChange={(e) => applyOverride('palette', e.target.value || undefined)}
                        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none"
                        defaultValue=""
                      >
                        <option value="">No Override</option>
                        {(['neon', 'sunset', 'ocean', 'matrix', 'fire'] as ColorPalette[]).map(
                          (p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="h-96 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
              {state.lyrics.map((line, idx) => {
                const isActive =
                  state.currentTime >= line.startTime && state.currentTime <= line.endTime;
                const isSelected = editMode && selectedLyricIndices.has(idx);

                let containerClass = 'hover:bg-white/5 border-l-2 border-transparent border';
                if (isSelected) {
                  containerClass =
                    'bg-pink-500/10 border border-pink-500/30 border-l-2 border-l-pink-500';
                } else if (isActive) {
                  containerClass =
                    'bg-gradient-to-r from-pink-500/20 to-transparent border-l-2 border-pink-500';
                } else {
                  // Apply section coloring when not active/selected
                  containerClass = `${getSectionColorStyle(line.section)} border border-transparent border-l-2`;
                }

                return (
                  <div
                    key={idx}
                    className={`relative p-2 rounded text-xs transition-all flex flex-col gap-2 overflow-hidden ${containerClass}`}
                    onClick={() => {
                      if (editMode) {
                        toggleLyricSelection(idx);
                      } else if (audioElementRef.current) {
                        audioElementRef.current.currentTime = line.startTime;
                        if (!state.isPlaying) setState((prev) => ({ ...prev, isPlaying: true }));
                      }
                    }}
                  >
                    {/* Waveform Behind Text */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                      <Waveform
                        audioBuffer={state.audioBuffer}
                        startTime={line.startTime}
                        endTime={line.endTime}
                        color={line.sentimentColor || '#ec4899'}
                      />
                    </div>

                    <div className="flex gap-2 w-full relative z-10">
                      {editMode && (
                        <div
                          className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full border flex items-center justify-center ${selectedLyricIndices.has(idx) ? 'bg-pink-500 border-pink-500' : 'border-slate-600 bg-black/30'}`}
                        >
                          {selectedLyricIndices.has(idx) && (
                            <CheckCircleIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {editMode && isSelected ? (
                          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 mb-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={line.startTime}
                                  onChange={(e) =>
                                    updateLyric(idx, 'startTime', parseFloat(e.target.value))
                                  }
                                  className="w-12 bg-black/50 text-cyan-400 p-1 rounded border border-white/10 text-[10px]"
                                />
                                <span className="text-slate-600">-</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={line.endTime}
                                  onChange={(e) =>
                                    updateLyric(idx, 'endTime', parseFloat(e.target.value))
                                  }
                                  className="w-12 bg-black/50 text-cyan-400 p-1 rounded border border-white/10 text-[10px]"
                                />
                              </div>

                              {/* Section Dropdown */}
                              <select
                                value={line.section || ''}
                                onChange={(e) => updateLyric(idx, 'section', e.target.value)}
                                className="flex-1 bg-black/50 text-slate-300 p-1 rounded border border-white/10 text-[10px] outline-none"
                              >
                                <option value="">No Section</option>
                                {MUSIC_SECTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <input
                              type="text"
                              value={line.text}
                              onChange={(e) => updateLyric(idx, 'text', e.target.value)}
                              className="w-full bg-black/50 text-white p-1 rounded border border-white/10 text-[10px]"
                            />

                            {!selectedLyricIndices.has(idx) &&
                              line.keyframes &&
                              line.keyframes.length > 0 && (
                                <div className="text-[9px] text-cyan-500 flex items-center gap-1 mt-1 font-mono">
                                  <SparklesIcon className="w-3 h-3" />
                                  <span>Motion Active</span>
                                </div>
                              )}

                            {selectedLyricIndices.has(idx) && (
                              <>
                                <div className="flex flex-col gap-2 mt-2 bg-black/40 p-2 rounded border border-white/5">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                                      Motion Presets
                                    </span>
                                    <button
                                      onClick={() => addKeyframe(idx)}
                                      className="p-1 text-cyan-400 hover:text-white"
                                    >
                                      <PlusCircleIcon className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1 mb-2">
                                    {MOTION_PRESETS.map((p, pIdx) => (
                                      <button
                                        key={pIdx}
                                        onClick={() => applyMotionPreset(idx, pIdx)}
                                        className="px-1 py-1 text-[8px] bg-slate-800 hover:bg-cyan-600 hover:text-white rounded border border-white/5 transition-colors text-slate-400 truncate"
                                        title={p.label}
                                      >
                                        {p.label}
                                      </button>
                                    ))}
                                  </div>

                                  {line.keyframes &&
                                    line.keyframes.map((kf, kfIdx) => (
                                      <div
                                        key={kfIdx}
                                        onClick={() => setActiveKeyframeIndex(kfIdx)}
                                        className={`grid grid-cols-4 gap-2 items-center text-[9px] p-2 rounded border border-transparent ${activeKeyframeIndex === kfIdx ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/20'}`}
                                      >
                                        <div className="col-span-4 flex justify-between items-center pb-1 mb-1 border-b border-white/5">
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 font-bold">
                                              Keyframe {kfIdx + 1}
                                            </span>
                                            {activeKeyframeIndex === kfIdx && (
                                              <CursorArrowRaysIcon className="w-3 h-3 text-cyan-400 animate-pulse" />
                                            )}
                                          </div>
                                          <button
                                            onClick={() => removeKeyframe(idx, kfIdx)}
                                            className="text-red-500 hover:text-red-400"
                                          >
                                            <TrashIcon className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <div className="col-span-2">
                                          <label className="text-slate-600 block mb-0.5">
                                            Time (0-1)
                                          </label>
                                          <input
                                            type="number"
                                            step="0.05"
                                            min="0"
                                            max="1"
                                            value={kf.time}
                                            onChange={(e) =>
                                              updateKeyframe(
                                                idx,
                                                kfIdx,
                                                'time',
                                                parseFloat(e.target.value)
                                              )
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-cyan-300"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-slate-600 block mb-0.5">
                                            Ease
                                          </label>
                                          <select
                                            value={kf.easing || 'linear'}
                                            onChange={(e) =>
                                              updateKeyframe(idx, kfIdx, 'easing', e.target.value)
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-slate-300"
                                          >
                                            {easings.map((e) => (
                                              <option key={e} value={e}>
                                                {e}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Opacity Control - Enhanced */}
                                        <div className="col-span-4">
                                          <div className="flex justify-between text-slate-600 mb-0.5">
                                            <span>Opacity</span>
                                            <span className="text-cyan-500">{kf.opacity}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="range"
                                              min="0"
                                              max="1"
                                              step="0.1"
                                              value={kf.opacity}
                                              onChange={(e) =>
                                                updateKeyframe(
                                                  idx,
                                                  kfIdx,
                                                  'opacity',
                                                  parseFloat(e.target.value)
                                                )
                                              }
                                              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="text-slate-600 block mb-0.5">
                                            Scale
                                          </label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={kf.scale}
                                            onChange={(e) =>
                                              updateKeyframe(
                                                idx,
                                                kfIdx,
                                                'scale',
                                                parseFloat(e.target.value)
                                              )
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-slate-300"
                                          />
                                        </div>

                                        <div className="col-span-1">
                                          <label className="text-slate-600 block mb-0.5">
                                            Rot deg
                                          </label>
                                          <input
                                            type="number"
                                            step="15"
                                            value={kf.rotation}
                                            onChange={(e) =>
                                              updateKeyframe(
                                                idx,
                                                kfIdx,
                                                'rotation',
                                                parseFloat(e.target.value)
                                              )
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-slate-300"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-slate-600 block mb-0.5">X</label>
                                          <input
                                            type="number"
                                            step="10"
                                            value={kf.x}
                                            onChange={(e) =>
                                              updateKeyframe(
                                                idx,
                                                kfIdx,
                                                'x',
                                                parseFloat(e.target.value)
                                              )
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-slate-300"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-slate-600 block mb-0.5">Y</label>
                                          <input
                                            type="number"
                                            step="10"
                                            value={kf.y}
                                            onChange={(e) =>
                                              updateKeyframe(
                                                idx,
                                                kfIdx,
                                                'y',
                                                parseFloat(e.target.value)
                                              )
                                            }
                                            className="w-full bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-slate-300"
                                          />
                                        </div>
                                      </div>
                                    ))}

                                  {/* ADD KEYFRAME BUTTON */}
                                  <button
                                    onClick={() => addKeyframe(idx)}
                                    className="w-full mt-2 py-1.5 border border-dashed border-slate-700 hover:border-cyan-500 text-[10px] text-slate-400 hover:text-cyan-400 rounded transition-colors flex items-center justify-center gap-1 bg-slate-800/50 hover:bg-cyan-950/20"
                                  >
                                    <PlusCircleIcon className="w-3 h-3" />
                                    Add New Keyframe
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="cursor-pointer w-full">
                            <div className="flex justify-between items-end mb-0.5">
                              <span className="text-[10px] text-cyan-500 font-mono">
                                {line.startTime.toFixed(1)}s
                              </span>
                              {line.section && (
                                <span
                                  className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-black/30 border border-white/5 ${line.section.includes('Chorus') ? 'text-pink-400' : 'text-slate-500'}`}
                                >
                                  {line.section}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {line.sentimentColor && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: line.sentimentColor }}
                                ></div>
                              )}
                              <div className="text-slate-300 leading-tight truncate relative z-10 font-medium drop-shadow-md">
                                {line.text}
                              </div>
                            </div>
                            {line.keyframes && (
                              <div className="mt-1 h-0.5 w-full bg-cyan-500/30 rounded"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: PREVIEW & CHAT */}
      <div className="flex-1 flex flex-col relative bg-black">
        {/* Main Stage */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
          <Visualizer
            ref={canvasRef}
            audioUrl={state.audioUrl}
            lyrics={state.lyrics}
            currentTime={state.currentTime}
            isPlaying={state.isPlaying}
            style={state.currentStyle}
            backgroundAsset={state.backgroundAsset}
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-2xl z-20">
            <button
              onClick={() => {
                if (audioElementRef.current && !state.isRecording) {
                  audioElementRef.current.currentTime = 0;
                }
              }}
              disabled={state.isRecording}
              className={`text-slate-400 ${state.isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
              title={state.isRecording ? 'Disabled during export' : 'Restart'}
            >
              <ArrowUpTrayIcon className="w-5 h-5 -rotate-90" />
            </button>

            <button
              onClick={togglePlay}
              disabled={state.isRecording}
              className={`w-12 h-12 flex items-center justify-center bg-white text-black rounded-full transition-transform ${
                state.isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
              title={
                state.isRecording ? 'Disabled during export' : state.isPlaying ? 'Pause' : 'Play'
              }
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
                disabled={state.isRecording}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  if (audioElementRef.current) audioElementRef.current.currentTime = t;
                  setState((prev) => ({ ...prev, currentTime: t }));
                }}
                className={`w-full h-1 bg-slate-700 rounded-lg appearance-none accent-pink-500 ${
                  state.isRecording ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{new Date(state.currentTime * 1000).toISOString().substr(14, 5)}</span>
                <span>
                  {audioElementRef.current?.duration
                    ? new Date(audioElementRef.current.duration * 1000).toISOString().substr(14, 5)
                    : '00:00'}
                </span>
              </div>
            </div>

            {/* Export Settings Toggle */}
            <button
              onClick={() => setShowExportSettings(!showExportSettings)}
              className={`p-2 rounded-full transition-all ${
                showExportSettings
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Export Settings"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
            </button>

            {/* Export Video Button */}
            <button
              onClick={state.isRecording ? cancelExport : startExport}
              disabled={!state.audioUrl}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                state.isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : state.audioUrl
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {state.isRecording ? (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <FilmIcon className="w-4 h-4" />
                  Export Video
                </>
              )}
            </button>
          </div>

          {/* Export Progress Indicator (always visible when exporting) */}
          {exportProgress && !showExportSettings && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur border border-purple-500/30 rounded-xl px-4 py-3 z-30 min-w-64">
              <div className="flex justify-between text-xs text-purple-200 mb-2">
                <span>{exportProgress.message}</span>
                <span>{exportProgress.percent}%</span>
              </div>
              <div className="w-full bg-purple-900/50 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Export Settings Panel (popover) */}
          {showExportSettings && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-96 z-30">
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

          {/* Waveform Editor Toggle */}
          {state.audioBuffer && (
            <button
              onClick={() => setShowWaveformEditor(!showWaveformEditor)}
              className={`absolute top-6 right-36 p-3 bg-slate-900/80 backdrop-blur border rounded-full transition-colors z-20 ${
                showWaveformEditor
                  ? 'border-purple-500/50 text-purple-400'
                  : 'border-white/10 text-white hover:bg-white/10'
              }`}
              title={showWaveformEditor ? 'Hide Waveform Editor' : 'Show Waveform Editor'}
            >
              <SpeakerWaveIcon className="w-6 h-6" />
            </button>
          )}

          {/* Timeline Toggle */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`absolute top-6 right-20 p-3 bg-slate-900/80 backdrop-blur border rounded-full transition-colors z-20 ${
              showTimeline
                ? 'border-cyan-500/50 text-cyan-400'
                : 'border-white/10 text-white hover:bg-white/10'
            }`}
            title={showTimeline ? 'Hide Timeline' : 'Show Timeline'}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
              <circle cx="9" cy="6" r="2" fill="currentColor" />
              <circle cx="15" cy="12" r="2" fill="currentColor" />
              <circle cx="6" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="absolute top-6 right-6 p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 transition-colors z-20"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Timeline */}
        {showTimeline && (
          <Timeline
            duration={audioElementRef.current?.duration || 100}
            currentTime={state.currentTime}
            onSeek={(t) => {
              if (audioElementRef.current) audioElementRef.current.currentTime = t;
              setState((prev) => ({ ...prev, currentTime: t }));
            }}
            isPlaying={state.isPlaying}
            onPlayPause={togglePlay}
            lyrics={state.lyrics}
            onLyricKeyframesChange={(index, keyframes) => {
              setState((prev) => ({
                ...prev,
                lyrics: prev.lyrics.map((l, i) => (i === index ? { ...l, keyframes } : l)),
              }));
            }}
            selectedLyricIndex={selectedTimelineLyricIndex}
            onSelectLyric={setSelectedTimelineLyricIndex}
          />
        )}

        {/* Waveform Editor */}
        {showWaveformEditor && state.audioBuffer && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur border-t border-white/10">
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

        {/* CHAT PANEL */}
        {chatOpen && (
          <div className="w-80 border-l border-white/10 bg-slate-900/90 backdrop-blur-xl absolute right-0 top-0 bottom-0 z-30 flex flex-col shadow-2xl transition-transform duration-300">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                AI Director
              </h3>
              <button onClick={() => setChatOpen(false)}>
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-pink-500 text-white rounded-br-none' : 'bg-slate-800 text-slate-300 rounded-bl-none'}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-600 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                  <SparklesIcon className="w-4 h-4" /> Thinking...
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  const userMsg = { role: 'user' as const, text: chatInput, timestamp: new Date() };
                  setChatMessages((prev) => [...prev, userMsg]);
                  setChatInput('');
                  setIsProcessing(true);

                  try {
                    const history = chatMessages.map((m) => ({
                      role: m.role,
                      parts: [{ text: m.text }],
                    }));
                    // history passed to API should not include the current message if sendMessage is used with the text.
                    const response = await sendChatMessage(history, chatInput);

                    if (response.text) {
                      setChatMessages((prev) => [
                        ...prev,
                        { role: 'model', text: response.text || '', timestamp: new Date() },
                      ]);
                    }

                    // Handle function calls
                    if (response.functionCalls) {
                      for (const call of response.functionCalls) {
                        if (call.name === 'generateBackgroundImage') {
                          const args = call.args as any;
                          setChatMessages((prev) => [
                            ...prev,
                            {
                              role: 'model',
                              text: `Generating background image: ${args.prompt}...`,
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
                            { role: 'model', text: `Background generated!`, timestamp: new Date() },
                          ]);
                        }
                      }
                    }
                  } catch (err) {
                    console.error(err);
                    setChatMessages((prev) => [
                      ...prev,
                      {
                        role: 'model',
                        text: 'Sorry, I encountered an error.',
                        timestamp: new Date(),
                      },
                    ]);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="relative"
              >
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-3 text-xs text-white focus:border-pink-500 outline-none"
                  placeholder="Ask for ideas..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-pink-500 rounded-full text-white hover:bg-pink-600"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* GENERATION MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {showGenModal === 'image' ? (
                  <>
                    <PhotoIcon className="w-5 h-5 text-purple-400" />
                    Generate Image
                  </>
                ) : (
                  <>
                    <FilmIcon className="w-5 h-5 text-cyan-400" />
                    Generate Video
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
                      ? 'Describe the background image... (e.g., "Abstract neon cityscape at night with rain reflections")'
                      : 'Describe the video background... (e.g., "Slow motion particles floating through colorful smoke")'
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:border-pink-500 outline-none resize-none h-24"
                />
              </div>

              {showGenModal === 'image' ? (
                <>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Resolution</label>
                    <div className="flex gap-2">
                      {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setTargetSize(size)}
                          className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                            targetSize === size
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-white/10 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Uses current aspect ratio: {state.aspectRatio}
                  </p>
                </>
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
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate {showGenModal === 'image' ? 'Image' : 'Video'}
                  </>
                )}
              </button>

              {showGenModal === 'video' && (
                <p className="text-[10px] text-slate-500 text-center">
                  Video generation may take 1-2 minutes
                </p>
              )}
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
          onFileDrop={handleFileDrop}
          onLyricsSubmit={handleLyricsSubmitFromPanel}
          onVisionSubmit={handleVisionSubmitFromPanel}
          processingStatus={processingStatus}
          isProcessingAudio={isProcessing}
        />
      )}

      {/* Toggle to New UI */}
      {ClassicUIToggle}
    </div>
  );
};

export default App;
