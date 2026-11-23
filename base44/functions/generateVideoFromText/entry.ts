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

        const { prompt, negative_prompt, guidance_scale, num_frames, model, motion_bucket_id, interpolation, reference_image, style_preset, duration } = await req.json();
        const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");
        const stabilityKey = Deno.env.get("STABILITY_API_KEY");
        const falKey = Deno.env.get("FAL_KEY");

        console.log(`[Text-to-Video] Generative Request: "${prompt.substring(0, 50)}..." Model: ${model || 'Auto'} Style: ${style_preset || 'none'}`);

        // STYLE PRESETS - Apply visual style modifiers
        const styleModifiers = {
            'anime': 'anime style, vibrant colors, cel shading, Studio Ghibli inspired, Japanese animation, smooth lines',
            'cinematic': 'cinematic, film grain, dramatic lighting, anamorphic lens, Hollywood blockbuster quality, 24fps',
            'realistic': 'photorealistic, 8K UHD, hyperrealistic, natural lighting, DSLR quality, sharp focus',
            'cartoon': '3D Pixar style, cartoon, vibrant, playful, family friendly animation, smooth render',
            'noir': 'film noir, black and white, high contrast, dramatic shadows, 1940s detective style',
            'cyberpunk': 'cyberpunk, neon lights, futuristic city, rain, Blade Runner aesthetic, purple and cyan',
            'watercolor': 'watercolor painting style, soft edges, artistic, pastel colors, hand-painted look',
            'retro': 'retro 80s VHS aesthetic, scan lines, warm colors, vintage, synthwave',
            'fantasy': 'epic fantasy, magical, ethereal glow, Lord of the Rings inspired, mystical atmosphere',
            'documentary': 'documentary style, handheld camera, natural, authentic, journalistic'
        };

        // ENHANCE PROMPT WITH STYLE AND INTERPOLATION
        let enhancedPrompt = prompt;
        
        if (style_preset && styleModifiers[style_preset]) {
            enhancedPrompt = `${styleModifiers[style_preset]}, ${prompt}`;
        }
        
        if (interpolation === 'rife') {
            enhancedPrompt += ", high frame rate, smooth motion, fluid transition, RIFE flow";
        } else if (interpolation === 'film') {
            enhancedPrompt += ", cinematic frame interpolation, slow motion, FILM consistency";
        }

        // STABILITY AI (SVD) SUPPORT
        if (model === 'stability-svd' && stabilityKey) {
            try {
                console.log("[Text-to-Video] Using Stability AI (SVD)");
                // First generate an image from text to use as base for SVD
                // Or use text-to-video directly if available? Stability SVD is Image-to-Video.
                // Stability recently released Stable Video Diffusion which is I2V. 
                // For T2V, we need to generate an image first.
                
                let initImageBase64 = null;

                // 1. Determine Base Image (Reference or Generate New)
                if (reference_image) {
                    console.log("[Text-to-Video] Using Reference Image for SVD consistency");
                    try {
                        const refRes = await fetch(reference_image);
                        if (refRes.ok) {
                            const buf = await refRes.arrayBuffer();
                            initImageBase64 = btoa(new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                        }
                    } catch (e) {
                        console.warn("Failed to fetch reference image:", e);
                    }
                }

                if (!initImageBase64) {
                    // Generate new image from text
                    const imgRes = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Authorization": `Bearer ${stabilityKey}`
                        },
                        body: JSON.stringify({
                            text_prompts: [{ text: enhancedPrompt }], // Use enhanced prompt
                            cfg_scale: 7,
                            height: 576,
                            width: 1024,
                            samples: 1
                        })
                    });
                    
                    if (!imgRes.ok) throw new Error(`Stability Image Gen failed: ${await imgRes.text()}`);
                    const imgData = await imgRes.json();
                    initImageBase64 = imgData.artifacts[0].base64;
                }

                // 2. Generate Video from Image (SVD)
                const vidRes = await fetch("https://api.stability.ai/v2beta/image-to-video", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${stabilityKey}`
                        // Note: multipart/form-data boundary handled by FormData
                    },
                    body: (() => {
                        const formData = new FormData();
                        // Convert base64 to blob
                        const byteCharacters = atob(initImageBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: "image/png" });
                        
                        formData.append("image", blob, "image.png");
                        formData.append("seed", "0");
                        formData.append("cfg_scale", String(Math.min(guidance_scale || 1.8, 10))); // SVD uses lower scale (1-10) typically 1.8-2.5
                        formData.append("motion_bucket_id", String(motion_bucket_id || 127)); // 1-255, 127 default
                        return formData;
                    })()
                });

                if (!vidRes.ok) throw new Error(`Stability Video Gen failed: ${await vidRes.text()}`);
                const generationId = (await vidRes.json()).id;
                
                // Poll for result
                let videoBase64 = null;
                for (let i = 0; i < 20; i++) { // 20 * 2s = 40s timeout
                    await new Promise(r => setTimeout(r, 2000));
                    const pollRes = await fetch(`https://api.stability.ai/v2beta/image-to-video/result/${generationId}`, {
                        headers: { 
                            "Authorization": `Bearer ${stabilityKey}`,
                            "Accept": "video/mp4" 
                        }
                    });
                    
                    if (pollRes.status === 200) {
                        const vidBuf = await pollRes.arrayBuffer();
                        videoBase64 = btoa(new Uint8Array(vidBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                        break;
                    } else if (pollRes.status !== 202) {
                        break; // Error
                    }
                }

                if (videoBase64) {
                    return Response.json({
                        success: true,
                        videoBase64: videoBase64,
                        contentType: "video/mp4",
                        provider: "stability"
                    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
                }
            } catch (e) {
                console.error("Stability SVD failed:", e);
                // Fallback to default
            }
        }

        // FAL.AI SUPPORT (Multiple Models)
        if (falKey && (model === 'fal-ltxv' || model === 'fal-mochi' || model === 'fal-hunyuan' || model === 'fal-animatediff' || model?.startsWith('fal-'))) {
            try {
                console.log(`[Text-to-Video] Using Fal.ai: ${model}`);
                
                const falModels = {
                    'fal-ltxv': 'fal-ai/ltx-video',
                    'fal-mochi': 'fal-ai/mochi-v1',
                    'fal-hunyuan': 'fal-ai/hunyuan-video',
                    'fal-animatediff': 'fal-ai/animatediff-v2v',
                    'fal-kling': 'fal-ai/kling-video/v1.5/pro/text-to-video'
                };
                
                const falModel = falModels[model] || 'fal-ai/ltx-video';
                
                // Submit generation request
                const submitRes = await fetch(`https://queue.fal.run/${falModel}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${falKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: enhancedPrompt,
                        negative_prompt: negative_prompt || "blurry, low quality, distorted",
                        num_frames: num_frames || 81,
                        num_inference_steps: 30,
                        guidance_scale: guidance_scale || 7.5,
                        seed: Math.floor(Math.random() * 1000000)
                    })
                });
                
                if (submitRes.ok) {
                    const { request_id } = await submitRes.json();
                    
                    // Poll for result (max 60s)
                    for (let i = 0; i < 30; i++) {
                        await new Promise(r => setTimeout(r, 2000));
                        
                        const statusRes = await fetch(`https://queue.fal.run/${falModel}/requests/${request_id}/status`, {
                            headers: { 'Authorization': `Key ${falKey}` }
                        });
                        
                        if (statusRes.ok) {
                            const status = await statusRes.json();
                            
                            if (status.status === 'COMPLETED') {
                                const resultRes = await fetch(`https://queue.fal.run/${falModel}/requests/${request_id}`, {
                                    headers: { 'Authorization': `Key ${falKey}` }
                                });
                                
                                if (resultRes.ok) {
                                    const result = await resultRes.json();
                                    const videoUrl = result.video?.url || result.output?.url;
                                    
                                    if (videoUrl) {
                                        const vidFetch = await fetch(videoUrl);
                                        const vidBuf = await vidFetch.arrayBuffer();
                                        const videoBase64 = btoa(new Uint8Array(vidBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                                        
                                        return Response.json({
                                            success: true,
                                            videoBase64,
                                            contentType: "video/mp4",
                                            provider: "fal"
                                        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
                                    }
                                }
                                break;
                            } else if (status.status === 'FAILED') {
                                console.error("Fal.ai generation failed:", status);
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Fal.ai error:", e);
            }
        }

        // Enhanced Model List with better creative control parameters support
        const defaultModels = [
            "https://router.huggingface.co/models/Lightricks/LTX-Video",
            "https://router.huggingface.co/models/tencent/HunyuanVideo",
            "https://router.huggingface.co/models/genmo/mochi-1-preview",
            "https://router.huggingface.co/models/cerspense/zeroscope_v2_576w",
            "https://router.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b",
            "https://router.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b"
        ];

        // Determine models to use (Single specified model or fallback list)
        const modelsToTry = model && model !== 'auto' 
            ? [`https://router.huggingface.co/models/${model}`] 
            : defaultModels;

        let videoBase64 = null;

        // Try Inference API (Priority)
        if (hfKey) {
            for (const modelUrl of modelsToTry) {
                try {
                    const inputs = {
                        inputs: enhancedPrompt,
                        parameters: {
                            negative_prompt: negative_prompt || "blurry, distortion, low quality, text, watermark",
                            num_inference_steps: 25,
                            guidance_scale: guidance_scale || 12.0,
                            num_frames: num_frames || 24
                        }
                    };

                    console.log(`[Text-to-Video] Calling ${modelUrl}`);
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
                            console.log(`[Text-to-Video] Success via Inference API`);
                            break;
                        }
                    } else {
                        console.warn(`[Text-to-Video] Inference failed: ${response.status} ${await response.text()}`);
                    }
                } catch (e) {
                    console.error("[Text-to-Video] Inference Error:", e);
                }
            }
        }

        // Fallback to Public Spaces if Inference failed
        if (!videoBase64) {
            const spaces = [
                "https://damo-vilab-modelscope-text-to-video-synthesis.hf.space/api/predict",
                "https://damo-vilab-text-to-video-ms-1-7b.hf.space/api/predict"
            ];

            for (const apiUrl of spaces) {
                try {
                    console.log(`[Text-to-Video] Trying space: ${apiUrl}`);
                    const payload = {
                        data: [
                            prompt, 
                            Math.floor(Math.random() * 100000), // Seed
                            16, // Frames
                            25 // FPS
                        ]
                    };
                    
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const videoData = result.data?.[0];
                        let videoUrl = videoData?.url || (typeof videoData === 'string' ? videoData : null);

                        if (videoUrl) {
                            if (!videoUrl.startsWith("http")) {
                                const baseUrl = apiUrl.split('/api')[0];
                                videoUrl = `${baseUrl}/file=${videoUrl}`;
                            }
                            const vidRes = await fetch(videoUrl);
                            if (vidRes.ok) {
                                const vidBuf = await vidRes.arrayBuffer();
                                videoBase64 = btoa(new Uint8Array(vidBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                                break;
                            }
                        }
                    }
                } catch (e) { console.warn(`Space failed:`, e); }
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
            error: "ALL_PROVIDERS_BUSY",
            details: "Could not generate video. Please try again later or use the Client Warp fallback." 
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});