import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Subtitles, Upload, FileText, Loader2, Wand2, Save, Copy, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SubtitleManager({ isOpen, onClose, scenes, subtitleSettings, onUpdateSettings, onUpdateSceneSubtitles }) {
    const [activeTab, setActiveTab] = useState('auto');
    const [customText, setCustomText] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioFile, setAudioFile] = useState(null);

    // Generate subtitles from existing scene dialogue
    const handleAutoGenerate = () => {
        if (!scenes || scenes.length === 0) {
            toast.error("Aucune scène disponible");
            return;
        }

        const updatedScenes = scenes.map(scene => ({
            ...scene,
            subtitleText: scene.dialogue || ''
        }));
        onUpdateSceneSubtitles(updatedScenes);
        toast.success("Sous-titres générés depuis le dialogue des scènes");
    };

    // Apply custom pasted text — split by scene
    const handleApplyCustomText = () => {
        if (!customText.trim()) {
            toast.error("Veuillez coller un texte");
            return;
        }

        const lines = customText.split('\n').filter(l => l.trim());
        const updatedScenes = scenes.map((scene, i) => ({
            ...scene,
            subtitleText: lines[i] || scene.dialogue || ''
        }));
        onUpdateSceneSubtitles(updatedScenes);
        toast.success("Sous-titres personnalisés appliqués");
    };

    // Transcribe uploaded audio using Whisper via backend function
    const handleTranscribeAudio = async () => {
        if (!audioFile) {
            toast.error("Veuillez sélectionner un fichier audio");
            return;
        }

        setIsTranscribing(true);
        try {
            // Read file as base64 (bypass UploadFile which doesn't support audio)
            const arrayBuffer = await audioFile.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const audioBase64 = btoa(binary);

            const response = await base44.functions.invoke('transcribeAudio', {
                audioBase64,
                mimeType: audioFile.type || 'audio/wav'
            });
            const result = response.data;

            if (result?.error) {
                if (result.retry) {
                    toast.info(result.error);
                    return;
                }
                throw new Error(result.error);
            }

            if (result?.segments?.length > 0) {
                const updatedScenes = scenes.map((scene, i) => ({
                    ...scene,
                    subtitleText: result.segments[i]?.text || scene.dialogue || ''
                }));
                onUpdateSceneSubtitles(updatedScenes);
                setCustomText(result.full_text || result.segments.map(s => s.text).join('\n'));
                toast.success(`Transcription terminée : ${result.segments.length} segments`);
            } else if (result?.full_text) {
                setCustomText(result.full_text);
                toast.success("Transcription terminée — ajustez et appliquez le texte");
            } else {
                throw new Error("Aucun résultat de transcription");
            }
        } catch (err) {
            console.error("Transcription failed:", err);
            toast.error("Échec de la transcription : " + err.message);
        } finally {
            setIsTranscribing(false);
        }
    };

    // Export subtitles as SRT
    const handleExportSRT = () => {
        let srt = '';
        let currentTime = 0;

        scenes.forEach((scene, i) => {
            const text = scene.subtitleText || scene.dialogue || '';
            if (!text.trim()) return;

            const startTime = currentTime;
            const endTime = currentTime + (scene.duration || 5);
            
            srt += `${i + 1}\n`;
            srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
            srt += `${text.trim()}\n\n`;
            
            currentTime = endTime;
        });

        const blob = new Blob([srt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `subtitles_${Date.now()}.srt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Fichier SRT téléchargé");
    };

    const formatSRTTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
    };

    // Copy all subtitles as text
    const handleCopyAll = () => {
        const allText = scenes.map((s, i) => `Scène ${i + 1}: ${s.subtitleText || s.dialogue || ''}`).join('\n');
        navigator.clipboard.writeText(allText);
        toast.success("Texte copié dans le presse-papiers");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Subtitles className="w-5 h-5 text-amber-500" />
                        Gestion des sous-titres
                    </DialogTitle>
                    <DialogDescription>
                        Gérez, personnalisez et exportez les sous-titres de votre vidéo.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="auto">Auto-générer</TabsTrigger>
                        <TabsTrigger value="custom">Texte personnalisé</TabsTrigger>
                        <TabsTrigger value="audio">Depuis audio</TabsTrigger>
                    </TabsList>

                    {/* Auto-generate from dialogue */}
                    <TabsContent value="auto" className="space-y-4 mt-4">
                        <p className="text-sm text-slate-600">
                            Génère automatiquement les sous-titres à partir du dialogue de chaque scène.
                        </p>
                        <Button onClick={handleAutoGenerate} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                            <Wand2 className="w-4 h-4 mr-2" />
                            Générer depuis le dialogue
                        </Button>

                        {/* Per-scene subtitle editor */}
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {scenes.map((scene, i) => (
                                <div key={i} className="flex gap-2 items-start p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-xs font-bold text-slate-500 mt-1 shrink-0 w-6">{i + 1}</span>
                                    <Textarea
                                        value={scene.subtitleText || scene.dialogue || ''}
                                        onChange={(e) => {
                                            const updated = [...scenes];
                                            updated[i] = { ...updated[i], subtitleText: e.target.value };
                                            onUpdateSceneSubtitles(updated);
                                        }}
                                        className="text-xs min-h-[40px] bg-white"
                                        placeholder="Sous-titre pour cette scène..."
                                    />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Custom text paste */}
                    <TabsContent value="custom" className="space-y-4 mt-4">
                        <p className="text-sm text-slate-600">
                            Collez votre texte ci-dessous. Chaque ligne sera assignée à une scène.
                        </p>
                        <Textarea
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder={"Ligne 1 → Scène 1\nLigne 2 → Scène 2\n..."}
                            className="min-h-[150px] text-sm"
                        />
                        <Button onClick={handleApplyCustomText} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Appliquer le texte aux scènes
                        </Button>
                    </TabsContent>

                    {/* Audio transcription */}
                    <TabsContent value="audio" className="space-y-4 mt-4">
                        <p className="text-sm text-slate-600">
                            Uploadez un fichier audio pour en extraire le texte via Whisper AI.
                            <br />
                            <span className="text-xs text-slate-400">Formats : MP3, WAV, FLAC, OGG, WebM</span>
                        </p>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setAudioFile(e.target.files[0])}
                                className="hidden"
                                id="subtitle-audio-upload"
                            />
                            <label htmlFor="subtitle-audio-upload" className="cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600">
                                    {audioFile ? audioFile.name : 'Cliquez pour sélectionner un fichier audio'}
                                </p>
                            </label>
                        </div>
                        <Button 
                            onClick={handleTranscribeAudio} 
                            disabled={!audioFile || isTranscribing}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                        >
                            {isTranscribing ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcription en cours...</>
                            ) : (
                                <><Wand2 className="w-4 h-4 mr-2" />Transcrire l'audio</>
                            )}
                        </Button>
                        {customText && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <Label className="text-xs text-slate-500 mb-1 block">Résultat de la transcription :</Label>
                                <Textarea
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                    className="text-xs min-h-[80px] bg-white"
                                />
                                <Button 
                                    onClick={handleApplyCustomText} 
                                    size="sm" 
                                    className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Appliquer aux scènes
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Style settings */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                    <Label className="text-sm font-semibold text-slate-700">Style des sous-titres</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Taille de police</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[subtitleSettings.fontSize || 32]}
                                    onValueChange={([v]) => onUpdateSettings({ ...subtitleSettings, fontSize: v })}
                                    min={16} max={64} step={2}
                                />
                                <span className="text-xs text-slate-500 w-8">{subtitleSettings.fontSize || 32}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Animation</Label>
                            <Select
                                value={subtitleSettings.animation || 'highlight'}
                                onValueChange={(v) => onUpdateSettings({ ...subtitleSettings, animation: v })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="highlight">Surlignage mot</SelectItem>
                                    <SelectItem value="pop">Pop (zoom)</SelectItem>
                                    <SelectItem value="slide">Glissement</SelectItem>
                                    <SelectItem value="none">Aucune</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Couleur texte</Label>
                            <input
                                type="color"
                                value={subtitleSettings.textColor || '#FFFFFF'}
                                onChange={(e) => onUpdateSettings({ ...subtitleSettings, textColor: e.target.value })}
                                className="h-8 w-full rounded cursor-pointer border border-slate-200"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Couleur mot actif</Label>
                            <input
                                type="color"
                                value={subtitleSettings.activeWordColor || '#FFFF00'}
                                onChange={(e) => onUpdateSettings({ ...subtitleSettings, activeWordColor: e.target.value })}
                                className="h-8 w-full rounded cursor-pointer border border-slate-200"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-wrap gap-2">
                    <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" onClick={handleCopyAll} className="flex-1">
                            <Copy className="w-3 h-3 mr-1" />
                            Copier texte
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportSRT} className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Export SRT
                        </Button>
                        <Button onClick={onClose} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                            <Save className="w-3 h-3 mr-1" />
                            Fermer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}