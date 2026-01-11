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

export interface GeneratedAsset {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum VisualStyle {
  NEON_PULSE = 'NEON_PULSE',
  LIQUID_DREAM = 'LIQUID_DREAM',
  GLITCH_CYBER = 'GLITCH_CYBER',
  CINEMATIC_BACKDROP = 'CINEMATIC_BACKDROP',
  MINIMAL_TYPE = 'MINIMAL_TYPE',
  KALEIDOSCOPE = 'KALEIDOSCOPE',
  CHROMATIC_WAVE = 'CHROMATIC_WAVE',
}

export type ColorPalette = 'neon' | 'sunset' | 'ocean' | 'matrix' | 'fire';
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
export type FontFamily = 'Space Grotesk' | 'Inter' | 'Roboto' | 'Montserrat' | 'Cinzel';
export type FrequencyBand = 'bass' | 'mid' | 'treble' | 'avg';

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
}

/**
 * Music Genre for genre-aware effects
 */
export enum Genre {
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
 */
export interface PeakVisual {
  peakId: string;
  lyricIndices: number[]; // Which lyrics use this visual
  asset: GeneratedAsset;
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
