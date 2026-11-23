import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { script, characters = [] } = await req.json();

    if (!script || !script.trim()) {
      return Response.json({ error: 'Script is required' }, { status: 400 });
    }

    const characterListStr = characters.length > 0
      ? `Known characters: ${characters.join(', ')}.`
      : 'No characters defined yet.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a script analyst. Split the following script into dialogue blocks.

Rules:
- Each block has: a "character" (who speaks) and a "dialogue" (what they say).
- If the text is narration with no speaker, use character = "Narrateur".
- If it's ambient/scene description with no speaker, use character = "Aucun".
- If you detect a speaker name (e.g. "NOM: dialogue"), extract it as the character.
- Keep original wording in the "dialogue" field, do NOT paraphrase.
- Split into logical blocks — typically one per paragraph or speaker turn.
- Do NOT merge different speakers into one block.
${characterListStr}

Script to split:
---
${script}
---

Return a JSON object with a "blocks" array. Each block: { "character": string, "dialogue": string }`,
      response_json_schema: {
        type: "object",
        properties: {
          blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                character: { type: "string" },
                dialogue: { type: "string" }
              },
              required: ["character", "dialogue"]
            }
          }
        },
        required: ["blocks"]
      }
    });

    return Response.json({ blocks: result?.blocks || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});