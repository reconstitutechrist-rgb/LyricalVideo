/**
 * useLyricEditor Hook
 * Manages lyrics editing, selection, bulk operations, and timing adjustments.
 * Extracted from App.tsx to reduce monolithic component size.
 */

import { useCallback, useState } from 'react';
import { useLyricsStore, useBeatMapStore } from '../stores';
import { LyricLine, TextKeyframe, VisualStyle, ColorPalette, MotionPreset } from '../../types';

// Motion Presets Definition
const MOTION_PRESETS: MotionPreset[] = [
  {
    label: 'Cinematic Rise',
    keyframes: [
      { time: 0, x: 0, y: 50, scale: 0.9, rotation: 0, opacity: 0, easing: 'easeOut' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.8, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: -50, scale: 1.1, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Elastic Bounce',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 0, rotation: 0, opacity: 0, easing: 'bounce' },
      { time: 0.3, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: 0, scale: 0, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Neon Flicker',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 1, rotation: 0, opacity: 0, easing: 'linear' },
      { time: 0.1, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.2, easing: 'linear' },
      { time: 0.3, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1.05, rotation: 0, opacity: 1, easing: 'easeOut' },
      { time: 1, x: 0, y: 0, scale: 1.1, rotation: 0, opacity: 0 },
    ],
  },
  {
    label: 'Spiral In',
    keyframes: [
      { time: 0, x: 0, y: 0, scale: 0, rotation: -180, opacity: 0, easing: 'easeOut' },
      { time: 0.4, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.9, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 0, y: 0, scale: 1.5, rotation: 45, opacity: 0 },
    ],
  },
  {
    label: 'Slow Drift',
    keyframes: [
      { time: 0, x: -30, y: 0, scale: 1, rotation: 0, opacity: 0, easing: 'easeOut' },
      { time: 0.2, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'linear' },
      { time: 0.8, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, easing: 'easeIn' },
      { time: 1, x: 30, y: 0, scale: 1, rotation: 0, opacity: 0 },
    ],
  },
];

export { MOTION_PRESETS };

export interface LyricEditorReturn {
  // State
  lyrics: LyricLine[];
  editMode: boolean;
  selectedLyricIndices: Set<number>;
  activeKeyframeIndex: number | null;
  bulkTimeShift: string;

  // Actions - Basic
  setEditMode: (mode: boolean) => void;
  setBulkTimeShift: (value: string) => void;
  setActiveKeyframeIndex: (index: number | null) => void;

  // Actions - Lyric CRUD
  updateLyric: (index: number, field: keyof LyricLine, value: LyricLine[keyof LyricLine]) => void;
  updateLyricPartial: (index: number, updates: Partial<LyricLine>) => void;
  deleteLyric: (index: number) => void;
  addLyric: (lyric: LyricLine) => void;
  setLyrics: (lyrics: LyricLine[]) => void;

  // Actions - Selection
  toggleLyricSelection: (index: number) => void;
  selectAllLyrics: () => void;
  clearSelection: () => void;

  // Actions - Bulk Operations
  applyBulkTimeShift: () => void;
  applyTextTransform: (type: 'upper' | 'lower' | 'capitalize') => void;
  applyOverride: (type: 'style' | 'palette', value: string | undefined) => void;
  snapSelectedToBeat: () => void;

  // Actions - Keyframes
  applyMotionPreset: (lyricIndex: number, presetIndex: number) => void;
  updateKeyframe: (
    lyricIndex: number,
    kfIndex: number,
    field: keyof TextKeyframe,
    value: TextKeyframe[keyof TextKeyframe]
  ) => void;
  addKeyframe: (lyricIndex: number) => void;
  removeKeyframe: (lyricIndex: number, kfIndex: number) => void;
  onKeyframePositionUpdate: (lyricIndex: number, kfIndex: number, x: number, y: number) => void;

  // Motion Presets
  motionPresets: MotionPreset[];
}

export function useLyricEditor(): LyricEditorReturn {
  const lyricsStore = useLyricsStore();
  const beatMapStore = useBeatMapStore();

  // Local UI state (not persisted)
  const [activeKeyframeIndex, setActiveKeyframeIndex] = useState<number | null>(null);
  const [bulkTimeShift, setBulkTimeShift] = useState<string>('0.1');

  // Get lyrics from store
  const lyrics = lyricsStore.lyrics;
  const editMode = lyricsStore.editMode;
  const selectedLyricIndices = lyricsStore.selectedLyricIndices;

  // Basic setters
  const setEditMode = useCallback(
    (mode: boolean) => {
      lyricsStore.setEditMode(mode);
    },
    [lyricsStore]
  );

  // Update single field
  const updateLyric = useCallback(
    (index: number, field: keyof LyricLine, value: LyricLine[keyof LyricLine]) => {
      lyricsStore.updateLyric(index, { [field]: value });
    },
    [lyricsStore]
  );

  // Update partial lyric
  const updateLyricPartial = useCallback(
    (index: number, updates: Partial<LyricLine>) => {
      lyricsStore.updateLyric(index, updates);
    },
    [lyricsStore]
  );

  // Selection actions
  const toggleLyricSelection = useCallback(
    (index: number) => {
      lyricsStore.toggleLyricSelection(index);
      // Clear active keyframe if deselecting
      if (selectedLyricIndices.has(index)) {
        setActiveKeyframeIndex(null);
      }
    },
    [lyricsStore, selectedLyricIndices]
  );

  const selectAllLyrics = useCallback(() => {
    if (selectedLyricIndices.size === lyrics.length) {
      lyricsStore.clearSelection();
    } else {
      lyricsStore.selectAllLyrics();
    }
  }, [lyricsStore, selectedLyricIndices.size, lyrics.length]);

  const clearSelection = useCallback(() => {
    lyricsStore.clearSelection();
    setActiveKeyframeIndex(null);
  }, [lyricsStore]);

  // Bulk time shift
  const applyBulkTimeShift = useCallback(() => {
    const shift = parseFloat(bulkTimeShift);
    if (isNaN(shift) || shift === 0 || selectedLyricIndices.size === 0) return;

    lyricsStore.offsetSelected(shift * 1000); // Convert to ms
  }, [lyricsStore, bulkTimeShift, selectedLyricIndices.size]);

  // Text transform
  const applyTextTransform = useCallback(
    (type: 'upper' | 'lower' | 'capitalize') => {
      if (selectedLyricIndices.size === 0) return;

      selectedLyricIndices.forEach((idx) => {
        const line = lyrics[idx];
        if (!line) return;

        let text = line.text;
        if (type === 'upper') text = text.toUpperCase();
        else if (type === 'lower') text = text.toLowerCase();
        else if (type === 'capitalize') {
          text = text.toLowerCase().replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
        }

        lyricsStore.updateLyric(idx, { text });
      });
    },
    [lyricsStore, lyrics, selectedLyricIndices]
  );

  // Apply style/palette override
  const applyOverride = useCallback(
    (type: 'style' | 'palette', value: string | undefined) => {
      if (selectedLyricIndices.size === 0) return;

      selectedLyricIndices.forEach((idx) => {
        if (type === 'style') {
          lyricsStore.updateLyric(idx, { styleOverride: value as VisualStyle | undefined });
        } else if (type === 'palette') {
          lyricsStore.updateLyric(idx, { paletteOverride: value as ColorPalette | undefined });
        }
      });
    },
    [lyricsStore, selectedLyricIndices]
  );

  // Snap selected to beat
  const snapSelectedToBeat = useCallback(() => {
    const beatMap = beatMapStore.beatMap;
    if (!beatMap || beatMap.beats.length === 0) return;

    const beatTimes = beatMap.beats.map((b) => b.time);
    lyricsStore.snapSelectedToBeat(beatTimes, 100); // 100ms tolerance
  }, [lyricsStore, beatMapStore.beatMap]);

  // Motion preset
  const applyMotionPreset = useCallback(
    (lyricIndex: number, presetIndex: number) => {
      if (presetIndex < 0 || presetIndex >= MOTION_PRESETS.length) return;
      const preset = MOTION_PRESETS[presetIndex];
      lyricsStore.updateLyric(lyricIndex, { keyframes: preset.keyframes });
    },
    [lyricsStore]
  );

  // Keyframe operations
  const updateKeyframe = useCallback(
    (
      lyricIndex: number,
      kfIndex: number,
      field: keyof TextKeyframe,
      value: TextKeyframe[keyof TextKeyframe]
    ) => {
      const line = lyrics[lyricIndex];
      if (!line?.keyframes) return;

      const newKeyframes = [...line.keyframes];
      newKeyframes[kfIndex] = { ...newKeyframes[kfIndex], [field]: value };
      lyricsStore.updateLyric(lyricIndex, { keyframes: newKeyframes });
    },
    [lyricsStore, lyrics]
  );

  const addKeyframe = useCallback(
    (lyricIndex: number) => {
      const line = lyrics[lyricIndex];
      const newKeyframes = line?.keyframes ? [...line.keyframes] : [];

      // Default to slightly after the last keyframe, or at 0.5/1.0
      let defaultTime = 1.0;
      if (newKeyframes.length > 0) {
        const lastTime = newKeyframes[newKeyframes.length - 1].time;
        if (lastTime < 0.9) defaultTime = lastTime + 0.1;
      }

      newKeyframes.push({
        time: defaultTime,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        easing: 'linear',
      });

      lyricsStore.updateLyric(lyricIndex, { keyframes: newKeyframes });
      setActiveKeyframeIndex(newKeyframes.length - 1);
    },
    [lyricsStore, lyrics]
  );

  const removeKeyframe = useCallback(
    (lyricIndex: number, kfIndex: number) => {
      const line = lyrics[lyricIndex];
      if (!line?.keyframes) return;

      const newKeyframes = line.keyframes.filter((_, i) => i !== kfIndex);
      lyricsStore.updateLyric(lyricIndex, { keyframes: newKeyframes });

      if (activeKeyframeIndex === kfIndex) {
        setActiveKeyframeIndex(null);
      }
    },
    [lyricsStore, lyrics, activeKeyframeIndex]
  );

  // Canvas drag callback for keyframe position
  const onKeyframePositionUpdate = useCallback(
    (lyricIndex: number, kfIndex: number, x: number, y: number) => {
      const line = lyrics[lyricIndex];
      if (!line?.keyframes) return;

      const newKeyframes = [...line.keyframes];
      newKeyframes[kfIndex] = { ...newKeyframes[kfIndex], x, y };
      lyricsStore.updateLyric(lyricIndex, { keyframes: newKeyframes });
    },
    [lyricsStore, lyrics]
  );

  return {
    // State
    lyrics,
    editMode,
    selectedLyricIndices,
    activeKeyframeIndex,
    bulkTimeShift,

    // Actions - Basic
    setEditMode,
    setBulkTimeShift,
    setActiveKeyframeIndex,

    // Actions - Lyric CRUD
    updateLyric,
    updateLyricPartial,
    deleteLyric: lyricsStore.deleteLyric,
    addLyric: lyricsStore.addLyric,
    setLyrics: lyricsStore.setLyrics,

    // Actions - Selection
    toggleLyricSelection,
    selectAllLyrics,
    clearSelection,

    // Actions - Bulk Operations
    applyBulkTimeShift,
    applyTextTransform,
    applyOverride,
    snapSelectedToBeat,

    // Actions - Keyframes
    applyMotionPreset,
    updateKeyframe,
    addKeyframe,
    removeKeyframe,
    onKeyframePositionUpdate,

    // Motion Presets
    motionPresets: MOTION_PRESETS,
  };
}
