/**
 * ControlPanel Component
 * Left sidebar containing source material, visual settings, and FX controls.
 * Extracted from LyricalFlowUI for better maintainability.
 */

import React, { useRef } from 'react';
import {
  ArrowUpTrayIcon,
  MusicalNoteIcon,
  SparklesIcon,
  MicrophoneIcon,
  EyeDropperIcon,
  ArrowsPointingOutIcon,
  PhotoIcon,
  FilmIcon,
} from '@heroicons/react/24/solid';
import {
  VisualStyle,
  AspectRatio,
  ColorPalette,
  TextAnimationStyle,
  BlendMode,
  FontFamily,
  FrequencyBand,
  EffectInstanceConfig,
} from '../../../../../types';
import { formatTime } from '../../../../utils/time';
import { CollapsibleSection } from '../../CollapsibleSection';
import { FontUploader } from '../../../FontUploader';
import { ModeToggle, ModeGate } from '../../../common';
import {
  STYLE_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  TEXT_ANIMATION_OPTIONS,
  FREQUENCY_BAND_OPTIONS,
  BLEND_MODE_OPTIONS,
  GENRE_OPTIONS,
  LYRIC_EFFECT_OPTIONS,
  BACKGROUND_EFFECT_OPTIONS,
} from '../../constants';
import { EqualizerBars, RhythmDots, StepIndicator, ToggleSwitch } from '../../subcomponents';

export interface ControlPanelProps {
  // Audio State
  audioFile: File | null;
  duration: number;
  isPlaying: boolean;

  // Visual Settings - Basic
  currentStyle: VisualStyle;
  animationSpeed: number;
  bassShakeEnabled: boolean;
  lyricsOnlyMode: boolean;
  fontSizeScale: number;

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



  // Genre Detection
  detectedGenre: string | null;
  genreOverride: string | null;

  // Effects
  lyricEffects: EffectInstanceConfig[];
  backgroundEffects: EffectInstanceConfig[];

  // Input values
  userProvidedLyrics: string;
  userCreativeVision: string;

  // Callbacks - Basic
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStyleChange: (style: VisualStyle) => void;
  onAnimationSpeedChange: (speed: number) => void;
  onBassShakeToggle: () => void;
  onLyricsOnlyModeToggle: () => void;
  onFontSizeScaleChange: (scale: number) => void;
  onLyricsChange: (value: string) => void;
  onCreativeVisionChange: (value: string) => void;
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


  onImageAnalysis: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Callbacks - Genre
  onGenreOverride: (genre: string | null) => void;

  // Callbacks - Effects
  onAddLyricEffect: (effectId: string) => void;
  onAddBackgroundEffect: (effectId: string) => void;
  onRemoveLyricEffect: (index: number) => void;
  onRemoveBackgroundEffect: (index: number) => void;
  onToggleLyricEffect: (index: number) => void;
  onToggleBackgroundEffect: (index: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  // Audio State
  audioFile,
  duration,
  isPlaying,
  // Visual Settings - Basic
  currentStyle,
  animationSpeed,
  bassShakeEnabled,
  lyricsOnlyMode,
  fontSizeScale,
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

  // Genre Detection
  detectedGenre,
  genreOverride,
  // Effects
  lyricEffects,
  backgroundEffects,
  // Input values
  userProvidedLyrics,
  userCreativeVision,
  // Callbacks
  onFileUpload,
  onStyleChange,
  onAnimationSpeedChange,
  onBassShakeToggle,
  onLyricsOnlyModeToggle,
  onFontSizeScaleChange,
  onLyricsChange,
  onCreativeVisionChange,
  onGenerateBackground,
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

  onImageAnalysis,
  onGenreOverride,
  onAddLyricEffect,
  onAddBackgroundEffect,
  onRemoveLyricEffect,
  onRemoveBackgroundEffect,
  onToggleLyricEffect,
  onToggleBackgroundEffect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Memoize available effect options
  const availableLyricEffects = React.useMemo(() => {
    const activeIds = new Set(lyricEffects.map((e) => e.effectId));
    return LYRIC_EFFECT_OPTIONS.filter((opt) => !activeIds.has(opt.id));
  }, [lyricEffects]);

  const availableBackgroundEffects = React.useMemo(() => {
    const activeIds = new Set(backgroundEffects.map((e) => e.effectId));
    return BACKGROUND_EFFECT_OPTIONS.filter((opt) => !activeIds.has(opt.id));
  }, [backgroundEffects]);

  return (
    <div className="w-72 flex flex-col z-10 relative glass-panel tablet:w-80 desktop:w-72">
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
          <div className="flex items-center gap-3">
            <ModeToggle compact showLabels />
            <EqualizerBars active={isPlaying} />
          </div>
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
          <CollapsibleSection
            title="Advanced Input"
            storageKey="advanced-input"
            requiresAdvancedMode
          >


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
              <div
                className="flex gap-1.5"
                role="radiogroup"
                aria-label="Aspect ratio selection"
                data-control-id="aspect-ratio"
              >
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
            data-control-id="visual-style"
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
          <CollapsibleSection
            title="Advanced Styling"
            storageKey="advanced-styling"
            requiresAdvancedMode
          >
            {/* Color Palette */}
            <div className="p-2.5 rounded-lg glass-card">
              <label className="text-[9px] text-slate-400 mb-2 block">Color Palette</label>
              <div className="grid grid-cols-5 gap-1.5" data-control-id="color-palette">
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
                data-control-id="text-animation"
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
          <CollapsibleSection
            title="Genre Detection"
            storageKey="genre-detection"
            requiresAdvancedMode
          >
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
                <label htmlFor="genre-override" className="text-[9px] text-slate-400 mb-1.5 block">
                  Override Genre
                </label>
                <select
                  id="genre-override"
                  data-control-id="genre"
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
              data-control-id="animation-speed"
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

          {/* Lyrics Only Mode */}
          <div className="p-2.5 rounded-xl glass-card">
            <ToggleSwitch
              id="lyrics-only-mode"
              label="Lyrics Only"
              enabled={lyricsOnlyMode}
              onToggle={onLyricsOnlyModeToggle}
            />
            <p className="text-[8px] text-slate-500 mt-1">
              Disable background effects, show only lyrics
            </p>
          </div>

          {/* Lyrics Only Mode Settings */}
          {lyricsOnlyMode && (
            <div className="space-y-2 p-2.5 rounded-xl glass-card border border-cyan-500/30">
              <p className="text-[9px] text-cyan-400 font-medium">Lyrics Settings</p>
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <label htmlFor="font-size-scale" className="text-slate-400">
                    Font Size
                  </label>
                  <span className="text-cyan-400 font-mono">{fontSizeScale.toFixed(1)}x</span>
                </div>
                <input
                  id="font-size-scale"
                  data-control-id="font-size-scale"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={fontSizeScale}
                  onChange={(e) => onFontSizeScaleChange(parseFloat(e.target.value))}
                  className="w-full cyan-range"
                />
              </div>
              <FontUploader currentFont={fontFamily} onFontChange={onFontFamilyChange} />
            </div>
          )}

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
          <CollapsibleSection title="Advanced FX" storageKey="advanced-fx" requiresAdvancedMode>
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
                data-control-id="reactivity-intensity"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={reactivityIntensity}
                onChange={(e) => onReactivityIntensityChange(parseFloat(e.target.value))}
                className="w-full cyan-range"
              />
            </div>

            {/* Shake Intensity */}
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
                  data-control-id="shake-intensity"
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
                      data-control-id={`frequency-mapping-${key}`}
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
                data-control-id="blend-mode"
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
          <CollapsibleSection title="Effect Studio" storageKey="effect-studio" requiresAdvancedMode>
            {/* Lyric Effects */}
            <div className="p-2.5 rounded-lg glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-slate-400">Lyric Effects</span>
                <span className="text-[8px] text-cyan-400/60">{lyricEffects.length} active</span>
              </div>
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
                <option value="">+ Add Effect</option>
                {availableLyricEffects.map((effect) => (
                  <option key={effect.id} value={effect.id}>
                    {effect.label}
                  </option>
                ))}
              </select>
              {/* Active effects list */}
              <div className="space-y-1">
                {lyricEffects.map((effect, index) => (
                  <div
                    key={effect.effectId}
                    className="flex items-center justify-between p-1.5 rounded bg-black/20"
                  >
                    <span className="text-[9px] text-slate-300">{effect.effectId}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggleLyricEffect(index)}
                        className={`text-[8px] px-1.5 py-0.5 rounded ${
                          effect.enabled
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {effect.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => onRemoveLyricEffect(index)}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Background Effects */}
            <div className="p-2.5 rounded-lg glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-slate-400">Background Effects</span>
                <span className="text-[8px] text-cyan-400/60">
                  {backgroundEffects.length} active
                </span>
              </div>
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
                <option value="">+ Add Effect</option>
                {availableBackgroundEffects.map((effect) => (
                  <option key={effect.id} value={effect.id}>
                    {effect.label}
                  </option>
                ))}
              </select>
              {/* Active effects list */}
              <div className="space-y-1">
                {backgroundEffects.map((effect, index) => (
                  <div
                    key={effect.effectId}
                    className="flex items-center justify-between p-1.5 rounded bg-black/20"
                  >
                    <span className="text-[9px] text-slate-300">{effect.effectId}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggleBackgroundEffect(index)}
                        className={`text-[8px] px-1.5 py-0.5 rounded ${
                          effect.enabled
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {effect.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => onRemoveBackgroundEffect(index)}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </section>
      </div>
    </div>
  );
};

export default ControlPanel;
