import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, RefreshCw, Check, X, Wand2, GitBranch, Layers } from "lucide-react";
import { useLanguage } from './LanguageProvider';
import { InvokeLLM } from "@/integrations/Core";
import { toast } from "sonner";
import { getEmotionStyle } from './ai/EmotionVoiceMap';

export default function StoryboardSceneItem({ scene, index, onUpdate, onRegenerate, onBranchNarrative, onAdvancedStoryboard }) {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [dialogue, setDialogue] = useState(scene.dialogue || "");
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Sync state with props when scene updates externally
    React.useEffect(() => {
        setDialogue(scene.dialogue || "");
    }, [scene.dialogue]);

    const handleSave = () => {
        onUpdate(index, { dialogue });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDialogue(scene.dialogue || "");
        setIsEditing(false);
    };

    const handleRegenerateClick = async () => {
        setIsRegenerating(true);
        try {
            const prompt = `
                Rewrite this dialogue line to be more impactful and cinematic:
                "${scene.dialogue}"
                
                Context: ${scene.visual_description}
                Mood: ${scene.mood || 'neutral'}
                
                Return ONLY the new dialogue text.
            `;
            
            const newDialogue = await InvokeLLM({ prompt });
            if (newDialogue) {
                const cleaned = newDialogue.replace(/^"|"$/g, '').trim();
                setDialogue(cleaned);
                onUpdate(index, { dialogue: cleaned });
                toast.success(t('toast_dialogue_regenerated'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('toast_dialogue_failed'));
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-amber-200 transition-colors group">
            <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 items-center">
                    <Badge className="bg-amber-100 text-amber-700 text-xs whitespace-nowrap">
                        {t('scene') || 'Scene'} {scene.scene_number} ({scene.duration}s)
                    </Badge>
                    {scene.emotion_label && (() => { const es = getEmotionStyle(scene.emotion_label); return <Badge variant="outline" className={`text-[9px] ${es.color}`}>{es.icon} {scene.emotion_label}</Badge>; })()}
                    {scene.pacing_reason && (
                        <div className="text-[9px] text-slate-400 text-center leading-tight max-w-[60px]">
                            {scene.pacing_reason}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{scene.camera_angle}</p>
                        <p className="text-xs text-gray-600">{scene.visual_description}</p>
                        {scene.composition_notes && (
                            <div className="flex gap-1 mt-1">
                                <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100">
                                    📐 {scene.composition_notes}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea 
                                    value={dialogue}
                                    onChange={(e) => setDialogue(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                    placeholder={t('placeholder_enter_dialogue')}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0" title={t('btn_cancel')}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white">
                                        <Check className="w-4 h-4 mr-1" /> {t('btn_save')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="group/text relative cursor-pointer rounded hover:bg-amber-50/50 p-1 -ml-1 transition-colors"
                                onClick={() => setIsEditing(true)}
                            >
                                <p className="text-sm text-gray-700 italic border-l-2 border-amber-200 pl-2">
                                    "{scene.dialogue}"
                                </p>
                                <div className="absolute right-0 top-0 flex gap-1 opacity-0 group-hover/text:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAdvancedStoryboard?.(index); }} className="h-6 w-6 p-0 bg-white shadow-sm border border-gray-100 hover:text-amber-600" title="Storyboard Avancé">
                                        <Layers className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onBranchNarrative?.(index); }} className="h-6 w-6 p-0 bg-white shadow-sm border border-gray-100 hover:text-purple-600" title="Branchement Narratif">
                                        <GitBranch className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={(e) => { e.stopPropagation(); handleRegenerateClick(); }}
                                        disabled={isRegenerating}
                                        className="h-6 w-6 p-0 bg-white shadow-sm border border-gray-100 hover:text-amber-600"
                                        title={t('btn_regenerate_script')}
                                    >
                                        {isRegenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                        className="h-6 w-6 p-0 bg-white shadow-sm border border-gray-100 hover:text-blue-600"
                                        title={t('btn_edit_script')}
                                    >
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}