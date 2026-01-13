# Performance Optimizations Implementation Plan

**Status: FULLY IMPLEMENTED**

## Overview

All 6 performance optimizations have been implemented and integrated into the LyricalVideo project.

## Implementation Order

| #   | Optimization                          | Priority | Key Files                                          |
| --- | ------------------------------------- | -------- | -------------------------------------------------- |
| 1   | Circular buffer for ParticleBurst     | P0       | `src/effects/lyric/physics/ParticleBurst.ts`       |
| 2   | Memoization optimizations             | P2       | `src/components/LyricalFlowUI/*.tsx`               |
| 3   | Web Worker for waveform               | P1       | `services/audioAnalysisService.ts`                 |
| 4   | Virtual scrolling for lyrics          | P2       | `src/components/LyricalFlowUI/LyricalFlowUI.tsx`   |
| 5   | OffscreenCanvas rendering             | P2       | `src/components/WaveformEditor/WaveformCanvas.tsx` |
| 6   | WebGL renderer (particles + waveform) | P1       | `components/Visualizer.tsx`, new renderer files    |

---

## 1. Circular Buffer for ParticleBurst (P0)

**Note**: The original `PERFORMANCE_OPTIMIZATION_PLAN.md` mentions `Particle.ts` and `Visualizer.tsx`, but those files **already have circular buffer implemented**. The only remaining issue is in `ParticleBurst.ts`.

**Problem**: `ParticleBurst.ts` line 100 uses `shift()` which is O(n):

```typescript
while (p.trail.length > trailLength) {
  p.trail.shift(); // O(n) - causes GC pressure
}
```

**Solution**: Port circular buffer pattern from main `Particle.ts` (already implemented there).

**Changes**:

1. Add `trailIndex` and `trailLength` to `BurstParticle` interface (line ~15)
2. Initialize new fields in particle creation (line ~170)
3. Replace trail update logic (lines 97-101):
   ```typescript
   // O(1) circular buffer instead of shift()
   if (p.trail.length < trailLength) {
     p.trail.push({ x: p.x, y: p.y });
     p.trailLength = p.trail.length;
   } else {
     const idx = p.trailIndex % trailLength;
     p.trail[idx] = { x: p.x, y: p.y };
     p.trailIndex++;
     p.trailLength = Math.min(p.trailLength + 1, trailLength);
   }
   ```
4. Update trail drawing (lines 115-126) to iterate circular buffer in correct order:
   ```typescript
   if (p.trailLength > 1) {
     ctx.beginPath();
     const len = p.trail.length;
     const startIdx = (p.trailIndex - p.trailLength + len) % len;
     ctx.moveTo(p.trail[startIdx].x, p.trail[startIdx].y);
     for (let i = 1; i < p.trailLength; i++) {
       const idx = (startIdx + i) % len;
       ctx.lineTo(p.trail[idx].x, p.trail[idx].y);
     }
     ctx.lineTo(p.x, p.y);
     // ... rest of stroke code
   }
   ```

---

## 2. Memoization Optimizations (P2)

**Problems identified**:

- `currentLyricIndex` uses O(n) `findIndex` at 60fps (line 675)
- Effect dropdown has O(m\*n) filter (lines 1188-1194)
- State handlers recreate arrays on every update

**Changes**:

### A. Binary search for current lyric

```typescript
const currentLyricIndex = useMemo(() => {
  // Binary search since lyrics are sorted by startTime
  let left = 0,
    right = lyrics.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (currentTime >= lyrics[mid].startTime && currentTime <= lyrics[mid].endTime) return mid;
    if (currentTime < lyrics[mid].startTime) right = mid - 1;
    else left = mid + 1;
  }
  return -1;
}, [lyrics, currentTime]);
```

### B. Memoize effect dropdowns

```typescript
const availableLyricEffects = useMemo(() => {
  const activeIds = new Set(lyricEffects.map((e) => e.effectId));
  return LYRIC_EFFECT_OPTIONS.filter((opt) => !activeIds.has(opt.id));
}, [lyricEffects]);
```

### C. Create state helper utility

New file: `src/utils/stateHelpers.ts`

- `updateAtIndex()` - immutable single-item update
- `mapIfChanged()` - returns same array if nothing changed

### D. Memoize KeyframeTrack sorted keyframes

---

## 3. Web Worker for Waveform Generation (P1)

**Problem**: `generateWaveformData()` blocks main thread for 4000 peaks.

**Changes**:

### A. Create worker file

New file: `src/workers/waveformWorker.ts`

- Receives `Float32Array` channelData via transferable
- Performs peak finding loop
- Returns peaks via transferable (zero-copy)

### B. Create worker client

New file: `src/utils/waveformWorkerClient.ts`

- Singleton worker management
- Promise-based API

### C. Update audioAnalysisService.ts

```typescript
export const generateWaveformData = async (audioBuffer, options) => {
  const channelData = audioBuffer.getChannelData(channel);
  const peaks = await generateWaveformDataAsync(channelData, targetWidth, normalize);
  return { peaks, duration, sampleRate, channelCount };
};
```

---

## 4. Virtual Scrolling for Lyric List (P2)

**Problem**: Renders ALL lyrics (lines 1423-1569), each with 4+ rows in edit mode.

**Changes**:

### A. Install dependency

```bash
npm install react-virtuoso
```

### B. Create VirtualizedLyricList component

New file: `src/components/LyricalFlowUI/VirtualizedLyricList.tsx`

- Extract `LyricRow` as `React.memo` component
- Use `Virtuoso` with dynamic item heights
- Overscan 3 items above/below viewport

### C. Replace inline rendering in LyricalFlowUI.tsx

---

## 5. OffscreenCanvas Rendering (P2)

**Problem**: Direct canvas rendering can block main thread.

**Changes**:

### A. Create utility

New file: `src/utils/offscreenCanvas.ts`

- `createOffscreenRenderer()` with fallback
- `transferToMain()` using `transferToImageBitmap()`

### B. Update WaveformCanvas.tsx

- Render to offscreen canvas
- Transfer to main canvas each frame

---

## 6. WebGL Renderer for Particles + Waveform (P1)

**Current state**: Three.js already integrated for 3D text effects.

**Changes**:

### A. WebGL Particle Renderer

New file: `src/renderers/WebGLParticleRenderer.ts`

- `THREE.Points` with buffer geometry
- Pre-allocated `Float32Array` for positions/sizes/colors
- Single draw call for all particles

### B. WebGL Waveform Renderer

New file: `src/renderers/WebGLWaveformRenderer.ts`

- `THREE.LineSegments` for waveform bars
- Instanced rendering for 4000 bars

### C. Integration with feature detection

```typescript
const supportsWebGL = !!window.WebGLRenderingContext;
// Fallback to Canvas 2D if not supported
```

### D. Update Visualizer.tsx

- Add WebGL particle path for NEON_PULSE style
- Composite WebGL canvas onto main canvas

---

## New Files Summary

| File                                                    | Purpose                         |
| ------------------------------------------------------- | ------------------------------- |
| `src/utils/stateHelpers.ts`                             | Immutable update utilities      |
| `src/workers/waveformWorker.ts`                         | Web Worker for peak calculation |
| `src/utils/waveformWorkerClient.ts`                     | Worker API wrapper              |
| `src/components/LyricalFlowUI/VirtualizedLyricList.tsx` | Virtual scrolling component     |
| `src/utils/offscreenCanvas.ts`                          | OffscreenCanvas utilities       |
| `src/renderers/WebGLParticleRenderer.ts`                | GPU particle rendering          |
| `src/renderers/WebGLWaveformRenderer.ts`                | GPU waveform rendering          |

---

## Verification Plan

### After each optimization:

1. **Circular buffer**: Profile with Chrome DevTools - no GC spikes, trails render correctly
2. **Memoization**: React DevTools Profiler - reduced render counts
3. **Web Worker**: Performance tab - no long tasks during audio load
4. **Virtual scrolling**: Load 100+ lyrics - smooth scrolling, only visible items render
5. **OffscreenCanvas**: Reduced paint time in profiler
6. **WebGL**: FPS counter with 150+ particles - should maintain 60fps

### End-to-end test:

1. Load a song with 100+ lyrics
2. Enable ParticleBurst effect with long trails
3. Play through song - should maintain 60fps
4. Scroll lyric list during playback - smooth scrolling
5. Check memory usage - no leaks over 5-minute playback
