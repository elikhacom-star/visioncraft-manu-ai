// Helper to generate AI video from image (Polling Logic)
import { base44 } from "@/api/base44Client";
import { generateSecureVideo, isSecureVideoApiConfigured } from "@/api/videoApi";

export const generateAiVideoFromImage = async (imageUrl, prompt, animationModel) => {
    try {
        if (isSecureVideoApiConfigured) {
            return await generateSecureVideo({
                imageUrl,
                prompt,
                duration: 5,
                mode: 'image-to-video',
                onStatus: (status) => console.debug('Secure video status:', status.status)
            });
        }
        let imageBase64 = null;
        try {
            const imgRes = await fetch(imageUrl);
            const blob = await imgRes.blob();
            imageBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) { console.warn("Failed to convert image to base64:", e); }

        const provider = animationModel === 'auto' ? null : animationModel;
        const response = await base44.functions.invoke('animateImage', { 
            imageUrl, imageBase64, prompt, provider
        });

        if (response.data && response.data.generationId) {
            const genId = response.data.generationId;
            const usedProvider = response.data.provider;
            let attempts = 0;
            while (attempts < 40) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
                const statusRes = await base44.functions.invoke('getAnimationStatus', { id: genId, provider: usedProvider });
                if (statusRes.data.status === 'complete') {
                    if (statusRes.data.videoUrl) return statusRes.data.videoUrl;
                    if (statusRes.data.videoBase64) {
                        const bin = window.atob(statusRes.data.videoBase64);
                        const bytes = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                        return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
                    }
                } else if (statusRes.data.error) throw new Error(statusRes.data.error);
            }
            throw new Error("Timeout waiting for AI video");
        } else if (response.data?.videoBase64) {
            const bin = window.atob(response.data.videoBase64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
        } else if (response.data?.error) throw new Error(response.data.error);
        throw new Error("Invalid response from animateImage");
    } catch (e) {
        console.error("AI Video Generation Failed:", e);
        // Native fallback
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 576;
            const ctx = canvas.getContext('2d');
            const img = new Image(); img.crossOrigin = 'anonymous'; img.src = imageUrl;
            await new Promise(r => { img.onload = r; img.onerror = r; });
            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];
            recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
            const nativePromise = new Promise(resolve => {
                recorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
            });
            recorder.start();
            for(let f=0; f<90; f++) {
                const p = f / 90;
                ctx.clearRect(0,0,1024,576);
                const scale = 1 + (0.1 * p);
                ctx.save(); ctx.translate(512, 288); ctx.scale(scale, scale); ctx.translate(-512, -288);
                ctx.drawImage(img, 0, 0, 1024, 576); ctx.restore();
                await new Promise(r => setTimeout(r, 33));
            }
            recorder.stop();
            return await nativePromise;
        } catch (nativeErr) { console.error("Native fallback failed:", nativeErr); return null; }
    }
};
