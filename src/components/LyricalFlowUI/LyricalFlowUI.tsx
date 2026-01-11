import React, { useRef, useCallback } from 'react';
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
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/solid';
import { VisualStyle, LyricLine, ChatMessage, AspectRatio } from '../../../types';

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

  // Visual Settings
  currentStyle: VisualStyle;
  animationSpeed: number;
  bassShakeEnabled: boolean;

  // Chat
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  isProcessing: boolean;

  // Callbacks
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
// Main Component
// ============================================

export const LyricalFlowUI: React.FC<LyricalFlowUIProps> = ({
  audioFile,
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  lyrics,
  userProvidedLyrics,
  userCreativeVision,
  currentStyle,
  animationSpeed,
  bassShakeEnabled,
  chatOpen,
  chatMessages,
  chatInput,
  isProcessing,
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
  currentLyricText,
  children,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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
          </section>

          {/* Step 4: Timeline */}
          <section aria-labelledby="timeline-heading">
            <div className="flex items-center justify-between mb-2">
              <StepIndicator step={4} label="Timeline" />
              <button
                className="px-2 py-1 rounded-md text-[9px] text-slate-400 glass-card hover:text-cyan-400 flex items-center gap-1"
                aria-label="Edit lyrics"
              >
                <PencilSquareIcon className="w-3 h-3" />
                Edit
              </button>
            </div>

            {lyrics.length > 0 ? (
              <div
                className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar"
                role="list"
                aria-label="Lyrics timeline"
              >
                {lyrics.map((lyric, i) => (
                  <button
                    key={lyric.id || i}
                    onClick={() => onEditLyric(i)}
                    className={`w-full p-2 rounded-lg glass-card lyric-line text-left border-l-2 ${getSectionStyle(lyric.section)} ${
                      i === currentLyricIndex ? 'active' : ''
                    }`}
                    role="listitem"
                    aria-current={i === currentLyricIndex ? 'true' : undefined}
                  >
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
