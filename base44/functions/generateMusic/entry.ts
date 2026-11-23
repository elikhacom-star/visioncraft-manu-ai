import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
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

        const { prompt, duration } = await req.json();
        const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");

        if (!hfKey) {
            return Response.json({ error: "Hugging Face API Key not configured" }, { status: 500 });
        }

        console.log(`[MusicGen] Generating music for: "${prompt}" (${duration}s)`);

        // Using Facebook's MusicGen Small via Hugging Face Inference API
        // Try multiple endpoint formats for resilience
        const endpoints = [
            "https://api-inference.huggingface.co/models/facebook/musicgen-small",
            "https://router.huggingface.co/hf-inference/models/facebook/musicgen-small",
        ];
        
        let response = null;
        let lastError = null;
        
        for (const modelUrl of endpoints) {
            try {
                console.log(`[MusicGen] Trying endpoint: ${modelUrl}`);
                const resp = await fetch(modelUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${hfKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: prompt
                    })
                });
                
                if (resp.ok) {
                    response = resp;
                    break;
                }
                
                const errText = await resp.text();
                lastError = `${resp.status} ${errText}`;
                console.warn(`[MusicGen] Endpoint ${modelUrl} failed: ${resp.status}`);
                
                // If model is loading, wait and retry once
                if (resp.status === 503) {
                    console.log("[MusicGen] Model loading, waiting 10s...");
                    await new Promise(r => setTimeout(r, 10000));
                    const retry = await fetch(modelUrl, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${hfKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ inputs: prompt })
                    });
                    if (retry.ok) {
                        response = retry;
                        break;
                    }
                }
            } catch (e) {
                lastError = e.message;
                console.warn(`[MusicGen] Endpoint ${modelUrl} error:`, e.message);
            }
        }
        
        if (!response) {
            throw new Error(`MusicGen API Error: ${lastError}`);
        }

        if (!response.ok) {
            throw new Error(`MusicGen API Error: ${response.status} ${await response.text()}`);
        }

        const audioBuf = await response.arrayBuffer();
        const audioBase64 = btoa(new Uint8Array(audioBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));

        return Response.json({
            success: true,
            audioBase64: audioBase64,
            contentType: "audio/flac" // MusicGen usually returns FLAC or WAV
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        console.error("MusicGen Error:", error);
        return Response.json({ success: false, error: error.message }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});