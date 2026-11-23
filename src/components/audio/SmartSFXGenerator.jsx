import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles, Volume2, Loader2, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";
import { InvokeLLM } from "@/integrations/Core";
import { generateProceduralAudio } from "../proceduralAudio";

// Visual element to SFX mapping
const VISUAL_SFX_MAPPING = {
    // Nature
    'water': ['water splash', 'river flowing', 'ocean waves', 'rain'],
    'rain': ['rain falling', 'thunder', 'storm ambience'],
    'fire': ['fire crackling', 'flames roaring', 'explosion'],
    'wind': ['wind howling', 'gentle breeze', 'storm wind'],
    'forest': ['birds chirping', 'leaves rustling', 'forest ambience'],
    'beach': ['ocean waves', 'seagulls', 'sand footsteps'],
    'mountain': ['wind', 'echo', 'rock falling'],
    
    // Urban
    'city': ['traffic', 'car horns', 'city ambience', 'crowd noise'],
    'car': ['engine revving', 'car passing', 'tire screech', 'door slam'],
    'building': ['door opening', 'footsteps', 'elevator ding'],
    'street': ['footsteps', 'traffic', 'crowd murmur'],
    
    // Actions
    'walk': ['footsteps'],
    'run': ['running footsteps', 'heavy breathing'],
    'fight': ['punch', 'kick', 'impact', 'whoosh'],
    'explosion': ['explosion', 'debris', 'rumble'],
    'fall': ['impact', 'thud', 'crash'],
    'open': ['door opening', 'click', 'creak'],
    'close': ['door closing', 'slam', 'click'],
    
    // Emotions
    'dramatic': ['tension riser', 'drone', 'heartbeat'],
    'suspense': ['tension', 'low drone', 'breath'],
    'happy': ['cheerful chime', 'laugh', 'celebration'],
    'sad': ['melancholic pad', 'sigh', 'rain'],
    'scary': ['horror sting', 'scream', 'creepy ambience'],
    
    // Objects
    'phone': ['notification', 'ringtone', 'vibration'],
    'computer': ['keyboard typing', 'mouse click', 'notification'],
    'sword': ['sword slash', 'metal clang', 'sheath'],
    'gun': ['gunshot', 'reload', 'shell casing'],
    'glass': ['glass breaking', 'glass clinking'],
    
    // Transitions
    'transition': ['whoosh', 'sweep', 'impact'],
    'reveal': ['reveal sting', 'magic sparkle', 'tada'],
    'ending': ['fade out', 'final note', 'resolution'],
};

// Analyze scene and extract SFX suggestions
async function analyzeSceneForSFX(scene) {
    const description = (scene.description || '').toLowerCase();
    const mood = (scene.mood || '').toLowerCase();
    const dialogue = (scene.dialogue || '').toLowerCase();
    
    const suggestions = [];
    const foundKeywords = new Set();
    
    // Check against mapping
    for (const [keyword, sfxList] of Object.entries(VISUAL_SFX_MAPPING)) {
        if (description.includes(keyword) || mood.includes(keyword)) {
            sfxList.forEach(sfx => {
                if (!foundKeywords.has(sfx)) {
                    suggestions.push({
                        keyword,
                        sfx,
                        confidence: description.includes(keyword) ? 0.9 : 0.7,
                        source: description.includes(keyword) ? 'visual' : 'mood'
                    });
                    foundKeywords.add(sfx);
                }
            });
        }
    }
    
    // If no matches found, use AI to analyze
    if (suggestions.length === 0) {
        try {
            const aiResponse = await InvokeLLM({
                prompt: `Analyze this video scene and suggest 2-3 sound effects that would enhance it:

Scene Description: "${scene.description}"
Mood: "${scene.mood || 'neutral'}"
Camera: "${scene.camera_angle || 'medium shot'}"

Return JSON with format:
{
    "suggestions": [
        {"sfx": "sound effect name", "reason": "why this fits", "timing": "when to play"}
    ]
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    sfx: { type: "string" },
                                    reason: { type: "string" },
                                    timing: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            
            if (aiResponse?.suggestions) {
                aiResponse.suggestions.forEach(s => {
                    suggestions.push({
                        keyword: 'AI Analysis',
                        sfx: s.sfx,
                        confidence: 0.8,
                        source: 'ai',
                        reason: s.reason,
                        timing: s.timing
                    });
                });
            }
        } catch (e) {
            console.warn("AI SFX analysis failed:", e);
        }
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions per scene
}

export default function SmartSFXGenerator({ 
    isOpen, 
    onClose, 
    scenes = [], 
    onAddSFXTracks,
    pacingProfile = 'balanced'
}) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState('');
    const [sceneSuggestions, setSceneSuggestions] = useState([]);
    const [selectedSFX, setSelectedSFX] = useState({});
    const [generatedTracks, setGeneratedTracks] = useState([]);
    const [previewAudio, setPreviewAudio] = useState(null);
    const [playingPreview, setPlayingPreview] = useState(null);

    // Analyze all scenes
    const handleAnalyze = async () => {
        if (scenes.length === 0) {
            toast.error("No scenes to analyze");
            return;
        }

        setIsAnalyzing(true);
        setProgress(0);
        setSceneSuggestions([]);
        setSelectedSFX({});

        try {
            const allSuggestions = [];
            
            for (let i = 0; i < scenes.length; i++) {
                setCurrentTask(`Analyzing Scene ${i + 1}/${scenes.length}...`);
                setProgress((i / scenes.length) * 100);
                
                const suggestions = await analyzeSceneForSFX(scenes[i]);
                
                allSuggestions.push({
                    sceneIndex: i,
                    sceneNumber: scenes[i].scene_number || i + 1,
                    description: scenes[i].description?.substring(0, 50) + '...',
                    suggestions
                });
                
                // Auto-select high confidence suggestions
                const autoSelected = {};
                suggestions.forEach((s, idx) => {
                    if (s.confidence >= 0.8) {
                        autoSelected[`${i}-${idx}`] = true;
                    }
                });
                setSelectedSFX(prev => ({ ...prev, ...autoSelected }));
            }
            
            setSceneSuggestions(allSuggestions);
            setProgress(100);
            setCurrentTask('Analysis complete!');
            toast.success(`Found ${allSuggestions.reduce((acc, s) => acc + s.suggestions.length, 0)} potential SFX`);
            
        } catch (error) {
            console.error("Analysis failed:", error);
            toast.error("Failed to analyze scenes");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Generate selected SFX
    const handleGenerate = async () => {
        const sfxToGenerate = [];
        
        sceneSuggestions.forEach((scene, sceneIdx) => {
            scene.suggestions.forEach((suggestion, sugIdx) => {
                if (selectedSFX[`${sceneIdx}-${sugIdx}`]) {
                    sfxToGenerate.push({
                        ...suggestion,
                        sceneIndex: scene.sceneIndex,
                        sceneNumber: scene.sceneNumber,
                        sceneDuration: scenes[scene.sceneIndex]?.duration || 5
                    });
                }
            });
        });

        if (sfxToGenerate.length === 0) {
            toast.error("Please select at least one SFX to generate");
            return;
        }

        setIsGenerating(true);
        setProgress(0);
        const newTracks = [];

        try {
            for (let i = 0; i < sfxToGenerate.length; i++) {
                const sfx = sfxToGenerate[i];
                setCurrentTask(`Generating "${sfx.sfx}" for Scene ${sfx.sceneNumber}...`);
                setProgress((i / sfxToGenerate.length) * 100);

                try {
                    // Try AI generation first
                    const response = await base44.functions.invoke('generateAudio', {
                        prompt: `Sound effect: ${sfx.sfx}, cinematic quality, clean audio, ${sfx.source === 'mood' ? 'atmospheric' : 'realistic'}`,
                        duration: Math.min(sfx.sceneDuration, 5),
                        type: 'sfx'
                    });

                    let file;
                    if (response.data?.audioBase64) {
                        const binaryString = window.atob(response.data.audioBase64);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
                        const blob = new Blob([bytes], { type: 'audio/wav' });
                        file = new File([blob], `sfx_${sfx.sfx.replace(/\s+/g, '_')}_scene${sfx.sceneNumber}.wav`, { type: "audio/wav" });
                    } else {
                        throw new Error("AI generation failed");
                    }

                    newTracks.push({
                        name: `SFX: ${sfx.sfx} (Scene ${sfx.sceneNumber})`,
                        type: 'sfx',
                        volume: 0.8,
                        ducking: false,
                        fadeIn: 0.1,
                        fadeOut: 0.3,
                        file,
                        startOffset: calculateSceneStartTime(sfx.sceneIndex, scenes),
                        duration: Math.min(sfx.sceneDuration, 5),
                        _meta: { sceneIndex: sfx.sceneIndex, keyword: sfx.keyword, confidence: sfx.confidence }
                    });

                } catch (genError) {
                    console.warn(`AI SFX gen failed for "${sfx.sfx}", using native:`, genError);
                    
                    // Fallback to native procedural audio
                    try {
                        const sfxType = mapSFXToNative(sfx.sfx);
                        const blob = await generateProceduralAudio('sfx', Math.min(sfx.sceneDuration, 3), { mood: sfxType });
                        const file = new File([blob], `sfx_native_${sfx.sfx.replace(/\s+/g, '_')}_scene${sfx.sceneNumber}.wav`, { type: "audio/wav" });
                        
                        newTracks.push({
                            name: `SFX: ${sfx.sfx} (Scene ${sfx.sceneNumber}) [Native]`,
                            type: 'sfx',
                            volume: 0.7,
                            ducking: false,
                            fadeIn: 0.05,
                            fadeOut: 0.2,
                            file,
                            startOffset: calculateSceneStartTime(sfx.sceneIndex, scenes),
                            duration: Math.min(sfx.sceneDuration, 3),
                            _meta: { sceneIndex: sfx.sceneIndex, keyword: sfx.keyword, confidence: sfx.confidence, native: true }
                        });
                    } catch (nativeError) {
                        console.error(`Native SFX failed for "${sfx.sfx}":`, nativeError);
                    }
                }
            }

            setGeneratedTracks(newTracks);
            setProgress(100);
            setCurrentTask(`Generated ${newTracks.length} SFX tracks!`);
            toast.success(`Generated ${newTracks.length} sound effects!`);

        } catch (error) {
            console.error("SFX generation failed:", error);
            toast.error("Failed to generate SFX");
        } finally {
            setIsGenerating(false);
        }
    };

    // Calculate scene start time
    const calculateSceneStartTime = (sceneIndex, scenes) => {
        let time = 0;
        for (let i = 0; i < sceneIndex; i++) {
            time += scenes[i]?.duration || 5;
        }
        return time;
    };

    // Map SFX name to native type
    const mapSFXToNative = (sfxName) => {
        const name = sfxName.toLowerCase();
        if (name.includes('whoosh') || name.includes('sweep')) return 'whoosh';
        if (name.includes('impact') || name.includes('hit') || name.includes('punch')) return 'impact';
        if (name.includes('explosion') || name.includes('boom')) return 'impact';
        return 'sweep';
    };

    // Preview SFX
    const handlePreview = async (sceneIdx, sugIdx, sfxName) => {
        const key = `${sceneIdx}-${sugIdx}`;
        
        if (playingPreview === key && previewAudio) {
            previewAudio.pause();
            setPlayingPreview(null);
            return;
        }

        try {
            const sfxType = mapSFXToNative(sfxName);
            const blob = await generateProceduralAudio('sfx', 2, { mood: sfxType });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => setPlayingPreview(null);
            audio.play();
            
            setPreviewAudio(audio);
            setPlayingPreview(key);
        } catch (e) {
            toast.error("Preview failed");
        }
    };

    // Apply generated tracks
    const handleApply = () => {
        if (generatedTracks.length === 0) {
            toast.error("No tracks to apply. Generate SFX first.");
            return;
        }

        onAddSFXTracks(generatedTracks);
        onClose();
        toast.success(`Added ${generatedTracks.length} SFX tracks to timeline!`);
    };

    // Toggle selection
    const toggleSelection = (key) => {
        setSelectedSFX(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Select/Deselect all
    const toggleAll = (select) => {
        const newSelected = {};
        sceneSuggestions.forEach((scene, sceneIdx) => {
            scene.suggestions.forEach((_, sugIdx) => {
                newSelected[`${sceneIdx}-${sugIdx}`] = select;
            });
        });
        setSelectedSFX(newSelected);
    };

    const selectedCount = Object.values(selectedSFX).filter(Boolean).length;
    const totalSuggestions = sceneSuggestions.reduce((acc, s) => acc + s.suggestions.length, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Smart SFX Generator
                    </DialogTitle>
                    <DialogDescription>
                        AI analyzes your scenes and suggests sound effects based on visual elements, actions, and mood.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Analysis Progress */}
                    {(isAnalyzing || isGenerating) && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{currentTask}</span>
                                <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Initial State */}
                    {sceneSuggestions.length === 0 && !isAnalyzing && (
                        <div className="text-center py-8">
                            <Volume2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <h3 className="font-medium text-slate-700 mb-2">Analyze Your Scenes</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Click "Analyze Scenes" to detect visual elements and suggest appropriate sound effects.
                            </p>
                            <Button
                                onClick={handleAnalyze}
                                disabled={scenes.length === 0}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analyze {scenes.length} Scenes
                            </Button>
                        </div>
                    )}

                    {/* Suggestions List */}
                    {sceneSuggestions.length > 0 && (
                        <div className="space-y-4">
                            {/* Selection Controls */}
                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                <span className="text-sm text-slate-600">
                                    {selectedCount} of {totalSuggestions} selected
                                </span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => toggleAll(true)} className="h-7 text-xs">
                                        Select All
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => toggleAll(false)} className="h-7 text-xs">
                                        Deselect All
                                    </Button>
                                </div>
                            </div>

                            {/* Scene-by-Scene Suggestions */}
                            {sceneSuggestions.map((scene, sceneIdx) => (
                                <div key={sceneIdx} className="border rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium">Scene {scene.sceneNumber}</span>
                                            <span className="text-xs text-slate-500 ml-2">{scene.description}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {scene.suggestions.length} SFX
                                        </Badge>
                                    </div>
                                    
                                    {scene.suggestions.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-slate-400">
                                            No SFX suggestions for this scene
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {scene.suggestions.map((suggestion, sugIdx) => {
                                                const key = `${sceneIdx}-${sugIdx}`;
                                                const isSelected = selectedSFX[key];
                                                const isPlaying = playingPreview === key;
                                                
                                                return (
                                                    <div 
                                                        key={sugIdx}
                                                        className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelection(key)}
                                                            id={key}
                                                        />
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                                                                {suggestion.sfx}
                                                            </Label>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge 
                                                                    variant="outline" 
                                                                    className={`text-[10px] ${
                                                                        suggestion.source === 'ai' ? 'bg-blue-50 text-blue-600' :
                                                                        suggestion.source === 'visual' ? 'bg-green-50 text-green-600' :
                                                                        'bg-amber-50 text-amber-600'
                                                                    }`}
                                                                >
                                                                    {suggestion.source}
                                                                </Badge>
                                                                <span className="text-[10px] text-slate-400">
                                                                    from "{suggestion.keyword}"
                                                                </span>
                                                                {suggestion.reason && (
                                                                    <span className="text-[10px] text-slate-400 truncate">
                                                                        • {suggestion.reason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-8 h-1 rounded-full bg-slate-200 overflow-hidden`}>
                                                                <div 
                                                                    className={`h-full ${
                                                                        suggestion.confidence >= 0.9 ? 'bg-green-500' :
                                                                        suggestion.confidence >= 0.7 ? 'bg-amber-500' :
                                                                        'bg-slate-400'
                                                                    }`}
                                                                    style={{ width: `${suggestion.confidence * 100}%` }}
                                                                />
                                                            </div>
                                                            
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => handlePreview(sceneIdx, sugIdx, suggestion.sfx)}
                                                            >
                                                                {isPlaying ? (
                                                                    <Pause className="w-3 h-3" />
                                                                ) : (
                                                                    <Play className="w-3 h-3" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Generated Tracks Summary */}
                    {generatedTracks.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {generatedTracks.length} SFX tracks ready to add
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    
                    {sceneSuggestions.length > 0 && generatedTracks.length === 0 && (
                        <Button
                            onClick={handleGenerate}
                            disabled={selectedCount === 0 || isGenerating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generate {selectedCount} SFX
                        </Button>
                    )}

                    {generatedTracks.length > 0 && (
                        <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-2" />
                            Add {generatedTracks.length} Tracks
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}