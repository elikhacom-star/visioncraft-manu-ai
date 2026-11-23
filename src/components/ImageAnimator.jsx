/**
 * ImageAnimator — Extracted from Home.js to reduce file size.
 * Handles AI-powered and client-side image animation.
 */
import { base44 } from "@/api/base44Client";
import { playSFX } from './effects/SlideEffects';

export async function animateImage({
  uploadedImageFile, uploadedImageUrl, animationModel, animationPrompt,
  animationEffect, animationEasing, animationDuration, imageFilters,
  setIsAnimating, setError, setCurrentTask, setProgress,
  setGeneratedVideoBlob, setVideoUrl, renderImageSceneWithEffects, t
}) {
  if (!uploadedImageFile) { setError(t('error_no_image')); return; }
  setIsAnimating(true); setError('');

  if (animationModel === 'native-client') {
    setCurrentTask("Generating native animation (Client-side)..."); setProgress(10);
    try {
      const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 576;
      const ctx = canvas.getContext('2d');
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.src = uploadedImageUrl || URL.createObjectURL(uploadedImageFile);
      await new Promise((r, e) => { img.onload = r; img.onerror = e; });
      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' }); const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); setGeneratedVideoBlob(blob); setVideoUrl(URL.createObjectURL(blob)); setIsAnimating(false); setProgress(100); playSFX('success'); };
      rec.start();
      const mockData = { scene_number: 1, url: uploadedImageUrl, description: animationPrompt || "Native Animation", duration: animationDuration, effect: animationEffect, easing: animationEasing, brightness: imageFilters.brightness, contrast: imageFilters.contrast, saturation: imageFilters.saturation, vignette: imageFilters.vignette, tiltX: imageFilters.tiltX, tiltY: imageFilters.tiltY };
      await renderImageSceneWithEffects(ctx, canvas, img, mockData, animationDuration, null, null);
      rec.stop();
    } catch (err) { console.error("Native animation failed:", err); setError("Failed: " + err.message); setIsAnimating(false); }
    return;
  }

  setCurrentTask(t('status_animating') + "..."); setProgress(5);
  try {
    const reader = new FileReader(); reader.readAsDataURL(uploadedImageFile);
    await new Promise((resolve) => {
      reader.onload = async () => {
        try {
          const response = await base44.functions.invoke('animateImage', { imageBase64: reader.result, imageUrl: uploadedImageUrl, prompt: animationPrompt || "animate this image", provider: animationModel === 'auto' ? null : animationModel });
          if (response.data?.generationId) {
            const genId = response.data.generationId; const provider = response.data.provider || 'stability';
            setCurrentTask(`Processing with ${provider === 'fal' ? 'Fal.ai' : 'Stability AI'}...`);
            let attempts = 0; let videoBlob = null;
            while (attempts < 40) {
              await new Promise((r) => setTimeout(r, 3000)); attempts++;
              const statusRes = await base44.functions.invoke('getAnimationStatus', { id: genId, provider });
              if (statusRes.data.status === 'complete') {
                if (statusRes.data.videoUrl) { setVideoUrl(statusRes.data.videoUrl); try { const r = await fetch(statusRes.data.videoUrl); videoBlob = await r.blob(); setGeneratedVideoBlob(videoBlob); } catch(e){} break; }
                if (statusRes.data.videoBase64) { const b = window.atob(statusRes.data.videoBase64); const u = new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); videoBlob = new Blob([u],{type:'video/mp4'}); break; }
              } else if (statusRes.data.error) throw new Error(statusRes.data.error);
              setProgress(Math.min(95, 10 + attempts * 2));
            }
            if (videoBlob) { setGeneratedVideoBlob(videoBlob); setVideoUrl(URL.createObjectURL(videoBlob)); setIsAnimating(false); setProgress(100); setCurrentTask(t('video_ready')); playSFX('success'); }
            else throw new Error("Timed out.");
          } else if (response.data?.videoBase64) {
            const b = window.atob(response.data.videoBase64); const u = new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
            const blob = new Blob([u],{type:'video/mp4'}); setGeneratedVideoBlob(blob); setVideoUrl(URL.createObjectURL(blob)); setIsAnimating(false); setProgress(100); setCurrentTask(t('video_ready')); playSFX('success');
          } else if (response.data?.error) throw new Error(response.data.error);
          else throw new Error("Unknown response");
        } catch (err) { console.error("AI Animation error:", err); setError(err.message); setIsAnimating(false); }
        resolve();
      };
    });
  } catch (err) { console.error("Animation error:", err); setError(err.message || t('error_animation_failed')); setIsAnimating(false); }
}