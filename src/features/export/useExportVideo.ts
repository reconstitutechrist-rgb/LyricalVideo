/**
 * Export Video Hook
 * Handles video export including recording, conversion, and download
 */

import { useRef, useEffect, useCallback, RefObject } from 'react';
import { formatTime } from '../../utils/time';
import { toast } from '../../stores/toastStore';
import type { ExportSettings, ExportProgress } from '../../../types';

interface UseExportVideoOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  audioElementRef: RefObject<HTMLAudioElement | null>;
  mediaStreamDestRef: RefObject<MediaStreamAudioDestinationNode | null>;
  exportSettings: ExportSettings;
  setExportProgress: (progress: ExportProgress | null) => void;
  addChatMessage: (text: string) => void;
  setIsRecording: (recording: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setShowExportSettings: (show: boolean) => void;
}

interface UseExportVideoReturn {
  startExport: () => void;
  cancelExport: () => void;
}

/**
 * Hook to handle video export functionality
 * Manages recording, conversion to MP4, and download
 */
export const useExportVideo = ({
  canvasRef,
  audioElementRef,
  mediaStreamDestRef,
  exportSettings,
  setExportProgress,
  addChatMessage,
  setIsRecording,
  setIsPlaying,
  setShowExportSettings,
}: UseExportVideoOptions): UseExportVideoReturn => {
  const exportProgressIntervalRef = useRef<number | null>(null);
  const audioEndedHandlerRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Cleanup export resources on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (exportProgressIntervalRef.current) {
        clearInterval(exportProgressIntervalRef.current);
        exportProgressIntervalRef.current = null;
      }
      // Remove audio ended listener if it exists
      if (audioEndedHandlerRef.current && audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', audioEndedHandlerRef.current);
        audioEndedHandlerRef.current = null;
      }
    };
  }, [audioElementRef]);

  // Helper function to download a blob
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const startExport = useCallback(() => {
    if (!canvasRef.current || !mediaStreamDestRef.current || !audioElementRef.current) return;

    // Clear any existing export state to prevent memory leaks from repeated exports
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
      addChatMessage('Cannot export: No audio loaded or audio has no duration.');
      return;
    }

    // Use framerate from export settings
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
          const { convertWebMToMP4 } = await import('../../../services/ffmpegService');
          setExportProgress({ stage: 'converting', percent: 5, message: 'Converting to MP4...' });
          const mp4Blob = await convertWebMToMP4(webmBlob, {
            quality: exportSettings.quality,
            framerate: exportSettings.framerate,
            onProgress: (percent) => {
              // Scale progress from 5-95% to leave room for loading and finalizing
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
          addChatMessage(
            `Exported ${exportSettings.resolution} MP4 at ${exportSettings.framerate}fps (${exportSettings.quality} quality)`
          );
        } catch (_error) {
          toast.warning('MP4 Conversion Failed', 'Downloading as WebM instead');
          addChatMessage('MP4 conversion failed. Downloading as WebM instead.');
          // Fallback to WebM
          downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
        }
      } else {
        downloadBlob(webmBlob, `lyrical-flow-${Date.now()}.webm`);
        addChatMessage(
          `Exported ${exportSettings.resolution} WebM at ${exportSettings.framerate}fps`
        );
      }

      setExportProgress(null);
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
        setIsPlaying(false);
      }, 100);
    };

    // Store handler reference for cleanup
    audioEndedHandlerRef.current = handleAudioEnded;
    audio.addEventListener('ended', handleAudioEnded);

    // Start recording
    mediaRecorderRef.current = recorder;
    recorder.start();

    // Seek to beginning and play
    audio.currentTime = 0;
    audio.play();

    setIsRecording(true);
    setIsPlaying(true);
    setShowExportSettings(false);

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
    setExportProgress,
    addChatMessage,
    setIsRecording,
    setIsPlaying,
    setShowExportSettings,
    downloadBlob,
  ]);

  const cancelExport = useCallback(() => {
    // Stop the recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop and reset audio, remove ended listener
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
    setIsPlaying(false);
    setExportProgress(null);

    addChatMessage('Export cancelled.');
  }, [audioElementRef, setExportProgress, addChatMessage, setIsRecording, setIsPlaying]);

  return {
    startExport,
    cancelExport,
  };
};

export default useExportVideo;
