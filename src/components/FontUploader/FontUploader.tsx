import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { fontService, CustomFont, BUILTIN_FONTS } from '../../../services/fontService';

interface FontUploaderProps {
  currentFont: string;
  onFontChange: (fontName: string) => void;
}

export const FontUploader: React.FC<FontUploaderProps> = ({ currentFont, onFontChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize font service and load custom fonts
  useEffect(() => {
    fontService.init().then(() => {
      setCustomFonts(fontService.getAllFonts().custom);
    });
  }, []);

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

  const uploadFont = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      try {
        const font = await fontService.uploadFont(file);
        setCustomFonts(fontService.getAllFonts().custom);
        onFontChange(font.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload font');
      } finally {
        setIsUploading(false);
      }
    },
    [onFontChange]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadFont(file);
      }
    },
    [uploadFont]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFont(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFont = async (fontId: string, fontName: string) => {
    await fontService.removeFont(fontId);
    setCustomFonts(fontService.getAllFonts().custom);

    // If current font was removed, switch to default
    if (currentFont === fontName) {
      onFontChange(BUILTIN_FONTS[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Font Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 w-20">Font</label>
        <select
          value={currentFont}
          onChange={(e) => onFontChange(e.target.value)}
          className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
          style={{ fontFamily: currentFont }}
        >
          <optgroup label="Built-in Fonts">
            {BUILTIN_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </optgroup>
          {customFonts.length > 0 && (
            <optgroup label="Custom Fonts">
              {customFonts.map((font) => (
                <option key={font.id} value={font.name} style={{ fontFamily: font.name }}>
                  {font.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50 hover:border-cyan-500/50 transition-colors"
          title="Manage custom fonts"
        >
          <ArrowUpTrayIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Expandable Upload Section */}
      {isExpanded && (
        <div className="space-y-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
          {/* Upload Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              cursor-pointer
              p-4
              rounded-xl
              border-2 border-dashed
              transition-all duration-300
              ${
                isDragOver
                  ? 'border-cyan-400/60 bg-cyan-500/10'
                  : 'border-gray-600/50 bg-gray-900/40 hover:border-cyan-500/40'
              }
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex flex-col items-center text-center">
              <ArrowUpTrayIcon
                className={`w-6 h-6 mb-2 ${
                  isDragOver ? 'text-cyan-400 animate-bounce' : 'text-gray-500'
                }`}
              />
              <p className="text-xs font-medium text-gray-300">
                {isUploading ? 'Uploading...' : 'Drop font file or click to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">TTF, OTF, WOFF, WOFF2</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Custom Fonts List */}
          {customFonts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Custom Fonts ({customFonts.length}/5)</p>
              {customFonts.map((font) => (
                <div
                  key={font.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate" style={{ fontFamily: font.name }}>
                      {font.name}
                    </p>
                    <p className="text-xs text-gray-500">{font.fileName}</p>
                  </div>
                  <button
                    onClick={() => removeFont(font.id, font.name)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors group"
                    title="Remove font"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500 group-hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Font Preview */}
          <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-700/30">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <p className="text-lg text-gray-200" style={{ fontFamily: currentFont }}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontUploader;
