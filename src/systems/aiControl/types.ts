import { VisualSettings, LyricLine } from '../../../types';

// ============================================================================
// CONTROL DEFINITION TYPES
// ============================================================================

export type ControlType = 'slider' | 'toggle' | 'dropdown' | 'button-group' | 'color-palette';
export type ValueType = 'number' | 'boolean' | 'string' | 'enum';
export type StoreType = 'visualSettings' | 'lyrics' | 'uiMode' | 'export';
export type PanelLocation = 'left' | 'right' | 'center';

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

export interface ControlDefinition {
  /** Unique identifier: 'animation-speed', 'bass-shake', etc. */
  id: string;
  /** Human-readable name: "Animation Speed" */
  displayName: string;
  /** Description for AI context */
  description: string;

  // Store mapping
  /** Path in store: e.g., 'visualSettings.particleSpeed' */
  storePath: string;
  /** Which store this control modifies */
  storeType: StoreType;

  // UI mapping
  /** CSS selector to find the control element */
  domSelector: string;
  /** Which panel the control is in */
  panelLocation: PanelLocation;
  /** Section name in UI: "FX Controls", "Visual Direction" */
  sectionName: string;

  // Control type & validation
  controlType: ControlType;
  valueType: ValueType;
  /** Valid values - either enum array or slider range */
  validValues?: string[] | SliderRange;

  // Mode visibility
  /** Whether this control only appears in Advanced mode */
  requiresAdvancedMode: boolean;

  // Natural language recognition
  /** Synonyms for this control: ['speed', 'animation speed', 'how fast'] */
  synonyms: string[];
  /** Action verbs: ['increase', 'decrease', 'speed up'] */
  actionVerbs: string[];
}

// ============================================================================
// AI COMMAND TYPES
// ============================================================================

export type CommandAction = 'set' | 'increase' | 'decrease' | 'toggle' | 'enable' | 'disable';
export type CommandScope = 'global' | 'section' | 'selection';

export interface AIControlCommand {
  /** The action to perform */
  action: CommandAction;
  /** ID of the control to adjust */
  controlId: string;
  /** Absolute value for 'set' action */
  value?: number | string | boolean;
  /** Relative change amount for increase/decrease */
  relativeAmount?: number;
  /** Scope of the adjustment */
  scope: CommandScope;
  /** Section name if scope is 'section' */
  sectionName?: string;
  /** Lyric indices if scope is 'selection' */
  lyricIndices?: number[];
  /** AI confidence in this interpretation (0-1) */
  confidence: number;
}

export interface AIControlResponse {
  /** Whether the intent was understood */
  understood: boolean;
  /** Parsed commands */
  commands: AIControlCommand[];
  /** Message to show user if clarification needed */
  clarificationNeeded?: string;
  /** Alternative controls if intent was ambiguous */
  suggestedControls?: string[];
}

// ============================================================================
// SECTION OVERRIDE TYPES
// ============================================================================

export interface SectionOverride {
  /** Section name: 'chorus', 'verse 1' */
  sectionName: string;
  /** Which lyric indices this override applies to */
  lyricIndices: number[];
  /** Partial visual settings to override */
  settings: Partial<VisualSettings>;
  /** Whether this override is active */
  enabled: boolean;
}

export interface SectionOverrideState {
  /** Map of section name to override */
  overrides: Map<string, SectionOverride>;
}

export interface SectionOverrideActions {
  setOverride: (sectionName: string, override: SectionOverride) => void;
  updateOverride: (sectionName: string, settings: Partial<VisualSettings>) => void;
  removeOverride: (sectionName: string) => void;
  toggleOverride: (sectionName: string) => void;
  clearAllOverrides: () => void;
  getSettingsForLyric: (
    lyricIndex: number,
    lyrics: LyricLine[],
    globalSettings: VisualSettings
  ) => VisualSettings;
  getOverrideForTime: (currentTime: number, lyrics: LyricLine[]) => SectionOverride | null;
}

export type SectionOverrideStore = SectionOverrideState & SectionOverrideActions;

// ============================================================================
// AI CONTROL SERVICE TYPES
// ============================================================================

export interface AIControlResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Message to display to user */
  message: string;
  /** Names of controls that were highlighted */
  controlsHighlighted: string[];
  /** Whether user confirmation is needed */
  requiresConfirmation: boolean;
  /** Commands waiting for user confirmation */
  pendingCommands?: AIControlCommand[];
}

export interface HighlightOptions {
  /** How long to show highlight (ms) */
  duration?: number;
  /** Whether to scroll element into view */
  scrollIntoView?: boolean;
  /** Whether to animate with pulse effect */
  pulseAnimation?: boolean;
}

// ============================================================================
// CHAT INTEGRATION TYPES
// ============================================================================

export interface AIControlChatMessage {
  /** Standard chat message role */
  role: 'user' | 'model';
  /** Message text */
  text: string;
  /** Timestamp */
  timestamp: Date;
  /** Whether this message is a control confirmation prompt */
  isControlConfirmation?: boolean;
  /** Commands associated with this message */
  commands?: AIControlCommand[];
}
