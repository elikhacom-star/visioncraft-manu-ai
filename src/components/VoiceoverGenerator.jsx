import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, Pause, Download, Loader2, Volume2, Globe, User, Sparkles, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Voix disponibles par provider
const VOICES = {
    openai: [
        { id: 'alloy', name: 'Alloy', gender: 'neutral', desc: 'Voix neutre et équilibrée' },
        { id: 'echo', name: 'Echo', gender: 'male', desc: 'Voix masculine profonde' },
        { id: 'fable', name: 'Fable', gender: 'neutral', desc: 'Voix narrative expressive' },
        { id: 'onyx', name: 'Onyx', gender: 'male', desc: 'Voix masculine autoritaire' },
        { id: 'nova', name: 'Nova', gender: 'female', desc: 'Voix féminine dynamique' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female', desc: 'Voix féminine douce' }
    ],
    elevenlabs: [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', accent: 'American', desc: 'Calme et professionnelle' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', accent: 'American', desc: 'Forte et confiante' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', accent: 'American', desc: 'Douce et chaleureuse' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', accent: 'American', desc: 'Bien modulée et expressive' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', accent: 'American', desc: 'Claire et émotive' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', accent: 'American', desc: 'Profonde et narrative' },
        { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', accent: 'American', desc: 'Énergique et crisp' },
        { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', accent: 'American', desc: 'Profonde et narrative' },
        { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', accent: 'American', desc: 'Dynamique et raspy' },
        { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', accent: 'American', desc: 'Caractéristique overperforming' }
    ]
};

// Langues supportées
const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
];

// Émotions/Styles
const EMOTIONS = [
    { id: 'neutral', name: 'Neutre', emoji: '😐', desc: 'Ton standard, professionnel' },
    { id: 'happy', name: 'Joyeux', emoji: '😊', desc: 'Ton enthousiaste et positif' },
    { id: 'sad', name: 'Triste', emoji: '😢', desc: 'Ton mélancolique et doux' },
    { id: 'angry', name: 'Intense', emoji: '😤', desc: 'Ton assertif et passionné' },
    { id: 'calm', name: 'Calme', emoji: '😌', desc: 'Ton apaisant, méditation' },
    { id: 'excited', name: 'Excité', emoji: '🤩', desc: 'Ton très énergique' }
];

export default function VoiceoverGenerator({ isOpen, onClose, script, onApply, scenes = [] }) {
    const [text, setText] = useState(script || '');
    const [language, setLanguage] = useState('fr');
    const [provider, setProvider] = useState('auto');
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [gender, setGender] = useState('female');
    const [emotion, setEmotion] = useState('neutral');
    const [speed, setSpeed] = useState([1.0]);
    const [stability, setStability] = useState([0.5]);
    const [style, setStyle] = useState([0.0]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRef] = useState(() => typeof Audio !== 'undefined' ? new Audio() : null);
    const [generatedAudioBlob, setGeneratedAudioBlob] = useState(null);

    // Filtrer voix par genre
    const filteredVoices = provider === 'openai' 
        ? VOICES.openai.filter(v => gender === 'all' || v.gender === gender || v.gender === 'neutral')
        : VOICES.elevenlabs.filter(v => gender === 'all' || v.gender === gender);

    const handleGenerate = async (forPreview = false) => {
        const targetText = forPreview ? (text.slice(0, 200) || "Ceci est un aperçu de la voix sélectionnée.") : text;
        
        if (!targetText.trim()) {
            toast.error("Veuillez entrer du texte");
            return;
        }

        setIsGenerating(true);
        try {
            const useElevenlabs = provider === 'elevenlabs' || (provider === 'auto' && selectedVoice?.id?.length > 10);
            
            const response = await base44.functions.invoke('textToSpeech', {
                text: targetText,
                language: language,
                gender: gender,
                voice: provider === 'openai' ? (selectedVoice?.id || 'alloy') : undefined,
                voice_id: useElevenlabs ? selectedVoice?.id : undefined,
                use_elevenlabs: useElevenlabs,
                speed: speed[0],
                stability: stability[0],
                style: style[0],
                emotion: emotion
            });

            if (response.data?.audioBase64) {
                const binaryString = atob(response.data.audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                
                setPreviewUrl(url);
                setGeneratedAudioBlob(blob);
                
                if (forPreview && audioRef) {
                    audioRef.src = url;
                    audioRef.play();
                    setIsPlaying(true);
                    audioRef.onended = () => setIsPlaying(false);
                }
                
                if (!forPreview) {
                    toast.success(`Voix off générée (${response.data.provider})`);
                }
            } else {
                throw new Error(response.data?.error || "Échec de la génération");
            }
        } catch (error) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayPause = () => {
        if (!audioRef || !previewUrl) return;
        
        if (isPlaying) {
            audioRef.pause();
            setIsPlaying(false);
        } else {
            audioRef.src = previewUrl;
            audioRef.play();
            setIsPlaying(true);
            audioRef.onended = () => setIsPlaying(false);
        }
    };

    const handleApply = () => {
        if (generatedAudioBlob && previewUrl) {
            onApply?.({
                audioUrl: previewUrl,
                audioBlob: generatedAudioBlob,
                text: text,
                settings: {
                    language,
                    provider,
                    voice: selectedVoice,
                    gender,
                    emotion,
                    speed: speed[0],
                    stability: stability[0],
                    style: style[0]
                }
            });
            onClose();
        } else {
            toast.error("Générez d'abord la voix off");
        }
    };

    const handleExtractFromScenes = () => {
        if (scenes.length > 0) {
            const allDialogue = scenes
                .map((s, i) => s.dialogue || s.narration || '')
                .filter(Boolean)
                .join('\n\n');
            setText(allDialogue);
            toast.success(`${scenes.length} scènes extraites`);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-amber-500" />
                        Générateur de Voix Off IA
                    </DialogTitle>
                    <DialogDescription>
                        Transformez votre script en voix off professionnelle avec différentes voix, langues et styles.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="script">Script</TabsTrigger>
                        <TabsTrigger value="voice">Voix & Langue</TabsTrigger>
                        <TabsTrigger value="style">Style & Émotion</TabsTrigger>
                    </TabsList>

                    <TabsContent value="script" className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <Label>Texte à convertir en voix</Label>
                            {scenes.length > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleExtractFromScenes}
                                    className="text-xs"
                                >
                                    <Wand2 className="w-3 h-3 mr-1" />
                                    Extraire des scènes ({scenes.length})
                                </Button>
                            )}
                        </div>
                        <Textarea
                            placeholder="Entrez votre script ici... Le texte sera converti en voix off de haute qualité."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[200px]"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>{text.length} caractères</span>
                            <span>~{Math.ceil(text.length / 150)} secondes estimées</span>
                        </div>
                    </TabsContent>

                    <TabsContent value="voice" className="space-y-4 mt-4">
                        {/* Langue */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Langue
                            </Label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <Button
                                        key={lang.code}
                                        variant={language === lang.code ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setLanguage(lang.code)}
                                        className={`h-auto py-2 flex flex-col items-center gap-1 ${
                                            language === lang.code ? 'bg-amber-500 hover:bg-amber-600' : ''
                                        }`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="text-[10px]">{lang.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Provider & Genre */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Moteur IA</Label>
                                <Select value={provider} onValueChange={setProvider}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">🤖 Auto (meilleur)</SelectItem>
                                        <SelectItem value="elevenlabs">🎙️ ElevenLabs (Premium)</SelectItem>
                                        <SelectItem value="openai">🔊 OpenAI TTS</SelectItem>
                                        <SelectItem value="free">🆓 Gratuit (basique)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Genre</Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="female">👩 Féminine</SelectItem>
                                        <SelectItem value="male">👨 Masculine</SelectItem>
                                        <SelectItem value="all">👤 Toutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sélection de voix */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Voix ({filteredVoices.length} disponibles)
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                                {filteredVoices.map((voice) => (
                                    <Card
                                        key={voice.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            selectedVoice?.id === voice.id 
                                                ? 'ring-2 ring-amber-500 bg-amber-50' 
                                                : 'hover:border-slate-300'
                                        }`}
                                        onClick={() => setSelectedVoice(voice)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                                    voice.gender === 'female' ? 'bg-pink-100 text-pink-600' : 
                                                    voice.gender === 'male' ? 'bg-blue-100 text-blue-600' : 
                                                    'bg-purple-100 text-purple-600'
                                                }`}>
                                                    {voice.gender === 'female' ? '♀' : voice.gender === 'male' ? '♂' : '◎'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{voice.name}</div>
                                                    <div className="text-[10px] text-slate-500">{voice.desc}</div>
                                                </div>
                                            </div>
                                            {voice.accent && (
                                                <Badge variant="outline" className="mt-2 text-[9px]">
                                                    {voice.accent}
                                                </Badge>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4 mt-4">
                        {/* Émotion */}
                        <div className="space-y-2">
                            <Label>Émotion / Ton</Label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {EMOTIONS.map((emo) => (
                                    <Button
                                        key={emo.id}
                                        variant={emotion === emo.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setEmotion(emo.id)}
                                        className={`h-auto py-2 flex flex-col items-center gap-1 ${
                                            emotion === emo.id ? 'bg-purple-500 hover:bg-purple-600' : ''
                                        }`}
                                    >
                                        <span className="text-xl">{emo.emoji}</span>
                                        <span className="text-[10px]">{emo.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Paramètres avancés */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                            <Label className="text-sm font-medium">Paramètres Avancés</Label>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Vitesse</span>
                                    <span className="font-mono">{speed[0].toFixed(1)}x</span>
                                </div>
                                <Slider
                                    value={speed}
                                    onValueChange={setSpeed}
                                    min={0.5}
                                    max={2.0}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Stabilité (expressivité)</span>
                                    <span className="font-mono">{Math.round(stability[0] * 100)}%</span>
                                </div>
                                <Slider
                                    value={stability}
                                    onValueChange={setStability}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>+ Expressif</span>
                                    <span>+ Stable</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Style / Exagération</span>
                                    <span className="font-mono">{Math.round(style[0] * 100)}%</span>
                                </div>
                                <Slider
                                    value={style}
                                    onValueChange={setStyle}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Prévisualisation */}
                <div className="p-4 bg-slate-100 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Aperçu</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerate(true)}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Tester
                                    </>
                                )}
                            </Button>
                            {previewUrl && (
                                <Button
                                    size="sm"
                                    variant={isPlaying ? "destructive" : "default"}
                                    onClick={handlePlayPause}
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {previewUrl && (
                        <audio controls src={previewUrl} className="w-full h-10" />
                    )}
                    
                    <div className="text-[10px] text-slate-500 text-center">
                        💡 Le test génère un aperçu court. Cliquez "Générer" pour la version complète.
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between gap-2">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleGenerate(false)}
                            disabled={isGenerating || !text.trim()}
                            variant="secondary"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4 mr-2" />
                                    Générer
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleApply}
                            disabled={!generatedAudioBlob}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Appliquer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}