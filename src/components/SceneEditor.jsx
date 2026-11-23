import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save, X, Palette, Upload, HelpCircle, Lightbulb, Music, MousePointer2, Move, Fingerprint, PlayCircle, ArrowUp, Plus, Trash2, Package } from "lucide-react";

const KEYFRAME_PRESETS = [
    { label: "Slow Zoom In", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:50, y:50, scale:1.2, rotation:0}] },
    { label: "Dramatic Zoom", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:50, y:50, scale:1.5, rotation:5}] },
    { label: "Pan Left", kfs: [{x:20, y:50, scale:1.1, rotation:0}, {x:80, y:50, scale:1.1, rotation:0}] },
    { label: "Pan Right", kfs: [{x:80, y:50, scale:1.1, rotation:0}, {x:20, y:50, scale:1.1, rotation:0}] },
    { label: "Orbit CW", kfs: [{x:40, y:40, scale:1.1, rotation:0}, {x:60, y:40, scale:1.15, rotation:5}, {x:60, y:60, scale:1.1, rotation:10}, {x:40, y:60, scale:1.05, rotation:15}] },
    { label: "Dynamic Float", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:55, y:45, scale:1.05, rotation:2}, {x:45, y:55, scale:1.05, rotation:-2}, {x:50, y:50, scale:1.0, rotation:0}] },
    { label: "Dolly Zoom", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:50, y:50, scale:0.8, rotation:0}] },
    { label: "Spiral In", kfs: [{x:30, y:30, scale:0.8, rotation:-10}, {x:70, y:30, scale:0.9, rotation:0}, {x:70, y:70, scale:1.0, rotation:10}, {x:50, y:50, scale:1.2, rotation:0}] },
    { label: "Heartbeat", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:50, y:50, scale:1.05, rotation:0}, {x:50, y:50, scale:1.0, rotation:0}, {x:50, y:50, scale:1.05, rotation:0}] },
    { label: "Shake & Zoom", kfs: [{x:50, y:50, scale:1.0, rotation:0}, {x:48, y:52, scale:1.1, rotation:-2}, {x:52, y:48, scale:1.15, rotation:2}, {x:50, y:50, scale:1.2, rotation:0}] },
];
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from './LanguageProvider';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

export default function SceneEditor({ isOpen, onClose, scene, onSave, onRegenerate, effects = [] }) {
    const { t } = useLanguage();
    const [currentScene, setCurrentScene] = useState(scene || {});
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [sceneStyleRef, setSceneStyleRef] = useState(null);
    const [activePointIndex, setActivePointIndex] = useState(null);
    const [isDraggingPoint, setIsDraggingPoint] = useState(false);
    const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const uploadInputRef = React.useRef(null);
    
    // AI Suggestions
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    
    // Advanced Animation State
    const [selectedKeyframe, setSelectedKeyframe] = useState(null);
    const [timelineZoom, setTimelineZoom] = useState(1);
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    useEffect(() => {
        setCurrentScene(scene || {});
        setSuggestions(null);
    }, [scene]);

    const handleSave = () => {
        onSave(currentScene);
        onClose();
    };

    const handleLocalUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast.loading("Uploading image...");
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            if (file_url) {
                setCurrentScene(prev => ({ ...prev, url: file_url, videoUrl: null }));
                toast.dismiss();
                toast.success("Image uploaded successfully!");
            } else {
                throw new Error("Upload failed to return a URL.");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            toast.dismiss();
            toast.error("Image upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleGetSuggestions = async () => {
        setIsSuggesting(true);
        try {
            // Using base44.integrations.Core.InvokeLLM directly from SDK import pattern used elsewhere?
            // Actually SceneEditor imports it from SDK client? No, it imports base44.
            // We need to import InvokeLLM from SDK or use base44.integrations.Core.InvokeLLM
            
            const prompt = `
                Act as a creative film director. Analyze this video scene and generate 3 RADICALLY DIFFERENT creative variations/reinterpretations.
                
                Current Context:
                Description: "${currentScene.description}"
                Mood: "${currentScene.mood || 'neutral'}"
                
                Goal: Offer the user distinct visual choices including SPECIFIC MOTION and TRANSITION suggestions based on the content.
                
                Provide 3 options in JSON:
                1. "Cinematic Drama": Focus on dramatic lighting, slow pushes, and dissolves.
                2. "Artistic/Abstract": Focus on composition, unique angles, and creative transitions (e.g. iris, wipe).
                3. "Dynamic Action": Focus on movement, energy, fast pans, and sharp cuts/wipes.
                
                Format: { 
                    "suggestions": [{ 
                        "label": "Label", 
                        "description": "Visual prompt...", 
                        "mood": "...", 
                        "angle": "...",
                        "effect": "zoom-in" | "pan-left" | "pan-right" | "shake" | "float" | "custom",
                        "transition": "fade" | "wipe" | "slide" | "iris" | "zoom" | "glitch"
                    }] 
                }
            `;
            
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    label: { type: "string" },
                                    description: { type: "string" },
                                    mood: { type: "string" },
                                    angle: { type: "string" },
                                    effect: { type: "string" },
                                    transition: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            
            if (response && response.suggestions) {
                setSuggestions(response.suggestions);
            }
        } catch (error) {
            console.error("Failed to get suggestions:", error);
            toast.error("Could not generate suggestions");
        } finally {
            setIsSuggesting(false);
        }
    };

    const applySuggestion = (suggestion) => {
        setCurrentScene({
            ...currentScene,
            description: suggestion.description,
            mood: suggestion.mood,
            effect: suggestion.effect || currentScene.effect,
            transition: suggestion.transition || currentScene.transition,
        });
        toast.success(`Applied ${suggestion.label} style & motion!`);
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            // Append style ref if set locally
            let prompt = currentScene.description;
            if (sceneStyleRef) {
                prompt += `\n\nSCENE SPECIFIC STYLE REF: ${sceneStyleRef}`;
            }
            await onRegenerate(prompt);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleUploadRef = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setIsAnalyzingRef(true);
        try {
            const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
            if (!uploadRes.file_url) throw new Error("Upload failed");
            
            const response = await base44.functions.invoke('analyzeStyle', { imageUrl: uploadRes.file_url });
            if (response.data?.styleDescription) {
                setSceneStyleRef(response.data.styleDescription);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzingRef(false);
        }
    };

    if (!scene) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('modal_edit_scene')} - {t('scene')} {currentScene.scene_number}</DialogTitle>
                    <DialogDescription>
                        Customize the visuals, timing, and effects for this specific scene.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image Preview & Prompt */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Visual Description (AI Prompt)</Label>
                            <div className="relative">
                                <input type="file" id="scene-style-upload" className="hidden" accept="image/*" onChange={handleUploadRef} />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs text-blue-600 hover:text-blue-700"
                                    onClick={() => document.getElementById('scene-style-upload').click()}
                                    disabled={isAnalyzingRef}
                                >
                                    <Palette className="w-3 h-3 mr-1.5" />
                                    {isAnalyzingRef ? 'Analyzing...' : sceneStyleRef ? 'Style Ref Set ✓' : 'Add Style Ref'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative w-32 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 group">
                                <input
                                    type="file"
                                    id="scene-image-upload-editor"
                                    ref={uploadInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLocalUpload}
                                    disabled={isUploading}
                                />
                                <label htmlFor="scene-image-upload-editor" className="absolute inset-0 cursor-pointer">
                                    {currentScene.url ? (
                                        <img src={currentScene.url} alt="Scene preview for AI video editing" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                </label>
                            </div>
                            <Textarea 
                                value={currentScene.description || ''} 
                                onChange={(e) => setCurrentScene({...currentScene, description: e.target.value})}
                                className="flex-1 h-20 text-sm"
                                placeholder="Describe the scene for AI image generation..."
                            />
                        </div>

                        {sceneStyleRef && (
                            <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 italic">
                                Using Scene Style Ref: "{sceneStyleRef.substring(0, 60)}..."
                            </div>
                        )}

                        {/* Dialogue Editor */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{t('label_script') || "Script / Dialogue"}</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs text-amber-600 hover:text-amber-700"
                                    onClick={async () => {
                                        toast.loading(t('generating_dialogue') || "Regenerating dialogue...");
                                        try {
                                            const prompt = `Rewrite this dialogue to be more cinematic and impactful: "${currentScene.dialogue || ''}". Context: ${currentScene.description}`;
                                            const res = await base44.integrations.Core.InvokeLLM({ prompt });
                                            if (res) {
                                                const cleaned = res.replace(/^"|"$/g, '').trim();
                                                setCurrentScene({...currentScene, dialogue: cleaned});
                                                toast.dismiss();
                                                toast.success(t('dialogue_regenerated') || "Dialogue regenerated!");
                                            }
                                        } catch(e) { 
                                            toast.dismiss();
                                            toast.error("Failed to regenerate"); 
                                        }
                                    }}
                                >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    {t('btn_regenerate') || "Regenerate"}
                                </Button>
                            </div>
                            <Textarea 
                                value={currentScene.dialogue || ''} 
                                onChange={(e) => setCurrentScene({...currentScene, dialogue: e.target.value})}
                                className="min-h-[80px] text-sm bg-slate-50"
                                placeholder={t('placeholder_enter_dialogue') || "Enter dialogue for this scene..."}
                            />
                            {/* Speech Rhythm Controls */}
                            {currentScene.dialogue && (
                                <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200 space-y-2">
                                    <Label className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Music className="w-3 h-3" /> Rythme de parole
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-emerald-600">
                                                <span>Vitesse</span>
                                                <span>{currentScene.speechSpeed || 1.0}x</span>
                                            </div>
                                            <Slider 
                                                value={[currentScene.speechSpeed || 1.0]}
                                                onValueChange={(val) => setCurrentScene({...currentScene, speechSpeed: val[0]})}
                                                min={0.5} max={2.0} step={0.1}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-emerald-600">
                                                <span>Pauses</span>
                                                <span>{currentScene.pauseStyle || 1.0}x</span>
                                            </div>
                                            <Slider 
                                                value={[currentScene.pauseStyle || 1.0]}
                                                onValueChange={(val) => setCurrentScene({...currentScene, pauseStyle: val[0]})}
                                                min={0.2} max={3.0} step={0.1}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-emerald-500">
                                        ≈ {(() => {
                                            const words = (currentScene.dialogue || '').split(/\s+/).filter(w => w.length > 0).length;
                                            const spd = currentScene.speechSpeed || 1.0;
                                            const pau = currentScene.pauseStyle || 1.0;
                                            const sentences = ((currentScene.dialogue || '').match(/[.!?…]+/g) || []).length;
                                            const commas = ((currentScene.dialogue || '').match(/[,;:–—]+/g) || []).length;
                                            const dur = (words / (2.5 * spd)) + ((sentences * 0.6 + commas * 0.25) * pau) + 0.5;
                                            return dur.toFixed(1);
                                        })()}s estimées pour {(currentScene.dialogue || '').split(/\s+/).filter(w => w.length > 0).length} mots
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={handleRegenerate}
                                disabled={isRegenerating || !currentScene.description || isUploading}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                                {isRegenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                {t('btn_regenerate')}
                            </Button>
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => uploadInputRef.current?.click()}
                                disabled={isUploading || isRegenerating}
                                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                {isUploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                {t('btn_upload_image', 'Uploader')}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleGetSuggestions}
                                disabled={isSuggesting || isUploading}
                                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                            >
                                {isSuggesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                            </Button>
                        </div>

                        {suggestions && (
                            <div className="bg-amber-50 rounded-lg p-3 space-y-2 border border-amber-100 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold text-amber-800">AI Suggestions</Label>
                                    <button onClick={() => setSuggestions(null)} className="text-amber-600 hover:text-amber-800"><X className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {suggestions.map((s, i) => (
                                        <div key={i} className="bg-white p-2 rounded border border-amber-100 text-xs hover:border-amber-300 cursor-pointer transition-colors group" onClick={() => applySuggestion(s)}>
                                            <div className="font-semibold text-slate-700 flex justify-between">
                                                {s.label}
                                                <span className="opacity-0 group-hover:opacity-100 text-amber-600 font-normal">Apply</span>
                                            </div>
                                            <p className="text-slate-600 mt-1 line-clamp-2">{s.description}</p>
                                            <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-500">
                                                <span className="bg-slate-100 px-1 rounded">Mood: {s.mood}</span>
                                                <span className="bg-blue-50 text-blue-600 px-1 rounded">Motion: {s.effect}</span>
                                                <span className="bg-purple-50 text-purple-600 px-1 rounded">Trans: {s.transition}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Duration */}
                      <div className="space-y-2">
                          <Label>{t('label_duration')} (s)</Label>
                          <div className="flex items-center gap-3">
                              <Slider 
                                  value={[currentScene.duration || 5]} 
                                  onValueChange={(val) => setCurrentScene({...currentScene, duration: val[0]})}
                                  min={2} 
                                  max={15} 
                                  step={0.5} 
                                  className="flex-1"
                              />
                              <span className="w-12 text-sm font-medium text-right">{currentScene.duration}s</span>
                              </div>
                              </div>

                              {/* Speed Control (Video Only) */}
                              {currentScene.videoUrl && (
                              <div className="space-y-2">
                              <Label>Speed</Label>
                              <div className="flex items-center gap-3">
                                  <Slider 
                                      value={[currentScene.speed || 1.0]} 
                                      onValueChange={(val) => setCurrentScene({...currentScene, speed: val[0]})}
                                      min={0.5} 
                                      max={2.0} 
                                      step={0.1} 
                                      className="flex-1"
                                  />
                                  <span className="w-12 text-sm font-medium text-right">{currentScene.speed || 1.0}x</span>
                              </div>
                              </div>
                              )}

                              {/* Motion Effect */}
                      <div className="space-y-2">
                          <Label>{t('effect')}</Label>
                          <Select 
                              value={currentScene.effect || 'zoom-in'} 
                              onValueChange={(val) => setCurrentScene({...currentScene, effect: val})}
                          >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {effects.map(effect => (
                                        <SelectItem key={effect} value={effect}>
                                            {t('anim_' + effect.replace('-', '_')) || effect.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="custom">{t('style_custom')}</SelectItem>
                                    <SelectItem value="puppet-warp">🎭 Puppet Warp</SelectItem>
                                    <SelectItem value="flow-field">🌊 Flow Field</SelectItem>
                                    <SelectItem value="morph">🔮 Morph</SelectItem>
                                    <SelectItem value="liquify">💧 Liquify</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                            {/* Easing */}
                            <div className="space-y-2">
                            <Label>{t('label_easing')}</Label>
                            <Select 
                                value={currentScene.easing || 'linear'} 
                                onValueChange={(val) => setCurrentScene({...currentScene, easing: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="linear">{t('ease_linear')}</SelectItem>
                                    <SelectItem value="ease-in">{t('ease_in')}</SelectItem>
                                    <SelectItem value="ease-out">{t('ease_out')}</SelectItem>
                                    <SelectItem value="ease-in-out">{t('ease_in_out')}</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    </div>

                                    {/* Transition Type */}
                                    <div className="space-y-2">
                                    <Label>{t('label_transition')}</Label>
                                    <Select 
                                    value={currentScene.transition || 'fade'} 
                                    onValueChange={(val) => setCurrentScene({...currentScene, transition: val})}
                                    >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fade">{t('trans_fade')}</SelectItem>
                                        <SelectItem value="wipe">{t('trans_wipe')}</SelectItem>
                                        <SelectItem value="slide">{t('trans_slide')}</SelectItem>
                                        <SelectItem value="iris">{t('trans_iris')}</SelectItem>
                                            <SelectItem value="zoom">{t('trans_zoom')}</SelectItem>
                                                    <SelectItem value="glitch">Glitch</SelectItem>
                                                    <SelectItem value="spin">Spin</SelectItem>
                                                    <SelectItem value="pixelate">Pixelate</SelectItem>
                                                    <SelectItem value="kaleidoscope">Kaleidoscope</SelectItem>
                                                </SelectContent>
                                                </Select>
                                                </div>

                                        {/* Transition Duration */}
                                        <div className="space-y-2">
                                            <Label>{t('label_trans_duration')} (s)</Label>
                                            <div className="flex items-center gap-3">
                                                <Slider 
                                                    value={[currentScene.transitionDuration || 1.0]} 
                                                    onValueChange={(val) => setCurrentScene({...currentScene, transitionDuration: val[0]})}
                                                    min={0.5} 
                                                    max={3.0} 
                                                    step={0.1} 
                                                    className="flex-1"
                                                />
                                                <span className="w-12 text-sm font-medium text-right">{currentScene.transitionDuration || 1.0}s</span>
                                            </div>
                                        </div>
                                        </div>

                                    {/* Atmosphere Overlay */}
                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="space-y-2">
                                    <Label>{t('label_overlay')}</Label>
                                    <Select 
                                        value={currentScene.overlay || 'none'} 
                                        onValueChange={(val) => setCurrentScene({...currentScene, overlay: val})}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('overlay_none')}</SelectItem>
                                            <SelectItem value="rain">{t('overlay_rain')}</SelectItem>
                                            <SelectItem value="snow">{t('overlay_snow')}</SelectItem>
                                            <SelectItem value="grain">{t('overlay_grain')}</SelectItem>
                                            <SelectItem value="dust">{t('overlay_dust')}</SelectItem>
                                            <SelectItem value="sparkles">{t('overlay_sparkles')}</SelectItem>
                                            <SelectItem value="embers">{t('overlay_embers')}</SelectItem>
                                            <SelectItem value="fog">{t('overlay_fog')}</SelectItem>
                                            <SelectItem value="glitch">{t('overlay_glitch')}</SelectItem>
                                            <SelectItem value="bokeh">{t('overlay_bokeh')}</SelectItem>
                                            <SelectItem value="scanlines">{t('overlay_scanlines')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </div>

                                    {/* Vignette */}
                                    <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="vignette-toggle" className="cursor-pointer">{t('label_vignette')}</Label>
                                        <input 
                                            id="vignette-toggle"
                                            type="checkbox"
                                            checked={currentScene.vignette || false}
                                            onChange={(e) => setCurrentScene({...currentScene, vignette: e.target.checked})}
                                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                        />
                                    </div>
                                    </div>
                                    </div>

                                    {/* Overlay Customization */}
                                    {currentScene.overlay && currentScene.overlay !== 'none' && (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Label className="text-xs font-bold text-slate-700">Atmosphere Settings</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{t('tip_particles')}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-gray-500">Speed</Label>
                                                    <Slider 
                                                        value={[currentScene.overlaySpeed || 1.0]} 
                                                        onValueChange={(val) => setCurrentScene({...currentScene, overlaySpeed: val[0]})}
                                                        min={0.1} max={3.0} step={0.1}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-gray-500">Density</Label>
                                                    <Slider 
                                                        value={[currentScene.overlayDensity || 1.0]} 
                                                        onValueChange={(val) => setCurrentScene({...currentScene, overlayDensity: val[0]})}
                                                        min={0.2} max={3.0} step={0.2}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-gray-500">Color</Label>
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            type="color" 
                                                            value={currentScene.overlayColor || '#ffffff'}
                                                            onChange={(e) => setCurrentScene({...currentScene, overlayColor: e.target.value})}
                                                            className="h-6 w-full rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Transition Customization */}
                                    {(currentScene.transition === 'wipe' || currentScene.transition === 'iris') && (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Label className="text-xs font-bold text-slate-700">Transition Details</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-xs text-xs">{t('tip_transitions')}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {currentScene.transition === 'wipe' && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-500">
                                                        <span>Angle/Direction</span>
                                                        <span>{currentScene.wipeAngle || 0}°</span>
                                                    </div>
                                                    <Slider 
                                                        value={[currentScene.wipeAngle || 0]} 
                                                        onValueChange={(val) => setCurrentScene({...currentScene, wipeAngle: val[0]})}
                                                        min={0} max={360} step={45}
                                                    />
                                                </div>
                                            )}
                                            {currentScene.transition === 'iris' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-gray-500">Center X</Label>
                                                        <Slider 
                                                            value={[currentScene.irisX || 50]} 
                                                            onValueChange={(val) => setCurrentScene({...currentScene, irisX: val[0]})}
                                                            min={0} max={100}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-gray-500">Center Y</Label>
                                                        <Slider 
                                                            value={[currentScene.irisY || 50]} 
                                                            onValueChange={(val) => setCurrentScene({...currentScene, irisY: val[0]})}
                                                            min={0} max={100}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                            {/* Custom Motion & 3D */}
                            <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('label_motion_depth')}</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                        onClick={() => {
                                            const randomPreset = KEYFRAME_PRESETS[Math.floor(Math.random() * KEYFRAME_PRESETS.length)];
                                            setCurrentScene({
                                                ...currentScene, 
                                                effect: 'custom', 
                                                keyframes: randomPreset.kfs,
                                                motionMode: 'default'
                                            });
                                            toast.success(`Applied: ${randomPreset.label}`);
                                        }}
                                    >
                                        <Wand2 className="w-3 h-3 mr-1" />
                                        Auto Motion
                                    </Button>
                                    <Button 
                                        variant={currentScene.motionMode === 'tracking' ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={() => setCurrentScene({...currentScene, motionMode: currentScene.motionMode === 'tracking' ? 'default' : 'tracking'})}
                                    >
                                        <MousePointer2 className="w-3 h-3 mr-1" />
                                        Motion Tracking
                                    </Button>
                                </div>
                                </div>

                            {currentScene.motionMode === 'tracking' && (
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 relative group select-none">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <MousePointer2 className="w-3 h-3" />
                                            Click to add • Drag to move
                                        </span>
                                        {activePointIndex !== null && (
                                            <Button 
                                                size="sm" variant="destructive" className="h-5 text-[10px] px-2"
                                                onClick={() => {
                                                    const points = [...(currentScene.motionPoints || [])];
                                                    points.splice(activePointIndex, 1);
                                                    setCurrentScene({...currentScene, motionPoints: points});
                                                    setActivePointIndex(null);
                                                }}
                                            >
                                                Remove Point
                                            </Button>
                                        )}
                                    </div>

                                    <div 
                                        className="relative w-full aspect-video bg-slate-800 rounded overflow-hidden cursor-crosshair border border-slate-600"
                                        onMouseDown={(e) => {
                                            if (e.target === e.currentTarget) {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                const points = currentScene.motionPoints || [];
                                                setCurrentScene({...currentScene, motionPoints: [...points, { x, y, force: 50, angle: 0 }]});
                                                setActivePointIndex(points.length);
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            if (isDraggingPoint && activePointIndex !== null) {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                                                const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                                                const points = [...(currentScene.motionPoints || [])];
                                                points[activePointIndex] = { ...points[activePointIndex], x, y };
                                                setCurrentScene({...currentScene, motionPoints: points});
                                            }
                                        }}
                                        onMouseUp={() => setIsDraggingPoint(false)}
                                        onMouseLeave={() => setIsDraggingPoint(false)}
                                    >
                                        {currentScene.url && <img src={currentScene.url} className="w-full h-full object-cover opacity-60" draggable={false} />}

                                        {/* Preview Overlay */}
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />

                                        {(currentScene.motionPoints || []).map((p, i) => (
                                            <div 
                                                key={i}
                                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center shadow-lg cursor-move transition-transform hover:scale-110 ${i === activePointIndex ? 'z-20 scale-110' : 'z-10'}`}
                                                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setActivePointIndex(i);
                                                    setIsDraggingPoint(true);
                                                }}
                                            >
                                                <div className={`w-3 h-3 rounded-full border-2 ${i === activePointIndex ? 'bg-amber-500 border-white' : 'bg-white border-amber-500'}`} />
                                                {/* Direction Arrow */}
                                                <div 
                                                    className="absolute w-full h-full flex items-center justify-center pointer-events-none opacity-80"
                                                    style={{ transform: `rotate(${p.angle || 0}deg)` }}
                                                >
                                                    <ArrowUp className="w-full h-full text-amber-400 -mt-6 filter drop-shadow-md" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {activePointIndex !== null && currentScene.motionPoints?.[activePointIndex] && (
                                        <div className="mt-3 p-2 bg-black/40 rounded border border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                                                <span>Point {activePointIndex + 1} Settings</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-slate-400">
                                                        <span>Force</span>
                                                        <span>{currentScene.motionPoints[activePointIndex].force}%</span>
                                                    </div>
                                                    <Slider 
                                                        value={[currentScene.motionPoints[activePointIndex].force]} 
                                                        max={100} step={1}
                                                        onValueChange={([val]) => {
                                                            const points = [...currentScene.motionPoints];
                                                            points[activePointIndex].force = val;
                                                            setCurrentScene({...currentScene, motionPoints: points});
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-slate-400">
                                                        <span>Direction</span>
                                                        <span>{currentScene.motionPoints[activePointIndex].angle}°</span>
                                                    </div>
                                                    <Slider 
                                                        value={[currentScene.motionPoints[activePointIndex].angle || 0]} 
                                                        min={0} max={360} step={15}
                                                        onValueChange={([val]) => {
                                                            const points = [...currentScene.motionPoints];
                                                            points[activePointIndex].angle = val;
                                                            setCurrentScene({...currentScene, motionPoints: points});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t('label_3d_tilt_x')}</Label>
                                        <Slider 
                                            value={[currentScene.tiltX || 0]} 
                                            onValueChange={(val) => setCurrentScene({...currentScene, tiltX: val[0]})}
                                            min={-10} max={10} step={1} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t('label_3d_tilt_y')}</Label>
                                        <Slider 
                                            value={[currentScene.tiltY || 0]} 
                                            onValueChange={(val) => setCurrentScene({...currentScene, tiltY: val[0]})}
                                            min={-10} max={10} step={1} 
                                        />
                                    </div>

                                    {/* Enhanced Motion Controls */}
                                    <div className="space-y-2">
                                        <Label className="text-xs flex items-center gap-1"><Move className="w-3 h-3"/> Camera Shake</Label>
                                        <Slider 
                                            value={[currentScene.shakeIntensity || 0]} 
                                            onValueChange={(val) => setCurrentScene({...currentScene, shakeIntensity: val[0]})}
                                            min={0} max={10} step={1} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Rotation (Deg)</Label>
                                        <Slider 
                                            value={[currentScene.rotation || 0]} 
                                            onValueChange={(val) => setCurrentScene({...currentScene, rotation: val[0]})}
                                            min={-15} max={15} step={1} 
                                        />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                                        onClick={async () => {
                                            toast.loading("Estimating Depth Map...");
                                            try {
                                                const res = await base44.functions.invoke('estimateDepth', { imageUrl: currentScene.url });
                                                if(res.data.depthBase64) {
                                                    setCurrentScene({...currentScene, depthMap: `data:image/png;base64,${res.data.depthBase64}`});
                                                    toast.success("Depth Map Generated! 3D Parallax Active.");
                                                } else {
                                                    toast.error("Depth estimation failed");
                                                }
                                            } catch(e) { toast.error(e.message); }
                                        }}
                                    >
                                        <Package className="w-3 h-3 mr-2" />
                                        Generate Depth Map (True 3D)
                                    </Button>
                                    {currentScene.depthMap && <p className="text-[10px] text-green-600 mt-1 text-center">Depth Map Active ✓</p>}
                                </div>

                                {currentScene.effect === 'custom' && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-slate-700">Timeline & Keyframes</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px]"
                                                    onClick={() => {
                                                        setIsPlayingPreview(true);
                                                        let frame = 0;
                                                        const interval = setInterval(() => {
                                                            frame += 2;
                                                            setPlayheadPosition(frame);
                                                            if (frame >= 100) {
                                                                clearInterval(interval);
                                                                setIsPlayingPreview(false);
                                                                setPlayheadPosition(0);
                                                            }
                                                        }, 50);
                                                    }}
                                                    disabled={isPlayingPreview}
                                                >
                                                    <PlayCircle className="w-3 h-3 mr-1" />
                                                    {isPlayingPreview ? "Playing..." : "Preview"}
                                                </Button>
                                                <Select 
                                                    onValueChange={(val) => {
                                                        const preset = KEYFRAME_PRESETS.find(p => p.label === val);
                                                        if (preset) setCurrentScene({...currentScene, keyframes: preset.kfs});
                                                    }}
                                                >
                                                    <SelectTrigger className="h-6 w-[120px] text-[10px]">
                                                        <SelectValue placeholder="Load Preset" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {KEYFRAME_PRESETS.map(p => (
                                                            <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Interactive Visual Timeline */}
                                        <div className="relative h-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg mt-2 overflow-hidden shadow-inner border border-slate-600">
                                            {/* Time Markers */}
                                            <div className="absolute top-0 left-0 right-0 h-3 flex justify-between px-2 text-[8px] text-slate-400">
                                                {[0, 25, 50, 75, 100].map(t => (
                                                    <span key={t}>{t}%</span>
                                                ))}
                                            </div>
                                            
                                            {/* Timeline Track */}
                                            <div className="absolute left-2 right-2 top-6 h-1 bg-slate-600 rounded-full" />
                                            
                                            {/* Keyframe Curve Visualization */}
                                            <svg className="absolute left-2 right-2 top-3 h-8 pointer-events-none opacity-40">
                                                <polyline
                                                    points={(currentScene.keyframes || []).map((kf, i, arr) => 
                                                        `${(i / (arr.length - 1)) * 100}%,${32 - (kf.scale - 0.8) * 40}`
                                                    ).join(' ')}
                                                    fill="none"
                                                    stroke="rgb(96, 165, 250)"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                            
                                            {/* Keyframes */}
                                            {(currentScene.keyframes || []).map((kf, i, arr) => (
                                                <div 
                                                    key={i} 
                                                    className={`absolute w-4 h-4 rounded-full top-5 -mt-2 cursor-pointer transition-all hover:scale-125 shadow-lg z-10 ${
                                                        selectedKeyframe === i ? 'bg-amber-400 ring-2 ring-white scale-125' : 'bg-blue-400'
                                                    }`}
                                                    style={{ left: `calc(${(i / (arr.length - 1)) * 95}% + 0.5rem)` }}
                                                    onClick={() => setSelectedKeyframe(selectedKeyframe === i ? null : i)}
                                                    title={`KF ${i+1}: Pan(${kf.x},${kf.y}) Zoom:${kf.scale} Rot:${kf.rotation || 0}°`}
                                                >
                                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white whitespace-nowrap opacity-0 hover:opacity-100">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Playhead */}
                                            {isPlayingPreview && (
                                                <div 
                                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg transition-all z-20"
                                                    style={{ left: `calc(${playheadPosition}% + 0.5rem)` }}
                                                >
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Keyframe Detail Editor */}
                                        {selectedKeyframe !== null && currentScene.keyframes?.[selectedKeyframe] && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-blue-800">Keyframe {selectedKeyframe + 1} Properties</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-5 text-[10px] text-red-600"
                                                        onClick={() => {
                                                            if (currentScene.keyframes.length > 2) {
                                                                const newKfs = currentScene.keyframes.filter((_, i) => i !== selectedKeyframe);
                                                                setCurrentScene({...currentScene, keyframes: newKfs});
                                                                setSelectedKeyframe(null);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-600">Pan X (%)</Label>
                                                        <input 
                                                            type="number" 
                                                            value={currentScene.keyframes[selectedKeyframe].x} 
                                                            className="w-full h-7 px-2 rounded border border-blue-200 text-sm"
                                                            onChange={(e) => {
                                                                const newKfs = [...currentScene.keyframes];
                                                                newKfs[selectedKeyframe] = { ...newKfs[selectedKeyframe], x: parseInt(e.target.value) };
                                                                setCurrentScene({...currentScene, keyframes: newKfs});
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-600">Pan Y (%)</Label>
                                                        <input 
                                                            type="number" 
                                                            value={currentScene.keyframes[selectedKeyframe].y || 50} 
                                                            className="w-full h-7 px-2 rounded border border-blue-200 text-sm"
                                                            onChange={(e) => {
                                                                const newKfs = [...currentScene.keyframes];
                                                                newKfs[selectedKeyframe] = { ...newKfs[selectedKeyframe], y: parseInt(e.target.value) };
                                                                setCurrentScene({...currentScene, keyframes: newKfs});
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-600">Zoom</Label>
                                                        <input 
                                                            type="number" 
                                                            value={currentScene.keyframes[selectedKeyframe].scale} 
                                                            step="0.05"
                                                            className="w-full h-7 px-2 rounded border border-blue-200 text-sm"
                                                            onChange={(e) => {
                                                                const newKfs = [...currentScene.keyframes];
                                                                newKfs[selectedKeyframe] = { ...newKfs[selectedKeyframe], scale: parseFloat(e.target.value) };
                                                                setCurrentScene({...currentScene, keyframes: newKfs});
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-600">Rotation (°)</Label>
                                                        <input 
                                                            type="number" 
                                                            value={currentScene.keyframes[selectedKeyframe].rotation || 0} 
                                                            className="w-full h-7 px-2 rounded border border-blue-200 text-sm"
                                                            onChange={(e) => {
                                                                const newKfs = [...currentScene.keyframes];
                                                                newKfs[selectedKeyframe] = { ...newKfs[selectedKeyframe], rotation: parseInt(e.target.value) };
                                                                setCurrentScene({...currentScene, keyframes: newKfs});
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {(currentScene.keyframes || [
                                                { x: 50, y: 50, scale: 1.0, rotation: 0 },
                                                { x: 50, y: 50, scale: 1.2, rotation: 0 }
                                            ]).map((kf, idx, arr) => (
                                                <div 
                                                    key={idx} 
                                                    className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-all ${
                                                        selectedKeyframe === idx ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:border-blue-200'
                                                    }`}
                                                    onClick={() => setSelectedKeyframe(idx)}
                                                >
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                        selectedKeyframe === idx ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>{idx+1}</div>
                                                    
                                                    <div className="flex-1 text-[10px] text-slate-600">
                                                        Pan: ({kf.x}, {kf.y}) • Zoom: {kf.scale}x • Rot: {kf.rotation || 0}°
                                                    </div>
                                                    
                                                    <div className="flex gap-1">
                                                        {arr.length > 2 && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newKfs = arr.filter((_, i) => i !== idx);
                                                                    setCurrentScene({...currentScene, keyframes: newKfs});
                                                                    setSelectedKeyframe(null);
                                                                }} 
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" variant="ghost" className="flex-1 h-7 text-xs border border-dashed border-slate-300 text-slate-500"
                                                    onClick={() => {
                                                        const kfs = currentScene.keyframes || [{x:50,y:50,scale:1,rotation:0},{x:50,y:50,scale:1.1,rotation:0}];
                                                        const last = kfs[kfs.length-1];
                                                        setCurrentScene({...currentScene, keyframes: [...kfs, {...last}]});
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add Keyframe
                                                </Button>
                                                <Button 
                                                    size="sm" variant="ghost" className="h-7 text-xs text-amber-600"
                                                    onClick={() => {
                                                        const randomPreset = KEYFRAME_PRESETS[Math.floor(Math.random() * KEYFRAME_PRESETS.length)];
                                                        setCurrentScene({...currentScene, keyframes: randomPreset.kfs});
                                                        toast.success(`Applied: ${randomPreset.label}`);
                                                    }}
                                                >
                                                    <Wand2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Advanced Effects: Puppet Warp & Flow */}
                                {(currentScene.effect === 'puppet-warp' || currentScene.effect === 'flow-field' || currentScene.effect === 'morph' || currentScene.effect === 'liquify') && (
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-purple-800">
                                                {currentScene.effect === 'puppet-warp' && '🎭 Puppet Warp Control'}
                                                {currentScene.effect === 'flow-field' && '🌊 Flow Field Animation'}
                                                {currentScene.effect === 'morph' && '🔮 Morphing Effect'}
                                                {currentScene.effect === 'liquify' && '💧 Liquify Distortion'}
                                            </Label>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-purple-600">
                                                    <span>Intensity</span>
                                                    <span>{currentScene.warpIntensity || 50}%</span>
                                                </div>
                                                <Slider 
                                                    value={[currentScene.warpIntensity || 50]} 
                                                    onValueChange={(val) => setCurrentScene({...currentScene, warpIntensity: val[0]})}
                                                    min={0} max={100} step={5}
                                                    className="[&_[role=slider]]:bg-purple-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-purple-600">
                                                    <span>Speed</span>
                                                    <span>{currentScene.warpSpeed || 1}x</span>
                                                </div>
                                                <Slider 
                                                    value={[currentScene.warpSpeed || 1]} 
                                                    onValueChange={(val) => setCurrentScene({...currentScene, warpSpeed: val[0]})}
                                                    min={0.1} max={3} step={0.1}
                                                    className="[&_[role=slider]]:bg-purple-500"
                                                />
                                            </div>
                                        </div>
                                        
                                        {currentScene.effect === 'puppet-warp' && (
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-purple-600">Control Points (Click image to add)</Label>
                                                <div className="relative aspect-video bg-slate-800 rounded overflow-hidden cursor-crosshair border-2 border-purple-300"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                                        const points = currentScene.warpPoints || [];
                                                        setCurrentScene({...currentScene, warpPoints: [...points, { x, y, dx: 0, dy: 0, radius: 20 }]});
                                                    }}
                                                >
                                                    {currentScene.url && <img src={currentScene.url} className="w-full h-full object-cover opacity-70" />}
                                                    {(currentScene.warpPoints || []).map((p, i) => (
                                                        <div key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                                                            <div className="relative -ml-3 -mt-3 w-6 h-6">
                                                                <div className="absolute inset-0 bg-purple-500 rounded-full opacity-20" style={{ transform: `scale(${p.radius / 10})` }} />
                                                                <div className="absolute inset-2 bg-purple-400 rounded-full border-2 border-white cursor-move" />
                                                                <svg className="absolute -inset-2 w-10 h-10">
                                                                    <line x1="20" y1="20" x2={20 + (p.dx || 0) * 2} y2={20 + (p.dy || 0) * 2} 
                                                                        stroke="white" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                                                    <defs>
                                                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                                            <polygon points="0 0, 10 3.5, 0 7" fill="white" />
                                                                        </marker>
                                                                    </defs>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {currentScene.warpPoints?.length > 0 && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="w-full h-6 text-[10px] text-red-600"
                                                        onClick={() => setCurrentScene({...currentScene, warpPoints: []})}
                                                    >
                                                        Clear All Points
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        
                                        {currentScene.effect === 'flow-field' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-purple-600">Flow Direction</Label>
                                                    <Select 
                                                        value={currentScene.flowDirection || 'radial'} 
                                                        onValueChange={(val) => setCurrentScene({...currentScene, flowDirection: val})}
                                                    >
                                                        <SelectTrigger className="h-7 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="radial">Radial</SelectItem>
                                                            <SelectItem value="spiral">Spiral</SelectItem>
                                                            <SelectItem value="wave">Wave</SelectItem>
                                                            <SelectItem value="turbulent">Turbulent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-purple-600">Noise Scale</Label>
                                                    <Slider 
                                                        value={[currentScene.flowNoise || 1]} 
                                                        onValueChange={(val) => setCurrentScene({...currentScene, flowNoise: val[0]})}
                                                        min={0.1} max={5} step={0.1}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Visual Filters */}
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('label_color_grading')}</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                                <TooltipContent><p className="max-w-xs text-xs">{t('tip_filters')}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    {/* Scene Filter Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-normal text-slate-500">{t('label_global_filter')}</Label>
                                        <Select 
                                            value={currentScene.filter || 'none'} 
                                            onValueChange={(val) => setCurrentScene({...currentScene, filter: val})}
                                        >
                                            <SelectTrigger className="h-7 w-[140px] text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{t('filter_none')}</SelectItem>
                                                <SelectItem value="noir">{t('filter_noir')}</SelectItem>
                                                <SelectItem value="sepia">{t('filter_sepia')}</SelectItem>
                                                <SelectItem value="vhs">{t('filter_vhs')}</SelectItem>
                                                <SelectItem value="cyberpunk">{t('filter_cyberpunk')}</SelectItem>
                                                <SelectItem value="warm">{t('filter_warm')}</SelectItem>
                                                <SelectItem value="cold">{t('filter_cold')}</SelectItem>
                                                <SelectItem value="dream">{t('filter_dream')}</SelectItem>
                                                <SelectItem value="horror">{t('filter_horror')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>{t('label_brightness')}</span>
                                    <span>{currentScene.brightness || 100}%</span>
                                </div>
                                <Slider 
                                    value={[currentScene.brightness || 100]} 
                                    onValueChange={(val) => setCurrentScene({...currentScene, brightness: val[0]})}
                                    min={50} max={150} step={5} 
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>{t('label_contrast')}</span>
                                    <span>{currentScene.contrast || 100}%</span>
                                </div>
                                <Slider 
                                    value={[currentScene.contrast || 100]} 
                                    onValueChange={(val) => setCurrentScene({...currentScene, contrast: val[0]})}
                                    min={50} max={150} step={5} 
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>{t('label_saturation')}</span>
                                    <span>{currentScene.saturation || 100}%</span>
                                </div>
                                <Slider 
                                    value={[currentScene.saturation || 100]} 
                                    onValueChange={(val) => setCurrentScene({...currentScene, saturation: val[0]})}
                                    min={0} max={200} step={10} 
                                />
                            </div>
                            </div>
                            </div>

                            {/* Overlay Text */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>{t('label_overlay_text')}</Label>
                            <Input 
                                value={currentScene.overlayText || ''} 
                                onChange={(e) => setCurrentScene({...currentScene, overlayText: e.target.value})}
                                placeholder="Add a title or caption overlay..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Text Animation</Label>
                            <Select 
                                value={currentScene.textAnimation || 'fade-up'} 
                                onValueChange={(val) => setCurrentScene({...currentScene, textAnimation: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fade-up">Fade Up</SelectItem>
                                    <SelectItem value="typewriter">Typewriter</SelectItem>
                                    <SelectItem value="bounce">Bounce</SelectItem>
                                    <SelectItem value="slide-in">Slide In</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        {t('btn_save_changes')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}