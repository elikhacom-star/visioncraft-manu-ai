import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { audioBase64, mimeType } = body;
        if (!audioBase64) {
            return Response.json({ error: 'Missing audioBase64 parameter' }, { status: 400 });
        }

        // Decode base64 to binary
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const contentType = mimeType || "audio/wav";

        // Upload as a generic file with a supported extension
        // InvokeLLM supports images and some file types — we try uploading as a blob
        const blob = new Blob([bytes], { type: contentType });
        // Use .mp3 extension as it's most commonly supported
        const file = new File([blob], `transcription_audio.mp3`, { type: "audio/mpeg" });
        
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        if (!file_url) {
            return Response.json({ error: "Échec de l'upload audio" }, { status: 500 });
        }

        // Use Gemini to transcribe the uploaded audio file
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Transcribe the following audio file accurately and completely. Output the full transcription text organized by natural sentence breaks. Return JSON with "full_text" (complete transcription) and "segments" array where each segment has "text" (transcribed sentence) and "estimated_duration" (estimated seconds for that segment based on word count, roughly 2.5 words per second).`,
            file_urls: [file_url],
            model: "gemini_3_flash",
            response_json_schema: {
                type: "object",
                properties: {
                    full_text: { type: "string", description: "Complete transcription text" },
                    segments: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                text: { type: "string" },
                                estimated_duration: { type: "number" }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            full_text: result.full_text || "",
            segments: result.segments || []
        });
    } catch (error) {
        return Response.json({ error: error.message || "Erreur interne" }, { status: 500 });
    }
});