import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import {
  LyricLine,
  VisualStyle,
  GeneratedAsset,
  AspectRatio,
  VisualSettings,
  ColorPalette,
  FrequencyBand,
  EasingType,
} from '../types';

interface VisualizerProps {
  audioUrl: string | null;
  lyrics: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
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
}

// Particle Class
class Particle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  speedX: number;
  speedY: number;
  color: string;
  history: { x: number; y: number }[];

  constructor(w: number, h: number, palette: ColorPalette) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.color = this.getColor(palette);
    this.history = [];
  }

  getColor(palette: ColorPalette): string {
    if (palette === 'neon') return `hsla(${Math.random() * 60 + 280}, 100%, 50%, 0.6)`;
    if (palette === 'sunset') return `hsla(${Math.random() * 60 + 10}, 100%, 60%, 0.6)`;
    if (palette === 'ocean') return `hsla(${Math.random() * 50 + 180}, 80%, 60%, 0.6)`;
    if (palette === 'matrix') return `hsla(${Math.random() * 40 + 100}, 100%, 50%, 0.7)`;
    if (palette === 'fire') return `hsla(${Math.random() * 30}, 100%, 50%, 0.7)`;
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
      this.history.push({ x: this.x, y: this.y });
      const limit = Math.floor(5 + 15 * intensity * speedMult);
      while (this.history.length > limit) {
        this.history.shift();
      }
    } else {
      this.history = [];
    }
  }

  draw(ctx: CanvasRenderingContext2D, trailsEnabled: boolean) {
    if (trailsEnabled && this.history.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (const point of this.history) {
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

// Easing Functions
const Easings: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    const n1 = 7.5625,
      d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(
  (
    {
      audioUrl,
      lyrics,
      currentTime,
      isPlaying,
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
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const requestRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const prevPaletteRef = useRef<ColorPalette>(settings.palette);
    const prevSentimentRef = useRef<string | undefined>(undefined);

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

    const getDimensions = () => {
      const [w, h] = aspectRatio.split(':').map(Number);
      const baseHeight = 720;
      const calculatedWidth = (baseHeight * w) / h;
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

        const audio = new Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;
        setAudioElement(audio);

        audio.addEventListener('timeupdate', () => {
          onTimeUpdate(audio.currentTime);
        });

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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

        return () => {
          audio.pause();
          audioCtx.close();
        };
      }
    }, [audioUrl]);

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
      }

      const getFreqValue = (band: FrequencyBand): number => {
        switch (band) {
          case 'bass':
            return bassFreq;
          case 'mid':
            return midFreq;
          case 'treble':
            return trebleFreq;
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
          p.draw(ctx, settings.trailsEnabled);
        });
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
        ctx.lineWidth = 2 * settings.intensity;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const strokeStyle = sentimentColor
            ? sentimentColor
            : `hsla(${i * 40 + time * 10 + 200}, 70%, 60%, 0.5)`;
          ctx.strokeStyle = strokeStyle;
          const waveMotion = motionFreqValue / 255;
          for (let x = 0; x < width; x += 10) {
            const y =
              height / 2 +
              Math.sin(x * 0.01 + time + i) * 50 * pulse +
              Math.sin(x * 0.02 - time * (1 + waveMotion)) * 20;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
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

        // Standard Text Rendering (Simplified for brevity, keeping existing logic)
        ctx.fillStyle = textColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur =
          styleForLine === VisualStyle.CINEMATIC_BACKDROP
            ? 20 * settings.intensity
            : 15 * settings.intensity;

        ctx.fillText(line.text, 0, 0);

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
