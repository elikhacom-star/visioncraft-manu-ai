import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { audioUrl, voiceName, voiceDescription, settings } = await req.json();

        if (!audioUrl || !voiceName) {
            return Response.json({ error: 'audioUrl and voiceName are required' }, { status: 400 });
        }

        // Check if ElevenLabs API key is available
        if (!ELEVENLABS_API_KEY) {
            return Response.json({ 
                error: 'Voice cloning requires ElevenLabs API key. Please set ELEVENLABS_API_KEY in secrets.',
                code: 'MISSING_API_KEY'
            }, { status: 400 });
        }

        console.log(`Cloning voice: ${voiceName} for user: ${user.email}`);

        // Download the audio file
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
            return Response.json({ error: 'Failed to download audio file' }, { status: 400 });
        }
        
        const audioBlob = await audioResponse.blob();
        const audioBuffer = await audioBlob.arrayBuffer();

        // Prepare form data for ElevenLabs
        const formData = new FormData();
        formData.append('name', voiceName);
        formData.append('description', voiceDescription || `Cloned voice: ${voiceName}`);
        formData.append('files', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'voice_sample.mp3');
        
        // Add labels for organization
        formData.append('labels', JSON.stringify({
            user_email: user.email,
            emotional_style: settings?.emotional_style || 'neutral',
            speaking_style: settings?.speaking_style || 'narrative'
        }));

        // Clone voice using ElevenLabs API
        const cloneResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: formData
        });

        if (!cloneResponse.ok) {
            const errorText = await cloneResponse.text();
            console.error('ElevenLabs clone error:', errorText);
            
            // Parse error for better messaging
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.detail?.status === 'quota_exceeded') {
                    return Response.json({ 
                        error: 'Voice cloning quota exceeded. Please upgrade your ElevenLabs plan.',
                        code: 'QUOTA_EXCEEDED'
                    }, { status: 400 });
                }
                return Response.json({ 
                    error: errorJson.detail?.message || 'Voice cloning failed',
                    code: 'CLONE_FAILED'
                }, { status: 400 });
            } catch {
                return Response.json({ error: 'Voice cloning failed: ' + errorText }, { status: 400 });
            }
        }

        const cloneResult = await cloneResponse.json();
        console.log('Voice cloned successfully:', cloneResult.voice_id);

        // Optionally set voice settings
        if (settings && cloneResult.voice_id) {
            try {
                const settingsResponse = await fetch(
                    `https://api.elevenlabs.io/v1/voices/${cloneResult.voice_id}/settings/edit`,
                    {
                        method: 'POST',
                        headers: {
                            'xi-api-key': ELEVENLABS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            stability: settings.stability ?? 0.5,
                            similarity_boost: settings.similarity_boost ?? 0.75,
                            style: settings.style ?? 0.0,
                            use_speaker_boost: settings.use_speaker_boost ?? true
                        })
                    }
                );

                if (!settingsResponse.ok) {
                    console.warn('Failed to update voice settings:', await settingsResponse.text());
                }
            } catch (e) {
                console.warn('Voice settings update error:', e);
            }
        }

        // Log the activity
        try {
            await base44.asServiceRole.entities.ActivityLog.create({
                action: 'voice_cloned',
                details: `User cloned voice: ${voiceName}`,
                metadata: {
                    voice_id: cloneResult.voice_id,
                    voice_name: voiceName,
                    user_email: user.email
                }
            });
        } catch (e) {
            console.warn('Failed to log activity:', e);
        }

        return Response.json({
            voice_id: cloneResult.voice_id,
            name: voiceName,
            description: voiceDescription,
            settings: settings
        });

    } catch (error) {
        console.error('Voice cloning error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});