import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Trash2, Music, Scissors, Sliders, Play, Pause, SkipBack, Volume2 } from "lucide-react";
import InteractiveWaveformEditor from "./InteractiveWaveformEditor";
import AudioEffectsPanel from "./AudioEffectsPanel";

export default function EnhancedAudioTrackEditor({ 
    isOpen, 
    onClose, 
    track, 
    trackIndex, 
    totalDuration = 30,
    onSave, 
    onDelete 
}) {
    const [currentTrack, setCurrentTrack] = useState(track || {});
    const [activeTab, setActiveTab] = useState("waveform");
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef(null);

    useEffect(() => {
        setCurrentTrack(track || {});
    }, [track]);

    const handleUpdate = useCallback((updates) => {
        setCurrentTrack(prev => ({ ...prev, ...updates }));
    }, []);

    const handleSave = () => {
        onSave?.(trackIndex, currentTrack);
        onClose();
    };

    const handlePlayPause = () => {
        if (!audioRef.current) {
            const audioUrl = currentTrack.url || (currentTrack.file && URL.createObjectURL(currentTrack.file));
            if (!audioUrl) return;
            
            audioRef.current = new Audio(audioUrl);
            audioRef.current.volume = currentTrack.volume ?? 1;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.currentTime = currentTrack.trimStart || 0;
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    if (!track) return null;

    const audioDuration = currentTrack.originalDuration || currentTrack.duration || 10;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Éditeur Audio Avancé
                        <Badge variant="outline" className="ml-2">
                            {currentTrack.type === 'sfx' ? 'SFX' : 'Musique'}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Éditez, découpez et ajoutez des effets à votre piste audio
                    </DialogDescription>
                </DialogHeader>

                {/* Playback Controls */}
                <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
                    <Button size="sm" variant="outline" onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = currentTrack.trimStart || 0;
                    }}>
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={handlePlayPause}
                        className={isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1 text-sm font-medium text-slate-700 truncate">
                        {currentTrack.name || 'Piste Audio'}
                    </div>
                    <Badge className="bg-slate-200 text-slate-700">
                        {audioDuration.toFixed(1)}s
                    </Badge>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="waveform" className="gap-2">
                            <Scissors className="w-4 h-4" />
                            Découpage & Waveform
                        </TabsTrigger>
                        <TabsTrigger value="effects" className="gap-2">
                            <Sliders className="w-4 h-4" />
                            Effets Audio
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="waveform" className="mt-4">
                        <InteractiveWaveformEditor
                            audioFile={currentTrack.file}
                            audioUrl={currentTrack.url}
                            duration={audioDuration}
                            trimStart={currentTrack.trimStart || 0}
                            trimEnd={currentTrack.trimEnd}
                            fadeIn={currentTrack.fadeIn || 0}
                            fadeOut={currentTrack.fadeOut || 0}
                            volume={currentTrack.volume ?? 1}
                            onUpdate={handleUpdate}
                            height={140}
                        />

                        {/* Keyboard Shortcuts Reference */}
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs font-medium text-slate-700 mb-2">Raccourcis Clavier:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600">
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">Espace</kbd> Play/Pause</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">←/→</kbd> Déplacer curseur</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">I</kbd> Point In (trim)</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">O</kbd> Point Out (trim)</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">[</kbd> Ajouter Fade In</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">]</kbd> Ajouter Fade Out</div>
                                <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">Shift+←/→</kbd> Déplacer 1s</div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="effects" className="mt-4">
                        <AudioEffectsPanel 
                            track={currentTrack}
                            onUpdate={handleUpdate}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex justify-between sm:justify-between items-center border-t pt-4">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { onDelete?.(trackIndex); onClose(); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}