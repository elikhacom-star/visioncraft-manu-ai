/**
 * Creates voiceover entries for native-voice mode.
 *
 * Uses the backend Google TTS (free, no API key needed) to generate real
 * audio blobs that can be encoded into the video. The browser speechSynthesis
 * is great for live preview but its audio cannot be routed into MediaRecorder.
 *
 * Falls back to tagged silent blobs (for live playback only) if backend fails.
 */
import { base44 } from '@/api/base44Client';

function cleanDialogue(raw) {
  return (raw || '')
    .replace(/^[""]?\s*(Narrateur|Narratrice|Narrator|Voix\s*off|Voice\s*over|Présentateur|Host|Personne|Person|Personnage|Character|Speaker|Intervenant)\s*\d*\s*:\s*/i, '')
    .replace(/\s*Durée\s*:\s*\d+\s*"?\s*$/i, '')
    .replace(/^["'""\s]+/, '')
    .replace(/["'""\s]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function generateBackendAudio(text, lang, speed) {
  const response = await base44.functions.invoke('textToSpeech', {
    text,
    language: lang || 'fr',
    gender: 'female',
    voice: 'google_fallback',
    speed: speed || 1.0,
    use_elevenlabs: false
  });
  if (response.data?.audioBase64) {
    const bin = window.atob(response.data.audioBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/mpeg' });
  }
  return null;
}

export async function createNativeVoiceovers(scenes, { langForTTS, speed, pitch, voiceName }, onProgress) {
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const dialogue = cleanDialogue(scene.dialogue);
    const dur = scene.duration || 5;

    let audioBlob = null;
    if (dialogue) {
      try {
        audioBlob = await generateBackendAudio(dialogue, langForTTS, speed);
        if (onProgress) onProgress(i, scenes.length);
      } catch (e) {
        console.warn(`Backend TTS failed for scene ${i + 1}, no audio:`, e);
      }
    }

    results.push({
      scene_number: scene.scene_number,
      dialogue,
      duration: dur,
      language: langForTTS,
      wordTimings: [],
      audioBlob,
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null
    });
  }
  return results;
}