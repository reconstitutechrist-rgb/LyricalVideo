import React, { useRef, useState, useCallback } from 'react';
import { MusicalNoteIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

interface AudioDropzoneBubbleProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const AudioDropzoneBubble: React.FC<AudioDropzoneBubbleProps> = ({
  onFileSelect,
  isProcessing,
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
    <div className="mb-3">
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
          chat-dropzone-bubble
          cursor-pointer
          p-6
          rounded-2xl
          border-2 border-dashed
          transition-all duration-300
          ${
            isDragOver
              ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,212,255,0.2)]'
              : 'border-cyan-500/25 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:border-cyan-500/40 hover:bg-gray-800/80'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center text-center">
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
            {isDragOver ? 'Drop to upload' : 'Drop audio here to begin'}
          </p>
          <p className="text-xs text-gray-400">or click to browse</p>
          <p className="text-xs text-gray-500 mt-2">MP3, WAV, FLAC supported</p>
        </div>
      </div>
    </div>
  );
};
