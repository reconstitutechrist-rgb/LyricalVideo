import React, { useState, useCallback } from 'react';
import {
  ExportSettings,
  ExportResolution,
  ExportFramerate,
  ExportQuality,
  ExportFormat,
  ExportProgress,
  AspectRatio,
} from '../../../types';
import { FilmIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { PresetSelector } from '../ExportPresets';
import {
  exportPresetsService,
  ExportPreset,
  CustomExportPreset,
} from '../../../services/exportPresets';
import { useExportStore, useVisualSettingsStore } from '../../stores';

interface ExportSettingsPanelProps {
  // Optional props - will use export store if not provided
  settings?: ExportSettings;
  onChange?: (settings: ExportSettings) => void;
  progress?: ExportProgress | null;
  isRecording?: boolean;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (aspectRatio: AspectRatio) => void;
}

const RESOLUTION_OPTIONS: { value: ExportResolution; label: string; description: string }[] = [
  { value: '720p', label: '720p HD', description: '1280x720 - Fast rendering' },
  { value: '1080p', label: '1080p Full HD', description: '1920x1080 - Recommended' },
  { value: '4K', label: '4K Ultra HD', description: '3840x2160 - High memory usage' },
];

const FRAMERATE_OPTIONS: { value: ExportFramerate; label: string; description: string }[] = [
  { value: 24, label: '24 fps', description: 'Cinematic look' },
  { value: 30, label: '30 fps', description: 'Standard video' },
  { value: 60, label: '60 fps', description: 'Smooth motion' },
];

const QUALITY_OPTIONS: { value: ExportQuality; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Smaller file, faster' },
  { value: 'medium', label: 'Medium', description: 'Balanced' },
  { value: 'high', label: 'High', description: 'Great quality' },
  { value: 'ultra', label: 'Ultra', description: 'Best quality, large file' },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'mp4', label: 'MP4 (H.264)', description: 'Universal compatibility' },
  { value: 'webm', label: 'WebM (VP9)', description: 'Web-optimized, faster export' },
];

const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio;
  label: string;
  icon: string;
  platform?: string;
}[] = [
  { value: '16:9', label: '16:9', icon: 'landscape', platform: 'YouTube, TV' },
  { value: '9:16', label: '9:16', icon: 'portrait', platform: 'TikTok, Reels, Stories' },
  { value: '1:1', label: '1:1', icon: 'square', platform: 'Instagram Feed' },
  { value: '4:3', label: '4:3', icon: 'landscape', platform: 'Classic TV' },
  { value: '3:4', label: '3:4', icon: 'portrait', platform: 'Portrait Photo' },
  { value: '2:3', label: '2:3', icon: 'portrait', platform: 'Pinterest' },
  { value: '3:2', label: '3:2', icon: 'landscape', platform: 'Photography' },
  { value: '21:9', label: '21:9', icon: 'ultrawide', platform: 'Cinematic' },
];

export const ExportSettingsPanel: React.FC<ExportSettingsPanelProps> = ({
  settings: settingsProp,
  onChange: onChangeProp,
  progress: progressProp,
  isRecording: isRecordingProp,
  aspectRatio: aspectRatioProp,
  onAspectRatioChange: onAspectRatioChangeProp,
}) => {
  // Use export store values with props as override
  const exportStore = useExportStore();
  const visualSettingsStore = useVisualSettingsStore();

  const settings = settingsProp ?? exportStore.settings;
  const progress = progressProp ?? exportStore.progress;
  const isRecording = isRecordingProp ?? exportStore.isRecording;
  const aspectRatio = aspectRatioProp ?? visualSettingsStore.aspectRatio;

  // Use store actions if props not provided
  const onChange = useCallback(
    (newSettings: ExportSettings) => {
      if (onChangeProp) {
        onChangeProp(newSettings);
      } else {
        exportStore.setSettings(newSettings);
      }
    },
    [onChangeProp, exportStore]
  );

  const onAspectRatioChange = useCallback(
    (ratio: AspectRatio) => {
      if (onAspectRatioChangeProp) {
        onAspectRatioChangeProp(ratio);
      } else {
        visualSettingsStore.setAspectRatio(ratio);
      }
    },
    [onAspectRatioChangeProp, visualSettingsStore]
  );

  const [showPresets, setShowPresets] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [, forceUpdate] = useState({});

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleSelectPreset = useCallback(
    (preset: ExportPreset | CustomExportPreset) => {
      onChange({
        resolution: preset.resolution,
        framerate: preset.framerate,
        quality: preset.quality,
        format: preset.format,
      });
      onAspectRatioChange(preset.aspectRatio);
    },
    [onChange, onAspectRatioChange]
  );

  const handleSaveCustomPreset = useCallback(
    (name: string) => {
      exportPresetsService.saveCustomPreset(name, settings, aspectRatio);
      forceUpdate({});
    },
    [settings, aspectRatio]
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2 text-white">
        <FilmIcon className="w-5 h-5 text-purple-400" />
        <span className="font-medium">Export Settings</span>
      </div>

      {/* Presets Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-300"
        >
          <span className="flex items-center gap-1">
            <Cog6ToothIcon className="w-3 h-3" />
            Platform Presets
          </span>
          {showPresets ? (
            <ChevronUpIcon className="w-3 h-3" />
          ) : (
            <ChevronDownIcon className="w-3 h-3" />
          )}
        </button>
        {showPresets && (
          <PresetSelector
            currentSettings={settings}
            currentAspectRatio={aspectRatio}
            onSelectPreset={handleSelectPreset}
            onSaveCustomPreset={handleSaveCustomPreset}
          />
        )}
      </div>

      {/* Progress indicator */}
      {progress && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
          <div className="flex justify-between text-xs text-purple-200 mb-2">
            <span>{progress.message || progress.stage}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full bg-purple-900/50 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 flex items-center gap-1">
          <Cog6ToothIcon className="w-3 h-3" />
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onAspectRatioChange(opt.value)}
              disabled={isRecording}
              className={`px-2 py-2 rounded-lg text-xs transition-all ${
                aspectRatio === opt.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={opt.platform}
            >
              <div className="font-medium">{opt.label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {ASPECT_RATIO_OPTIONS.find((o) => o.value === aspectRatio)?.platform}
        </p>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full py-2 text-xs text-gray-400 hover:text-gray-300 border-t border-gray-700/50"
      >
        <span>Advanced Settings</span>
        {showAdvanced ? (
          <ChevronUpIcon className="w-3 h-3" />
        ) : (
          <ChevronDownIcon className="w-3 h-3" />
        )}
      </button>

      {showAdvanced && (
        <>
          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <Cog6ToothIcon className="w-3 h-3" />
              Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('resolution', opt.value)}
                  disabled={isRecording}
                  className={`px-3 py-2 rounded-lg text-xs transition-all ${
                    settings.resolution === opt.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {settings.resolution === '4K' && (
              <p className="text-xs text-yellow-400/80">
                4K requires significant memory. Ensure your device can handle it.
              </p>
            )}
          </div>

          {/* Framerate */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Framerate</label>
            <div className="grid grid-cols-3 gap-2">
              {FRAMERATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('framerate', opt.value)}
                  disabled={isRecording}
                  className={`px-3 py-2 rounded-lg text-xs transition-all ${
                    settings.framerate === opt.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('format', opt.value)}
                  disabled={isRecording}
                  className={`px-3 py-2 rounded-lg text-xs transition-all ${
                    settings.format === opt.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {settings.format === 'mp4' && (
              <p className="text-xs text-blue-400/80">
                MP4 conversion uses FFmpeg in your browser (~25MB download on first use).
              </p>
            )}
          </div>

          {/* Quality (only for MP4) */}
          {settings.format === 'mp4' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Quality</label>
              <div className="grid grid-cols-4 gap-2">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting('quality', opt.value)}
                    disabled={isRecording}
                    className={`px-2 py-2 rounded-lg text-xs transition-all ${
                      settings.quality === opt.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={opt.description}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Output:</span>
          <span className="text-gray-200">
            {aspectRatio} • {settings.resolution} @ {settings.framerate}fps
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Format:</span>
          <span className="text-gray-200">
            {settings.format.toUpperCase()}
            {settings.format === 'mp4' ? ` (${settings.quality})` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExportSettingsPanel;
