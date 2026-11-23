/**
 * SmartSFXAutoGenerator — Generates ambient sound effects per scene
 * using Web Audio API oscillators based on scene emotion/description.
 * No external API needed.
 */
import { generateProceduralAudio } from '../proceduralAudio';

const EMOTION_SFX_MAP = {
  dramatic: { type: 'ambient', subtype: 'tension', duration: 8 },
  urgent: { type: 'ambient', subtype: 'pulse', duration: 5 },
  calm: { type: 'ambient', subtype: 'wind', duration: 10 },
  joyful: { type: 'ambient', subtype: 'chime', duration: 6 },
  melancholic: { type: 'ambient', subtype: 'rain', duration: 10 },
  suspenseful: { type: 'ambient', subtype: 'tension', duration: 8 },
  romantic: { type: 'ambient', subtype: 'soft', duration: 8 },
  epic: { type: 'ambient', subtype: 'rumble', duration: 10 },
  mysterious: { type: 'ambient', subtype: 'wind', duration: 8 },
  angry: { type: 'ambient', subtype: 'pulse', duration: 5 },
};

const KEYWORD_SFX = [
  { keywords: ['rain', 'pluie', 'storm', 'tempête', 'orage'], sfx: 'rain' },
  { keywords: ['wind', 'vent', 'breeze'], sfx: 'wind' },
  { keywords: ['crowd', 'foule', 'people', 'gens', 'city', 'ville', 'urban'], sfx: 'crowd' },
  { keywords: ['nature', 'forest', 'forêt', 'bird', 'oiseau'], sfx: 'nature' },
  { keywords: ['ocean', 'mer', 'sea', 'wave', 'vague', 'water', 'eau'], sfx: 'water' },
  { keywords: ['fire', 'feu', 'flame', 'burn'], sfx: 'fire' },
  { keywords: ['night', 'nuit', 'dark', 'sombre', 'silence'], sfx: 'night' },
  { keywords: ['car', 'voiture', 'traffic', 'road', 'route'], sfx: 'traffic' },
];

function detectSFXType(scene) {
  const text = `${scene.description || ''} ${scene.mood || ''} ${scene.dialogue || ''}`.toLowerCase();
  
  for (const entry of KEYWORD_SFX) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      return entry.sfx;
    }
  }
  
  const emotion = scene.emotion_label || 'calm';
  return EMOTION_SFX_MAP[emotion]?.subtype || 'wind';
}

/**
 * Generate SFX audio tracks for each scene using Web Audio API
 */
export async function generateAutoSFX(scenes) {
  const tracks = [];
  let offset = 0;
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sfxType = detectSFXType(scene);
    const duration = Math.min(scene.duration || 5, 15);
    
    try {
      const blob = await generateProceduralAudio(sfxType, duration);
      if (blob && blob.size > 0) {
        const file = new File([blob], `sfx_scene${i + 1}_${sfxType}.wav`, { type: 'audio/wav' });
        tracks.push({
          name: `SFX Scène ${i + 1} (${sfxType})`,
          type: 'sfx',
          volume: 0.15,
          ducking: true,
          fadeIn: 0.5,
          fadeOut: 0.5,
          file,
          startOffset: offset,
          duration
        });
      }
    } catch (e) {
      console.warn(`SFX generation failed for scene ${i + 1}:`, e);
    }
    
    offset += scene.duration || 5;
  }
  
  return tracks;
}