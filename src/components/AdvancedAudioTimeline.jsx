import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Plus, Music, Volume2, ZoomIn, ZoomOut, Scissors, Split, Play, Pause } from "lucide-react";
import AudioTimelineTrack from "./AudioTimelineTrack";

export default function AdvancedAudioTimeline({ 
    audioTracks = [],
    voiceoverTrack = null,
    scenes = [],
    totalDuration,
    currentTime = 0,
    onUpdateTrack,
    onRemoveTrack,
    onAddTrack,
    onEditTrack,
    onSeek,
    isPlaying = false,
    onTogglePlay
}) {
    const [zoom, setZoom] = useState(1);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
    const timelineRef = useRef(null);
    
    const pixelsPerSecond = 40 * zoom;
    const timelineWidth = totalDuration * pixelsPerSecond;
    
    const handleTimelineClick = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const clickedTime = (x / pixelsPerSecond);
        onSeek(Math.max(0, Math.min(totalDuration, clickedTime)));
    };
    
    return (
        <Card className="bg-slate-900 border-slate-700 p-4 space-y-3">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onTogglePlay}
                        className="h-8 w-8 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded">
                        {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        className="h-7 px-2 text-slate-400 hover:text-white"
                    >
                        <ZoomOut className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        className="h-7 px-2 text-slate-400 hover:text-white"
                    >
                        <ZoomIn className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddTrack}
                        className="h-7 text-xs border-green-600 text-green-400 hover:bg-green-900/30"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Track
                    </Button>
                </div>
            </div>
            
            {/* Timeline Container */}
            <div 
                ref={timelineRef}
                className="relative bg-slate-950 rounded-lg border border-slate-700 overflow-x-auto overflow-y-hidden"
                style={{ height: 'auto', maxHeight: '400px' }}
                onClick={handleTimelineClick}
            >
                {/* Time Ruler */}
                <div className="sticky top-0 z-40 h-8 bg-slate-900 border-b border-slate-700">
                    <div className="relative h-full" style={{ width: timelineWidth }}>
                        {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                            <div 
                                key={i}
                                className="absolute text-[9px] text-slate-400"
                                style={{ left: i * pixelsPerSecond }}
                            >
                                <div className={`w-px bg-slate-600 ${i % 5 === 0 ? 'h-6' : 'h-3'}`} />
                                {i % 5 === 0 && <span className="ml-1 font-mono">{i}s</span>}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Scene Reference Track */}
                <div className="relative h-10 border-b border-slate-800 bg-slate-900/50">
                    <div className="absolute inset-0 flex" style={{ width: timelineWidth }}>
                        {scenes.map((scene, idx) => {
                            let left = 0;
                            for (let i = 0; i < idx; i++) {
                                left += (scenes[i].duration || 5) * pixelsPerSecond;
                            }
                            const width = (scene.duration || 5) * pixelsPerSecond;
                            
                            return (
                                <div
                                    key={idx}
                                    className="absolute top-0 h-full border-r border-slate-700 bg-blue-900/20"
                                    style={{ left, width }}
                                >
                                    <div className="text-[8px] text-blue-300 p-1 truncate">
                                        S{idx + 1} • {(scene.duration || 5).toFixed(1)}s
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Voiceover Track (Special) */}
                {voiceoverTrack && (
                    <div className="relative h-16 border-b border-slate-800 bg-slate-900/30">
                        <div className="absolute left-2 top-2 z-20">
                            <Badge className="bg-blue-500/30 text-blue-200 text-[10px] border border-blue-500/50">
                                🎤 Voiceover
                            </Badge>
                        </div>
                        <div className="absolute inset-0" style={{ width: timelineWidth }}>
                            {/* Voiceover segments per scene */}
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
                                        className="absolute top-0 h-full bg-gradient-to-r from-blue-600/60 to-cyan-600/60 border border-blue-400/30 rounded-sm flex items-center px-2"
                                        style={{ left, width }}
                                    >
                                        <div className="text-[10px] text-white truncate">
                                            {scene.dialogue.substring(0, 30)}...
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* Audio Tracks */}
                <div className="relative min-h-[120px] py-2" style={{ width: timelineWidth }}>
                    {audioTracks.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                            Aucune piste audio. Cliquez sur "Add Track" pour commencer.
                        </div>
                    ) : (
                        <>
                            {audioTracks.map((track, idx) => (
                                <div 
                                    key={idx}
                                    className="relative h-16 mb-2"
                                    style={{ marginLeft: 0 }}
                                >
                                    <AudioTimelineTrack
                                        track={track}
                                        trackIndex={idx}
                                        totalDuration={totalDuration}
                                        pixelsPerSecond={pixelsPerSecond}
                                        onUpdate={onUpdateTrack}
                                        onRemove={onRemoveTrack}
                                        onEdit={onEditTrack}
                                        isMuted={track.muted}
                                        isLocked={track.locked}
                                        isHidden={track.hidden}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
                
                {/* Playhead */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg z-50 pointer-events-none"
                    style={{ left: currentTime * pixelsPerSecond }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md" />
                </div>
            </div>
            
            {/* Track Controls Panel */}
            {selectedTrackIndex !== null && audioTracks[selectedTrackIndex] && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-300 font-semibold">
                            {audioTracks[selectedTrackIndex].name}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTrackIndex(null)}
                            className="h-6 w-6 p-0 text-slate-400"
                        >
                            ✕
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Volume</span>
                                <span>{Math.round((audioTracks[selectedTrackIndex].volume || 1.0) * 100)}%</span>
                            </div>
                            <Slider
                                value={[audioTracks[selectedTrackIndex].volume || 1.0]}
                                onValueChange={([v]) => onUpdateTrack(selectedTrackIndex, { volume: v })}
                                min={0}
                                max={2}
                                step={0.05}
                                className="[&_[role=slider]]:bg-green-500"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Start Offset</span>
                                <span>{(audioTracks[selectedTrackIndex].startOffset || 0).toFixed(1)}s</span>
                            </div>
                            <Slider
                                value={[audioTracks[selectedTrackIndex].startOffset || 0]}
                                onValueChange={([v]) => onUpdateTrack(selectedTrackIndex, { startOffset: v })}
                                min={0}
                                max={Math.max(0, totalDuration - 1)}
                                step={0.1}
                                className="[&_[role=slider]]:bg-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}