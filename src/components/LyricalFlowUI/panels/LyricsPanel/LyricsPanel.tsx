/**
 * LyricsPanel Component
 * Section containing lyrics timeline, edit mode, and bulk actions.
 * Extracted from LyricalFlowUI for better maintainability.
 */

import React, { useCallback, useState, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { PencilSquareIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import {
  LyricLine,
  VisualStyle,
  ColorPalette,
  TimingPrecision,
  WordTiming,
  SyllableTiming,
} from '../../../../../types';
import { formatTime } from '../../../../utils/time';
import { CollapsibleSection } from '../../CollapsibleSection';
import { ModeGate } from '../../../common';
import { WordTimingEditor } from '../../../LyricEditor/WordTimingEditor';
import { StepIndicator, DraggableTimeInput } from '../../subcomponents';
import {
  getSectionStyle,
  SECTION_TYPE_OPTIONS,
  STYLE_OVERRIDE_OPTIONS,
  PALETTE_OVERRIDE_OPTIONS,
  MOTION_PRESET_OPTIONS,
} from '../../constants';

export interface LyricsPanelProps {
  // State
  lyrics: LyricLine[];
  currentTime: number;
  editMode: boolean;
  selectedLyricIndices: Set<number>;
  syncPrecision: TimingPrecision;

  // Callbacks - Edit Mode
  onEditModeToggle: () => void;
  onLyricSelect: (index: number) => void;
  onSelectAllLyrics: () => void;
  onBulkTimeShift: (shift: number) => void;
  onTextTransform: (type: 'upper' | 'lower' | 'capitalize') => void;
  onUpdateLyricTime: (index: number, field: 'startTime' | 'endTime', value: number) => void;
  onUpdateLyricSection: (index: number, section: string) => void;
  onUpdateLyricText: (index: number, text: string) => void;
  onUpdateLyricStyleOverride: (index: number, style: VisualStyle | null) => void;
  onUpdateLyricPaletteOverride: (index: number, palette: ColorPalette | null) => void;
  onEditLyric: (index: number) => void;
  onApplyMotionPreset: (lyricIndex: number, presetId: string) => void;

  // Word/syllable timing
  onUpdateWordTiming: (lyricIndex: number, wordIndex: number, updates: Partial<WordTiming>) => void;
  onUpdateSyllableTiming?: (
    lyricIndex: number,
    wordIndex: number,
    syllableIndex: number,
    updates: Partial<SyllableTiming>
  ) => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  lyrics,
  currentTime,
  editMode,
  selectedLyricIndices,
  syncPrecision,
  onEditModeToggle,
  onLyricSelect,
  onSelectAllLyrics,
  onBulkTimeShift,
  onTextTransform,
  onUpdateLyricTime,
  onUpdateLyricSection,
  onUpdateLyricText,
  onUpdateLyricStyleOverride,
  onUpdateLyricPaletteOverride,
  onEditLyric,
  onApplyMotionPreset,
  onUpdateWordTiming,
  onUpdateSyllableTiming,
}) => {
  const [timeShiftValue, setTimeShiftValue] = useState<string>('0');

  // Find current lyric using binary search
  const currentLyricIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let left = 0;
    let right = lyrics.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const lyric = lyrics[mid];

      if (currentTime >= lyric.startTime && currentTime <= lyric.endTime) {
        return mid;
      } else if (currentTime < lyric.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return -1;
  }, [lyrics, currentTime]);

  // Virtualized lyric row renderer
  const renderLyricRow = useCallback(
    (i: number) => {
      const lyric = lyrics[i];
      if (!lyric) return null;

      return (
        <div
          className={`w-full p-2 rounded-lg glass-card lyric-line text-left border-l-2 ${getSectionStyle(lyric.section)} ${
            i === currentLyricIndex ? 'active' : ''
          } ${editMode && selectedLyricIndices.has(i) ? 'ring-1 ring-cyan-400/50' : ''}`}
          role="listitem"
          aria-current={i === currentLyricIndex ? 'true' : undefined}
        >
          {editMode ? (
            /* Edit Mode View */
            <div className="space-y-1.5">
              {/* Row 1: Checkbox, Time inputs, Section */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLyricIndices.has(i)}
                  onChange={() => onLyricSelect(i)}
                  className="glass-checkbox w-3 h-3 rounded"
                  aria-label={`Select lyric ${i + 1}`}
                />
                <DraggableTimeInput
                  value={lyric.startTime}
                  onChange={(val) => onUpdateLyricTime(i, 'startTime', val)}
                  max={lyric.endTime - 0.1}
                  label="Start time"
                />
                <span className="text-[9px] text-slate-500">→</span>
                <DraggableTimeInput
                  value={lyric.endTime}
                  onChange={(val) => onUpdateLyricTime(i, 'endTime', val)}
                  min={lyric.startTime + 0.1}
                  label="End time"
                />
                <select
                  value={lyric.section || ''}
                  onChange={(e) => onUpdateLyricSection(i, e.target.value)}
                  className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                  aria-label="Section type"
                >
                  <option value="">—</option>
                  {SECTION_TYPE_OPTIONS.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              {/* Row 2: Style Override, Palette Override */}
              <div className="flex items-center gap-2 pl-5">
                <select
                  value={lyric.styleOverride || ''}
                  onChange={(e) =>
                    onUpdateLyricStyleOverride(
                      i,
                      e.target.value ? (e.target.value as VisualStyle) : null
                    )
                  }
                  className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                  aria-label="Style override"
                >
                  {STYLE_OVERRIDE_OPTIONS.map((style) => (
                    <option key={style.value || 'default'} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <select
                  value={lyric.paletteOverride || ''}
                  onChange={(e) =>
                    onUpdateLyricPaletteOverride(
                      i,
                      e.target.value ? (e.target.value as ColorPalette) : null
                    )
                  }
                  className="glass-select py-0.5 px-1 rounded text-[8px] flex-1"
                  aria-label="Palette override"
                >
                  {PALETTE_OVERRIDE_OPTIONS.map((palette) => (
                    <option key={palette.value || 'default'} value={palette.value}>
                      {palette.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Row 3: Inline Text Editing */}
              <input
                type="text"
                value={lyric.text}
                onChange={(e) => onUpdateLyricText(i, e.target.value)}
                className="w-full py-1 px-2 rounded text-[10px] text-slate-200 glass-card border border-white/5 focus:border-cyan-500/30 outline-none ml-5"
                style={{ width: 'calc(100% - 1.25rem)' }}
                aria-label="Lyric text"
              />
              {/* Row 4: Word Timing Chips */}
              {syncPrecision !== 'line' && lyric.words && lyric.words.length > 0 && (
                <div className="pl-5 mt-1.5">
                  <WordTimingEditor
                    words={lyric.words}
                    lineStartTime={lyric.startTime}
                    lineEndTime={lyric.endTime}
                    precision={syncPrecision}
                    onWordUpdate={(wordIndex, updates) => onUpdateWordTiming(i, wordIndex, updates)}
                    onSyllableUpdate={
                      onUpdateSyllableTiming
                        ? (wordIndex, syllableIndex, updates) =>
                            onUpdateSyllableTiming(i, wordIndex, syllableIndex, updates)
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            /* View Mode */
            <button onClick={() => onEditLyric(i)} className="w-full text-left">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] text-cyan-400 font-mono">
                  {formatTime(lyric.startTime)}
                </span>
                {lyric.section && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/30 border border-white/5 uppercase tracking-wider text-slate-500">
                    {lyric.section}
                  </span>
                )}
              </div>
              <p
                className={`text-[10px] ${i === currentLyricIndex ? 'text-white' : 'text-slate-300/80'}`}
              >
                {lyric.text}
              </p>
            </button>
          )}
        </div>
      );
    },
    [
      lyrics,
      currentLyricIndex,
      editMode,
      selectedLyricIndices,
      syncPrecision,
      onLyricSelect,
      onUpdateLyricTime,
      onUpdateLyricSection,
      onUpdateLyricStyleOverride,
      onUpdateLyricPaletteOverride,
      onUpdateLyricText,
      onUpdateWordTiming,
      onUpdateSyllableTiming,
      onEditLyric,
    ]
  );

  return (
    <section aria-labelledby="timeline-heading">
      <div className="flex items-center justify-between mb-2">
        <StepIndicator step={4} label="Timeline" />
        <ModeGate mode="advanced">
          <button
            onClick={onEditModeToggle}
            className={`px-2 py-1 rounded-md text-[9px] glass-card flex items-center gap-1 transition ${
              editMode ? 'text-cyan-400 border-cyan-500/50' : 'text-slate-400 hover:text-cyan-400'
            }`}
            aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
            aria-pressed={editMode}
          >
            <PencilSquareIcon className="w-3 h-3" />
            {editMode ? 'Done' : 'Edit'}
          </button>
        </ModeGate>
      </div>

      {/* Bulk Actions Bar */}
      {editMode && selectedLyricIndices.size > 0 && (
        <div className="bulk-actions-bar mb-2 p-2 rounded-lg glass-card border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-cyan-400">{selectedLyricIndices.size} selected</span>
            <button
              onClick={onSelectAllLyrics}
              className="text-[9px] text-slate-400 hover:text-cyan-400"
            >
              {selectedLyricIndices.size === lyrics.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* Time Shift */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={timeShiftValue}
                onChange={(e) => setTimeShiftValue(e.target.value)}
                className="time-input w-12 py-0.5 px-1 rounded text-[9px] text-center"
                placeholder="0"
                step="0.1"
              />
              <button
                onClick={() => onBulkTimeShift(parseFloat(timeShiftValue) || 0)}
                className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
              >
                Shift
              </button>
            </div>
            {/* Text Transform */}
            <button
              onClick={() => onTextTransform('upper')}
              className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
            >
              UPPER
            </button>
            <button
              onClick={() => onTextTransform('lower')}
              className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
            >
              lower
            </button>
            <button
              onClick={() => onTextTransform('capitalize')}
              className="bulk-action-btn px-2 py-0.5 rounded text-[9px]"
            >
              Title
            </button>
          </div>
        </div>
      )}

      {/* Motion Presets */}
      <CollapsibleSection title="Motion Presets" storageKey="keyframe-editor" requiresAdvancedMode>
        <div className="p-2.5 rounded-lg glass-card">
          <p className="text-[8px] text-slate-500 mb-2">Apply motion presets to selected lyrics</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                id="motion-preset-select"
                className="glass-select flex-1 py-1 px-2 rounded text-[9px] text-slate-300"
                defaultValue=""
                aria-label="Select motion preset"
              >
                <option value="">Select preset...</option>
                {MOTION_PRESET_OPTIONS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const select = document.getElementById(
                    'motion-preset-select'
                  ) as HTMLSelectElement;
                  const presetId = select?.value;
                  if (presetId && selectedLyricIndices.size > 0) {
                    selectedLyricIndices.forEach((index) => {
                      onApplyMotionPreset(index, presetId);
                    });
                  }
                }}
                disabled={selectedLyricIndices.size === 0}
                className="bulk-action-btn px-2 py-1 rounded text-[9px] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            {selectedLyricIndices.size === 0 && editMode && (
              <p className="text-[8px] text-amber-400/70">Select lyrics above to apply motion</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Lyrics List */}
      {lyrics.length > 0 ? (
        <Virtuoso
          style={{ height: '256px' }}
          totalCount={lyrics.length}
          itemContent={renderLyricRow}
          overscan={3}
          className="custom-scrollbar space-y-1.5"
          role="list"
          aria-label="Lyrics timeline"
        />
      ) : (
        <div className="p-4 rounded-lg glass-card text-center">
          <MusicalNoteIcon className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
          <p className="text-[10px] text-slate-500">Upload audio to see timeline</p>
        </div>
      )}
    </section>
  );
};

export default LyricsPanel;
