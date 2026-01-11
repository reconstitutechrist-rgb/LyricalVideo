import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LyricalFlowUI } from './LyricalFlowUI';
import Visualizer from '../../../components/Visualizer';
import { AppState, VisualStyle, ChatMessage, LyricLine } from '../../../types';

/**
 * LyricalFlowWrapper
 *
 * This component integrates the new LyricalFlowUI with the existing app state.
 * It acts as a bridge between the existing App.tsx state management and the new UI.
 *
 * Usage in App.tsx:
 * Replace the existing UI with:
 * <LyricalFlowWrapper
 *   state={state}
 *   setState={setState}
 *   chatMessages={chatMessages}
 *   chatInput={chatInput}
 *   setChatInput={setChatInput}
 *   onChatSubmit={handleChatSubmit}
 *   onFileUpload={handleFileUpload}
 *   isProcessing={isProcessing}
 *   ... other handlers
 * />
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
  onShowGenModal,
  audioRef,
  duration,
  canvasRef,
  mediaStreamDestRef,
}) => {
  // Local state for animation speed (maps to visualSettings.particleSpeed)
  const [animationSpeed, setAnimationSpeed] = useState(state.visualSettings.particleSpeed);

  // Find current lyric based on currentTime
  const getCurrentLyricText = useCallback((): string => {
    const current = state.lyrics.find(
      (l) => state.currentTime >= l.startTime && state.currentTime <= l.endTime
    );
    return current?.text || '';
  }, [state.lyrics, state.currentTime]);

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [setState]);

  // Seek to time
  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      setState((prev) => ({ ...prev, currentTime: time }));
    },
    [audioRef, setState]
  );

  // Skip forward 10 seconds
  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(state.currentTime + 10, duration);
    handleSeek(newTime);
  }, [state.currentTime, duration, handleSeek]);

  // Skip backward 10 seconds
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(state.currentTime - 10, 0);
    handleSeek(newTime);
  }, [state.currentTime, handleSeek]);

  // Change visual style
  const handleStyleChange = useCallback(
    (style: VisualStyle) => {
      setState((prev) => ({ ...prev, currentStyle: style }));
    },
    [setState]
  );

  // Change animation speed
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

  // Toggle bass shake
  const handleBassShakeToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visualSettings: {
        ...prev.visualSettings,
        cameraShake: !prev.visualSettings.cameraShake,
      },
    }));
  }, [setState]);

  // Toggle chat
  const handleChatToggle = useCallback(() => {
    setChatOpen(!chatOpen);
  }, [chatOpen, setChatOpen]);

  // Handle lyrics input change
  const handleLyricsChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, userProvidedLyrics: value }));
    },
    [setState]
  );

  // Handle creative vision change
  const handleCreativeVisionChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, userCreativeVision: value }));
    },
    [setState]
  );

  // Handle edit lyric (scroll to lyric and open edit mode)
  const handleEditLyric = useCallback(
    (index: number) => {
      // Seek to the lyric's start time
      const lyric = state.lyrics[index];
      if (lyric && audioRef.current) {
        audioRef.current.currentTime = lyric.startTime;
        setState((prev) => ({ ...prev, currentTime: lyric.startTime }));
      }
    },
    [state.lyrics, audioRef, setState]
  );

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
      // Visual Settings
      currentStyle={state.currentStyle}
      animationSpeed={animationSpeed}
      bassShakeEnabled={state.visualSettings.cameraShake}
      // Chat
      chatOpen={chatOpen}
      chatMessages={chatMessages}
      chatInput={chatInput}
      isProcessing={isProcessing}
      // Callbacks
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
