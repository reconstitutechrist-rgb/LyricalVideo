// Import types to get Window augmentation for webkitAudioContext
import '../types';

export const decodeAudio = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  return audioBuffer;
};
