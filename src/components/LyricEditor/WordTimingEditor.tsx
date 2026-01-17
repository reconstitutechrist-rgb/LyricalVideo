import React, { useState } from 'react';
import { WordTiming, SyllableTiming, TimingPrecision } from '../../../types';

interface WordTimingEditorProps {
  words: WordTiming[];
  lineStartTime: number;
  lineEndTime: number;
  precision: TimingPrecision;
  onWordUpdate: (wordIndex: number, updates: Partial<WordTiming>) => void;
  onSyllableUpdate?: (
    wordIndex: number,
    syllableIndex: number,
    updates: Partial<SyllableTiming>
  ) => void;
}

export const WordTimingEditor: React.FC<WordTimingEditorProps> = ({
  words,
  lineStartTime,
  lineEndTime,
  precision,
  onWordUpdate,
  onSyllableUpdate,
}) => {
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const lineDuration = lineEndTime - lineStartTime;

  // Guard against zero/negative duration
  if (lineDuration <= 0) {
    return <div className="text-[8px] text-slate-500">Invalid line timing</div>;
  }

  return (
    <div className="space-y-1">
      <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">
        Word Timing ({words.length} words)
      </div>

      {/* Word chips row */}
      <div className="flex flex-wrap gap-1">
        {words.map((word, wordIndex) => {
          const isExpanded = expandedWord === wordIndex;

          return (
            <div key={word.id || wordIndex} className="relative">
              <button
                onClick={() => setExpandedWord(isExpanded ? null : wordIndex)}
                className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
                  isExpanded
                    ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50'
                    : 'bg-black/30 text-slate-300 hover:bg-black/50 border border-white/10'
                }`}
                title={`${word.text}: ${word.startTime.toFixed(2)}s - ${word.endTime.toFixed(2)}s`}
              >
                {word.text}
                {word.confidence !== undefined && word.confidence < 0.7 && (
                  <span className="ml-1 text-amber-400">?</span>
                )}
              </button>

              {/* Expanded word timing editor */}
              {isExpanded && (
                <div className="absolute top-full left-0 mt-1 z-20 p-2 rounded-lg bg-gray-900 border border-cyan-500/30 shadow-lg min-w-[160px]">
                  <div className="text-[8px] text-cyan-400 mb-1.5 font-medium">{word.text}</div>

                  {/* Word time inputs */}
                  <div className="flex items-center gap-1 mb-1">
                    <input
                      type="number"
                      value={word.startTime.toFixed(3)}
                      onChange={(e) =>
                        onWordUpdate(wordIndex, { startTime: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 px-1 py-0.5 rounded text-[9px] bg-black/50 border border-white/10 text-slate-300"
                      step="0.01"
                    />
                    <span className="text-[8px] text-slate-500">→</span>
                    <input
                      type="number"
                      value={word.endTime.toFixed(3)}
                      onChange={(e) =>
                        onWordUpdate(wordIndex, { endTime: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 px-1 py-0.5 rounded text-[9px] bg-black/50 border border-white/10 text-slate-300"
                      step="0.01"
                    />
                  </div>

                  {/* Confidence indicator */}
                  {word.confidence !== undefined && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[8px] text-slate-500">Confidence:</span>
                      <div className="flex-1 h-1 bg-black/50 rounded">
                        <div
                          className={`h-full rounded ${
                            word.confidence > 0.8
                              ? 'bg-green-500'
                              : word.confidence > 0.5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${word.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400">
                        {Math.round(word.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Syllable breakdown (if syllable precision) */}
                  {precision === 'syllable' &&
                    word.syllables &&
                    word.syllables.length > 0 &&
                    onSyllableUpdate && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="text-[8px] text-slate-500 mb-1">Syllables:</div>
                        <div className="space-y-1">
                          {word.syllables.map((syllable, syllableIndex) => (
                            <div
                              key={syllable.id || syllableIndex}
                              className="flex items-center gap-1"
                            >
                              <span className="text-[9px] text-slate-400 w-8">{syllable.text}</span>
                              <input
                                type="number"
                                value={syllable.startTime.toFixed(3)}
                                onChange={(e) =>
                                  onSyllableUpdate(wordIndex, syllableIndex, {
                                    startTime: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-12 px-1 py-0.5 rounded text-[8px] bg-black/50 border border-white/10 text-slate-300"
                                step="0.01"
                              />
                              <span className="text-[7px] text-slate-600">→</span>
                              <input
                                type="number"
                                value={syllable.endTime.toFixed(3)}
                                onChange={(e) =>
                                  onSyllableUpdate(wordIndex, syllableIndex, {
                                    endTime: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-12 px-1 py-0.5 rounded text-[8px] bg-black/50 border border-white/10 text-slate-300"
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual timeline bar */}
      <div className="h-2 bg-black/30 rounded relative mt-1">
        {words.map((word, wordIndex) => {
          const startPercent = Math.max(
            0,
            Math.min(100, ((word.startTime - lineStartTime) / lineDuration) * 100)
          );
          const widthPercent = Math.max(
            0,
            Math.min(100 - startPercent, ((word.endTime - word.startTime) / lineDuration) * 100)
          );
          return (
            <div
              key={word.id || wordIndex}
              className={`absolute h-full rounded cursor-pointer transition-all ${
                expandedWord === wordIndex
                  ? 'bg-cyan-500/60'
                  : 'bg-cyan-500/30 hover:bg-cyan-500/50'
              }`}
              style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
              onClick={() => setExpandedWord(expandedWord === wordIndex ? null : wordIndex)}
              title={word.text}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WordTimingEditor;
