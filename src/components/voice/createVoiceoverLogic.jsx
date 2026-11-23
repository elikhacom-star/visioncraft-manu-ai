import { base44 } from "@/api/base44Client";
const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);
import { enrichWithEmotions, getSceneEmotionStyle } from '../storyboard/VoiceoverCreator';

/**
 * Parallelize a list of async tasks with a max concurrency.
 * Returns results in the SAME ORDER as the input array.
 * - Zero external deps (no p-limit needed).
 * - Lightweight (~20 lines).
 */
async function parallelLimit(tasks, concurrency) {
  const results = new Array(tasks.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Clean dialogue by stripping common speaker prefixes used in the script editor.
 * Centralized so both the success path and the fallback path use the exact same regex.
 */
function cleanDialogue(raw) {
  return (raw || '')
    .replace(/^["""]?\s*(Narrateur|Narratrice|Narrator|Voix\s*off|Voice\s*over|Pr[ée]sentateur|Host|Personne|Person|Personnage|Character|Speaker|Intervenant)\s*\d*\s*:\s*/i, '')
    .replace(/\s*Dur[ée]e\s*:\s*\d+\s*"?\s*$/i, '')
    .replace(/^["'""\s]+/, '')
    .replace(/["'""\s]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function createVoiceoverLogic({
  storyboardData, images, language, uiLanguage, ttsMode, speechSpeed, speechPitch,
  nativeVoiceName, selectedVoice, voiceSettings, VOICES, generateSpeechAudio, assembleVideo,
  setCurrentTask, setProgress, setError, setIsProcessing, setCurrentStep,
  setVoiceovers, setAudioData, script, exportOptions = {}
}) {
  setCurrentTask('Generating voiceovers...');
  await enrichWithEmotions(storyboardData, images, setCurrentTask);

  if (!storyboardData?.scenes?.length) {
    setError('Storyboard data is missing.');
    setIsProcessing(false);
    setCurrentStep(1);
    setProgress(0);
    return;
  }

  try {
    const scenes = storyboardData.scenes || [];
    const langForTTS = language || uiLanguage || 'en';

    // ── Native TTS branch (unchanged) ──────────────────────────────
    if (ttsMode === 'native') {
      const { createNativeVoiceovers } = await import('./NativeVoiceoverFactory');
      const nVO = await createNativeVoiceovers(
        scenes,
        { langForTTS, speed: speechSpeed[0], pitch: speechPitch[0], voiceName: nativeVoiceName },
        (i, total) => {
          setProgress(50 + (i / total) * 25);
          setCurrentTask(`Voix native sc[èe]ne ${i + 1}/${total}...`);
        }
      );
      setVoiceovers(nVO);
      setAudioData(nVO);
      setProgress(75);
      setCurrentStep(5);
      await assembleVideo(images, nVO, exportOptions);
      return;
    }

    // ── Generation parameters (hoisted so each task closes over the same values) ──
    const speed = speechSpeed[0];
    const pitch = speechPitch[0];

    /**
     * Build the voiceover record for a single scene.
     * Self-contained: takes the scene + its index, returns the final object.
     */
    const buildTask = (scene, i) => async () => {
      // Throttled progress callback (called once per scene starting)
      setCurrentTask(`Generating voiceover ${i + 1} of ${scenes.length}...`);
      setProgress(50 + (i / scenes.length) * 25);

      const cleanedDlg = cleanDialogue(scene.dialogue);

      // Empty dialogue → still produce a record so the array length matches scenes
      if (!cleanedDlg) {
        return {
          scene_number: scene.scene_number,
          dialogue: '',
          duration: scene.duration || 5,
          language,
          wordTimings: [],
          audioBlob: null,
          audioUrl: null
        };
      }

      try {
        // ── Happy path: LLM optimization + TTS ──
        const sceneEmo = getSceneEmotionStyle(scene.emotion_label || 'calm');
        const voiceResult = await InvokeLLM({
          prompt: `Optimize this narration for ${sceneEmo} speech synthesis in ${langForTTS}:\n\nText: "${cleanedDlg}"\n\nProvide: optimized_text (clean text only), estimated_duration, word_timings [{word,start_time,end_time}], phonetic_markers.`,
          response_json_schema: {
            type: 'object',
            properties: {
              optimized_text: { type: 'string' },
              estimated_duration: { type: 'number' },
              word_timings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    word: { type: 'string' },
                    start_time: { type: 'number' },
                    end_time: { type: 'number' }
                  }
                }
              },
              phonetic_markers: { type: 'array', items: { type: 'string' } }
            }
          }
        });

        const wordTimings =
          voiceResult?.word_timings?.length > 0
            ? voiceResult.word_timings
            : createFallbackTimings(scene.dialogue);

        const finalText = voiceResult?.optimized_text || cleanedDlg;
        const audioBlob = await generateSpeechAudio(finalText, langForTTS);
        const { exactDuration, effectiveDuration } = await calcAudioDuration(
          audioBlob, selectedVoice, speechSpeed, speechPitch, VOICES
        );
        const finalDuration = Math.max(scene.duration || 5, effectiveDuration || exactDuration);

        if (images[i]) images[i].duration = finalDuration;

        return {
          scene_number: scene.scene_number,
          dialogue: finalText,
          duration: finalDuration,
          estimated_duration: voiceResult?.estimated_duration || scene.duration || 5,
          language,
          wordTimings,
          audioBlob,
          audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null
        };
      } catch (error) {
        // ── Fallback path: no LLM optimization, just TTS ──
        console.warn(`[voiceover] scene ${i + 1} fell back after LLM/TTS error:`, error?.message || error);
        const wordTimings = createFallbackTimings(cleanedDlg);
        const audioBlob = await generateSpeechAudio(cleanedDlg, langForTTS);
        const { exactDuration, effectiveDuration } = await calcAudioDuration(
          audioBlob, selectedVoice, speechSpeed, speechPitch, VOICES
        );
        const finalDuration = Math.max(scene.duration || 5, effectiveDuration || exactDuration);

        if (images[i]) images[i].duration = finalDuration;

        return {
          scene_number: scene.scene_number,
          dialogue: cleanedDlg,
          duration: finalDuration,
          language,
          wordTimings,
          audioBlob,
          audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null
        };
      }
    };

    // Build all tasks up-front so concurrency is truly 3
    const tasks = scenes.map((scene, i) => buildTask(scene, i));

    // Run 3 in parallel — preserves order, fails gracefully per-scene
    // (errors are caught inside buildTask, so a single failure doesn't abort the others)
    const voiceoverData = await parallelLimit(tasks, 3);

    // ── Continue with assembly (unchanged) ──
    setVoiceovers(voiceoverData);
    setAudioData(voiceoverData);
    import('../AudioCreationSaver')
      .then(m => m.saveAudioCreations(voiceoverData, { language: langForTTS, voice: selectedVoice, scriptPreview: script }))
      .catch(() => {});
    setProgress(75);
    setCurrentStep(5);
    await assembleVideo(images, voiceoverData, exportOptions);
  } catch (err) {
    console.error('Voiceover generation error:', err);
    setError('Failed to generate voiceovers.');
    setIsProcessing(false);
  }
}

function createFallbackTimings(text) {
  const words = (text || '').split(' ').filter(w => w.length > 0);
  let ct = 0;
  return words
    .map(word => {
      const cw = word.replace(/[^\w'-]/g, '');
      const d = cw.length > 0 ? 1 / 2.2 : 0;
      const st = ct;
      const et = st + d;
      ct = et;
      return { word: cw, start_time: st, end_time: et };
    })
    .filter(wt => wt.word.length > 0);
}

async function calcAudioDuration(audioBlob, selectedVoice, speechSpeed, speechPitch, VOICES) {
  let exactDuration = 0,
    effectiveDuration = 0;
  if (audioBlob) {
    try {
      const tc = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await audioBlob.slice(0, audioBlob.size, audioBlob.type).arrayBuffer();
      const buf = await tc.decodeAudioData(ab);
      exactDuration = buf.duration;
      tc.close();
    } catch (e) {
      /* keep exactDuration = 0 */
    }
    const vc = VOICES.find(v => v.id === selectedVoice);
    const cr = speechSpeed[0] * (vc?.speedAdj || 1.0) * speechPitch[0] * (vc?.pitch || 1.0);
    effectiveDuration = cr > 0 ? exactDuration / cr : exactDuration;
  }
  return { exactDuration, effectiveDuration };
}
