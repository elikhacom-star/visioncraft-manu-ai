/**
 * EmotionVoiceMap — Maps detected emotions to premium voice IDs and TTS parameters.
 * Used by both StoryboardGenerator (at storyboard time) and VoiceStudio (at pre-voice time).
 */

// Canonical emotion labels the AI analyzer outputs
export const EMOTION_LABELS = [
  'dramatic', 'urgent', 'calm', 'joyful', 'melancholic',
  'suspenseful', 'romantic', 'epic', 'mysterious', 'angry'
];

// Per-emotion TTS tuning (pitch multiplier, speed multiplier, stability, style)
const EMOTION_TTS_PARAMS = {
  dramatic:    { pitch: 0.88, speed: 0.92, stability: 0.35, style: 0.6, emotionKey: 'sad' },
  urgent:      { pitch: 1.05, speed: 1.18, stability: 0.25, style: 0.7, emotionKey: 'angry' },
  calm:        { pitch: 0.95, speed: 0.88, stability: 0.7,  style: 0.2, emotionKey: 'neutral' },
  joyful:      { pitch: 1.08, speed: 1.08, stability: 0.45, style: 0.5, emotionKey: 'happy' },
  melancholic: { pitch: 0.85, speed: 0.85, stability: 0.55, style: 0.4, emotionKey: 'sad' },
  suspenseful: { pitch: 0.92, speed: 0.95, stability: 0.3,  style: 0.65, emotionKey: 'neutral' },
  romantic:    { pitch: 0.96, speed: 0.9,  stability: 0.6,  style: 0.35, emotionKey: 'neutral' },
  epic:        { pitch: 0.82, speed: 0.9,  stability: 0.3,  style: 0.75, emotionKey: 'angry' },
  mysterious:  { pitch: 0.9,  speed: 0.88, stability: 0.4,  style: 0.5, emotionKey: 'neutral' },
  angry:       { pitch: 0.95, speed: 1.12, stability: 0.2,  style: 0.8, emotionKey: 'angry' },
};

// Recommended voice IDs per language × gender for premium voices
const PREMIUM_VOICE_IDS = {
  male: {
    en: 'en-US-Story',     // Daniel — Deep Narrative
    fr: 'fr-FR-M2',        // Alexandre — Cinéma
    ar: 'ar-XA-Poet',      // Hakawati — Storyteller
    es: 'es-ES-M2',        // Javier — Professional
    de: 'de-DE-M2',        // Jonas — Documentary
    it: 'it-IT-M2',        // Lorenzo — Cinema
    ja: 'ja-JP-M2',        // Ren — Deep
  },
  female: {
    en: 'en-US-F',         // Sarah
    fr: 'fr-FR-F',         // Chloé
    ar: 'ar-XA-F',         // Fatima
    es: 'es-ES-F',         // Sofia
    de: 'de-DE-F',         // Hanna
    it: 'it-IT-F',         // Isabella
    ja: 'ja-JP-F',         // Sakura
  }
};

/**
 * Given an emotion label, gender and language, returns the recommended
 * voice ID + TTS parameters to pass to the speech engine.
 */
export function getVoiceForEmotion(emotion, gender = 'male', lang = 'en') {
  const params = EMOTION_TTS_PARAMS[emotion] || EMOTION_TTS_PARAMS.calm;
  const langKey = String(lang || 'en').slice(0, 2).toLowerCase();
  const genderKey = gender === 'female' ? 'female' : 'male';
  const voiceId = PREMIUM_VOICE_IDS[genderKey]?.[langKey] || PREMIUM_VOICE_IDS[genderKey]?.en;

  return {
    voiceId,
    emotion: params.emotionKey,
    pitch: params.pitch,
    speed: params.speed,
    stability: params.stability,
    style: params.style,
  };
}

/**
 * Utility: get color & icon for an emotion badge
 */
export function getEmotionStyle(emotion) {
  const styles = {
    dramatic:    { color: 'bg-red-100 text-red-700 border-red-200',        icon: '🎭' },
    urgent:      { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🚨' },
    calm:        { color: 'bg-sky-100 text-sky-700 border-sky-200',         icon: '🧘' },
    joyful:      { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '😊' },
    melancholic: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '😢' },
    suspenseful: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '😰' },
    romantic:    { color: 'bg-pink-100 text-pink-700 border-pink-200',      icon: '💕' },
    epic:        { color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: '⚔️' },
    mysterious:  { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: '🔮' },
    angry:       { color: 'bg-rose-100 text-rose-700 border-rose-200',      icon: '😡' },
  };
  return styles[emotion] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '😐' };
}