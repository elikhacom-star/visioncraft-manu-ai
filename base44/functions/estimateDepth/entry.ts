import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { imageUrl, imageBase64 } = await req.json();
        const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");

        if (!hfKey) return Response.json({ error: "HuggingFace Key missing" }, { status: 500 });

        // Use Intel's DPT Large for high quality depth estimation
        const modelUrl = "https://router.huggingface.co/models/Intel/dpt-large";
        
        let payload = {};
        if (imageBase64) {
            // Remove header if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            payload = { inputs: base64Data };
        } else if (imageUrl) {
            // Fetch image and convert to base64
            const imgRes = await fetch(imageUrl);
            const blob = await imgRes.blob();
            const buf = await blob.arrayBuffer();
            const b64 = btoa(new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            payload = { inputs: b64 };
        } else {
            return Response.json({ error: "No image provided" }, { status: 400 });
        }

        const response = await fetch(modelUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Depth API Error: ${response.status}`);
        }

        const depthData = await response.json();
        // DPT returns a list of dicts with 'label' (or just the image data directly if it's an image-to-image task?)
        // Actually DPT task on HF Inference API often returns the depth map image as the response body directly (if raw)
        // or a JSON if standard. Let's check response type.
        // Usually image-to-image returns the image bytes.
        
        // Re-read response as blob if it's an image
        // Wait, we already called json(). If it fails, it might be raw image.
        // Let's try arrayBuffer first.
        
        // RE-FETCH safely
        const response2 = await fetch(modelUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const depthBuf = await response2.arrayBuffer();
        const depthBase64 = btoa(new Uint8Array(depthBuf).reduce((data, byte) => data + String.fromCharCode(byte), ''));

        return Response.json({ 
            success: true, 
            depthBase64: depthBase64,
            contentType: "image/png" 
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        console.error("Depth Est Error:", error);
        return Response.json({ success: false, error: error.message }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});