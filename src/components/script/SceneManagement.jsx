import { playSFX } from '../effects/SlideEffects';
import { toast } from 'sonner';

export function handleSaveSceneLogic(editingSceneIndex, updatedScene, generatedImages, storyboard, setGeneratedImages, setStoryboard, saveToHistory) {
    if (editingSceneIndex === null) return;
    saveToHistory();
    setGeneratedImages(prev => { const n = [...prev]; n[editingSceneIndex] = updatedScene; return n; });
    if (storyboard && storyboard.scenes) {
        const ns = { ...storyboard }; ns.scenes = [...storyboard.scenes];
        if (ns.scenes[editingSceneIndex]) {
            ns.scenes[editingSceneIndex] = { ...ns.scenes[editingSceneIndex], duration: updatedScene.duration, effect: updatedScene.effect, visual_description: updatedScene.description, dialogue: updatedScene.dialogue, easing: updatedScene.easing, filter: updatedScene.filter, brightness: updatedScene.brightness, contrast: updatedScene.contrast, saturation: updatedScene.saturation, vignette: updatedScene.vignette, startX: updatedScene.startX, startScale: updatedScene.startScale, endX: updatedScene.endX, endScale: updatedScene.endScale, keyframes: updatedScene.keyframes, wipeAngle: updatedScene.wipeAngle, irisX: updatedScene.irisX, irisY: updatedScene.irisY, overlaySpeed: updatedScene.overlaySpeed, overlayDensity: updatedScene.overlayDensity, overlayColor: updatedScene.overlayColor, tiltX: updatedScene.tiltX, tiltY: updatedScene.tiltY };
            setStoryboard(ns);
        }
    }
}

export function handleAddSceneLogic(generatedImages, storyboard, setGeneratedImages, setStoryboard, saveToHistory) {
    saveToHistory();
    const nn = generatedImages.length + 1;
    const ns = { scene_number: nn, duration: 5, description: "New Scene", dialogue: "", effect: 'zoom-in', url: null };
    setGeneratedImages(prev => [...prev, ns]);
    if (storyboard) setStoryboard(prev => ({ ...prev, scenes: [...(prev.scenes || []), { scene_number: nn, duration: 5, visual_description: "New Scene", dialogue: "" }] }));
    playSFX('click'); toast.success("Scène ajoutée !", { duration: 1500 });
}

export function handleDeleteSceneLogic(index, generatedImages, storyboard, voiceovers, setGeneratedImages, setStoryboard, setVoiceovers, saveToHistory) {
    if (generatedImages[index]?.isLocked) { toast.error("Scène verrouillée."); return; }
    if (generatedImages.length <= 1) { toast.error("Cannot delete the last scene."); return; }
    saveToHistory();
    const ni = generatedImages.filter((_, i) => i !== index).map((s, i) => ({ ...s, scene_number: i + 1 }));
    setGeneratedImages(ni);
    if (storyboard) { const ns = { ...storyboard }; ns.scenes = (storyboard.scenes || []).filter((_, i) => i !== index).map((s, i) => ({ ...s, scene_number: i + 1 })); setStoryboard(ns); }
    if (voiceovers.length > index) setVoiceovers(voiceovers.filter((_, i) => i !== index));
    playSFX('click');
}

export function handleApplyNarrativeBranchLogic(branchData, generatedImages, storyboard, setGeneratedImages, setStoryboard, artStyle, styleRefDescription, negativePrompt, GenerateImage, userData, base44) {
    const { sceneIndex, newDescription, newDialogue, newMood, branchTitle, consequences, regenerateVisuals } = branchData;
    const ni = [...generatedImages]; const nsd = storyboard ? { ...storyboard } : null;
    if (ni[sceneIndex]) ni[sceneIndex] = { ...ni[sceneIndex], description: newDescription, dialogue: newDialogue, mood: newMood };
    if (nsd?.scenes?.[sceneIndex]) nsd.scenes[sceneIndex] = { ...nsd.scenes[sceneIndex], visual_description: newDescription, dialogue: newDialogue, mood: newMood };
    setGeneratedImages(ni); if (nsd) setStoryboard(nsd);
    if (regenerateVisuals) {
        toast.loading(`Génération de "${branchTitle}"...`);
        const ip = `Create a high-quality, cinematic image for this scene:\nScene: ${newDescription}\nMood: ${newMood}\nStyle: Professional cinematography.\n${artStyle ? `Artistic Style: ${artStyle}.` : ''}\n${styleRefDescription ? `VISUAL STYLE REFERENCE: ${styleRefDescription}` : ''}\n${negativePrompt ? `Avoid: ${negativePrompt}.` : ''}`;
        GenerateImage({ prompt: ip }).then(ir => {
            if (ir?.url) { ni[sceneIndex].url = ir.url; ni[sceneIndex].videoUrl = null; setGeneratedImages([...ni]); toast.dismiss(); toast.success(`Branche "${branchTitle}" appliquée !`); }
        }).catch(() => toast.error("Échec de la régénération"));
    }
    if (userData) base44.entities.ActivityLog.create({ action: 'narrative_branch_applied', details: `Applied narrative branch: ${branchTitle}`, metadata: { sceneIndex, branchTitle, consequences } }).catch(() => {});
}

export function onDragEndLogic(result, generatedImages, voiceovers, storyboard, setGeneratedImages, setVoiceovers, setStoryboard) {
    if (!result.destination) return;
    const si = result.source.index, di = result.destination.index;
    if (si === di) return;
    if (generatedImages[si]?.isLocked) { toast.error("Scène verrouillée."); return; }
    playSFX('click');
    const ni = Array.from(generatedImages); const [ri] = ni.splice(si, 1); ni.splice(di, 0, ri); setGeneratedImages(ni);
    if (voiceovers.length > 0 && voiceovers.length === generatedImages.length) { const nv = Array.from(voiceovers); const [rv] = nv.splice(si, 1); nv.splice(di, 0, rv); setVoiceovers(nv); }
    if (storyboard?.scenes) { const ns = { ...storyboard }; const nsc = Array.from(storyboard.scenes); const [rs] = nsc.splice(si, 1); nsc.splice(di, 0, rs); ns.scenes = nsc; setStoryboard(ns); }
}