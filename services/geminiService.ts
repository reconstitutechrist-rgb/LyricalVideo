import { GoogleGenAI, Type, Schema, FunctionDeclaration } from '@google/genai';
import {
  LyricLine,
  SongMetadata,
  ImageSize,
  AspectRatio,
  Genre,
  GenreDetectionResult,
  EmotionalPeak,
  CrossVerifiedAnalysis,
  VideoPlan,
  VideoPlanMood,
  VideoPlanColorPalette,
  VideoPlanVisualStyle,
  VideoPlanEffect,
  VisualStyle,
  GeneratedAsset,
  // Sync types
  TimingPrecision,
  SyncConfig,
  SyncResult,
  WordTiming,
  SyllableTiming,
} from '../types';

// Helper to base64 encode
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const getAI = async () => {
  if (!process.env.API_KEY) {
    console.warn('API_KEY not found in env');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Tool Definition
const generateBackgroundImageTool: FunctionDeclaration = {
  name: 'generateBackgroundImage',
  description:
    'Generate a background image for the music video. Use this when the user explicitly asks to generate an image or background.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed visual description of the image to generate.',
      },
      aspectRatio: {
        type: Type.STRING,
        enum: ['1:1', '9:16', '16:9', '4:3', '3:4', '21:9'],
        description: 'The aspect ratio of the image. Defaults to 16:9.',
      },
      resolution: {
        type: Type.STRING,
        enum: ['1K', '2K', '4K'],
        description: 'The resolution quality. Defaults to 1K.',
      },
    },
    required: ['prompt'],
  },
};

// 1. Transcribe & Analyze Audio (With optional user lyrics)
export const analyzeAudioAndGetLyrics = async (
  audioFile: File,
  userLyrics?: string
): Promise<{ lyrics: LyricLine[]; metadata: SongMetadata }> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  let promptText = `
    Listen to this audio carefully. 
    1. Identify the Song Title, Artist, Genre, and Mood.
    2. Analyze the structure (Verse, Chorus, Bridge) and align lyrics with precise timestamps.
    3. For EACH lyric line, determine a specific 'sentimentColor' (Hex Code) that matches the emotion of that specific line (e.g., Sad = Blue/Grey, Energetic = Red/Orange).
    4. Return a JSON object.
  `;

  if (userLyrics && userLyrics.trim().length > 0) {
    promptText += `
      CRITICAL INSTRUCTION: The user has provided the official lyrics below. 
      Do NOT transcribe from scratch. Instead, ALIGN the provided text to the audio timestamps. 
      Ensure every line from the provided text is accounted for.
      
      PROVIDED LYRICS:
      """
      ${userLyrics}
      """
      `;
  } else {
    promptText += ` Transcribe the lyrics exactly as heard.`;
  }

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          artist: { type: Type.STRING },
          genre: { type: Type.STRING },
          mood: { type: Type.STRING },
        },
      },
      lyrics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
            section: { type: Type.STRING, description: 'e.g., Verse 1, Chorus, Bridge' },
            sentimentColor: {
              type: Type.STRING,
              description: "Hex color code matching the line's mood",
            },
          },
        },
      },
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        { text: promptText },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const json = JSON.parse(response.text || '{}');

  const lyrics =
    json.lyrics?.map((l: any, i: number) => ({
      id: `line-${i}`,
      text: l.text,
      startTime: l.startTime,
      endTime: l.endTime,
      section: l.section,
      sentimentColor: l.sentimentColor,
    })) || [];

  const metadata = json.metadata || {
    title: 'Unknown',
    artist: 'Unknown',
    genre: 'Unknown',
    mood: 'Neutral',
  };

  return { lyrics, metadata };
};

// 1b. Sync Lyrics with Precision (Line/Word/Syllable level timing)
export const syncLyricsWithPrecision = async (
  audioFile: File,
  config: SyncConfig,
  onProgress?: (percent: number) => void
): Promise<SyncResult> => {
  const startTime = Date.now();
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  onProgress?.(10);

  const precisionInstructions: Record<TimingPrecision, string> = {
    line: 'Provide start/end timestamps for each LINE of lyrics.',
    word: `Provide timestamps for EACH WORD within each line. For each lyric line, include a "words" array where each word has: { text, startTime, endTime, confidence }. The confidence should be 0-1 based on how clearly the word is heard.`,
    syllable: `Provide timestamps for each SYLLABLE of every word. For each lyric line, include a "words" array. Each word should have a "syllables" array with: { text, startTime, endTime, phoneme }. The phoneme is the IPA representation (optional).`,
  };

  const promptText = `
    Analyze this audio and synchronize lyrics with PRECISE timing.

    PRECISION LEVEL: ${config.precision.toUpperCase()}
    ${precisionInstructions[config.precision]}

    ${
      config.userLyrics
        ? `
    CRITICAL: The user has provided the official lyrics below.
    Do NOT transcribe from scratch. Instead, ALIGN the provided text to the audio timestamps.
    Ensure every line from the provided text is accounted for.

    PROVIDED LYRICS:
    """
    ${config.userLyrics}
    """
    `
        : 'Transcribe the lyrics exactly as heard from the audio.'
    }

    Return timestamps in seconds with 3 decimal precision (e.g., 1.234).
    Include confidence scores (0-1) based on audio clarity.
    Detect the song structure (Verse, Chorus, Bridge) for each line.
    Assign a sentimentColor (hex code) matching each line's emotional tone.
  `;

  // Build schema based on precision level
  const responseSchema = buildPrecisionSchema(config.precision);

  onProgress?.(30);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        { text: promptText },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  onProgress?.(90);

  const json = JSON.parse(response.text || '{}');
  const processingTimeMs = Date.now() - startTime;

  // Parse and normalize the result
  const lyrics: LyricLine[] =
    json.lyrics?.map((l: any, i: number) => {
      const line: LyricLine = {
        id: `line-${i}`,
        text: l.text,
        startTime: l.startTime,
        endTime: l.endTime,
        section: l.section,
        sentimentColor: l.sentimentColor,
        syncPrecision: config.precision,
        syncConfidence: l.confidence,
      };

      // Add word-level timing if available
      if (l.words && config.precision !== 'line') {
        line.words = l.words.map((w: any, wi: number) => {
          const word: WordTiming = {
            id: `word-${i}-${wi}`,
            text: w.text,
            startTime: w.startTime,
            endTime: w.endTime,
            confidence: w.confidence,
          };

          // Add syllable-level timing if available
          if (w.syllables && config.precision === 'syllable') {
            word.syllables = w.syllables.map((s: any, si: number) => ({
              id: `syl-${i}-${wi}-${si}`,
              text: s.text,
              startTime: s.startTime,
              endTime: s.endTime,
              phoneme: s.phoneme,
            }));
          }

          return word;
        });
      }

      return line;
    }) || [];

  const metadata: SongMetadata = json.metadata || {
    title: 'Unknown',
    artist: 'Unknown',
    genre: 'Unknown',
    mood: 'Neutral',
  };

  // Calculate overall confidence
  const confidences = lyrics.map((l) => l.syncConfidence || 0).filter((c) => c > 0);
  const overallConfidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  onProgress?.(100);

  return {
    lyrics,
    metadata,
    precision: config.precision,
    overallConfidence,
    processingTimeMs,
  };
};

// Helper to build schema based on precision level
function buildPrecisionSchema(precision: TimingPrecision): Schema {
  // Base word schema
  const syllableSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      startTime: { type: Type.NUMBER },
      endTime: { type: Type.NUMBER },
      phoneme: { type: Type.STRING, description: 'IPA phoneme (optional)' },
    },
  };

  const wordSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      startTime: { type: Type.NUMBER },
      endTime: { type: Type.NUMBER },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' },
      ...(precision === 'syllable'
        ? {
            syllables: {
              type: Type.ARRAY,
              items: syllableSchema,
            },
          }
        : {}),
    },
  };

  // Lyric line schema varies by precision
  const lyricLineSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      startTime: { type: Type.NUMBER },
      endTime: { type: Type.NUMBER },
      section: { type: Type.STRING, description: 'e.g., Verse 1, Chorus, Bridge' },
      sentimentColor: { type: Type.STRING, description: 'Hex color matching emotion' },
      confidence: { type: Type.NUMBER, description: 'Line-level confidence 0-1' },
      ...(precision !== 'line'
        ? {
            words: {
              type: Type.ARRAY,
              items: wordSchema,
            },
          }
        : {}),
    },
  };

  return {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          artist: { type: Type.STRING },
          genre: { type: Type.STRING },
          mood: { type: Type.STRING },
        },
      },
      lyrics: {
        type: Type.ARRAY,
        items: lyricLineSchema,
      },
    },
  };
}

// 2. Chat with AI (Contextual)
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
) => {
  const ai = await getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction:
        'You are a creative director for a high-end music video app. Help the user with artistic direction, visual ideas, and lyric refinement. Be concise, professional, and creative. You can generate background images using the provided tool if the user asks.',
      tools: [{ functionDeclarations: [generateBackgroundImageTool] }],
    },
  });

  const result = await chat.sendMessage({ message: newMessage });
  return {
    text: result.text,
    functionCalls: result.functionCalls,
  };
};

// 3. Generate Image Background
export const generateBackground = async (
  prompt: string,
  aspectRatio: AspectRatio,
  size: ImageSize
): Promise<string> => {
  const ai = await getAI();
  const model =
    size === '2K' || size === '4K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size === '1K' ? undefined : size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error('No image generated');
};

// 4. Analyze Image
export const analyzeImage = async (file: File): Promise<string> => {
  const ai = await getAI();
  const base64 = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64 } },
        {
          text: 'Analyze this image and describe its mood, colors, and potential musical genre fit.',
        },
      ],
    },
  });
  return response.text || 'Could not analyze image.';
};

// 5. Generate Video (Veo)
export const generateVideoBackground = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string> => {
  // @ts-expect-error - aistudio is injected by AI Studio environment
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-expect-error - aistudio is injected by AI Studio environment
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-expect-error - aistudio is injected by AI Studio environment
      await window.aistudio.openSelectKey();
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: aspectRatio,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error('Video generation failed');

  const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// 6. Transcribe Microphone
export const transcribeMicrophone = async (audioBlob: Blob): Promise<string> => {
  const ai = await getAI();
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });
  const base64 = await base64Promise;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/webm', data: base64 } },
        { text: 'Transcribe this audio.' },
      ],
    },
  });
  return response.text || '';
};

// 7. Detect Music Genre
export const detectMusicGenre = async (audioFile: File): Promise<GenreDetectionResult> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      genre: {
        type: Type.STRING,
        enum: Object.values(Genre),
        description: 'The primary detected music genre',
      },
      confidence: {
        type: Type.NUMBER,
        description: 'Confidence level from 0 to 1',
      },
      suggestedStyle: {
        type: Type.STRING,
        description: 'Recommended visual style for this genre (e.g., neon, vintage, elegant)',
      },
      mood: {
        type: Type.STRING,
        description: 'The overall mood of the track (e.g., energetic, melancholic, uplifting)',
      },
      subgenres: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Secondary genres or subgenres detected',
      },
      tempo: {
        type: Type.STRING,
        enum: ['slow', 'medium', 'fast'],
        description: 'General tempo of the track',
      },
      energy: {
        type: Type.STRING,
        enum: ['low', 'medium', 'high'],
        description: 'Energy level of the track',
      },
    },
    required: ['genre', 'confidence', 'suggestedStyle', 'mood'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        {
          text: `Analyze this audio track and determine its music genre. Consider:
1. The primary genre (hiphop, rock, electronic, classical, pop, indie, rnb, jazz, country, metal)
2. Your confidence level in this classification (0 to 1)
3. A visual style that would complement this genre for a lyric video
4. The overall mood and energy of the track
5. Any secondary genres or subgenres

Focus on the musical characteristics: instruments, rhythm, vocal style, production techniques.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const json = JSON.parse(response.text || '{}');

  // Map string genre to Genre enum
  const genreMap: Record<string, Genre> = {
    hiphop: Genre.HIPHOP,
    rock: Genre.ROCK,
    electronic: Genre.ELECTRONIC,
    classical: Genre.CLASSICAL,
    pop: Genre.POP,
    indie: Genre.INDIE,
    rnb: Genre.RNB,
    jazz: Genre.JAZZ,
    country: Genre.COUNTRY,
    metal: Genre.METAL,
  };

  return {
    genre: genreMap[json.genre?.toLowerCase()] || Genre.POP,
    confidence: json.confidence || 0.5,
    suggestedStyle: json.suggestedStyle || 'modern',
    mood: json.mood || 'neutral',
  };
};

// 8. Get Visual Recommendations Based on Audio
export const getVisualRecommendations = async (
  audioFile: File
): Promise<{
  backgroundStyle: string;
  colorPalette: string[];
  textEffects: string[];
  mood: string;
}> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      backgroundStyle: {
        type: Type.STRING,
        description: 'Recommended background effect style',
      },
      colorPalette: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Array of 5 hex color codes that match the music',
      },
      textEffects: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Recommended text/lyric effect names',
      },
      mood: {
        type: Type.STRING,
        description: 'Overall mood description',
      },
      visualNotes: {
        type: Type.STRING,
        description: 'Additional visual direction notes',
      },
    },
    required: ['backgroundStyle', 'colorPalette', 'textEffects', 'mood'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        {
          text: `Analyze this music and recommend visual effects for a lyric video:
1. Background style (e.g., synthwave grid, gentle bokeh, aggressive rock, urban geometric)
2. A color palette of 5 hex codes that match the mood
3. Text animation effects that would complement the rhythm (e.g., wave, bounce, glitch, fade)
4. Overall mood description

Consider the tempo, instruments, vocal style, and emotional content.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const json = JSON.parse(response.text || '{}');

  return {
    backgroundStyle: json.backgroundStyle || 'modern',
    colorPalette: json.colorPalette || ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0066', '#00FF99'],
    textEffects: json.textEffects || ['wave', 'fade'],
    mood: json.mood || 'neutral',
  };
};

// 9. Detect Emotional Peaks in Song
export const detectEmotionalPeaks = async (
  lyrics: LyricLine[],
  audioFile: File
): Promise<EmotionalPeak[]> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  // Format lyrics for analysis
  const formattedLyrics = lyrics
    .map(
      (line, idx) =>
        `[${idx}] (${line.startTime.toFixed(2)}s - ${line.endTime.toFixed(2)}s) ${line.section || ''}: "${line.text}"`
    )
    .join('\n');

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        lyricIndex: { type: Type.NUMBER, description: 'Index of the lyric line' },
        peakType: {
          type: Type.STRING,
          enum: ['chorus', 'climax', 'bridge', 'outro', 'energy_spike'],
          description: 'Type of emotional peak',
        },
        intensity: {
          type: Type.NUMBER,
          description: 'Intensity from 0 to 1',
        },
        suggestedVisual: {
          type: Type.STRING,
          description: 'Visual concept for this moment',
        },
      },
      required: ['lyricIndex', 'peakType', 'intensity'],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: audioFile.type, data: base64Audio } },
        {
          text: `Analyze this audio and the following lyrics to identify emotional peaks.

LYRICS WITH TIMING:
${formattedLyrics}

Identify:
1. CHORUS sections - High-energy, repeated parts
2. CLIMAX moments - The highest emotional/energy points
3. BRIDGE sections - Contrasting parts building tension
4. ENERGY SPIKES - Individual lines with powerful impact

For each peak, provide:
- lyricIndex: The index number from the lyrics
- peakType: One of chorus, climax, bridge, outro, energy_spike
- intensity: 0-1 rating (only include peaks with intensity > 0.6)
- suggestedVisual: Brief visual concept for this moment

Listen to the actual audio energy levels, not just the lyrics.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const peaks = JSON.parse(response.text || '[]');

  return peaks.map(
    (
      peak: {
        lyricIndex: number;
        peakType: string;
        intensity: number;
        suggestedVisual?: string;
      },
      idx: number
    ) => {
      const lyric = lyrics[peak.lyricIndex];
      return {
        id: `peak-${idx}`,
        lyricIndex: peak.lyricIndex,
        startTime: lyric?.startTime || 0,
        endTime: lyric?.endTime || 0,
        peakType: peak.peakType as EmotionalPeak['peakType'],
        intensity: peak.intensity,
        suggestedVisual: peak.suggestedVisual,
      };
    }
  );
};

// 10. Generate Visual for Emotional Peak
export const generatePeakVisual = async (
  peak: EmotionalPeak,
  lyrics: LyricLine[],
  mood: VideoPlanMood,
  aspectRatio: AspectRatio = '16:9'
): Promise<GeneratedAsset> => {
  const ai = await getAI();

  // Get the lyric text for this peak
  const lyricText = lyrics[peak.lyricIndex]?.text || '';

  // Build a contextual prompt
  const prompt = `Create an abstract, artistic background image for a music video lyric visualization.

CONTEXT:
- Lyric: "${lyricText}"
- Moment type: ${peak.peakType}
- Emotional intensity: ${Math.round(peak.intensity * 100)}%
- Overall mood: ${mood.primary} (${mood.description})
${peak.suggestedVisual ? `- Visual concept: ${peak.suggestedVisual}` : ''}

STYLE REQUIREMENTS:
- Abstract and artistic, suitable as a background
- Rich colors that match the ${mood.primary} mood
- ${peak.intensity > 0.8 ? 'High energy, dynamic composition' : 'Flowing, atmospheric feel'}
- NO text or words in the image
- Cinematic quality, suitable for 4K video

Create a visually striking background that enhances the emotional impact of this moment.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        type: 'image',
        url: `data:image/png;base64,${part.inlineData.data}`,
        prompt: prompt,
      };
    }
  }
  throw new Error('Failed to generate peak visual');
};

// 11. Generate Complete Video Plan
export const generateVideoPlan = async (
  audioFile: File,
  analysis: CrossVerifiedAnalysis,
  emotionalPeaks: EmotionalPeak[],
  lyrics: LyricLine[],
  userCreativeVision?: string
): Promise<Omit<VideoPlan, 'hybridVisuals' | 'backgroundStrategy' | 'userCreativeVision'>> => {
  const ai = await getAI();
  const base64Audio = await fileToBase64(audioFile);

  // Available effects for the AI to choose from
  const availableBackgroundEffects = [
    {
      id: 'hiphop-urban',
      name: 'Hip Hop Urban',
      description: 'Bold geometric shapes, graffiti-inspired',
    },
    {
      id: 'rock-energy',
      name: 'Rock Energy',
      description: 'High energy with stage lighting, distortion',
    },
    {
      id: 'electronic-edm',
      name: 'Electronic EDM',
      description: 'Neon grids, synthwave aesthetics',
    },
    {
      id: 'classical-elegant',
      name: 'Classical Elegant',
      description: 'Refined and minimal with soft particles',
    },
    {
      id: 'pop-vibrant',
      name: 'Pop Vibrant',
      description: 'Bright and playful with bouncy shapes',
    },
    { id: 'indie-dreamy', name: 'Indie Dreamy', description: 'Vintage soft bokeh with film grain' },
  ];

  const availableLyricEffects = [
    {
      id: 'character-pop',
      name: 'Character Pop',
      description: 'Bounce-in animation per character',
    },
    { id: 'wave', name: 'Wave', description: 'Sine wave animation on characters' },
    { id: 'rainbow-cycle', name: 'Rainbow Cycle', description: 'Cycling rainbow colors' },
    { id: 'gravity-fall', name: 'Gravity Fall', description: 'Characters fall with physics' },
    { id: 'explode', name: 'Explode', description: 'Text shatters into fragments' },
    { id: 'flip', name: 'Flip', description: '3D flip animation' },
    { id: 'particle-burst', name: 'Particle Burst', description: 'Particles burst from text' },
  ];

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.OBJECT,
        properties: {
          primary: { type: Type.STRING },
          secondary: { type: Type.STRING },
          intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          description: { type: Type.STRING },
        },
        required: ['primary', 'intensity', 'description'],
      },
      colorPalette: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          primary: { type: Type.STRING },
          secondary: { type: Type.STRING },
          accent: { type: Type.STRING },
          background: { type: Type.STRING },
          text: { type: Type.STRING },
        },
        required: ['name', 'primary', 'secondary', 'accent', 'background', 'text'],
      },
      visualStyle: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING, enum: Object.values(VisualStyle) },
          textAnimation: {
            type: Type.STRING,
            enum: ['NONE', 'TYPEWRITER', 'FADE_CHARS', 'KINETIC', 'BOUNCE'],
          },
          fontFamily: {
            type: Type.STRING,
            enum: ['Space Grotesk', 'Inter', 'Roboto', 'Montserrat', 'Cinzel'],
          },
          blendMode: { type: Type.STRING },
          intensity: { type: Type.NUMBER },
          particleSpeed: { type: Type.NUMBER },
        },
        required: ['style', 'textAnimation', 'fontFamily', 'intensity', 'particleSpeed'],
      },
      backgroundEffect: {
        type: Type.OBJECT,
        properties: {
          effectId: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['effectId', 'name', 'description'],
      },
      lyricEffects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            effectId: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ['effectId', 'name', 'description'],
        },
      },
      summary: { type: Type.STRING },
      rationale: { type: Type.STRING },
    },
    required: [
      'mood',
      'colorPalette',
      'visualStyle',
      'backgroundEffect',
      'lyricEffects',
      'summary',
      'rationale',
    ],
  };

  const visionSection = userCreativeVision
    ? `\nUSER'S CREATIVE VISION:\n"${userCreativeVision}"\n\nIMPORTANT: Incorporate the user's vision into all creative decisions. Their preferences should guide the mood, colors, and overall aesthetic.\n`
    : '';

  const prompt = `You are a creative director creating a comprehensive video plan for a lyric video.

SONG ANALYSIS:
- Detected Genre: ${analysis.consensusGenre} (${Math.round(analysis.confidence * 100)}% confidence)
- Mood: ${analysis.consensusMood}
- Number of emotional peaks: ${emotionalPeaks.length}
- Peak types: ${[...new Set(emotionalPeaks.map((p) => p.peakType))].join(', ')}
${visionSection}
AVAILABLE BACKGROUND EFFECTS:
${availableBackgroundEffects.map((e) => `- ${e.id}: ${e.name} - ${e.description}`).join('\n')}

AVAILABLE LYRIC EFFECTS:
${availableLyricEffects.map((e) => `- ${e.id}: ${e.name} - ${e.description}`).join('\n')}

Create a cohesive video plan that includes:
1. Overall mood description (primary emotion, intensity, detailed description)
2. Color palette with 5 colors (name it, provide hex codes for primary, secondary, accent, background, text)
3. Visual style settings (choose style, text animation, font, blend mode, intensity 0.5-3, particle speed 0.1-3)
4. One background effect that matches the genre
5. 1-3 lyric effects that complement the mood
6. A brief summary and creative rationale${userCreativeVision ? " (reference how you incorporated the user's creative vision)" : ''}

Be creative but cohesive - all elements should work together harmoniously.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [{ inlineData: { mimeType: audioFile.type, data: base64Audio } }, { text: prompt }],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const json = JSON.parse(response.text || '{}');

  // Build the color palette with gradient
  const palette: VideoPlanColorPalette = {
    name: json.colorPalette.name || 'Custom Palette',
    primary: json.colorPalette.primary || '#6366f1',
    secondary: json.colorPalette.secondary || '#8b5cf6',
    accent: json.colorPalette.accent || '#ec4899',
    background: json.colorPalette.background || '#0f0f0f',
    text: json.colorPalette.text || '#ffffff',
    previewGradient: `linear-gradient(135deg, ${json.colorPalette.primary}, ${json.colorPalette.secondary}, ${json.colorPalette.accent})`,
  };

  // Build mood
  const mood: VideoPlanMood = {
    primary: json.mood.primary || 'Energetic',
    secondary: json.mood.secondary,
    intensity: json.mood.intensity || 'medium',
    description: json.mood.description || 'A dynamic and expressive mood',
  };

  // Build visual style
  const visualStyle: VideoPlanVisualStyle = {
    style: (json.visualStyle.style as VisualStyle) || VisualStyle.NEON_PULSE,
    textAnimation: json.visualStyle.textAnimation || 'FADE_CHARS',
    fontFamily: json.visualStyle.fontFamily || 'Space Grotesk',
    blendMode: json.visualStyle.blendMode || 'screen',
    intensity: json.visualStyle.intensity || 1.5,
    particleSpeed: json.visualStyle.particleSpeed || 1.0,
  };

  // Build background effect
  const backgroundEffect: VideoPlanEffect = {
    effectId: json.backgroundEffect.effectId || 'pop-vibrant',
    name: json.backgroundEffect.name || 'Pop Vibrant',
    description: json.backgroundEffect.description || 'Bright and colorful background',
    parameters: {},
    reason: json.backgroundEffect.reason,
  };

  // Build lyric effects
  const lyricEffects: VideoPlanEffect[] = (json.lyricEffects || []).map(
    (e: { effectId: string; name: string; description: string; reason?: string }) => ({
      effectId: e.effectId,
      name: e.name,
      description: e.description,
      parameters: {},
      reason: e.reason,
    })
  );

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date(),
    version: 1,
    status: 'draft',
    analysis,
    emotionalPeaks,
    mood,
    colorPalette: palette,
    visualStyle,
    backgroundEffect,
    lyricEffects,
    summary: json.summary || 'AI-generated video plan',
    rationale: json.rationale || 'Plan created based on audio analysis',
  };
};

// 12. Modify Video Plan via Instruction
export const modifyVideoPlan = async (
  currentPlan: VideoPlan,
  instruction: string
): Promise<VideoPlan> => {
  const ai = await getAI();

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.OBJECT,
        properties: {
          primary: { type: Type.STRING },
          secondary: { type: Type.STRING },
          intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          description: { type: Type.STRING },
        },
      },
      colorPalette: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          primary: { type: Type.STRING },
          secondary: { type: Type.STRING },
          accent: { type: Type.STRING },
          background: { type: Type.STRING },
          text: { type: Type.STRING },
        },
      },
      visualStyle: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING },
          textAnimation: { type: Type.STRING },
          fontFamily: { type: Type.STRING },
          blendMode: { type: Type.STRING },
          intensity: { type: Type.NUMBER },
          particleSpeed: { type: Type.NUMBER },
        },
      },
      backgroundEffect: {
        type: Type.OBJECT,
        properties: {
          effectId: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
      },
      lyricEffects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            effectId: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
        },
      },
      summary: { type: Type.STRING },
      rationale: { type: Type.STRING },
    },
  };

  const prompt = `You are modifying an existing video plan based on user feedback.

CURRENT PLAN:
${JSON.stringify(
  {
    mood: currentPlan.mood,
    colorPalette: currentPlan.colorPalette,
    visualStyle: currentPlan.visualStyle,
    backgroundEffect: currentPlan.backgroundEffect,
    lyricEffects: currentPlan.lyricEffects,
  },
  null,
  2
)}

USER INSTRUCTION: "${instruction}"

Modify the plan according to the user's request. Keep elements that weren't explicitly mentioned.
Examples of modifications:
- "make it more energetic" -> increase intensity, faster animations, brighter/warmer colors
- "darker colors" -> shift palette to darker tones
- "add more movement" -> add physics-based lyric effects
- "calmer" -> reduce intensity, slower speeds, softer/cooler colors
- "more retro" -> vintage colors, classic fonts

Return the complete modified plan with updated summary and rationale.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const json = JSON.parse(response.text || '{}');

  // Merge modifications with current plan
  return {
    ...currentPlan,
    id: `plan-${Date.now()}`,
    version: currentPlan.version + 1,
    mood: {
      primary: json.mood?.primary || currentPlan.mood.primary,
      secondary: json.mood?.secondary || currentPlan.mood.secondary,
      intensity: json.mood?.intensity || currentPlan.mood.intensity,
      description: json.mood?.description || currentPlan.mood.description,
    },
    colorPalette: {
      name: json.colorPalette?.name || currentPlan.colorPalette.name,
      primary: json.colorPalette?.primary || currentPlan.colorPalette.primary,
      secondary: json.colorPalette?.secondary || currentPlan.colorPalette.secondary,
      accent: json.colorPalette?.accent || currentPlan.colorPalette.accent,
      background: json.colorPalette?.background || currentPlan.colorPalette.background,
      text: json.colorPalette?.text || currentPlan.colorPalette.text,
      previewGradient: `linear-gradient(135deg, ${json.colorPalette?.primary || currentPlan.colorPalette.primary}, ${json.colorPalette?.secondary || currentPlan.colorPalette.secondary}, ${json.colorPalette?.accent || currentPlan.colorPalette.accent})`,
    },
    visualStyle: {
      style: (json.visualStyle?.style as VisualStyle) || currentPlan.visualStyle.style,
      textAnimation: json.visualStyle?.textAnimation || currentPlan.visualStyle.textAnimation,
      fontFamily: json.visualStyle?.fontFamily || currentPlan.visualStyle.fontFamily,
      blendMode: json.visualStyle?.blendMode || currentPlan.visualStyle.blendMode,
      intensity: json.visualStyle?.intensity ?? currentPlan.visualStyle.intensity,
      particleSpeed: json.visualStyle?.particleSpeed ?? currentPlan.visualStyle.particleSpeed,
    },
    backgroundEffect: json.backgroundEffect
      ? {
          effectId: json.backgroundEffect.effectId,
          name: json.backgroundEffect.name,
          description: json.backgroundEffect.description,
          parameters: {},
          reason: json.backgroundEffect.reason,
        }
      : currentPlan.backgroundEffect,
    lyricEffects: json.lyricEffects?.length
      ? json.lyricEffects.map(
          (e: { effectId: string; name: string; description: string; reason?: string }) => ({
            effectId: e.effectId,
            name: e.name,
            description: e.description,
            parameters: {},
            reason: e.reason,
          })
        )
      : currentPlan.lyricEffects,
    summary: json.summary || currentPlan.summary,
    rationale: json.rationale || `Modified: ${instruction}`,
  };
};
