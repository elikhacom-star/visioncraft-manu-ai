import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Handles saving a project to the database
 */
export async function saveProject({
    userData, script, language, currentProjectId, setCurrentProjectId,
    generatedVideoBlob, generatedImages, storyboard,
    artStyle, selectedVoice, aspectRatio,
    setIsSaving, forceNew = false
}) {
    if (!userData) { alert("Connectez-vous pour sauvegarder"); base44.auth.redirectToLogin(); return; }
    if (!script) { alert("Projet vide."); return; }
    setIsSaving(true);
    try {
        let finalVideoUrl = null;
        if (generatedVideoBlob) {
            const vf = new File([generatedVideoBlob], `project_${Date.now()}.webm`, { type: 'video/webm' });
            const ur = await base44.integrations.Core.UploadFile({ file: vf });
            if (ur?.file_url) finalVideoUrl = ur.file_url;
        }
        const imgKeys = ['scene_number','url','description','duration','dialogue','effect','easing','filter','brightness','contrast','saturation','vignette','overlayText','startX','startY','startScale','endX','endY','endScale','keyframes','wipeAngle','irisX','irisY','overlaySpeed','overlayDensity','overlayColor','tiltX','tiltY'];
        const cleanedImages = generatedImages.map(img => Object.fromEntries(imgKeys.map(k => [k, img[k]])));
        const cleanedStoryboard = storyboard ? { title: storyboard.title || '', scenes: (storyboard.scenes || []).map(s => ({ scene_number: s.scene_number, description: s.description || '', dialogue: s.dialogue || '', duration: s.duration || 5 })) } : null;
        const safeName = script?.trim() ? script.substring(0, 50) + (script.length > 50 ? '...' : '') : "Sans titre " + new Date().toLocaleTimeString();
        const projectData = { name: safeName, description: `Created on ${new Date().toLocaleDateString()}`, status: generatedVideoBlob ? 'completed' : 'draft', script, language: language || "en", settings: { artStyle: artStyle || '', voice: selectedVoice || 'alloy', aspectRatio: aspectRatio || '16:9' }, storyboard_data: cleanedStoryboard || {}, generated_images: cleanedImages || [], final_video_url: finalVideoUrl || "", thumbnail_url: cleanedImages?.[0]?.url || "" };
        if (currentProjectId && !forceNew) {
            await base44.entities.Project.update(currentProjectId, projectData);
            toast.success("Projet mis à jour !");
        } else {
            const sp = await base44.entities.Project.create(projectData);
            setCurrentProjectId(sp.id);
            toast.success("Nouveau projet sauvegardé !");
        }
    } catch (err) {
        console.error("Save failed:", err);
        alert("Échec: " + (err.message || "Inconnu"));
    } finally {
        setIsSaving(false);
    }
}