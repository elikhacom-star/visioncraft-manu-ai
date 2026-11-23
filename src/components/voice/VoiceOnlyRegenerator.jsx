/**
 * Handles voice-only regeneration: regenerates audio for all scenes
 * using explicit voice parameters (bypasses stale React state).
 */
export async function regenerateVoiceOnly({
  generatedImages,
  voiceParams, // { voice, speed, pitch }
  voiceSettings,
  voices,
  language,
  uiLanguage,
  generateSpeechAudio,
  onProgress,
  onTask,
}) {
  const langForTTS = language || uiLanguage || 'en';
  const { voice, speed, pitch } = voiceParams;

  // Build settings override so generateSpeechAudio uses the NEW voice, not React state
  const voiceConfig = voices.find(v => v.id === voice);
  const voiceOverride = {
    voiceId: voice,
    speed: speed[0],
    pitch: pitch[0],
    stability: voiceSettings.stability,
    similarity: voiceSettings.similarity,
    style: voiceSettings.style,
    emotional_style: voiceSettings.emotional_style || 'neutral',
    speaking_style: voiceSettings.speaking_style || 'narrative',
    gender: voiceConfig ? (voiceConfig.gender || '').toLowerCase() : undefined,
  };

  const newVoiceovers = [];
  const updatedImages = [...generatedImages];

  for (let i = 0; i < generatedImages.length; i++) {
    const img = generatedImages[i];
    const cleanedDlg = (img.dialogue || '')
      .replace(/^[""]?\s*(Narrateur|Narratrice|Narrator|Voix\s*off|Voice\s*over|Présentateur|Host|Personne|Person|Personnage|Character|Speaker|Intervenant)\s*\d*\s*:\s*/i, '')
      .replace(/\s*Durée\s*:\s*\d+\s*"?\s*$/i, '')
      .replace(/^["'""\s]+/, '').replace(/["'""\s]+$/, '')
      .replace(/\s{2,}/g, ' ').trim();

    if (cleanedDlg) {
      onTask?.(`Régénération voix scène ${i + 1} / ${generatedImages.length}...`);
      onProgress?.(40 + (i / generatedImages.length) * 35);

      const audioBlob = await generateSpeechAudio(cleanedDlg, langForTTS, voiceOverride);

      let effectiveDuration = img.duration || 5;
      if (audioBlob) {
        try {
          const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
          const ab = await audioBlob.slice(0, audioBlob.size, audioBlob.type).arrayBuffer();
          const buf = await tempCtx.decodeAudioData(ab);
          const rawDur = buf.duration;
          tempCtx.close();
          // Speed and pitch are both applied client-side via playbackRate.
          // effectiveDuration = rawDuration / (speed * pitch)
          const combinedRate = speed[0] * pitch[0];
          effectiveDuration = Math.max(img.duration || 5, combinedRate > 0 ? rawDur / combinedRate : rawDur);
        } catch (e) { console.warn("Duration calc failed:", e); }
      }

      updatedImages[i] = { ...img, duration: effectiveDuration };
      newVoiceovers.push({
        scene_number: img.scene_number,
        dialogue: cleanedDlg,
        duration: effectiveDuration,
        language: langForTTS,
        wordTimings: [],
        audioBlob,
        audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
      });
    } else {
      newVoiceovers.push({
        scene_number: img.scene_number, dialogue: '', duration: img.duration || 5,
        language: langForTTS, wordTimings: [], audioBlob: null, audioUrl: null,
      });
    }
  }

  return { updatedImages, newVoiceovers };
}