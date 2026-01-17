/**
 * Export Presets Service
 * Platform-specific export presets and custom preset management
 */

import {
  ExportSettings,
  ExportResolution,
  ExportFramerate,
  ExportQuality,
  ExportFormat,
  AspectRatio,
} from '../types';

export interface ExportPreset extends ExportSettings {
  id: string;
  name: string;
  platform: string;
  icon?: string;
  description?: string;
  aspectRatio: AspectRatio;
}

export interface CustomExportPreset extends ExportPreset {
  isCustom: true;
  createdAt: number;
}

// Platform-specific presets with optimized settings
export const PLATFORM_PRESETS: Record<string, ExportPreset> = {
  'youtube-1080p': {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    platform: 'YouTube',
    description: 'Standard HD quality for YouTube',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '16:9' as AspectRatio,
  },
  'youtube-4k': {
    id: 'youtube-4k',
    name: 'YouTube 4K',
    platform: 'YouTube',
    description: 'Ultra HD quality for YouTube',
    resolution: '4K' as ExportResolution,
    framerate: 60 as ExportFramerate,
    quality: 'ultra' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '16:9' as AspectRatio,
  },
  'instagram-feed': {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    platform: 'Instagram',
    description: 'Square format for Instagram feed posts',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '1:1' as AspectRatio,
  },
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'Instagram',
    description: 'Vertical format for Instagram stories',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '9:16' as AspectRatio,
  },
  'instagram-reel': {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    platform: 'Instagram',
    description: 'Vertical format for Instagram Reels',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '9:16' as AspectRatio,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'TikTok',
    description: 'Vertical format optimized for TikTok',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '9:16' as AspectRatio,
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    platform: 'Twitter',
    description: 'Standard format for Twitter/X videos',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '16:9' as AspectRatio,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    platform: 'Facebook',
    description: 'Standard format for Facebook videos',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '16:9' as AspectRatio,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    platform: 'LinkedIn',
    description: 'Professional format for LinkedIn',
    resolution: '1080p' as ExportResolution,
    framerate: 30 as ExportFramerate,
    quality: 'high' as ExportQuality,
    format: 'mp4' as ExportFormat,
    aspectRatio: '16:9' as AspectRatio,
  },
};

// Storage key for custom presets
const STORAGE_KEY = 'lyricalflow-custom-presets';

class ExportPresetsService {
  private customPresets: Map<string, CustomExportPreset> = new Map();

  constructor() {
    this.loadCustomPresets();
  }

  /**
   * Get all platform presets
   */
  getPlatformPresets(): ExportPreset[] {
    return Object.values(PLATFORM_PRESETS);
  }

  /**
   * Get presets grouped by platform
   */
  getPresetsByPlatform(): Record<string, ExportPreset[]> {
    const grouped: Record<string, ExportPreset[]> = {};
    for (const preset of Object.values(PLATFORM_PRESETS)) {
      if (!grouped[preset.platform]) {
        grouped[preset.platform] = [];
      }
      grouped[preset.platform].push(preset);
    }
    return grouped;
  }

  /**
   * Get a specific platform preset by ID
   */
  getPresetById(id: string): ExportPreset | CustomExportPreset | undefined {
    return PLATFORM_PRESETS[id] || this.customPresets.get(id);
  }

  /**
   * Get all custom presets
   */
  getCustomPresets(): CustomExportPreset[] {
    return [...this.customPresets.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Save current settings as a custom preset
   */
  saveCustomPreset(
    name: string,
    settings: ExportSettings,
    aspectRatio: AspectRatio
  ): CustomExportPreset {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const preset: CustomExportPreset = {
      id,
      name,
      platform: 'Custom',
      ...settings,
      aspectRatio,
      isCustom: true,
      createdAt: Date.now(),
    };
    this.customPresets.set(id, preset);
    this.saveToStorage();
    return preset;
  }

  /**
   * Update an existing custom preset
   */
  updateCustomPreset(
    id: string,
    updates: Partial<
      Pick<
        CustomExportPreset,
        'name' | 'resolution' | 'framerate' | 'quality' | 'format' | 'aspectRatio'
      >
    >
  ): CustomExportPreset | undefined {
    const preset = this.customPresets.get(id);
    if (!preset) return undefined;

    const updated = { ...preset, ...updates };
    this.customPresets.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Delete a custom preset
   */
  deleteCustomPreset(id: string): boolean {
    const deleted = this.customPresets.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Check if settings match a preset
   */
  findMatchingPreset(
    settings: ExportSettings,
    aspectRatio: AspectRatio
  ): ExportPreset | CustomExportPreset | undefined {
    // Check platform presets
    for (const preset of Object.values(PLATFORM_PRESETS)) {
      if (this.settingsMatch(preset, settings, aspectRatio)) {
        return preset;
      }
    }
    // Check custom presets
    for (const preset of this.customPresets.values()) {
      if (this.settingsMatch(preset, settings, aspectRatio)) {
        return preset;
      }
    }
    return undefined;
  }

  /**
   * Check if export settings match a preset
   */
  private settingsMatch(
    preset: ExportPreset | CustomExportPreset,
    settings: ExportSettings,
    aspectRatio: AspectRatio
  ): boolean {
    return (
      preset.resolution === settings.resolution &&
      preset.framerate === settings.framerate &&
      preset.quality === settings.quality &&
      preset.format === settings.format &&
      preset.aspectRatio === aspectRatio
    );
  }

  /**
   * Load custom presets from localStorage
   */
  private loadCustomPresets(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const presets = JSON.parse(stored) as CustomExportPreset[];
        for (const preset of presets) {
          this.customPresets.set(preset.id, preset);
        }
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }

  /**
   * Save custom presets to localStorage
   */
  private saveToStorage(): void {
    try {
      const presets = [...this.customPresets.values()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }
}

// Singleton instance
export const exportPresetsService = new ExportPresetsService();
