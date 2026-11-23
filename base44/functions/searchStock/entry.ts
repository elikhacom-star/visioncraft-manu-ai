import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { query, type, page = 1, orientation, min_duration, max_duration } = await req.json();
        if (!query) return Response.json({ assets: [] });

        // Use LLM with web search to find real stock media URLs
        const isVideo = type === 'videos';
        const mediaType = isVideo ? 'video clips' : 'photos';
        const siteHint = isVideo 
            ? 'Search on pexels.com/search/videos/ and pixabay.com/videos/search/ for real downloadable video clips.'
            : 'Search on pexels.com/search/ and unsplash.com/s/photos/ for real high-resolution photos.';

        const orientationHint = orientation && orientation !== 'all' ? `Prefer ${orientation} orientation.` : '';
        const durationHint = isVideo ? (
            min_duration && max_duration ? `Duration between ${min_duration}s and ${max_duration}s.` :
            min_duration ? `Duration at least ${min_duration}s.` :
            max_duration ? `Duration at most ${max_duration}s.` : ''
        ) : '';

        const result = await base44.asServiceRole.integrations.InvokeLLM({
            prompt: `Find 12 real, high-quality, royalty-free stock ${mediaType} related to "${query}".
${siteHint}
${orientationHint}
${durationHint}

For each result, provide:
- title: descriptive title
- thumbnail: direct image URL (for videos: the thumbnail/poster image URL; for photos: medium-size image URL). Use real URLs from pexels or pixabay CDN (images.pexels.com or pixabay.com/get/...).
- url: for videos, the direct .mp4 video file URL (from video files on pexels CDN like videos.pexels.com/...); for photos, the high-resolution image URL
- previewUrl: for videos, a smaller quality preview video URL; for photos same as thumbnail
- source: "Pexels" or "Pixabay" or "Unsplash"
- duration: video duration in seconds (0 for photos)
- width: pixel width
- height: pixel height  
- photographer: photographer/creator name

IMPORTANT: Only return URLs that are real and publicly accessible. Prefer pexels.com CDN URLs.
Return exactly 12 results.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: {
                type: "object",
                properties: {
                    assets: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                thumbnail: { type: "string" },
                                url: { type: "string" },
                                previewUrl: { type: "string" },
                                source: { type: "string" },
                                duration: { type: "number" },
                                width: { type: "number" },
                                height: { type: "number" },
                                photographer: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        const assets = (result?.assets || []).map((a, i) => ({
            id: `stock-${i}-${Date.now()}`,
            title: a.title || `${query} ${i + 1}`,
            thumbnail: a.thumbnail || a.url,
            url: a.url || '',
            previewUrl: a.previewUrl || a.url,
            source: a.source || 'Web',
            width: a.width || (isVideo ? 1920 : 1280),
            height: a.height || (isVideo ? 1080 : 720),
            duration: a.duration || 0,
            photographer: a.photographer || 'Unknown'
        })).filter(a => a.url);

        return Response.json({ assets, total: assets.length, page });

    } catch (error) {
        console.error("searchStock error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});