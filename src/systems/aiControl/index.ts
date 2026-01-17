// AI Control System - Main Exports

// Types
export type {
  ControlDefinition,
  ControlType,
  ValueType,
  StoreType,
  PanelLocation,
  SliderRange,
  AIControlCommand,
  AIControlResponse,
  CommandAction,
  CommandScope,
  SectionOverride,
  SectionOverrideState,
  SectionOverrideActions,
  SectionOverrideStore,
  AIControlResult,
  HighlightOptions,
  AIControlChatMessage,
} from './types';

// Control Registry
export {
  CONTROL_REGISTRY,
  findControlById,
  findControlsByNaturalLanguage,
  getControlsRequiringAdvancedMode,
  getControlsBySection,
  getAllSections,
  VALUE_ALIASES,
  resolveValueAlias,
} from './controlRegistry';

// Intent Parser
export { parseAIControlIntent, isControlCommand } from './intentParser';

// Control Highlighter
export { controlHighlighter, injectHighlightStyles } from './controlHighlighter';

// Section Override Store
export {
  useSectionOverrideStore,
  selectOverridesArray,
  selectEnabledOverrides,
  selectOverrideCount,
  selectHasOverrides,
  selectOverrideForSection,
  getMergedSettingsForTime,
  hasSectionOverride,
  getSectionsWithOverrides,
} from './sectionOverrideStore';

// AI Control Service
export { aiControlService } from './aiControlService';
