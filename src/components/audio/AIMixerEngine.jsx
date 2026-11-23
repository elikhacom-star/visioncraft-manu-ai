import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Sparkles, Loader2, Volume2, Music, Mic, Zap,
    ArrowDown, ArrowUp, BarChart3, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";

const CONTENT_PROFILES = [
    { id: 'dialogue', name: 'Dialogue-First', icon: '🎙️', desc: 'Prioritize voiceover clarity', voiceTarget: 0.95, musicTarget: 0.2, sfxTarget: 0.35, duckDepth: 0.12 },
    { id: 'cinematic', name: 'Cinematic', icon: '🎬', desc: 'Balanced dramatic mix', voiceTarget: 0.85, musicTarget: 0.45, sfxTarget: 0.5, duckDepth: 0.2 },
    { id: 'energetic', name: 'Energetic', icon: '⚡', desc: 'Loud music & SFX, punchy voice', voiceTarget: 0.9, musicTarget: 0.55, sfxTarget: 0.6, duckDepth: 0.25 },
    { id: 'ambient', name: 'Ambient', icon: '🌿', desc: 'Soft background, gentle voice', voiceTarget: 0.7, musicTarget: 0.35, sfxTarget: 0.25, duckDepth: 0.15 },
    { id: 'podcast', name: 'Podcast', icon: '🎧', desc: 'Crystal-clear voice, minimal music', voiceTarget: 1.0, musicTarget: 0.1, sfxTarget: 0.15, duckDepth: 0.08 },
];

const EQ_PRESETS = [
    { id: 'none', name: 'Flat', desc: 'No EQ adjustment', icon: '—' },
    { id: 'voice_clarity', name: 'Voice Clarity', desc: 'Boost 2-5kHz for presence', icon: '🗣️' },
    { id: 'warm', name: 'Warm', desc: 'Gentle low-mid boost', icon: '🔥' },
    { id: 'bright', name: 'Bright', desc: 'High-end sparkle', icon: '✨' },
    { id: 'cinema', name: 'Cinema', desc: 'Wide, deep, immersive', icon: '🎥' },
    { id: 'broadcast', name: 'Broadcast', desc: 'Compressed, clear, radio-ready', icon: '📻' },
];

export default function AIMixerEngine({ 
    audioTracks = [],
    voiceoverVolume = 1,
    scenes = [],
    onUpdateTrack,
    onUpdateVoiceover,
    onBatchUpdate
}) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState('cinematic');
    const [selectedEQ, setSelectedEQ] = useState('none');
    const [duckingConfig, setDuckingConfig] = useState({
        enabled: true,
        depth: 0.15,
        attack: 0.3,
        release: 0.8,
        threshold: 'auto'
    });
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const musicTracks = audioTracks.filter(t => t.type === 'music');
    const sfxTracks = audioTracks.filter(t => t.type === 'sfx');
    const voiceTracks = audioTracks.filter(t => t.type?.startsWith('voiceover'));
    const hasVoice = voiceTracks.length > 0 || voiceoverVolume > 0;

    // Use AI to analyze scene content and suggest optimal mix
    const handleAIAnalyze = async () => {
        if (audioTracks.length === 0) {
            toast.error("Add audio tracks first");
            return;
        }

        setIsAnalyzing(true);
        const toastId = toast.loading("AI analyzing audio mix...");

        const trackSummary = audioTracks.map((t, i) => ({
            index: i,
            name: t.name || `Track ${i+1}`,
            type: t.type,
            currentVolume: Math.round((t.volume || 1) * 100),
            hasDucking: !!t.ducking,
            duckLevel: Math.round((t.duckLevel || 0.15) * 100)
        }));

        const sceneSummary = scenes.slice(0, 10).map((s, i) => ({
            scene: i + 1,
            mood: s.mood || 'neutral',
            hasDialogue: !!(s.dialogue && s.dialogue.trim()),
            dialogueLength: (s.dialogue || '').split(/\s+/).filter(Boolean).length,
            duration: s.duration || 5
        }));

        const prompt = `You are a professional audio mixing engineer. Analyze this video project and recommend optimal audio levels.

PROJECT CONTEXT:
- Content profile: ${selectedProfile}
- EQ preset: ${selectedEQ}
- Has voiceover: ${hasVoice}
- Current voiceover volume: ${Math.round(voiceoverVolume * 100)}%

AUDIO TRACKS:
${JSON.stringify(trackSummary, null, 2)}

SCENE DATA (first 10):
${JSON.stringify(sceneSummary, null, 2)}

ANALYZE AND RECOMMEND:
1. Optimal volume for each track (0-150 as percentage)
2. Which music tracks should duck during voice (and by how much)
3. Optimal voiceover volume
4. Fade in/out suggestions per track
5. Pan suggestions for spatial separation
6. Any EQ recommendations
7. Overall mix quality assessment

Return structured JSON.`;

        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tracks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    index: { type: "number" },
                                    recommended_volume: { type: "number" },
                                    should_duck: { type: "boolean" },
                                    duck_level: { type: "number" },
                                    fade_in: { type: "number" },
                                    fade_out: { type: "number" },
                                    pan: { type: "number" },
                                    note: { type: "string" }
                                }
                            }
                        },
                        voiceover_volume: { type: "number" },
                        eq_recommendation: { type: "string" },
                        mix_assessment: { type: "string" },
                        overall_loudness: { type: "string" }
                    }
                }
            });

            if (result && result.tracks) {
                setAiSuggestions(result);
                toast.success("AI mix analysis complete!", { id: toastId });
            } else {
                throw new Error("Invalid AI response");
            }
        } catch (err) {
            console.error("AI mix analysis failed:", err);
            toast.error("AI analysis failed, using profile defaults", { id: toastId });
            // Fallback to profile-based suggestions
            applyProfileDefaults();
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Apply AI suggestions to all tracks
    const handleApplyAISuggestions = () => {
        if (!aiSuggestions) return;

        const updates = [];
        aiSuggestions.tracks.forEach(suggestion => {
            if (audioTracks[suggestion.index]) {
                const trackUpdates = {
                    volume: Math.min(1.5, Math.max(0, suggestion.recommended_volume / 100)),
                    ducking: suggestion.should_duck,
                    duckLevel: Math.min(1, Math.max(0, (suggestion.duck_level || 15) / 100)),
                    fadeIn: suggestion.fade_in || 0,
                    fadeOut: suggestion.fade_out || 0,
                    pan: suggestion.pan || 0
                };
                updates.push({ index: suggestion.index, updates: trackUpdates });
                onUpdateTrack?.(suggestion.index, trackUpdates);
            }
        });

        if (aiSuggestions.voiceover_volume) {
            onUpdateVoiceover?.(Math.min(1.5, Math.max(0, aiSuggestions.voiceover_volume / 100)));
        }

        toast.success("AI mix applied to all tracks!");
        setAiSuggestions(null);
    };

    // Apply profile-based defaults (fast, no AI call)
    const applyProfileDefaults = () => {
        const profile = CONTENT_PROFILES.find(p => p.id === selectedProfile) || CONTENT_PROFILES[1];

        audioTracks.forEach((track, idx) => {
            let volume = 1;
            let duck = false;
            let duckLevel = profile.duckDepth;

            if (track.type === 'music') {
                volume = profile.musicTarget;
                duck = hasVoice;
                duckLevel = profile.duckDepth;
            } else if (track.type === 'sfx') {
                volume = profile.sfxTarget;
            } else if (track.type?.startsWith('voiceover')) {
                volume = profile.voiceTarget;
            }

            onUpdateTrack?.(idx, { volume, ducking: duck, duckLevel });
        });

        onUpdateVoiceover?.(profile.voiceTarget);
        toast.success(`${profile.icon} "${profile.name}" mix applied`);
    };

    // Apply intelligent ducking to all music tracks
    const handleSmartDucking = () => {
        audioTracks.forEach((track, idx) => {
            if (track.type === 'music') {
                onUpdateTrack?.(idx, {
                    ducking: duckingConfig.enabled,
                    duckLevel: duckingConfig.depth,
                    fadeIn: duckingConfig.attack,
                    fadeOut: duckingConfig.release
                });
            }
        });
        toast.success("Smart ducking applied to all music tracks");
    };

    return (
        <div className="space-y-4">
            {/* AI Analyze Button */}
            <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Auto-Mix
                        </p>
                        <p className="text-[10px] text-violet-600 mt-0.5">
                            Analyze scenes & balance all levels automatically
                        </p>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={handleAIAnalyze} 
                        disabled={isAnalyzing || audioTracks.length === 0}
                        className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...</>
                        ) : (
                            <><Zap className="w-3 h-3 mr-1" /> Auto-Mix</>
                        )}
                    </Button>
                </div>

                {/* AI Suggestions Preview */}
                {aiSuggestions && (
                    <div className="mt-3 space-y-2">
                        <div className="bg-white rounded-md border border-violet-200 p-2 space-y-1.5">
                            <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">AI Recommendations</p>
                            {aiSuggestions.tracks.map((s, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-600 truncate max-w-[120px]">
                                        {audioTracks[s.index]?.name || `Track ${s.index + 1}`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">
                                            {Math.round((audioTracks[s.index]?.volume || 1) * 100)}%
                                        </span>
                                        <ArrowDown className="w-2.5 h-2.5 text-violet-400" />
                                        <span className="font-bold text-violet-700">{s.recommended_volume}%</span>
                                        {s.should_duck && <Badge className="text-[8px] h-3 bg-amber-100 text-amber-700 px-1">Duck</Badge>}
                                    </div>
                                </div>
                            ))}
                            {aiSuggestions.voiceover_volume && (
                                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-violet-100">
                                    <span className="text-slate-600">Voiceover</span>
                                    <span className="font-bold text-blue-700">{aiSuggestions.voiceover_volume}%</span>
                                </div>
                            )}
                            {aiSuggestions.mix_assessment && (
                                <p className="text-[9px] text-slate-500 italic mt-1 border-t border-violet-100 pt-1">
                                    {aiSuggestions.mix_assessment}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleApplyAISuggestions} className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                                Apply AI Mix
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAiSuggestions(null)} className="h-7 text-xs">
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Profile Selector */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Content Profile</Label>
                <div className="grid grid-cols-2 gap-1.5">
                    {CONTENT_PROFILES.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile.id)}
                            className={`p-2 rounded-md border text-left transition-all ${
                                selectedProfile === profile.id 
                                    ? 'border-violet-400 bg-violet-50 shadow-sm' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <p className="text-xs font-medium flex items-center gap-1">
                                <span>{profile.icon}</span> {profile.name}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{profile.desc}</p>
                        </button>
                    ))}
                </div>
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={applyProfileDefaults}
                    className="w-full h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                    <BarChart3 className="w-3 h-3 mr-1" /> Apply Profile Levels
                </Button>
            </div>

            {/* Intelligent Ducking */}
            <Card className="border-amber-200">
                <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <Volume2 className="w-3 h-3 text-amber-500" /> Smart Ducking
                        </Label>
                        <Switch 
                            checked={duckingConfig.enabled}
                            onCheckedChange={(v) => setDuckingConfig({ ...duckingConfig, enabled: v })}
                        />
                    </div>
                    
                    {duckingConfig.enabled && (
                        <div className="space-y-2 pt-1">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Duck Depth</span>
                                    <span>{Math.round(duckingConfig.depth * 100)}%</span>
                                </div>
                                <Slider
                                    value={[duckingConfig.depth]}
                                    onValueChange={([v]) => setDuckingConfig({ ...duckingConfig, depth: v })}
                                    min={0.05} max={0.5} step={0.01}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[9px] text-slate-500">Attack</span>
                                    <Slider
                                        value={[duckingConfig.attack]}
                                        onValueChange={([v]) => setDuckingConfig({ ...duckingConfig, attack: v })}
                                        min={0.05} max={2} step={0.05}
                                    />
                                    <span className="text-[8px] text-slate-400">{duckingConfig.attack.toFixed(2)}s</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-500">Release</span>
                                    <Slider
                                        value={[duckingConfig.release]}
                                        onValueChange={([v]) => setDuckingConfig({ ...duckingConfig, release: v })}
                                        min={0.1} max={3} step={0.05}
                                    />
                                    <span className="text-[8px] text-slate-400">{duckingConfig.release.toFixed(2)}s</span>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleSmartDucking}
                                className="w-full h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                                Apply to All Music
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dynamic EQ */}
            <div className="space-y-2">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 w-full"
                >
                    <Settings2 className="w-3 h-3" /> Dynamic EQ
                    <ArrowDown className={`w-3 h-3 ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvanced && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {EQ_PRESETS.map(eq => (
                            <button
                                key={eq.id}
                                onClick={() => {
                                    setSelectedEQ(eq.id);
                                    // Store EQ on all tracks as metadata
                                    audioTracks.forEach((_, idx) => {
                                        onUpdateTrack?.(idx, { eqPreset: eq.id });
                                    });
                                    toast.success(`EQ: ${eq.name}`);
                                }}
                                className={`p-1.5 rounded-md border text-center transition-all ${
                                    selectedEQ === eq.id 
                                        ? 'border-violet-400 bg-violet-50' 
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                            >
                                <span className="text-sm">{eq.icon}</span>
                                <p className="text-[9px] font-medium">{eq.name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Track Count Summary */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1"><Mic className="w-3 h-3" /> {voiceTracks.length + (voiceoverVolume > 0 ? 1 : 0)} voice</div>
                <div className="flex items-center gap-1"><Music className="w-3 h-3" /> {musicTracks.length} music</div>
                <div className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {sfxTracks.length} sfx</div>
            </div>
        </div>
    );
}