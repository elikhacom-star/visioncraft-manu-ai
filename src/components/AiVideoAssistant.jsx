import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Video, GitBranch, Music, Loader2, Wand2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AiVideoAssistant({ isOpen, onClose, scenes, onAddScene, onUpdateTransitions, onGenerateMusic, offlineMode = false, onEnqueueTask, queueCount = 0, onProcessQueue }) {
    const [activeTab, setActiveTab] = useState("generate");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Generate Video Clip
    const [videoPrompt, setVideoPrompt] = useState("");
    const [generatedClip, setGeneratedClip] = useState(null);
    const [sceneCount, setSceneCount] = useState(6);
    const [totalSeconds, setTotalSeconds] = useState(36);
    
    // Smart Transitions
    const [transitionSuggestions, setTransitionSuggestions] = useState([]);
    
    // Auto Music
    const [musicTheme, setMusicTheme] = useState("");
    const [generatedMusic, setGeneratedMusic] = useState(null);

    const handleGenerateVideoClip = async () => {
        if (offlineMode) {
            const N = Math.max(1, Number(sceneCount) || 1);
            const total = Math.max(N * 3, Number(totalSeconds) || N * 5);
            const perScene = Math.max(2, Math.floor(total / N));
            for (let i = 1; i <= N; i++) {
                const payload = { prompt: `${videoPrompt} — scène ${i}/${N}`, duration: perScene };
                onEnqueueTask && onEnqueueTask({ type: 't2v_generate', payload });
            }
            toast.success(`Ajouté ${N} tâche(s) à la file hors-ligne`);
            setIsGenerating(false);
            return;
        }
        if (!videoPrompt.trim()) {
            toast.error("Entrez une description pour la scène");
            return;
        }

        setIsGenerating(true);
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                attempt++;
                toast.loading(`Génération vidéo IA... ${attempt > 1 ? `(Tentative ${attempt}/${maxRetries})` : '(30-60s)'}`);
                
                const N = Math.max(1, Number(sceneCount) || 1);
                const total = Math.max(N * 3, Number(totalSeconds) || N * 5);
                const perScene = Math.max(2, Math.floor(total / N));
                const response = await base44.functions.invoke('generateVideoFromText', {
                    prompt: `${videoPrompt} — scène 1/${N}`,
                    duration: perScene
                });

                if (response.data?.videoUrl) {
                    setGeneratedClip({
                        url: response.data.videoUrl,
                        prompt: videoPrompt,
                        duration: 5
                    });
                    toast.dismiss();
                    toast.success("Clip vidéo généré avec succès !");
                onAddScene && onAddScene({ url: response.data.videoUrl, duration: 5, description: videoPrompt });
                    setIsGenerating(false);
                    return;
                } else if (response.data?.error) {
                    const errorMsg = response.data.error.toLowerCase();
                    
                    if (errorMsg.includes('busy') || errorMsg.includes('queue')) {
                        if (attempt < maxRetries) {
                            toast.dismiss();
                            toast.loading(`Serveurs occupés, nouvelle tentative dans ${attempt * 3}s...`);
                            await new Promise(resolve => setTimeout(resolve, attempt * 3000));
                            continue;
                        }
                        throw new Error("Serveurs de génération saturés. Réessayez dans quelques minutes.");
                    }
                    
                    throw new Error(response.data.error);
                }
            } catch (error) {
                console.error(error);
                
                if (attempt >= maxRetries) {
                    toast.dismiss();
                    const userMessage = error.message.toLowerCase().includes('busy') || error.message.toLowerCase().includes('saturés')
                        ? "🔄 Serveurs occupés. Réessayez dans 2-3 minutes ou passez en mode hors‑ligne pour file d’attente."
                        : `❌ ${error.message}`;
                    toast.error(userMessage, { duration: 6000 });
                    setIsGenerating(false);
                    return;
                }
                
                if (error.message.toLowerCase().includes('busy')) {
                    toast.dismiss();
                    toast.loading(`Serveurs occupés, nouvelle tentative dans ${attempt * 3}s...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 3000));
                    continue;
                }
                
                toast.dismiss();
                toast.error(`Erreur: ${error.message}`);
                setIsGenerating(false);
                return;
            }
        }
        
        setIsGenerating(false);
    };

    const handleAddGeneratedClip = () => {
        if (generatedClip) {
            onAddScene({
                url: generatedClip.url,
                description: generatedClip.prompt,
                dialogue: "Scène générée par IA",
                duration: generatedClip.duration,
                mood: "ai-generated",
                scene_number: scenes.length + 1
            });
            toast.success("Clip ajouté à la timeline !");
            setGeneratedClip(null);
            setVideoPrompt("");
        }
    };

    const handleGenerateTransitions = async () => {
        if (!scenes || scenes.length < 2) {
            toast.error("Au moins 2 scènes sont nécessaires");
            return;
        }

        setIsGenerating(true);
        try {
            const scenesContext = scenes.map((s, i) => ({
                index: i,
                description: s.description || s.visual_description,
                mood: s.mood || 'neutral',
                dialogue: s.dialogue
            }));

            const prompt = `
                Analyse ces scènes vidéo et suggère les transitions optimales entre chaque paire de scènes.
                
                Scènes: ${JSON.stringify(scenesContext)}
                
                Pour chaque transition, considère:
                - Le changement de mood/ton
                - La continuité visuelle
                - Le rythme narratif
                - La cohérence thématique
                
                Suggère parmi: fade, dissolve, wipe, slide, zoom, none
                
                Retourne JSON:
                {
                    "transitions": [
                        {
                            "fromScene": 0,
                            "toScene": 1,
                            "type": "fade",
                            "duration": 0.5,
                            "reason": "Changement de mood doux"
                        }
                    ]
                }
            `;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        transitions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    fromScene: { type: "integer" },
                                    toScene: { type: "integer" },
                                    type: { type: "string" },
                                    duration: { type: "number" },
                                    reason: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (result?.transitions) {
                setTransitionSuggestions(result.transitions);
                toast.success(`${result.transitions.length} transitions analysées !`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Échec de l'analyse des transitions");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyTransitions = () => {
        if (transitionSuggestions.length > 0) {
            onUpdateTransitions(transitionSuggestions);
            toast.success("Transitions intelligentes appliquées !");
            onClose();
        }
    };

    const handleGenerateBackgroundMusic = async () => {
        setIsGenerating(true);
        try {
            // Analyze video theme
            const videoContext = scenes.map(s => ({
                description: s.description || s.visual_description,
                mood: s.mood,
                dialogue: s.dialogue
            }));

            let themePrompt = musicTheme;
            
            if (!themePrompt) {
                toast.loading("Analyse du thème vidéo...");
                const analysisPrompt = `
                    Analyse ces scènes vidéo et détermine le thème musical optimal:
                    ${JSON.stringify(videoContext)}
                    
                    Retourne un prompt musical détaillé (genre, mood, instruments, tempo).
                    Format: "Genre musical avec mood, instruments spécifiques, tempo"
                `;
                
                themePrompt = await base44.integrations.Core.InvokeLLM({
                    prompt: analysisPrompt
                });
                
                setMusicTheme(themePrompt);
                toast.dismiss();
            }

            toast.loading("Génération de la musique par IA...");
            
            const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);
            
            const musicResponse = await base44.functions.invoke('generateMusic', {
                prompt: themePrompt,
                duration: Math.min(totalDuration, 30)
            });

            if (musicResponse.data?.audioBase64) {
                const binaryString = window.atob(musicResponse.data.audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/flac' });
                const file = new File([blob], `ai_music_${Date.now()}.flac`, { type: 'audio/flac' });

                setGeneratedMusic({
                    file,
                    theme: themePrompt,
                    url: URL.createObjectURL(blob)
                });

                toast.dismiss();
                toast.success("Musique générée avec succès !");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyMusic = () => {
        if (generatedMusic) {
            onGenerateMusic(generatedMusic.file, generatedMusic.theme);
            toast.success("Musique ajoutée à la timeline !");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Assistant IA Vidéo
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="generate"><Video className="w-4 h-4 mr-2" />Générer Clip</TabsTrigger>
                        <TabsTrigger value="transitions"><GitBranch className="w-4 h-4 mr-2" />Transitions</TabsTrigger>
                        <TabsTrigger value="music"><Music className="w-4 h-4 mr-2" />Musique Auto</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden mt-4">
                        <TabsContent value="generate" className="h-full m-0">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Description de la scène à générer
                                        </label>
                                        <Textarea
                                            placeholder="Ex: Un coucher de soleil sur une plage tropicale avec des vagues douces, style cinématique, couleurs chaudes..."
                                            value={videoPrompt}
                                            onChange={(e) => setVideoPrompt(e.target.value)}
                                            className="min-h-[120px]"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            💡 Soyez détaillé : ambiance, mouvement, style visuel, éclairage...
                                        </p>
                                    </div>

                                    {/* Scene count and total length controls */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-600 mb-1 block">Nombre de scènes</label>
                                            <Select value={String(sceneCount)} onValueChange={(v) => setSceneCount(parseInt(v))}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[...Array(18)].map((_, i) => {
                                                        const n = i + 3; // 3..20
                                                        return <SelectItem key={n} value={String(n)}>{n}</SelectItem>;
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 mb-1 block">Durée totale visée (secondes)</label>
                                            <Input
                                                type="number"
                                                min={sceneCount * 2}
                                                value={totalSeconds}
                                                onChange={(e) => setTotalSeconds(parseInt(e.target.value || '0'))}
                                                className="h-9"
                                            />
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                ≈ {Math.max(2, Math.floor((Number(totalSeconds)||sceneCount*6) / Math.max(1, Number(sceneCount))))}s par scène
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateVideoClip}
                                        disabled={isGenerating || !videoPrompt.trim()}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Génération en cours (30-60s)...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Générer le Clip Vidéo
                                            </>
                                        )}
                                    </Button>

                                    {generatedClip && (
                                        <div className="bg-slate-50 rounded-lg p-4 border-2 border-green-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge className="bg-green-500 text-white">
                                                    ✓ Clip Généré
                                                </Badge>
                                                <span className="text-xs text-slate-500">
                                                    {generatedClip.duration}s
                                                </span>
                                            </div>
                                            
                                            <video
                                                src={generatedClip.url}
                                                controls
                                                className="w-full rounded-lg mb-3"
                                            />
                                            
                                            <p className="text-sm text-slate-600 mb-3 italic">
                                                "{generatedClip.prompt}"
                                            </p>

                                            <Button
                                                onClick={handleAddGeneratedClip}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <ArrowRight className="w-4 h-4 mr-2" />
                                                Ajouter à la Timeline
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="transitions" className="h-full m-0">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-2">
                                            🤖 Analyse IA des Transitions
                                        </h4>
                                        <p className="text-sm text-blue-700 mb-3">
                                            L'IA analyse le contenu, le mood et le rythme de vos scènes pour suggérer les transitions optimales.
                                        </p>
                                        <Button
                                            onClick={handleGenerateTransitions}
                                            disabled={isGenerating || scenes.length < 2}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Analyse en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="w-4 h-4 mr-2" />
                                                    Analyser et Suggérer
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {transitionSuggestions.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-700">
                                                    {transitionSuggestions.length} Transitions Suggérées
                                                </h4>
                                                <Button
                                                    onClick={handleApplyTransitions}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Appliquer Tout
                                                </Button>
                                            </div>

                                            {transitionSuggestions.map((trans, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-semibold text-blue-600">
                                                                S{trans.fromScene + 1}
                                                            </span>
                                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                                            <span className="font-semibold text-blue-600">
                                                                S{trans.toScene + 1}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                            {trans.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-1">
                                                        <span className="font-medium">Durée:</span> {trans.duration}s
                                                    </p>
                                                    <p className="text-xs text-slate-500 italic">
                                                        "{trans.reason}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="music" className="h-full m-0">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold text-purple-900 mb-2">
                                            🎵 Génération Automatique de Musique
                                        </h4>
                                        <p className="text-sm text-purple-700 mb-3">
                                            L'IA analyse votre vidéo et crée une musique de fond adaptée au thème et au mood.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Thème Musical (optionnel)
                                        </label>
                                        <Textarea
                                            placeholder="Laissez vide pour analyse automatique, ou spécifiez: Ex: Epic orchestral cinematic music with strings and percussion"
                                            value={musicTheme}
                                            onChange={(e) => setMusicTheme(e.target.value)}
                                            className="min-h-[80px]"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerateBackgroundMusic}
                                        disabled={isGenerating}
                                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Génération (30-60s)...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Générer la Musique
                                            </>
                                        )}
                                    </Button>

                                    {generatedMusic && (
                                        <div className="bg-slate-50 rounded-lg p-4 border-2 border-green-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge className="bg-green-500 text-white">
                                                    ✓ Musique Générée
                                                </Badge>
                                            </div>

                                            <audio
                                                src={generatedMusic.url}
                                                controls
                                                className="w-full mb-3"
                                            />

                                            <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                                                <p className="text-xs text-slate-500 mb-1">Thème:</p>
                                                <p className="text-sm text-slate-700">
                                                    {generatedMusic.theme}
                                                </p>
                                            </div>

                                            <Button
                                                onClick={handleApplyMusic}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                <Music className="w-4 h-4 mr-2" />
                                                Appliquer comme Musique de Fond
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