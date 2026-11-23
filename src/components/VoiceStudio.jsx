import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Upload, Save, Play, Settings2, Sparkles, User, RefreshCw, Volume2, Activity, Wind, Gauge, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { VOICES_BASE } from './voiceData';

export default function VoiceStudio({ isOpen, onClose, onApply, currentVoiceSettings, selectedVoice, ...props }) {
    const [mode, setMode] = useState('tune'); // 'tune', 'clone', 'presets'
    
    // Tuning State - sync when modal opens
    const [settings, setSettings] = useState(() => ({
        stability: 0.5,
        similarity: 0.75,
        style: 0.0,
        speed: 1.0,
        pitch: 1.0,
        gender: 'male',
        emotion: 0.5,
        vibrato: 0.0,
        breathiness: 0.0,
        voiceId: 'default',
        ...(currentVoiceSettings || {}),
        // Always use the actual selected voice from parent
        voiceId: selectedVoice || currentVoiceSettings?.voiceId || 'default',
    }));

    // Sync settings when modal opens with latest parent state
    useEffect(() => {
        if (isOpen) {
            const voiceId = selectedVoice || currentVoiceSettings?.voiceId || 'default';
            const voiceConfig = VOICES_BASE.find(v => v.id === voiceId);
            const inferredGender = voiceConfig ? voiceConfig.gender.toLowerCase() : null;
            setSettings(prev => ({
                ...prev,
                ...(currentVoiceSettings || {}),
                voiceId,
                gender: inferredGender || currentVoiceSettings?.gender || prev.gender || 'male',
            }));
        }
    }, [isOpen, selectedVoice]);

    // Cloning State
    const [cloneName, setCloneName] = useState('');
    const [cloneFile, setCloneFile] = useState(null);
    const [isCloning, setIsCloning] = useState(false);

    // Preset State
    const [presetName, setPresetName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch User Presets
    const { data: presets, refetch: refetchPresets } = useQuery({
        queryKey: ['voicePresets'],
        queryFn: () => base44.entities.VoicePreset.list(),
    });

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [realTimePreview, setRealTimePreview] = useState(true);
    const [previewText, setPreviewText] = useState("Bonjour, ceci est un aperçu de vos réglages de voix.");
    const [loadedPresetId, setLoadedPresetId] = useState(null);
    const previewTimerRef = useRef(null);

    // Preview Handler — always uses Browser TTS for free voices to respect gender
    const handlePreview = async () => {
        setIsPreviewing(true);
        try {
            const text = previewText || "Ceci est un aperçu de vos réglages de voix.";
            const voiceIdToUse = settings.voiceId && settings.voiceId !== 'default' ? settings.voiceId : (selectedVoice || null);
            const voiceConfig = VOICES_BASE.find(v => v.id === voiceIdToUse);
            const genderToUse = settings.gender || (voiceConfig ? voiceConfig.gender.toLowerCase() : 'male');
            const isFreeVoice = !voiceIdToUse || voiceIdToUse === 'default' || (voiceConfig && voiceConfig.type === 'Free');

            // Free voices: always use Browser TTS directly (supports gender selection)
            if (isFreeVoice && window.speechSynthesis) {
                const { speakText } = await import('./voice/BrowserTTSEngine');
                await speakText(text, {
                    gender: genderToUse,
                    langCode: (props.language || navigator.language || 'en'),
                    speed: settings.speed,
                    pitch: settings.pitch
                });
            } else if (props.onPreview) {
                // Cloned/premium voices: use parent's backend TTS
                await props.onPreview(settings);
            }
        } catch (e) {
            console.error(e);
            toast.error("Preview failed");
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleClone = async () => {
        if (!cloneFile || !cloneName) {
            toast.error("Please provide a name and a voice sample.");
            return;
        }

        setIsCloning(true);
        setPreviewAudioUrl(null);

        try {
            // 1. Upload File
            const uploadRes = await base44.integrations.Core.UploadFile({ file: cloneFile });
            if (!uploadRes || !uploadRes.file_url) throw new Error("Failed to upload voice sample.");

            // 2. Call Clone Function
            const response = await base44.functions.invoke('cloneVoice', {
                fileUrl: uploadRes.file_url,
                name: cloneName,
                description: `Cloned via VoiceStudio on ${new Date().toLocaleDateString()}`
            });

            if (response.data && response.data.success) {
                const voiceId = response.data.voice_id;
                
                toast.success("Voice cloned successfully!");
                
                const newSettings = {
                    ...settings,
                    voiceId: voiceId,
                    provider: 'elevenlabs',
                    clonedFromName: cloneName
                };
                
                setSettings(newSettings);
                
                // Auto-save to presets
                await base44.entities.VoicePreset.create({
                    name: cloneName,
                    voice_id: voiceId,
                    provider: 'elevenlabs',
                    settings: newSettings,
                    description: `Cloned from sample: ${cloneFile.name}`,
                    category: 'Cloned'
                });
                await refetchPresets();
                
                // Don't auto-switch, let user test first
                // setMode('tune'); 
            } else {
                throw new Error(response.data?.error || "Unknown cloning error");
            }

        } catch (e) {
            console.error(e);
            toast.error(`Cloning failed: ${e.message}`);
        } finally {
            setIsCloning(false);
        }
    };

    const handleTestClonedVoice = async () => {
        if (!settings.voiceId || settings.voiceId === 'default') {
            toast.error("No cloned voice selected to test.");
            return;
        }

        setIsPreviewing(true);
        try {
            const text = "Hello! This is a preview of your newly cloned voice. How does it sound?";
            const response = await base44.functions.invoke('textToSpeech', {
                text: text,
                voice_id: settings.voiceId,
                use_elevenlabs: true,
                speed: settings.speed,
                pitch: settings.pitch,
                gender: settings.gender,
                stability: settings.stability,
                similarity_boost: settings.similarity,
                style: settings.style
            });

            if (response.data && response.data.audioBase64) {
                const binaryString = window.atob(response.data.audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                setPreviewAudioUrl(url);
                const audio = new Audio(url);
                audio.play();
            } else {
                throw new Error("Failed to generate preview audio");
            }
        } catch (e) {
            console.error(e);
            toast.error("Preview failed: " + e.message);
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) {
            toast.error("Veuillez entrer un nom pour le préréglage.");
            return;
        }
        setIsSaving(true);
        try {
            await base44.entities.VoicePreset.create({
                name: presetName.trim(),
                voice_id: settings.voiceId && settings.voiceId !== 'default' ? settings.voiceId : `custom_${Date.now()}`,
                provider: settings.provider || 'other',
                settings: { ...settings },
                description: `Préréglage créé le ${new Date().toLocaleDateString('fr-FR')}`,
                category: 'Custom'
            });
            await refetchPresets();
            toast.success("Préréglage sauvegardé !");
            setPresetName('');
        } catch (e) {
            console.error("Save preset error:", e);
            toast.error("Échec de la sauvegarde : " + (e.message || "erreur inconnue"));
        } finally {
            setIsSaving(false);
        }
        };

        // Mettre à jour le préréglage chargé
        const handleUpdatePreset = async () => {
        if (!loadedPresetId) return;
        setIsSaving(true);
        try {
            await base44.entities.VoicePreset.update(loadedPresetId, {
                settings,
                voice_id: settings.voiceId,
                provider: settings.provider || 'other',
                description: `Mis à jour ${new Date().toLocaleDateString()}`
            });
            await refetchPresets();
            toast.success("Préréglage mis à jour !");
        } catch (e) {
            toast.error("Échec de la mise à jour du préréglage");
        } finally {
            setIsSaving(false);
        }
        };

        // Aperçu en temps réel (debounce)
        useEffect(() => {
        if (!isOpen) return;
        if (!realTimePreview) return;
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => {
            // éviter d'enchaîner si déjà en cours
            if (!isPreviewing) {
                handlePreview();
            }
        }, 600);
        return () => previewTimerRef.current && clearTimeout(previewTimerRef.current);
        }, [settings.gender, settings.speed, settings.pitch, settings.stability, settings.similarity, settings.style, settings.voiceId, realTimePreview, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-amber-500" />
                        Studio Voix IA
                    </DialogTitle>
                    <DialogDescription>
                        Personnalisez, ajustez et clonez des voix pour votre projet.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={setMode} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="tune">Réglages</TabsTrigger>
                        <TabsTrigger value="presets">Préréglages</TabsTrigger>
                        <TabsTrigger value="clone">Clonage</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tune" className="space-y-6">
                        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 pb-2 border-b border-slate-200">
                                <Settings2 className="w-4 h-4" />
                                Paramètres de la Voix
                            </div>

                            {/* Basic Controls: Speed & Pitch */}
                            {/* Voice Gender Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Genre de la voix</Label>
                                    <Select 
                                        value={settings.gender}
                                        onValueChange={(v) => {
                                            setSettings(prev => ({ ...prev, gender: v, pitch: v === 'male' ? Math.min(prev.pitch, 1.0) : Math.max(prev.pitch, 1.0) }));
                                        }}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Choisir" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="female">Féminine</SelectItem>
                                            <SelectItem value="male">Masculine</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs flex items-center gap-2">
                                        <Gauge className="w-3 h-3" /> Vitesse
                                    </Label>
                                    <Slider 
                                        value={[settings.speed]} 
                                        onValueChange={([v]) => handleSettingChange('speed', v)}
                                        min={0.5} max={2.0} step={0.1} 
                                    />
                                    <p className="text-[10px] text-slate-400 text-center">{settings.speed}x</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs flex items-center gap-2">
                                        <Volume2 className="w-3 h-3" /> Tonalité (Grave/Aigu)
                                    </Label>
                                    <Slider 
                                        value={[settings.pitch]} 
                                        onValueChange={([v]) => handleSettingChange('pitch', v)}
                                        min={0.5} max={1.5} step={0.05} 
                                    />
                                    <p className="text-[10px] text-slate-400 text-center">{Math.round(settings.pitch * 100)}%</p>
                                </div>
                            </div>

                            {/* ElevenLabs Controls */}
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <Label className="text-xs font-semibold text-slate-500 uppercase">Style & Intonation (IA Avancée)</Label>

                                {/* Stability */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-blue-500" />
                                            Stabilité (Expressivité)
                                        </Label>
                                        <span className="text-xs text-slate-500">{Math.round(settings.stability * 100)}%</span>
                                    </div>
                                    <Slider 
                                        value={[settings.stability]} 
                                        onValueChange={([v]) => handleSettingChange('stability', v)}
                                        min={0} max={1} step={0.05} 
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Plus Expressif</span>
                                        <span>Plus Stable/Calme</span>
                                    </div>
                                </div>

                                {/* Style Exaggeration */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-purple-500" />
                                            Exagération du Style
                                        </Label>
                                        <span className="text-xs text-slate-500">{Math.round(settings.style * 100)}%</span>
                                    </div>
                                    <Slider 
                                        value={[settings.style]} 
                                        onValueChange={([v]) => handleSettingChange('style', v)}
                                        min={0} max={1} step={0.05} 
                                    />
                                </div>

                                {/* Similarity */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs flex items-center gap-2">
                                            <User className="w-3 h-3 text-green-500" />
                                            Ressemblance (Clarté)
                                        </Label>
                                        <span className="text-xs text-slate-500">{Math.round(settings.similarity * 100)}%</span>
                                    </div>
                                    <Slider 
                                        value={[settings.similarity]} 
                                        onValueChange={([v]) => handleSettingChange('similarity', v)}
                                        min={0} max={1} step={0.05} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs">Aperçu en temps réel</Label>
                                <Switch checked={realTimePreview} onCheckedChange={setRealTimePreview} />
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <Input
                                    value={previewText}
                                    onChange={(e) => setPreviewText(e.target.value)}
                                    placeholder="Texte d’aperçu"
                                    className="h-8"
                                />
                                <Button 
                                    variant="secondary" 
                                    onClick={handlePreview} 
                                    disabled={isPreviewing}
                                    className="h-8"
                                >
                                    {isPreviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                    Aperçu
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input 
                                placeholder="Nom du préréglage" 
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleSavePreset} disabled={isSaving} variant="outline">
                                <Save className="w-4 h-4 mr-2" />
                                Sauvegarder
                            </Button>
                            <Button onClick={handleUpdatePreset} disabled={isSaving || !loadedPresetId} variant="ghost">
                                Mettre à jour
                            </Button>
                            </div>
                    </TabsContent>

                    <TabsContent value="clone" className="space-y-6">
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center text-center gap-4">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                                <User className="w-8 h-8 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-slate-700">Clonage de Voix Instantané</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                    Téléchargez un court échantillon audio (1-5 min) d'une voix claire pour créer une réplique numérique instantanément.
                                </p>
                            </div>
                            
                            <div className="w-full max-w-sm space-y-3">
                                <Input 
                                    placeholder="Nom de la voix (ex: CEO Jean)" 
                                    value={cloneName}
                                    onChange={(e) => setCloneName(e.target.value)}
                                />
                                <Input 
                                    type="file" 
                                    accept="audio/*"
                                    onChange={(e) => setCloneFile(e.target.files[0])}
                                />
                                <Button 
                                    onClick={handleClone} 
                                    disabled={isCloning || !cloneFile || !cloneName}
                                    className="w-full bg-amber-600 hover:bg-amber-700"
                                >
                                    {isCloning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Clonage en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Cloner la Voix Maintenant
                                        </>
                                    )}
                                </Button>

                                {settings.voiceId && settings.voiceId !== 'default' && settings.clonedFromName && (
                                    <div className="pt-4 border-t border-slate-200 w-full animate-in fade-in">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Cloné: {settings.clonedFromName}</span>
                                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Actif</Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleTestClonedVoice}
                                                disabled={isPreviewing}
                                                className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                                            >
                                                {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                                Tester l'Échantillon
                                            </Button>
                                        </div>
                                        {previewAudioUrl && (
                                            <audio controls src={previewAudioUrl} className="w-full mt-2 h-8" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Propulsé par ElevenLabs Instant Voice Cloning
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="presets" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-700">Mes Préréglages</div>
                            <Button size="sm" variant="outline" onClick={refetchPresets} className="h-8">Rafraîchir</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                            {presets?.map((preset) => (
                                <div 
                                    key={preset.id} 
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-amber-300 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                                            {preset.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-slate-700">{preset.name}</div>
                                            <div className="text-xs text-slate-500">{preset.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-7"
                                            onClick={() => {
                                                setSettings({ ...preset.settings, voiceId: preset.voice_id });
                                                setLoadedPresetId(preset.id);
                                                setMode('tune');
                                                toast.success(`Préréglage chargé: ${preset.name}`);
                                            }}
                                        >
                                            Appliquer
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const newName = prompt('Nouveau nom du préréglage', preset.name);
                                                if (newName && newName.trim()) {
                                                    await base44.entities.VoicePreset.update(preset.id, { name: newName.trim() });
                                                    await refetchPresets();
                                                    toast.success('Préréglage renommé');
                                                }
                                            }}
                                        >
                                            Renommer
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-7 text-red-600 hover:text-red-700"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Supprimer ce préréglage ?')) {
                                                    await base44.entities.VoicePreset.delete(preset.id);
                                                    await refetchPresets();
                                                    toast.success('Supprimé');
                                                }
                                            }}
                                        >
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {(!presets || presets.length === 0) && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Aucun préréglage personnalisé enregistré.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-between">
                    <Button 
                        variant="secondary" 
                        onClick={handlePreview} 
                        disabled={isPreviewing}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    >
                        {isPreviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Écouter l'Aperçu
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={() => { onApply(settings); onClose(); }} className="bg-green-600 hover:bg-green-700 text-white">
                            Appliquer les Réglages
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}