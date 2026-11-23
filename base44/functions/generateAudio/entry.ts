import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { prompt, duration = 10, type = 'music' } = await req.json();
        const hfKey = Deno.env.get('HUGGINGFACE_API_KEY');
        
        if (!hfKey) {
            return Response.json({ error: 'HuggingFace API Key not configured' }, { status: 500 });
        }

        // Define model lists with fallbacks
        const models = type === 'sfx' 
            ? ['facebook/musicgen-small', 'facebook/musicgen-medium'] // MusicGen handles SFX prompts reasonably well
            : ['facebook/musicgen-small', 'facebook/musicgen-medium'];

        let lastError = null;
        let audioBase64 = null;

        for (const model of models) {
            try {
                console.log(`Trying model: ${model} for ${type}`);
                const response = await fetch(
                    `https://router.huggingface.co/models/${model}`,
                    {
                        headers: {
                            Authorization: `Bearer ${hfKey}`,
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({ 
                            inputs: prompt,
                            parameters: {
                                duration: Math.min(duration, 15) // Limit to 15s to reduce timeouts on free tier
                            }
                        }),
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`Model ${model} failed: ${response.status} - ${errText}`);
                    // If model is loading (503), we could wait, but for now we fallback
                    throw new Error(`HF Error (${model}): ${errText}`);
                }

                const audioBlob = await response.blob();
                if (audioBlob.size < 100) throw new Error("Audio too small, likely error");
                
                const arrayBuffer = await audioBlob.arrayBuffer();
                audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                
                if (audioBase64) break; // Success

            } catch (e) {
                lastError = e;
                continue; // Try next model
            }
        }

        if (!audioBase64) {
            throw lastError || new Error("All audio generation models failed");
        }

        return Response.json({ 
            audioBase64: audioBase64,
            contentType: 'audio/flac' 
        }, {
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Audio generation error:', error);
        return Response.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});