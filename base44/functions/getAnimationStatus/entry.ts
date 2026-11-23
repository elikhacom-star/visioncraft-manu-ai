import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
            });
        }

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, provider } = await req.json();

        if (!id) {
            return Response.json({ error: 'No generation ID provided' }, { status: 400 });
        }

        // ---------------------------------------------------------
        // PROVIDER: Fal.ai
        // ---------------------------------------------------------
        if (provider === 'fal') {
            const falKey = Deno.env.get("FAL_KEY");
            if (!falKey) return Response.json({ error: 'FAL_KEY is not set' }, { status: 500 });

            // 1. Check Status
            console.log(`[Status] Checking Fal.ai status for ${id}...`);
            const statusUrl = `https://queue.fal.run/fal-ai/ltxv-2/image-to-video/requests/${id}/status`;
            const statusRes = await fetch(statusUrl, {
                method: "GET",
                headers: { "Authorization": `Key ${falKey}` }
            });

            if (!statusRes.ok) {
                 const err = await statusRes.text();
                 return Response.json({ error: `Fal status check failed: ${err}` });
            }

            const statusData = await statusRes.json();
            console.log(`[Status] Fal.ai status: ${statusData.status}`);

            if (statusData.status === 'COMPLETED') {
                // 2. Fetch Result
                const resultUrl = `https://queue.fal.run/fal-ai/ltxv-2/image-to-video/requests/${id}`;
                const resultRes = await fetch(resultUrl, {
                    method: "GET",
                    headers: { "Authorization": `Key ${falKey}` }
                });
                
                if (!resultRes.ok) {
                     const err = await resultRes.text();
                     return Response.json({ error: `Fal result fetch failed: ${err}` });
                }

                const resultData = await resultRes.json();
                const videoUrl = resultData.video?.url;

                if (videoUrl) {
                    return Response.json({ status: 'complete', videoUrl: videoUrl });
                } else {
                    return Response.json({ error: 'Fal.ai completed but no video URL found.' });
                }
            } else if (statusData.status === 'IN_PROGRESS' || statusData.status === 'IN_QUEUE') {
                return Response.json({ status: 'in-progress' });
            } else {
                return Response.json({ error: `Fal.ai failed with status: ${statusData.status}` });
            }
        }

        // ---------------------------------------------------------
        // PROVIDER: Stability AI (Default fallback)
        // ---------------------------------------------------------
        const apiKey = Deno.env.get("STABILITY_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'STABILITY_API_KEY is not set' }, { status: 500 });
        }

        console.log(`[Status] Checking Stability status for ${id}...`);
        
        // Try v2beta first
        let response = await fetch(`https://api.stability.ai/v2beta/image-to-video/result/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "video/*" 
            },
        });

        // If 404, try v2alpha
        if (response.status === 404) {
            console.log("v2beta check returned 404, trying v2alpha...");
            response = await fetch(`https://api.stability.ai/v2alpha/image-to-video/result/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "video/*" 
                },
            });
        }

        if (response.status === 202) {
            return Response.json({ status: 'in-progress' });
        } else if (response.status === 200) {
            const videoBuffer = await response.arrayBuffer();
            const base64Video = btoa(
                new Uint8Array(videoBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            return Response.json({ status: 'complete', videoBase64: base64Video });
        } else {
            const errorText = await response.text();
            console.error("Stability Check Error:", errorText);
            return Response.json({ error: `Stability Check Error: ${response.status} - ${errorText}` });
        }

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});