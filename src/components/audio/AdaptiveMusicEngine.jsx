import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Loader2, Sparkles, Play, Pause, RefreshCw, Zap, BarChart3, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";
import { generateProceduralAudio } from "../../components/proceduralAudio";

// Map scene moods/descriptions to music parameters
const MOOD_MUSIC_MAP = {
    dramatic: { genre: 'orchestral', mood: 'epic', tempo: 85, intensity: 0.8 },
    cinematic: { genre: 'cinematic', mood: 'dramatic', tempo: 90, intensity: 0.7 },
    suspenseful: { genre: 'ambient', mood: 'dark', tempo: 70, intensity: 0.6 },
    mysterious: { genre: 'ambient', mood: 'dark', tempo: 65, intensity: 0.5 },
    joyful: { genre: 'pop', mood: 'happy', tempo: 130, intensity: 0.7 },
    uplifting: { genre: 'cinematic', mood: 'uplifting', tempo: 120, intensity: 0.8 },
    energetic: { genre: 'electronic', mood: 'energetic', tempo: 140, intensity: 0.9 },
    melancholic: { genre: 'classical', mood: 'sad', tempo: 70, intensity: 0.4 },
    nostalgic: { genre: 'lo-fi', mood: 'calm', tempo: 80, intensity: 0.4 },
    ethereal: { genre: 'ambient', mood: 'calm', tempo: 60, intensity: 0.3 },
    dark: { genre: 'ambient', mood: 'dark', tempo: 60, intensity: 0.6 },
    intense: { genre: 'electronic', mood: 'energetic', tempo: 150, intensity: 1.0 },
    romantic: { genre: 'classical', mood: 'calm', tempo: 75, intensity: 0.4 },
    professional: { genre: 'ambient', mood: 'calm', tempo: 100, intensity: 0.3 },
};

function analyzeScenesMoodCurve(scenes) {
    return scenes.map((scene, i) => {
        const desc = (scene.description || '').toLowerCase();
        const mood = (scene.mood || '').toLowerCase();
        const dialogue = scene.dialogue || '';
        const wordCount = dialogue.split(/\s+/).filter(w => w.length > 0).length;

        // Detect intensity from content
        let intensity = 0.5;
        let detectedMood = 'cinematic';

        for (const [moodKey, params] of Object.entries(MOOD_MUSIC_MAP)) {
            if (mood.includes(moodKey) || desc.includes(moodKey)) {
                detectedMood = moodKey;
                intensity = params.intensity;
                break;
            }
        }

        // Boost intensity for dialogue-heavy scenes
        if (wordCount > 30) intensity = Math.min(1, intensity + 0.1);
        // Action keywords
        if (desc.match(/fight|explosion|chase|battle|war|run|crash/)) {
            intensity = Math.min(1, intensity + 0.3);
            detectedMood = 'intense';
        }
        // Emotional keywords
        if (desc.match(/tears|cry|death|farewell|goodbye|loss|sad/)) {
            detectedMood = 'melancholic';
            intensity = 0.4;
        }

        const musicParams = MOOD_MUSIC_MAP[detectedMood] || MOOD_MUSIC_MAP.cinematic;

        return {
            sceneIndex: i,
            sceneNumber: scene.scene_number || i + 1,
            duration: scene.duration || 5,
            detectedMood,
            intensity,
            musicParams,
            description: (scene.description || '').substring(0, 60),
            hasDialogue: wordCount > 0,
            wordCount,
        };
    });
}

export default function AdaptiveMusicEngine({ isOpen, onClose, scenes = [], onApplyTracks, totalDuration }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState('');
    const [moodCurve, setMoodCurve] = useState([]);
    const [generatedTracks, setGeneratedTracks] = useState([]);
    const [previewAudio, setPreviewAudio] = useState(null);
    const [playingIdx, setPlayingIdx] = useState(null);

    // Settings
    const [musicStyle, setMusicStyle] = useState('adaptive'); // adaptive, single, layered
    const [baseGenre, setBaseGenre] = useState('cinematic');
    const [duckingAmount, setDuckingAmount] = useState([0.3]);
    const [overallVolume, setOverallVolume] = useState([0.25]);
    const [transitionSmoothing, setTransitionSmoothing] = useState([1.0]);

    const handleAnalyze = () => {
        if (scenes.length === 0) { toast.error("Aucune scène à analyser"); return; }
        setIsAnalyzing(true);
        const curve = analyzeScenesMoodCurve(scenes);
        setMoodCurve(curve);
        setIsAnalyzing(false);
        toast.success(`Analyse terminée : ${curve.length} scènes analysées`);
    };

    // Helper: generate procedural audio for a mood zone
    const generateProceduralForMood = async (mood, duration) => {
        const wavBlob = await generateProceduralAudio('music', Math.min(30, Math.max(5, duration)));
        return new File([wavBlob], `procedural_${mood}_${Date.now()}.wav`, { type: 'audio/wav' });
    };

    // Try AI generation, fallback to procedural
    const generateMusicTrack = async (prompt, duration, label) => {
        // Try backend AI first
        try {
            const response = await base44.functions.invoke('generateMusic', { prompt, duration: Math.min(30, duration) });
            if (response.data?.audioBase64) {
                const bytes = Uint8Array.from(atob(response.data.audioBase64), c => c.charCodeAt(0));
                const blob = new Blob([bytes], { type: 'audio/flac' });
                return new File([blob], `${label}.flac`, { type: 'audio/flac' });
            }
            if (response.data?.error) throw new Error(response.data.error);
        } catch (e) {
            console.warn(`AI music gen failed for "${label}", using procedural:`, e.message);
        }

        // Fallback: procedural (browser-based)
        toast.info(`Utilisation de la musique procédurale pour "${label}"`);
        return await generateProceduralForMood(label, duration);
    };

    const handleGenerate = async () => {
        if (moodCurve.length === 0) { toast.error("Analysez d'abord les scènes"); return; }

        setIsGenerating(true);
        setProgress(0);
        const tracks = [];

        try {
            if (musicStyle === 'single') {
                setCurrentTask('Génération d\'une piste musicale unique...');
                setProgress(20);
                const dominantMood = moodCurve.reduce((best, m) => m.intensity > best.intensity ? m : best, moodCurve[0]);
                const avgTempo = Math.round(moodCurve.reduce((s, m) => s + m.musicParams.tempo, 0) / moodCurve.length);
                const prompt = `${dominantMood.musicParams.mood} ${baseGenre} music, ${avgTempo} BPM, cinematic quality, seamless background music for video, professional mix`;

                const file = await generateMusicTrack(prompt, totalDuration || 30, `adaptive_music_full`);
                tracks.push({
                    name: `🎵 Musique Adaptative (${dominantMood.detectedMood})`,
                    type: 'music',
                    file, volume: overallVolume[0], ducking: true,
                    duckingAmount: duckingAmount[0],
                    fadeIn: 2.0, fadeOut: 3.0,
                    startOffset: 0,
                    duration: totalDuration || 30,
                    _meta: { style: 'single', genre: baseGenre, mood: dominantMood.detectedMood }
                });
                setProgress(100);
            } else {
                // Adaptive: group consecutive scenes with similar mood into zones
                const zones = [];
                let currentZone = { startIndex: 0, mood: moodCurve[0]?.detectedMood, scenes: [moodCurve[0]], startTime: 0 };

                let cumulativeTime = 0;
                for (let i = 1; i < moodCurve.length; i++) {
                    cumulativeTime += moodCurve[i - 1].duration;
                    if (moodCurve[i].detectedMood !== currentZone.mood) {
                        currentZone.endTime = cumulativeTime;
                        currentZone.duration = currentZone.endTime - currentZone.startTime;
                        zones.push(currentZone);
                        currentZone = { startIndex: i, mood: moodCurve[i].detectedMood, scenes: [moodCurve[i]], startTime: cumulativeTime };
                    } else {
                        currentZone.scenes.push(moodCurve[i]);
                    }
                }
                cumulativeTime += (moodCurve[moodCurve.length - 1]?.duration || 5);
                currentZone.endTime = cumulativeTime;
                currentZone.duration = currentZone.endTime - currentZone.startTime;
                zones.push(currentZone);

                for (let z = 0; z < zones.length; z++) {
                    const zone = zones[z];
                    setCurrentTask(`Génération zone ${z + 1}/${zones.length} (${zone.mood})...`);
                    setProgress(((z + 0.5) / zones.length) * 100);

                    const params = MOOD_MUSIC_MAP[zone.mood] || MOOD_MUSIC_MAP.cinematic;
                    const avgIntensity = zone.scenes.reduce((s, sc) => s + sc.intensity, 0) / zone.scenes.length;
                    const prompt = `${params.mood} ${baseGenre} music, ${params.tempo} BPM, intensity ${Math.round(avgIntensity * 100)}%, cinematic background, smooth transitions, professional mix, ${zone.mood} atmosphere`;

                    const file = await generateMusicTrack(prompt, Math.max(5, zone.duration), `adaptive_zone_${z + 1}_${zone.mood}`);
                    const crossfade = transitionSmoothing[0];
                    tracks.push({
                        name: `🎵 Zone ${z + 1}: ${zone.mood} (S${zone.scenes.map(s => s.sceneNumber).join(',')})`,
                        type: 'music',
                        file, volume: overallVolume[0] * avgIntensity,
                        ducking: true,
                        duckingAmount: duckingAmount[0],
                        fadeIn: z === 0 ? 2.0 : crossfade,
                        fadeOut: z === zones.length - 1 ? 3.0 : crossfade,
                        startOffset: zone.startTime,
                        duration: zone.duration,
                        _meta: { style: 'adaptive', zone: z, mood: zone.mood, intensity: avgIntensity, scenes: zone.scenes.map(s => s.sceneNumber) }
                    });
                    setProgress(((z + 1) / zones.length) * 100);
                }
            }
        } catch (e) {
            console.error('Music generation failed:', e);
            toast.error(`Échec: ${e.message}`);
        }

        setGeneratedTracks(tracks);
        setProgress(100);
        setCurrentTask(tracks.length > 0 ? `${tracks.length} piste(s) générée(s) !` : 'Échec de la génération');
        setIsGenerating(false);
        if (tracks.length > 0) toast.success(`${tracks.length} piste(s) de musique adaptative créée(s)`);
    };

    const handlePreview = (idx) => {
        if (playingIdx === idx && previewAudio) {
            previewAudio.pause();
            setPlayingIdx(null);
            return;
        }
        if (previewAudio) previewAudio.pause();

        const track = generatedTracks[idx];
        if (!track?.file) return;

        const url = URL.createObjectURL(track.file);
        const audio = new Audio(url);
        audio.volume = Math.min(1, track.volume * 2);
        audio.onended = () => setPlayingIdx(null);
        audio.play();
        setPreviewAudio(audio);
        setPlayingIdx(idx);
    };

    const handleApply = () => {
        if (generatedTracks.length === 0) { toast.error("Générez d'abord la musique"); return; }
        onApplyTracks(generatedTracks);
        onClose();
    };

    // Mood curve visualization
    const moodColors = {
        dramatic: '#ef4444', cinematic: '#f59e0b', suspenseful: '#6366f1',
        mysterious: '#8b5cf6', joyful: '#22c55e', uplifting: '#10b981',
        energetic: '#f97316', melancholic: '#6b7280', nostalgic: '#a855f7',
        ethereal: '#06b6d4', dark: '#1e293b', intense: '#dc2626',
        romantic: '#ec4899', professional: '#64748b',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Musique de Fond Adaptative
                    </DialogTitle>
                    <DialogDescription>
                        L'IA analyse vos scènes et génère une musique qui s'adapte dynamiquement aux changements d'ambiance.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Progress */}
                    {(isAnalyzing || isGenerating) && (
                        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>{currentTask}</span>
                                <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Mode musical</Label>
                            <Select value={musicStyle} onValueChange={setMusicStyle}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="adaptive">🎭 Adaptatif (par zones)</SelectItem>
                                    <SelectItem value="single">🎵 Piste unique</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Genre de base</Label>
                            <Select value={baseGenre} onValueChange={setBaseGenre}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cinematic">🎬 Cinématique</SelectItem>
                                    <SelectItem value="orchestral">🎻 Orchestral</SelectItem>
                                    <SelectItem value="ambient">🌊 Ambient</SelectItem>
                                    <SelectItem value="electronic">⚡ Électronique</SelectItem>
                                    <SelectItem value="lo-fi">🎧 Lo-Fi</SelectItem>
                                    <SelectItem value="classical">🎹 Classique</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Volume</span><span>{Math.round(overallVolume[0] * 100)}%</span>
                            </div>
                            <Slider value={overallVolume} onValueChange={setOverallVolume} min={0.05} max={0.5} step={0.05} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Ducking voix</span><span>{Math.round(duckingAmount[0] * 100)}%</span>
                            </div>
                            <Slider value={duckingAmount} onValueChange={setDuckingAmount} min={0.1} max={0.8} step={0.05} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Crossfade</span><span>{transitionSmoothing[0].toFixed(1)}s</span>
                            </div>
                            <Slider value={transitionSmoothing} onValueChange={setTransitionSmoothing} min={0.5} max={3.0} step={0.5} />
                        </div>
                    </div>

                    {/* Analyze button */}
                    {moodCurve.length === 0 && !isAnalyzing && (
                        <div className="text-center py-4">
                            <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500 mb-3">Analysez vos scènes pour détecter les ambiances et intensités</p>
                            <Button onClick={handleAnalyze} disabled={scenes.length === 0} className="bg-amber-500 hover:bg-amber-600">
                                <Sparkles className="w-4 h-4 mr-2" /> Analyser {scenes.length} scènes
                            </Button>
                        </div>
                    )}

                    {/* Mood Curve Visualization */}
                    {moodCurve.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-600">Courbe d'ambiance</Label>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={handleAnalyze}>
                                    <RefreshCw className="w-3 h-3 mr-1" /> Re-analyser
                                </Button>
                            </div>

                            {/* Visual bar chart */}
                            <div className="flex items-end gap-0.5 h-20 p-2 bg-slate-50 rounded-lg border">
                                {moodCurve.map((m, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t-sm relative group cursor-default transition-all hover:opacity-80"
                                        style={{
                                            height: `${m.intensity * 100}%`,
                                            backgroundColor: moodColors[m.detectedMood] || '#94a3b8',
                                            minWidth: 8,
                                        }}
                                        title={`Scène ${m.sceneNumber}: ${m.detectedMood} (${Math.round(m.intensity * 100)}%)`}
                                    >
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-slate-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                            {m.sceneNumber}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-1.5">
                                {[...new Set(moodCurve.map(m => m.detectedMood))].map(mood => (
                                    <Badge key={mood} variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: moodColors[mood], color: moodColors[mood] }}>
                                        {mood}
                                    </Badge>
                                ))}
                            </div>

                            {/* Scene detail list */}
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {moodCurve.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-white border border-slate-100">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: moodColors[m.detectedMood] }} />
                                        <span className="font-medium w-10">S{m.sceneNumber}</span>
                                        <Badge variant="outline" className="text-[8px]">{m.detectedMood}</Badge>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${m.intensity * 100}%`, backgroundColor: moodColors[m.detectedMood] }} />
                                        </div>
                                        <span className="text-slate-400 w-8 text-right">{m.duration}s</span>
                                        {m.hasDialogue && <Volume2 className="w-3 h-3 text-blue-400" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate button */}
                    {moodCurve.length > 0 && generatedTracks.length === 0 && !isGenerating && (
                        <Button onClick={handleGenerate} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                            <Zap className="w-4 h-4 mr-2" />
                            Générer la musique {musicStyle === 'adaptive' ? 'adaptative' : 'unique'}
                        </Button>
                    )}

                    {/* Generated tracks */}
                    {generatedTracks.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-green-600">Pistes générées</Label>
                            {generatedTracks.map((track, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handlePreview(idx)}>
                                        {playingIdx === idx ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{track.name}</div>
                                        <div className="text-[9px] text-slate-500">
                                            Vol: {Math.round(track.volume * 100)}% · Offset: {track.startOffset?.toFixed(1)}s · Dur: {track.duration?.toFixed(1)}s
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-3">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    {generatedTracks.length > 0 && (
                        <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white">
                            <Music className="w-4 h-4 mr-2" /> Ajouter {generatedTracks.length} piste(s)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}