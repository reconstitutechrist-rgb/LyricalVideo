import React, { useRef, useState, useCallback } from 'react';
import {
  MusicalNoteIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';

interface AudioLyricsUploaderProps {
  audioFile: File | null;
  lyrics: string;
  isTranscribing: boolean;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
  onTranscribe: () => void;
  onLyricsChange: (lyrics: string) => void;
  onContinue: () => void;
}

export const AudioLyricsUploader: React.FC<AudioLyricsUploaderProps> = ({
  audioFile,
  lyrics,
  isTranscribing,
  isProcessing,
  onFileSelect,
  onTranscribe,
  onLyricsChange,
  onContinue,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-white mb-1">Upload Audio & Lyrics</h3>
        <p className="text-sm text-gray-400">
          Upload your audio and either paste lyrics or let AI transcribe them
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Audio Dropzone */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Audio File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex-1 min-h-[200px]
              cursor-pointer
              p-6
              rounded-xl
              border-2 border-dashed
              transition-all duration-300
              flex flex-col items-center justify-center
              ${
                isDragOver
                  ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,212,255,0.2)]'
                  : audioFile
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-cyan-500/25 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:border-cyan-500/40 hover:bg-gray-800/80'
              }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {audioFile ? (
              <>
                <CheckCircleIcon className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-sm font-medium text-green-300 mb-1">Audio Loaded</p>
                <p className="text-xs text-gray-400 text-center truncate max-w-full px-2">
                  {audioFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">Click to change</p>
              </>
            ) : (
              <>
                <div
                  className={`
                    w-12 h-12 rounded-full mb-3
                    flex items-center justify-center
                    ${isDragOver ? 'bg-cyan-500/30' : 'bg-cyan-500/10'}
                    transition-colors duration-300
                  `}
                >
                  {isDragOver ? (
                    <ArrowUpTrayIcon className="w-6 h-6 text-cyan-400 animate-bounce" />
                  ) : (
                    <MusicalNoteIcon className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-200 mb-1">
                  {isDragOver ? 'Drop to upload' : 'Drop audio here'}
                </p>
                <p className="text-xs text-gray-400">or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">MP3, WAV, FLAC</p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Lyrics Input */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Lyrics (Optional)
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => onLyricsChange(e.target.value)}
            placeholder="Paste lyrics here, or click Transcribe to let AI listen to your audio..."
            disabled={isTranscribing}
            className={`
              flex-1 min-h-[200px]
              w-full
              bg-gradient-to-br from-gray-800/60 to-gray-900/60
              border border-gray-700/50
              rounded-xl
              px-4 py-3
              text-sm text-gray-200
              placeholder-gray-500
              resize-none
              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25
              transition-all duration-200
              ${isTranscribing ? 'opacity-50' : ''}
            `}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onTranscribe}
          disabled={!audioFile || isTranscribing || isProcessing}
          className={`
            flex-1 flex items-center justify-center gap-2
            px-4 py-3
            rounded-xl
            font-medium text-sm
            transition-all duration-200
            ${
              !audioFile || isTranscribing || isProcessing
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20'
            }
          `}
        >
          {isTranscribing ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-4 h-4" />
              Transcribe with AI
            </>
          )}
        </button>

        <button
          onClick={onContinue}
          disabled={!audioFile || isTranscribing || isProcessing}
          className={`
            flex-1 flex items-center justify-center gap-2
            px-4 py-3
            rounded-xl
            font-medium text-sm
            transition-all duration-200
            ${
              !audioFile || isTranscribing || isProcessing
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/20'
            }
          `}
        >
          Continue
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        {!audioFile
          ? 'Upload an audio file to get started'
          : lyrics
            ? 'Review your lyrics and click Continue when ready'
            : 'Paste your lyrics above, or click Transcribe to let AI listen'}
      </p>
    </div>
  );
};
