import { LyricLine, TimingPrecision } from '../../../types';

export interface WaveformEditorProps {
  // Audio props - optional, will use audio store if not provided
  audioBuffer?: AudioBuffer | null;
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
  // Lyrics props - required
  lyrics: LyricLine[];
  onLyricUpdate: (index: number, updates: Partial<LyricLine>) => void;
  syncPrecision: TimingPrecision;
  selectedLyricIndex: number | null;
  onSelectLyric: (index: number | null) => void;
}

export interface WaveformCanvasProps {
  peaks: Float32Array | null;
  width: number;
  height: number;
  zoom: number;
  scrollOffset: number;
  duration: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface LyricBlockLayerProps {
  lyrics: LyricLine[];
  width: number;
  height: number;
  zoom: number;
  scrollOffset: number;
  duration: number;
  syncPrecision: TimingPrecision;
  selectedLyricIndex: number | null;
  onSelectLyric: (index: number | null) => void;
  onLyricUpdate: (index: number, updates: Partial<LyricLine>) => void;
}

export interface PlayheadLayerProps {
  currentTime: number;
  duration: number;
  width: number;
  height: number;
  zoom: number;
  scrollOffset: number;
  onSeek: (time: number) => void;
}

export interface TimeRulerProps {
  duration: number;
  width: number;
  height?: number;
  zoom: number;
  scrollOffset: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  lyricIndex: number | null;
  startX: number;
  originalStartTime: number;
  originalEndTime: number;
}
