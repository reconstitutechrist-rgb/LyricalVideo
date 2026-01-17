# LyricalVideo Ultimate Effects System Expansion

## Overview

Expand the lyrical video maker into the **ultimate effects platform** with:

- New physics-based, 3D, and character-level lyric effects
- Genre-aware background effects with AI auto-detection
- Parameter-based customization system for all effects

---

## Phase 1: Core Effect Infrastructure

### Create Effect System Architecture

**New files to create:**

```
src/effects/
  core/
    Effect.ts              # Base effect interface
    EffectRegistry.ts      # Central effect registration
    EffectComposer.ts      # Effect stacking/composition
    ParameterTypes.ts      # Slider, color, enum, boolean params
  utils/
    CanvasUtils.ts         # Shared canvas helpers
    MathUtils.ts           # Perlin noise, physics helpers
```

**Base Effect Interface:**

```typescript
interface EffectParameter {
  id: string;
  label: string;
  type: 'slider' | 'color' | 'enum' | 'boolean';
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

abstract class Effect {
  abstract id: string;
  abstract name: string;
  abstract category: 'lyric' | 'background';
  abstract parameters: EffectParameter[];
  abstract render(context: EffectContext): void;
}
```

**Files to modify:**

- [types.ts](../types.ts) - Add `EffectParameter`, `EffectStack`, `Genre` types
- [Visualizer.tsx](../components/Visualizer.tsx) - Extract Particle class, integrate EffectComposer

---

## Phase 2: New Lyric Effects

### 2.1 Character-Level Effects

| Effect             | Parameters                           | Description                        |
| ------------------ | ------------------------------------ | ---------------------------------- |
| **Wave**           | height, speed, wavelength, direction | Sine wave animation per character  |
| **Rainbow Cycle**  | speed, saturation, lightness, offset | HSL color cycling per character    |
| **Character Pop**  | scale, stagger, easing               | Bounce-in per character            |
| **Letter Shuffle** | duration, iterations, reveal order   | Scramble then reveal text          |
| **Scatter**        | radius, duration, easing, rotate     | Characters scatter then reassemble |

### 2.2 Physics-Based Effects

| Effect              | Parameters                                      | Description                        |
| ------------------- | ----------------------------------------------- | ---------------------------------- |
| **Wind Dissolve**   | direction, strength, turbulence, particle count | Text dissolves into wind particles |
| **Gravity Fall**    | gravity, bounce, stagger, rotation              | Characters fall with physics       |
| **Explode/Shatter** | force, fragment count, shape, decay             | Text shatters into fragments       |
| **Particle Burst**  | count, radius, size, trail, color mode          | Particles burst from text          |

### 2.3 3D Transform Effects (Canvas 2D simulation)

| Effect                 | Parameters                              | Description                 |
| ---------------------- | --------------------------------------- | --------------------------- |
| **Twist**              | angle, axis (x/y/z), speed, perspective | Per-character 3D twist      |
| **Flip**               | axis, count, duration                   | Simulated 3D flip           |
| **Perspective Rotate** | rotationX, rotationY, vanishing point   | Perspective skew simulation |
| **Depth Zoom**         | direction, max scale, blur, fade        | Zoom with depth blur        |

**New files:**

```
src/effects/lyric/
  LyricEffect.ts
  character/Wave.ts, RainbowCycle.ts, CharacterPop.ts, LetterShuffle.ts, Scatter.ts
  physics/WindDissolve.ts, GravityFall.ts, Explode.ts, ParticleBurst.ts
  transform3d/Twist.ts, Flip.ts, PerspectiveRotate.ts, DepthZoom.ts
```

---

## Phase 3: Genre-Aware Background Effects

### 3.1 Refactor Existing Styles

Extract 7 existing styles from Visualizer.tsx into individual effect files:

```
src/effects/background/existing/
  NeonPulse.ts, LiquidDream.ts, GlitchCyber.ts, CinematicBackdrop.ts,
  MinimalType.ts, Kaleidoscope.ts, ChromaticWave.ts
```

### 3.2 New Genre-Specific Effects

| Genre                 | Style                     | Key Features                                           |
| --------------------- | ------------------------- | ------------------------------------------------------ |
| **Hip-Hop/Urban**     | Bold, geometric           | Graffiti textures, street lights, vinyl scratch effect |
| **Rock/Energy**       | Aggressive, high-contrast | Distortion, flash, smoke, stage lighting               |
| **Electronic/EDM**    | Neon, synthetic           | Laser grids, waveform display, synthwave aesthetic     |
| **Classical/Elegant** | Refined, minimal          | Soft gradients, dust particles, vignette               |
| **Pop/Vibrant**       | Bright, playful           | Saturated colors, bouncing shapes, confetti            |
| **Indie/Dreamy**      | Vintage, soft             | Film grain, bokeh, muted color wash                    |

**New files:**

```
src/effects/background/genre/
  HipHopUrban.ts, RockEnergy.ts, ElectronicEDM.ts,
  ClassicalElegant.ts, PopVibrant.ts, IndieDreamy.ts
```

### 3.3 AI Genre Detection

Add to [geminiService.ts](../services/geminiService.ts):

```typescript
async function detectGenre(audioBlob: Blob): Promise<{
  genre: string;
  confidence: number;
  suggestedStyle: string;
}>;
```

---

## Phase 4: Customization UI

### Effect Panel Component

**New files:**

```
src/components/EffectPanel/
  EffectPanel.tsx          # Main panel container
  EffectStack.tsx          # Active effects list with reordering
  ParameterSlider.tsx      # Numeric range control
  ParameterColorPicker.tsx # Color selection
  ParameterToggle.tsx      # Boolean switch
  ParameterEnum.tsx        # Dropdown selection
  EffectSelector.tsx       # Add new effect modal
  GenreSelector.tsx        # Genre picker with auto-detect
```

### UI Layout (add to sidebar)

```
05. EFFECT STUDIO
  [Lyric Effects]
    Active: Wave + Rainbow
    [+ Add Effect]

    Wave [x]
      Height: ══════●════ 20px
      Speed:  ═════●═════ 2x

  [Background]
    Style: Electronic EDM
    Genre: Auto (Electronic - 87%)
    [Override Genre ▼]

    Laser Density: ════●══════
    Grid Intensity: ═══●═══════
```

---

## Phase 5: Integration & State Management

### Update App.tsx

Add new state:

```typescript
interface AppState {
  // ... existing
  lyricEffects: EffectInstance[]; // Active lyric effects
  backgroundEffects: EffectInstance[]; // Active background effects
  detectedGenre: string | null;
  genreOverride: string | null;
}
```

### Update Visualizer.tsx

- Replace inline style switch/case with `EffectComposer.render()`
- Use effect registry to instantiate effects
- Pass effect parameters to render context

---

## Critical Files to Modify

| File                                             | Changes                                                    |
| ------------------------------------------------ | ---------------------------------------------------------- |
| [types.ts](../types.ts)                          | Add Effect types, Genre enum, EffectParameter interface    |
| [App.tsx](../App.tsx)                            | Add effect state, genre detection, EffectPanel integration |
| [Visualizer.tsx](../components/Visualizer.tsx)   | Refactor to use EffectComposer, extract Particle class     |
| [geminiService.ts](../services/geminiService.ts) | Add `detectGenre()` function                               |
| [index.css](../index.css)                        | Styles for EffectPanel sliders and controls                |

---

## Implementation Order

1. **Core infrastructure** - Effect base class, registry, parameter types
2. **Refactor existing** - Extract 7 background styles to effect files
3. **Character effects** - Wave, Rainbow, Pop (easiest to implement)
4. **3D transforms** - Twist, Flip, Perspective (medium complexity)
5. **Physics effects** - Wind, Gravity, Explode (most complex)
6. **Genre backgrounds** - 6 new genre-specific styles
7. **Genre detection** - Gemini AI integration
8. **Customization UI** - EffectPanel with parameter controls
9. **Polish** - Object pooling, performance optimization

---

## Verification Plan

1. **Unit test effects** - Each effect renders without errors
2. **Parameter reactivity** - Slider changes update canvas in real-time
3. **Genre detection** - Upload various genre audio, verify suggestions
4. **Effect stacking** - Multiple lyric effects combine correctly
5. **Performance** - 60fps maintained with multiple effects active
6. **Export** - Video export includes all effects correctly
