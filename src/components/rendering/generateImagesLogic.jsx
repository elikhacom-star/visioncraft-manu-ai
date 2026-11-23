import { base44 } from "@/api/base44Client";
import { generateSecureVideo, isSecureVideoApiConfigured } from "@/api/videoApi";
const GenerateImage = (p) => base44.integrations.Core.GenerateImage(p);

// Load all characters once and return a helper to inject character descriptions into prompts
async function loadCharacters() {
  try {
    return await base44.entities.Character.list();
  } catch (e) {
    return [];
  }
}

function injectCharacterDescriptions(visualDescription, dialogue, characters) {
  if (!characters || characters.length === 0) return '';
  const text = (visualDescription + ' ' + (dialogue || '')).toLowerCase();
  const matched = characters.filter(c => text.includes(c.name.toLowerCase()));
  if (matched.length === 0) return '';
  return matched.map(c => `CHARACTER "${c.name}": ${c.description}${c.personality ? ` Personality: ${c.personality}` : ''}`).join('\n');
}

export async function generateImagesLogic({ storyboardData, existingImages = [], setCurrentTask, setProgress, artStyle, styleRefDescription, negativePrompt, uploadedImageUrl, storyboardMotion, sceneConsistency, videoGuidance, videoFrames, videoModel, videoMotionBucket, motionInterpolation, SLIDE_EFFECTS, setGeneratedImages, setSceneVariants, setCurrentStep, createVoiceover, generateAiVideoFromImage }) {
  setCurrentTask('Generating visuals for each scene...');
  const images = []; const scenes = storyboardData.scenes || []; const variants = {};
  let previousSceneContext = "";
  const characters = await loadCharacters();
  for (let i = 0; i < scenes.length; i++) {
    setProgress(25 + i / scenes.length * 25);
    setCurrentTask(`Generating scene ${i + 1} of ${scenes.length}...`);

    // Skip locked scenes — reuse existing image
    if (existingImages[i]?.isLocked && existingImages[i]?.url) {
      images.push({ ...existingImages[i] });
      previousSceneContext = scenes[i].visual_description;
      continue;
    }
    if (storyboardMotion === 'ai-video' && (!uploadedImageUrl || i > 0)) {
      try {
        setCurrentTask(`Generating AI Video for scene ${i + 1}...`);
        let videoPrompt = `Cinematic shot, ${scenes[i].camera_angle}, ${scenes[i].visual_description}, ${scenes[i].mood} atmosphere. High quality, smooth motion.`;
        if (sceneConsistency && i > 0) {
          let cc = ` VISUAL CONSISTENCY: Maintain style of previous scene: ${previousSceneContext}.`;
          const prev = images[i - 1];
          if (prev && (prev.url || prev.videoUrl)) { try { const ar = await base44.functions.invoke('analyzeStyle', { imageUrl: prev.url || prev.videoUrl }); if (ar.data?.styleDescription) cc += ` Match: ${ar.data.styleDescription}.`; } catch (e) {} }
          videoPrompt += cc;
        }
        if (isSecureVideoApiConfigured) {
          const videoUrl = await generateSecureVideo({
            prompt: videoPrompt,
            imageUrl: sceneConsistency && i > 0 && images[i - 1]?.url ? images[i - 1].url : null,
            duration: Math.min(scenes[i].duration || 5, 5),
            mode: sceneConsistency && i > 0 && images[i - 1]?.url ? 'hybrid' : 'text-to-video',
            onStatus: (status) => setCurrentTask(`Génération vidéo scène ${i + 1} : ${status.status}`)
          });
          const thumb = await makeVideoThumbnail(videoUrl);
          images.push({ scene_number: scenes[i].scene_number, url: thumb, videoUrl, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: 'none' });
          previousSceneContext = scenes[i].visual_description;
          continue;
        }
        const response = await base44.functions.invoke('generateVideoFromText', { prompt: videoPrompt, negative_prompt: negativePrompt || "blurry, distortion, low quality", guidance_scale: videoGuidance || 14.0, num_frames: videoFrames || 24, model: videoModel, motion_bucket_id: videoMotionBucket, interpolation: motionInterpolation, reference_image: sceneConsistency && i > 0 && images[i - 1]?.url ? images[i - 1].url : null });
        previousSceneContext = scenes[i].visual_description;
        if (response.data?.videoBase64) {
          const bin = window.atob(response.data.videoBase64); const bytes = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
          const videoUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
          let thumbnailUrl = null;
          try { const vid = document.createElement('video'); vid.src = videoUrl; await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; }); vid.currentTime = 0.5; await new Promise(r => { vid.onseeked = r; setTimeout(r, 1000); }); const cvs = document.createElement('canvas'); cvs.width = 480; cvs.height = 270; cvs.getContext('2d').drawImage(vid, 0, 0, cvs.width, cvs.height); thumbnailUrl = cvs.toDataURL('image/jpeg'); } catch (e) {}
          images.push({ scene_number: scenes[i].scene_number, url: thumbnailUrl, videoUrl, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: 'none' });
          continue;
        } else throw new Error(response.data?.error || "Video generation failed");
      } catch (err) { scenes[i].effect = 'warp-flow'; }
    }
    try {
      if (i === 0 && uploadedImageUrl) {
        let fs = { scene_number: scenes[i].scene_number, url: uploadedImageUrl, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: scenes[i].effect || SLIDE_EFFECTS[i % SLIDE_EFFECTS.length] };
        if (storyboardMotion === 'ai-video') { try { const vu = await generateAiVideoFromImage(uploadedImageUrl, `Cinematic motion, ${scenes[i].camera_angle}, ${scenes[i].visual_description}`); if (vu) { fs.videoUrl = vu; fs.effect = 'none'; } } catch (e) {} }
        images.push(fs); await new Promise(r => setTimeout(r, 500)); continue;
      }
      const characterContext = injectCharacterDescriptions(scenes[i].visual_description, scenes[i].dialogue, characters);
      const ip = `Create a high-quality, cinematic image for this scene:\nScene: ${scenes[i].visual_description}\nMood: ${scenes[i].mood}\nCamera: ${scenes[i].camera_angle}\n${characterContext ? `\nCHARACTER APPEARANCE (strictly follow):\n${characterContext}\n` : ''}\n${artStyle ? `CRITICAL VISUAL STYLE: ${artStyle}` : 'Style: Cinematic, professional.'}\n- Professional cinematography, ${scenes[i].mood} atmosphere\n${styleRefDescription ? `VISUAL STYLE REFERENCE: ${styleRefDescription}` : ''}\n${negativePrompt ? `Avoid: ${negativePrompt}.` : 'Avoid: low quality, blurry.'}`;
      const ir = await GenerateImage({ prompt: ip });
      if (ir?.url) {
        let mi = { scene_number: scenes[i].scene_number, url: ir.url, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: scenes[i].effect || SLIDE_EFFECTS[i % SLIDE_EFFECTS.length] };
        if (storyboardMotion === 'ai-video') { try { const vu = await generateAiVideoFromImage(ir.url, `Cinematic motion, ${scenes[i].camera_angle}, ${scenes[i].visual_description}`); if (vu) { mi.videoUrl = vu; mi.effect = 'none'; } else mi.effect = 'warp-flow'; } catch (e) { mi.effect = 'warp-flow'; } }
        // Store prompt history on the scene
        mi.prompt_history = [{ prompt: ip, url: ir.url, timestamp: new Date().toISOString() }];
        images.push(mi);
        // Async variants
        (async () => { const vUrls = []; try { for (let v = 0; v < 2; v++) { const vr = await GenerateImage({ prompt: `${ip}\n\nVariation ${v + 1}: ${v === 0 ? 'warmer tones and closer framing' : 'cooler tones and wider perspective'}` }); if (vr?.url) vUrls.push(vr.url); await new Promise(r => setTimeout(r, 500)); } } catch (e) {} if (vUrls.length > 0) variants[i] = vUrls.map(u => ({ ...mi, url: u, videoUrl: null })); })().catch(() => {});
      } else { images.push({ scene_number: scenes[i].scene_number, url: null, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: scenes[i].effect || SLIDE_EFFECTS[i % SLIDE_EFFECTS.length] }); }
    } catch (err) { images.push({ scene_number: scenes[i].scene_number, url: null, description: scenes[i].visual_description, duration: scenes[i].duration || 5, dialogue: scenes[i].dialogue || "", effect: scenes[i].effect || SLIDE_EFFECTS[i % SLIDE_EFFECTS.length] }); }
    await new Promise(r => setTimeout(r, 1000));
  }
  setGeneratedImages(images); setSceneVariants(variants); setProgress(50); setCurrentStep(4);
  await createVoiceover(storyboardData, images);
}

async function makeVideoThumbnail(videoUrl) {
  try {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = reject; });
    video.currentTime = 0.2;
    await new Promise(resolve => { video.onseeked = resolve; setTimeout(resolve, 1000); });
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 270;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (_) { return null; }
}
