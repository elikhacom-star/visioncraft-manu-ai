import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Buffer } from "node:buffer";

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

        let body;
        try { body = await req.json(); } catch (e) {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { 
            text, voice = 'alloy', speed = 1.0, pitch = 1.0, 
            language = 'en', gender, stability, similarity_boost, 
            style, use_elevenlabs, voice_id, prefer_hf_bark,
            emotion = 'neutral', audioEffects = {}
        } = body;

        if (!text) {
            return Response.json({ error: 'Text field is empty' }, { status: 400 });
        }

        // --- Determine effective gender ---
        const normalizedGender = String(gender || '').toLowerCase();
        const normalizedVoiceId = String(voice_id || '').toLowerCase();
        
        const maleTokens = [
            'fr-fr-m', 'fr-ca-m', 'en-us-m', 'en-gb-m', 'en-au-m',
            'ar-xa-m', 'es-es-m', 'es-mx-m', 'de-de-m', 'it-it-m', 'ja-jp-m',
            'gabriel', 'alexandre', 'victor', 'etienne', 'michael', 'daniel', 
            'james', 'arthur', 'henry', 'noah', 'omar', 'karim', 'hakawati',
            'mateo', 'javier', 'diego', 'lukas', 'jonas', 'marco', 'lorenzo',
            'haruto', 'ren', '-m2', '-poet', '-story', '-news'
        ];
        const femaleTokens = [
            '-f', 'sarah', 'olivia', 'emma', 'chlo', 'léa', 'lea', 
            'fatima', 'sofia', 'hanna', 'isabella', 'sakura'
        ];
        
        const inferredMale = maleTokens.some(t => normalizedVoiceId.includes(t));
        const inferredFemale = !inferredMale && femaleTokens.some(t => normalizedVoiceId.includes(t));
        const effectiveGender = (normalizedGender === 'male' || normalizedGender === 'female') 
            ? normalizedGender 
            : (inferredMale ? 'male' : inferredFemale ? 'female' : 'female');

        console.log(`TTS Request | gender_param: ${gender}, voice_id: ${voice_id}, effectiveGender: ${effectiveGender}, prefer_hf_bark: ${prefer_hf_bark}`);

        // --- Clean text ---
        let cleanText = text;
        cleanText = cleanText.replace(/^[""]?\s*(Narrateur|Narratrice|Narrator|Voix\s*off|Voice\s*over|Erzähler|Narrador|الراوي|Présentateur|Présentatrice|Host|Presenter)\s*:\s*/i, '');
        cleanText = cleanText.replace(/^[""]?\s*(Personne|Person|Personnage|Character|Speaker|Intervenant|Persona|Personaje|شخص)\s*\d*\s*:\s*/i, '');
        cleanText = cleanText.replace(/\s*Durée\s*:\s*\d+\s*"?\s*$/i, '');
        cleanText = cleanText.replace(/\s*Duration\s*:\s*\d+\s*"?\s*$/i, '');
        cleanText = cleanText.replace(/^["'""\s]+/, '').replace(/["'""\s]+$/, '');
        cleanText = cleanText.replace(/\s{2,}/g, ' ').trim();
        const synthesisText = cleanText || text;

        const getKey = (name) => Deno.env.get(name);
        const elevenKey = getKey("ELEVENLABS_API_KEY");
        const openAiKey = getKey("OPENAI_API_KEY");
        const hfKey = getKey("HUGGINGFACE_API_KEY");
        
        let audioBase64 = null;
        let provider = "none";

        // ============================================================
        // PRIORITY 1: ElevenLabs (only if explicitly requested + key exists)
        // ============================================================
        if (elevenKey && (use_elevenlabs || (voice_id && voice_id.length > 20))) {
            try {
                console.log(`[P1] Trying ElevenLabs | voice_id: ${voice_id}`);
                const model_id = language === 'en' ? 'eleven_turbo_v2' : 'eleven_multilingual_v2';
                const defaultVoices = {
                    male: { neutral: 'pNInz6obpgDQGcFmaJgB', happy: 'VR6AewLTigWG4xSOukaG', sad: 'ErXwobaYiN019PkySvjV', angry: 'yoZ06aMxZJJ28mfd3POQ' },
                    female: { neutral: '21m00Tcm4TlvDq8ikWAM', happy: 'EXAVITQu4vr4xnSDxMaL', sad: 'ThT5KcBeYPX3keUQqHPh', angry: 'jsCqWAovK2LkecY7zXl4' }
                };
                const selectedEmotion = ['happy', 'sad', 'angry'].includes(emotion) ? emotion : 'neutral';
                const vid = voice_id || defaultVoices[effectiveGender]?.[selectedEmotion] || defaultVoices.female.neutral;

                const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
                    method: 'POST',
                    headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
                    body: JSON.stringify({
                        text: synthesisText, model_id,
                        voice_settings: {
                            stability: stability !== undefined ? Number(stability) : 0.5,
                            similarity_boost: similarity_boost !== undefined ? Number(similarity_boost) : 0.75,
                            style: style !== undefined ? Number(style) : 0.0,
                            use_speaker_boost: true
                        }
                    })
                });

                if (!elResponse.ok) throw new Error(await elResponse.text());
                audioBase64 = Buffer.from(await elResponse.arrayBuffer()).toString('base64');
                provider = "elevenlabs";
                console.log(`[P1] ElevenLabs SUCCESS`);
            } catch (e) {
                console.warn(`[P1] ElevenLabs FAILED: ${e.message}`);
            }
        }

        // ============================================================
        // PRIORITY 2: Kokoro TTS via fal.ai (supports male/female + multiple languages)
        // ============================================================
        const falKey = getKey("FAL_KEY");
        if (!audioBase64 && falKey) {
            const langPrefix = (language || 'en').slice(0, 2).toLowerCase();
            
            // Map language to fal.ai Kokoro endpoint and voice IDs
            const kokoroConfig = {
                fr: { endpoint: 'fal-ai/kokoro/french', male: 'fm_alpha', female: 'ff_siwis' },
                en: { endpoint: 'fal-ai/kokoro/american-english', male: 'am_michael', female: 'af_sarah' },
                es: { endpoint: 'fal-ai/kokoro/spanish', male: 'em_alex', female: 'ef_dora' },
                ja: { endpoint: 'fal-ai/kokoro/japanese', male: 'jm_kumo', female: 'jf_alpha' },
                hi: { endpoint: 'fal-ai/kokoro/hindi', male: 'hm_omega', female: 'hf_alpha' },
                it: { endpoint: 'fal-ai/kokoro/italian', male: 'im_nicola', female: 'if_sara' },
                pt: { endpoint: 'fal-ai/kokoro/brazilian-portuguese', male: 'pm_alpha', female: 'pf_dora' },
                zh: { endpoint: 'fal-ai/kokoro/mandarin-chinese', male: 'zm_alpha', female: 'zf_xiaobei' },
            };
            // Default to English if language not directly supported
            const cfg = kokoroConfig[langPrefix] || kokoroConfig['en'];
            const voiceId = effectiveGender === 'male' ? cfg.male : cfg.female;

            console.log(`[P2] Trying Kokoro (fal.ai) | lang: ${langPrefix}, gender: ${effectiveGender}, voice: ${voiceId}, endpoint: ${cfg.endpoint}`);

            try {
                const falRes = await fetch(`https://fal.run/${cfg.endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${falKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: synthesisText,
                        voice: voiceId
                    })
                });

                if (falRes.ok) {
                    const result = await falRes.json();
                    if (result.audio && result.audio.url) {
                        // Download the audio file and convert to base64
                        const audioRes = await fetch(result.audio.url);
                        if (audioRes.ok) {
                            const arrayBuffer = await audioRes.arrayBuffer();
                            audioBase64 = Buffer.from(arrayBuffer).toString('base64');
                            provider = 'kokoro_fal';
                            console.log(`[P2] Kokoro SUCCESS | voice: ${voiceId}, size: ${arrayBuffer.byteLength}`);
                        } else {
                            console.warn(`[P2] Kokoro audio download failed: ${audioRes.status}`);
                        }
                    } else {
                        console.warn(`[P2] Kokoro response missing audio URL:`, JSON.stringify(result).substring(0, 300));
                    }
                } else {
                    const errTxt = await falRes.text();
                    console.warn(`[P2] Kokoro FAILED (${falRes.status}): ${errTxt.substring(0, 300)}`);
                }
            } catch (e) {
                console.warn(`[P2] Kokoro exception: ${e.message}`);
            }
        }

        // ============================================================
        // PRIORITY 3: OpenAI TTS (if key exists)
        // ============================================================
        if (!audioBase64 && openAiKey) {
            try {
                const OpenAI = (await import('npm:openai')).default;
                const openai = new OpenAI({ apiKey: openAiKey });
                const selectedVoice = effectiveGender === 'male' ? 'alloy' : 'nova';
                console.log(`[P3] Trying OpenAI TTS | voice: ${selectedVoice}`);

                const mp3 = await openai.audio.speech.create({
                    model: "tts-1", voice: selectedVoice, input: synthesisText
                });
                audioBase64 = Buffer.from(await mp3.arrayBuffer()).toString('base64');
                provider = "openai";
                console.log(`[P3] OpenAI SUCCESS`);
            } catch (e) {
                console.warn(`[P3] OpenAI FAILED: ${e.message}`);
            }
        }

        // ============================================================
        // PRIORITY 4: Google Translate TTS (Free fallback - NO gender support)
        // ============================================================
        if (!audioBase64) {
            try {
                console.log(`[P4] Trying Google Free TTS (NO gender support) | lang: ${language}`);
                const safeText = synthesisText.length > 200 ? synthesisText.substring(0, 200) : synthesisText;
                const encodedText = encodeURIComponent(safeText);
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${language}&client=tw-ob`;
                
                const res = await fetch(url, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
                });

                if (!res.ok) throw new Error(`Google TTS status: ${res.status}`);
                audioBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
                provider = "google_free";
                console.log(`[P4] Google Free SUCCESS (gender NOT applied)`);
            } catch (err) {
                console.error(`[P4] Google Free FAILED: ${err.message}`);
                return Response.json({ error: "All TTS providers failed." }, { status: 502 });
            }
        }

        return Response.json({ 
            audioBase64, provider,
            applied: { speed: Number(speed), pitch: Number(pitch), gender: effectiveGender, emotion },
            note: provider === 'google_free' ? 'Using free tier - gender/voice selection not supported' : undefined 
        });

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
    }
});