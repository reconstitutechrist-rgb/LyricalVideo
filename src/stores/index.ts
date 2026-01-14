/**
 * Zustand Stores
 * Centralized state management for LyricalVideo
 */

// Audio playback state
export {
  useAudioStore,
  selectIsAudioLoaded,
  selectIsAudioReady,
  selectPlaybackProgress,
} from './audioStore';
export type { AudioState, AudioActions, AudioStore } from './audioStore';

// Lyrics state
export {
  useLyricsStore,
  selectLyricsCount,
  selectHasLyrics,
  selectSelectedLyricsCount,
  selectIsLyricSelected,
  selectCurrentLyric,
  selectCurrentLyricIndex,
} from './lyricsStore';
export type { LyricsState, LyricsActions, LyricsStore } from './lyricsStore';

// Visual settings state (with persistence)
export {
  useVisualSettingsStore,
  selectActiveGenre,
  selectHasBackground,
  selectEnabledLyricEffects,
  selectEnabledBackgroundEffects,
  selectEffectCount,
  selectEnabledEffectCount,
} from './visualSettingsStore';
export type {
  VisualSettingsState,
  VisualSettingsActions,
  VisualSettingsStore,
} from './visualSettingsStore';

// Export settings state (with persistence)
export {
  useExportStore,
  selectIsExporting,
  selectExportStage,
  selectExportPercent,
  selectIsExportComplete,
  selectExportResolution,
  selectExportFormat,
  getResolutionDimensions,
} from './exportStore';
export type { ExportState, ExportActions, ExportStore } from './exportStore';

// UI Mode state (simple/advanced mode toggle with persistence)
export {
  useUIModeStore,
  selectIsAdvancedMode,
  selectIsSimpleMode,
  selectHasSeenAdvancedMode,
} from './uiModeStore';
export type { UIModeState, UIModeActions, UIModeStore } from './uiModeStore';
