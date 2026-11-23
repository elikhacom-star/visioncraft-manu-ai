/**
 * Schedules voiceover playback during video assembly.
 *
 * Audio blobs from the TTS backend are at natural speed (1.0x).
 * Both speed and pitch are applied here via playbackRate.
 * playbackRate = speed * pitch (combined effect).
 *
 * For browser-native TTS blobs (marked with _browserTTS), the audio blob
 * is silent — the actual speech is played live via speechSynthesis during
 * recording, timed to match the scene schedule.
 */
export async function scheduleVoiceovers({
    images, voiceoverData, audioContext, recordStartTime,
    audioDestination, activeAudioSources, voiceoverVolume,
    selectedVoice, speechPitch, speechSpeed, VOICES
}) {
    let voScheduleTime = 0;
    const voiceConfigLocal = VOICES.find((v) => v.id === selectedVoice);
    const basePitch = voiceConfigLocal ? voiceConfigLocal.pitch : 1.0;
    const baseSpeedAdj = voiceConfigLocal ? voiceConfigLocal.speedAdj : 1.0;
    const userPitch = speechPitch[0];
    const userSpeed = speechSpeed[0];
    // Combined playback rate: user speed * voice base speed * user pitch * voice base pitch
    const finalRate = userSpeed * baseSpeedAdj * userPitch * basePitch;

    console.log(`[VoiceoverScheduler] speed=${userSpeed}, speedAdj=${baseSpeedAdj}, pitch=${userPitch}, basePitch=${basePitch}, finalRate=${finalRate.toFixed(3)}`);

    for (let i = 0; i < images.length; i++) {
        const voiceData = voiceoverData[i];
        const sceneDuration = images[i].duration || 5;

        if (voiceData && voiceData.audioBlob && voiceData.audioBlob.size > 0) {
            const blob = voiceData.audioBlob;

            // --- Browser-native TTS blob (silent placeholder) ---
            // speechSynthesis audio cannot be routed into MediaRecorder.
            // These blobs are silent; the real audio was handled upstream
            // by converting to backend TTS before assembly. Skip silently.
            if (blob._browserTTS || blob.provider === 'browser_native') {
                console.log(`[VoiceoverScheduler] Scene ${i + 1}: native TTS placeholder (speech will play through speakers but not in video track)`);
                // Play speech through speakers so user hears it during render
                const ttsText = blob._ttsText || voiceData.dialogue || '';
                if (ttsText) {
                    const delayMs = Math.max(0, (recordStartTime + voScheduleTime - audioContext.currentTime) * 1000);
                    setTimeout(() => {
                        try {
                            const utter = new SpeechSynthesisUtterance(ttsText);
                            const allVoices = window.speechSynthesis?.getVoices() || [];
                            const mv = allVoices.find(v => v.name === (blob._ttsVoiceName || ''));
                            if (mv) { utter.voice = mv; utter.lang = mv.lang; } else { utter.lang = blob._ttsLang || 'en'; }
                            utter.rate = Math.max(0.1, Math.min(10, blob._ttsSpeed || 1));
                            utter.pitch = Math.max(0, Math.min(2, blob._ttsPitch || 1));
                            utter.volume = voiceoverVolume;
                            window.speechSynthesis?.cancel();
                            window.speechSynthesis?.speak(utter);
                        } catch (e) { console.warn('Live TTS preview failed', e); }
                    }, delayMs);
                }
            } else {
                // --- Standard audio blob: decode and schedule via AudioContext ---
                try {
                    const blobClone = blob.slice(0, blob.size, blob.type);
                    const arrayBuffer = await blobClone.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;

                    const voGain = audioContext.createGain();
                    voGain.gain.value = voiceoverVolume;
                    source.connect(voGain);
                    voGain.connect(audioDestination);

                    source.playbackRate.value = finalRate;
                    if (source.preservesPitch !== undefined) source.preservesPitch = false;

                    source.start(recordStartTime + voScheduleTime);
                    activeAudioSources.push(source);
                    console.log(`Voiceover scene ${i + 1} at ${(recordStartTime + voScheduleTime).toFixed(2)}s, rate=${finalRate.toFixed(2)}`);
                } catch (error) {
                    console.error('Failed to schedule voiceover for scene', i + 1, error);
                }
            }
        }
        voScheduleTime += sceneDuration;
    }
}