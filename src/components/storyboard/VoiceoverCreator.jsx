/**
 * VoiceoverCreator — Extracted voiceover generation logic from Home.js
 * Handles emotion analysis (Moment 2: pre-voice) and TTS generation per scene.
 */
import { base44 } from "@/api/base44Client";
import { analyzeSceneEmotions } from '../ai/EmotionAnalyzer';
import { getVoiceForEmotion } from '../ai/EmotionVoiceMap';
import { cleanDialogue } from '../DialogueCleaner';

const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);

/**
 * Run pre-voice emotion analysis and enrich scenes + images with labels.
 */
export async function enrichWithEmotions(storyboardData, images, setCurrentTask) {
  const scenes = storyboardData.scenes || [];
  try {
    if (setCurrentTask) setCurrentTask('Analyse émotionnelle des scènes...');
    const emotions = await analyzeSceneEmotions(scenes);
    storyboardData.scenes = scenes.map((s, i) => ({
      ...s,
      emotion_label: emotions[i] || s.emotion_label || 'calm'
    }));
    emotions.forEach((emo, i) => {
      if (images[i]) images[i].emotion_label = emo;
    });
  } catch (e) {
    console.warn("Pre-voice emotion analysis failed:", e);
  }
}

/**
 * Determine the expressive TTS style based on emotion label.
 */
export function getSceneEmotionStyle(emotionLabel) {
  const map = {
    dramatic: 'passionate',
    epic: 'passionate',
    melancholic: 'gentle and melancholic',
    joyful: 'enthusiastic',
    calm: 'soothing',
    urgent: 'intense and urgent',
    angry: 'intense and urgent',
    suspenseful: 'suspenseful and tense',
    romantic: 'soft and intimate',
    mysterious: 'mysterious and intriguing',
  };
  return map[emotionLabel] || 'engaging';
}

/**
 * Build an optimized voice prompt for a scene with emotion awareness.
 */
export function buildVoicePrompt(cleanedDlg, emotionLabel, langForTTS) {
  const sceneEmo = getSceneEmotionStyle(emotionLabel);
  return `Optimize this narration for ${sceneEmo} speech synthesis in ${langForTTS}:\n\nText: "${cleanedDlg}"\n\nProvide: optimized_text (clean text only, no prefixes), estimated_duration, word_timings [{word,start_time,end_time}], phonetic_markers.`;
}