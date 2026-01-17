# Gemini Model Optimization Plan for LyricalVideo

## App Architecture Summary

**LyricalVideo** is an AI-powered lyrical video generator:

1. **Audio Analysis** → Gemini extracts lyrics, timing, genre, mood, emotional peaks
2. **Video Plan** → Gemini creates creative direction (colors, effects, style, background strategy)
3. **Background Generation** → Static image (Gemini Image) or 8-second video (Veo 3.1)
4. **Real-time Rendering** → Canvas renders lyrics + audio-reactive effects over background
5. **Export** → Real-time canvas recording → MP4 via FFmpeg.wasm

**Audio-Reactive Features (already working):**

- Particles react to bass/mid/treble frequencies
- Camera shake synced to beats
- Text animations tied to audio energy
- Dynamic background opacity pulse

---

## Current Models In Use (Verified ✓)

| Model                           | Purpose                                             | Lines                          | Status             |
| ------------------------------- | --------------------------------------------------- | ------------------------------ | ------------------ |
| `gemini-3-flash-preview`        | Audio transcription, lyrics, genre, recommendations | 460, 553, 868, 941, 1036, 1111 | **→ Update to GA** |
| `gemini-3-pro-preview`          | Chat, video planning, mood modifications            | 722, 786, 1401, 1584           | **→ Update to GA** |
| `gemini-2.5-flash-image`        | Image generation (1K)                               | 751                            | OK                 |
| `gemini-3-pro-image-preview`    | High-quality images (2K, 4K)                        | 751, 1207                      | **→ Update to GA** |
| `veo-3.1-fast-generate-preview` | Video backgrounds (8 sec)                           | 822                            | Latest version     |

**SDK Version:** `@google/genai` v1.35.0 (latest is v1.37.0)

---

## Recommended Changes

### 1. Update Preview Models to GA

**File:** `services/geminiService.ts`

| Line(s)                        | Current                      | Update To            |
| ------------------------------ | ---------------------------- | -------------------- |
| 460, 553, 868, 941, 1036, 1111 | `gemini-3-flash-preview`     | `gemini-3-flash`     |
| 722, 786, 1401, 1584           | `gemini-3-pro-preview`       | `gemini-3-pro`       |
| 751, 1207                      | `gemini-3-pro-image-preview` | `gemini-3-pro-image` |

**Why:** GA models have stable behavior, better SLAs, production-ready.

---

### 2. Add Thinking Level Control for Quality vs Speed

**File:** `services/geminiService.ts`

**Verified SDK Syntax:**

```typescript
import { ThinkingLevel } from '@google/genai';

// For complex creative tasks
config: {
  responseMimeType: 'application/json',
  responseSchema: responseSchema,
  thinkingConfig: {
    thinkingLevel: ThinkingLevel.HIGH,  // Or 'high' as string
  },
}

// For simple/cached tasks
config: {
  thinkingConfig: {
    thinkingLevel: ThinkingLevel.LOW,  // Or 'low' as string
  },
}
```

**Available Levels (from SDK):**
| Enum Value | String | Use Case |
|------------|--------|----------|
| `ThinkingLevel.HIGH` | `'high'` | Complex creative decisions |
| `ThinkingLevel.MEDIUM` | `'medium'` | Balanced (default) |
| `ThinkingLevel.LOW` | `'low'` | Simple tasks |
| `ThinkingLevel.MINIMAL` | `'minimal'` | Flash only - fastest |

**Recommended by Function:**
| Function | Level |
|----------|-------|
| `generateVideoPlan` (line 1401) | `HIGH` |
| `detectEmotionalPeaks` (line 1111) | `HIGH` |
| `detectMusicGenre` (line 941) | `LOW` |
| `sendChatMessage` (line 722) | `MEDIUM` |
| `analyzeAudioAndGetLyrics` (line 460) | `MEDIUM` |

---

### 3. Add Media Resolution Control for Better Transcription

**File:** `services/geminiService.ts`

**Verified SDK Syntax:**

```typescript
import { MediaResolution } from '@google/genai';

// Global config level
config: {
  responseMimeType: 'application/json',
  responseSchema: responseSchema,
  mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
}
```

**Available Levels (from SDK):**
| Enum Value | Tokens | Use Case |
|------------|--------|----------|
| `MEDIA_RESOLUTION_LOW` | 64 | Simple audio, clear vocals |
| `MEDIA_RESOLUTION_MEDIUM` | 256 | Default |
| `MEDIA_RESOLUTION_HIGH` | 256 (zoomed) | Complex layered audio, fast rap |

**Apply to:**

- `analyzeAudioAndGetLyrics` (line 460)
- `syncLyricsWithPrecision` (line 553)
- `detectMusicGenre` (line 941)

---

### 4. Enable 4K Video Output from Veo 3.1

**File:** `services/geminiService.ts` - line 822

Currently hardcoded to `1080p`. Add resolution parameter:

```typescript
export const generateVideoBackground = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  resolution: '720p' | '1080p' | '4k' = '1080p', // New parameter
  signal?: AbortSignal
): Promise<string> => {
  // ...
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: aspectRatio,
    },
  });
```

**Also update:**

- `services/aiOrchestrator.ts` line 270 - pass resolution
- `App.tsx` - pass resolution from export settings

---

### 5. Use Reference Images for Video Consistency

**File:** `services/geminiService.ts`

**Verified SDK Syntax (from GenerateVideosConfig):**

```typescript
import { VideoGenerationReferenceImage } from '@google/genai';

config: {
  numberOfVideos: 1,
  resolution: '1080p',
  aspectRatio: aspectRatio,
  referenceImages: [{
    referenceType: 'REFERENCE_TYPE_ASSET',  // Use as visual reference
    image: {
      bytesBase64Encoded: staticBackgroundBase64,
      mimeType: 'image/png'
    }
  }],
}
```

**Note:** Veo 3.1 supports up to 3 asset images OR 1 style image. Asset images guide content; style images guide visual style.

**Use case:** Generate static image first, then use it as reference for video → consistent aesthetic.

---

### 6. Scene Extension for Longer Videos (Optional)

**File:** `services/geminiService.ts`

**Verified SDK Approach:** Use `lastFrame` parameter to continue from previous video's last frame:

```typescript
// GenerateVideosConfig has: lastFrame?: Image
config: {
  numberOfVideos: 1,
  resolution: '1080p',
  aspectRatio: aspectRatio,
  lastFrame: {
    bytesBase64Encoded: lastFrameOfPreviousClip,
    mimeType: 'image/png'
  },
}
```

**Implementation:**

1. Generate initial 8-second clip
2. Extract last frame as image
3. Generate next clip with `lastFrame` set to that image
4. Repeat until target duration
5. Concatenate clips using FFmpeg

**Trade-off:** More API calls, longer generation time, but seamless non-repeating background.

---

### 7. Potential Gap: Peak Visuals Display During Playback

**Finding:** Peak visuals are generated and stored in `videoPlan.hybridVisuals.peakVisuals`, but the Visualizer component only receives a single `backgroundAsset` prop. There's no logic to switch visuals based on `currentTime` during playback.

**Current flow:**

- Peak visuals generated ✓
- Stored in video plan ✓
- Displayed in PeakVisualsCard panel ✓
- **Switched during playback based on timestamp** ❓

**If this is intended to work:** Need to add time-based visual switching in App.tsx:

```typescript
// In App.tsx, calculate current background based on time
const getCurrentBackground = useCallback(
  (time: number) => {
    if (!videoPlan) return state.backgroundAsset;

    // Check if current time falls within any peak
    for (const peak of videoPlan.emotionalPeaks) {
      if (time >= peak.startTime && time <= peak.endTime) {
        const peakVisual = videoPlan.hybridVisuals.peakVisuals.find((v) => v.peakId === peak.id);
        if (peakVisual) return peakVisual.asset;
      }
    }

    return videoPlan.hybridVisuals.sharedBackground;
  },
  [videoPlan, state.backgroundAsset]
);
```

---

## Files to Modify

| File                         | Changes                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `services/geminiService.ts`  | Model names, thinkingConfig, mediaResolution, 4K video, referenceImages |
| `services/aiOrchestrator.ts` | Pass resolution parameter                                               |
| `App.tsx`                    | (Optional) Time-based peak visual switching                             |
| `types.ts`                   | (Optional) Add VeoResolution type                                       |
| `package.json`               | (Optional) Update @google/genai to v1.37.0                              |

---

## Verification Plan

1. **Model updates:** Run audio analysis, verify transcription quality maintained
2. **Thinking levels:** Compare video plan quality with HIGH vs MEDIUM
3. **Media resolution:** Test with complex layered music, check transcription accuracy
4. **4K video:** Generate and verify quality
5. **End-to-end:** Upload song → generate plan → export full video

---

## Summary

| Priority     | Change                          | Impact                     | Status         |
| ------------ | ------------------------------- | -------------------------- | -------------- |
| **High**     | Update preview → GA models      | Stability, production SLAs | ✅ Implemented |
| **High**     | Add `thinkingConfig`            | Quality for creative tasks | ✅ Implemented |
| **Medium**   | Add `mediaResolution`           | Better transcription       | ✅ Implemented |
| **Medium**   | Enable 4K video                 | Premium export quality     | ✅ Implemented |
| **Low**      | `referenceImages` for Veo       | Visual consistency         | ✅ Implemented |
| **Optional** | Peak visuals switching          | Dynamic backgrounds        | ✅ Implemented |
| **Optional** | Scene extension via `lastFrame` | Non-looping backgrounds    | ✅ Implemented |

---

## Sources

- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Media Resolution Documentation](https://ai.google.dev/gemini-api/docs/media-resolution)
- [Veo 3.1 Video Generation](https://ai.google.dev/gemini-api/docs/video)
- [Veo Reference Images](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/use-reference-images-to-guide-video-generation)
- [@google/genai npm package](https://www.npmjs.com/package/@google/genai)
- SDK Types: `node_modules/@google/genai/dist/genai.d.ts`
