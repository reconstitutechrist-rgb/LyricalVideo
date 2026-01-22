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
 * Helper to check if an error is an abort error
 */
function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Helper to throw if signal is aborted
 */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new DOMException('Request aborted', 'AbortError');
    throw error;
  }
}

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

  // Determine consensus values
  // When genres match, use the agreed genre
  // When they differ, prefer Gemini as it analyzes audio directly (Claude only sees lyrics/metadata)
  const consensusGenre = geminiResult.genre;
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
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<{
  lyrics: LyricLine[];
  metadata: SongMetadata;
  analysis: CrossVerifiedAnalysis;
  emotionalPeaks: EmotionalPeak[];
}> => {
  throwIfAborted(signal);
  onProgress?.('Analyzing audio with Gemini...');

  // Step 1: Run Gemini analysis in parallel
  const [geminiGenreResult, lyricsResult] = await Promise.all([
    gemini.detectMusicGenre(audioFile, signal),
    gemini.analyzeAudioAndGetLyrics(audioFile, userLyrics, signal),
  ]);

  throwIfAborted(signal);
  onProgress?.('Cross-verifying with Claude...');

  // Step 2: Cross-verify with Claude (using lyrics and metadata for text-based verification)
  let claudeResult: GenreDetectionResult;
  try {
    // Check for abort before Claude call (Claude SDK doesn't support abort signals directly)
    throwIfAborted(signal);
    claudeResult = await claude.verifyAnalysisWithClaude(
      geminiGenreResult,
      lyricsResult.lyrics,
      lyricsResult.metadata
    );
  } catch (error) {
    // Re-throw abort errors
    if (isAbortError(error)) {
      throw error;
    }
    console.warn('Claude verification failed, using Gemini result only:', error);
    // Fall back to Gemini-only if Claude fails
    claudeResult = {
      ...geminiGenreResult,
      confidence: geminiGenreResult.confidence * 0.9, // Slightly lower confidence without verification
    };
  }

  // Step 3: Calculate consensus
  const consensus = calculateConsensus(geminiGenreResult, claudeResult);

  throwIfAborted(signal);
  onProgress?.('Detecting emotional peaks...');

  // Step 4: Detect emotional peaks
  const peaks = await gemini.detectEmotionalPeaks(lyricsResult.lyrics, audioFile, signal);

  return {
    lyrics: lyricsResult.lyrics,
    metadata: lyricsResult.metadata,
    analysis: consensus,
    emotionalPeaks: peaks,
  };
};

/**
 * Generate complete video plan with multi-AI analysis
 * NOTE: This only generates plan METADATA - no backgrounds or visuals are generated yet.
 * Call generatePlanAssets() after user approves the plan to generate actual assets.
 */
export const generateFullVideoPlan = async (
  audioFile: File,
  userLyrics?: string,
  userCreativeVision?: string,
  aspectRatio: AspectRatio = '16:9',
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<VideoPlan> => {
  throwIfAborted(signal);

  // Step 1: Run full analysis
  const { lyrics, analysis, emotionalPeaks } = await runFullAnalysis(
    audioFile,
    userLyrics,
    onProgress,
    signal
  );

  throwIfAborted(signal);
  onProgress?.('Generating video plan...');

  // Step 2: Generate the video plan (metadata only - no assets)
  const planWithoutVisuals = await gemini.generateVideoPlan(
    audioFile,
    analysis,
    emotionalPeaks,
    lyrics,
    userCreativeVision,
    signal
  );

  // Step 3: AI decides background strategy (but doesn't generate yet)
  const backgroundStrategy = decideBackgroundStrategy(analysis, emotionalPeaks, userCreativeVision);

  // Combine into plan WITHOUT generating assets
  // Assets will be generated when user approves via generatePlanAssets()
  const fullPlan: VideoPlan = {
    ...planWithoutVisuals,
    userCreativeVision,
    backgroundStrategy,
    hybridVisuals: {
      sharedBackground: null, // Will be generated after approval
      peakVisuals: [], // Will be generated after approval
    },
    status: 'draft', // Mark as draft - awaiting user approval
  };

  onProgress?.('Video plan ready for review!');

  return fullPlan;
};

/**
 * Generate assets (backgrounds and peak visuals) for an approved plan
 * Call this AFTER user has reviewed and approved the plan
 */
export const generatePlanAssets = async (
  plan: VideoPlan,
  audioFile: File,
  lyrics: LyricLine[],
  aspectRatio: AspectRatio = '16:9',
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<VideoPlan> => {
  throwIfAborted(signal);

  const backgroundStrategy = plan.backgroundStrategy;
  if (!backgroundStrategy) {
    throw new Error('Plan has no background strategy');
  }

  // Step 1: Generate background based on AI decision
  onProgress?.('Generating background...');
  let sharedBackground: GeneratedAsset | null = null;

  try {
    if (backgroundStrategy.useVideo) {
      throwIfAborted(signal);

      // Calculate song duration from lyrics
      const songDuration = lyrics.length > 0 ? lyrics[lyrics.length - 1].endTime : 0;

      // Use extended video generation for songs longer than 8 seconds
      if (songDuration > 8) {
        onProgress?.('Generating extended motion background (this may take several minutes)...');
        const segments = await gemini.generateExtendedVideoBackground(
          backgroundStrategy.videoPrompt!,
          aspectRatio === '9:16' ? '9:16' : '16:9',
          '1080p',
          songDuration,
          undefined, // No reference image for initial generation
          (percent, message) => onProgress?.(`${message} (${percent}%)`),
          signal
        );
        sharedBackground = {
          type: 'extended-video',
          segments,
          prompt: backgroundStrategy.videoPrompt!,
        };
      } else {
        // Short song - single 8-second clip is enough
        onProgress?.('Generating motion background (this may take 1-2 minutes)...');
        const videoUrl = await gemini.generateVideoBackground(
          backgroundStrategy.videoPrompt!,
          aspectRatio === '9:16' ? '9:16' : '16:9',
          '1080p',
          undefined,
          signal
        );
        sharedBackground = {
          type: 'video',
          url: videoUrl,
          prompt: backgroundStrategy.videoPrompt!,
        };
      }
    } else if (backgroundStrategy.imagePrompt) {
      throwIfAborted(signal);
      onProgress?.('Generating static background...');
      const imageUrl = await gemini.generateBackground(
        backgroundStrategy.imagePrompt,
        aspectRatio,
        '2K',
        signal
      );
      sharedBackground = {
        type: 'image',
        url: imageUrl,
        prompt: backgroundStrategy.imagePrompt,
      };
    }
  } catch (error) {
    // Re-throw abort errors
    if (isAbortError(error)) {
      throw error;
    }
    console.warn('Background generation failed, continuing without background:', error);
    // Continue without background - user can generate later
  }

  throwIfAborted(signal);
  onProgress?.('Generating peak visuals...');

  // Step 2: Generate visuals for high-intensity peaks (parallel)
  const highIntensityPeaks = plan.emotionalPeaks?.filter((p) => p.intensity > 0.7) || [];

  const peakVisuals: PeakVisual[] = [];

  if (highIntensityPeaks.length > 0) {
    // Limit to 5 peak visuals to manage API costs
    const peaksToGenerate = highIntensityPeaks.slice(0, 5);

    const visualPromises = peaksToGenerate.map(async (peak) => {
      try {
        // Check for abort before each peak generation
        throwIfAborted(signal);
        const asset = await gemini.generatePeakVisual(peak, lyrics, plan.mood, aspectRatio, signal);
        return {
          peakId: peak.id,
          lyricIndices: [peak.lyricIndex],
          asset,
          transitionIn: 'fade' as const,
          transitionOut: 'fade' as const,
        };
      } catch (error) {
        // Re-throw abort errors
        if (isAbortError(error)) {
          throw error;
        }
        console.warn(`Failed to generate visual for peak ${peak.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(visualPromises);
    const validResults = results.filter((v) => v !== null) as PeakVisual[];
    peakVisuals.push(...validResults);
  }

  // Return plan with generated assets
  const planWithAssets: VideoPlan = {
    ...plan,
    hybridVisuals: {
      sharedBackground,
      peakVisuals,
    },
    status: 'applied',
  };

  onProgress?.('Assets generated!');

  return planWithAssets;
};

/**
 * Regenerate a single peak visual
 */
export const regeneratePeakVisual = async (
  peak: EmotionalPeak,
  lyrics: LyricLine[],
  plan: VideoPlan,
  aspectRatio: AspectRatio = '16:9',
  signal?: AbortSignal
): Promise<PeakVisual> => {
  throwIfAborted(signal);
  const asset = await gemini.generatePeakVisual(peak, lyrics, plan.mood, aspectRatio, signal);

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
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<VideoPlan> => {
  throwIfAborted(signal);
  onProgress?.(`Modifying plan: "${instruction}"...`);

  const modifiedPlan = await gemini.modifyVideoPlan(currentPlan, instruction, signal);

  onProgress?.('Plan updated!');

  return modifiedPlan;
};

/**
 * Quick analysis without full plan generation
 * Useful for getting initial feedback before committing to full plan
 */
export const quickAnalysis = async (
  audioFile: File,
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<{
  genre: Genre;
  mood: string;
  confidence: number;
  suggestedStyle: string;
}> => {
  throwIfAborted(signal);
  onProgress?.('Quick analysis...');

  const result = await gemini.detectMusicGenre(audioFile, signal);

  return {
    genre: result.genre,
    mood: result.mood,
    confidence: result.confidence,
    suggestedStyle: result.suggestedStyle,
  };
};
