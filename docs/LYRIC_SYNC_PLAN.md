# Automatic Lyric Synchronization System - Implementation Plan

## Overview

Implement a comprehensive automatic lyric sync system with three precision levels (line/word/syllable), AI-powered synchronization via Gemini, and a visual waveform timeline editor for manual adjustments.

## Preservation Guarantee

**All existing functionality is PRESERVED:**

- `analyzeAudioAndGetLyrics()` remains unchanged (new function added alongside)
- Existing edit mode UI in `LyricalFlowUI.tsx` is ENHANCED, not replaced
- Existing `Timeline` component (keyframe editor) remains untouched
- All bulk actions (time shift, text transform, overrides) remain intact

---

## Phase 1: Data Model Extensions

### File: [types.ts](../types.ts)

Add new types after `LyricLine` interface (around line 11):

```typescript
// Timing precision levels
export type TimingPrecision = 'line' | 'word' | 'syllable';

// Syllable-level timing
export interface SyllableTiming {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  phoneme?: string;
}

// Word-level timing
export interface WordTiming {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  syllables?: SyllableTiming[];
  confidence?: number;
}

// Sync configuration
export interface SyncConfig {
  precision: TimingPrecision;
  userLyrics?: string;
  language?: string;
  alignToBeats?: boolean;
}

// Sync result
export interface SyncResult {
  lyrics: LyricLine[];
  metadata: SongMetadata;
  precision: TimingPrecision;
  overallConfidence: number;
}
```

Extend `LyricLine` interface:

```typescript
export interface LyricLine {
  // ... existing fields ...
  words?: WordTiming[]; // NEW: word-level timing
  syncPrecision?: TimingPrecision; // NEW: precision used
  syncConfidence?: number; // NEW: AI confidence
}
```

Extend `AppState` interface (around line 151):

```typescript
export interface AppState {
  // ... existing fields ...
  syncPrecision: TimingPrecision; // NEW
  isSyncing: boolean; // NEW
  syncProgress: number; // NEW: 0-100
  waveformData: Float32Array | null; // NEW
}
```

---

## Phase 2: Enhanced AI Sync Service

### File: [services/geminiService.ts](../services/geminiService.ts)

**PRESERVE existing `analyzeAudioAndGetLyrics()` function** - it's used in 3 places:

- `App.tsx:280` - initial audio upload
- `App.tsx:424` - re-analyze flow
- `aiOrchestrator.ts:154` - full analysis pipeline

**ADD new function** `syncLyricsWithPrecision()` after `analyzeAudioAndGetLyrics()` (around line 160):

```typescript
export const syncLyricsWithPrecision = async (
  audioFile: File,
  config: SyncConfig,
  onProgress?: (percent: number) => void
): Promise<SyncResult> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  onProgress?.(10);

  const precisionInstructions = {
    line: 'Provide start/end timestamps for each LINE.',
    word: `Provide timestamps for EACH WORD. Return a "words" array for each line with:
           { text, startTime, endTime, confidence }`,
    syllable: `Provide timestamps for each SYLLABLE. Return "words" array, each word having
               a "syllables" array with: { text, startTime, endTime, phoneme }`,
  };

  const promptText = `
    Analyze this audio and synchronize lyrics with PRECISE timing.

    PRECISION: ${config.precision.toUpperCase()}
    ${precisionInstructions[config.precision]}

    ${
      config.userLyrics
        ? `
    ALIGN these provided lyrics (do NOT transcribe):
    """
    ${config.userLyrics}
    """
    `
        : 'Transcribe lyrics from audio.'
    }

    Return timestamps in seconds with 3 decimal precision (e.g., 1.234).
    Include confidence scores (0-1) based on audio clarity.
  `;

  // Build schema based on precision level
  const responseSchema = buildPrecisionSchema(config.precision);

  onProgress?.(30);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        { text: promptText },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  onProgress?.(90);

  return parseAndNormalizeSyncResult(response, config.precision);
};

// Helper to build schema for each precision level
function buildPrecisionSchema(precision: TimingPrecision): Schema {
  // ... schema definitions for line/word/syllable
}
```

---

## Phase 3: Audio Analysis Service

### New File: [services/audioAnalysisService.ts](../services/audioAnalysisService.ts)

```typescript
export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

// Generate waveform peaks for visualization
export const generateWaveformData = async (
  audioBuffer: AudioBuffer,
  targetWidth: number = 2000
): Promise<WaveformData> => {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPixel = Math.floor(channelData.length / targetWidth);
  const peaks = new Float32Array(targetWidth);

  for (let i = 0; i < targetWidth; i++) {
    const start = i * samplesPerPixel;
    const end = start + samplesPerPixel;
    let max = 0;
    for (let j = start; j < end && j < channelData.length; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  return { peaks, duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate };
};

// Time-to-pixel and pixel-to-time helpers
export const timeToPixel = (time: number, duration: number, width: number, zoom: number) =>
  (time / duration) * width * zoom;

export const pixelToTime = (pixel: number, duration: number, width: number, zoom: number) =>
  (pixel / (width * zoom)) * duration;
```

---

## Phase 4: Waveform Timeline Editor (NEW - Additive)

**Note**: This is a NEW component, separate from the existing `Timeline` component which handles keyframe animation editing. The WaveformEditor specifically handles lyric timing with audio visualization.

### New Directory: `src/components/WaveformEditor/`

#### [WaveformEditor.tsx](../src/components/WaveformEditor/WaveformEditor.tsx) - Main container

```typescript
interface WaveformEditorProps {
  audioBuffer: AudioBuffer | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  lyrics: LyricLine[];
  onLyricUpdate: (index: number, updates: Partial<LyricLine>) => void;
  syncPrecision: TimingPrecision;
  isPlaying: boolean;
  selectedLyricIndex: number | null;
  onSelectLyric: (index: number | null) => void;
}
```

Features:

- Zoom controls (0.5x to 8x)
- Horizontal scroll with scroll position state
- Playhead that follows `currentTime`
- Click-to-seek on waveform

#### [WaveformCanvas.tsx](../src/components/WaveformEditor/WaveformCanvas.tsx) - Waveform rendering

- Canvas-based rendering of audio peaks
- Gradient fill (e.g., blue-to-purple)
- Responds to zoom level

#### [LyricBlockLayer.tsx](../src/components/WaveformEditor/LyricBlockLayer.tsx) - Draggable lyric blocks

- Renders lyric blocks positioned by startTime/endTime
- Drag handles on left/right edges to resize
- Drag body to move entire block
- Shows word sub-blocks when precision is 'word' or 'syllable'
- Color-coded by section (verse, chorus, bridge)

#### [PlayheadLayer.tsx](../src/components/WaveformEditor/PlayheadLayer.tsx) - Playhead

- Vertical line at current playback position
- Time tooltip on hover
- Click-and-drag to scrub

#### [TimeRuler.tsx](../src/components/WaveformEditor/TimeRuler.tsx) - Time markers

- Shows time markers (0:00, 0:05, 0:10, etc.)
- Adjusts marker density based on zoom level

---

## Phase 5: Sync Configuration Panel

### New File: [src/components/SyncPanel/SyncPanel.tsx](../src/components/SyncPanel/SyncPanel.tsx)

```typescript
interface SyncPanelProps {
  precision: TimingPrecision;
  onPrecisionChange: (p: TimingPrecision) => void;
  userLyrics: string;
  onLyricsChange: (lyrics: string) => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  syncProgress: number;
}
```

UI Elements:

- **Precision Selector**: Radio buttons for Line / Word / Syllable
- **Lyrics Input**: Textarea for user-provided lyrics (optional)
- **Sync Button**: "Auto Sync" with loading spinner and progress bar
- **Confidence Display**: Shows sync confidence after completion

---

## Phase 6: Enhanced Timing Editor UI (ENHANCE existing)

### Modify: [App.tsx](../App.tsx) and [LyricalFlowUI.tsx](../src/components/LyricalFlowUI/LyricalFlowUI.tsx)

**PRESERVE all existing edit mode functionality** (lines 1309-1430 in LyricalFlowUI.tsx):

- Checkbox selection
- Start/end time number inputs
- Section dropdown
- Style/palette override dropdowns
- Inline text editing

**ENHANCE with additional features**:

1. **Drag-to-adjust time inputs**: Number inputs that respond to horizontal drag
2. **Word timing chips**: When precision > line, show expandable word timing
3. **Keyboard shortcuts**:
   - `[` / `]`: Nudge start time -/+ 0.1s
   - `{` / `}`: Nudge end time -/+ 0.1s
   - `Space`: Play/pause from current lyric

### New Component: [src/components/LyricEditor/WordTimingEditor.tsx](../src/components/LyricEditor/WordTimingEditor.tsx)

For editing word/syllable timing within a line:

- Horizontal word chips
- Mini waveform showing word boundaries
- Click to expand syllables (if syllable precision)

---

## Phase 7: Visualizer Karaoke Highlighting

### Modify: [components/Visualizer.tsx](../components/Visualizer.tsx)

Add karaoke-style word highlighting (around line 875):

```typescript
const renderKaraokeText = (ctx: CanvasRenderingContext2D, line: LyricLine, currentTime: number) => {
  if (!line.words) {
    // Fall back to existing line rendering
    return;
  }

  let xOffset = startX;
  line.words.forEach((word) => {
    const isActive = currentTime >= word.startTime && currentTime < word.endTime;
    const isPast = currentTime >= word.endTime;

    // Draw word with highlight gradient based on progress
    ctx.fillStyle = isPast ? highlightColor : isActive ? activeColor : dimColor;
    ctx.fillText(word.text + ' ', xOffset, y);
    xOffset += ctx.measureText(word.text + ' ').width;
  });
};
```

---

## Files Summary

| Action | File                                                                                                      | Preserves Existing?                     |
| ------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| EXTEND | [types.ts](../types.ts) - Add sync types                                                                  | Yes - adds new types only               |
| EXTEND | [services/geminiService.ts](../services/geminiService.ts) - Add `syncLyricsWithPrecision()`               | Yes - adds new function, keeps existing |
| CREATE | [services/audioAnalysisService.ts](../services/audioAnalysisService.ts)                                   | N/A - new file                          |
| CREATE | [src/components/WaveformEditor/WaveformEditor.tsx](../src/components/WaveformEditor/WaveformEditor.tsx)   | N/A - new file                          |
| CREATE | [src/components/WaveformEditor/WaveformCanvas.tsx](../src/components/WaveformEditor/WaveformCanvas.tsx)   | N/A - new file                          |
| CREATE | [src/components/WaveformEditor/LyricBlockLayer.tsx](../src/components/WaveformEditor/LyricBlockLayer.tsx) | N/A - new file                          |
| CREATE | [src/components/WaveformEditor/PlayheadLayer.tsx](../src/components/WaveformEditor/PlayheadLayer.tsx)     | N/A - new file                          |
| CREATE | [src/components/WaveformEditor/TimeRuler.tsx](../src/components/WaveformEditor/TimeRuler.tsx)             | N/A - new file                          |
| CREATE | [src/components/SyncPanel/SyncPanel.tsx](../src/components/SyncPanel/SyncPanel.tsx)                       | N/A - new file                          |
| CREATE | [src/components/LyricEditor/WordTimingEditor.tsx](../src/components/LyricEditor/WordTimingEditor.tsx)     | N/A - new file                          |
| EXTEND | [App.tsx](../App.tsx) - Add state, integrate new components                                               | Yes - adds new state/components         |
| EXTEND | [components/Visualizer.tsx](../components/Visualizer.tsx) - Add karaoke rendering path                    | Yes - adds new render path              |
| EXTEND | [LyricalFlowUI.tsx](../src/components/LyricalFlowUI/LyricalFlowUI.tsx) - Add word timing UI               | Yes - enhances edit mode                |

**UNTOUCHED files:**

- [src/components/Timeline/Timeline.tsx](../src/components/Timeline/Timeline.tsx) - Keyframe editor remains as-is
- All existing bulk action functions in App.tsx (applyBulkTimeShift, applyTextTransform, etc.)

---

## Implementation Order

1. **types.ts** - Add all new types first
2. **geminiService.ts** - Add `syncLyricsWithPrecision()`
3. **audioAnalysisService.ts** - Create waveform generation
4. **WaveformCanvas.tsx** - Basic waveform rendering
5. **WaveformEditor.tsx** - Container with zoom/scroll
6. **LyricBlockLayer.tsx** - Draggable blocks
7. **PlayheadLayer.tsx** + **TimeRuler.tsx** - Playback controls
8. **SyncPanel.tsx** - Sync UI with precision selector
9. **App.tsx** - Integration
10. **WordTimingEditor.tsx** - Word/syllable editing
11. **Visualizer.tsx** - Karaoke rendering

---

## Verification

1. **Test Auto-Sync**:
   - Upload an audio file
   - Select each precision level (line/word/syllable)
   - Click "Auto Sync" and verify lyrics are timed correctly
   - Check that word-level shows individual word timings

2. **Test Waveform Editor**:
   - Verify waveform renders correctly
   - Drag lyric blocks and confirm times update
   - Test zoom in/out
   - Test playhead scrubbing

3. **Test Manual Editing**:
   - Edit individual word timings
   - Use keyboard shortcuts to nudge times
   - Verify changes persist

4. **Test Karaoke Playback**:
   - Play video with word-level sync
   - Verify words highlight as they're sung
