// =============================================================================
// GLOBAL TYPE AUGMENTATIONS
// =============================================================================

// Extend Window interface for Safari/older browser AudioContext support
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// =============================================================================
// LYRIC SYNC TYPES - Multi-precision timing system
// =============================================================================

/**
 * Timing precision levels for lyric synchronization
 */
export type TimingPrecision = 'line' | 'word' | 'syllable';

/**
 * Syllable-level timing for precise karaoke-style sync
 */
export interface SyllableTiming {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  phoneme?: string; // Optional IPA phoneme representation
}

/**
 * Word-level timing with optional syllable breakdown
 */
export interface WordTiming {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  syllables?: SyllableTiming[]; // Present when syllable-level sync is used
  confidence?: number; // AI confidence 0-1
}

/**
 * Configuration for AI sync operation
 */
export interface SyncConfig {
  precision: TimingPrecision;
  userLyrics?: string;
  language?: string; // For phonetic analysis
  alignToBeats?: boolean; // Snap to detected beats
}

/**
 * Result from AI synchronization
 */
export interface SyncResult {
  lyrics: LyricLine[];
  metadata: SongMetadata;
  precision: TimingPrecision;
  overallConfidence: number;
  processingTimeMs?: number;
}

// =============================================================================
// LYRIC LINE - Core lyric structure
// =============================================================================

export interface LyricLine {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  styleOverride?: VisualStyle;
  paletteOverride?: ColorPalette;
  section?: string; // e.g., "Verse 1", "Chorus"
  sentimentColor?: string; // Hex code e.g., "#FF0000"
  keyframes?: TextKeyframe[];
  // Word/syllable timing (when precision > line)
  words?: WordTiming[];
  syncPrecision?: TimingPrecision;
  syncConfidence?: number; // AI confidence for this line
}

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'bounce'
  | 'elastic'
  | 'back';

export interface TextKeyframe {
  time: number; // 0.0 to 1.0 (normalized progress)
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  easing?: EasingType;
}

export interface MotionPreset {
  label: string;
  keyframes: TextKeyframe[];
}

export interface SongMetadata {
  title: string;
  artist: string;
  genre: string;
  mood: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type VideoResolution = '720p' | '1080p';

// Export settings for professional output quality
export type ExportResolution = '720p' | '1080p' | '4K';
export type ExportFramerate = 24 | 30 | 60;
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ExportFormat = 'webm' | 'mp4';

export interface ExportSettings {
  resolution: ExportResolution;
  framerate: ExportFramerate;
  quality: ExportQuality;
  format: ExportFormat;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: '1080p',
  framerate: 30,
  quality: 'high',
  format: 'mp4',
};

export interface ExportProgress {
  stage: 'recording' | 'processing' | 'converting' | 'complete';
  percent: number;
  message?: string;
}

/**
 * Video segment for extended backgrounds (non-looping)
 */
export interface VideoSegment {
  url: string;
  startTime: number; // When this segment starts in the song
  duration: number; // Segment duration (typically 8 seconds)
}

/**
 * Simple asset with a single URL (image or single video)
 * Used for peak visuals and UI previews that always have a URL
 */
export type SimpleAsset =
  | { type: 'image'; url: string; prompt: string }
  | { type: 'video'; url: string; prompt: string };

/**
 * Generated asset - supports single images, single videos, or extended video backgrounds
 */
export type GeneratedAsset =
  | SimpleAsset
  | { type: 'extended-video'; segments: VideoSegment[]; prompt: string };

/**
 * Type guard to check if an asset is a simple asset with a URL
 */
export function isSimpleAsset(asset: GeneratedAsset): asset is SimpleAsset {
  return asset.type === 'image' || asset.type === 'video';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum VisualStyle {
  // Original styles
  NEON_PULSE = 'NEON_PULSE',
  LIQUID_DREAM = 'LIQUID_DREAM',
  GLITCH_CYBER = 'GLITCH_CYBER',
  CINEMATIC_BACKDROP = 'CINEMATIC_BACKDROP',
  MINIMAL_TYPE = 'MINIMAL_TYPE',
  KALEIDOSCOPE = 'KALEIDOSCOPE',
  CHROMATIC_WAVE = 'CHROMATIC_WAVE',
  // New styles - Nature/Organic
  AURORA_BOREALIS = 'AURORA_BOREALIS',
  WATER_RIPPLE = 'WATER_RIPPLE',
  FIRE_EMBERS = 'FIRE_EMBERS',
  // New styles - Retro/Vintage
  VHS_RETRO = 'VHS_RETRO',
  FILM_NOIR = 'FILM_NOIR',
  // New styles - Abstract/Geometric
  FRACTAL_ZOOM = 'FRACTAL_ZOOM',
  PARTICLE_NEBULA = 'PARTICLE_NEBULA',
  GEOMETRIC_MORPH = 'GEOMETRIC_MORPH',
}

export type ColorPalette =
  // Original palettes
  | 'neon'
  | 'sunset'
  | 'ocean'
  | 'matrix'
  | 'fire'
  // New palettes - Pastels & Soft
  | 'pastel'
  | 'grayscale'
  | 'sepia'
  // New palettes - Seasonal
  | 'autumn'
  | 'winter'
  | 'spring'
  // New palettes - High contrast & Nature
  | 'cyberpunk'
  | 'nature';
export type TextAnimationStyle = 'NONE' | 'TYPEWRITER' | 'FADE_CHARS' | 'KINETIC' | 'BOUNCE';
export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';
// Built-in fonts as literal union for type safety, but allow custom font strings
export type BuiltinFontFamily = 'Space Grotesk' | 'Inter' | 'Roboto' | 'Montserrat' | 'Cinzel';
export type FontFamily = BuiltinFontFamily | (string & {}); // Allows custom fonts while keeping intellisense for built-ins
export type FrequencyBand = 'bass' | 'mid' | 'treble' | 'avg' | 'beat' | 'energy';

export interface VisualSettings {
  particleSpeed: number;
  speedX: number;
  speedY: number;
  intensity: number;
  palette: ColorPalette;
  colorPalette: ColorPalette; // UI-friendly alias for palette
  dynamicBackgroundOpacity: boolean;
  dynamicBackgroundPulse: boolean; // UI-friendly alias for dynamicBackgroundOpacity
  textAnimation: TextAnimationStyle;
  backgroundBlendMode: BlendMode;
  blendMode: BlendMode; // UI-friendly alias for backgroundBlendMode
  fontFamily: FontFamily;
  textStagger: number; // Seconds delay between chars
  textRevealDuration: number; // Seconds for one char to fully appear
  kineticRotationRange: number; // Factor for rotation intensity
  kineticOffsetRange: number; // Pixels for max vertical offset
  glitchFrequency: number; // 0.0 to 1.0
  trailsEnabled: boolean; // Toggle particle trails
  particleTrails: boolean; // UI-friendly alias for trailsEnabled
  cameraShake: boolean; // Toggle bass-reactive camera shake
  cameraShakeIntensity: number; // Scalar for camera shake power
  shakeIntensity: number; // UI-friendly alias for cameraShakeIntensity
  reactivityIntensity: number; // Overall reactivity to audio (0.5 - 3.0)
  lyricsOnlyMode: boolean; // Disable all background effects, show only lyrics
  fontSizeScale: number; // Scale factor for lyrics font size (0.5 - 2.0)
  frequencyMapping: {
    pulse: FrequencyBand; // Drives scaling/size
    motion: FrequencyBand; // Drives movement speed/offset
    color: FrequencyBand; // Drives color shifts/glow
  };
}

export interface AppState {
  audioFile: File | null;
  audioUrl: string | null;
  lyrics: LyricLine[];
  userProvidedLyrics: string;
  userCreativeVision: string; // User's creative vision for the video
  metadata: SongMetadata | null;
  currentStyle: VisualStyle;
  backgroundAsset: GeneratedAsset | null;
  currentTime: number;
  isPlaying: boolean;
  isRecording: boolean;
  aspectRatio: AspectRatio;
  visualSettings: VisualSettings;
  audioBuffer: AudioBuffer | null;
  // Effect system state
  lyricEffects: EffectInstanceConfig[];
  backgroundEffects: EffectInstanceConfig[];
  detectedGenre: Genre | null;
  genreOverride: Genre | null;
  // Lyric sync state
  syncPrecision: TimingPrecision;
  isSyncing: boolean;
  syncProgress: number; // 0-100
  lastSyncConfidence: number | null;
}

/**
 * Music Genre for genre-aware effects
 */
export enum Genre {
  // Original genres
  HIPHOP = 'hiphop',
  ROCK = 'rock',
  ELECTRONIC = 'electronic',
  CLASSICAL = 'classical',
  POP = 'pop',
  INDIE = 'indie',
  RNB = 'rnb',
  JAZZ = 'jazz',
  COUNTRY = 'country',
  METAL = 'metal',
  // New genres
  LOFI = 'lofi',
  REGGAE = 'reggae',
  AMBIENT = 'ambient',
  PUNK = 'punk',
  FUTUREBASS = 'futurebass',
}

/**
 * Genre detection result from AI
 */
export interface GenreDetectionResult {
  genre: Genre;
  confidence: number;
  suggestedStyle: string;
  mood: string;
}

/**
 * Effect instance configuration for state management
 */
export interface EffectInstanceConfig {
  effectId: string;
  parameters: Record<string, number | string | boolean>;
  enabled: boolean;
}

/**
 * Effect parameter value types
 */
export type EffectParameterValue = number | string | boolean;

// =============================================================================
// VIDEO PLAN TYPES - Multi-AI Architecture
// =============================================================================

/**
 * Cross-verified analysis result from multiple AI systems
 */
export interface CrossVerifiedAnalysis {
  geminiResult: GenreDetectionResult;
  claudeResult: GenreDetectionResult;
  consensusGenre: Genre;
  consensusMood: string;
  confidence: number; // 0-1, higher when both AIs agree
  disagreements?: string[];
}

/**
 * Emotional peak detected in the song (chorus, climax, etc.)
 */
export interface EmotionalPeak {
  id: string;
  lyricIndex: number;
  startTime: number;
  endTime: number;
  peakType: 'chorus' | 'climax' | 'bridge' | 'outro' | 'energy_spike';
  intensity: number; // 0-1
  suggestedVisual?: string; // AI-generated prompt for this moment
}

/**
 * Hybrid visual plan with shared and peak-specific visuals
 */
export interface HybridVisualPlan {
  sharedBackground: GeneratedAsset | null; // Default for non-peak sections
  peakVisuals: PeakVisual[]; // Unique visuals for emotional peaks
}

/**
 * Generated visual for an emotional peak
 * Note: Peak visuals are always images (SimpleAsset), never extended-video
 */
export interface PeakVisual {
  peakId: string;
  lyricIndices: number[]; // Which lyrics use this visual
  asset: SimpleAsset;
  transitionIn: 'fade' | 'cut' | 'dissolve';
  transitionOut: 'fade' | 'cut' | 'dissolve';
}

/**
 * Background strategy - AI decides video vs image
 */
export interface BackgroundStrategy {
  useVideo: boolean; // AI decides based on genre/energy
  videoPrompt?: string; // Prompt for Veo 3.1 if useVideo=true
  imagePrompt?: string; // Prompt for static image if useVideo=false
  reasoning: string; // Why AI chose this approach
}

/**
 * Video plan mood description
 */
export interface VideoPlanMood {
  primary: string; // e.g., "Energetic", "Melancholic"
  secondary?: string;
  intensity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Video plan color palette
 */
export interface VideoPlanColorPalette {
  name: string;
  primary: string; // Hex color
  secondary: string;
  accent: string;
  background: string;
  text: string;
  previewGradient: string; // CSS gradient for thumbnail preview
}

/**
 * Video plan visual style settings
 */
export interface VideoPlanVisualStyle {
  style: VisualStyle;
  textAnimation: TextAnimationStyle;
  fontFamily: FontFamily;
  blendMode: BlendMode;
  intensity: number;
  particleSpeed: number;
}

/**
 * Video plan effect configuration
 */
export interface VideoPlanEffect {
  effectId: string;
  name: string;
  description: string;
  parameters: Record<string, number | string | boolean>;
  reason?: string; // Why this effect was chosen
}

/**
 * Complete video plan generated by multi-AI system
 */
export interface VideoPlan {
  id: string;
  createdAt: Date;
  version: number;
  status: 'draft' | 'approved' | 'applied';

  // User input
  userCreativeVision?: string; // User's described vision (or empty for AI-only)

  // Analysis (cross-verified)
  analysis: CrossVerifiedAnalysis;
  emotionalPeaks: EmotionalPeak[];

  // Visual direction
  mood: VideoPlanMood;
  colorPalette: VideoPlanColorPalette;
  visualStyle: VideoPlanVisualStyle;
  backgroundEffect: VideoPlanEffect;
  lyricEffects: VideoPlanEffect[];

  // Background strategy (AI-decided)
  backgroundStrategy: BackgroundStrategy;

  // Hybrid visuals
  hybridVisuals: HybridVisualPlan;

  // AI-generated summary
  summary: string;
  rationale: string;
}
