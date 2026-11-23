import { base44 } from "@/api/base44Client";
import { STYLE_PRESETS } from '../effects/SlideEffects';
const GenerateImage = (p) => base44.integrations.Core.GenerateImage(p);
export async function applyStyleTransfer({ styleConfig, generatedImages, storyboardMotion, artStyle, setIsApplyingStyle, setCurrentTask, setProgress, setGeneratedImages, setShowStyleTransferModal, playSFX }) {
  if (!generatedImages?.length) { alert('No content.'); return; }
  setIsApplyingStyle(true); setCurrentTask('Applying AI style transfer...');
  try {
    let styleDescription = '';
    if (styleConfig.mode === 'preset') { const p = STYLE_PRESETS.find(p => p.id === styleConfig.presetId); if (!p) throw new Error('Invalid preset'); styleDescription = p.prompt; }
    else { const u = await base44.integrations.Core.UploadFile({ file: styleConfig.image }); if (!u?.file_url) throw new Error('Upload failed'); const r = await base44.functions.invoke('analyzeStyle', { imageUrl: u.file_url }); if (!r.data?.styleDescription) throw new Error('Analysis failed'); styleDescription = r.data.styleDescription; }
    const styledScenes = [];
    for (let i = 0; i < generatedImages.length; i++) {
      setCurrentTask(`Styling scene ${i+1}/${generatedImages.length}...`); setProgress(10 + i/generatedImages.length*80);
      const scene = generatedImages[i];
      if (scene.videoUrl || storyboardMotion === 'ai-video') {
        try { const r = await base44.functions.invoke('styleVideo', { stylePrompt: `${scene.description}, ${styleDescription}`, initImage: scene.url, strength: styleConfig.videoStrength || 0.7, temporalConsistency: styleConfig.temporalConsistency || 0.5 });
          if (r.data?.videoBase64) { const b = window.atob(r.data.videoBase64); const u = new Uint8Array(b.length); for(let k=0;k<b.length;k++) u[k]=b.charCodeAt(k); styledScenes.push({ ...scene, videoUrl: URL.createObjectURL(new Blob([u],{type:'video/mp4'})), effect: 'none' }); continue; }
        } catch(e) { console.warn("Video styling failed", e); }
      }
      try { const r = await GenerateImage({ prompt: `${scene.description}\nSTYLE: ${styleDescription}` }); styledScenes.push(r?.url ? { ...scene, url: r.url, effect: 'warp-flow' } : scene); }
      catch(e) { styledScenes.push(scene); }
      await new Promise(r => setTimeout(r, 1000));
    }
    setGeneratedImages(styledScenes); setCurrentTask('Style transfer complete!'); setProgress(100); playSFX('success');
    setTimeout(() => { setShowStyleTransferModal(false); setCurrentTask(''); setProgress(0); }, 2000);
  } catch(e) { console.error('Style transfer failed:', e); alert(`Failed: ${e.message}`); }
  finally { setIsApplyingStyle(false); }
}