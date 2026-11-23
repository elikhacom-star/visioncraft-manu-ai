/**
 * StoryboardGenerator - Extracted storyboard generation logic from Home.js
 * Handles script analysis, storyboard creation, and image generation
 */

import { base44 } from "@/api/base44Client";
import { SLIDE_EFFECTS, CINEMATIC_ANGLES, CINEMATIC_MOODS, playSFX } from './effects/SlideEffects';
import { cleanDialogue, detectSpeakerRole } from './DialogueCleaner';
import { analyzeSceneEmotions } from './ai/EmotionAnalyzer';

const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

/**
 * Generate the storyboard from a script using LLM
 */
export async function generateStoryboardData({
    script, language, uiLanguage, selectedTemplate, artStyle, negativePrompt,
    styleRefDescription, desiredSceneCount, targetTotalDuration, dialogueMode = 'adaptive'
}) {
    // Load characters to inject into storyboard prompt
    let charactersContext = '';
    try {
        const chars = await base44.entities.Character.list();
        if (chars && chars.length > 0) {
            charactersContext = `\nCHARACTER ROSTER (use these characters in visual descriptions when relevant):\n` +
                chars.map(c => `- "${c.name}": ${c.description}${c.personality ? ` | Personality: ${c.personality}` : ''}`).join('\n') +
                `\nWhen a scene involves a character from this list, include their name in the visual_description so the image generator can portray them accurately.\n`;
        }
    } catch (e) {}
    const languageName = uiLanguage === 'fr' ? 'French' : 
                         uiLanguage === 'es' ? 'Spanish' :
                         uiLanguage === 'ar' ? 'Arabic' :
                         uiLanguage === 'de' ? 'German' :
                         uiLanguage === 'it' ? 'Italian' :
                         uiLanguage === 'pt' ? 'Portuguese' : 'English';

    let styleInstructions = selectedTemplate?.system_prompt_addendum || "";

    const storyboardPrompt = `
        Analyze this script and create a highly detailed, cinematic storyboard breakdown.
        Your goal is to be a world-class Director of Photography AND Editor.

        Script: "${script}"

        ${styleInstructions ? `STRICTLY FOLLOW THIS STYLE GUIDE:\n${styleInstructions}\n` : ""}
        ${charactersContext}

        CRITICAL LANGUAGE INSTRUCTION: ALL dialogue and text MUST be written in ${languageName}. Do not use any other language.

        DIALOGUE MODE: ${dialogueMode === 'strict' 
            ? 'STRICT — You MUST use the EXACT text from the original script for the dialogue field. Split the script text across scenes at natural sentence boundaries but do NOT rewrite, paraphrase, or adapt the wording. Keep the original text as-is.'
            : 'ADAPTIVE — You may rewrite and adapt the script text to create more compelling, cinematic narration for the dialogue field.'}

        STORYTELLING STYLE: Create a narrative video style:
        - Write dialogue as PURE NARRATION text only - NO speaker labels, NO prefixes like "Narrateur:", "Personne 1:", etc.
        - The dialogue field must contain ONLY the spoken text, nothing else.
        - Do NOT include any metadata like "Durée:" in the dialogue.
        ${dialogueMode === 'adaptive' ? '- Use captivating, epic language that draws the viewer in emotionally.' : '- Preserve the original script wording exactly.'}
        - Each scene should flow naturally into the next like chapters of a story.
        ${dialogueMode === 'adaptive' ? '- Include emotional hooks, dramatic pauses, and rhetorical questions in the narration.' : ''}
        - Visual descriptions should be DETAILED and CINEMATIC.
        - Include OVERLAY TEXT for key moments: titles, important names, dramatic phrases.
        ${artStyle ? `- ART DIRECTION / VISUAL STYLE (STRICTLY FOLLOW): ${artStyle}` : '- Style: Cinematic, professional, high quality visuals'}

        CRITICAL: DIALOGUE MUST BE CLEAN TEXT ONLY. Examples:
        ✅ CORRECT: "Depuis des années, Bouchez défend avec passion les positions israéliennes."
        ❌ WRONG: "Narrateur : 'Depuis des années, Bouchez défend...' Durée : 5"
        ❌ WRONG: "Personne 1 : Depuis des années..."

        CRITICAL INSTRUCTION: Ensure EXTREME VISUAL DIVERSITY.

        AUTO-PACING INSTRUCTIONS:
        - Analyze the EMOTION and TONE of each scene to determine its DURATION and CAMERA MOVEMENT.
        - Fast/Action/Intense = Shorter duration (2-4s), Fast movement.
        - Sad/Reflective/Grand = Longer duration (6-10s), Slow movement.
        - Dialogue scenes = Duration must match speech (~2.5 words/sec).

        Available Camera Angles (Mix these): ${CINEMATIC_ANGLES.join(', ')}.
        Available Moods (Select appropriate): ${CINEMATIC_MOODS.join(', ')}.

        Return a structured breakdown with:
        - Scene number and suggested duration.
        - Visual description: Detailed, vivid, and artistic.
        - Composition Notes.
        - Pacing Rationale.
        - Dialogue/narration: CLEAN TEXT ONLY in ${languageName}, no prefixes or metadata.
        - Camera angle.
        - Mood: The emotional atmosphere.
        - Overlay Text: Short, punchy text (2-6 words) in ${languageName}.

        HARD REQUIREMENTS:
        - Return EXACTLY ${desiredSceneCount} scenes.
        - Target TOTAL DURATION ≈ ${targetTotalDuration} seconds.
        - Each scene must include a numeric duration field in seconds (2–15s recommended).
    `;

    const storyboardResult = await InvokeLLM({
        prompt: storyboardPrompt,
        response_json_schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                total_duration: { type: "number" },
                scenes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            scene_number: { type: "number" },
                            duration: { type: "number" },
                            visual_description: { type: "string" },
                            composition_notes: { type: "string" },
                            pacing_reason: { type: "string" },
                            dialogue: { type: "string" },
                            camera_angle: { type: "string" },
                            mood: { type: "string" },
                            overlay_text: { type: "string" }
                        }
                    }
                }
            }
        }
    });

    if (!storyboardResult?.scenes?.length) {
        throw new Error("Failed to generate a valid storyboard.");
    }

    // Map, sanitize, and CLEAN dialogues
    storyboardResult.scenes = storyboardResult.scenes.map((scene, index) => ({
        ...scene,
        duration: scene.duration && scene.duration > 0 ? Math.min(Math.max(scene.duration, 2), 15) : 5,
        effect: SLIDE_EFFECTS[index % SLIDE_EFFECTS.length],
        overlayText: scene.overlay_text || scene.overlayText || "",
        // CLEAN the dialogue - remove prefixes and metadata
        dialogue: cleanDialogue(scene.dialogue || "")
    }));

    // Enforce desired scene count
    if (desiredSceneCount && storyboardResult.scenes.length !== desiredSceneCount) {
        if (storyboardResult.scenes.length > desiredSceneCount) {
            storyboardResult.scenes = storyboardResult.scenes.slice(0, desiredSceneCount);
        } else {
            const missing = desiredSceneCount - storyboardResult.scenes.length;
            for (let i = 0; i < missing; i++) {
                storyboardResult.scenes.push({
                    scene_number: storyboardResult.scenes.length + 1,
                    duration: 5, visual_description: `Placeholder scene ${storyboardResult.scenes.length + 1}`,
                    composition_notes: "", pacing_reason: "", dialogue: "",
                    camera_angle: "Medium Shot", mood: "Cinematic", overlayText: ""
                });
            }
        }
    }

    // Normalize durations
    if (targetTotalDuration && storyboardResult.scenes.length > 0) {
        const durs = storyboardResult.scenes.map(s => s.duration || 5);
        let sum = durs.reduce((a,b)=>a+b,0);
        let factor = (sum > 0) ? (targetTotalDuration / sum) : 1;
        let normalized = durs.map(d => Math.max(2, Math.min(15, d * factor)));
        let diff = targetTotalDuration - normalized.reduce((a,b)=>a+b,0);
        let idx = 0;
        while (Math.abs(diff) > 0.05 && idx < 500) {
            const i = idx % normalized.length;
            const step = Math.sign(diff) * 0.1;
            const nv = normalized[i] + step;
            if (nv >= 2 && nv <= 15) { normalized[i] = nv; diff -= step; }
            idx++;
        }
        storyboardResult.total_duration = Math.round(targetTotalDuration);
        storyboardResult.scenes = storyboardResult.scenes.map((s, i) => ({
            ...s, duration: Math.round(normalized[i] * 10) / 10, scene_number: i + 1
        }));
    }

    // --- Emotion Analysis (Moment 1: at storyboard time) ---
    try {
        const emotions = await analyzeSceneEmotions(storyboardResult.scenes);
        storyboardResult.scenes = storyboardResult.scenes.map((s, i) => ({
            ...s,
            emotion_label: emotions[i] || 'calm'
        }));
    } catch (e) {
        console.warn("Emotion analysis at storyboard time failed, defaulting to calm:", e);
        storyboardResult.scenes = storyboardResult.scenes.map(s => ({ ...s, emotion_label: 'calm' }));
    }

    return storyboardResult;
}

/**
 * Generate dialogue-only regeneration (keeping visuals)
 */
export async function regenerateDialogueData({ script, sceneCount, uiLanguage, dialogueMode = 'adaptive' }) {
    const langName = uiLanguage === 'fr' ? 'French' : uiLanguage === 'es' ? 'Spanish' : uiLanguage === 'ar' ? 'Arabic' : uiLanguage === 'de' ? 'German' : 'English';
    
    const strictInstructions = dialogueMode === 'strict'
        ? `DIALOGUE MODE: STRICT — You MUST use the EXACT text from the original script. 
        Split the script text across scenes but do NOT rewrite, paraphrase, or adapt it. 
        Keep the original wording as-is. Only split at natural sentence boundaries.`
        : `DIALOGUE MODE: ADAPTIVE — You may rewrite and adapt the script to create more compelling, 
        cinematic narration. Make it dramatic, engaging, and suitable for voiceover.`;

    const res = await InvokeLLM({
        prompt: `Create narration dialogue for ${sceneCount} scenes from this script: "${script}".
        
        ${strictInstructions}
        
        CRITICAL RULES:
        1. ALL text MUST be in ${langName}.
        2. Return EXACTLY ${sceneCount} scenes.
        3. Each dialogue MUST be CLEAN TEXT ONLY - NO prefixes like "Narrateur:", "Personne 1:", etc.
        4. NO metadata like "Durée:" in the dialogue.
        5. Each scene's dialogue should flow naturally into the next.
        
        Examples of CORRECT dialogue:
        - "Jusqu'où s'étend l'alignement politique ? Plongeons au cœur de cette interrogation."
        - "Since the beginning, this passion has driven every decision."
        
        Examples of WRONG dialogue:
        - "Narrateur : Jusqu'où s'étend..." (NO PREFIXES!)
        - "Personne 1 : Since the beginning..." (NO PREFIXES!)`,
        response_json_schema: {
            type: "object",
            properties: {
                scenes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            scene_number: { type: "number" },
                            dialogue: { type: "string" },
                            duration: { type: "number" },
                            mood: { type: "string" }
                        }
                    }
                }
            }
        }
    });

    if (res?.scenes) {
        // Double-clean all dialogues
        res.scenes = res.scenes.map(s => ({
            ...s,
            dialogue: cleanDialogue(s.dialogue || "")
        }));
    }

    return res;
}

/**
 * Generate offline fallback storyboard when LLM fails
 */
export function generateOfflineStoryboard(script, desiredSceneCount, targetTotalDuration) {
    const n = Math.max(1, desiredSceneCount || 6);
    const total = Math.max(10, targetTotalDuration || 60);
    const sentences = (script || '').split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
    const chunks = Array.from({ length: n }, (_, i) => {
        const start = Math.floor(i * sentences.length / n);
        const end = Math.floor((i + 1) * sentences.length / n);
        const part = sentences.slice(start, end).join('. ').trim();
        return part || `Scene ${i + 1}`;
    });
    const per = Array(n).fill(Math.round((total / n) * 10) / 10);
    return {
        title: 'Offline Storyboard',
        total_duration: total,
        scenes: chunks.map((desc, idx) => ({
            scene_number: idx + 1, duration: per[idx],
            visual_description: desc, composition_notes: '', pacing_reason: '',
            dialogue: '', camera_angle: 'Medium Shot', mood: 'Cinematic', overlay_text: ''
        }))
    };
}