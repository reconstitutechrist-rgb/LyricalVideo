/**
 * useExportManager Hook
 * Manages video export, recording, format conversion, and progress tracking.
 * Extracted from App.tsx to reduce monolithic component size.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useExportStore, toast } from '../stores';
import { ExportSettings, ExportProgress, DEFAULT_EXPORT_SETTINGS } from '../../types';
import { formatTime } from '../utils/time';

export interface ExportManagerOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  mediaStreamDestRef: React.RefObject<MediaStreamAudioDestinationNode | null>;
  onExportStart?: () => void;
  onExportComplete?: (format: 'mp4' | 'webm') => void;
  onExportCancel?: () => void;
  onExportError?: (error: Error) => void;
}

export interface ExportManagerReturn {
  // State
  exportSettings: ExportSettings;
  exportProgress: ExportProgress | null;
  showExportSettings: boolean;
  isRecording: boolean;

  // Actions
  setExportSettings: (settings: ExportSettings) => void;
  updateExportSetting: <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => void;
  setShowExportSettings: (show: boolean) => void;
  startExport: () => void;
  cancelExport: () => void;
}

export function useExportManager(options: ExportManagerOptions): ExportManagerReturn {
  const {
    canvasRef,
    audioElementRef,
    mediaStreamDestRef,
    onExportStart,
    onExportComplete,
    onExportCancel,
    onExportError,
  } = options;

  const exportStore = useExportStore();

  // Local state (synced with store)
  const [exportSettings, setExportSettingsLocal] =
    useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showExportSettings, setShowExportSettingsLocal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs for cleanup
  const exportProgressIntervalRef = useRef<number | null>(null);
  const audioEndedHandlerRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Sync with store
  useEffect(() => {
    exportStore.setSettings(exportSettings);
  }, [exportSettings, exportStore]);

  useEffect(() => {
    exportStore.setProgress(exportProgress);
  }, [exportProgress, exportStore]);

  useEffect(() => {
    exportStore.setShowExportSettings(showExportSettings);
  }, [showExportSettings, exportStore]);

  useEffect(() => {
    exportStore.setIsRecording(isRecording);
  }, [isRecording, exportStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }
      if (audioEndedHandlerRef.current && audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
        audioEndedHandlerRef.current = null;
      }
    };
  }, [audioElementRef]);

  // Update settings
  const setExportSettings = useCallback((settings: ExportSettings) => {
    setExportSettingsLocal(settings);
  }, []);

  const updateExportSetting = useCallback(
    <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
      setExportSettingsLocal((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setShowExportSettings = useCallback((show: boolean) => {
    setShowExportSettingsLocal(show);
  }, []);

  // Helper function to download a blob
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Start export
  const startExport = useCallback(() => {
    if (!canvasRef.current || !mediaStreamDestRef.current || !audioElementRef.current) {
      toast.error('Export Failed', 'Canvas or audio not ready');
      return;
    }

    // Clear any existing export state
    if (exportProgressIntervalRef.current) {
      clearInterval(exportProgressIntervalRef.current);
      exportProgressIntervalRef.current = null;
    }
    if (audioEndedHandlerRef.current && audioElementRef.current) {
      audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
      audioEndedHandlerRef.current = null;
    }

    const audio = audioElementRef.current;
    const duration = audio.duration;

    if (!duration || duration === 0) {
      toast.error('Export Failed', 'No audio loaded or audio has no duration');
      return;
    }

    // Capture canvas stream
    const canvasStream = canvasRef.current.captureStream(exportSettings.framerate);
    const audioStream = mediaStreamDestRef.current.stream;

    // Combine canvas video with audio
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    recordedChunksRef.current = [];

    setExportProgress({ stage: 'recording', percent: 0, message: 'Exporting video...' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      // Clear progress interval
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }

      const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

      if (exportSettings.format === 'mp4') {
        setExportProgress({ stage: 'converting', percent: 0, message: 'Loading FFmpeg...' });
        try {
          // Import dynamically to avoid loading FFmpeg until needed
          const { convertWebMToMP4 } = await import('../../services/ffmpegService');
          setExportProgress({ stage: 'converting', percent: 5, message: 'Converting to MP4...' });

          const mp4Blob = await convertWebMToMP4(webmBlob, {
            quality: exportSettings.quality,
            framerate: exportSettings.framerate,
            onProgress: (percent) => {
              const scaledPercent = 5 + Math.round(percent * 0.9);
              setExportProgress({
                stage: 'converting',
                percent: scaledPercent,
                message: 'Converting to MP4...',
              });
            },
          });

          setExportProgress({ stage: 'complete', percent: 100, message: 'Download starting...' });
          downloadBlob(mp4Blob, `lyrical-flow-${Date.now()}.mp4`);
          onExportComplete?.('mp4');
        } catch (error) {
          toast.warning('MP4 Conversion Failed', 'Downloading as WebM instead');
          downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
          onExportError?.(error instanceof Error ? error : new Error('MP4 conversion failed'));
        }
      } else {
        downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
        onExportComplete?.('webm');
      }

      setExportProgress(null);
      setIsRecording(false);
    };

    // Auto-stop when audio ends
    const handleAudioEnded = () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audioEndedHandlerRef.current = null;

      // Small delay to ensure final frames are captured
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      }, 100);
    };

    audioEndedHandlerRef.current = handleAudioEnded;
    audio.addEventListener('ended', handleAudioEnded);

    // Start recording
    mediaRecorderRef.current = recorder;
    recorder.start();

    // Seek to beginning and play
    audio.currentTime = 0;
    audio.play();

    setIsRecording(true);
    setShowExportSettingsLocal(false);
    onExportStart?.();

    // Update progress based on playback position
    exportProgressIntervalRef.current = window.setInterval(() => {
      if (audioElementRef.current) {
        const currentTime = audioElementRef.current.currentTime;
        const percent = Math.round((currentTime / duration) * 100);
        setExportProgress({
          stage: 'recording',
          percent,
          message: `Exporting... ${formatTime(currentTime)} / ${formatTime(duration)}`,
        });
      }
    }, 250);
  }, [
    canvasRef,
    audioElementRef,
    mediaStreamDestRef,
    exportSettings,
    downloadBlob,
    onExportStart,
    onExportComplete,
    onExportError,
  ]);

  // Cancel export
  const cancelExport = useCallback(() => {
    // Stop the recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop and reset audio
    if (audioElementRef.current) {
      if (audioEndedHandlerRef.current) {
        audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
        audioEndedHandlerRef.current = null;
      }
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }

    // Clear progress interval
    if (exportProgressIntervalRef.current) {
      clearInterval(exportProgressIntervalRef.current);
      exportProgressIntervalRef.current = null;
    }

    setIsRecording(false);
    setExportProgress(null);
    onExportCancel?.();
  }, [audioElementRef, onExportCancel]);

  return {
    // State
    exportSettings,
    exportProgress,
    showExportSettings,
    isRecording,

    // Actions
    setExportSettings,
    updateExportSetting,
    setShowExportSettings,
    startExport,
    cancelExport,
  };
}
