import { LyricLine } from '../../../types';
import {
  AIControlCommand,
  AIControlResponse,
  CommandAction,
  CommandScope,
  ControlDefinition,
  SliderRange,
} from './types';
import {
  CONTROL_REGISTRY,
  findControlsByNaturalLanguage,
  resolveValueAlias,
} from './controlRegistry';

// ============================================================================
// VALUE EXTRACTION PATTERNS
// ============================================================================

const VALUE_PATTERNS = {
  percentage: /(\d+)\s*%/,
  decimal: /(\d+\.?\d*)\s*x/,
  number: /\b(\d+\.?\d*)\b/,
  relativeUp:
    /(?:more|higher|stronger|faster|increase|intensify|louder|bigger|amp|boost|raise|up)/i,
  relativeDown: /(?:less|lower|weaker|slower|decrease|reduce|softer|quieter|smaller|down)/i,
  toggle: /(?:toggle|switch|flip)/i,
  enable: /(?:enable|turn on|activate|add|start|use|apply)/i,
  disable: /(?:disable|turn off|deactivate|remove|stop)/i,
  intensityHigh: /(?:a lot|much|significantly|way|really|very|super|extremely|max)/i,
  intensityLow: /(?:a little|slightly|bit|touch|barely|tiny|small)/i,
  // Compound command separators
  compoundSeparator: /\s+(?:and|,|also|plus|as well as|&)\s+/i,
};

// ============================================================================
// COMPOUND COMMAND PATTERNS
// ============================================================================

/**
 * Patterns for splitting compound commands while preserving context
 */
const COMPOUND_PATTERNS = {
  // "make it X and Y" -> ["make it X", "make it Y"]
  makeItPattern: /^(make\s+(?:it|the\s+\w+)\s+)/i,
  // "set X and Y" -> ["set X", "set Y"]
  setPattern: /^(set\s+)/i,
  // General command prefix to carry forward
  commandPrefix: /^((?:make|set|change|increase|decrease|turn|enable|disable)\s+(?:the\s+)?)/i,
};

// ============================================================================
// SECTION DETECTION PATTERNS
// ============================================================================

const SECTION_PATTERNS: { pattern: RegExp; normalizedName: string }[] = [
  { pattern: /(?:the\s+)?chorus(?:es)?/i, normalizedName: 'chorus' },
  { pattern: /(?:the\s+)?verse\s*(\d+)?/i, normalizedName: 'verse' },
  { pattern: /(?:the\s+)?bridge/i, normalizedName: 'bridge' },
  { pattern: /(?:the\s+)?intro(?:duction)?|(?:the\s+)?beginning/i, normalizedName: 'intro' },
  {
    pattern: /(?:the\s+)?outro|(?:the\s+)?end(?:ing)?|(?:the\s+)?conclusion/i,
    normalizedName: 'outro',
  },
  { pattern: /(?:the\s+)?pre-?chorus/i, normalizedName: 'pre-chorus' },
  { pattern: /(?:the\s+)?hook/i, normalizedName: 'chorus' }, // Hook is typically chorus
  { pattern: /(?:the\s+)?refrain/i, normalizedName: 'chorus' }, // Refrain is typically chorus
  { pattern: /(?:the\s+)?drop/i, normalizedName: 'drop' },
  { pattern: /(?:the\s+)?breakdown/i, normalizedName: 'breakdown' },
];

// ============================================================================
// COMPOUND COMMAND SPLITTING
// ============================================================================

/**
 * Split a compound command into individual sub-commands
 * e.g., "make it faster and brighter" -> ["make it faster", "make it brighter"]
 */
function splitCompoundCommand(message: string): string[] {
  const normalizedMessage = message.trim();

  // Check if this looks like a compound command
  if (!VALUE_PATTERNS.compoundSeparator.test(normalizedMessage)) {
    return [normalizedMessage];
  }

  // Extract any command prefix (e.g., "make it", "set the")
  let prefix = '';
  const prefixMatch = normalizedMessage.match(COMPOUND_PATTERNS.commandPrefix);
  if (prefixMatch) {
    prefix = prefixMatch[1];
  }

  // Split by compound separators
  const parts = normalizedMessage.split(VALUE_PATTERNS.compoundSeparator);

  // Filter empty parts and apply prefix to parts that don't have their own action verb
  const subCommands: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // First part keeps its original form (already has prefix)
    if (i === 0) {
      subCommands.push(part);
    } else {
      // Check if this part has its own action verb
      const hasOwnAction =
        VALUE_PATTERNS.relativeUp.test(part) ||
        VALUE_PATTERNS.relativeDown.test(part) ||
        VALUE_PATTERNS.enable.test(part) ||
        VALUE_PATTERNS.disable.test(part) ||
        /^(?:make|set|change|use)/i.test(part);

      if (hasOwnAction) {
        subCommands.push(part);
      } else if (prefix) {
        // Apply the prefix from the first part
        subCommands.push(prefix + part);
      } else {
        // Try to infer action from context
        subCommands.push('make it ' + part);
      }
    }
  }

  return subCommands.length > 0 ? subCommands : [normalizedMessage];
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Parse a natural language message into AI control commands
 * Supports compound commands like "make it faster and brighter"
 */
export function parseAIControlIntent(
  userMessage: string,
  selectedLyricIndices: Set<number>,
  lyrics: LyricLine[]
): AIControlResponse {
  // Split compound commands
  const subCommands = splitCompoundCommand(userMessage);
  const allCommands: AIControlCommand[] = [];
  const allSuggestions: string[] = [];

  // Determine scope once (applies to all sub-commands)
  const scope = determineScope(userMessage.toLowerCase().trim(), selectedLyricIndices, lyrics);

  // Process each sub-command
  for (const subCommand of subCommands) {
    const normalizedMessage = subCommand.toLowerCase().trim();

    // Find matching controls
    const matchedControls = findControlsByNaturalLanguage(normalizedMessage);

    if (matchedControls.length === 0) {
      // Collect suggestions but continue processing other sub-commands
      const suggestions = getSuggestedControls(normalizedMessage);
      allSuggestions.push(...suggestions);
      continue;
    }

    // Parse commands for each matched control
    for (const control of matchedControls) {
      const command = parseCommandForControl(normalizedMessage, control, scope);
      if (command) {
        allCommands.push(command);
      }
    }
  }

  // If no commands were parsed at all
  if (allCommands.length === 0) {
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 5);
    return {
      understood: false,
      commands: [],
      clarificationNeeded:
        subCommands.length > 1
          ? "I couldn't identify the settings you want to adjust. Could you be more specific about each change?"
          : "I couldn't identify which setting you want to adjust. Could you be more specific?",
      suggestedControls: uniqueSuggestions,
    };
  }

  return {
    understood: true,
    commands: allCommands,
    clarificationNeeded: undefined,
  };
}

// ============================================================================
// SCOPE DETECTION
// ============================================================================

interface ScopeResult {
  type: CommandScope;
  sectionName?: string;
  lyricIndices?: number[];
}

/**
 * Determine the scope of the command (global, section, or selection)
 */
function determineScope(
  message: string,
  selectedIndices: Set<number>,
  lyrics: LyricLine[]
): ScopeResult {
  // Check for explicit section mentions
  for (const { pattern, normalizedName } of SECTION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      // Extract verse number if present
      let sectionName = normalizedName;
      if (normalizedName === 'verse' && match[1]) {
        sectionName = `verse ${match[1]}`;
      }

      // Find lyric indices for this section
      const indices = lyrics
        .map((l, i) => ({ lyric: l, index: i }))
        .filter(({ lyric }) => lyric.section?.toLowerCase().includes(normalizedName.toLowerCase()))
        .map(({ index }) => index);

      return {
        type: 'section',
        sectionName,
        lyricIndices: indices,
      };
    }
  }

  // Check for explicit selection language
  if (
    message.includes('selected') ||
    message.includes('these lyrics') ||
    message.includes('this part') ||
    message.includes('these parts')
  ) {
    if (selectedIndices.size > 0) {
      return {
        type: 'selection',
        lyricIndices: Array.from(selectedIndices),
      };
    }
  }

  // Check if lyrics are selected (implicit scope)
  if (selectedIndices.size > 0) {
    // Derive section from selected lyrics
    const selectedLyrics = Array.from(selectedIndices)
      .map((i) => lyrics[i])
      .filter(Boolean);
    const sections = new Set(selectedLyrics.map((l) => l.section).filter(Boolean));

    if (sections.size === 1) {
      const sectionName = Array.from(sections)[0]!;
      return {
        type: 'section',
        sectionName: sectionName.toLowerCase(),
        lyricIndices: Array.from(selectedIndices),
      };
    } else if (sections.size > 1) {
      return {
        type: 'selection',
        lyricIndices: Array.from(selectedIndices),
      };
    }
  }

  // Default to global
  return { type: 'global' };
}

// ============================================================================
// COMMAND PARSING
// ============================================================================

/**
 * Parse a command for a specific control
 */
function parseCommandForControl(
  message: string,
  control: ControlDefinition,
  scope: ScopeResult
): AIControlCommand | null {
  let action: CommandAction;
  let value: number | string | boolean | undefined;
  let relativeAmount: number | undefined;

  if (control.valueType === 'boolean') {
    // Boolean controls: enable, disable, toggle
    if (VALUE_PATTERNS.enable.test(message)) {
      action = 'enable';
      value = true;
    } else if (VALUE_PATTERNS.disable.test(message)) {
      action = 'disable';
      value = false;
    } else if (VALUE_PATTERNS.toggle.test(message)) {
      action = 'toggle';
    } else {
      // Default to enable if just mentioning the control
      action = 'enable';
      value = true;
    }
  } else if (control.valueType === 'number') {
    // Number controls: set, increase, decrease
    if (VALUE_PATTERNS.relativeUp.test(message)) {
      action = 'increase';
      relativeAmount = extractRelativeAmount(message, control);
    } else if (VALUE_PATTERNS.relativeDown.test(message)) {
      action = 'decrease';
      relativeAmount = extractRelativeAmount(message, control);
    } else {
      // Try to extract an absolute value
      const extractedValue = extractNumericValue(message, control);
      if (extractedValue !== null) {
        action = 'set';
        value = extractedValue;
      } else {
        // Default to increase if just mentioning something that sounds like "more"
        if (message.includes('more') || message.includes('intense') || message.includes('energy')) {
          action = 'increase';
          relativeAmount = extractRelativeAmount(message, control);
        } else {
          return null;
        }
      }
    }
  } else if (control.valueType === 'enum' || control.valueType === 'string') {
    // Enum controls: set to a specific value
    const extractedValue = extractEnumValue(message, control);
    if (extractedValue) {
      action = 'set';
      value = extractedValue;
    } else {
      return null;
    }
  } else {
    return null;
  }

  return {
    action,
    controlId: control.id,
    value,
    relativeAmount,
    scope: scope.type,
    sectionName: scope.sectionName,
    lyricIndices: scope.lyricIndices,
    confidence: calculateConfidence(message, control, action),
  };
}

// ============================================================================
// VALUE EXTRACTION HELPERS
// ============================================================================

/**
 * Extract a numeric value from the message
 */
function extractNumericValue(message: string, control: ControlDefinition): number | null {
  const range = control.validValues as SliderRange | undefined;

  // Try percentage first (e.g., "50%")
  const percentMatch = message.match(VALUE_PATTERNS.percentage);
  if (percentMatch && range) {
    const percent = parseInt(percentMatch[1]) / 100;
    return range.min + (range.max - range.min) * percent;
  }

  // Try multiplier (e.g., "2x")
  const multiplierMatch = message.match(VALUE_PATTERNS.decimal);
  if (multiplierMatch) {
    const val = parseFloat(multiplierMatch[1]);
    if (range && val >= range.min && val <= range.max) {
      return val;
    }
  }

  // Try raw number
  const numberMatch = message.match(VALUE_PATTERNS.number);
  if (numberMatch) {
    const val = parseFloat(numberMatch[1]);
    if (range && val >= range.min && val <= range.max) {
      return val;
    }
  }

  return null;
}

/**
 * Extract a relative change amount
 */
function extractRelativeAmount(message: string, control: ControlDefinition): number {
  const range = control.validValues as SliderRange | undefined;

  if (range) {
    const rangeSize = range.max - range.min;

    // Check for intensity words
    if (VALUE_PATTERNS.intensityHigh.test(message)) {
      return rangeSize * 0.25; // 25% of range
    } else if (VALUE_PATTERNS.intensityLow.test(message)) {
      return rangeSize * 0.05; // 5% of range
    }

    return rangeSize * 0.1; // Default 10% of range
  }

  return 0.2; // Default for non-range values
}

/**
 * Extract an enum value from the message
 */
function extractEnumValue(message: string, control: ControlDefinition): string | null {
  if (!Array.isArray(control.validValues)) return null;

  const normalizedMessage = message.toLowerCase();

  // First try to resolve via aliases
  const aliasValue = resolveValueAlias(control.id, message);
  if (aliasValue && control.validValues.includes(aliasValue)) {
    return aliasValue;
  }

  // Direct match against valid values
  for (const validValue of control.validValues) {
    const normalizedValue = validValue.toLowerCase().replace(/_/g, ' ');
    if (normalizedMessage.includes(normalizedValue)) {
      return validValue;
    }
  }

  // Partial word match
  for (const validValue of control.validValues) {
    const words = validValue.toLowerCase().replace(/_/g, ' ').split(' ');
    for (const word of words) {
      if (word.length > 3 && normalizedMessage.includes(word)) {
        return validValue;
      }
    }
  }

  return null;
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

/**
 * Calculate confidence score for a parsed command
 */
function calculateConfidence(
  message: string,
  control: ControlDefinition,
  action: CommandAction
): number {
  let confidence = 0.5;
  const normalizedMessage = message.toLowerCase();

  // Boost for exact synonym match
  if (control.synonyms.some((syn) => normalizedMessage.includes(syn.toLowerCase()))) {
    confidence += 0.2;
  }

  // Boost for action verb match
  if (control.actionVerbs.some((verb) => normalizedMessage.includes(verb.toLowerCase()))) {
    confidence += 0.15;
  }

  // Boost for explicit values
  if (
    VALUE_PATTERNS.percentage.test(message) ||
    VALUE_PATTERNS.decimal.test(message) ||
    VALUE_PATTERNS.number.test(message)
  ) {
    confidence += 0.1;
  }

  // Boost for clear action indicators
  if (action === 'set' || action === 'enable' || action === 'disable') {
    confidence += 0.05;
  }

  return Math.min(confidence, 1);
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

/**
 * Get suggested controls based on partial message matching
 */
function getSuggestedControls(message: string): string[] {
  const words = message.toLowerCase().split(/\s+/);
  const suggestions: { control: ControlDefinition; score: number }[] = [];

  for (const control of CONTROL_REGISTRY) {
    let score = 0;

    // Check for partial word matches in synonyms
    for (const synonym of control.synonyms) {
      for (const word of words) {
        if (word.length > 2 && synonym.toLowerCase().includes(word)) {
          score += 1;
        }
      }
    }

    // Check for partial matches in display name
    for (const word of words) {
      if (word.length > 2 && control.displayName.toLowerCase().includes(word)) {
        score += 2;
      }
    }

    if (score > 0) {
      suggestions.push({ control, score });
    }
  }

  // Sort by score and return top 5 display names
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.control.displayName);
}

/**
 * Check if a message looks like a control command
 */
export function isControlCommand(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  // Check for action verbs
  const hasActionVerb =
    VALUE_PATTERNS.relativeUp.test(message) ||
    VALUE_PATTERNS.relativeDown.test(message) ||
    VALUE_PATTERNS.enable.test(message) ||
    VALUE_PATTERNS.disable.test(message) ||
    VALUE_PATTERNS.toggle.test(message) ||
    /(?:set|change|make|use|switch)/i.test(message);

  // Check for control keywords
  const hasControlKeyword = CONTROL_REGISTRY.some(
    (control) =>
      control.synonyms.some((syn) => normalizedMessage.includes(syn.toLowerCase())) ||
      normalizedMessage.includes(control.displayName.toLowerCase())
  );

  return hasActionVerb && hasControlKeyword;
}
