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

        const { imageBase64, imageUrl, prompt, provider } = await req.json();
        
        // Define availability
        const falKey = Deno.env.get("FAL_KEY");
        const stabilityKey = Deno.env.get("STABILITY_API_KEY");
        const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");

        // Determination Logic
        // If provider is specified, we try ONLY that provider.
        // If provider is null/auto, we try Fal -> Stability -> HF.
        
        let tryFal = false;
        let tryStability = false;
        let tryHF = false;

        if (provider === 'fal') {
            tryFal = true;
        } else if (provider === 'stability') {
            tryStability = true;
        } else if (provider === 'animate-diff') {
            tryHF = true;
        } else {
            // Auto mode: Sequence
            // We'll execute them sequentially in the code blocks below
            // rather than setting flags here, to allow fallback.
            tryFal = true; // Start with Fal
        }

        let errors = [];

        // ---------------------------------------------------------
        // METHOD 1: Fal.ai (LTXV 2.0 Pro - BEST QUALITY)
        // ---------------------------------------------------------
        if (tryFal || (!provider && falKey)) {
            if (falKey) {
                console.log("[Animate] Fal Key found. Attempting Fal.ai generation...");
                try {
                    if (!imageUrl) {
                        throw new Error("Public Image URL is required for Fal.ai");
                    }

                    const response = await fetch("https://queue.fal.run/fal-ai/ltxv-2/image-to-video/submit", {
                        method: "POST",
                        headers: {
                            "Authorization": `Key ${falKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            image_url: imageUrl,
                            prompt: prompt || "animate this image, cinematic movement"
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log("[Animate] Fal.ai Job Started:", result.request_id);
                        return Response.json({
                            success: true,
                            generationId: result.request_id,
                            provider: "fal"
                        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
                    } else {
                        const errText = await response.text();
                        console.warn(`[Animate] Fal.ai failed (${response.status}): ${errText}`);
                        errors.push(`Fal.ai: ${response.status} - ${errText}`);
                    }
                } catch (err) {
                    console.warn("[Animate] Fal.ai Error:", err);
                    errors.push(`Fal.ai: ${err.message}`);
                }
            } else if (provider === 'fal') {
                errors.push("Fal.ai API Key is missing.");
            }
        }

        // If specific provider was 'fal' and we failed, stop here?
        // Or if auto, continue.
        // Since we are checking `!provider` in the conditions below, it handles "auto" mode automatically.
        // If provider WAS 'fal', we shouldn't fall through.
        if (provider === 'fal') {
             throw new Error(errors.join("\n"));
        }

        // ---------------------------------------------------------
        // METHOD 2: Stability AI (Reliable, Paid/Credits)
        // ---------------------------------------------------------
        if (tryStability || (!provider && stabilityKey)) {
            if (stabilityKey) {
                console.log("[Animate] Stability Key found. Attempting Stability AI generation...");
                try {
                    // Convert Base64 to Blob
                    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/png' });

                    // Try multiple endpoints
                    const endpoints = [
                        "https://api.stability.ai/v2beta/image-to-video",
                        "https://api.stability.ai/v2alpha/generation/image-to-video"
                    ];
                    
                    let stabilityErrors = [];

                    for (const endpoint of endpoints) {
                        console.log(`[Animate] Trying endpoint: ${endpoint}`);
                        const formData = new FormData();
                        formData.append("image", blob, "input_image.png");
                        formData.append("seed", "0");
                        formData.append("cfg_scale", "1.8");
                        formData.append("motion_bucket_id", "127");

                        const response = await fetch(endpoint, {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${stabilityKey}` },
                            body: formData,
                        });

                        if (response.ok) {
                            const result = await response.json();
                            console.log("[Animate] Stability AI Job Started:", result.id);
                            return Response.json({
                                success: true,
                                generationId: result.id,
                                provider: "stability"
                            }, { headers: { 'Access-Control-Allow-Origin': '*' } });
                        } else {
                            const errText = await response.text();
                            console.warn(`[Animate] Endpoint ${endpoint} failed (${response.status}): ${errText}`);
                            stabilityErrors.push(`${endpoint.split('ai/')[1]}: ${response.status} - ${errText}`);
                        }
                    }
                    errors.push(`Stability AI: ${stabilityErrors.join(" | ")}`);
                } catch (err) {
                    console.warn("[Animate] Stability AI Error:", err);
                    errors.push(`Stability AI: ${err.message}`);
                }
            } else if (provider === 'stability') {
                errors.push("Stability API Key is missing.");
            }
        }

        if (provider === 'stability') {
             throw new Error(errors.join("\n"));
        }

        // ---------------------------------------------------------
        // METHOD 3: Hugging Face Space (Free, "AnimateDiff")
        // ---------------------------------------------------------
        // Check if we should run HF (Explicit or Fallback)
        if (tryHF || !provider) {
            // Note: HF is free so we always try it if auto mode reaches here
            console.log(`[Animate] Attempting Hugging Face Space (AnimateDiff) with prompt: "${prompt}" ${hfKey ? '(Authenticated)' : ''}`);
            const apiUrl = "https://guoyww-animatediff.hf.space/api/predict";
            
            const payload = {
                data: [
                    imageBase64,           // Full Data URI
                    prompt || "animated", 
                    25,                    // Steps
                    7,                     // Guidance
                    7.5                    // Motion
                ]
            };

            const headers = { "Content-Type": "application/json" };
            if (hfKey) {
                headers["Authorization"] = `Bearer ${hfKey}`;
            }

            let response;
            let result;
            const maxRetries = 6; // Try for ~60 seconds
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch(apiUrl, {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify(payload)
                    });

                    if (response.status === 503) {
                        console.log(`[Animate] HF Cold Boot (503). Retrying in 10s... (${i + 1}/${maxRetries})`);
                        await new Promise(r => setTimeout(r, 10000));
                        continue;
                    }
                    
                    if (!response.ok) {
                         // If it's not 503 but still error, break and handle below
                         break;
                    }

                    // Success
                    result = await response.json();
                    break;
                } catch (err) {
                    console.log(`[Animate] Fetch error: ${err.message}. Retrying...`);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

            if (!response || !response.ok) {
                const errText = response ? await response.text() : "Network Error";
                if (response && response.status === 503) {
                     let msg = "The Free AI Model is warming up but taking longer than expected. Please try again in 1 minute.";
                     
                     // Collect all errors to show the full picture
                     if (errors.length > 0) {
                         msg += `\n\nBackup Providers Failed:\n${errors.join("\n")}`;
                     }
                     throw new Error(msg);
                }
                
                // If HF fails and it was the last resort (or explicit)
                errors.push(`AnimateDiff: ${response ? response.status : 'Error'} - ${errText}`);
                if (provider === 'animate-diff') throw new Error(errors.join("\n"));
            } else {
                // Success
                const videoData = result.data?.[0];
              
                let videoUrl = null;
                if (typeof videoData === 'string') {
                    videoUrl = videoData;
                } else if (videoData?.url) {
                    videoUrl = videoData.url;
                } else if (videoData?.name) {
                    videoUrl = videoData.name;
                }
        
                if (!videoUrl) throw new Error("Could not parse video URL from API response.");
        
                // Construct full URL
                if (!videoUrl.startsWith("http")) {
                    if (videoUrl.startsWith("/file=")) {
                         videoUrl = `https://guoyww-animatediff.hf.space${videoUrl}`;
                    } else {
                         videoUrl = `https://guoyww-animatediff.hf.space/file=${videoUrl}`;
                    }
                }
        
                const videoResponse = await fetch(videoUrl);
                if (!videoResponse.ok) throw new Error("Failed to download video file");
                
                const videoBuffer = await videoResponse.arrayBuffer();
                const videoBase64 = btoa(
                    new Uint8Array(videoBuffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
        
                return Response.json({ 
                    success: true, 
                    videoBase64: videoBase64, 
                    contentType: "video/mp4",
                    provider: "animate-diff"
                }, { headers: { 'Access-Control-Allow-Origin': '*' } });
            }
        }

        // If we get here, everything failed
        throw new Error("All animation methods failed:\n" + errors.join("\n"));

    } catch (error) {
        console.error("[Animate] All methods failed:", error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { 
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
});