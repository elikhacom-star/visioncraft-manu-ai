import { base44 } from "@/api/base44Client";

/**
 * Saves voiceover audio blobs as AudioCreation entity records.
 * Call after voiceover generation completes.
 */
export async function saveAudioCreations(voiceoverData, { language, voice, scriptPreview }) {
    for (const vo of voiceoverData) {
        if (vo.audioBlob && vo.audioBlob.size > 0 && vo.dialogue) {
            try {
                const file = new File(
                    [vo.audioBlob],
                    `voiceover_${vo.scene_number}_${Date.now()}.mp3`,
                    { type: 'audio/mpeg' }
                );
                const uploadRes = await base44.integrations.Core.UploadFile({ file });
                if (uploadRes?.file_url) {
                    await base44.entities.AudioCreation.create({
                        title: `Scène ${vo.scene_number}`,
                        source_text: vo.dialogue,
                        language: language || '',
                        voice: voice || '',
                        provider: vo.audioBlob.provider || 'unknown',
                        audio_url: uploadRes.file_url,
                        duration_seconds: vo.duration || 0,
                        project_name: (scriptPreview || '').substring(0, 60)
                    });
                }
            } catch (e) {
                console.warn("Failed to save audio creation:", e);
            }
        }
    }
}