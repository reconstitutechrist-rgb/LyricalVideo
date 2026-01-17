/**
 * LyricalFlowUI Constants
 * Shared configuration and options extracted from LyricalFlowUI.
 */

import {
  VisualStyle,
  AspectRatio,
  ColorPalette,
  TextAnimationStyle,
  BlendMode,
  FrequencyBand,
} from '../../../types';

// ============================================
// Visual Style Options
// ============================================

export const STYLE_OPTIONS: { value: VisualStyle; label: string }[] = [
  // Original styles
  { value: VisualStyle.NEON_PULSE, label: 'NEON PULSE' },
  { value: VisualStyle.LIQUID_DREAM, label: 'LIQUID DREAM' },
  { value: VisualStyle.GLITCH_CYBER, label: 'GLITCH CYBER' },
  { value: VisualStyle.CINEMATIC_BACKDROP, label: 'CINEMATIC' },
  { value: VisualStyle.MINIMAL_TYPE, label: 'MINIMAL' },
  { value: VisualStyle.KALEIDOSCOPE, label: 'KALEIDOSCOPE' },
  { value: VisualStyle.CHROMATIC_WAVE, label: 'CHROMATIC WAVE' },
  // Nature/Organic styles
  { value: VisualStyle.AURORA_BOREALIS, label: 'AURORA BOREALIS' },
  { value: VisualStyle.WATER_RIPPLE, label: 'WATER RIPPLE' },
  { value: VisualStyle.FIRE_EMBERS, label: 'FIRE EMBERS' },
  // Retro/Vintage styles
  { value: VisualStyle.VHS_RETRO, label: 'VHS RETRO' },
  { value: VisualStyle.FILM_NOIR, label: 'FILM NOIR' },
  // Abstract/Geometric styles
  { value: VisualStyle.FRACTAL_ZOOM, label: 'FRACTAL ZOOM' },
  { value: VisualStyle.PARTICLE_NEBULA, label: 'PARTICLE NEBULA' },
  { value: VisualStyle.GEOMETRIC_MORPH, label: 'GEOMETRIC MORPH' },
];

// ============================================
// Advanced Options Data
// ============================================

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
];

export const COLOR_PALETTE_OPTIONS: { value: ColorPalette; label: string; colors: string[] }[] = [
  // Original palettes
  { value: 'neon', label: 'Neon', colors: ['#00ffff', '#ff00ff', '#00ff00'] },
  { value: 'sunset', label: 'Sunset', colors: ['#ff6b35', '#f7c59f', '#efa00b'] },
  { value: 'ocean', label: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef'] },
  { value: 'matrix', label: 'Matrix', colors: ['#00ff41', '#008f11', '#003b00'] },
  { value: 'fire', label: 'Fire', colors: ['#ff0000', '#ff7700', '#ffcc00'] },
  // Pastel & Soft palettes
  { value: 'pastel', label: 'Pastel', colors: ['#ffd1dc', '#bae1ff', '#baffc9'] },
  { value: 'grayscale', label: 'Grayscale', colors: ['#ffffff', '#808080', '#000000'] },
  { value: 'sepia', label: 'Sepia', colors: ['#704214', '#a67b5b', '#e1d4bb'] },
  // Seasonal palettes
  { value: 'autumn', label: 'Autumn', colors: ['#8b4513', '#d2691e', '#ff8c00'] },
  { value: 'winter', label: 'Winter', colors: ['#e0f7fa', '#80deea', '#26c6da'] },
  { value: 'spring', label: 'Spring', colors: ['#98fb98', '#ffb6c1', '#f0e68c'] },
  // High contrast & Nature palettes
  { value: 'cyberpunk', label: 'Cyberpunk', colors: ['#ff00ff', '#00ffff', '#ff0080'] },
  { value: 'nature', label: 'Nature', colors: ['#228b22', '#32cd32', '#6b8e23'] },
];

export const TEXT_ANIMATION_OPTIONS: { value: TextAnimationStyle; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'TYPEWRITER', label: 'Typewriter' },
  { value: 'FADE_CHARS', label: 'Fade Chars' },
  { value: 'KINETIC', label: 'Kinetic' },
  { value: 'BOUNCE', label: 'Bounce' },
];

export const FREQUENCY_BAND_OPTIONS: { value: FrequencyBand; label: string }[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'mid', label: 'Mid' },
  { value: 'treble', label: 'Treble' },
  { value: 'avg', label: 'Average' },
];

export const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
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

export const SECTION_TYPE_OPTIONS = [
  'verse',
  'chorus',
  'bridge',
  'intro',
  'outro',
  'pre-chorus',
  'hook',
  'breakdown',
];

export const GENRE_OPTIONS = [
  // Original genres
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
  // New genres
  'lofi',
  'reggae',
  'ambient',
  'punk',
  'futurebass',
];

// Style options for per-line override (includes "none" option)
export const STYLE_OVERRIDE_OPTIONS: { value: VisualStyle | ''; label: string }[] = [
  { value: '', label: 'Default' },
  // Original styles
  { value: VisualStyle.NEON_PULSE, label: 'Neon Pulse' },
  { value: VisualStyle.LIQUID_DREAM, label: 'Liquid Dream' },
  { value: VisualStyle.GLITCH_CYBER, label: 'Glitch Cyber' },
  { value: VisualStyle.CINEMATIC_BACKDROP, label: 'Cinematic' },
  { value: VisualStyle.MINIMAL_TYPE, label: 'Minimal' },
  { value: VisualStyle.KALEIDOSCOPE, label: 'Kaleidoscope' },
  { value: VisualStyle.CHROMATIC_WAVE, label: 'Chromatic Wave' },
  // Nature/Organic styles
  { value: VisualStyle.AURORA_BOREALIS, label: 'Aurora Borealis' },
  { value: VisualStyle.WATER_RIPPLE, label: 'Water Ripple' },
  { value: VisualStyle.FIRE_EMBERS, label: 'Fire Embers' },
  // Retro/Vintage styles
  { value: VisualStyle.VHS_RETRO, label: 'VHS Retro' },
  { value: VisualStyle.FILM_NOIR, label: 'Film Noir' },
  // Abstract/Geometric styles
  { value: VisualStyle.FRACTAL_ZOOM, label: 'Fractal Zoom' },
  { value: VisualStyle.PARTICLE_NEBULA, label: 'Particle Nebula' },
  { value: VisualStyle.GEOMETRIC_MORPH, label: 'Geometric Morph' },
];

export const PALETTE_OVERRIDE_OPTIONS: { value: ColorPalette | ''; label: string }[] = [
  { value: '', label: 'Default' },
  // Original palettes
  { value: 'neon', label: 'Neon' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'fire', label: 'Fire' },
  // Pastel & Soft palettes
  { value: 'pastel', label: 'Pastel' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'sepia', label: 'Sepia' },
  // Seasonal palettes
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  // High contrast & Nature palettes
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'nature', label: 'Nature' },
];

// Available effects for adding
export const LYRIC_EFFECT_OPTIONS = [
  { id: 'glow', label: 'Glow', description: 'Text glow effect' },
  { id: 'bounce', label: 'Bounce', description: 'Bouncy text animation' },
  { id: 'wave', label: 'Wave', description: 'Wavy text motion' },
  { id: 'shake', label: 'Shake', description: 'Audio-reactive shake' },
  { id: 'color-shift', label: 'Color Shift', description: 'Dynamic color changes' },
];

export const BACKGROUND_EFFECT_OPTIONS = [
  { id: 'particles', label: 'Particles', description: 'Floating particles' },
  { id: 'pulse', label: 'Pulse', description: 'Beat-synced pulse' },
  { id: 'vignette', label: 'Vignette', description: 'Dark edges effect' },
  { id: 'chromatic', label: 'Chromatic', description: 'RGB split effect' },
  { id: 'blur', label: 'Blur', description: 'Background blur' },
];

// Motion presets for keyframe animation
export const MOTION_PRESET_OPTIONS = [
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
// Music Section Colors
// ============================================

export const getSectionStyle = (section?: string): string => {
  if (!section) return 'border-l-cyan-500/30';
  const s = section.toLowerCase();
  if (s.includes('chorus') || s.includes('hook')) return 'border-l-emerald-400';
  if (s.includes('verse')) return 'border-l-cyan-500';
  if (s.includes('bridge')) return 'border-l-purple-500';
  if (s.includes('intro') || s.includes('outro')) return 'border-l-amber-400';
  return 'border-l-slate-500';
};
