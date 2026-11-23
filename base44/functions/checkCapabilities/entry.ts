import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        // Optional: Check auth if you want to restrict this info
        // const user = await base44.auth.me(); 

        const hasStability = !!Deno.env.get("STABILITY_API_KEY");

        return Response.json({ 
            hasStability 
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});