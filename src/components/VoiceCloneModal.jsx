import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Mic, MicOff, Play, Pause, Trash2, CheckCircle, AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function VoiceCloneModal({ isOpen, onClose, onVoiceCloned, existingClonedVoices = [] }) {
    const [activeTab, setActiveTab] = useState('upload');
    const [voiceName, setVoiceName] = useState('');
    const [audioSamples, setAudioSamples] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingIndex, setPlayingIndex] = useState(null);
    
    const [voiceSettings, setVoiceSettings] = useState({
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0
    });

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioSamples(prev => [...prev, {
                    id: Date.now(),
                    name: `Enregistrement ${prev.length + 1}`,
                    url: audioUrl,
                    blob: audioBlob,
                    duration: recordingTime
                }]);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            toast.error("Impossible d'accéder au microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                setAudioSamples(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    url: url,
                    blob: file,
                    duration: 0
                }]);
            }
        });
    };

    const removeSample = (id) => {
        setAudioSamples(prev => prev.filter(s => s.id !== id));
    };

    const playSample = (index) => {
        if (playingIndex === index) {
            audioRef.current?.pause();
            setPlayingIndex(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = audioSamples[index].url;
                audioRef.current.play();
                setPlayingIndex(index);
            }
        }
    };

    const handleCloneVoice = async () => {
        if (!voiceName.trim()) {
            toast.error("Veuillez donner un nom à votre voix");
            return;
        }
        if (audioSamples.length === 0) {
            toast.error("Veuillez ajouter au moins un échantillon audio");
            return;
        }

        setIsProcessing(true);

        try {
            // Upload audio samples
            const uploadedUrls = [];
            for (const sample of audioSamples) {
                const { file_url } = await base44.integrations.Core.UploadFile({ file: sample.blob });
                uploadedUrls.push(file_url);
            }

            // For now, create a simulated cloned voice entry
            // In production, this would call ElevenLabs API via a backend function
            const clonedVoice = {
                id: `voice_${Date.now()}`,
                name: voiceName,
                samples: uploadedUrls,
                settings: voiceSettings,
                created_at: new Date().toISOString()
            };

            onVoiceCloned(clonedVoice);
            toast.success(`Voix "${voiceName}" créée avec succès!`);
            
            // Reset form
            setVoiceName('');
            setAudioSamples([]);
            onClose();

        } catch (error) {
            console.error('Voice clone error:', error);
            toast.error("Erreur lors du clonage de la voix");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-600" />
                        Cloner une Voix
                    </DialogTitle>
                    <DialogDescription>
                        Créez une voix personnalisée à partir d'échantillons audio
                    </DialogDescription>
                </DialogHeader>

                <audio ref={audioRef} onEnded={() => setPlayingIndex(null)} className="hidden" />

                <div className="space-y-4">
                    {/* Voice Name */}
                    <div>
                        <Label>Nom de la voix</Label>
                        <Input
                            value={voiceName}
                            onChange={(e) => setVoiceName(e.target.value)}
                            placeholder="Ex: Ma voix narrative"
                            className="mt-1"
                        />
                    </div>

                    {/* Audio Input Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="upload">
                                <Upload className="w-4 h-4 mr-2" />
                                Télécharger
                            </TabsTrigger>
                            <TabsTrigger value="record">
                                <Mic className="w-4 h-4 mr-2" />
                                Enregistrer
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="mt-3">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                            >
                                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">Cliquez pour télécharger des fichiers audio</p>
                                <p className="text-xs text-slate-400 mt-1">MP3, WAV, M4A (min. 30 secondes recommandé)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </TabsContent>

                        <TabsContent value="record" className="mt-3">
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                {isRecording ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                                        </div>
                                        <Button onClick={stopRecording} variant="destructive">
                                            <MicOff className="w-4 h-4 mr-2" />
                                            Arrêter
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={startRecording} className="bg-purple-600 hover:bg-purple-700">
                                        <Mic className="w-4 h-4 mr-2" />
                                        Commencer l'enregistrement
                                    </Button>
                                )}
                                <p className="text-xs text-slate-500 mt-3">Parlez clairement pendant 30 secondes minimum</p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Audio Samples List */}
                    {audioSamples.length > 0 && (
                        <div className="space-y-2">
                            <Label>Échantillons ({audioSamples.length})</Label>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {audioSamples.map((sample, idx) => (
                                    <div key={sample.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => playSample(idx)}
                                        >
                                            {playingIndex === idx ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                        </Button>
                                        <span className="flex-1 text-sm truncate">{sample.name}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-red-500 hover:text-red-700"
                                            onClick={() => removeSample(sample.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voice Settings */}
                    <div className="space-y-3 pt-2 border-t">
                        <Label className="text-xs text-slate-500">Paramètres de la voix</Label>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Stabilité</span>
                                <span>{Math.round(voiceSettings.stability * 100)}%</span>
                            </div>
                            <Slider
                                value={[voiceSettings.stability]}
                                onValueChange={([v]) => setVoiceSettings(prev => ({ ...prev, stability: v }))}
                                min={0}
                                max={1}
                                step={0.05}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Similarité</span>
                                <span>{Math.round(voiceSettings.similarity_boost * 100)}%</span>
                            </div>
                            <Slider
                                value={[voiceSettings.similarity_boost]}
                                onValueChange={([v]) => setVoiceSettings(prev => ({ ...prev, similarity_boost: v }))}
                                min={0}
                                max={1}
                                step={0.05}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCloneVoice}
                            disabled={isProcessing || !voiceName.trim() || audioSamples.length === 0}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Créer la voix
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}