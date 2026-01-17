/**
 * Custom Hooks
 */

export { useAbortableRequest, isAbortError } from './useAbortableRequest';
export { useAutoSave, saveProject, loadProject, deleteProject } from './useAutoSave';
export type { ProjectData } from './useAutoSave';

// Extracted hooks from App.tsx for better modularity
export { useAudioManagement } from './useAudioManagement';
export type { AudioManagementOptions, AudioManagementReturn } from './useAudioManagement';

export { useLyricEditor, MOTION_PRESETS } from './useLyricEditor';
export type { LyricEditorReturn } from './useLyricEditor';

export { useExportManager } from './useExportManager';
export type { ExportManagerOptions, ExportManagerReturn } from './useExportManager';

export { useAIInteractions } from './useAIInteractions';
export type {
  AIControlPending,
  AIInteractionsOptions,
  AIInteractionsReturn,
} from './useAIInteractions';

export { useUndoRedo } from './useUndoRedo';

// Visualizer hooks
export { useVisualizerAudio } from './useVisualizerAudio';

// Responsive utilities
export { useResponsive, useBreakpoint, useMaxBreakpoint } from './useResponsive';
export type { Breakpoint, ResponsiveState } from './useResponsive';

// Touch/drag utilities
export { useTouchDrag } from './useTouchDrag';
export type { TouchDragOptions, TouchDragReturn, Position, Delta } from './useTouchDrag';
