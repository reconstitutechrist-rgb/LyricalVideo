import React, { useRef, useCallback, useState } from 'react';
import {
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PencilSquareIcon,
  SparklesIcon,
  MusicalNoteIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  FilmIcon,
  MicrophoneIcon,
  EyeDropperIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/solid';
import {
  VisualStyle,
  LyricLine,
  ChatMessage,
  AspectRatio,
  ColorPalette,
  TextAnimationStyle,
  BlendMode,
  FontFamily,
  FrequencyBand,
  EffectInstanceConfig,
} from '../../../types';
import { CollapsibleSection } from './CollapsibleSection';
import { FontUploader } from '../FontUploader';

// ============================================
// Types
// ============================================

export interface LyricalFlowUIProps {
  // Audio State
  audioFile: File | null;
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Lyrics
  lyrics: LyricLine[];
  userProvidedLyrics: string;
  userCreativeVision: string;

  // Visual Settings - Basic
  currentStyle: VisualStyle;
  animationSpeed: number;
  bassShakeEnabled: boolean;

  // Visual Settings - Advanced
  aspectRatio: AspectRatio;
  colorPalette: ColorPalette;
  fontFamily: FontFamily;
  textAnimation: TextAnimationStyle;
  reactivityIntensity: number;
  shakeIntensity: number;
  dynamicBackgroundPulse: boolean;
  particleTrails: boolean;
  blendMode: BlendMode;
  frequencyMapping: {
    pulse: FrequencyBand;
    motion: FrequencyBand;
    color: FrequencyBand;
  };

  // Recording
  isRecordingMic: boolean;

  // Edit Mode
  editMode: boolean;
  selectedLyricIndices: Set<number>;

  // Chat
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  isProcessing: boolean;

  // Callbacks - Basic
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onStyleChange: (style: VisualStyle) => void;
  onAnimationSpeedChange: (speed: number) => void;
  onBassShakeToggle: () => void;
  onChatToggle: () => void;
  onChatInputChange: (value: string) => void;
  onChatSubmit: () => void;
  onLyricsChange: (value: string) => void;
  onCreativeVisionChange: (value: string) => void;
  onEditLyric: (index: number) => void;
  onGenerateBackground: (type: 'image' | 'video') => void;

  // Callbacks - Advanced
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onColorPaletteChange: (palette: ColorPalette) => void;
  onFontFamilyChange: (font: FontFamily) => void;
  onTextAnimationChange: (animation: TextAnimationStyle) => void;
  onReactivityIntensityChange: (intensity: number) => void;
  onShakeIntensityChange: (intensity: number) => void;
  onDynamicBackgroundPulseToggle: () => void;
  onParticleTrailsToggle: () => void;
  onBlendModeChange: (mode: BlendMode) => void;
  onFrequencyMappingChange: (key: 'pulse' | 'motion' | 'color', band: FrequencyBand) => void;

  // Callbacks - Recording
  onStartMicRecording: () => void;
  onStopMicRecording: () => void;
  onImageAnalysis: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Callbacks - Edit Mode
  onEditModeToggle: () => void;
  onLyricSelect: (index: number) => void;
  onSelectAllLyrics: () => void;
  onBulkTimeShift: (shift: number) => void;
  onTextTransform: (type: 'upper' | 'lower' | 'capitalize') => void;
  onUpdateLyricTime: (index: number, field: 'startTime' | 'endTime', value: number) => void;
  onUpdateLyricSection: (index: number, section: string) => void;
  onUpdateLyricText: (index: number, text: string) => void;
  onUpdateLyricStyleOverride: (index: number, style: VisualStyle | null) => void;
  onUpdateLyricPaletteOverride: (index: number, palette: ColorPalette | null) => void;

  // Genre Detection
  detectedGenre: string | null;
  genreOverride: string | null;
  onGenreOverride: (genre: string | null) => void;

  // Effects
  lyricEffects: EffectInstanceConfig[];
  backgroundEffects: EffectInstanceConfig[];
  onAddLyricEffect: (effectId: string) => void;
  onAddBackgroundEffect: (effectId: string) => void;
  onRemoveLyricEffect: (index: number) => void;
  onRemoveBackgroundEffect: (index: number) => void;
  onToggleLyricEffect: (index: number) => void;
  onToggleBackgroundEffect: (index: number) => void;

  // Keyframe Animation
  onApplyMotionPreset: (lyricIndex: number, presetId: string) => void;

  // Current lyric for display
  currentLyricText: string;

  // Optional: Children for center visualization
  children?: React.ReactNode;
}

// ============================================
// Sub-Components
// ============================================

const EqualizerBars: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className="flex items-end gap-0.5 h-6"
    role="img"
    aria-label={active ? 'Audio playing' : 'Audio paused'}
  >
    {[40, 70, 50, 90, 60].map((h, i) => (
      <div
        key={i}
        className={`w-1 rounded-sm equalizer-bar ${active ? '' : 'opacity-30'}`}
        style={{
          height: `${h}%`,
          animationDelay: `${i * 100}ms`,
          animationPlayState: active ? 'running' : 'paused',
        }}
      />
    ))}
  </div>
);

const SoundWave: React.FC<{ count?: number }> = ({ count = 7 }) => (
  <div className="flex items-center gap-0.5" role="img" aria-label="Processing">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="w-0.5 rounded-full sound-wave-bar"
        style={{
          height: `${8 + Math.sin(i * 0.8) * 12}px`,
          animationDelay: `${i * 100}ms`,
        }}
      />
    ))}
  </div>
);

const RhythmDots: React.FC = () => (
  <div className="flex gap-2" role="img" aria-hidden="true">
    {[0, 150, 300, 450].map((delay, i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full rhythm-dot"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const EnergyOrb: React.FC<{ size: number; className?: string }> = ({ size, className = '' }) => (
  <div
    className={`absolute rounded-full energy-orb ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

const FloatingNote: React.FC<{ note: string; className?: string }> = ({ note, className = '' }) => (
  <div
    className={`absolute text-4xl pointer-events-none animate-bounce ${className}`}
    style={{ color: 'rgba(0, 212, 255, 0.08)' }}
    aria-hidden="true"
  >
    {note}
  </div>
);

const StepIndicator: React.FC<{ step: number; label: string }> = ({ step, label }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-5 h-5 rounded-full step-circle flex items-center justify-center text-[9px] font-bold text-white">
      {step}
    </div>
    <h3 className="text-[10px] font-bold text-cyan-400/80 tracking-wider uppercase">{label}</h3>
  </div>
);

const ToggleSwitch: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  label: string;
  id: string;
}> = ({ enabled, onToggle, label, id }) => (
  <div className="flex justify-between items-center">
    <label htmlFor={id} className="text-[9px] text-slate-400">
      {label}
    </label>
    <button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`toggle-switch w-8 h-4 rounded-full p-0.5 cursor-pointer ${enabled ? 'on' : 'off'}`}
    >
      <div className="toggle-knob w-3 h-3 bg-white rounded-full shadow" />
    </button>
  </div>
);

// ============================================
// Visual Style Options
// ============================================

const STYLE_OPTIONS: { value: VisualStyle; label: string }[] = [
  { value: VisualStyle.NEON_PULSE, label: 'NEON PULSE' },
  { value: VisualStyle.LIQUID_DREAM, label: 'LIQUID DREAM' },
  { value: VisualStyle.GLITCH_CYBER, label: 'GLITCH CYBER' },
  { value: VisualStyle.CINEMATIC_BACKDROP, label: 'CINEMATIC' },
  { value: VisualStyle.MINIMAL_TYPE, label: 'MINIMAL' },
  { value: VisualStyle.KALEIDOSCOPE, label: 'KALEIDOSCOPE' },
];

// ============================================
// Music Section Colors
// ============================================

const getSectionStyle = (section?: string): string => {
  if (!section) return 'border-l-cyan-500/30';
  const s = section.toLowerCase();
  if (s.includes('chorus') || s.includes('hook')) return 'border-l-emerald-400';
  if (s.includes('verse')) return 'border-l-cyan-500';
  if (s.includes('bridge')) return 'border-l-purple-500';
  if (s.includes('intro') || s.includes('outro')) return 'border-l-amber-400';
  return 'border-l-slate-500';
};

// ============================================
// Advanced Options Data
// ============================================

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
];

const COLOR_PALETTE_OPTIONS: { value: ColorPalette; label: string; colors: string[] }[] = [
  { value: 'neon', label: 'Neon', colors: ['#00ffff', '#ff00ff', '#00ff00'] },
  { value: 'sunset', label: 'Sunset', colors: ['#ff6b35', '#f7c59f', '#efa00b'] },
  { value: 'ocean', label: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef'] },
  { value: 'matrix', label: 'Matrix', colors: ['#00ff41', '#008f11', '#003b00'] },
  { value: 'fire', label: 'Fire', colors: ['#ff0000', '#ff7700', '#ffcc00'] },
];

const TEXT_ANIMATION_OPTIONS: { value: TextAnimationStyle; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'TYPEWRITER', label: 'Typewriter' },
  { value: 'FADE_CHARS', label: 'Fade Chars' },
  { value: 'KINETIC', label: 'Kinetic' },
  { value: 'BOUNCE', label: 'Bounce' },
];

const FREQUENCY_BAND_OPTIONS: { value: FrequencyBand; label: string }[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'mid', label: 'Mid' },
  { value: 'treble', label: 'Treble' },
  { value: 'avg', label: 'Average' },
];

const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

const SECTION_TYPE_OPTIONS = [
  'verse',
  'chorus',
  'bridge',
  'intro',
  'outro',
  'pre-chorus',
  'hook',
  'breakdown',
];

const GENRE_OPTIONS = [
  'hiphop',
  'rock',
  'electronic',
  'classical',
  'pop',
  'indie',
  'rnb',
  'jazz',
  'country',
  'metal',
];

// Style options for per-line override (includes "none" option)
const STYLE_OVERRIDE_OPTIONS: { value: VisualStyle | ''; label: string }[] = [
  { value: '', label: 'Default' },
  { value: VisualStyle.NEON_PULSE, label: 'Neon Pulse' },
  { value: VisualStyle.LIQUID_DREAM, label: 'Liquid Dream' },
  { value: VisualStyle.GLITCH_CYBER, label: 'Glitch Cyber' },
  { value: VisualStyle.CINEMATIC_BACKDROP, label: 'Cinematic' },
  { value: VisualStyle.MINIMAL_TYPE, label: 'Minimal' },
  { value: VisualStyle.KALEIDOSCOPE, label: 'Kaleidoscope' },
];

const PALETTE_OVERRIDE_OPTIONS: { value: ColorPalette | ''; label: string }[] = [
  { value: '', label: 'Default' },
  { value: 'neon', label: 'Neon' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'fire', label: 'Fire' },
];

// Available effects for adding
const LYRIC_EFFECT_OPTIONS = [
  { id: 'glow', label: 'Glow', description: 'Text glow effect' },
  { id: 'bounce', label: 'Bounce', description: 'Bouncy text animation' },
  { id: 'wave', label: 'Wave', description: 'Wavy text motion' },
  { id: 'shake', label: 'Shake', description: 'Audio-reactive shake' },
  { id: 'color-shift', label: 'Color Shift', description: 'Dynamic color changes' },
];

const BACKGROUND_EFFECT_OPTIONS = [
  { id: 'particles', label: 'Particles', description: 'Floating particles' },
  { id: 'pulse', label: 'Pulse', description: 'Beat-synced pulse' },
  { id: 'vignette', label: 'Vignette', description: 'Dark edges effect' },
  { id: 'chromatic', label: 'Chromatic', description: 'RGB split effect' },
  { id: 'blur', label: 'Blur', description: 'Background blur' },
];

// Motion presets for keyframe animation
const MOTION_PRESET_OPTIONS = [
  { id: 'none', label: 'None', description: 'No motion' },
  { id: 'fade-in', label: 'Fade In', description: 'Fades in from transparent' },
  { id: 'slide-up', label: 'Slide Up', description: 'Slides up from below' },
  { id: 'slide-down', label: 'Slide Down', description: 'Slides down from above' },
  { id: 'zoom-in', label: 'Zoom In', description: 'Grows from small to full size' },
  { id: 'bounce', label: 'Bounce', description: 'Bouncy entrance' },
  { id: 'spin', label: 'Spin', description: 'Rotates while entering' },
  { id: 'wave', label: 'Wave', description: 'Wavy motion' },
];

// ============================================
// Main Component
// ============================================

export const LyricalFlowUI: React.FC<LyricalFlowUIProps> = ({
  // Audio State
  audioFile,
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  // Lyrics
  lyrics,
  userProvidedLyrics,
  userCreativeVision,
  // Visual Settings - Basic
  currentStyle,
  animationSpeed,
  bassShakeEnabled,
  // Visual Settings - Advanced
  aspectRatio,
  colorPalette,
  fontFamily,
  textAnimation,
  reactivityIntensity,
  shakeIntensity,
  dynamicBackgroundPulse,
  particleTrails,
  blendMode,
  frequencyMapping,
  // Recording
  isRecordingMic,
  // Edit Mode
  editMode,
  selectedLyricIndices,
  // Chat
  chatOpen,
  chatMessages,
  chatInput,
  isProcessing,
  // Callbacks - Basic
  onFileUpload,
  onTogglePlay,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onStyleChange,
  onAnimationSpeedChange,
  onBassShakeToggle,
  onChatToggle,
  onChatInputChange,
  onChatSubmit,
  onLyricsChange,
  onCreativeVisionChange,
  onEditLyric,
  onGenerateBackground,
  // Callbacks - Advanced
  onAspectRatioChange,
  onColorPaletteChange,
  onFontFamilyChange,
  onTextAnimationChange,
  onReactivityIntensityChange,
  onShakeIntensityChange,
  onDynamicBackgroundPulseToggle,
  onParticleTrailsToggle,
  onBlendModeChange,
  onFrequencyMappingChange,
  // Callbacks - Recording
  onStartMicRecording,
  onStopMicRecording,
  onImageAnalysis,
  // Callbacks - Edit Mode
  onEditModeToggle,
  onLyricSelect,
  onSelectAllLyrics,
  onBulkTimeShift,
  onTextTransform,
  onUpdateLyricTime,
  onUpdateLyricSection,
  onUpdateLyricText,
  onUpdateLyricStyleOverride,
  onUpdateLyricPaletteOverride,
  // Genre Detection
  detectedGenre,
  genreOverride,
  onGenreOverride,
  // Effects
  lyricEffects,
  backgroundEffects,
  onAddLyricEffect,
  onAddBackgroundEffect,
  onRemoveLyricEffect,
  onRemoveBackgroundEffect,
  onToggleLyricEffect,
  onToggleBackgroundEffect,
  // Keyframe Animation
  onApplyMotionPreset,
  // Display
  currentLyricText,
  children,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [timeShiftValue, setTimeShiftValue] = useState<string>('0');

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      onSeek(percent * duration);
    },
    [duration, onSeek]
  );

  // Handle chat submit on Enter
  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onChatSubmit();
    }
  };

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find current lyric
  const currentLyricIndex = lyrics.findIndex(
    (l) => currentTime >= l.startTime && currentTime <= l.endTime
  );

  return (
    <div
      className="flex h-screen w-full text-white overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #000011 0%, #001122 50%, #000022 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <EnergyOrb size={400} className="-top-20 -left-20" />
        <EnergyOrb size={350} className="-bottom-16 -right-10" />
        <EnergyOrb size={250} className="top-1/3 left-1/4" />
        <FloatingNote note="♪" className="top-20 left-20" />
        <FloatingNote note="♫" className="top-32 right-24" />
        <FloatingNote note="♩" className="bottom-24 left-1/4" />
        <FloatingNote note="♬" className="top-1/2 right-1/4" />
        <div className="absolute inset-0 opacity-20 grid-pattern" />
      </div>

      {/* ========================================
          LEFT PANEL - Controls & Timeline
          ======================================== */}
      <div className="w-72 flex flex-col z-10 relative glass-panel">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0, 212, 255, 0.1) 8px, rgba(0, 212, 255, 0.1) 9px)',
              backgroundSize: '100% 45px',
            }}
            aria-hidden="true"
          />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gradient-cyan">LYRICAL FLOW</h1>
              <div className="flex items-center gap-2 mt-1">
                <RhythmDots />
                <span className="text-[9px] text-cyan-400/60 tracking-widest uppercase">
                  AI Studio Pro
                </span>
              </div>
            </div>
            <EqualizerBars active={isPlaying} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-3 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Step 1: Source Material */}
          <section aria-labelledby="source-heading">
            <StepIndicator step={1} label="Source Material" />
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition bg-gradient-to-r from-cyan-500 to-blue-500" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full p-3 rounded-xl glass-card flex items-center gap-3 cursor-pointer text-left"
                aria-label="Upload audio file"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  {audioFile ? (
                    <MusicalNoteIcon className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <ArrowUpTrayIcon className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {audioFile ? audioFile.name : 'Upload Audio'}
                  </div>
                  <div className="text-[9px] text-cyan-400/60">
                    {audioFile ? formatTime(duration) : 'MP3, WAV, FLAC'}
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={onFileUpload}
                className="hidden"
                aria-label="Audio file input"
              />
            </div>

            {/* Creative Vision & Lyrics Input (shown when no audio) */}
            {!audioFile && (
              <div className="mt-3 space-y-2">
                <div>
                  <label
                    htmlFor="creative-vision"
                    className="text-[9px] text-cyan-400/60 flex items-center gap-1 mb-1"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    Creative Vision (Optional)
                  </label>
                  <textarea
                    id="creative-vision"
                    placeholder="Describe your vision: 'Dark and moody with neon accents'..."
                    value={userCreativeVision}
                    onChange={(e) => onCreativeVisionChange(e.target.value)}
                    className="w-full p-2 rounded-lg glass-card text-[10px] text-slate-300 placeholder-slate-500 outline-none resize-none h-16 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="lyrics-input" className="text-[9px] text-cyan-400/60 mb-1 block">
                    Lyrics (Optional)
                  </label>
                  <textarea
                    id="lyrics-input"
                    placeholder="Paste lyrics here for better sync..."
                    value={userProvidedLyrics}
                    onChange={(e) => onLyricsChange(e.target.value)}
                    className="w-full p-2 rounded-lg glass-card text-[10px] text-slate-300 placeholder-slate-500 outline-none resize-none h-20 focus:border-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {/* Advanced Input Options */}
            <CollapsibleSection title="Advanced Input" storageKey="advanced-input">
              {/* Mic Recording */}
              <button
                onClick={isRecordingMic ? onStopMicRecording : onStartMicRecording}
                className={`w-full p-2.5 rounded-lg glass-card flex items-center gap-2 text-left transition ${
                  isRecordingMic ? 'mic-recording border-red-500/50' : ''
                }`}
                aria-label={isRecordingMic ? 'Stop recording' : 'Start recording lyrics'}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                    isRecordingMic
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-cyan-500/30 bg-cyan-500/10'
                  }`}
                >
                  <MicrophoneIcon
                    className={`w-4 h-4 ${isRecordingMic ? 'text-red-400' : 'text-cyan-400'}`}
                  />
                </div>
                <div>
                  <div className="text-[10px] font-medium">
                    {isRecordingMic ? 'Recording...' : 'Speak Lyrics'}
                  </div>
                  <div className="text-[8px] text-slate-500">
                    {isRecordingMic ? 'Click to stop' : 'Use microphone to input lyrics'}
                  </div>
                </div>
              </button>

              {/* Image Analysis */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full p-2.5 rounded-lg glass-card flex items-center gap-2 text-left"
                aria-label="Analyze image for visual inspiration"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10">
                  <EyeDropperIcon className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] font-medium">Analyze Image</div>
                  <div className="text-[8px] text-slate-500">Extract colors and mood</div>
                </div>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={onImageAnalysis}
                className="hidden"
                aria-label="Image file input"
              />

              {/* Aspect Ratio */}
              <div className="p-2.5 rounded-lg glass-card">
                <label className="text-[9px] text-slate-400 mb-2 block">Aspect Ratio</label>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Aspect ratio selection">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onAspectRatioChange(option.value)}
                      role="radio"
                      aria-checked={aspectRatio === option.value}
                      className={`aspect-ratio-btn flex-1 py-1.5 rounded-md text-[10px] font-medium transition ${
                        aspectRatio === option.value
                          ? 'active bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                          : 'bg-black/20 text-slate-400 border-white/5 hover:border-cyan-500/30'
                      } border`}
                    >
                      <ArrowsPointingOutIcon className="w-3 h-3 mx-auto mb-0.5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          </section>

          {/* Step 2: Visual Direction */}
          <section aria-labelledby="visual-heading">
            <StepIndicator step={2} label="Visual Direction" />
            <div
              className="grid grid-cols-2 gap-1.5"
              role="radiogroup"
              aria-label="Visual style selection"
            >
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onStyleChange(style.value)}
                  role="radio"
                  aria-checked={currentStyle === style.value}
                  className={`p-2 rounded-lg text-[9px] font-medium glass-card ${
                    currentStyle === style.value ? 'active text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Advanced Styling */}
            <CollapsibleSection title="Advanced Styling" storageKey="advanced-styling">
              {/* Color Palette */}
              <div className="p-2.5 rounded-lg glass-card">
                <label className="text-[9px] text-slate-400 mb-2 block">Color Palette</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {COLOR_PALETTE_OPTIONS.map((palette) => (
                    <button
                      key={palette.value}
                      onClick={() => onColorPaletteChange(palette.value)}
                      className={`palette-swatch p-1.5 rounded-md transition ${
                        colorPalette === palette.value
                          ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-black/50'
                          : ''
                      }`}
                      aria-label={`${palette.label} palette`}
                      aria-pressed={colorPalette === palette.value}
                    >
                      <div className="flex gap-0.5 justify-center mb-1">
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="text-[7px] text-slate-400 text-center">{palette.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="p-2.5 rounded-lg glass-card">
                <label className="text-[9px] text-slate-400 mb-1.5 block">Font Family</label>
                <FontUploader currentFont={fontFamily} onFontChange={onFontFamilyChange} />
              </div>

              {/* Text Animation */}
              <div className="p-2.5 rounded-lg glass-card">
                <label htmlFor="text-animation" className="text-[9px] text-slate-400 mb-1.5 block">
                  Text Animation
                </label>
                <select
                  id="text-animation"
                  value={textAnimation}
                  onChange={(e) => onTextAnimationChange(e.target.value as TextAnimationStyle)}
                  className="glass-select w-full py-1.5 px-2 rounded-md text-[10px] text-slate-300 outline-none"
                >
                  {TEXT_ANIMATION_OPTIONS.map((anim) => (
                    <option key={anim.value} value={anim.value}>
                      {anim.label}
                    </option>
                  ))}
                </select>
              </div>
            </CollapsibleSection>

            {/* Genre Detection */}
            <CollapsibleSection title="Genre Detection" storageKey="genre-detection">
              <div className="p-2.5 rounded-lg glass-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-400">Detected Genre</span>
                  {detectedGenre && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {detectedGenre}
                    </span>
                  )}
                  {!detectedGenre && (
                    <span className="text-[9px] text-slate-500 italic">No audio loaded</span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="genre-override"
                    className="text-[9px] text-slate-400 mb-1.5 block"
                  >
                    Override Genre
                  </label>
                  <select
                    id="genre-override"
                    value={genreOverride || ''}
                    onChange={(e) => onGenreOverride(e.target.value || null)}
                    className="glass-select w-full py-1.5 px-2 rounded-md text-[10px] text-slate-300 outline-none"
                  >
                    <option value="">Auto-detect</option>
                    {GENRE_OPTIONS.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {(genreOverride || detectedGenre) && (
                  <p className="text-[8px] text-slate-500 mt-2">
                    Genre affects visual presets and audio reactivity
                  </p>
                )}
              </div>
            </CollapsibleSection>
          </section>

          {/* Step 3: FX Controls */}
          <section aria-labelledby="fx-heading">
            <StepIndicator step={3} label="FX Controls" />

            {/* Animation Speed Slider */}
            <div className="p-2.5 rounded-xl glass-card mb-1.5">
              <div className="flex justify-between text-[9px] mb-1.5">
                <label htmlFor="animation-speed" className="text-slate-400">
                  Animation Speed
                </label>
                <span className="text-cyan-400 font-mono">{animationSpeed.toFixed(1)}x</span>
              </div>
              <input
                id="animation-speed"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => onAnimationSpeedChange(parseFloat(e.target.value))}
                className="w-full cyan-range"
              />
            </div>

            {/* Bass Shake Toggle */}
            <div className="p-2.5 rounded-xl glass-card">
              <ToggleSwitch
                id="bass-shake"
                label="Bass Shake"
                enabled={bassShakeEnabled}
                onToggle={onBassShakeToggle}
              />
            </div>

            {/* Background Generation */}
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => onGenerateBackground('image')}
                className="flex-1 p-2 rounded-lg glass-card text-[9px] text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition"
                aria-label="Generate background image"
              >
                <PhotoIcon className="w-3 h-3" />
                Gen Image
              </button>
              <button
                onClick={() => onGenerateBackground('video')}
                className="flex-1 p-2 rounded-lg glass-card text-[9px] text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition"
                aria-label="Generate background video"
              >
                <FilmIcon className="w-3 h-3" />
                Gen Video
              </button>
            </div>

            {/* Advanced FX */}
            <CollapsibleSection title="Advanced FX" storageKey="advanced-fx">
              {/* Reactivity Intensity */}
              <div className="p-2.5 rounded-lg glass-card">
                <div className="flex justify-between text-[9px] mb-1.5">
                  <label htmlFor="reactivity-intensity" className="text-slate-400">
                    Reactivity Intensity
                  </label>
                  <span className="text-cyan-400 font-mono">{reactivityIntensity.toFixed(1)}x</span>
                </div>
                <input
                  id="reactivity-intensity"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={reactivityIntensity}
                  onChange={(e) => onReactivityIntensityChange(parseFloat(e.target.value))}
                  className="w-full cyan-range"
                />
              </div>

              {/* Shake Intensity (only when bass shake enabled) */}
              {bassShakeEnabled && (
                <div className="p-2.5 rounded-lg glass-card">
                  <div className="flex justify-between text-[9px] mb-1.5">
                    <label htmlFor="shake-intensity" className="text-slate-400">
                      Shake Intensity
                    </label>
                    <span className="text-cyan-400 font-mono">{shakeIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    id="shake-intensity"
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={shakeIntensity}
                    onChange={(e) => onShakeIntensityChange(parseFloat(e.target.value))}
                    className="w-full cyan-range"
                  />
                </div>
              )}

              {/* Additional Toggles */}
              <div className="p-2.5 rounded-lg glass-card space-y-2">
                <ToggleSwitch
                  id="dynamic-bg-pulse"
                  label="Dynamic BG Pulse"
                  enabled={dynamicBackgroundPulse}
                  onToggle={onDynamicBackgroundPulseToggle}
                />
                <ToggleSwitch
                  id="particle-trails"
                  label="Particle Trails"
                  enabled={particleTrails}
                  onToggle={onParticleTrailsToggle}
                />
              </div>

              {/* Frequency Mapping */}
              <div className="p-2.5 rounded-lg glass-card">
                <label className="text-[9px] text-slate-400 mb-2 block">
                  Audio Frequency Mapping
                </label>
                <div className="space-y-2">
                  {(['pulse', 'motion', 'color'] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 capitalize">{key}</span>
                      <select
                        value={frequencyMapping[key]}
                        onChange={(e) =>
                          onFrequencyMappingChange(key, e.target.value as FrequencyBand)
                        }
                        className="glass-select py-1 px-2 rounded text-[9px] text-slate-300"
                        aria-label={`${key} frequency mapping`}
                      >
                        {FREQUENCY_BAND_OPTIONS.map((band) => (
                          <option key={band.value} value={band.value}>
                            {band.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blend Mode */}
              <div className="p-2.5 rounded-lg glass-card">
                <label htmlFor="blend-mode" className="text-[9px] text-slate-400 mb-1.5 block">
                  Blend Mode
                </label>
                <select
                  id="blend-mode"
                  value={blendMode}
                  onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
                  className="glass-select w-full py-1.5 px-2 rounded-md text-[10px] text-slate-300 outline-none"
                >
                  {BLEND_MODE_OPTIONS.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </CollapsibleSection>

            {/* Effect Studio */}
            <CollapsibleSection title="Effect Studio" storageKey="effect-studio">
              {/* Lyric Effects */}
              <div className="p-2.5 rounded-lg glass-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-400">Lyric Effects</span>
                  <span className="text-[8px] text-cyan-400/60">{lyricEffects.length} active</span>
                </div>
                {/* Add Effect Dropdown */}
                <select
                  className="glass-select w-full py-1 px-2 rounded text-[9px] text-slate-300 mb-2"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddLyricEffect(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  aria-label="Add lyric effect"
                >
                  <option value="">+ Add Effect...</option>
                  {LYRIC_EFFECT_OPTIONS.filter(
                    (opt) => !lyricEffects.find((e) => e.effectId === opt.id)
                  ).map((effect) => (
                    <option key={effect.id} value={effect.id}>
                      {effect.label}
                    </option>
                  ))}
                </select>
                {/* Active Effects */}
                {lyricEffects.length > 0 && (
                  <div className="space-y-1">
                    {lyricEffects.map((effect, index) => (
                      <div
                        key={`${effect.effectId}-${index}`}
                        className="flex items-center justify-between py-1 px-2 rounded bg-black/20 border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleLyricEffect(index)}
                            className={`w-2 h-2 rounded-full ${effect.enabled ? 'bg-cyan-400' : 'bg-slate-600'}`}
                            aria-label={effect.enabled ? 'Disable effect' : 'Enable effect'}
                          />
                          <span className="text-[9px] text-slate-300">{effect.effectId}</span>
                        </div>
                        <button
                          onClick={() => onRemoveLyricEffect(index)}
                          className="text-[9px] text-slate-500 hover:text-red-400"
                          aria-label="Remove effect"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Background Effects */}
              <div className="p-2.5 rounded-lg glass-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-400">Background Effects</span>
                  <span className="text-[8px] text-cyan-400/60">
                    {backgroundEffects.length} active
                  </span>
                </div>
                {/* Add Effect Dropdown */}
                <select
                  className="glass-select w-full py-1 px-2 rounded text-[9px] text-slate-300 mb-2"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddBackgroundEffect(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  aria-label="Add background effect"
                >
                  <option value="">+ Add Effect...</option>
                  {BACKGROUND_EFFECT_OPTIONS.filter(
                    (opt) => !backgroundEffects.find((e) => e.effectId === opt.id)
                  ).map((effect) => (
                    <option key={effect.id} value={effect.id}>
                      {effect.label}
                    </option>
                  ))}
                </select>
                {/* Active Effects */}
                {backgroundEffects.length > 0 && (
                  <div className="space-y-1">
                    {backgroundEffects.map((effect, index) => (
                      <div
                        key={`${effect.effectId}-${index}`}
                        className="flex items-center justify-between py-1 px-2 rounded bg-black/20 border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleBackgroundEffect(index)}
                            className={`w-2 h-2 rounded-full ${effect.enabled ? 'bg-cyan-400' : 'bg-slate-600'}`}
                            aria-label={effect.enabled ? 'Disable effect' : 'Enable effect'}
                          />
                          <span className="text-[9px] text-slate-300">{effect.effectId}</span>
                        </div>
                        <button
                          onClick={() => onRemoveBackgroundEffect(index)}
                          className="text-[9px] text-slate-500 hover:text-red-400"
                          aria-label="Remove effect"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </section>

          {/* Step 4: Timeline */}
          <section aria-labelledby="timeline-heading">
            <div className="flex items-center justify-between mb-2">
              <StepIndicator step={4} label="Timeline" />
              <button
                onClick={onEditModeToggle}
                className={`px-2 py-1 rounded-md text-[9px] glass-card flex items-center gap-1 transition ${
                  editMode
                    ? 'text-cyan-400 border-cyan-500/50'
                    : 'text-slate-400 hover:text-cyan-400'
                }`}
                aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
                aria-pressed={editMode}
              >
                <PencilSquareIcon className="w-3 h-3" />
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Bulk Actions Bar (when editing and has selections) */}
            {editMode && selectedLyricIndices.size > 0 && (
              <div className="bulk-actions-bar mb-2 p-2 rounded-lg glass-card border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-cyan-400">
                    {selectedLyricIndices.size} selected
                  </span>
                  <button
                    onClick={onSelectAllLyrics}
                    className="text-[9px] text-slate-400 hover:text-cyan-400"
                  >
                    {selectedLyricIndices.size === lyrics.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Time Shift */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={timeShiftValue}
                      onChange={(e) => setTimeShiftValue(e.target.value)}
                      className="time-input w-12 py-0.5 px-1 rounded text-[9px] text-center"
                      placeholder="0"
                      step="0.1"
                    />
                    <button
                      onClick={() => onBulkTimeShift(parseFloat(timeShiftValue) || 0)}
                      className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
                    >
                      Shift
                    </button>
                  </div>
                  {/* Text Transform */}
                  <button
                    onClick={() => onTextTransform('upper')}
                    className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
                  >
                    UPPER
                  </button>
                  <button
                    onClick={() => onTextTransform('lower')}
                    className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
                  >
                    lower
                  </button>
                  <button
                    onClick={() => onTextTransform('capitalize')}
                    className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
                  >
                    Title
                  </button>
                </div>
              </div>
            )}

            {/* Keyframe Animation Editor */}
            <CollapsibleSection title="Motion Presets" storageKey="keyframe-editor">
              <div className="p-2.5 rounded-lg glass-card">
                <p className="text-[8px] text-slate-500 mb-2">
                  Apply motion presets to selected lyrics or all lyrics
                </p>
                {/* Apply to Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      id="motion-preset-select"
                      className="glass-select flex-1 py-1 px-2 rounded text-[9px] text-slate-300"
                      defaultValue=""
                      aria-label="Select motion preset"
                    >
                      <option value="">Select preset...</option>
                      {MOTION_PRESET_OPTIONS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById(
                          'motion-preset-select'
                        ) as HTMLSelectElement;
                        const presetId = select?.value;
                        if (presetId && selectedLyricIndices.size > 0) {
                          selectedLyricIndices.forEach((index) => {
                            onApplyMotionPreset(index, presetId);
                          });
                        }
                      }}
                      disabled={selectedLyricIndices.size === 0}
                      className="bulk-action-btn px-2 py-1 rounded text-[9px] disabled:opacity-50"
                    >
                      Apply to Selected
                    </button>
                  </div>
                  {selectedLyricIndices.size === 0 && editMode && (
                    <p className="text-[8px] text-amber-400/70">
                      Select lyrics above to apply motion
                    </p>
                  )}
                </div>
                {/* Preview list of presets */}
                <div className="mt-3 border-t border-white/5 pt-2">
                  <span className="text-[8px] text-slate-500">Available presets:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {MOTION_PRESET_OPTIONS.slice(1).map((preset) => (
                      <span
                        key={preset.id}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-black/30 text-slate-400 border border-white/5"
                        title={preset.description}
                      >
                        {preset.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {lyrics.length > 0 ? (
              <div
                className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar"
                role="list"
                aria-label="Lyrics timeline"
              >
                {lyrics.map((lyric, i) => (
                  <div
                    key={lyric.id || i}
                    className={`w-full p-2 rounded-lg glass-card lyric-line text-left border-l-2 ${getSectionStyle(lyric.section)} ${
                      i === currentLyricIndex ? 'active' : ''
                    } ${editMode && selectedLyricIndices.has(i) ? 'ring-1 ring-cyan-400/50' : ''}`}
                    role="listitem"
                    aria-current={i === currentLyricIndex ? 'true' : undefined}
                  >
                    {editMode ? (
                      /* Edit Mode View */
                      <div className="space-y-1.5">
                        {/* Row 1: Checkbox, Time inputs, Section */}
                        <div className="flex items-center gap-2">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedLyricIndices.has(i)}
                            onChange={() => onLyricSelect(i)}
                            className="glass-checkbox w-3 h-3 rounded"
                            aria-label={`Select lyric ${i + 1}`}
                          />
                          {/* Time Inputs */}
                          <input
                            type="number"
                            value={lyric.startTime.toFixed(2)}
                            onChange={(e) =>
                              onUpdateLyricTime(i, 'startTime', parseFloat(e.target.value) || 0)
                            }
                            className="time-input w-14 py-0.5 px-1 rounded text-[9px] text-center"
                            step="0.01"
                            aria-label="Start time"
                          />
                          <span className="text-[9px] text-slate-500">→</span>
                          <input
                            type="number"
                            value={lyric.endTime.toFixed(2)}
                            onChange={(e) =>
                              onUpdateLyricTime(i, 'endTime', parseFloat(e.target.value) || 0)
                            }
                            className="time-input w-14 py-0.5 px-1 rounded text-[9px] text-center"
                            step="0.01"
                            aria-label="End time"
                          />
                          {/* Section Dropdown */}
                          <select
                            value={lyric.section || ''}
                            onChange={(e) => onUpdateLyricSection(i, e.target.value)}
                            className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                            aria-label="Section type"
                          >
                            <option value="">—</option>
                            {SECTION_TYPE_OPTIONS.map((section) => (
                              <option key={section} value={section}>
                                {section}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Row 2: Style Override, Palette Override */}
                        <div className="flex items-center gap-2 pl-5">
                          <select
                            value={lyric.styleOverride || ''}
                            onChange={(e) =>
                              onUpdateLyricStyleOverride(
                                i,
                                e.target.value ? (e.target.value as VisualStyle) : null
                              )
                            }
                            className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                            aria-label="Style override"
                          >
                            {STYLE_OVERRIDE_OPTIONS.map((style) => (
                              <option key={style.value || 'default'} value={style.value}>
                                {style.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={lyric.paletteOverride || ''}
                            onChange={(e) =>
                              onUpdateLyricPaletteOverride(
                                i,
                                e.target.value ? (e.target.value as ColorPalette) : null
                              )
                            }
                            className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                            aria-label="Palette override"
                          >
                            {PALETTE_OVERRIDE_OPTIONS.map((palette) => (
                              <option key={palette.value || 'default'} value={palette.value}>
                                {palette.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Row 3: Inline Text Editing */}
                        <input
                          type="text"
                          value={lyric.text}
                          onChange={(e) => onUpdateLyricText(i, e.target.value)}
                          className="w-full py-1 px-2 rounded text-[10px] text-slate-200 glass-card border border-white/5 focus:border-cyan-500/30 outline-none ml-5"
                          style={{ width: 'calc(100% - 1.25rem)' }}
                          aria-label="Lyric text"
                        />
                      </div>
                    ) : (
                      /* View Mode */
                      <button onClick={() => onEditLyric(i)} className="w-full text-left">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] text-cyan-400 font-mono">
                            {formatTime(lyric.startTime)}
                          </span>
                          {lyric.section && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/30 border border-white/5 uppercase tracking-wider text-slate-500">
                              {lyric.section}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] ${i === currentLyricIndex ? 'text-white' : 'text-slate-300/80'}`}
                        >
                          {lyric.text}
                        </p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg glass-card text-center">
                <MusicalNoteIcon className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500">Upload audio to see timeline</p>
              </div>
            )}
          </section>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize resize-handle"
          aria-hidden="true"
        />
      </div>

      {/* ========================================
          CENTER - Visualization Area
          ======================================== */}
      <main className="flex-1 flex flex-col relative" role="main" aria-label="Visualization area">
        {/* Decorative Treble Clef */}
        <div
          className="absolute top-8 right-12 text-8xl pointer-events-none select-none"
          style={{ color: 'rgba(0, 212, 255, 0.04)', fontFamily: 'serif' }}
          aria-hidden="true"
        >
          𝄞
        </div>

        {/* Main Visualization */}
        <div className="flex-1 flex items-center justify-center p-6">
          {children || (
            <div
              className="relative w-64 h-64 rounded-full flex items-center justify-center loading-pulse"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.4) 0%, rgba(0, 136, 255, 0.25) 25%, rgba(0, 100, 200, 0.15) 50%, rgba(0, 50, 100, 0.08) 75%, transparent 100%)',
                boxShadow:
                  '0 0 80px rgba(0, 212, 255, 0.4), 0 0 150px rgba(0, 136, 255, 0.2), inset 0 0 80px rgba(0, 255, 204, 0.1)',
              }}
            >
              {/* Spinning Rings */}
              <div
                className="absolute -inset-6 rounded-full border-2 border-transparent spin-slow"
                style={{
                  borderTopColor: 'rgba(0, 212, 255, 0.4)',
                  borderLeftColor: 'rgba(0, 255, 204, 0.3)',
                }}
                aria-hidden="true"
              />
              <div
                className="absolute -inset-12 rounded-full border border-transparent spin-slow-reverse"
                style={{
                  borderBottomColor: 'rgba(0, 136, 255, 0.3)',
                  borderRightColor: 'rgba(0, 212, 255, 0.2)',
                }}
                aria-hidden="true"
              />

              {/* Current Lyric */}
              <div
                className="text-center text-lg font-bold p-4 max-w-[80%]"
                style={{
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 136, 255, 0.3)',
                }}
                role="status"
                aria-live="polite"
              >
                {currentLyricText || 'Ready to play'}
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl flex items-center gap-3 z-20 glass-panel"
          style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 136, 255, 0.1)' }}
        >
          {/* Top Gradient Line */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5 opacity-50"
            style={{
              background:
                'linear-gradient(90deg, transparent, #00d4ff, #0088ff, #00ffcc, #0088ff, transparent)',
            }}
            aria-hidden="true"
          />

          {/* Skip Back */}
          <button
            onClick={onSkipBackward}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
            aria-label="Skip backward 10 seconds"
            disabled={!audioUrl}
          >
            <BackwardIcon className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white btn-gradient-cyan"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={!audioUrl}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={onSkipForward}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
            aria-label="Skip forward 10 seconds"
            disabled={!audioUrl}
          >
            <ForwardIcon className="w-5 h-5" />
          </button>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1 w-48 ml-2">
            <div
              ref={progressRef}
              className="h-1 rounded-full relative cursor-pointer progress-track"
              onClick={handleProgressClick}
              role="slider"
              aria-label="Playback progress"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
              tabIndex={0}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full progress-thumb"
                style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-cyan-400/60 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Live Indicator */}
          {isPlaying && (
            <div className="w-2 h-2 rounded-full ml-1 live-indicator" aria-label="Playing" />
          )}
        </div>

        {/* Chat Toggle Button */}
        <button
          onClick={onChatToggle}
          className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-20 glass-panel transition-all ${
            chatOpen ? 'border-cyan-500/50 bg-cyan-500/10' : ''
          }`}
          aria-label={chatOpen ? 'Close AI Director chat' : 'Open AI Director chat'}
          aria-expanded={chatOpen}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-cyan-400" />
        </button>
      </main>

      {/* ========================================
          RIGHT PANEL - AI Director Chat
          ======================================== */}
      {chatOpen && (
        <aside
          className="w-72 flex flex-col z-30 relative glass-panel"
          aria-label="AI Director Chat"
        >
          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize resize-handle"
            aria-hidden="true"
          />

          {/* Header */}
          <div className="p-3 border-b border-cyan-500/20 flex justify-between items-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 136, 255, 0.05), rgba(0, 255, 204, 0.08))',
              }}
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border border-cyan-500/30 loading-pulse bg-gradient-to-br from-cyan-500/30 to-blue-500/30">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold">AI Director</h3>
                <p className="text-[9px] text-cyan-400/60">Always listening</p>
              </div>
            </div>
            <button
              onClick={onChatToggle}
              className="text-slate-400 hover:text-white transition relative z-10"
              aria-label="Close chat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar"
            role="log"
            aria-label="Chat messages"
          >
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl text-[10px] leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'chat-bubble-user text-white rounded-br-sm'
                      : 'chat-bubble-ai text-slate-300 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] text-slate-600 mt-1 mx-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-[10px] text-cyan-400">
                <SparklesIcon className="w-4 h-4" />
                <span>Creating...</span>
                <SoundWave count={5} />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-cyan-500/20">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask for ideas..."
                className="w-full rounded-full py-2.5 pl-3 pr-10 text-[10px] text-white outline-none placeholder-slate-500 glass-card border border-cyan-500/20 focus:border-cyan-500/50"
                aria-label="Chat message input"
              />
              <button
                onClick={onChatSubmit}
                disabled={!chatInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center btn-gradient-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {['Generate BG', 'Suggest style', 'Help'].map((action) => (
                <button
                  key={action}
                  onClick={() => onChatInputChange(action)}
                  className="px-2 py-1 rounded-full text-[9px] text-slate-400 hover:text-cyan-300 glass-card border border-cyan-500/10 transition"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default LyricalFlowUI;
