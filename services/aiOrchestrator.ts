import {
  LyricLine,
  SongMetadata,
  Genre,
  GenreDetectionResult,
  CrossVerifiedAnalysis,
  EmotionalPeak,
  VideoPlan,
  PeakVisual,
  AspectRatio,
  BackgroundStrategy,
  GeneratedAsset,
} from '../types';

import * as gemini from './geminiService';
import * as claude from './claudeService';

/**
 * Calculate consensus between Gemini and Claude analysis results
 */
export const calculateConsensus = (
  geminiResult: GenreDetectionResult,
  claudeResult: GenreDetectionResult
): CrossVerifiedAnalysis => {
  const genreMatch = geminiResult.genre === claudeResult.genre;
  const moodSimilar =
    geminiResult.mood.toLowerCase().includes(claudeResult.mood.toLowerCase()) ||
    claudeResult.mood.toLowerCase().includes(geminiResult.mood.toLowerCase());

  // Calculate confidence based on agreement
  let confidence: number;
  const disagreements: string[] = [];

  if (genreMatch && moodSimilar) {
    // Full agreement - high confidence
    confidence = (geminiResult.confidence + claudeResult.confidence) / 2;
  } else if (genreMatch) {
    // Genre matches but mood differs
    confidence = Math.max(geminiResult.confidence, claudeResult.confidence) * 0.9;
    disagreements.push(`Mood: Gemini="${geminiResult.mood}", Claude="${claudeResult.mood}"`);
  } else if (moodSimilar) {
    // Mood similar but genre differs
    confidence = Math.min(geminiResult.confidence, claudeResult.confidence) * 0.85;
    disagreements.push(`Genre: Gemini=${geminiResult.genre}, Claude=${claudeResult.genre}`);
  } else {
    // Both differ - lower confidence
    confidence = Math.min(geminiResult.confidence, claudeResult.confidence) * 0.7;
    disagreements.push(`Genre: Gemini=${geminiResult.genre}, Claude=${claudeResult.genre}`);
    disagreements.push(`Mood: Gemini="${geminiResult.mood}", Claude="${claudeResult.mood}"`);
  }

  // Determine consensus values (prefer Gemini when disagreement, as it analyzes audio directly)
  const consensusGenre = genreMatch ? geminiResult.genre : geminiResult.genre;
  const consensusMood = moodSimilar
    ? geminiResult.mood
    : `${geminiResult.mood} / ${claudeResult.mood}`;

  return {
    geminiResult,
    claudeResult,
    consensusGenre,
    consensusMood,
    confidence: Math.min(confidence, 1),
    disagreements: disagreements.length > 0 ? disagreements : undefined,
  };
};

/**
 * AI decides video vs image background based on song characteristics
 */
export const decideBackgroundStrategy = (
  analysis: CrossVerifiedAnalysis,
  peaks: EmotionalPeak[],
  userVision?: string
): BackgroundStrategy => {
  const genre = analysis.consensusGenre;
  const mood = analysis.consensusMood.toLowerCase();
  const avgPeakIntensity =
    peaks.length > 0 ? peaks.reduce((sum, p) => sum + p.intensity, 0) / peaks.length : 0.5;

  // High-energy genres/moods → Video background
  const highEnergyGenres: Genre[] = [
    Genre.ELECTRONIC,
    Genre.HIPHOP,
    Genre.ROCK,
    Genre.METAL,
    Genre.POP,
  ];
  const highEnergyMoods = [
    'energetic',
    'intense',
    'powerful',
    'aggressive',
    'upbeat',
    'party',
    'hype',
  ];

  // Check user vision for video/motion keywords
  const userWantsVideo = userVision
    ? /\b(video|motion|moving|animated|dynamic|flowing)\b/i.test(userVision)
    : false;
  const userWantsStatic = userVision
    ? /\b(static|still|calm|subtle|minimal)\b/i.test(userVision)
    : false;

  const isHighEnergy =
    highEnergyGenres.includes(genre) ||
    highEnergyMoods.some((m) => mood.includes(m)) ||
    avgPeakIntensity > 0.7;

  // User preference takes priority, then AI decision
  const useVideo = userWantsStatic ? false : userWantsVideo || isHighEnergy;

  const visionContext = userVision ? `, incorporating user's vision: "${userVision}"` : '';

  if (useVideo) {
    return {
      useVideo: true,
      videoPrompt: `Abstract motion background for ${genre} music, ${mood} atmosphere${visionContext}, flowing particles and light rays, seamless loop, cinematic quality, 4K`,
      reasoning: userWantsVideo
        ? `Motion background chosen: User requested dynamic/video visuals`
        : `Motion background chosen: ${genre} genre with ${mood} mood benefits from dynamic visuals (avg peak intensity: ${(avgPeakIntensity * 100).toFixed(0)}%)`,
    };
  } else {
    return {
      useVideo: false,
      imagePrompt: `Abstract artistic background for ${genre} music, ${mood} atmosphere${visionContext}, elegant composition, subtle gradients, suitable for lyric overlay, high resolution`,
      reasoning: userWantsStatic
        ? `Static background chosen: User requested calm/static visuals`
        : `Static background chosen: ${genre} genre with ${mood} mood works better with subtle, non-distracting visuals`,
    };
  }
};

/**
 * Run full multi-AI analysis pipeline
 */
export const runFullAnalysis = async (
  audioFile: File,
  userLyrics?: string,
  onProgress?: (status: string) => void
): Promise<{
  lyrics: LyricLine[];
  metadata: SongMetadata;
  analysis: CrossVerifiedAnalysis;
  emotionalPeaks: EmotionalPeak[];
}> => {
  onProgress?.('Analyzing audio with Gemini...');

  // Step 1: Run Gemini analysis in parallel
  const [geminiGenreResult, lyricsResult] = await Promise.all([
    gemini.detectMusicGenre(audioFile),
    gemini.analyzeAudioAndGetLyrics(audioFile, userLyrics),
  ]);

  onProgress?.('Cross-verifying with Claude...');

  // Step 2: Cross-verify with Claude (using lyrics and metadata for text-based verification)
  let claudeResult: GenreDetectionResult;
  try {
    claudeResult = await claude.verifyAnalysisWithClaude(
      geminiGenreResult,
      lyricsResult.lyrics,
      lyricsResult.metadata
    );
  } catch (error) {
    console.warn('Claude verification failed, using Gemini result only:', error);
    // Fall back to Gemini-only if Claude fails
    claudeResult = {
      ...geminiGenreResult,
      confidence: geminiGenreResult.confidence * 0.9, // Slightly lower confidence without verification
    };
  }

  // Step 3: Calculate consensus
  const consensus = calculateConsensus(geminiGenreResult, claudeResult);

  onProgress?.('Detecting emotional peaks...');

  // Step 4: Detect emotional peaks
  const peaks = await gemini.detectEmotionalPeaks(lyricsResult.lyrics, audioFile);

  return {
    lyrics: lyricsResult.lyrics,
    metadata: lyricsResult.metadata,
    analysis: consensus,
    emotionalPeaks: peaks,
  };
};

/**
 * Generate complete video plan with multi-AI analysis
 */
export const generateFullVideoPlan = async (
  audioFile: File,
  userLyrics?: string,
  userCreativeVision?: string,
  aspectRatio: AspectRatio = '16:9',
  onProgress?: (status: string) => void
): Promise<VideoPlan> => {
  // Step 1: Run full analysis
  const { lyrics, analysis, emotionalPeaks } = await runFullAnalysis(
    audioFile,
    userLyrics,
    onProgress
  );

  onProgress?.('Generating video plan...');

  // Step 2: Generate the video plan
  const planWithoutVisuals = await gemini.generateVideoPlan(
    audioFile,
    analysis,
    emotionalPeaks,
    lyrics,
    userCreativeVision
  );

  // Step 3: AI decides background strategy
  const backgroundStrategy = decideBackgroundStrategy(analysis, emotionalPeaks, userCreativeVision);

  // Step 4: Generate background based on AI decision
  onProgress?.('Generating background...');
  let sharedBackground: GeneratedAsset | null = null;

  try {
    if (backgroundStrategy.useVideo) {
      onProgress?.('Generating motion background (this may take 1-2 minutes)...');
      const videoUrl = await gemini.generateVideoBackground(
        backgroundStrategy.videoPrompt!,
        aspectRatio === '9:16' ? '9:16' : '16:9'
      );
      sharedBackground = {
        type: 'video',
        url: videoUrl,
        prompt: backgroundStrategy.videoPrompt!,
      };
    } else if (backgroundStrategy.imagePrompt) {
      onProgress?.('Generating static background...');
      const imageUrl = await gemini.generateBackground(
        backgroundStrategy.imagePrompt,
        aspectRatio,
        '2K'
      );
      sharedBackground = {
        type: 'image',
        url: imageUrl,
        prompt: backgroundStrategy.imagePrompt,
      };
    }
  } catch (error) {
    console.warn('Background generation failed, continuing without background:', error);
    // Continue without background - user can generate later
  }

  onProgress?.('Generating peak visuals...');

  // Step 5: Generate visuals for high-intensity peaks (parallel)
  const highIntensityPeaks = emotionalPeaks.filter((p) => p.intensity > 0.7);

  const peakVisuals: PeakVisual[] = [];

  if (highIntensityPeaks.length > 0) {
    // Limit to 5 peak visuals to manage API costs
    const peaksToGenerate = highIntensityPeaks.slice(0, 5);

    const visualPromises = peaksToGenerate.map(async (peak) => {
      try {
        const asset = await gemini.generatePeakVisual(
          peak,
          lyrics,
          planWithoutVisuals.mood,
          aspectRatio
        );
        return {
          peakId: peak.id,
          lyricIndices: [peak.lyricIndex],
          asset,
          transitionIn: 'fade' as const,
          transitionOut: 'fade' as const,
        };
      } catch (error) {
        console.warn(`Failed to generate visual for peak ${peak.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(visualPromises);
    const validResults = results.filter((v) => v !== null) as PeakVisual[];
    peakVisuals.push(...validResults);
  }

  // Combine into full plan
  const fullPlan: VideoPlan = {
    ...planWithoutVisuals,
    userCreativeVision,
    backgroundStrategy,
    hybridVisuals: {
      sharedBackground,
      peakVisuals,
    },
  };

  onProgress?.('Video plan complete!');

  return fullPlan;
};

/**
 * Regenerate a single peak visual
 */
export const regeneratePeakVisual = async (
  peak: EmotionalPeak,
  lyrics: LyricLine[],
  plan: VideoPlan,
  aspectRatio: AspectRatio = '16:9'
): Promise<PeakVisual> => {
  const asset = await gemini.generatePeakVisual(peak, lyrics, plan.mood, aspectRatio);

  return {
    peakId: peak.id,
    lyricIndices: [peak.lyricIndex],
    asset,
    transitionIn: 'fade',
    transitionOut: 'fade',
  };
};

/**
 * Modify video plan based on user instruction
 */
export const modifyPlan = async (
  currentPlan: VideoPlan,
  instruction: string,
  onProgress?: (status: string) => void
): Promise<VideoPlan> => {
  onProgress?.(`Modifying plan: "${instruction}"...`);

  const modifiedPlan = await gemini.modifyVideoPlan(currentPlan, instruction);

  onProgress?.('Plan updated!');

  return modifiedPlan;
};

/**
 * Quick analysis without full plan generation
 * Useful for getting initial feedback before committing to full plan
 */
export const quickAnalysis = async (
  audioFile: File,
  onProgress?: (status: string) => void
): Promise<{
  genre: Genre;
  mood: string;
  confidence: number;
  suggestedStyle: string;
}> => {
  onProgress?.('Quick analysis...');

  const result = await gemini.detectMusicGenre(audioFile);

  return {
    genre: result.genre,
    mood: result.mood,
    confidence: result.confidence,
    suggestedStyle: result.suggestedStyle,
  };
};
