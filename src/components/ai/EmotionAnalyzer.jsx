/**
 * EmotionAnalyzer — Uses LLM to tag each scene with an emotion label.
 * Called at two moments:
 *   1. After storyboard generation (enriches storyboard scenes)
 *   2. Before voiceover generation (enriches voiceover params)
 */

import { base44 } from "@/api/base44Client";
import { EMOTION_LABELS } from './EmotionVoiceMap';

const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);

/**
 * Analyze an array of scenes and return an emotion label per scene.
 * @param {Array} scenes — [{description, dialogue, mood, ...}]
 * @returns {Promise<string[]>} — array of emotion labels aligned with input
 */
export async function analyzeSceneEmotions(scenes) {
  if (!scenes || scenes.length === 0) return [];

  const sceneSummaries = scenes.map((s, i) =>
    `Scene ${i + 1}: Visual="${s.visual_description || s.description || ''}" Dialogue="${s.dialogue || ''}" Mood="${s.mood || ''}"`
  ).join('\n');

  const prompt = `You are an expert film emotion analyst. For each scene below, assign EXACTLY ONE primary emotion label from this list:
${EMOTION_LABELS.join(', ')}

Scenes:
${sceneSummaries}

Return a JSON object with an "emotions" array of strings, one per scene, in order. Use ONLY labels from the list above.`;

  const result = await InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        emotions: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  });

  if (result?.emotions && result.emotions.length === scenes.length) {
    // Validate each label is in our set
    return result.emotions.map(e => {
      const normalized = String(e).toLowerCase().trim();
      return EMOTION_LABELS.includes(normalized) ? normalized : 'calm';
    });
  }

  // Fallback: default all to calm
  return scenes.map(() => 'calm');
}