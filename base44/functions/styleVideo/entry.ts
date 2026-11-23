import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    // Handle CORS
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

        const { initImage, stylePrompt, strength, temporalConsistency } = await req.json();
        const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");

        console.log(`[Style-Video] Transforming video with style: "${stylePrompt}", Strength: ${strength}, Consistency: ${temporalConsistency}`);

        // Map strength (0.1-1.0) to Guidance Scale (5-20)
        // High strength = Higher guidance (strict adherence to style prompt)
        const guidanceScale = 5 + (strength * 15); 

        // Map temporal consistency (0.1-1.0) to Inference Steps (20-50)
        // Higher consistency usually requires more steps for stable diffusion to converge cleanly
        const steps = 20 + Math.floor(temporalConsistency * 30);

        const models = [
            "https://router.huggingface.co/models/cerspense/zeroscope_v2_xl", 
            "https://router.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b" 
        ];

        const finalPrompt = `${stylePrompt}, high quality, detailed, cinematic motion, ${temporalConsistency > 0.7 ? 'smooth transition, consistent, flicker-free' : 'dynamic'}`;
        const negativePrompt = "blurry, low quality, distortion, watermark, text, bad anatomy, flickering, choppy";

        let videoBase64 = null;

        if (hfKey) {
            for (const modelUrl of models) {
                try {
                    const inputs = {
                        inputs: finalPrompt,
                        parameters: {
                            negative_prompt: negativePrompt,
                            num_inference_steps: steps,
                            guidance_scale: guidanceScale
                        }
                    };

                    const response = await fetch(modelUrl, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${hfKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(inputs)
                    });

                    if (response.ok) {
                        const vidBuf = await response.arrayBuffer();
                        if (vidBuf.byteLength > 1000) {
                            videoBase64 = btoa(new Uint8Array(vidBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                            break;
                        }
                    }
                } catch (e) { console.error(e); }
            }
        }

        if (videoBase64) {
            return Response.json({
                success: true,
                videoBase64: videoBase64,
                contentType: "video/mp4"
            }, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        return Response.json({ 
            success: false, 
            error: "STYLE_GENERATION_FAILED" 
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});