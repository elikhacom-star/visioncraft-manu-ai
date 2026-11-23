import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Music, Loader2, Cpu, Volume2, RefreshCw, Upload, Wand2 } from "lucide-react";
import { useLanguage } from './LanguageProvider';
import { toast } from "sonner";
import { generateProceduralAudio } from "./proceduralAudio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";

export default function AudioGeneratorModal({ isOpen, onClose, onGenerate, initialPrompt = "", context = "", pacingProfile = "balanced" }) {
    const { t } = useLanguage();
    const [generatorMode, setGeneratorMode] = useState(initialPrompt ? "ai" : "native");
    const [audioType, setAudioType] = useState("music");
    const [duration, setDuration] = useState(15);
    const [isGenerating, setIsGenerating] = useState(false);

    // Native Parameters
    const [mood, setMood] = useState("calm"); 
    const [sfxType, setSfxType] = useState("whoosh"); 
    const [intensity, setIntensity] = useState(0.5);

    // AI Parameters
    const [aiPrompt, setAiPrompt] = useState(initialPrompt);
    const [aiGenre, setAiGenre] = useState("ambient");
    const [aiMood, setAiMood] = useState("calm");
    const [aiTempo, setAiTempo] = useState(120);
    const [matchPacing, setMatchPacing] = useState(true);

    // Pacing profile to music mapping
    const PACING_MUSIC_MAP = {
        storytelling: { genre: 'cinematic', mood: 'epic', tempo: 80, description: 'Dramatic, orchestral, narrative-driven' },
        action: { genre: 'electronic', mood: 'energetic', tempo: 140, description: 'Fast-paced, intense, driving beats' },
        cinematic: { genre: 'orchestral', mood: 'dramatic', tempo: 90, description: 'Sweeping, emotional, film score style' },
        documentary: { genre: 'ambient', mood: 'calm', tempo: 100, description: 'Subtle, informative, unobtrusive' },
        balanced: { genre: 'ambient', mood: 'uplifting', tempo: 110, description: 'Versatile, modern, adaptable' }
    };

    // Auto-set music parameters based on pacing profile
    React.useEffect(() => {
        if (matchPacing && pacingProfile && PACING_MUSIC_MAP[pacingProfile]) {
            const mapping = PACING_MUSIC_MAP[pacingProfile];
            setAiGenre(mapping.genre);
            setAiMood(mapping.mood);
            setAiTempo(mapping.tempo);
        }
    }, [pacingProfile, matchPacing]);
    
    // Upload mode
    const [uploadedFile, setUploadedFile] = useState(null);

    // Update prompt if prop changes
    React.useEffect(() => {
        if (initialPrompt) {
            setAiPrompt(initialPrompt);
            setGeneratorMode("ai");
        }
    }, [initialPrompt]);
    
    // Update AI prompt when mood/genre/tempo changes
    React.useEffect(() => {
        if (generatorMode === 'ai' && !initialPrompt) {
            let prompt = `${aiMood} ${aiGenre} music, ${aiTempo} BPM, professional quality, seamless loop`;
            
            // Add context from script if available
            if (context && context.length > 0) {
                const contextSnippet = context.substring(0, 150);
                prompt += `. Video context: ${contextSnippet}`;
            }
            
            setAiPrompt(prompt);
        }
    }, [aiGenre, aiMood, aiTempo, generatorMode, initialPrompt, context]);

    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRef, setAudioRef] = useState(null);
    const [generatedFile, setGeneratedFile] = useState(null);

    const handlePreview = async () => {
        if (generatorMode === 'ai' && !aiPrompt) {
            toast.error("Please enter a prompt for AI music");
            return;
        }

        setIsGenerating(true);
        try {
            if (audioRef) {
                audioRef.pause();
                setAudioRef(null);
                setIsPlaying(false);
            }

            let blob;
            if (generatorMode === 'native') {
                blob = await generateProceduralAudio(
                    audioType, 
                    duration, 
                    { mood: audioType === 'music' ? mood : sfxType, intensity }
                );
            } else {
                // AI Generation
                const response = await base44.functions.invoke('generateMusic', {
                    prompt: aiPrompt,
                    duration: duration
                });
                if (response.data && response.data.audioBase64) {
                    const binaryString = window.atob(response.data.audioBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    blob = new Blob([bytes], { type: 'audio/flac' });
                } else {
                    throw new Error(response.data?.error || "AI Generation failed");
                }
            }

            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setGeneratedFile(new File([blob], `generated_audio_${Date.now()}.${generatorMode === 'ai' ? 'flac' : 'wav'}`, { type: blob.type }));

            const audio = new Audio(url);
            audio.onended = () => setIsPlaying(false);
            audio.play();
            setAudioRef(audio);
            setIsPlaying(true);

        } catch (error) {
            console.error(error);
            toast.error(`Generation failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef) return;
        if (isPlaying) {
            audioRef.pause();
            setIsPlaying(false);
        } else {
            audioRef.play();
            setIsPlaying(true);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploadedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setGeneratedFile(file);
        
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setAudioRef(audio);
        setIsPlaying(true);
        
        toast.success("Music uploaded successfully!");
    };

    const handleApply = () => {
        if (generatedFile) {
            onGenerate({
                file: generatedFile,
                type: audioType,
                name: uploadedFile ? uploadedFile.name : (generatorMode === 'ai' ? `AI: ${aiGenre}` : `Native ${audioType === 'music' ? mood : sfxType}`)
            });
            onClose();
            toast.success("Audio applied to project!");
        } else {
            handlePreview(); // Generate if not yet done
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Background Music Studio
                    </DialogTitle>
                    <DialogDescription>
                        Upload your own music, generate with AI, or create instant native audio.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={generatorMode} onValueChange={setGeneratorMode} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="native">Native</TabsTrigger>
                        <TabsTrigger value="ai">AI</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors bg-white/50">
                            <Input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="music-upload"
                            />
                            <label htmlFor="music-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                {uploadedFile ? (
                                    <>
                                        <Music className="w-12 h-12 text-green-500" />
                                        <div>
                                            <p className="font-medium text-slate-700">{uploadedFile.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 bg-amber-100 rounded-full">
                                            <Upload className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-700">Upload Your Music</p>
                                            <p className="text-xs text-slate-500 mt-1">MP3, WAV, FLAC, OGG supported</p>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </TabsContent>

                    <TabsContent value="native" className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Audio Type</Label>
                            <div className="flex gap-2">
                                <Button 
                                    variant={audioType === 'music' ? 'default' : 'outline'}
                                    onClick={() => setAudioType('music')}
                                    className="flex-1"
                                >
                                    <Music className="w-4 h-4 mr-2" />
                                    Music
                                </Button>
                                <Button 
                                    variant={audioType === 'sfx' ? 'default' : 'outline'}
                                    onClick={() => setAudioType('sfx')}
                                    className="flex-1"
                                >
                                    <Volume2 className="w-4 h-4 mr-2" />
                                    SFX
                                </Button>
                            </div>
                        </div>

                        {audioType === 'music' ? (
                            <div className="grid gap-2">
                                <Label>Mood & Style</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['calm', 'energetic', 'dark', 'uplifting', 'horror', 'nature', 'city'].map(m => (
                                        <Button
                                            key={m}
                                            size="sm"
                                            variant={mood === m ? 'secondary' : 'ghost'}
                                            className={`justify-start ${mood === m ? 'bg-amber-100 text-amber-900' : 'border border-slate-200'}`}
                                            onClick={() => setMood(m)}
                                        >
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>SFX Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['whoosh', 'impact', 'sweep'].map(t => (
                                        <Button
                                            key={t}
                                            size="sm"
                                            variant={sfxType === t ? 'secondary' : 'ghost'}
                                            className={`text-xs ${sfxType === t ? 'bg-blue-100 text-blue-900' : 'border border-slate-200'}`}
                                            onClick={() => setSfxType(t)}
                                        >
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {audioType === 'music' && (
                            <div className="grid gap-2">
                                <Label>Intensity</Label>
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.1" 
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                                    className="h-9 w-full"
                                />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4">
                        <div className="grid gap-3">
                            {/* Match Pacing Toggle */}
                            {pacingProfile && (
                                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="match-pacing"
                                            checked={matchPacing}
                                            onChange={(e) => setMatchPacing(e.target.checked)}
                                            className="h-4 w-4 rounded border-amber-300 text-amber-600"
                                        />
                                        <Label htmlFor="match-pacing" className="text-xs cursor-pointer">
                                            <span className="font-medium text-amber-800">Match Pacing Profile</span>
                                            <span className="text-amber-600 ml-1">({pacingProfile})</span>
                                        </Label>
                                    </div>
                                    {matchPacing && PACING_MUSIC_MAP[pacingProfile] && (
                                        <span className="text-[10px] text-amber-600">
                                            {PACING_MUSIC_MAP[pacingProfile].description}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Genre</Label>
                                    <Select value={aiGenre} onValueChange={(v) => { setAiGenre(v); setMatchPacing(false); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ambient">Ambient</SelectItem>
                                            <SelectItem value="lo-fi">Lo-Fi Hip Hop</SelectItem>
                                            <SelectItem value="cinematic">Cinematic</SelectItem>
                                            <SelectItem value="electronic">Electronic</SelectItem>
                                            <SelectItem value="jazz">Jazz</SelectItem>
                                            <SelectItem value="classical">Classical</SelectItem>
                                            <SelectItem value="rock">Rock</SelectItem>
                                            <SelectItem value="pop">Pop</SelectItem>
                                            <SelectItem value="orchestral">Orchestral</SelectItem>
                                            <SelectItem value="techno">Techno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Mood</Label>
                                    <Select value={aiMood} onValueChange={(v) => { setAiMood(v); setMatchPacing(false); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="calm">Calm & Relaxing</SelectItem>
                                            <SelectItem value="energetic">Energetic</SelectItem>
                                            <SelectItem value="uplifting">Uplifting</SelectItem>
                                            <SelectItem value="dark">Dark & Mysterious</SelectItem>
                                            <SelectItem value="epic">Epic & Dramatic</SelectItem>
                                            <SelectItem value="happy">Happy & Cheerful</SelectItem>
                                            <SelectItem value="sad">Sad & Melancholic</SelectItem>
                                            <SelectItem value="suspenseful">Suspenseful</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-medium">Tempo (BPM)</Label>
                                    <span className="text-xs text-slate-500">{aiTempo}</span>
                                </div>
                                <Slider 
                                    value={[aiTempo]} 
                                    onValueChange={([v]) => { setAiTempo(v); setMatchPacing(false); }}
                                    min={60} 
                                    max={180} 
                                    step={5}
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Slow (60)</span>
                                    <span>Medium (120)</span>
                                    <span>Fast (180)</span>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-medium">Custom Prompt (Optional)</Label>
                                <Textarea 
                                    placeholder="Add specific instruments, style details, or override auto-prompt..."
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    className="h-20 text-sm"
                                />
                                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                    <Wand2 className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>Auto: "{aiMood} {aiGenre} music, {aiTempo} BPM"</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                                🎵 Powered by Facebook MusicGen via Hugging Face
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {generatorMode !== 'upload' && (
                    <div className="grid gap-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between">
                            <Label className="text-sm font-medium">Duration (seconds)</Label>
                            <span className="text-sm text-slate-500">{duration}s</span>
                        </div>
                        <Slider 
                            value={[duration]} 
                            onValueChange={([v]) => setDuration(v)}
                            min={5} 
                            max={60} 
                            step={5}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Short (5s)</span>
                            <span>Medium (30s)</span>
                            <span>Long (60s)</span>
                        </div>
                    </div>
                )}

                    {/* Preview Section */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                         <Button 
                            size="sm"
                            variant="outline"
                            onClick={previewUrl ? togglePlay : handlePreview}
                            disabled={isGenerating}
                            className="w-24 shrink-0"
                        >
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                             isPlaying ? <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm animate-pulse"/> Stop</span> : 
                             previewUrl ? "Play Again" : "Preview"}
                        </Button>
                        <span className="text-xs text-slate-500 truncate flex-1">
                            {previewUrl ? "Preview ready - click to listen" : "Click preview to test sound"}
                        </span>
                        {previewUrl && !isGenerating && (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {setPreviewUrl(null); setAudioRef(null);}}>
                                <RefreshCw className="w-3 h-3 text-slate-400" />
                            </Button>
                        )}
                    </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleApply} disabled={isGenerating || (generatorMode === 'upload' && !uploadedFile)} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {generatorMode === 'ai' ? 'Generating AI Music...' : 'Synthesizing...'}
                            </>
                        ) : (
                            <>
                                <Music className="w-4 h-4 mr-2" />
                                {generatedFile || uploadedFile ? 'Add to Project' : 'Generate & Add'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}