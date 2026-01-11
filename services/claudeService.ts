import Anthropic from '@anthropic-ai/sdk';
import { Genre, GenreDetectionResult, LyricLine, SongMetadata, EmotionalPeak } from '../types';

// Get Claude client
const getClaudeClient = () => {
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('CLAUDE_API_KEY not found in env');
  }
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
};

/**
 * Cross-verify genre and mood analysis with Claude
 * Uses text-based verification since Claude doesn't support direct audio analysis
 * Verifies based on lyrics, metadata, and Gemini's initial analysis
 */
export const verifyAnalysisWithClaude = async (
  geminiResult: GenreDetectionResult,
  lyrics?: LyricLine[],
  metadata?: SongMetadata
): Promise<GenreDetectionResult> => {
  const client = getClaudeClient();

  // Format lyrics for context if available
  const lyricsText = lyrics
    ? lyrics
        .slice(0, 20)
        .map((l) => l.text)
        .join('\n')
    : 'No lyrics available';

  const metadataText = metadata
    ? `Title: ${metadata.title}, Artist: ${metadata.artist}, Genre hint: ${metadata.genre}, Mood hint: ${metadata.mood}`
    : 'No metadata available';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are verifying another AI's music analysis. Based on the available information, determine if the analysis is accurate.

SONG INFORMATION:
${metadataText}

SAMPLE LYRICS:
${lyricsText}

INITIAL AI ANALYSIS:
- Genre: ${geminiResult.genre}
- Mood: ${geminiResult.mood}
- Confidence: ${geminiResult.confidence}
- Suggested Style: ${geminiResult.suggestedStyle}

Based on the lyrics and metadata, provide your assessment:
1. Do you agree with the genre classification? If not, what genre fits better?
2. Does the mood description match the lyrics content?
3. Your confidence level in the analysis (0-1)

Genres must be exactly one of: hiphop, rock, electronic, classical, pop, indie, rnb, jazz, country, metal

Return ONLY valid JSON in this exact format:
{
  "genre": "one of the genres listed above",
  "mood": "single word or short phrase",
  "confidence": 0.85,
  "suggestedStyle": "brief visual style description",
  "agreesWithOriginal": true
}`,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '{}';

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const json = JSON.parse(jsonStr);
    return {
      genre: json.genre as Genre,
      confidence: json.confidence || 0.7,
      suggestedStyle: json.suggestedStyle || '',
      mood: json.mood || 'neutral',
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    // Return a default result if parsing fails
    return {
      genre: geminiResult.genre, // Fall back to Gemini's result
      confidence: 0.5,
      suggestedStyle: geminiResult.suggestedStyle,
      mood: geminiResult.mood,
    };
  }
};

/**
 * Identify emotional peaks in lyrics using Claude
 * Analyzes lyrics to find choruses, climactic moments, and high-energy sections
 */
export const identifyEmotionalPeaks = async (
  lyrics: LyricLine[],
  metadata: SongMetadata
): Promise<EmotionalPeak[]> => {
  const client = getClaudeClient();

  // Format lyrics for analysis
  const formattedLyrics = lyrics
    .map(
      (line, idx) =>
        `[${idx}] (${line.startTime.toFixed(2)}s - ${line.endTime.toFixed(2)}s) ${line.section || ''}: "${line.text}"`
    )
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyze these lyrics and identify emotional peaks - moments that deserve unique visual treatment.

SONG INFO:
Title: ${metadata.title}
Artist: ${metadata.artist}
Genre: ${metadata.genre}
Mood: ${metadata.mood}

LYRICS WITH TIMING:
${formattedLyrics}

Identify:
1. CHORUS sections - Repeated parts, usually the emotional core
2. CLIMAX moments - The highest emotional/energy points
3. BRIDGE sections - Contrasting parts that build tension
4. ENERGY SPIKES - Individual lines with powerful impact

For each peak, rate intensity from 0-1 (only include peaks with intensity > 0.6).
Also suggest a visual concept for each peak.

Return ONLY valid JSON array:
[
  {
    "lyricIndex": 5,
    "peakType": "chorus",
    "intensity": 0.9,
    "suggestedVisual": "bright explosion of color, radiating energy"
  },
  ...
]`,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '[]';

  // Parse JSON from response
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const peaks = JSON.parse(jsonStr);
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
  } catch (error) {
    console.error('Failed to parse Claude emotional peaks response:', error);
    return [];
  }
};

/**
 * Get visual recommendations from Claude based on song analysis
 */
export const getClaudeVisualRecommendations = async (
  metadata: SongMetadata,
  mood: string,
  genre: Genre
): Promise<{
  colorSuggestions: string[];
  effectSuggestions: string[];
  overallVibe: string;
}> => {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `As a creative director for music videos, provide visual recommendations for this song:

Title: ${metadata.title}
Artist: ${metadata.artist}
Genre: ${genre}
Mood: ${mood}

Suggest:
1. 5 hex color codes that match the mood
2. 3 visual effect types (e.g., "particle burst", "wave distortion", "neon glow")
3. Overall visual vibe in 1-2 sentences

Return ONLY valid JSON:
{
  "colorSuggestions": ["#FF0000", "#00FF00", ...],
  "effectSuggestions": ["particle burst", ...],
  "overallVibe": "description"
}`,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '{}';

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return {
      colorSuggestions: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'],
      effectSuggestions: ['particle burst', 'wave', 'glow'],
      overallVibe: 'Dynamic and expressive visuals matching the music energy.',
    };
  }
};
