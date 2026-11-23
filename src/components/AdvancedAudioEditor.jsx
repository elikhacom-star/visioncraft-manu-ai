import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Volume2, Music, Plus, Trash2, ZoomIn, ZoomOut, Play, Pause, 
    Save, ChevronDown, ChevronUp, Lock, Unlock, Eye, EyeOff, 
    Volume, VolumeX, Scissors, GripVertical, Upload 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdvancedAudioEditor({
    isOpen,
    onClose,
    audioTracks = [],
    voiceoverTrack = null,
    scenes = [],
    totalDuration,
    onUpdateTrack,
    onRemoveTrack,
    onAddTrack,
    onSave
}) {
    const [localTracks, setLocalTracks] = useState(audioTracks);
    const [voiceoverSettings, setVoiceoverSettings] = useState({
        volume: voiceoverTrack?.volume || 1.0
    });
    const [zoom, setZoom] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
    const [expandedTrackIndex, setExpandedTrackIndex] = useState(null);
    const timelineRef = useRef(null);
    const playbackRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadingTrackIndex, setUploadingTrackIndex] = useState(null);

    useEffect(() => {
        setLocalTracks(audioTracks);
    }, [audioTracks]);

    const pixelsPerSecond = 60 * zoom;
    const timelineWidth = Math.max(800, totalDuration * pixelsPerSecond);

    // Playback control
    useEffect(() => {
        if (isPlaying) {
            playbackRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 0.1;
                    if (next >= totalDuration) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return next;
                });
            }, 100);
        } else {
            if (playbackRef.current) clearInterval(playbackRef.current);
        }
        return () => {
            if (playbackRef.current) clearInterval(playbackRef.current);
        };
    }, [isPlaying, totalDuration]);

    const handleTimelineClick = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = x / pixelsPerSecond;
        setCurrentTime(Math.max(0, Math.min(totalDuration, time)));
    };

    const handleUpdateLocalTrack = (index, updates) => {
        const newTracks = [...localTracks];
        newTracks[index] = { ...newTracks[index], ...updates };
        setLocalTracks(newTracks);
    };

    const handleFileUpload = (e, trackIndex) => {
        const file = e.target.files[0];
        if (!file) return;
        
        handleUpdateLocalTrack(trackIndex, { file, name: file.name });
        toast.success(`Fichier chargé: ${file.name}`);
        setUploadingTrackIndex(null);
    };

    const handleAddDuckingPoint = (trackIndex) => {
        const track = localTracks[trackIndex];
        const duckingPoints = track.duckingPoints || [];
        duckingPoints.push({
            time: currentTime,
            targetVolume: 0.15,
            fadeTime: 0.5
        });
        handleUpdateLocalTrack(trackIndex, { duckingPoints });
        toast.success("Point de ducking ajouté");
    };

    const handleRemoveDuckingPoint = (trackIndex, pointIndex) => {
        const track = localTracks[trackIndex];
        const duckingPoints = [...(track.duckingPoints || [])];
        duckingPoints.splice(pointIndex, 1);
        handleUpdateLocalTrack(trackIndex, { duckingPoints });
    };

    const handleSave = () => {
        localTracks.forEach((track, index) => {
            onUpdateTrack(index, track);
        });
        if (voiceoverTrack) {
            onUpdateTrack('voiceover', null, voiceoverSettings);
        }
        onSave?.();
        toast.success("Modifications audio sauvegardées");
        onClose();
    };

    const toggleTrackExpanded = (index) => {
        setExpandedTrackIndex(expandedTrackIndex === index ? null : index);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col p-0 md:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Éditeur Audio Avancé - Timeline Multi-Pistes
                    </DialogTitle>
                    <DialogDescription>
                        Gérez volume, fondus, ducking et pistes audio indépendamment
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Playback Controls */}
                    <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="h-10 w-10 bg-amber-500/20 hover:bg-amber-500/30 text-white"
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </Button>
                            <div className="font-mono text-sm bg-slate-800 px-3 py-1.5 rounded">
                                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                                className="text-slate-300 hover:text-white"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-slate-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                className="text-slate-300 hover:text-white"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Timeline Container */}
                    <ScrollArea className="flex-1 bg-slate-950 rounded-lg border border-slate-700">
                        <div 
                            ref={timelineRef}
                            className="relative min-h-[500px] cursor-crosshair"
                            style={{ width: timelineWidth }}
                            onClick={handleTimelineClick}
                        >
                            {/* Time Ruler */}
                            <div className="sticky top-0 z-50 h-10 bg-slate-900 border-b border-slate-700 flex items-end">
                                <div className="relative h-full w-full">
                                    {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                                        <div 
                                            key={i}
                                            className="absolute flex flex-col items-start"
                                            style={{ left: i * pixelsPerSecond }}
                                        >
                                            <div className={`w-px ${i % 5 === 0 ? 'bg-slate-500 h-8' : 'bg-slate-600 h-4'}`} />
                                            {i % 5 === 0 && (
                                                <span className="text-[10px] text-slate-400 font-mono ml-1 mt-0.5">{i}s</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Scene Reference Track */}
                            <div className="relative h-12 bg-slate-900/30 border-b border-slate-800">
                                <div className="absolute left-2 top-2 z-20">
                                    <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30">
                                        📹 Scènes Vidéo
                                    </Badge>
                                </div>
                                <div className="absolute inset-0 flex pt-8">
                                    {scenes.map((scene, idx) => {
                                        let left = 0;
                                        for (let i = 0; i < idx; i++) {
                                            left += (scenes[i].duration || 5) * pixelsPerSecond;
                                        }
                                        const width = (scene.duration || 5) * pixelsPerSecond;
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className="h-full border-r border-slate-700 bg-blue-900/10 flex items-center px-2"
                                                style={{ width }}
                                            >
                                                <span className="text-[9px] text-blue-300 truncate">S{idx + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Voiceover Track */}
                            {voiceoverTrack && (
                                <div className="relative h-16 bg-slate-900/30 border-b border-slate-800">
                                    <div className="absolute left-2 top-2 z-20 flex items-center gap-2">
                                        <Badge className="text-[10px] bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                            🎤 Voix Off
                                        </Badge>
                                        <Slider
                                            value={[voiceoverSettings.volume]}
                                            onValueChange={([v]) => setVoiceoverSettings({ volume: v })}
                                            min={0}
                                            max={2}
                                            step={0.05}
                                            className="w-24 [&_[role=slider]]:bg-cyan-500"
                                        />
                                        <span className="text-[10px] text-cyan-300">{Math.round(voiceoverSettings.volume * 100)}%</span>
                                    </div>
                                    <div className="absolute inset-0 flex pt-8">
                                        {scenes.map((scene, idx) => {
                                            if (!scene.dialogue) return null;
                                            let left = 0;
                                            for (let i = 0; i < idx; i++) {
                                                left += (scenes[i].duration || 5) * pixelsPerSecond;
                                            }
                                            const width = (scene.duration || 5) * pixelsPerSecond;
                                            
                                            return (
                                                <div
                                                    key={idx}
                                                    className="h-full bg-gradient-to-r from-cyan-600/40 to-blue-600/40 border-r border-cyan-400/20 flex items-center px-2"
                                                    style={{ width }}
                                                >
                                                    <span className="text-[10px] text-white truncate">{scene.dialogue.substring(0, 40)}...</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Audio Tracks */}
                            <div className="relative pb-4">
                                {localTracks.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                                        Aucune piste audio. Cliquez "Ajouter Piste" ci-dessous.
                                    </div>
                                ) : (
                                    localTracks.map((track, trackIndex) => {
                                        const isExpanded = expandedTrackIndex === trackIndex;
                                        const startPx = (track.startOffset || 0) * pixelsPerSecond;
                                        const durationPx = (track.duration || totalDuration) * pixelsPerSecond;
                                        
                                        return (
                                            <div key={trackIndex} className="border-b border-slate-800">
                                                {/* Track Header */}
                                                <div 
                                                    className={`h-12 bg-slate-900/50 flex items-center px-3 gap-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedTrackIndex === trackIndex ? 'bg-slate-800/70' : ''}`}
                                                    onClick={() => {
                                                        setSelectedTrackIndex(trackIndex);
                                                        toggleTrackExpanded(trackIndex);
                                                    }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="min-w-[44px] min-h-[44px] md:h-6 md:w-6 p-0 text-slate-400 hover:text-white flex items-center justify-center"
                                                        onClick={(e) => {
                                                           e.stopPropagation();
                                                           toggleTrackExpanded(trackIndex);
                                                        }}
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </Button>
                                                    
                                                    <GripVertical className="w-4 h-4 text-slate-600" />
                                                    
                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                        <Badge className={`text-[10px] shrink-0 ${track.type === 'music' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                            {track.type === 'music' ? '🎵' : '🔊'} {track.type}
                                                        </Badge>
                                                        <span className="text-sm text-slate-300 truncate">{track.name}</span>
                                                        {!track.file && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setUploadingTrackIndex(trackIndex);
                                                                    fileInputRef.current?.click();
                                                                }}
                                                                className="h-6 text-[10px] text-amber-400 hover:text-amber-300"
                                                            >
                                                                <Upload className="w-3 h-3 mr-1" />
                                                                Upload
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="min-w-[44px] min-h-[44px] md:h-6 md:w-6 md:min-w-0 md:min-h-0 p-0 text-slate-400 hover:text-white flex items-center justify-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateLocalTrack(trackIndex, { muted: !track.muted });
                                                            }}
                                                        >
                                                            {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="min-w-[44px] min-h-[44px] md:h-6 md:w-6 md:min-w-0 md:min-h-0 p-0 text-slate-400 hover:text-white flex items-center justify-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateLocalTrack(trackIndex, { locked: !track.locked });
                                                            }}
                                                        >
                                                            {track.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="min-w-[44px] min-h-[44px] md:h-6 md:w-6 md:min-w-0 md:min-h-0 p-0 text-red-400 hover:text-red-300 flex items-center justify-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newTracks = localTracks.filter((_, i) => i !== trackIndex);
                                                                setLocalTracks(newTracks);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Track Visual */}
                                                <div className="relative h-20 bg-slate-950">
                                                    <div 
                                                        className={`absolute top-2 bottom-2 rounded-md ${track.type === 'music' ? 'bg-gradient-to-r from-amber-600/60 to-orange-600/60' : 'bg-gradient-to-r from-purple-600/60 to-pink-600/60'} border-2 ${selectedTrackIndex === trackIndex ? 'border-white/50' : 'border-white/20'} shadow-lg`}
                                                        style={{ 
                                                            left: startPx,
                                                            width: durationPx,
                                                            opacity: track.muted ? 0.3 : 1
                                                        }}
                                                    >
                                                        {/* Volume Envelope Visualization */}
                                                        <div className="absolute inset-0 flex items-center px-2">
                                                            <div className="w-full h-8 bg-black/20 rounded relative overflow-hidden">
                                                                {/* Volume Level */}
                                                                <div 
                                                                    className="absolute inset-0 bg-gradient-to-r from-green-500/50 to-green-400/50"
                                                                    style={{ height: `${(track.volume || 1) * 100}%`, bottom: 0 }}
                                                                />
                                                                
                                                                {/* Fade In */}
                                                                {track.fadeIn > 0 && (
                                                                    <div 
                                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent to-yellow-400/30"
                                                                        style={{ width: `${Math.min(100, (track.fadeIn / (track.duration || totalDuration)) * 100)}%` }}
                                                                    />
                                                                )}
                                                                
                                                                {/* Fade Out */}
                                                                {track.fadeOut > 0 && (
                                                                    <div 
                                                                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-transparent to-yellow-400/30"
                                                                        style={{ width: `${Math.min(100, (track.fadeOut / (track.duration || totalDuration)) * 100)}%` }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Ducking Points */}
                                                        {track.duckingPoints?.map((point, pIdx) => {
                                                            const pointX = ((point.time - (track.startOffset || 0)) / (track.duration || totalDuration)) * 100;
                                                            if (pointX < 0 || pointX > 100) return null;
                                                            
                                                            return (
                                                                <div
                                                                    key={pIdx}
                                                                    className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-pointer group"
                                                                    style={{ left: `${pointX}%` }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveDuckingPoint(trackIndex, pIdx);
                                                                    }}
                                                                >
                                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white text-[9px] px-2 py-0.5 rounded whitespace-nowrap">
                                                                        Duck @ {point.time.toFixed(1)}s - Click to remove
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <span className="text-xs text-white font-medium drop-shadow-lg">
                                                                {track.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Controls */}
                                                {isExpanded && (
                                                    <div className="bg-slate-900/80 p-4 space-y-4 border-t border-slate-700">
                                                        {/* Track Info */}
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                                                            <div className="text-xs text-slate-400">
                                                                {track.file ? (
                                                                    <span className="text-green-400">✓ Fichier chargé: {track.file.name}</span>
                                                                ) : (
                                                                    <span className="text-amber-400">⚠ Aucun fichier audio</span>
                                                                )}
                                                            </div>
                                                            {track.file && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setUploadingTrackIndex(trackIndex);
                                                                        fileInputRef.current?.click();
                                                                    }}
                                                                    className="h-6 text-[10px] text-cyan-400 hover:text-cyan-300"
                                                                >
                                                                    <Upload className="w-3 h-3 mr-1" />
                                                                    Remplacer
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-4">
                                                            {/* Volume */}
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>Volume</span>
                                                                    <span>{Math.round((track.volume || 1) * 100)}%</span>
                                                                </div>
                                                                <Slider
                                                                    value={[track.volume || 1]}
                                                                    onValueChange={([v]) => handleUpdateLocalTrack(trackIndex, { volume: v })}
                                                                    min={0}
                                                                    max={2}
                                                                    step={0.05}
                                                                    className="[&_[role=slider]]:bg-green-500"
                                                                />
                                                            </div>

                                                            {/* Fade In */}
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>Fade In</span>
                                                                    <span>{(track.fadeIn || 0).toFixed(1)}s</span>
                                                                </div>
                                                                <Slider
                                                                    value={[track.fadeIn || 0]}
                                                                    onValueChange={([v]) => handleUpdateLocalTrack(trackIndex, { fadeIn: v })}
                                                                    min={0}
                                                                    max={5}
                                                                    step={0.1}
                                                                    className="[&_[role=slider]]:bg-yellow-500"
                                                                />
                                                            </div>

                                                            {/* Fade Out */}
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>Fade Out</span>
                                                                    <span>{(track.fadeOut || 0).toFixed(1)}s</span>
                                                                </div>
                                                                <Slider
                                                                    value={[track.fadeOut || 0]}
                                                                    onValueChange={([v]) => handleUpdateLocalTrack(trackIndex, { fadeOut: v })}
                                                                    min={0}
                                                                    max={5}
                                                                    step={0.1}
                                                                    className="[&_[role=slider]]:bg-yellow-500"
                                                                />
                                                            </div>

                                                            {/* Start Offset */}
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>Décalage Début</span>
                                                                    <span>{(track.startOffset || 0).toFixed(1)}s</span>
                                                                </div>
                                                                <Slider
                                                                    value={[track.startOffset || 0]}
                                                                    onValueChange={([v]) => handleUpdateLocalTrack(trackIndex, { startOffset: v })}
                                                                    min={0}
                                                                    max={totalDuration}
                                                                    step={0.1}
                                                                    className="[&_[role=slider]]:bg-cyan-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Duration & Trim */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-400">Durée (s)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={track.duration || totalDuration}
                                                                    onChange={(e) => handleUpdateLocalTrack(trackIndex, { duration: parseFloat(e.target.value) })}
                                                                    min={0.5}
                                                                    step={0.1}
                                                                    className="h-8 text-xs bg-slate-800 border-slate-600 text-white"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-400">Trim Début (s)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={track.trimStart || 0}
                                                                    onChange={(e) => handleUpdateLocalTrack(trackIndex, { trimStart: parseFloat(e.target.value) })}
                                                                    min={0}
                                                                    step={0.1}
                                                                    className="h-8 text-xs bg-slate-800 border-slate-600 text-white"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-400">Trim Fin (s)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={track.trimEnd || 0}
                                                                    onChange={(e) => handleUpdateLocalTrack(trackIndex, { trimEnd: parseFloat(e.target.value) })}
                                                                    min={0}
                                                                    step={0.1}
                                                                    className="h-8 text-xs bg-slate-800 border-slate-600 text-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* File Upload for Empty Tracks */}
                                                        {!track.file && (
                                                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                                                                <p className="text-xs text-amber-300 mb-2">⚠️ Aucun fichier audio chargé</p>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setUploadingTrackIndex(trackIndex);
                                                                        fileInputRef.current?.click();
                                                                    }}
                                                                    className="w-full h-7 bg-amber-600 hover:bg-amber-700 text-white"
                                                                >
                                                                    <Upload className="w-3 h-3 mr-1" />
                                                                    Charger un fichier audio
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {/* Ducking Controls */}
                                                        {track.type === 'music' && track.file && (
                                                            <div className="space-y-3 pt-3 border-t border-slate-700">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            id={`auto-duck-${trackIndex}`}
                                                                            checked={track.ducking || false}
                                                                            onChange={(e) => handleUpdateLocalTrack(trackIndex, { ducking: e.target.checked })}
                                                                            className="h-3 w-3 rounded border-slate-500 text-amber-600"
                                                                        />
                                                                        <Label htmlFor={`auto-duck-${trackIndex}`} className="text-[10px] text-slate-300 cursor-pointer">
                                                                            Auto-ducking (lors des dialogues)
                                                                        </Label>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleAddDuckingPoint(trackIndex)}
                                                                        className="h-6 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-900/30"
                                                                    >
                                                                        <Plus className="w-3 h-3 mr-1" />
                                                                        Ajouter Point Ducking @ {currentTime.toFixed(1)}s
                                                                    </Button>
                                                                </div>

                                                                {/* Ducking Points List */}
                                                                {track.duckingPoints && track.duckingPoints.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] text-slate-400">Points de Ducking Personnalisés</Label>
                                                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                                                            {track.duckingPoints.map((point, pIdx) => (
                                                                                <div key={pIdx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded text-[10px]">
                                                                                    <span className="text-slate-300 flex-1">@ {point.time.toFixed(1)}s → {Math.round(point.targetVolume * 100)}%</span>
                                                                                    <Slider
                                                                                        value={[point.targetVolume]}
                                                                                        onValueChange={([v]) => {
                                                                                            const newPoints = [...(track.duckingPoints || [])];
                                                                                            newPoints[pIdx] = { ...point, targetVolume: v };
                                                                                            handleUpdateLocalTrack(trackIndex, { duckingPoints: newPoints });
                                                                                        }}
                                                                                        min={0}
                                                                                        max={1}
                                                                                        step={0.05}
                                                                                        className="w-24 [&_[role=slider]]:bg-amber-500"
                                                                                    />
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        className="h-5 w-5 p-0 text-red-400"
                                                                                        onClick={() => handleRemoveDuckingPoint(trackIndex, pIdx)}
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Playhead */}
                            <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-xl z-40 pointer-events-none"
                                style={{ left: currentTime * pixelsPerSecond }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1 rounded font-mono whitespace-nowrap">
                                    {currentTime.toFixed(1)}s
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Add Track Buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                const newTrack = {
                                    name: `Musique ${localTracks.filter(t => t.type === 'music').length + 1}`,
                                    type: 'music',
                                    volume: 0.3,
                                    ducking: true,
                                    fadeIn: 1.0,
                                    fadeOut: 1.0,
                                    startOffset: 0,
                                    duration: totalDuration,
                                    file: null,
                                    duckingPoints: []
                                };
                                const newIndex = localTracks.length;
                                setLocalTracks([...localTracks, newTrack]);
                                setUploadingTrackIndex(newIndex);
                                setTimeout(() => fileInputRef.current?.click(), 100);
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Music className="w-4 h-4 mr-2" />
                            Ajouter Musique
                        </Button>
                        <Button
                            onClick={() => {
                                const newTrack = {
                                    name: `SFX ${localTracks.filter(t => t.type === 'sfx').length + 1}`,
                                    type: 'sfx',
                                    volume: 0.8,
                                    ducking: false,
                                    fadeIn: 0.1,
                                    fadeOut: 0.2,
                                    startOffset: currentTime,
                                    duration: 2.0,
                                    file: null,
                                    duckingPoints: []
                                };
                                const newIndex = localTracks.length;
                                setLocalTracks([...localTracks, newTrack]);
                                setUploadingTrackIndex(newIndex);
                                setTimeout(() => fileInputRef.current?.click(), 100);
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Volume2 className="w-4 h-4 mr-2" />
                            Ajouter SFX
                        </Button>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => uploadingTrackIndex !== null && handleFileUpload(e, uploadingTrackIndex)}
                    />
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder les Modifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}