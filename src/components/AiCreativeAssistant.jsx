import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileText, Camera, Music, Loader2, Check, RefreshCw, Play } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";
import { toast } from "sonner";

export default function AiCreativeAssistant({ 
    isOpen, 
    onClose, 
    script, 
    scenes, 
    onApplyScript, 
    onUpdateScene, 
    onGenerateMusic 
}) {
    const [activeTab, setActiveTab] = useState("script");
    const [loading, setLoading] = useState(false);
    
    // Script State
    const [scriptVariations, setScriptVariations] = useState([]);
    const [narrativeAnalysis, setNarrativeAnalysis] = useState(null);
    
    // Visuals State
    const [visualSuggestions, setVisualSuggestions] = useState([]); // { sceneIndex, angle, style, reason }
    
    // Music State
    const [musicSuggestion, setMusicSuggestion] = useState(null); // { prompt, mood, explanation }
    const [sfxSuggestions, setSfxSuggestions] = useState([]); // Per-scene SFX suggestions

    const generateNarrativeAnalysis = async () => {
        if (!script) return;
        setLoading(true);
        try {
            const prompt = `
                Act as a Screenwriter/Story Consultant. Analyze this script: "${script}"
                
                Provide deep narrative insights:
                1. Plot Points: Identify key beats (Inciting Incident, Climax, Resolution).
                2. Character Arcs: Suggest how to deepen the emotional journey.
                3. Dialogue: Point out weak lines and suggest sharper alternatives.
                
                Return JSON:
                {
                    "plot_points": ["Inciting Incident: ...", "Climax: ..."],
                    "character_notes": "...",
                    "dialogue_suggestions": [
                        { "original": "...", "improved": "...", "reason": "..." }
                    ]
                }
            `;
            const res = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        plot_points: { type: "array", items: { type: "string" } },
                        character_notes: { type: "string" },
                        dialogue_suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    original: { type: "string" },
                                    improved: { type: "string" },
                                    reason: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            if (res) setNarrativeAnalysis(res);
        } catch (e) {
            console.error(e);
            toast.error("Analysis failed");
        } finally {
            setLoading(false);
        }
    };

    const generateScriptVariations = async () => {
        if (!script) return;
        setLoading(true);
        try {
            const prompt = `
                Act as a Script Doctor. Analyze this video script: "${script}"
                
                Generate 4 creative variations with different approaches:
                1. Dramatic/Cinematic - Intense emotions, powerful language
                2. Energetic/Fast-paced - Quick cuts, punchy dialogue
                3. Educational/Clear - Simple, informative, easy to follow
                4. Poetic/Artistic - Metaphorical, visual poetry
                
                For each variation:
                - Maintain the core message/story
                - Adjust tone, pacing, and vocabulary
                - Optimize length (60-120 words ideal for video)
                - Add impactful hooks in the opening
                
                Return JSON:
                {
                    "variations": [
                        { 
                            "title": "Dramatic & Cinematic",
                            "tone": "Intense, emotional",
                            "content": "...",
                            "wordCount": 95,
                            "targetAudience": "Adults seeking inspiration",
                            "improvements": ["Added hook", "Stronger verbs"]
                        }
                    ]
                }
            `;
            const res = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        variations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    tone: { type: "string" },
                                    content: { type: "string" },
                                    wordCount: { type: "integer" },
                                    targetAudience: { type: "string" },
                                    improvements: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });
            if (res?.variations) setScriptVariations(res.variations);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate variations");
        } finally {
            setLoading(false);
        }
    };

    const generateVisualSuggestions = async () => {
        if (!scenes || scenes.length === 0) return;
        setLoading(true);
        try {
            const scenesContext = scenes.map((s, i) => `Scene ${i+1}: ${s.description} - Mood: ${s.mood || 'neutral'}`).join('\n');
            const prompt = `
                Act as a Director of Photography. Deeply analyze these scenes:
                ${scenesContext}
                
                For EACH scene, provide specific cinematographic recommendations:
                1. Camera Angle - Choose from: Wide, Close-up, Aerial, Low Angle, High Angle, Dutch, POV, Over-Shoulder, etc.
                2. Lighting Style - Describe the lighting mood (e.g., "Golden hour warm", "Hard shadows noir", "Soft diffused")
                3. Color Palette - Suggest 3-4 dominant colors
                4. Visual Style - Artistic direction (e.g., "Wes Anderson symmetry", "Blade Runner cyberpunk")
                5. Composition Notes - Specific framing advice (e.g., "Rule of thirds, subject left")
                6. Alternative Vision - A bold creative variation
                
                Return JSON:
                {
                    "suggestions": [
                        { 
                            "sceneIndex": 0,
                            "angle": "Low Angle",
                            "lighting": "Hard dramatic shadows",
                            "colors": ["#1a1a2e", "#c7956d", "#f4f4f4"],
                            "style": "Film Noir aesthetic",
                            "composition": "Center subject, high contrast",
                            "alternative": "Try aerial view for scale",
                            "reason": "Adds tension and power to the moment"
                        }
                    ]
                }
            `;
            const res = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    sceneIndex: { type: "integer" },
                                    angle: { type: "string" },
                                    lighting: { type: "string" },
                                    colors: { type: "array", items: { type: "string" } },
                                    style: { type: "string" },
                                    composition: { type: "string" },
                                    alternative: { type: "string" },
                                    reason: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            if (res?.suggestions) setVisualSuggestions(res.suggestions);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate visual suggestions");
        } finally {
            setLoading(false);
        }
    };

    const generateMusicSuggestion = async () => {
        setLoading(true);
        try {
            const scenesContext = scenes?.length > 0 
                ? scenes.map((s, i) => `Scene ${i+1}: ${s.description} (${s.mood || 'neutral'})`).join('\n')
                : '';
            const context = script ? `Script: ${script.substring(0, 500)}...\n\nScenes:\n${scenesContext}` : `Scenes: ${scenes?.length} scenes`;
            
            const prompt = `
                Act as a Music Director for film. Analyze this video content and suggest TWO music options:
                ${context}
                
                Consider:
                - Overall mood progression and emotional arc
                - Scene-by-scene tempo changes
                - Build-ups, climaxes, and quiet moments
                
                Return JSON with 2 music options (Background Track + Scene-Specific):
                {
                    "background": {
                        "mood": "Cinematic Epic",
                        "prompt": "Orchestral score with building tension, strings crescendo...",
                        "explanation": "Matches the dramatic arc",
                        "genre": "Orchestral",
                        "tempo": "Medium to Fast",
                        "instruments": ["Strings", "Brass", "Percussion"]
                    },
                    "scene_sfx": [
                        { "sceneIndex": 0, "type": "ambient", "prompt": "Wind howling, desolate atmosphere", "reason": "Enhances isolation" },
                        { "sceneIndex": 2, "type": "action", "prompt": "Impact sound, explosion rumble", "reason": "Emphasizes action beat" }
                    ]
                }
            `;
            const res = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        background: {
                            type: "object",
                            properties: {
                                mood: { type: "string" },
                                prompt: { type: "string" },
                                explanation: { type: "string" },
                                genre: { type: "string" },
                                tempo: { type: "string" },
                                instruments: { type: "array", items: { type: "string" } }
                            }
                        },
                        scene_sfx: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    sceneIndex: { type: "integer" },
                                    type: { type: "string" },
                                    prompt: { type: "string" },
                                    reason: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            if (res) {
                setMusicSuggestion(res.background);
                setSfxSuggestions(res.scene_sfx || []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to suggest music");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        AI Creative Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Enhance your content with AI-powered suggestions for script, visuals, and audio.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-4 shrink-0">
                        <TabsTrigger value="script"><FileText className="w-4 h-4 mr-2" /> Script</TabsTrigger>
                        <TabsTrigger value="analysis"><Sparkles className="w-4 h-4 mr-2" /> Insights</TabsTrigger>
                        <TabsTrigger value="visuals"><Camera className="w-4 h-4 mr-2" /> Visuals</TabsTrigger>
                        <TabsTrigger value="music"><Music className="w-4 h-4 mr-2" /> Music</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden mt-4 flex flex-col">
                        <TabsContent value="script" className="h-full m-0 flex flex-col">
                            {!script ? (
                                <div className="text-center p-8 text-slate-500">Please add a script first.</div>
                            ) : (
                                <>
                                    {scriptVariations.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Button onClick={generateScriptVariations} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                Generate Variations
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full overflow-hidden">
                                            <ScrollArea className="flex-1 overflow-auto pr-4">
                                                <div className="space-y-4 pb-4 pt-2">
                                                    {scriptVariations.map((variant, i) => (
                                                        <Card key={i} className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 hover:shadow-lg transition-shadow">
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="font-bold text-slate-800 text-lg">{variant.title}</h4>
                                                                        <p className="text-xs text-slate-500 mt-1">{variant.tone}</p>
                                                                    </div>
                                                                    <Button size="sm" onClick={() => onApplyScript(variant.content)} className="bg-green-600 hover:bg-green-700 text-white">
                                                                        <Check className="w-4 h-4 mr-1" /> Apply
                                                                    </Button>
                                                                </div>

                                                                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white/60 p-3 rounded border border-slate-200">{variant.content}</p>

                                                                <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200">
                                                                    <span>📊 {variant.wordCount} words</span>
                                                                    <span>•</span>
                                                                    <span>🎯 {variant.targetAudience}</span>
                                                                </div>

                                                                {variant.improvements && variant.improvements.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {variant.improvements.map((imp, idx) => (
                                                                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                                                ✓ {imp}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                            <div className="pt-2 border-t shrink-0">
                                                <Button variant="outline" onClick={generateScriptVariations} disabled={loading} className="w-full">
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="analysis" className="h-full m-0 flex flex-col">
                            {!script ? (
                                <div className="text-center p-8 text-slate-500">Please add a script first.</div>
                            ) : (
                                <>
                                    {!narrativeAnalysis ? (
                                        <div className="flex items-center justify-center flex-col gap-4 h-full">
                                            <p className="text-slate-500 text-center max-w-sm">
                                                Get deep AI insights into your plot, characters, and dialogue to improve your storytelling.
                                            </p>
                                            <Button onClick={generateNarrativeAnalysis} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                Analyze Narrative
                                            </Button>
                                        </div>
                                    ) : (
                                        <ScrollArea className="flex-1 overflow-auto pr-4">
                                            <div className="space-y-6">
                                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                    <h4 className="font-bold text-blue-800 mb-2">Plot & Pacing</h4>
                                                    <ul className="list-disc ml-4 space-y-1 text-sm text-blue-700">
                                                        {narrativeAnalysis.plot_points?.map((p, i) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                </div>
                                                
                                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                                    <h4 className="font-bold text-purple-800 mb-2">Character Arc</h4>
                                                    <p className="text-sm text-purple-700">{narrativeAnalysis.character_notes}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-slate-800">Dialogue Improvements</h4>
                                                    {narrativeAnalysis.dialogue_suggestions?.map((d, i) => (
                                                        <div key={i} className="bg-white p-3 rounded border border-slate-200 text-sm">
                                                            <div className="text-red-500 line-through mb-1 opacity-70">{d.original}</div>
                                                            <div className="text-green-600 font-medium mb-1">{d.improved}</div>
                                                            <div className="text-xs text-slate-400 italic">{d.reason}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="visuals" className="h-full m-0 flex flex-col">
                            {(!scenes || scenes.length === 0) ? (
                                <div className="text-center p-8 text-slate-500">Generate scenes first to get visual suggestions.</div>
                            ) : (
                                <>
                                    {visualSuggestions.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Button onClick={generateVisualSuggestions} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" /> }
                                                Analyze Scenes & Suggest Styles
                                            </Button>
                                        </div>
                                    ) : (
                                        <ScrollArea className="flex-1 overflow-auto pr-4">
                                            <div className="space-y-3">
                                                {visualSuggestions.map((sug, i) => {
                                                    const scene = scenes[sug.sceneIndex] || {};
                                                    return (
                                                        <Card key={i} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-xs font-bold text-blue-600 uppercase">Scene {sug.sceneIndex + 1}</span>
                                                                    <Button 
                                                                        size="sm"
                                                                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                                        onClick={() => {
                                                                            const enhancedDesc = `${sug.angle}. ${sug.lighting}. ${sug.style}. ${scene.description}`;
                                                                            onUpdateScene(sug.sceneIndex, { 
                                                                                description: enhancedDesc
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Check className="w-3 h-3 mr-1" />
                                                                        Apply All
                                                                    </Button>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div className="bg-white p-2 rounded border border-slate-100">
                                                                        <div className="text-slate-400 font-semibold mb-0.5">📷 Angle</div>
                                                                        <div className="text-slate-800 font-medium">{sug.angle}</div>
                                                                    </div>
                                                                    <div className="bg-white p-2 rounded border border-slate-100">
                                                                        <div className="text-slate-400 font-semibold mb-0.5">💡 Lighting</div>
                                                                        <div className="text-slate-800 font-medium">{sug.lighting}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-white p-2 rounded border border-slate-100">
                                                                    <div className="text-slate-400 font-semibold text-xs mb-1">🎨 Color Palette</div>
                                                                    <div className="flex gap-1">
                                                                        {sug.colors?.map((color, idx) => (
                                                                            <div 
                                                                                key={idx}
                                                                                className="w-8 h-8 rounded border border-slate-300 shadow-sm"
                                                                                style={{ backgroundColor: color }}
                                                                                title={color}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                                                        <div className="text-blue-600 font-semibold text-xs mb-0.5">Visual Style</div>
                                                                        <div className="text-blue-900 text-sm">{sug.style}</div>
                                                                    </div>
                                                                    <div className="bg-green-50 p-2 rounded border border-green-100">
                                                                        <div className="text-green-600 font-semibold text-xs mb-0.5">Composition</div>
                                                                        <div className="text-green-900 text-sm">{sug.composition}</div>
                                                                    </div>
                                                                </div>

                                                                {sug.alternative && (
                                                                    <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                                                        <div className="text-amber-700 font-semibold text-xs mb-0.5">💡 Alternative Idea</div>
                                                                        <div className="text-amber-900 text-xs">{sug.alternative}</div>
                                                                    </div>
                                                                )}

                                                                <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">"{sug.reason}"</p>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="music" className="h-full m-0 flex flex-col">
                            <ScrollArea className="flex-1 overflow-auto pr-4">
                                <div className="space-y-4">
                                    {!musicSuggestion ? (
                                        <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                                            <p className="text-slate-500">Get AI-tailored music and SFX recommendations based on your video's scenes.</p>
                                            <Button onClick={generateMusicSuggestion} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Music className="w-4 h-4 mr-2" />}
                                                Analyze & Suggest Audio
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Background Music */}
                                            <div className="space-y-3">
                                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                    <Music className="w-4 h-4 text-purple-600" />
                                                    Background Track
                                                </h4>
                                                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-purple-900">{musicSuggestion.mood}</h3>
                                                                <p className="text-sm text-purple-700 mt-1">{musicSuggestion.explanation}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div className="bg-white/60 p-2 rounded">
                                                                <div className="text-purple-600 font-semibold">Genre</div>
                                                                <div className="text-slate-800">{musicSuggestion.genre}</div>
                                                            </div>
                                                            <div className="bg-white/60 p-2 rounded">
                                                                <div className="text-purple-600 font-semibold">Tempo</div>
                                                                <div className="text-slate-800">{musicSuggestion.tempo}</div>
                                                            </div>
                                                            <div className="bg-white/60 p-2 rounded">
                                                                <div className="text-purple-600 font-semibold">Instruments</div>
                                                                <div className="text-slate-800 text-[10px]">{musicSuggestion.instruments?.join(', ')}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="bg-white/80 p-3 rounded border border-purple-200">
                                                            <div className="text-xs text-purple-600 font-bold uppercase mb-1">AI Prompt</div>
                                                            <p className="text-slate-700 text-sm">{musicSuggestion.prompt}</p>
                                                        </div>

                                                        <Button 
                                                            onClick={() => onGenerateMusic(musicSuggestion.prompt)}
                                                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                                                        >
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Generate Background Music
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Scene-Specific SFX */}
                                            {sfxSuggestions.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                        <Play className="w-4 h-4 text-amber-600" />
                                                        Scene Sound Effects ({sfxSuggestions.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {sfxSuggestions.map((sfx, i) => (
                                                            <Card key={i} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                                                <CardContent className="p-3">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-xs font-bold text-amber-600">Scene {sfx.sceneIndex + 1}</span>
                                                                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                                                    {sfx.type}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-slate-700 font-medium mb-1">{sfx.prompt}</p>
                                                                            <p className="text-xs text-slate-500 italic">"{sfx.reason}"</p>
                                                                        </div>
                                                                        <Button 
                                                                            size="sm" 
                                                                            onClick={() => onGenerateMusic(sfx.prompt)}
                                                                            className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                                                                        >
                                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                                            Generate
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button 
                                                variant="outline" 
                                                onClick={generateMusicSuggestion} 
                                                disabled={loading}
                                                className="w-full"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Regenerate Suggestions
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}