/**
 * ProjectTemplate Types and Presets
 * Defines project templates for quick-start with genre-specific visual settings.
 */

import { VisualStyle, ColorPalette } from '../../../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  thumbnail: string; // Emoji or icon reference
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  visualStyle: VisualStyle;
  lyricEffect: string;
  backgroundEffect: string;
  particlesEnabled: boolean;
  glowIntensity: number;
  backgroundOpacity: number;
  palette: ColorPalette;
  fontFamily?: string;
}

// Gradient color templates for visual variety
export const TEMPLATE_GRADIENTS = {
  neon: 'linear-gradient(135deg, #ff00ff, #00ffff)',
  sunset: 'linear-gradient(135deg, #ff6b6b, #feca57)',
  ocean: 'linear-gradient(135deg, #0077b6, #00b4d8)',
  forest: 'linear-gradient(135deg, #2d6a4f, #95d5b2)',
  midnight: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  fire: 'linear-gradient(135deg, #ff4e00, #ec9f05)',
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // Pop / Dance
  {
    id: 'pop-vibrant',
    name: 'Pop Vibrant',
    description: 'Energetic neon colors with bouncy animations',
    genre: 'Pop',
    thumbnail: '🎵',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      background: '#1a1a2e',
      text: '#ffffff',
    },
    visualStyle: VisualStyle.NEON_PULSE,
    lyricEffect: 'bounce',
    backgroundEffect: 'gradient',
    particlesEnabled: true,
    glowIntensity: 0.8,
    backgroundOpacity: 0.7,
    palette: 'neon',
  },
  {
    id: 'pop-pastel',
    name: 'Pastel Dream',
    description: 'Soft pastel tones with gentle fade effects',
    genre: 'Pop',
    thumbnail: '🌸',
    colors: {
      primary: '#ffb3ba',
      secondary: '#bae1ff',
      background: '#fef0f0',
      text: '#333333',
    },
    visualStyle: VisualStyle.MINIMAL_TYPE,
    lyricEffect: 'fade',
    backgroundEffect: 'solid',
    particlesEnabled: false,
    glowIntensity: 0.3,
    backgroundOpacity: 0.9,
    palette: 'pastel',
  },

  // Hip-Hop / Rap
  {
    id: 'hiphop-bold',
    name: 'Urban Bold',
    description: 'High contrast with aggressive reveal animations',
    genre: 'Hip-Hop',
    thumbnail: '🎤',
    colors: {
      primary: '#ffd700',
      secondary: '#ff4500',
      background: '#0d0d0d',
      text: '#ffffff',
    },
    visualStyle: VisualStyle.CINEMATIC_BACKDROP,
    lyricEffect: 'reveal',
    backgroundEffect: 'particles',
    particlesEnabled: true,
    glowIntensity: 0.6,
    backgroundOpacity: 0.8,
    palette: 'fire',
  },
  {
    id: 'hiphop-trap',
    name: 'Trap Wave',
    description: 'Dark purple tones with glitch aesthetics',
    genre: 'Hip-Hop',
    thumbnail: '💎',
    colors: {
      primary: '#9b59b6',
      secondary: '#e056fd',
      background: '#130f40',
      text: '#ffffff',
    },
    visualStyle: VisualStyle.GLITCH_CYBER,
    lyricEffect: 'glitch',
    backgroundEffect: 'gradient',
    particlesEnabled: true,
    glowIntensity: 0.9,
    backgroundOpacity: 0.6,
    palette: 'cyberpunk',
  },

  // R&B / Soul
  {
    id: 'rnb-smooth',
    name: 'Smooth Soul',
    description: 'Warm golden tones with elegant animations',
    genre: 'R&B',
    thumbnail: '✨',
    colors: {
      primary: '#c9b037',
      secondary: '#f4e4ba',
      background: '#2c1810',
      text: '#f4e4ba',
    },
    visualStyle: VisualStyle.LIQUID_DREAM,
    lyricEffect: 'slide',
    backgroundEffect: 'gradient',
    particlesEnabled: false,
    glowIntensity: 0.4,
    backgroundOpacity: 0.85,
    palette: 'sunset',
  },

  // EDM / Electronic
  {
    id: 'edm-rave',
    name: 'Rave Energy',
    description: 'Intense neon with beat-synced particles',
    genre: 'EDM',
    thumbnail: '🔊',
    colors: {
      primary: '#00ff00',
      secondary: '#ff00ff',
      background: '#000000',
      text: '#ffffff',
    },
    visualStyle: VisualStyle.NEON_PULSE,
    lyricEffect: 'scale',
    backgroundEffect: 'particles',
    particlesEnabled: true,
    glowIntensity: 1.0,
    backgroundOpacity: 0.5,
    palette: 'matrix',
  },
  {
    id: 'edm-synthwave',
    name: 'Synthwave',
    description: 'Retro 80s aesthetic with grid backgrounds',
    genre: 'EDM',
    thumbnail: '🌆',
    colors: {
      primary: '#ff6ec7',
      secondary: '#00d4ff',
      background: '#1a0a2e',
      text: '#ffffff',
    },
    visualStyle: VisualStyle.VHS_RETRO,
    lyricEffect: 'typewriter',
    backgroundEffect: 'gradient',
    particlesEnabled: true,
    glowIntensity: 0.7,
    backgroundOpacity: 0.7,
    palette: 'neon',
  },

  // Rock / Alternative
  {
    id: 'rock-grunge',
    name: 'Grunge Rock',
    description: 'Raw textures with gritty animations',
    genre: 'Rock',
    thumbnail: '🎸',
    colors: {
      primary: '#b8860b',
      secondary: '#8b0000',
      background: '#1a1a1a',
      text: '#d4d4d4',
    },
    visualStyle: VisualStyle.FILM_NOIR,
    lyricEffect: 'shake',
    backgroundEffect: 'noise',
    particlesEnabled: false,
    glowIntensity: 0.3,
    backgroundOpacity: 0.9,
    palette: 'sepia',
  },

  // Acoustic / Indie
  {
    id: 'acoustic-warm',
    name: 'Acoustic Warmth',
    description: 'Cozy earth tones with gentle transitions',
    genre: 'Acoustic',
    thumbnail: '🍂',
    colors: {
      primary: '#d4a373',
      secondary: '#ccd5ae',
      background: '#faedcd',
      text: '#3d405b',
    },
    visualStyle: VisualStyle.WATER_RIPPLE,
    lyricEffect: 'fade',
    backgroundEffect: 'solid',
    particlesEnabled: false,
    glowIntensity: 0.2,
    backgroundOpacity: 0.95,
    palette: 'autumn',
  },
  {
    id: 'indie-minimal',
    name: 'Indie Minimal',
    description: 'Clean typography with subtle motion',
    genre: 'Indie',
    thumbnail: '📀',
    colors: {
      primary: '#2d3436',
      secondary: '#636e72',
      background: '#ffffff',
      text: '#2d3436',
    },
    visualStyle: VisualStyle.MINIMAL_TYPE,
    lyricEffect: 'fade',
    backgroundEffect: 'solid',
    particlesEnabled: false,
    glowIntensity: 0.1,
    backgroundOpacity: 1.0,
    palette: 'grayscale',
  },

  // Lo-Fi / Chill
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Chill',
    description: 'Muted colors with VHS-style effects',
    genre: 'Lo-Fi',
    thumbnail: '📼',
    colors: {
      primary: '#a8e6cf',
      secondary: '#dcedc1',
      background: '#2c2c54',
      text: '#f5f5f5',
    },
    visualStyle: VisualStyle.VHS_RETRO,
    lyricEffect: 'fade',
    backgroundEffect: 'noise',
    particlesEnabled: false,
    glowIntensity: 0.4,
    backgroundOpacity: 0.85,
    palette: 'pastel',
  },

  // Classical / Orchestral
  {
    id: 'classical-elegant',
    name: 'Classical Elegance',
    description: 'Sophisticated serif typography with graceful animations',
    genre: 'Classical',
    thumbnail: '🎻',
    colors: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      background: '#ecf0f1',
      text: '#2c3e50',
    },
    visualStyle: VisualStyle.MINIMAL_TYPE,
    lyricEffect: 'fade',
    backgroundEffect: 'solid',
    particlesEnabled: false,
    glowIntensity: 0.1,
    backgroundOpacity: 1.0,
    palette: 'grayscale',
  },
];

// Extract unique genres from templates
export const GENRE_LIST = [...new Set(PROJECT_TEMPLATES.map((t) => t.genre))];

// Group templates by genre for quick lookup
export const TEMPLATES_BY_GENRE = PROJECT_TEMPLATES.reduce(
  (acc, template) => {
    if (!acc[template.genre]) {
      acc[template.genre] = [];
    }
    acc[template.genre].push(template);
    return acc;
  },
  {} as Record<string, ProjectTemplate[]>
);
