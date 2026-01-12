import React, { useEffect, useState, useCallback } from 'react';
import { LyricalFlowUI } from './LyricalFlowUI';
import Visualizer from '../../../components/Visualizer';
import {
  AppState,
  VisualStyle,
  ChatMessage,
  AspectRatio,
  ColorPalette,
  FontFamily,
  TextAnimationStyle,
  BlendMode,
  FrequencyBand,
  Genre,
  EffectInstanceConfig,
  WordTiming,
  SyllableTiming,
} from '../../../types';

/**
 * LyricalFlowWrapper
 *
 * This component integrates the new LyricalFlowUI with the existing app state.
 * It acts as a bridge between the existing App.tsx state management and the new UI.
 */

export interface LyricalFlowWrapperProps {
  // Core State
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;

  // Chat State
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  onChatSubmit: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  isProcessing: boolean;

  // File Handling
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageAnalysis: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Background Generation
  onShowGenModal: (type: 'image' | 'video') => void;

  // Audio Controls
  audioRef: React.RefObject<HTMLAudioElement | null>;
  duration: number;

  // Canvas Ref for Visualizer
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mediaStreamDestRef: React.RefObject<MediaStreamAudioDestinationNode | null>;
}

export const LyricalFlowWrapper: React.FC<LyricalFlowWrapperProps> = ({
  state,
  setState,
  chatMessages,
  chatInput,
  setChatInput,
  onChatSubmit,
  chatOpen,
  setChatOpen,
  isProcessing,
  onFileUpload,
  onImageAnalysis,
  onShowGenModal,
  audioRef,
  duration,
  canvasRef,
  mediaStreamDestRef,
}) => {
  // Local state for animation speed (maps to visualSettings.particleSpeed)
  const [animationSpeed, setAnimationSpeed] = useState(state.visualSettings.particleSpeed);

  // Local state for edit mode
  const [editMode, setEditMode] = useState(false);
  const [selectedLyricIndices, setSelectedLyricIndices] = useState<Set<number>>(new Set());

  // Local state for recording
  const [isRecordingMic, setIsRecordingMic] = useState(false);

  // Find current lyric based on currentTime
  const getCurrentLyricText = useCallback((): string => {
    const current = state.lyrics.find(
      (l) => state.currentTime >= l.startTime && state.currentTime <= l.endTime
    );
    return current?.text || '';
  }, [state.lyrics, state.currentTime]);

  // ========================================
  // Basic Handlers
  // ========================================

  const handleTogglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [setState]);

  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      setState((prev) => ({ ...prev, currentTime: time }));
    },
    [audioRef, setState]
  );

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(state.currentTime + 10, duration);
    handleSeek(newTime);
  }, [state.currentTime, duration, handleSeek]);

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(state.currentTime - 10, 0);
    handleSeek(newTime);
  }, [state.currentTime, handleSeek]);

  const handleStyleChange = useCallback(
    (style: VisualStyle) => {
      setState((prev) => ({ ...prev, currentStyle: style }));
    },
    [setState]
  );

  const handleAnimationSpeedChange = useCallback(
    (speed: number) => {
      setAnimationSpeed(speed);
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, particleSpeed: speed },
      }));
    },
    [setState]
  );

  const handleBassShakeToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visualSettings: {
        ...prev.visualSettings,
        cameraShake: !prev.visualSettings.cameraShake,
      },
    }));
  }, [setState]);

  const handleChatToggle = useCallback(() => {
    setChatOpen(!chatOpen);
  }, [chatOpen, setChatOpen]);

  const handleLyricsChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, userProvidedLyrics: value }));
    },
    [setState]
  );

  const handleCreativeVisionChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, userCreativeVision: value }));
    },
    [setState]
  );

  const handleEditLyric = useCallback(
    (index: number) => {
      const lyric = state.lyrics[index];
      if (lyric && audioRef.current) {
        audioRef.current.currentTime = lyric.startTime;
        setState((prev) => ({ ...prev, currentTime: lyric.startTime }));
      }
    },
    [state.lyrics, audioRef, setState]
  );

  // ========================================
  // Advanced Visual Settings Handlers
  // ========================================

  const handleAspectRatioChange = useCallback(
    (ratio: AspectRatio) => {
      setState((prev) => ({ ...prev, aspectRatio: ratio }));
    },
    [setState]
  );

  const handleColorPaletteChange = useCallback(
    (palette: ColorPalette) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, colorPalette: palette, palette: palette },
      }));
    },
    [setState]
  );

  const handleFontFamilyChange = useCallback(
    (font: FontFamily) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, fontFamily: font },
      }));
    },
    [setState]
  );

  const handleTextAnimationChange = useCallback(
    (animation: TextAnimationStyle) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, textAnimation: animation },
      }));
    },
    [setState]
  );

  const handleReactivityIntensityChange = useCallback(
    (intensity: number) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, reactivityIntensity: intensity },
      }));
    },
    [setState]
  );

  const handleShakeIntensityChange = useCallback(
    (intensity: number) => {
      setState((prev) => ({
        ...prev,
        visualSettings: {
          ...prev.visualSettings,
          shakeIntensity: intensity,
          cameraShakeIntensity: intensity,
        },
      }));
    },
    [setState]
  );

  const handleDynamicBackgroundPulseToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visualSettings: {
        ...prev.visualSettings,
        dynamicBackgroundPulse: !prev.visualSettings.dynamicBackgroundPulse,
        dynamicBackgroundOpacity: !prev.visualSettings.dynamicBackgroundOpacity,
      },
    }));
  }, [setState]);

  const handleParticleTrailsToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visualSettings: {
        ...prev.visualSettings,
        particleTrails: !prev.visualSettings.particleTrails,
        trailsEnabled: !prev.visualSettings.trailsEnabled,
      },
    }));
  }, [setState]);

  const handleBlendModeChange = useCallback(
    (mode: BlendMode) => {
      setState((prev) => ({
        ...prev,
        visualSettings: { ...prev.visualSettings, blendMode: mode, backgroundBlendMode: mode },
      }));
    },
    [setState]
  );

  const handleFrequencyMappingChange = useCallback(
    (key: 'pulse' | 'motion' | 'color', band: FrequencyBand) => {
      setState((prev) => ({
        ...prev,
        visualSettings: {
          ...prev.visualSettings,
          frequencyMapping: {
            ...prev.visualSettings.frequencyMapping,
            [key]: band,
          },
        },
      }));
    },
    [setState]
  );

  // ========================================
  // Recording Handlers
  // ========================================

  const handleStartMicRecording = useCallback(() => {
    setIsRecordingMic(true);
    // TODO: Implement actual microphone recording
    console.log('Starting mic recording...');
  }, []);

  const handleStopMicRecording = useCallback(() => {
    setIsRecordingMic(false);
    // TODO: Implement actual microphone recording stop
    console.log('Stopping mic recording...');
  }, []);

  // ========================================
  // Edit Mode Handlers
  // ========================================

  const handleEditModeToggle = useCallback(() => {
    setEditMode((prev) => !prev);
    if (editMode) {
      setSelectedLyricIndices(new Set());
    }
  }, [editMode]);

  const handleLyricSelect = useCallback((index: number) => {
    setSelectedLyricIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllLyrics = useCallback(() => {
    if (selectedLyricIndices.size === state.lyrics.length) {
      setSelectedLyricIndices(new Set());
    } else {
      setSelectedLyricIndices(new Set(state.lyrics.map((_, i) => i)));
    }
  }, [selectedLyricIndices.size, state.lyrics]);

  const handleBulkTimeShift = useCallback(
    (shift: number) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (selectedLyricIndices.has(i)) {
            return {
              ...lyric,
              startTime: Math.max(0, lyric.startTime + shift),
              endTime: Math.max(0, lyric.endTime + shift),
            };
          }
          return lyric;
        }),
      }));
    },
    [selectedLyricIndices, setState]
  );

  const handleTextTransform = useCallback(
    (type: 'upper' | 'lower' | 'capitalize') => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (selectedLyricIndices.has(i)) {
            let newText = lyric.text;
            switch (type) {
              case 'upper':
                newText = lyric.text.toUpperCase();
                break;
              case 'lower':
                newText = lyric.text.toLowerCase();
                break;
              case 'capitalize':
                newText = lyric.text
                  .split(' ')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
                break;
            }
            return { ...lyric, text: newText };
          }
          return lyric;
        }),
      }));
    },
    [selectedLyricIndices, setState]
  );

  const handleUpdateLyricTime = useCallback(
    (index: number, field: 'startTime' | 'endTime', value: number) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === index) {
            return { ...lyric, [field]: value };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  const handleUpdateLyricSection = useCallback(
    (index: number, section: string) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === index) {
            return { ...lyric, section: section || undefined };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  const handleUpdateLyricText = useCallback(
    (index: number, text: string) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === index) {
            return { ...lyric, text };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  const handleUpdateLyricStyleOverride = useCallback(
    (index: number, style: VisualStyle | null) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === index) {
            return { ...lyric, styleOverride: style || undefined };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  const handleUpdateLyricPaletteOverride = useCallback(
    (index: number, palette: ColorPalette | null) => {
      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === index) {
            return { ...lyric, paletteOverride: palette || undefined };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  // Word/Syllable Timing Handlers
  const handleUpdateWordTiming = useCallback(
    (lyricIndex: number, wordIndex: number, updates: Partial<WordTiming>) => {
      setState((prev) => {
        const newLyrics = [...prev.lyrics];
        if (newLyrics[lyricIndex]?.words?.[wordIndex]) {
          newLyrics[lyricIndex] = {
            ...newLyrics[lyricIndex],
            words: newLyrics[lyricIndex].words!.map((w, i) =>
              i === wordIndex ? { ...w, ...updates } : w
            ),
          };
        }
        return { ...prev, lyrics: newLyrics };
      });
    },
    [setState]
  );

  const handleUpdateSyllableTiming = useCallback(
    (
      lyricIndex: number,
      wordIndex: number,
      syllableIndex: number,
      updates: Partial<SyllableTiming>
    ) => {
      setState((prev) => {
        const newLyrics = [...prev.lyrics];
        const word = newLyrics[lyricIndex]?.words?.[wordIndex];
        if (word?.syllables?.[syllableIndex]) {
          newLyrics[lyricIndex] = {
            ...newLyrics[lyricIndex],
            words: newLyrics[lyricIndex].words!.map((w, wi) =>
              wi === wordIndex
                ? {
                    ...w,
                    syllables: w.syllables!.map((s, si) =>
                      si === syllableIndex ? { ...s, ...updates } : s
                    ),
                  }
                : w
            ),
          };
        }
        return { ...prev, lyrics: newLyrics };
      });
    },
    [setState]
  );

  const handleGenreOverride = useCallback(
    (genre: string | null) => {
      setState((prev) => ({
        ...prev,
        genreOverride: genre ? (genre as Genre) : null,
      }));
    },
    [setState]
  );

  // ========================================
  // Effect Handlers
  // ========================================

  const handleAddLyricEffect = useCallback(
    (effectId: string) => {
      const newEffect: EffectInstanceConfig = {
        effectId,
        parameters: {},
        enabled: true,
      };
      setState((prev) => ({
        ...prev,
        lyricEffects: [...prev.lyricEffects, newEffect],
      }));
    },
    [setState]
  );

  const handleAddBackgroundEffect = useCallback(
    (effectId: string) => {
      const newEffect: EffectInstanceConfig = {
        effectId,
        parameters: {},
        enabled: true,
      };
      setState((prev) => ({
        ...prev,
        backgroundEffects: [...prev.backgroundEffects, newEffect],
      }));
    },
    [setState]
  );

  const handleRemoveLyricEffect = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        lyricEffects: prev.lyricEffects.filter((_, i) => i !== index),
      }));
    },
    [setState]
  );

  const handleRemoveBackgroundEffect = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        backgroundEffects: prev.backgroundEffects.filter((_, i) => i !== index),
      }));
    },
    [setState]
  );

  const handleToggleLyricEffect = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        lyricEffects: prev.lyricEffects.map((effect, i) =>
          i === index ? { ...effect, enabled: !effect.enabled } : effect
        ),
      }));
    },
    [setState]
  );

  const handleToggleBackgroundEffect = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        backgroundEffects: prev.backgroundEffects.map((effect, i) =>
          i === index ? { ...effect, enabled: !effect.enabled } : effect
        ),
      }));
    },
    [setState]
  );

  // ========================================
  // Keyframe Animation Handlers
  // ========================================

  const handleApplyMotionPreset = useCallback(
    (lyricIndex: number, presetId: string) => {
      // Motion preset keyframe definitions
      const presets: Record<
        string,
        {
          keyframes: Array<{
            time: number;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            opacity: number;
          }>;
        }
      > = {
        none: { keyframes: [] },
        'fade-in': {
          keyframes: [
            { time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 0 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        'slide-up': {
          keyframes: [
            { time: 0, x: 0.5, y: 0.7, scale: 1, rotation: 0, opacity: 0 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        'slide-down': {
          keyframes: [
            { time: 0, x: 0.5, y: 0.3, scale: 1, rotation: 0, opacity: 0 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        'zoom-in': {
          keyframes: [
            { time: 0, x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 0 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        bounce: {
          keyframes: [
            { time: 0, x: 0.5, y: 0.7, scale: 0.8, rotation: 0, opacity: 0 },
            { time: 0.5, x: 0.5, y: 0.45, scale: 1.1, rotation: 0, opacity: 1 },
            { time: 0.75, x: 0.5, y: 0.55, scale: 0.95, rotation: 0, opacity: 1 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        spin: {
          keyframes: [
            { time: 0, x: 0.5, y: 0.5, scale: 0.5, rotation: -180, opacity: 0 },
            { time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
        wave: {
          keyframes: [
            { time: 0, x: 0.3, y: 0.5, scale: 1, rotation: -5, opacity: 0 },
            { time: 0.5, x: 0.5, y: 0.45, scale: 1, rotation: 5, opacity: 1 },
            { time: 1, x: 0.7, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          ],
        },
      };

      const preset = presets[presetId];
      if (!preset) return;

      setState((prev) => ({
        ...prev,
        lyrics: prev.lyrics.map((lyric, i) => {
          if (i === lyricIndex) {
            return {
              ...lyric,
              keyframes: preset.keyframes.length > 0 ? preset.keyframes : undefined,
            };
          }
          return lyric;
        }),
      }));
    },
    [setState]
  );

  // ========================================
  // Effects
  // ========================================

  // Sync audio playback with state
  useEffect(() => {
    if (!audioRef.current) return;

    if (state.isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying, audioRef]);

  // Update current time from audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioRef, setState]);

  // ========================================
  // Render
  // ========================================

  return (
    <LyricalFlowUI
      // Audio State
      audioFile={state.audioFile}
      audioUrl={state.audioUrl}
      isPlaying={state.isPlaying}
      currentTime={state.currentTime}
      duration={duration}
      // Lyrics
      lyrics={state.lyrics}
      userProvidedLyrics={state.userProvidedLyrics}
      userCreativeVision={state.userCreativeVision}
      // Visual Settings - Basic
      currentStyle={state.currentStyle}
      animationSpeed={animationSpeed}
      bassShakeEnabled={state.visualSettings.cameraShake}
      // Visual Settings - Advanced
      aspectRatio={state.aspectRatio}
      colorPalette={state.visualSettings.colorPalette}
      fontFamily={state.visualSettings.fontFamily}
      textAnimation={state.visualSettings.textAnimation}
      reactivityIntensity={state.visualSettings.reactivityIntensity}
      shakeIntensity={state.visualSettings.shakeIntensity}
      dynamicBackgroundPulse={state.visualSettings.dynamicBackgroundPulse}
      particleTrails={state.visualSettings.particleTrails}
      blendMode={state.visualSettings.blendMode}
      frequencyMapping={state.visualSettings.frequencyMapping}
      // Recording
      isRecordingMic={isRecordingMic}
      // Edit Mode
      editMode={editMode}
      selectedLyricIndices={selectedLyricIndices}
      // Sync-related
      syncPrecision={state.syncPrecision}
      onUpdateWordTiming={handleUpdateWordTiming}
      onUpdateSyllableTiming={handleUpdateSyllableTiming}
      // Chat
      chatOpen={chatOpen}
      chatMessages={chatMessages}
      chatInput={chatInput}
      isProcessing={isProcessing}
      // Callbacks - Basic
      onFileUpload={onFileUpload}
      onTogglePlay={handleTogglePlay}
      onSeek={handleSeek}
      onSkipForward={handleSkipForward}
      onSkipBackward={handleSkipBackward}
      onStyleChange={handleStyleChange}
      onAnimationSpeedChange={handleAnimationSpeedChange}
      onBassShakeToggle={handleBassShakeToggle}
      onChatToggle={handleChatToggle}
      onChatInputChange={setChatInput}
      onChatSubmit={onChatSubmit}
      onLyricsChange={handleLyricsChange}
      onCreativeVisionChange={handleCreativeVisionChange}
      onEditLyric={handleEditLyric}
      onGenerateBackground={onShowGenModal}
      // Callbacks - Advanced
      onAspectRatioChange={handleAspectRatioChange}
      onColorPaletteChange={handleColorPaletteChange}
      onFontFamilyChange={handleFontFamilyChange}
      onTextAnimationChange={handleTextAnimationChange}
      onReactivityIntensityChange={handleReactivityIntensityChange}
      onShakeIntensityChange={handleShakeIntensityChange}
      onDynamicBackgroundPulseToggle={handleDynamicBackgroundPulseToggle}
      onParticleTrailsToggle={handleParticleTrailsToggle}
      onBlendModeChange={handleBlendModeChange}
      onFrequencyMappingChange={handleFrequencyMappingChange}
      // Callbacks - Recording
      onStartMicRecording={handleStartMicRecording}
      onStopMicRecording={handleStopMicRecording}
      onImageAnalysis={onImageAnalysis}
      // Callbacks - Edit Mode
      onEditModeToggle={handleEditModeToggle}
      onLyricSelect={handleLyricSelect}
      onSelectAllLyrics={handleSelectAllLyrics}
      onBulkTimeShift={handleBulkTimeShift}
      onTextTransform={handleTextTransform}
      onUpdateLyricTime={handleUpdateLyricTime}
      onUpdateLyricSection={handleUpdateLyricSection}
      onUpdateLyricText={handleUpdateLyricText}
      onUpdateLyricStyleOverride={handleUpdateLyricStyleOverride}
      onUpdateLyricPaletteOverride={handleUpdateLyricPaletteOverride}
      // Genre Detection
      detectedGenre={state.detectedGenre}
      genreOverride={state.genreOverride}
      onGenreOverride={handleGenreOverride}
      // Effects
      lyricEffects={state.lyricEffects}
      backgroundEffects={state.backgroundEffects}
      onAddLyricEffect={handleAddLyricEffect}
      onAddBackgroundEffect={handleAddBackgroundEffect}
      onRemoveLyricEffect={handleRemoveLyricEffect}
      onRemoveBackgroundEffect={handleRemoveBackgroundEffect}
      onToggleLyricEffect={handleToggleLyricEffect}
      onToggleBackgroundEffect={handleToggleBackgroundEffect}
      // Keyframe Animation
      onApplyMotionPreset={handleApplyMotionPreset}
      // Display
      currentLyricText={getCurrentLyricText()}
    >
      {/* Visualizer as the center content */}
      {state.audioUrl && (
        <Visualizer
          canvasRef={canvasRef}
          mediaStreamDestRef={mediaStreamDestRef}
          audioUrl={state.audioUrl}
          lyrics={state.lyrics}
          style={state.currentStyle}
          isPlaying={state.isPlaying}
          currentTime={state.currentTime}
          backgroundAsset={state.backgroundAsset}
          aspectRatio={state.aspectRatio}
          visualSettings={state.visualSettings}
          lyricEffects={state.lyricEffects}
          backgroundEffects={state.backgroundEffects}
          detectedGenre={state.detectedGenre}
          audioBuffer={state.audioBuffer}
        />
      )}
    </LyricalFlowUI>
  );
};

export default LyricalFlowWrapper;
