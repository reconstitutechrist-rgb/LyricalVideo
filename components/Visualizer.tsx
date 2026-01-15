import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import {
  LyricLine,
  VisualStyle,
  GeneratedAsset,
  AspectRatio,
  VisualSettings,
  ColorPalette,
  FrequencyBand,
  EffectInstanceConfig,
  Genre,
  ExportResolution,
  WordTiming,
} from '../types';
import { EffectRegistry, EffectComposer } from '../src/effects/core';
import { EffectContext, LyricEffectContext } from '../src/effects/core/Effect';
import { BeatDetector, BeatData } from '../services/beatDetectionService';
import { Easings } from '../src/effects/utils/MathUtils';
import { useAudioStore } from '../src/stores';
import { WebGLParticleRenderer, ParticleData } from '../src/renderers';

interface VisualizerProps {
  audioUrl?: string | null;
  lyrics: LyricLine[];
  currentTime?: number;
  isPlaying?: boolean;
  style: VisualStyle;
  backgroundAsset: GeneratedAsset | null;
  onTimeUpdate: (time: number) => void;
  aspectRatio: AspectRatio;
  setAudioElement: (el: HTMLAudioElement) => void;
  setMediaStreamDestination: (dest: MediaStreamAudioDestinationNode) => void;
  settings: VisualSettings;
  // New props for interaction
  editMode: boolean;
  activeKeyframeIndex: number | null;
  selectedLyricIndex: number | null;
  onKeyframeUpdate: (lyricIndex: number, kfIndex: number, x: number, y: number) => void;
  // Effect system props
  lyricEffects?: EffectInstanceConfig[];
  backgroundEffects?: EffectInstanceConfig[];
  activeGenre?: Genre | null;
  // Export quality settings
  exportResolution?: ExportResolution;
}

// HSL to RGB helper function (extracted outside render loop for performance)
const hue2rgb = (p: number, q: number, t: number): number => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

// Particle Class - uses circular buffer for O(1) trail updates
class Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  speedX: number;
  speedY: number;
  color: string;
  history: { x: number; y: number }[];
  historyIndex: number; // Circular buffer write index
  historyLength: number; // Current valid entries count

  constructor(w: number, h: number, palette: ColorPalette) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.color = this.getColor(palette);
    this.history = [];
    this.historyIndex = 0;
    this.historyLength = 0;
  }

  getColor(palette: ColorPalette): string {
    // Original palettes
    if (palette === 'neon') return `hsla(${Math.random() * 60 + 280}, 100%, 50%, 0.6)`;
    if (palette === 'sunset') return `hsla(${Math.random() * 60 + 10}, 100%, 60%, 0.6)`;
    if (palette === 'ocean') return `hsla(${Math.random() * 50 + 180}, 80%, 60%, 0.6)`;
    if (palette === 'matrix') return `hsla(${Math.random() * 40 + 100}, 100%, 50%, 0.7)`;
    if (palette === 'fire') return `hsla(${Math.random() * 30}, 100%, 50%, 0.7)`;
    // New palettes - Pastels & Soft
    if (palette === 'pastel')
      return `hsla(${Math.random() * 360}, ${40 + Math.random() * 20}%, ${75 + Math.random() * 10}%, 0.6)`;
    if (palette === 'grayscale')
      return `hsla(0, ${Math.random() * 5}%, ${20 + Math.random() * 70}%, 0.7)`;
    if (palette === 'sepia')
      return `hsla(${25 + Math.random() * 20}, ${30 + Math.random() * 20}%, ${30 + Math.random() * 40}%, 0.7)`;
    // New palettes - Seasonal
    if (palette === 'autumn')
      return `hsla(${Math.random() * 50}, ${60 + Math.random() * 30}%, ${40 + Math.random() * 20}%, 0.7)`;
    if (palette === 'winter')
      return `hsla(${190 + Math.random() * 50}, ${30 + Math.random() * 40}%, ${60 + Math.random() * 30}%, 0.6)`;
    if (palette === 'spring') {
      const cluster = Math.random() > 0.5 ? 60 + Math.random() * 60 : 300 + Math.random() * 40;
      return `hsla(${cluster}, ${50 + Math.random() * 30}%, ${55 + Math.random() * 20}%, 0.6)`;
    }
    // New palettes - High contrast & Nature
    if (palette === 'cyberpunk') {
      const isCyan = Math.random() > 0.5;
      const hue = isCyan ? 170 + Math.random() * 30 : 300 + Math.random() * 30;
      return `hsla(${hue}, ${90 + Math.random() * 10}%, ${50 + Math.random() * 20}%, 0.8)`;
    }
    if (palette === 'nature') {
      const clusters = [80 + Math.random() * 60, 200 + Math.random() * 20, 20 + Math.random() * 20];
      const hue = clusters[Math.floor(Math.random() * 3)];
      return `hsla(${hue}, ${40 + Math.random() * 30}%, ${35 + Math.random() * 30}%, 0.6)`;
    }
    return `hsla(${Math.random() * 360}, 100%, 50%, 0.5)`;
  }

  updateColor(palette: ColorPalette, sentimentColor?: string) {
    if (sentimentColor) {
      this.color = sentimentColor;
    } else {
      this.color = this.getColor(palette);
    }
  }

  update(
    motionFreq: number,
    pulseFreq: number,
    w: number,
    h: number,
    speedMult: number,
    intensity: number,
    speedXFac: number,
    speedYFac: number,
    trailsEnabled: boolean
  ) {
    // Pulse drives size
    const boost = 1 + (pulseFreq / 255) * 2 * intensity;
    const motionBoost = 1 + motionFreq / 255;

    this.x += this.speedX * speedMult * speedXFac * motionBoost;
    this.y += this.speedY * speedMult * speedYFac * motionBoost;

    if (this.x > w) this.x = 0;
    if (this.x < 0) this.x = w;
    if (this.y > h) this.y = 0;
    if (this.y < 0) this.y = h;

    this.size = this.baseSize * boost;

    if (trailsEnabled) {
      const limit = Math.floor(5 + 15 * intensity * speedMult);

      // Circular buffer - O(1) instead of O(n) shift()
      if (this.history.length < limit) {
        this.history.push({ x: this.x, y: this.y });
        this.historyLength = this.history.length;
      } else {
        const idx = this.historyIndex % limit;
        this.history[idx] = { x: this.x, y: this.y };
        this.historyIndex++;
        this.historyLength = Math.min(this.historyLength + 1, limit);

        if (this.history.length > limit) {
          this.history.length = limit;
          this.historyIndex = 0;
          this.historyLength = limit;
        }
      }
    } else {
      this.history = [];
      this.historyIndex = 0;
      this.historyLength = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, trailsEnabled: boolean) {
    if (trailsEnabled && this.historyLength > 0) {
      ctx.beginPath();

      // Iterate circular buffer from oldest to newest
      const len = this.history.length;
      const startIdx = (this.historyIndex - this.historyLength + len) % len;

      const firstPoint = this.history[startIdx];
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < this.historyLength; i++) {
        const idx = (startIdx + i) % len;
        const point = this.history[idx];
        ctx.lineTo(point.x, point.y);
      }

      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size / 2;
      ctx.stroke();
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Easing functions imported from MathUtils

const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(
  (
    {
      audioUrl: audioUrlProp,
      lyrics,
      currentTime: currentTimeProp,
      isPlaying: isPlayingProp,
      style,
      backgroundAsset,
      onTimeUpdate,
      aspectRatio,
      setAudioElement,
      setMediaStreamDestination,
      settings,
      editMode,
      activeKeyframeIndex,
      selectedLyricIndex,
      onKeyframeUpdate,
      lyricEffects = [],
      backgroundEffects = [],
      activeGenre: _activeGenre,
      exportResolution = '1080p' as ExportResolution,
    },
    ref
  ) => {
    // Use audio store values, with props as override (for export mode)
    const audioStore = useAudioStore();
    const audioUrl = audioUrlProp ?? audioStore.audioUrl;
    const currentTime = currentTimeProp ?? audioStore.currentTime;
    const isPlaying = isPlayingProp ?? audioStore.isPlaying;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const requestRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    // Pre-allocated pool for WebGL particle data to avoid per-frame allocations
    const particleDataPoolRef = useRef<ParticleData[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const prevPaletteRef = useRef<ColorPalette>(settings.palette);
    const prevSentimentRef = useRef<string | undefined>(undefined);

    // Effect system refs
    const lyricComposerRef = useRef<EffectComposer | null>(null);
    const backgroundComposerRef = useRef<EffectComposer | null>(null);

    // Beat detection ref
    const beatDetectorRef = useRef<BeatDetector>(new BeatDetector());
    const beatDataRef = useRef<BeatData>({
      isBeat: false,
      beatIntensity: 0,
      timeSinceBeat: Infinity, // Infinity = no beat detected yet
      bpm: 120,
      beatPhase: 0,
      energy: 0,
      energyDelta: 0,
      spectralCentroid: 0,
      spectralFlux: 0,
    });

    // WebGL particle renderer for GPU-accelerated rendering
    const webglParticleRendererRef = useRef<WebGLParticleRenderer | null>(null);
    const useWebGLRef = useRef<boolean>(WebGLParticleRenderer.isSupported());

    const [isBgLoading, setIsBgLoading] = useState(false);

    // Interaction State
    const isDraggingRef = useRef(false);

    // Transition State
    const activeLineRef = useRef<LyricLine | null>(null);
    const fadingLineRef = useRef<LyricLine | null>(null);
    const fadeStartTimestampRef = useRef<number>(0);

    const analysisCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const dynamicTextColorRef = useRef<string>('#ffffff');
    const dynamicGlowRef = useRef<string>('#ff00ff');
    const frameCountRef = useRef(0);

    useImperativeHandle(ref, () => canvasRef.current!);

    const getBaseHeight = (resolution: ExportResolution): number => {
      switch (resolution) {
        case '720p':
          return 720;
        case '1080p':
          return 1080;
        case '4K':
          return 2160;
        default:
          return 1080;
      }
    };

    const getDimensions = () => {
      const [w, h] = aspectRatio.split(':').map(Number);
      const baseHeight = getBaseHeight(exportResolution);
      const calculatedWidth = Math.round((baseHeight * w) / h);
      return { width: calculatedWidth, height: baseHeight };
    };
    const { width, height } = getDimensions();

    // Handle Canvas Interaction
    const handleMouseDown = (_e: React.MouseEvent) => {
      if (!editMode || selectedLyricIndex === null || activeKeyframeIndex === null) return;
      isDraggingRef.current = true;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (
        !isDraggingRef.current ||
        !editMode ||
        selectedLyricIndex === null ||
        activeKeyframeIndex === null
      )
        return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Convert from canvas coordinates (0,0 at top-left) to logical coordinates (0,0 at center)
      const logicalX = mouseX - width / 2;
      const logicalY = mouseY - height / 2;

      onKeyframeUpdate(
        selectedLyricIndex,
        activeKeyframeIndex,
        Math.round(logicalX),
        Math.round(logicalY)
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    useEffect(() => {
      if (!analysisCtxRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        analysisCtxRef.current = canvas.getContext('2d', { willReadFrequently: true });
      }
    }, []);

    useEffect(() => {
      if (audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        // Reset beat detector for new track
        beatDetectorRef.current.reset();

        const audio = new Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;
        setAudioElement(audio);

        // Store handler reference for proper cleanup
        const handleTimeUpdate = () => {
          onTimeUpdate(audio.currentTime);
        };
        audio.addEventListener('timeupdate', handleTimeUpdate);

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;

        const source = audioCtx.createMediaElementSource(audio);
        const destination = audioCtx.createMediaStreamDestination();
        setMediaStreamDestination(destination);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        source.connect(destination);

        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        particlesRef.current = Array.from(
          { length: 150 },
          () => new Particle(width, height, settings.palette)
        );

        // Pre-allocate particle data pool for WebGL rendering (avoids per-frame allocations)
        particleDataPoolRef.current = Array.from({ length: 150 }, () => ({
          x: 0,
          y: 0,
          size: 0,
          r: 1,
          g: 1,
          b: 1,
          opacity: 0.8,
        }));

        return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.pause();
          audioCtx.close();
        };
      }
      // Intentionally only re-run when audioUrl changes. width/height/palette are used for
      // initial particle creation but shouldn't trigger audio context recreation on resize.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl]);

    // Initialize/resize WebGL particle renderer
    useEffect(() => {
      if (!useWebGLRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const scaledWidth = width * dpr;
      const scaledHeight = height * dpr;

      if (!webglParticleRendererRef.current) {
        try {
          webglParticleRendererRef.current = new WebGLParticleRenderer(
            scaledWidth,
            scaledHeight,
            200 // Max particles
          );
        } catch (e) {
          console.warn('Failed to initialize WebGL particle renderer:', e);
          useWebGLRef.current = false;
        }
      } else {
        webglParticleRendererRef.current.resize(scaledWidth, scaledHeight);
      }

      return () => {
        if (webglParticleRendererRef.current) {
          webglParticleRendererRef.current.dispose();
          webglParticleRendererRef.current = null;
        }
      };
    }, [width, height]);

    useEffect(() => {
      if (backgroundAsset?.type === 'image' && backgroundAsset.url) {
        setIsBgLoading(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          bgImageRef.current = img;
          setIsBgLoading(false);
        };
        img.onerror = () => {
          console.error('Failed to load background image');
          setIsBgLoading(false);
        };
        img.src = backgroundAsset.url;
      } else if (backgroundAsset?.type === 'video' && backgroundAsset.url) {
        setIsBgLoading(true);
        bgImageRef.current = null;
      } else {
        bgImageRef.current = null;
        setIsBgLoading(false);
      }
    }, [backgroundAsset]);

    useEffect(() => {
      if (audioRef.current) {
        if (isPlaying) {
          if (analyserRef.current?.context.state === 'suspended') {
            (analyserRef.current.context as AudioContext).resume();
          }
          audioRef.current.play();
          if (videoRef.current) videoRef.current.play();
        } else {
          audioRef.current.pause();
          if (videoRef.current) videoRef.current.pause();
        }
      }
    }, [isPlaying]);

    // Sync effect composers with effect configs
    useEffect(() => {
      // Initialize or update lyric effects composer
      if (lyricEffects.length > 0) {
        if (!lyricComposerRef.current) {
          lyricComposerRef.current = new EffectComposer();
        }
        // Clear and re-add effects based on config
        lyricComposerRef.current.clear();
        lyricEffects.forEach((config) => {
          if (config.enabled) {
            const effect = EffectRegistry.createLyricEffect(config.effectId);
            if (effect) {
              // Apply parameters
              Object.entries(config.parameters).forEach(([key, value]) => {
                effect.setParameter(key, value as string | number | boolean);
              });
              lyricComposerRef.current?.addEffect(effect);
            }
          }
        });
      } else {
        lyricComposerRef.current?.clear();
      }
    }, [lyricEffects]);

    useEffect(() => {
      // Initialize or update background effects composer
      if (backgroundEffects.length > 0) {
        if (!backgroundComposerRef.current) {
          backgroundComposerRef.current = new EffectComposer();
        }
        // Clear and re-add effects based on config
        backgroundComposerRef.current.clear();
        backgroundEffects.forEach((config) => {
          if (config.enabled) {
            const effect = EffectRegistry.createBackgroundEffect(config.effectId);
            if (effect) {
              // Apply parameters
              Object.entries(config.parameters).forEach(([key, value]) => {
                effect.setParameter(key, value as string | number | boolean);
              });
              backgroundComposerRef.current?.addEffect(effect);
            }
          }
        });
      } else {
        backgroundComposerRef.current?.clear();
      }
    }, [backgroundEffects]);

    // Karaoke-style word highlighting renderer
    const renderKaraokeText = (
      ctx: CanvasRenderingContext2D,
      line: LyricLine,
      time: number,
      textColor: string,
      highlightColor: string,
      _fontSize: number // Prefixed with _ to indicate intentionally unused
    ) => {
      if (!line.words || line.words.length === 0) {
        ctx.fillStyle = textColor;
        ctx.fillText(line.text, 0, 0);
        return;
      }

      // Build full text with spaces for width calculation
      const wordsWithSpaces = line.words.map((w, i) =>
        i < line.words!.length - 1 ? w.text + ' ' : w.text
      );
      const fullText = wordsWithSpaces.join('');
      const totalWidth = ctx.measureText(fullText).width;

      // Start position (centered)
      let xPos = -totalWidth / 2;

      // Define colors for different states
      const pastColor = highlightColor; // Already sung words
      const activeColor = '#00ffff'; // Currently singing word (cyan glow)
      const futureColor = textColor; // Not yet sung

      // Save text alignment since we'll draw left-aligned
      ctx.save();
      ctx.textAlign = 'left';

      line.words.forEach((word: WordTiming, idx: number) => {
        const isActive = time >= word.startTime && time < word.endTime;
        const isPast = time >= word.endTime;
        const wordText = idx < line.words!.length - 1 ? word.text + ' ' : word.text;
        const wordWidth = ctx.measureText(wordText).width;

        // Set fill style based on state
        if (isPast) {
          ctx.fillStyle = pastColor;
          ctx.shadowColor = pastColor;
          ctx.shadowBlur = 8;
          ctx.fillText(wordText, xPos, 0);
        } else if (isActive) {
          // Calculate progress through the word for gradient effect
          const wordDuration = word.endTime - word.startTime;
          const wordProgress =
            wordDuration > 0 ? Math.min(1, (time - word.startTime) / wordDuration) : 0;

          // Active word gets a pulsing glow effect
          ctx.fillStyle = activeColor;
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 15 + Math.sin(time * 10) * 5; // Pulsing glow

          // Scale active word slightly from its center
          ctx.save();
          const scale = 1 + wordProgress * 0.08;
          const wordCenterX = xPos + wordWidth / 2;
          ctx.translate(wordCenterX, 0);
          ctx.scale(scale, scale);
          ctx.translate(-wordCenterX, 0);
          ctx.fillText(wordText, xPos, 0);
          ctx.restore();
        } else {
          ctx.fillStyle = futureColor;
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillText(wordText, xPos, 0);
        }

        // Move to next word position
        xPos += wordWidth;
      });

      // Restore original state
      ctx.restore();
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      frameCountRef.current += 1;

      const targetLine = lyrics.find((l) => currentTime >= l.startTime && currentTime <= l.endTime);

      const effectiveStyle = targetLine?.styleOverride || style;
      const effectivePalette = targetLine?.paletteOverride || settings.palette;
      const sentimentColor = targetLine?.sentimentColor;

      if (
        prevPaletteRef.current !== effectivePalette ||
        prevSentimentRef.current !== sentimentColor
      ) {
        particlesRef.current.forEach((p) => p.updateColor(effectivePalette, sentimentColor));
        prevPaletteRef.current = effectivePalette;
        prevSentimentRef.current = sentimentColor;
      }

      let averageFreq = 0,
        bassFreq = 0,
        midFreq = 0,
        trebleFreq = 0;

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const len = dataArrayRef.current.length;
        const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
        averageFreq = sum / len;

        const bassSlice = dataArrayRef.current.slice(0, 10);
        bassFreq = bassSlice.reduce((a, b) => a + b, 0) / bassSlice.length;

        const midSlice = dataArrayRef.current.slice(10, 100);
        midFreq = midSlice.reduce((a, b) => a + b, 0) / midSlice.length;

        const trebleSlice = dataArrayRef.current.slice(100, 255);
        trebleFreq = trebleSlice.reduce((a, b) => a + b, 0) / trebleSlice.length;

        // Beat detection analysis
        const audioTime = audioRef.current?.currentTime || 0;
        beatDataRef.current = beatDetectorRef.current.analyze(dataArrayRef.current, audioTime);
      }

      const getFreqValue = (band: FrequencyBand): number => {
        switch (band) {
          case 'bass':
            return bassFreq;
          case 'mid':
            return midFreq;
          case 'treble':
            return trebleFreq;
          case 'beat':
            // Return 255 on beat, decay exponentially
            // Handle Infinity (no beat detected yet) by returning 0
            if (beatDataRef.current.isBeat) return 255;
            if (!isFinite(beatDataRef.current.timeSinceBeat)) return 0;
            return Math.max(0, 255 * Math.exp(-beatDataRef.current.timeSinceBeat * 8));
          case 'energy':
            return beatDataRef.current.energy * 255;
          case 'avg':
          default:
            return averageFreq;
        }
      };

      const pulseFreqValue = getFreqValue(settings.frequencyMapping.pulse);
      const motionFreqValue = getFreqValue(settings.frequencyMapping.motion);
      const colorFreqValue = getFreqValue(settings.frequencyMapping.color);

      const pulse = 1 + (pulseFreqValue / 255) * 0.5 * settings.intensity;
      const time = Date.now() * 0.002 * settings.particleSpeed;

      // 2. Camera Shake Physics
      let shakeX = 0;
      let shakeY = 0;
      if (settings.cameraShake) {
        const threshold = 160;
        if (bassFreq > threshold) {
          const shakeIntensity = Math.pow((bassFreq - threshold) / (255 - threshold), 2);
          const power = shakeIntensity * 15 * settings.cameraShakeIntensity;
          shakeX = (Math.random() - 0.5) * power;
          shakeY = (Math.random() - 0.5) * power;
        }
      }

      if (
        effectiveStyle === VisualStyle.CINEMATIC_BACKDROP &&
        frameCountRef.current % 30 === 0 &&
        analysisCtxRef.current
      ) {
        const source = backgroundAsset?.type === 'video' ? videoRef.current : bgImageRef.current;
        if (source) {
          try {
            analysisCtxRef.current.drawImage(source, 0, 0, 1, 1);
            const [r, g, b] = analysisCtxRef.current.getImageData(0, 0, 1, 1).data;
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance > 140) {
              dynamicTextColorRef.current = `rgba(10, 10, 10, 0.9)`;
              dynamicGlowRef.current = `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.4)`;
            } else {
              dynamicTextColorRef.current = `rgba(255, 255, 255, 0.95)`;
              dynamicGlowRef.current = `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
          } catch {
            // Ignore color parsing errors
          }
        }
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.save(); // START GLOBAL CAMERA SHAKE
      ctx.translate(shakeX, shakeY);

      if (backgroundAsset) {
        const baseOpacity = effectiveStyle === VisualStyle.CINEMATIC_BACKDROP ? 0.6 : 0.25;
        let opacity = baseOpacity;

        // --- BASS PULSATING LOGIC ---
        // Scale and opacity are modulated by bass frequency specifically
        const bassActivity = bassFreq / 255;

        if (settings.dynamicBackgroundOpacity) {
          // Strong pulsation
          opacity = baseOpacity + (1.0 - baseOpacity) * bassActivity * settings.intensity;
        } else {
          // Subtle, constant pulsating "breathing" effect synced to bass
          opacity = baseOpacity + 0.1 * bassActivity * settings.intensity;
        }

        if (opacity > 1.0) opacity = 1.0;
        if (opacity < 0.1) opacity = 0.1;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = settings.backgroundBlendMode;

        const baseZoom = 1.05;
        // Bass-driven zoom
        const bassZoom = bassActivity * 0.08 * settings.intensity;
        const totalZoom = baseZoom + bassZoom;

        // Standard slow drift
        const safePanX = (width * (baseZoom - 1)) / 2;
        const safePanY = (height * (baseZoom - 1)) / 2;
        const panX = Math.sin(time * 0.5) * safePanX;
        const panY = Math.cos(time * 0.3) * safePanY;

        ctx.translate(width / 2 + panX, height / 2 + panY);
        ctx.scale(totalZoom, totalZoom);

        const drawX = -width / 2;
        const drawY = -height / 2;

        if (backgroundAsset.type === 'video' && videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            ctx.drawImage(videoRef.current, drawX, drawY, width, height);
          }
        } else if (backgroundAsset.type === 'image' && bgImageRef.current) {
          ctx.drawImage(bgImageRef.current, drawX, drawY, width, height);
        }
        ctx.restore();

        const overlayOpacity = effectiveStyle === VisualStyle.CINEMATIC_BACKDROP ? 0.3 : 0.5;
        ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (effectiveStyle === VisualStyle.NEON_PULSE) {
        // Update particle physics
        particlesRef.current.forEach((p) => {
          p.update(
            motionFreqValue,
            pulseFreqValue,
            width,
            height,
            settings.particleSpeed,
            settings.intensity,
            settings.speedX,
            settings.speedY,
            settings.trailsEnabled
          );
        });

        // Render particles - use WebGL if available, fall back to Canvas 2D
        if (useWebGLRef.current && webglParticleRendererRef.current && !settings.trailsEnabled) {
          // WebGL rendering (faster for many particles, but doesn't support trails yet)
          // Use pre-allocated pool to avoid per-frame allocations
          const pool = particleDataPoolRef.current;
          const particles = particlesRef.current;
          const count = Math.min(particles.length, pool.length);

          for (let i = 0; i < count; i++) {
            const p = particles[i];
            const data = pool[i];

            // Update pooled object in-place (no allocation)
            data.x = p.x;
            data.y = p.y;
            data.size = p.size;
            data.opacity = 0.8;

            // Parse HSL color to RGB
            const hslMatch = p.color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
            if (hslMatch) {
              const h = parseInt(hslMatch[1]) / 360;
              const s = parseInt(hslMatch[2]) / 100;
              const l = parseInt(hslMatch[3]) / 100;
              const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              const pp = 2 * l - q;
              data.r = hue2rgb(pp, q, h + 1 / 3);
              data.g = hue2rgb(pp, q, h);
              data.b = hue2rgb(pp, q, h - 1 / 3);
            } else {
              data.r = 1;
              data.g = 1;
              data.b = 1;
            }
          }

          webglParticleRendererRef.current.updateParticles(pool, count);
          const particleCanvas = webglParticleRendererRef.current.render();
          ctx.drawImage(particleCanvas, 0, 0, width, height);
        } else {
          // Canvas 2D fallback (supports trails)
          particlesRef.current.forEach((p) => {
            p.draw(ctx, settings.trailsEnabled);
          });
        }

        // Draw central orb (always Canvas 2D - single draw call)
        let orbColor = '#00ffff';
        if (sentimentColor) orbColor = sentimentColor;
        else if (effectivePalette === 'sunset') orbColor = '#ffaa00';
        else if (effectivePalette === 'fire') orbColor = '#ff4400';
        else if (effectivePalette === 'matrix') orbColor = '#00ff00';

        ctx.shadowBlur = (20 + colorFreqValue * 0.5) * settings.intensity;
        ctx.shadowColor = orbColor;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, (Math.min(width, height) / 4) * pulse, 0, 2 * Math.PI);
        ctx.strokeStyle = orbColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (effectiveStyle === VisualStyle.LIQUID_DREAM) {
        // Optimized LIQUID_DREAM: Use LOD and batch drawing
        ctx.lineWidth = 2 * settings.intensity;

        // LOD: Use larger step size for wider canvases to reduce draw calls
        const step = width > 1920 ? 20 : width > 1280 ? 15 : 10;
        const waveMotion = motionFreqValue / 255;

        // Pre-compute time-based values once per frame
        const timeOffset = time * 10 + 200;
        const timeWaveOffset = time * (1 + waveMotion);

        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.strokeStyle = sentimentColor
            ? sentimentColor
            : `hsla(${i * 40 + timeOffset}, 70%, 60%, 0.5)`;

          // Pre-compute wave-specific offsets
          const wavePhase = time + i;
          const amplitude1 = 50 * pulse;
          const amplitude2 = 20;

          // First point - use moveTo
          const y0 =
            height / 2 + Math.sin(wavePhase) * amplitude1 + Math.sin(-timeWaveOffset) * amplitude2;
          ctx.moveTo(0, y0);

          // Batch all line segments
          for (let x = step; x <= width; x += step) {
            const y =
              height / 2 +
              Math.sin(x * 0.01 + wavePhase) * amplitude1 +
              Math.sin(x * 0.02 - timeWaveOffset) * amplitude2;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (effectiveStyle === VisualStyle.GLITCH_CYBER) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * settings.intensity})`;
        for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 2);
        if (
          Math.random() < settings.glitchFrequency * 0.4 ||
          motionFreqValue > 200 - settings.glitchFrequency * 100
        ) {
          const numGlitches = Math.floor(Math.random() * 5 * settings.intensity) + 1;
          for (let k = 0; k < numGlitches; k++) {
            const hSlice = Math.random() * height;
            const hSize = Math.random() * 50 * settings.intensity;
            ctx.fillStyle = sentimentColor || 'rgba(0, 255, 0, 0.5)';
            ctx.fillRect(0, hSlice, width, hSize);
          }
        }
      } else if (effectiveStyle === VisualStyle.KALEIDOSCOPE) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(time * 0.1);

        const segments = 8;
        const angleStep = (Math.PI * 2) / segments;

        for (let i = 0; i < segments; i++) {
          ctx.save();
          ctx.rotate(i * angleStep);

          const drawSlice = () => {
            ctx.beginPath();
            const dataLen = 20;
            let prevX = 0;
            let prevY = 0;
            for (let j = 0; j < dataLen; j++) {
              const index = j * 3;
              const val = dataArrayRef.current ? dataArrayRef.current[index] : 0;
              const intensityMult = pulseFreqValue / 255 + 0.5;
              const normalized = (val / 255) * settings.intensity * intensityMult;
              const dist = j * (Math.min(width, height) / 2 / dataLen) * 0.8 + 20;
              const x = dist;
              const y = normalized * 40 * Math.sin(time * 2 + j);

              let strokeStyle = '';
              let fillStyle = '';

              if (sentimentColor) {
                strokeStyle = sentimentColor;
                fillStyle = sentimentColor;
              } else {
                let hue = (time * 10 + j * 10) % 360;
                if (effectivePalette === 'neon') hue = 280 + j * 5 + val / 2;
                else if (effectivePalette === 'sunset') hue = 10 + j * 5;
                else if (effectivePalette === 'ocean') hue = 180 + j * 5;
                else if (effectivePalette === 'matrix') hue = 100 + val;
                else if (effectivePalette === 'fire') hue = j * 3;
                strokeStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
                fillStyle = `hsla(${hue}, 80%, 60%, 0.4)`;
              }

              ctx.strokeStyle = strokeStyle;
              ctx.fillStyle = fillStyle;
              ctx.lineWidth = 2;
              if (j > 0) {
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();
              }
              ctx.beginPath();
              ctx.arc(x, y, 2 + normalized * 10, 0, Math.PI * 2);
              ctx.fill();
              prevX = x;
              prevY = y;
            }
          };

          drawSlice();
          ctx.scale(1, -1);
          drawSlice();
          ctx.restore();
        }
        ctx.restore();
      } else if (effectiveStyle === VisualStyle.CHROMATIC_WAVE) {
        // Chromatic Wave Style
        // Fluid, overlapping waves shifting colors
        const layers = 5;

        for (let i = 0; i < layers; i++) {
          ctx.beginPath();

          // Determine color based on palette and frequency
          let hue = 0;
          const freqMod = (colorFreqValue / 255) * 50; // Modulate hue by treble

          if (effectivePalette === 'neon') hue = 280 + i * 15 + freqMod;
          else if (effectivePalette === 'sunset')
            hue = 340 + i * 20 + freqMod; // Pink/Red/Orange
          else if (effectivePalette === 'ocean') hue = 190 + i * 10 + freqMod;
          else if (effectivePalette === 'matrix') hue = 100 + i * 5 + freqMod;
          else if (effectivePalette === 'fire') hue = 0 + i * 10 + freqMod;
          else hue = (time * 20 + i * 30) % 360;

          const saturation = 70 + (pulseFreqValue / 255) * 30;
          const lightness = 50 + i * 5;
          const alpha = (0.4 / (i + 1)) * settings.intensity;

          ctx.fillStyle =
            sentimentColor && i === 0
              ? sentimentColor
              : `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, ${alpha + 0.2})`;
          ctx.lineWidth = 2;

          // Wave parameters
          const waveSpeed = time * (0.5 + i * 0.1) * (motionFreqValue / 255 + 0.5);
          const amplitude = (height / 6) * settings.intensity * (bassFreq / 100 + 0.5);
          const frequency = 0.005 + i * 0.002;
          const verticalShift = height / 2 + i * 20 - layers * 10;

          ctx.moveTo(0, height);

          // Draw sine wave
          for (let x = 0; x <= width; x += 15) {
            // Main wave component
            const y1 = Math.sin(x * frequency + waveSpeed) * amplitude;
            // Secondary component for complexity
            const y2 = Math.cos(x * frequency * 2.3 - waveSpeed * 0.8) * (amplitude * 0.5);

            // Add some noise from audio data directly
            const audioIdx = Math.floor((x / width) * 50) + i * 10;
            const audioNoise =
              (dataArrayRef.current?.[audioIdx % 128] || 0) * 0.2 * settings.intensity;

            ctx.lineTo(x, verticalShift + y1 + y2 - audioNoise);
          }

          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();
          ctx.stroke();
        }
      } else if (effectiveStyle === VisualStyle.AURORA_BOREALIS) {
        // Aurora Borealis Style
        // Flowing vertical curtains of light that shift and shimmer
        const curtainCount = 5;
        const waveOffset = currentTime * 0.3;

        for (let c = 0; c < curtainCount; c++) {
          const hue = (120 + c * 40 + Math.sin(currentTime * 0.2 + c) * 30) % 360;
          const saturation = 70 + (bassFreq / 255) * 20;
          const lightness = 40 + (trebleFreq / 255) * 20;

          ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.15 * settings.intensity})`;

          ctx.beginPath();
          ctx.moveTo(0, 0);

          for (let y = 0; y <= height; y += 10) {
            const noise1 = Math.sin(y * 0.01 + waveOffset + c * 0.5) * 100;
            const noise2 = Math.cos(y * 0.02 - waveOffset * 0.7 + c) * 50;
            const audioOffset = (midFreq / 255) * 30 * Math.sin(y * 0.015 + c);
            const x = width * (0.15 + c * 0.15) + noise1 + noise2 + audioOffset;

            ctx.lineTo(x, y);
          }

          ctx.lineTo(width * (0.25 + c * 0.15), height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (effectiveStyle === VisualStyle.WATER_RIPPLE) {
        // Water Ripple Style
        // Concentric ripples emanating from center
        const rippleCount = 8;
        const rippleSpeed = currentTime * 2;
        const bassPulse = 1 + (bassFreq / 255) * 0.5;

        ctx.fillStyle = '#001830';
        ctx.fillRect(0, 0, width, height);

        for (let r = rippleCount; r >= 0; r--) {
          const baseRadius = (r / rippleCount) * Math.max(width, height) * 0.8;
          const animatedRadius =
            baseRadius + ((rippleSpeed * 50) % (Math.max(width, height) * 0.8));
          const alpha = 0.15 * (1 - r / rippleCount) * settings.intensity;

          ctx.strokeStyle = `hsla(${200 + r * 10}, 80%, ${50 + (trebleFreq / 255) * 20}%, ${alpha})`;
          ctx.lineWidth = 2 + (bassFreq / 255) * 3;

          ctx.beginPath();
          ctx.arc(width / 2, height / 2, animatedRadius * bassPulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Caustic light patterns
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2 + currentTime * 0.5;
          const dist = 100 + Math.sin(currentTime + i) * 50;
          const x = width / 2 + Math.cos(angle) * dist;
          const y = height / 2 + Math.sin(angle) * dist * 0.5;

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
          gradient.addColorStop(0, `rgba(100, 200, 255, ${0.1 * settings.intensity})`);
          gradient.addColorStop(1, 'transparent');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (effectiveStyle === VisualStyle.FIRE_EMBERS) {
        // Fire Embers Style
        // Rising ember particles with heat distortion
        const emberCount = 50;
        const flameHeight = height * 0.6;

        // Dark gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1a0a00');
        bgGrad.addColorStop(0.5, '#2a0a00');
        bgGrad.addColorStop(1, '#4a1a00');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw flames at bottom
        for (let f = 0; f < 20; f++) {
          const flameX = (f / 20) * width;
          const _flameY = height;
          const waveOffset = Math.sin(currentTime * 3 + f) * 20;
          const flameH = flameHeight * (0.5 + (bassFreq / 255) * 0.5 + Math.random() * 0.3);

          const flameGrad = ctx.createLinearGradient(flameX, height, flameX, height - flameH);
          flameGrad.addColorStop(0, `rgba(255, 100, 0, ${0.9 * settings.intensity})`);
          flameGrad.addColorStop(0.3, `rgba(255, 50, 0, ${0.6 * settings.intensity})`);
          flameGrad.addColorStop(0.6, `rgba(200, 0, 0, ${0.3 * settings.intensity})`);
          flameGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(flameX - 30, height);
          ctx.quadraticCurveTo(flameX + waveOffset, height - flameH * 0.6, flameX, height - flameH);
          ctx.quadraticCurveTo(flameX - waveOffset, height - flameH * 0.6, flameX + 30, height);
          ctx.fill();
        }

        // Draw embers
        for (let e = 0; e < emberCount; e++) {
          const seed = e * 1.618;
          const emberX = ((seed * 234.5) % 1) * width;
          const emberY = height - ((currentTime * 100 + seed * 200) % height);
          const emberSize = 2 + Math.sin(currentTime + e) * 1.5;
          const hue = 30 - (emberY / height) * 30;

          ctx.fillStyle = `hsla(${hue}, 100%, ${50 + (emberY / height) * 20}%, ${0.8 * settings.intensity})`;
          ctx.beginPath();
          ctx.arc(emberX + Math.sin(currentTime * 2 + e) * 10, emberY, emberSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (effectiveStyle === VisualStyle.VHS_RETRO) {
        // VHS Retro Style
        // 80s VHS aesthetic with tracking lines and chromatic aberration
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Chromatic aberration offset
        const _aberrationOffset = 3 + (bassFreq / 255) * 5;

        // Scanlines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1);
        }

        // Tracking distortion bands
        const trackingNoise = settings.intensity * 0.5;
        for (let i = 0; i < 3; i++) {
          const bandY = ((currentTime * 50 + i * 100) % (height + 50)) - 25;
          const bandHeight = 10 + Math.random() * 20;

          ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * trackingNoise})`;
          ctx.fillRect(0, bandY, width, bandHeight);
        }

        // Static noise
        const staticIntensity = 0.1 + (trebleFreq / 255) * 0.2;
        for (let i = 0; i < 100 * staticIntensity; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 3;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
          ctx.fillRect(x, y, size, size);
        }

        // Color bleed effect
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${0.05 * settings.intensity})`);
        gradient.addColorStop(0.5, 'transparent');
        gradient.addColorStop(1, `rgba(0, 255, 255, ${0.05 * settings.intensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (effectiveStyle === VisualStyle.FILM_NOIR) {
        // Film Noir Style
        // Classic black and white with deep vignette and grain
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Dramatic lighting from above
        const spotlight = ctx.createRadialGradient(
          width / 2,
          -height * 0.2,
          0,
          width / 2,
          height * 0.5,
          height
        );
        spotlight.addColorStop(0, `rgba(255, 255, 255, ${0.15 * settings.intensity})`);
        spotlight.addColorStop(0.5, `rgba(128, 128, 128, ${0.05 * settings.intensity})`);
        spotlight.addColorStop(1, 'transparent');
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, width, height);

        // Film grain
        for (let i = 0; i < 500; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const brightness = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${0.05 * settings.intensity})`;
          ctx.fillRect(x, y, 1, 1);
        }

        // Deep vignette
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.2,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Occasional flicker
        if (Math.random() < 0.02 * settings.intensity) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else if (effectiveStyle === VisualStyle.FRACTAL_ZOOM) {
        // Fractal Zoom Style
        // Simplified fractal-like pattern with zoom animation
        const zoomSpeed = currentTime * 0.3;
        const zoom = 1 + (zoomSpeed % 1) * 2;
        const colorCycles = 5;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Draw fractal-inspired concentric patterns
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height);

        for (let ring = 30; ring >= 0; ring--) {
          const radius = (ring / 30) * maxRadius * zoom;
          const hue = (ring * colorCycles * 12 + currentTime * 50) % 360;
          const saturation = 80 + (bassFreq / 255) * 20;
          const lightness = 30 + (ring / 30) * 30;

          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.3 * settings.intensity})`;
          ctx.lineWidth = 2;

          ctx.beginPath();
          // Draw spiraling pattern
          for (let a = 0; a < Math.PI * 8; a += 0.1) {
            const r = radius * (a / (Math.PI * 8));
            const x = centerX + Math.cos(a + zoomSpeed) * r;
            const y = centerY + Math.sin(a + zoomSpeed) * r;

            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (effectiveStyle === VisualStyle.PARTICLE_NEBULA) {
        // Particle Nebula Style
        // Dense starfield with nebula gas clouds
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);

        // Draw nebula clouds
        const cloudCount = 4;
        const hues = [280, 200, 320, 240];

        for (let c = 0; c < cloudCount; c++) {
          const cloudX = width * (0.2 + c * 0.2) + Math.sin(currentTime * 0.2 + c) * 50;
          const cloudY = height * (0.3 + Math.sin(c) * 0.2) + Math.cos(currentTime * 0.15 + c) * 30;
          const cloudRadius = 200 + (bassFreq / 255) * 100;

          const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudRadius);
          gradient.addColorStop(0, `hsla(${hues[c]}, 70%, 40%, ${0.2 * settings.intensity})`);
          gradient.addColorStop(0.5, `hsla(${hues[c]}, 60%, 30%, ${0.1 * settings.intensity})`);
          gradient.addColorStop(1, 'transparent');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, cloudRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw stars with parallax (3 layers)
        for (let layer = 0; layer < 3; layer++) {
          const starCount = 100 + layer * 50;
          const layerSpeed = (layer + 1) * 0.1;
          const drift = currentTime * layerSpeed * 20;

          for (let s = 0; s < starCount; s++) {
            const seed = s * 1.618 + layer * 100;
            const baseX = ((seed * 123.456) % 1) * width;
            const baseY = ((seed * 789.012) % 1) * height;
            const x = (baseX - drift + width * 10) % width;
            const y = baseY;
            const size = (3 - layer) * 0.5 + Math.sin(currentTime * 3 + s) * 0.3;
            const brightness = 0.3 + (2 - layer) * 0.2 + Math.sin(currentTime * 2 + s * 0.1) * 0.2;

            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * settings.intensity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (effectiveStyle === VisualStyle.GEOMETRIC_MORPH) {
        // Geometric Morph Style
        // Abstract geometric shapes that morph and tessellate
        const gridSize = 8;
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;
        const morphPhase = currentTime * 0.5;

        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, width, height);

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;
            const distFromCenter = Math.sqrt(
              Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
            );
            const normalizedDist = distFromCenter / (Math.max(width, height) / 2);

            const hue = ((row + col) * 30 + currentTime * 20) % 360;
            const pulse = 0.5 + (bassFreq / 255) * 0.5;
            const size = (cellWidth * 0.4 + Math.sin(morphPhase + row + col) * 10) * pulse;
            const rotation = morphPhase + normalizedDist * 2;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Morph between shapes based on time
            const shapePhase = (morphPhase + row * 0.1 + col * 0.1) % 3;
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${0.4 * settings.intensity})`;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.6 * settings.intensity})`;
            ctx.lineWidth = 2;

            ctx.beginPath();
            if (shapePhase < 1) {
              // Triangle
              const points = 3;
              for (let p = 0; p < points; p++) {
                const angle = (p / points) * Math.PI * 2 - Math.PI / 2;
                const px = Math.cos(angle) * size;
                const py = Math.sin(angle) * size;
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
            } else if (shapePhase < 2) {
              // Hexagon
              const points = 6;
              for (let p = 0; p < points; p++) {
                const angle = (p / points) * Math.PI * 2;
                const px = Math.cos(angle) * size;
                const py = Math.sin(angle) * size;
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
            } else {
              // Square
              ctx.rect(-size, -size, size * 2, size * 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
          }
        }
      }

      // Render background effects from the effects system
      if (backgroundComposerRef.current && backgroundEffects.length > 0) {
        const bgContext: EffectContext = {
          ctx,
          width,
          height,
          currentTime,
          deltaTime: 0.016,
          audioData: {
            bass: bassFreq,
            mid: midFreq,
            treble: trebleFreq,
            average: averageFreq,
            raw: dataArrayRef.current || new Uint8Array(128),
            // Beat detection data
            ...beatDataRef.current,
          },
          settings,
          palette: effectivePalette,
        };
        backgroundComposerRef.current.renderBackground(bgContext);
      }

      // NOTE: Removed restore() here to keep shake context for lyrics

      // Transition Logic
      const activeId = activeLineRef.current?.id;
      const targetId = targetLine?.id;

      if (activeId !== targetId) {
        if (activeLineRef.current) {
          fadingLineRef.current = activeLineRef.current;
          fadeStartTimestampRef.current = performance.now();
        }
        activeLineRef.current = targetLine || null;
      } else if (targetId && activeLineRef.current !== targetLine) {
        activeLineRef.current = targetLine || null;
      }

      const fadeDurationMs = settings.textRevealDuration * 1000;
      const timeSinceFade = performance.now() - fadeStartTimestampRef.current;
      if (fadingLineRef.current && timeSinceFade >= fadeDurationMs) fadingLineRef.current = null;

      const renderLyric = (line: LyricLine, opacityFactor: number, isEditingThisLine: boolean) => {
        if (opacityFactor <= 0) return;
        const styleForLine = line.styleOverride || style;
        const paletteForLine = line.paletteOverride || settings.palette;

        ctx.save();
        ctx.globalAlpha = opacityFactor;
        ctx.translate(width / 2, height / 2);

        // --- KEYFRAME INTERPOLATION ---
        if (line.keyframes && line.keyframes.length > 0) {
          const sortedKfs = [...line.keyframes].sort((a, b) => a.time - b.time);
          const lineDuration = line.endTime - line.startTime;
          const elapsed = currentTime - line.startTime;
          let progress = 0;
          if (lineDuration > 0) progress = Math.max(0, Math.min(1, elapsed / lineDuration));

          let k1 = sortedKfs[0];
          let k2 = sortedKfs[sortedKfs.length - 1];
          let segmentProgress = 0;

          if (progress <= k1.time) {
            k1 = sortedKfs[0];
            k2 = sortedKfs[0];
            segmentProgress = 0;
          } else if (progress >= k2.time) {
            k1 = sortedKfs[sortedKfs.length - 1];
            k2 = sortedKfs[sortedKfs.length - 1];
            segmentProgress = 1;
          } else {
            for (let i = 0; i < sortedKfs.length - 1; i++) {
              if (progress >= sortedKfs[i].time && progress <= sortedKfs[i + 1].time) {
                k1 = sortedKfs[i];
                k2 = sortedKfs[i + 1];
                break;
              }
            }
            const segmentDuration = k2.time - k1.time;
            segmentProgress = segmentDuration === 0 ? 0 : (progress - k1.time) / segmentDuration;
          }

          // Apply Easing
          const easingFunc = Easings[k1.easing || 'linear'];
          const t = easingFunc(segmentProgress);

          const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
          const currX = lerp(k1.x, k2.x, t);
          const currY = lerp(k1.y, k2.y, t);
          const currScale = lerp(k1.scale, k2.scale, t);
          const currRot = lerp(k1.rotation, k2.rotation, t);
          const currOp = lerp(k1.opacity, k2.opacity, t);

          ctx.translate(currX, currY);
          ctx.scale(currScale, currScale);
          ctx.rotate((currRot * Math.PI) / 180);
          ctx.globalAlpha *= currOp;
        }

        const textScale = styleForLine === VisualStyle.MINIMAL_TYPE ? 1 : Math.max(1, pulse * 1.05);

        if (settings.textAnimation === 'BOUNCE') {
          const bounceMetric = pulseFreqValue / 255; // 0 to 1
          // Use a slightly more exponential curve for snappiness
          const bounce = 1 + bounceMetric * bounceMetric * 1.5 * settings.intensity;
          ctx.scale(bounce, bounce);
        } else if (settings.textAnimation !== 'KINETIC') {
          ctx.scale(textScale, textScale);
        }

        const fontSize = height / 14;
        ctx.font = `900 ${fontSize}px "${settings.fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textColor = '#ffffff';
        let glowColor = line.sentimentColor || '#ff00ff';
        if (!line.sentimentColor) {
          if (paletteForLine === 'ocean') glowColor = '#00ffff';
          if (paletteForLine === 'sunset') glowColor = '#ff5500';
          if (paletteForLine === 'matrix') glowColor = '#00ff00';
          if (paletteForLine === 'fire') glowColor = '#ff4400';
        }

        // Draw Text Box for Edit Mode
        if (editMode && isEditingThisLine && activeKeyframeIndex !== null) {
          const metrics = ctx.measureText(line.text);
          const w = metrics.width;
          const h = fontSize;
          ctx.save();
          ctx.strokeStyle = '#06b6d4'; // Cyan
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(-w / 2 - 10, -h / 2 - 5, w + 20, h + 10);

          // Draw handle circle at center
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.fillText('DRAG TO MOVE', 0, -h / 2 - 15);
          ctx.restore();
        }

        // Check if we have lyric effects to apply
        const hasLyricEffects = lyricComposerRef.current && lyricEffects.length > 0;

        if (hasLyricEffects) {
          // Calculate progress through the lyric
          const lineDuration = line.endTime - line.startTime;
          const elapsed = currentTime - line.startTime;
          const lyricProgress =
            lineDuration > 0 ? Math.max(0, Math.min(1, elapsed / lineDuration)) : 0;

          // Create lyric effect context
          const lyricContext: LyricEffectContext = {
            ctx,
            width,
            height,
            currentTime,
            deltaTime: 0.016, // ~60fps
            audioData: {
              bass: bassFreq,
              mid: midFreq,
              treble: trebleFreq,
              average: averageFreq,
              raw: dataArrayRef.current || new Uint8Array(128),
              // Beat detection data
              ...beatDataRef.current,
            },
            settings,
            palette: paletteForLine,
            lyric: line,
            progress: lyricProgress,
            text: line.text,
            x: 0, // Centered
            y: 0, // Centered
            fontSize,
            fontFamily: settings.fontFamily,
            color: textColor,
          };

          // Render using lyric effect composer
          lyricComposerRef.current!.renderLyric(lyricContext);
        } else {
          // Standard Text Rendering (fallback when no effects)
          ctx.shadowColor = glowColor;
          ctx.shadowBlur =
            styleForLine === VisualStyle.CINEMATIC_BACKDROP
              ? 20 * settings.intensity
              : 15 * settings.intensity;

          // Check if we have word-level timing for karaoke mode
          if (line.words && line.words.length > 0) {
            // Karaoke-style word-by-word highlighting
            renderKaraokeText(ctx, line, currentTime, textColor, glowColor, fontSize);
          } else {
            // Simple single-line rendering
            ctx.fillStyle = textColor;
            ctx.fillText(line.text, 0, 0);
          }
        }

        ctx.restore();
      };

      if (fadingLineRef.current) {
        const fadeOutOpacity = 1 - timeSinceFade / fadeDurationMs;
        if (fadeOutOpacity > 0) renderLyric(fadingLineRef.current, fadeOutOpacity, false);
      }

      if (activeLineRef.current) {
        let fadeInOpacity = 1.0;
        if (['NONE', 'BOUNCE'].includes(settings.textAnimation) && timeSinceFade < fadeDurationMs) {
          fadeInOpacity = timeSinceFade / fadeDurationMs;
        }
        renderLyric(
          activeLineRef.current,
          fadeInOpacity,
          activeLineRef.current.id === lyrics[selectedLyricIndex || -1]?.id
        );
      }

      // End global shake scope
      ctx.restore();

      requestRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
      requestRef.current = requestAnimationFrame(draw);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
      // draw is intentionally excluded - it's recreated each render but the animation loop
      // naturally picks up latest values via refs. Including it would cause infinite re-renders.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      lyrics,
      currentTime,
      style,
      aspectRatio,
      width,
      height,
      backgroundAsset,
      settings,
      editMode,
      activeKeyframeIndex,
      selectedLyricIndex,
    ]);

    return (
      <div
        className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden bg-black ring-1 ring-slate-700"
        style={{ width, height }}
      >
        {backgroundAsset?.type === 'video' && (
          <video
            ref={videoRef}
            src={backgroundAsset.url}
            crossOrigin="anonymous"
            loop
            muted
            className="hidden"
            onLoadedData={() => setIsBgLoading(false)}
            onError={() => setIsBgLoading(false)}
          />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`absolute inset-0 z-10 w-full h-full ${editMode && activeKeyframeIndex !== null ? 'cursor-move' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {isBgLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-pink-500 tracking-[0.2em] animate-pulse">
                LOADING ASSET
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Visualizer;
