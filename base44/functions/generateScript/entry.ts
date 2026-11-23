import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { topic, genre, duration } = await req.json();

        const prompt = `You are an award-winning screenwriter. Create a compelling video script based on the user's topic.
Genre: ${genre || 'Documentary'}
Target Duration: ${duration || '60 seconds'}

Format the script with:
- Scene headings (SCÈNE 1, SCÈNE 2, etc.)
- Visual descriptions (what is seen on screen)
- Narration/Voiceover text
- Keep it engaging and well-paced for the target duration.

Topic/Outline: ${topic}

Write the complete script now. Respond in the same language as the topic.`;

        const script = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

        return Response.json({ script }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
});