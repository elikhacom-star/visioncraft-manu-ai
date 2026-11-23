import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
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

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            return Response.json({ error: 'No image URL provided' }, { status: 400 });
        }

        // Download the image and re-upload it to Base44 storage to get a compatible file_url
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return Response.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
        }
        const imageBlob = await imageResponse.blob();
        
        // Determine extension from content-type
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const extMap = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/gif': 'gif', 'image/webp': 'webp' };
        const ext = extMap[contentType] || 'jpeg';

        // Upload to Base44 storage
        const uploadResult = await base44.integrations.Core.UploadFile({
            file: new File([imageBlob], `style_ref.${ext}`, { type: contentType })
        });

        if (!uploadResult || !uploadResult.file_url) {
            return Response.json({ error: 'Failed to upload image to storage' }, { status: 500 });
        }

        // Now use InvokeLLM with the uploaded file URL
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: "Analyze the visual style of this image. Describe the art style, color palette, lighting, texture, composition, and mood. Return meaningful keywords only. Return a concise paragraph that can be appended to an image generation prompt to replicate this exact style. Do not describe the subject matter, ONLY the style.",
            file_urls: [uploadResult.file_url],
            response_json_schema: {
                type: "object",
                properties: {
                    styleDescription: {
                        type: "string",
                        description: "Concise style description for image generation prompts"
                    }
                }
            }
        });

        const styleDescription = result?.styleDescription || (typeof result === 'string' ? result : JSON.stringify(result));

        return Response.json({ styleDescription });

    } catch (error) {
        console.error("Style Analysis Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});