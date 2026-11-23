import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Trash2, Save, Volume2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function MicrophoneRecorder({ isOpen, onClose, onSave, suggestedText }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackName, setTrackName] = useState("Voix Off Enregistrée");
    const [volume, setVolume] = useState([1.0]);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const animationRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
            if (recordedUrl) URL.revokeObjectURL(recordedUrl);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Reset when dialog opens
    useEffect(() => {
        if (isOpen) {
            setRecordedBlob(null);
            setRecordedUrl(null);
            setDuration(0);
            setIsRecording(false);
            setIsPaused(false);
            chunksRef.current = [];
        }
    }, [isOpen]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true 
                } 
            });
            streamRef.current = stream;

            // Setup audio analyser for level meter
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            // Start level monitoring
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            const updateLevel = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(avg / 255);
                animationRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            // Setup MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : 'audio/webm';
            
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
            };

            mediaRecorderRef.current.start(100); // Collect data every 100ms
            setIsRecording(true);
            setIsPaused(false);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(d => d + 0.1);
            }, 100);

            toast.success("Enregistrement démarré");
        } catch (err) {
            console.error("Microphone access error:", err);
            toast.error("Impossible d'accéder au microphone. Vérifiez les permissions.");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setDuration(d => d + 0.1);
            }, 100);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
        setIsPaused(false);
        setAudioLevel(0);
    };

    const resetRecording = () => {
        stopRecording();
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setDuration(0);
        chunksRef.current = [];
    };

    const togglePlayback = () => {
        if (!audioRef.current || !recordedUrl) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSave = () => {
        if (!recordedBlob) {
            toast.error("Aucun enregistrement à sauvegarder");
            return;
        }

        const file = new File([recordedBlob], `${trackName.replace(/\s+/g, '_')}_${Date.now()}.webm`, { 
            type: recordedBlob.type 
        });

        onSave({
            file,
            name: trackName,
            type: 'voiceover_recorded',
            volume: volume[0],
            duration: duration
        });

        toast.success("Enregistrement sauvegardé !");
        onClose();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopRecording(); onClose(); } }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-red-500" />
                        Enregistrer une Voix Off
                    </DialogTitle>
                    <DialogDescription>
                        Utilisez votre microphone pour enregistrer directement votre voix off.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Suggested Text Display */}
                    {suggestedText && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <Label className="text-xs text-slate-500 mb-1 block">Texte suggéré à lire :</Label>
                            <p className="text-sm text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                                {suggestedText}
                            </p>
                        </div>
                    )}

                    {/* Recording Status & Level Meter */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Level Meter */}
                        <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-75 ${
                                    audioLevel > 0.7 ? 'bg-red-500' : 
                                    audioLevel > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${audioLevel * 100}%` }}
                            />
                        </div>

                        {/* Timer */}
                        <div className="text-4xl font-mono font-bold text-slate-800">
                            {formatTime(duration)}
                        </div>

                        {/* Status Badge */}
                        {isRecording && (
                            <Badge className={`${isPaused ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                                {isPaused ? '⏸ En pause' : '🔴 Enregistrement en cours'}
                            </Badge>
                        )}
                    </div>

                    {/* Recording Controls */}
                    <div className="flex justify-center gap-3">
                        {!isRecording && !recordedBlob && (
                            <Button 
                                onClick={startRecording}
                                className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-full"
                            >
                                <Mic className="w-6 h-6 mr-2" />
                                Démarrer
                            </Button>
                        )}

                        {isRecording && (
                            <>
                                {isPaused ? (
                                    <Button 
                                        onClick={resumeRecording}
                                        variant="outline"
                                        className="px-6 py-6 rounded-full border-green-500 text-green-600 hover:bg-green-50"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Reprendre
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={pauseRecording}
                                        variant="outline"
                                        className="px-6 py-6 rounded-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                    >
                                        <Pause className="w-5 h-5 mr-2" />
                                        Pause
                                    </Button>
                                )}
                                <Button 
                                    onClick={stopRecording}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-6 rounded-full"
                                >
                                    <Square className="w-5 h-5 mr-2" />
                                    Terminer
                                </Button>
                            </>
                        )}

                        {recordedBlob && !isRecording && (
                            <>
                                <Button 
                                    onClick={togglePlayback}
                                    variant="outline"
                                    className="px-6 py-6 rounded-full"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                    {isPlaying ? 'Pause' : 'Écouter'}
                                </Button>
                                <Button 
                                    onClick={resetRecording}
                                    variant="outline"
                                    className="px-6 py-6 rounded-full border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Recommencer
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Hidden Audio Element for Playback */}
                    {recordedUrl && (
                        <audio 
                            ref={audioRef} 
                            src={recordedUrl} 
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    )}

                    {/* Save Options (only show after recording) */}
                    {recordedBlob && !isRecording && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div className="space-y-2">
                                <Label className="text-sm">Nom de la piste</Label>
                                <Input 
                                    value={trackName}
                                    onChange={(e) => setTrackName(e.target.value)}
                                    placeholder="Voix Off Enregistrée"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm flex items-center gap-1">
                                        <Volume2 className="w-3 h-3" /> Volume
                                    </Label>
                                    <span className="text-xs text-slate-500">{Math.round(volume[0] * 100)}%</span>
                                </div>
                                <Slider 
                                    value={volume}
                                    onValueChange={setVolume}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => { stopRecording(); onClose(); }}>
                        Annuler
                    </Button>
                    {recordedBlob && !isRecording && (
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Ajouter à la Timeline
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}