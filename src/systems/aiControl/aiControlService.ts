import { VisualSettings, VisualStyle, AspectRatio, Genre } from '../../../types';
import { AIControlCommand, AIControlResult, ControlDefinition, SliderRange } from './types';
import { findControlById } from './controlRegistry';
import { parseAIControlIntent, isControlCommand } from './intentParser';
import { controlHighlighter, injectHighlightStyles } from './controlHighlighter';
import { useSectionOverrideStore } from './sectionOverrideStore';
import { useVisualSettingsStore } from '../../stores/visualSettingsStore';
import { useLyricsStore } from '../../stores/lyricsStore';
import { useUIModeStore } from '../../stores/uiModeStore';

// ============================================================================
// AI CONTROL SERVICE
// Main coordinator for AI-powered control system
// ============================================================================

class AIControlService {
  private pendingCommands: AIControlCommand[] = [];
  private initialized = false;

  /**
   * Initialize the service (inject styles, etc.)
   */
  init(): void {
    if (this.initialized) return;
    injectHighlightStyles();
    controlHighlighter.init();
    this.initialized = true;
  }

  /**
   * Check if a message looks like a control command
   */
  isControlCommand(message: string): boolean {
    return isControlCommand(message);
  }

  /**
   * Process a natural language message
   */
  async processMessage(userMessage: string): Promise<AIControlResult> {
    this.init();

    const lyricsStore = useLyricsStore.getState();
    const { selectedLyricIndices, lyrics } = lyricsStore;

    // Parse the intent
    const response = parseAIControlIntent(userMessage, selectedLyricIndices, lyrics);

    if (!response.understood || response.commands.length === 0) {
      return {
        success: false,
        message: response.clarificationNeeded || "I couldn't understand that request.",
        controlsHighlighted: [],
        requiresConfirmation: false,
      };
    }

    // Highlight the identified controls
    const controlsHighlighted: string[] = [];
    for (const command of response.commands) {
      const control = findControlById(command.controlId);
      if (control) {
        controlHighlighter.highlightControl(control, { duration: 8000 });
        controlsHighlighted.push(control.displayName);

        // Auto-enable advanced mode if needed
        if (control.requiresAdvancedMode) {
          const uiModeStore = useUIModeStore.getState();
          if (!uiModeStore.isAdvancedMode) {
            uiModeStore.setAdvancedMode(true);
          }
        }
      }
    }

    // Store pending commands
    this.pendingCommands = response.commands;

    // Build confirmation message
    const actionDescriptions = response.commands.map((cmd) => this.describeCommand(cmd)).join(', ');
    const scopeDescription = this.describeScopeForCommands(response.commands);

    return {
      success: true,
      message: `I'll ${actionDescriptions}${scopeDescription}. Should I apply this change, or would you prefer to adjust it manually using the highlighted control?`,
      controlsHighlighted,
      requiresConfirmation: true,
      pendingCommands: response.commands,
    };
  }

  /**
   * Apply all pending commands
   */
  applyPendingCommands(): { success: boolean; message: string } {
    if (this.pendingCommands.length === 0) {
      return { success: false, message: 'No pending changes to apply.' };
    }

    const results: string[] = [];
    const errors: string[] = [];

    for (const command of this.pendingCommands) {
      try {
        this.executeCommand(command);
        const control = findControlById(command.controlId);
        results.push(control?.displayName || command.controlId);
      } catch (error) {
        console.error(`Failed to execute command for ${command.controlId}:`, error);
        errors.push(command.controlId);
      }
    }

    // Clear pending commands
    this.pendingCommands = [];

    // Clear highlights
    controlHighlighter.clearAllHighlights();

    if (errors.length > 0) {
      return {
        success: false,
        message: `Applied changes to: ${results.join(', ')}. Failed: ${errors.join(', ')}`,
      };
    }

    return {
      success: true,
      message: `Applied changes to: ${results.join(', ')}`,
    };
  }

  /**
   * Cancel pending commands (user chose "just show me")
   */
  cancelPendingCommands(): void {
    this.pendingCommands = [];
    // Keep highlights visible so user can find the control
  }

  /**
   * Get current pending commands
   */
  getPendingCommands(): AIControlCommand[] {
    return [...this.pendingCommands];
  }

  /**
   * Check if there are pending commands
   */
  hasPendingCommands(): boolean {
    return this.pendingCommands.length > 0;
  }

  /**
   * Execute a single command
   */
  private executeCommand(command: AIControlCommand): void {
    const control = findControlById(command.controlId);
    if (!control) {
      throw new Error(`Unknown control: ${command.controlId}`);
    }

    // Calculate new value
    const newValue = this.calculateNewValue(command, control);

    // Apply based on scope
    if (command.scope === 'global') {
      this.applyGlobalValue(control, newValue);
    } else if (command.scope === 'section' && command.sectionName) {
      this.applySectionOverride(command.sectionName, control, newValue);
    } else if (command.scope === 'selection' && command.lyricIndices) {
      this.applyToSelection(control, newValue, command.lyricIndices);
    } else {
      // Default to global
      this.applyGlobalValue(control, newValue);
    }
  }

  /**
   * Calculate the new value for a command
   */
  private calculateNewValue(
    command: AIControlCommand,
    control: ControlDefinition
  ): number | string | boolean {
    if (command.action === 'toggle') {
      const currentValue = this.getCurrentValue(control);
      return !currentValue;
    }

    if (command.action === 'enable') {
      return true;
    }

    if (command.action === 'disable') {
      return false;
    }

    if (command.action === 'increase' || command.action === 'decrease') {
      const currentValue = this.getCurrentValue(control) as number;
      const delta = command.relativeAmount || 0.1;
      let newValue = command.action === 'increase' ? currentValue + delta : currentValue - delta;

      // Clamp to valid range
      const range = control.validValues as SliderRange | undefined;
      if (range && typeof range === 'object' && 'min' in range) {
        newValue = Math.max(range.min, Math.min(range.max, newValue));
      }

      return newValue;
    }

    // 'set' action
    return command.value!;
  }

  /**
   * Get the current value of a control
   */
  private getCurrentValue(control: ControlDefinition): number | string | boolean {
    const visualSettingsStore = useVisualSettingsStore.getState();
    const uiModeStore = useUIModeStore.getState();

    if (control.storeType === 'uiMode') {
      return uiModeStore.isAdvancedMode;
    }

    // Navigate the store path
    const pathParts = control.storePath.split('.');
    let value: unknown = visualSettingsStore;

    for (const part of pathParts) {
      value = (value as Record<string, unknown>)[part];
    }

    return value as number | string | boolean;
  }

  /**
   * Apply a value globally
   */
  private applyGlobalValue(control: ControlDefinition, value: number | string | boolean): void {
    const visualSettingsStore = useVisualSettingsStore.getState();
    const uiModeStore = useUIModeStore.getState();

    if (control.storeType === 'uiMode') {
      uiModeStore.setAdvancedMode(value as boolean);
      return;
    }

    const pathParts = control.storePath.split('.');

    if (pathParts[0] === 'visualSettings') {
      if (pathParts.length === 2) {
        visualSettingsStore.updateVisualSettings({ [pathParts[1]]: value });
      } else if (pathParts.length === 3) {
        // Handle nested like frequencyMapping.pulse
        const currentSettings = visualSettingsStore.visualSettings;
        const nestedKey = pathParts[1] as keyof typeof currentSettings;
        const subKey = pathParts[2];
        visualSettingsStore.updateVisualSettings({
          [nestedKey]: {
            ...(currentSettings[nestedKey] as object),
            [subKey]: value,
          },
        });
      }
    } else if (pathParts[0] === 'currentStyle') {
      visualSettingsStore.setCurrentStyle(value as VisualStyle);
    } else if (pathParts[0] === 'aspectRatio') {
      visualSettingsStore.setAspectRatio(value as AspectRatio);
    } else if (pathParts[0] === 'genreOverride') {
      visualSettingsStore.setGenreOverride(value as Genre);
    }
  }

  /**
   * Apply a section-specific override
   */
  private applySectionOverride(
    sectionName: string,
    control: ControlDefinition,
    value: number | string | boolean
  ): void {
    const sectionOverrideStore = useSectionOverrideStore.getState();
    const lyricsStore = useLyricsStore.getState();

    // Find lyrics in this section
    const lyricIndices = lyricsStore.lyrics
      .map((l, i) => ({ lyric: l, index: i }))
      .filter(({ lyric }) => lyric.section?.toLowerCase().includes(sectionName.toLowerCase()))
      .map(({ index }) => index);

    // Build settings object
    const pathParts = control.storePath.split('.');
    let settings: Partial<VisualSettings> = {};

    if (pathParts[0] === 'visualSettings' && pathParts.length >= 2) {
      if (pathParts.length === 2) {
        settings = { [pathParts[1]]: value } as Partial<VisualSettings>;
      } else if (pathParts.length === 3) {
        settings = { [pathParts[1]]: { [pathParts[2]]: value } } as Partial<VisualSettings>;
      }
    }

    // Get or create override
    const existingOverride = sectionOverrideStore.overrides.get(sectionName.toLowerCase());

    if (existingOverride) {
      sectionOverrideStore.updateOverride(sectionName, settings);
    } else {
      sectionOverrideStore.setOverride(sectionName, {
        sectionName,
        lyricIndices,
        settings,
        enabled: true,
      });
    }
  }

  /**
   * Apply to selected lyrics
   */
  private applyToSelection(
    control: ControlDefinition,
    value: number | string | boolean,
    lyricIndices: number[]
  ): void {
    const lyricsStore = useLyricsStore.getState();
    const { lyrics } = lyricsStore;

    // Group by section
    const sectionGroups = new Map<string, number[]>();

    for (const index of lyricIndices) {
      const lyric = lyrics[index];
      const section = lyric?.section || `selection-${index}`;

      if (!sectionGroups.has(section)) {
        sectionGroups.set(section, []);
      }
      sectionGroups.get(section)!.push(index);
    }

    // Apply to each section group
    for (const [section] of sectionGroups) {
      this.applySectionOverride(section, control, value);
    }
  }

  /**
   * Generate human-readable description of a command
   */
  private describeCommand(command: AIControlCommand): string {
    const control = findControlById(command.controlId);
    const controlName = control?.displayName || command.controlId;

    switch (command.action) {
      case 'set':
        return `set ${controlName} to ${this.formatValue(command.value)}`;
      case 'increase':
        return `increase ${controlName}`;
      case 'decrease':
        return `decrease ${controlName}`;
      case 'toggle':
        return `toggle ${controlName}`;
      case 'enable':
        return `enable ${controlName}`;
      case 'disable':
        return `disable ${controlName}`;
      default:
        return `adjust ${controlName}`;
    }
  }

  /**
   * Format a value for display
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? 'on' : 'off';
    }
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    if (typeof value === 'string') {
      return value.replace(/_/g, ' ').toLowerCase();
    }
    return String(value);
  }

  /**
   * Generate scope description for commands
   */
  private describeScopeForCommands(commands: AIControlCommand[]): string {
    const scopes = new Set(commands.map((c) => c.scope));

    if (scopes.has('section')) {
      const sectionNames = commands.filter((c) => c.sectionName).map((c) => c.sectionName);
      const uniqueSections = [...new Set(sectionNames)];
      return ` for ${uniqueSections.join(', ')}`;
    }

    if (scopes.has('selection')) {
      return ' for the selected lyrics';
    }

    return ' for the entire song';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const aiControlService = new AIControlService();
