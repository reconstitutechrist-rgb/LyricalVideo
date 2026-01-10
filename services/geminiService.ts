import { GoogleGenAI, Type, Schema, FunctionDeclaration } from '@google/genai';
import {
  LyricLine,
  SongMetadata,
  ImageSize,
  AspectRatio,
  Genre,
  GenreDetectionResult,
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
