# LyricalVideo Comprehensive Improvement Plan

## Overview

This plan addresses improvements across audio analysis, visual effects, and performance for the Lyrical Flow AI application. The improvements support production export, real-time preview, and mobile/web use cases.

---

## Phase 1: Audio Analysis Improvements

### 1.1 Pre-computed Beat Detection (High Priority)

**Problem**: Beat detection in `services/beatDetectionService.ts` is real-time only, causing reactive rather than predictive synchronization.

**Solution**: Add batch analysis method to process entire audio buffer on upload.

**Files to Create**:

- `services/precomputedBeatService.ts` - Offline beat analysis
- `src/stores/beatMapStore.ts` - Store beat map data

**Files to Modify**:

- `services/beatDetectionService.ts` - Add `analyzeBatch(audioBuffer)` method
- `src/stores/audioStore.ts` - Add beatMap reference
- `components/Visualizer.tsx` - Use pre-computed beats when available

**Implementation**:

```typescript
interface BeatMap {
  beats: { time: number; intensity: number; confidence: number }[];
  bpmSegments: { startTime: number; bpm: number }[];
  energyProfile: Float32Array;
  duration: number;
}
```

### 1.2 Frequency Smoothing for Cleaner Reactivity (Medium Priority)

**Problem**: Raw spectral flux is jittery, causing erratic visual responses.

**Solution**: Add configurable low-pass filtering and exponential moving average smoothing.

**Files to Modify**:

- `services/beatDetectionService.ts:131` - Add smoothing options to `adaptiveThreshold` calculation
- Add new method `getSmoothedAudioFeatures()` with configurable smoothing factor

### 1.3 Enhanced Transcription Confidence (Low Priority)

**Problem**: `services/geminiService.ts` returns transcription without validation.

**Solution**: Add confidence thresholds and visual indicators for low-confidence segments.

**Files to Create**:

- `src/utils/confidenceValidation.ts` - Validation utilities

**Files to Modify**:

- `services/geminiService.ts:499-638` - Add confidence filtering
- `src/components/LyricEditor/WordTimingEditor.tsx` - Show confidence indicators

### 1.4 Manual Sync Adjustment Tools (Medium Priority)

**Problem**: Limited manual editing for timing adjustments.

**Solution**: Add drag-to-adjust on timeline, bulk offset, and snap-to-beat features.

**Files to Create**:

- `src/components/LyricEditor/TimelineDragHandler.tsx`

**Files to Modify**:

- `src/components/LyricEditor/WordTimingEditor.tsx` - Add drag handlers
- `src/stores/lyricsStore.ts` - Add `bulkOffsetAll(ms)` and `snapToBeat()` actions

---

## Phase 2: Visual Effect Crispness

### 2.1 Beat Look-ahead Synchronization (High Priority)

**Problem**: Effects respond to beats after they happen due to real-time detection latency.

**Solution**: Use pre-computed beat map for anticipation-based triggering.

**Files to Modify**:

- `components/Visualizer.tsx:633-680` - Add look-ahead using beat map
- `src/effects/core/Effect.ts` - Add `upcomingBeat` field to AudioData interface

**Implementation**:

```typescript
// Add to AudioData interface
upcomingBeat?: {
  timeUntil: number;      // ms until next beat
  intensity: number;      // predicted intensity
};
```

### 2.2 Sub-frame Timing Accuracy (Medium Priority)

**Problem**: `currentTime` from audio element updates at ~60Hz, not matching audio sample timing.

**Solution**: Use `AudioContext.currentTime` for higher precision.

**Files to Modify**:

- `components/Visualizer.tsx` - Use AudioContext.currentTime
- `src/effects/lyric/LyricEffect.ts:29-44` - Improve progress calculation precision

### 2.3 Anti-aliasing Improvements (Medium Priority)

**Problem**: Canvas 2D and WebGL rendering could be sharper.

**Solution**: Enable anti-aliasing on WebGL, improve high-DPI handling.

**Files to Modify**:

- `src/renderers/WebGLParticleRenderer.ts:56-57` - Set `antialias: true`
- `components/Visualizer.tsx` - Ensure consistent devicePixelRatio handling

---

## Phase 3: Performance Optimizations

### 3.1 Character Data Caching (High Priority)

**Problem**: `LyricEffect.ts:29-44` `getCharacters()` recalculates positions every frame.

**Solution**: Cache character positions per lyric text.

**Files to Modify**:

- `src/effects/lyric/LyricEffect.ts`

**Implementation**:

```typescript
export abstract class CharacterLyricEffect extends BaseLyricEffect {
  private characterCache: Map<string, CharacterData[]> = new Map();

  protected getCharacters(context: LyricEffectContext): CharacterData[] {
    const cacheKey = `${context.text}:${context.fontSize}:${context.fontFamily}`;

    if (this.characterCache.has(cacheKey)) {
      return this.characterCache.get(cacheKey)!;
    }

    const positions = getCenteredCharacterPositions(/*...*/);
    const characters = positions.map(/*...*/);
    this.characterCache.set(cacheKey, characters);
    return characters;
  }

  reset(): void {
    this.characterCache.clear();
  }
}
```

### 3.2 Frame Budget Management (Medium Priority)

**Problem**: Effects render without time constraints, causing frame drops.

**Solution**: Add frame budget system to EffectComposer.

**Files to Create**:

- `src/utils/frameBudget.ts`

**Files to Modify**:

- `src/effects/core/EffectComposer.ts:98-141` - Add budget-aware rendering

**Implementation**:

```typescript
class FrameBudget {
  private startTime: number = 0;
  readonly budgetMs: number = 16; // 60fps target

  begin(): void {
    this.startTime = performance.now();
  }

  hasTimeFor(estimatedMs: number): boolean {
    return performance.now() - this.startTime + estimatedMs < this.budgetMs;
  }
}
```

### 3.3 GPU-Accelerated Film Grain (Medium Priority)

**Problem**: Film grain in `CanvasUtils.ts` iterates all pixels on CPU.

**Solution**: Create WebGL shader for film grain.

**Files to Create**:

- `src/shaders/filmGrain.glsl`
- `src/renderers/WebGLEffectsRenderer.ts`

**Files to Modify**:

- `src/effects/utils/CanvasUtils.ts` - Add GPU path fallback

### 3.4 Object Pool Expansion (Low Priority)

**Problem**: Fragment arrays in physics effects recreated per frame.

**Solution**: Extend ParticlePool pattern to other object types.

**Files to Create**:

- `src/utils/objectPool.ts` - Generic pooling utility

**Files to Modify**:

- `src/effects/particle/Particle.ts` - Enhance existing pool

---

## Phase 4: New Features

### 4.1 Undo/Redo System (High Priority)

**Problem**: No undo capability for edits.

**Solution**: Implement command pattern with history stack.

**Files to Create**:

- `src/stores/historyStore.ts`

**Files to Modify**:

- `src/stores/lyricsStore.ts` - Wrap mutations in undoable actions
- `src/stores/visualSettingsStore.ts` - Wrap mutations

**Implementation**:

```typescript
interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];

  push(entry: HistoryEntry): void;
  undo(): void;
  redo(): void;
}
```

### 4.2 Advanced Waveform Sync Editor (Medium Priority)

**Problem**: No visual waveform-based timing adjustment.

**Solution**: Add waveform overlay to sync editor with beat markers.

**Files to Create**:

- `src/components/SyncEditor/WaveformSyncEditor.tsx`
- `src/components/SyncEditor/BeatSnapTool.tsx`

**Files to Modify**:

- `src/components/WaveformEditor/WaveformEditor.tsx` - Add sync mode overlay

---

## Implementation Order (Priority-Sorted)

| #   | Item                        | Impact | Effort | Files   |
| --- | --------------------------- | ------ | ------ | ------- |
| 1   | Pre-computed Beat Detection | High   | Medium | 4 files |
| 2   | Character Data Caching      | High   | Low    | 1 file  |
| 3   | Beat Look-ahead Sync        | High   | Medium | 2 files |
| 4   | Undo/Redo System            | High   | Medium | 3 files |
| 5   | Frame Budget Management     | Medium | Medium | 2 files |
| 6   | Frequency Smoothing         | Medium | Low    | 1 file  |
| 7   | Sub-frame Timing            | Medium | Low    | 2 files |
| 8   | Manual Sync Tools           | Medium | Medium | 3 files |
| 9   | Anti-aliasing               | Medium | Low    | 2 files |
| 10  | GPU Film Grain              | Medium | High   | 3 files |
| 11  | Waveform Sync Editor        | Medium | High   | 3 files |
| 12  | Confidence Validation       | Low    | Low    | 2 files |
| 13  | Object Pool Expansion       | Low    | Low    | 2 files |

---

## Verification Plan

### Audio Analysis Testing

1. Upload test audio file with clear beat pattern
2. Verify beat map generates on upload (check console/store)
3. Compare real-time vs pre-computed beat detection accuracy
4. Test seek behavior with pre-computed beats

### Visual Effect Testing

1. Enable a character effect (e.g., ParticleAssemble)
2. Compare visual crispness before/after anti-aliasing
3. Measure frame consistency with beat look-ahead enabled
4. Test on mobile device for performance

### Performance Testing

1. Profile with Chrome DevTools before/after changes
2. Target: 60fps maintained during complex effects
3. Memory: No leaks after 10-minute playback
4. Check character cache hit rate in console

### Feature Testing

1. Undo/Redo: Make 10 changes, undo all, redo all
2. Sync Editor: Drag lyrics to new positions, verify audio alignment
3. Test keyboard shortcuts (Ctrl+Z, Ctrl+Y)

---

## Critical Files Summary

| File                                 | Changes                           |
| ------------------------------------ | --------------------------------- |
| `services/beatDetectionService.ts`   | Add batch analysis, smoothing     |
| `src/effects/lyric/LyricEffect.ts`   | Add character caching             |
| `src/effects/core/EffectComposer.ts` | Add frame budget                  |
| `components/Visualizer.tsx`          | Beat look-ahead, timing precision |
| `src/stores/lyricsStore.ts`          | Bulk ops, undo integration        |
