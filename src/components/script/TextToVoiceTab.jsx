import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Mic, Play, Download, Loader2, Volume2, Globe, Cpu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const VOICE_LANGUAGES = [
    { code: 'fr-FR', name: '🇫🇷 Français' },
    { code: 'en-US', name: '🇺🇸 English (US)' },
    { code: 'en-GB', name: '🇬🇧 English (UK)' },
    { code: 'es-ES', name: '🇪🇸 Español' },
    { code: 'de-DE', name: '🇩🇪 Deutsch' },
    { code: 'it-IT', name: '🇮🇹 Italiano' },
    { code: 'pt-BR', name: '🇧🇷 Português' },
    { code: 'ar-SA', name: '🇸🇦 العربية' },
];

export default function TextToVoiceTab() {
    const [mode, setMode] = useState('integrated'); // 'integrated' | 'system'
    const [text, setText] = useState('');

    // Integrated voice state
    const [language, setLanguage] = useState('fr-FR');
    const [gender, setGender] = useState('female');
    const [speed, setSpeed] = useState([1.0]);
    const [pitch, setPitch] = useState([1.0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const audioRef = useRef(null);

    // System voice state
    const [systemVoices, setSystemVoices] = useState([]);
    const [selectedSystemVoice, setSelectedSystemVoice] = useState('');
    const [systemSpeed, setSystemSpeed] = useState([1.0]);
    const [systemPitch, setSystemPitch] = useState([1.0]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis?.getVoices() || [];
            if (voices.length > 0) {
                setSystemVoices(voices);
                const frVoice = voices.find(v => v.lang.startsWith('fr'));
                setSelectedSystemVoice(frVoice?.name || voices[0]?.name || '');
            }
        };
        loadVoices();
        window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
        return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) { toast.error("Veuillez entrer un texte."); return; }
        setIsGenerating(true);
        setAudioUrl(null);
        try {
            const response = await base44.functions.invoke('textToSpeech', {
                text: text.trim(),
                language,
                gender,
                speed: speed[0],
                pitch: pitch[0],
                voice: 'google_fallback',
            });
            if (response.data?.audioBase64) {
                const binaryString = window.atob(response.data.audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                toast.success("Voix off générée !");
                setTimeout(() => audioRef.current?.play(), 100);
            } else {
                throw new Error(response.data?.error || "Aucun audio reçu");
            }
        } catch (err) {
            toast.error("Échec : " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSystemSpeak = () => {
        if (!text.trim()) { toast.error("Veuillez entrer un texte."); return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        const voice = systemVoices.find(v => v.name === selectedSystemVoice);
        if (voice) utterance.voice = voice;
        utterance.rate = systemSpeed[0];
        utterance.pitch = systemPitch[0];
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => { setIsSpeaking(false); toast.error("Erreur de synthèse vocale."); };
        window.speechSynthesis.speak(utterance);
    };

    const handleSystemStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const handleDownload = () => {
        if (!audioBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(audioBlob);
        link.download = `voix-off-${Date.now()}.mp3`;
        link.click();
    };

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                    onClick={() => setMode('integrated')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        mode === 'integrated' ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Cpu className="w-3 h-3" />
                    Voix intégrées
                </button>
                <button
                    onClick={() => setMode('system')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        mode === 'system' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Globe className="w-3 h-3" />
                    Voix système
                </button>
            </div>

            {/* Text Input */}
            <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Texte à transformer en voix</Label>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Entrez votre texte ici..."
                    className="min-h-[100px] resize-none text-sm"
                    maxLength={2000}
                />
                <p className="text-xs text-slate-400 text-right">{text.length} / 2000</p>
            </div>

            {mode === 'integrated' ? (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Langue</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {VOICE_LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code} className="text-xs">{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Genre</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Féminine</SelectItem>
                                    <SelectItem value="male">Masculine</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Vitesse : {speed[0]}x</Label>
                            <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2.0} step={0.1} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Tonalité : {Math.round(pitch[0] * 100)}%</Label>
                            <Slider value={pitch} onValueChange={setPitch} min={0.5} max={1.5} step={0.05} />
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !text.trim()} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                        {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération...</> : <><Mic className="w-4 h-4 mr-2" />Générer la voix off</>}
                    </Button>
                    {audioUrl && (
                        <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                                <Volume2 className="w-4 h-4" />Voix off prête
                            </div>
                            <audio ref={audioRef} controls src={audioUrl} className="w-full h-9" />
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => audioRef.current?.play()} className="flex-1 border-green-300 text-green-700 hover:bg-green-50 h-8">
                                    <Play className="w-3 h-3 mr-1" />Écouter
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleDownload} className="flex-1 border-green-300 text-green-700 hover:bg-green-50 h-8">
                                    <Download className="w-3 h-3 mr-1" />Télécharger
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-600">Voix système ({systemVoices.length} disponibles)</Label>
                        {systemVoices.length === 0 ? (
                            <p className="text-xs text-slate-400 bg-slate-50 rounded p-2">Aucune voix système détectée. Vérifiez les paramètres de votre navigateur.</p>
                        ) : (
                            <Select value={selectedSystemVoice} onValueChange={setSelectedSystemVoice}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="max-h-48">
                                    {systemVoices.map(v => (
                                        <SelectItem key={v.name} value={v.name} className="text-xs">
                                            {v.name} ({v.lang})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Vitesse : {systemSpeed[0]}x</Label>
                            <Slider value={systemSpeed} onValueChange={setSystemSpeed} min={0.5} max={2.0} step={0.1} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Tonalité : {systemPitch[0]}x</Label>
                            <Slider value={systemPitch} onValueChange={setSystemPitch} min={0.5} max={2.0} step={0.1} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2 border border-blue-100">
                        💡 Les voix système utilisent le moteur de synthèse de votre navigateur — aucun crédit consommé. Le téléchargement n'est pas disponible pour ce mode.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={handleSystemSpeak} disabled={isSpeaking || !text.trim() || systemVoices.length === 0} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                            {isSpeaking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lecture...</> : <><Volume2 className="w-4 h-4 mr-2" />Lire à voix haute</>}
                        </Button>
                        {isSpeaking && (
                            <Button onClick={handleSystemStop} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                Arrêter
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}