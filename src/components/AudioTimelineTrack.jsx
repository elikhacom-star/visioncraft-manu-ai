import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Lock, Unlock, Eye, EyeOff, Trash2, Settings } from "lucide-react";

export default function AudioTimelineTrack({ 
    track, 
    trackIndex, 
    totalDuration, 
    pixelsPerSecond,
    onUpdate,
    onRemove,
    onEdit,
    isMuted = false,
    isLocked = false,
    isHidden = false
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    
    const startOffset = track.startOffset || 0;
    const duration = track.duration || 10;
    const trimStart = track.trimStart || 0;
    const trimEnd = track.trimEnd || duration;
    const effectiveDuration = trimEnd - trimStart;
    
    const trackLeft = startOffset * pixelsPerSecond;
    const trackWidth = Math.max(40, effectiveDuration * pixelsPerSecond);
    
    const handleMouseDown = (e, type) => {
        if (isLocked) return;
        e.stopPropagation();
        
        if (type === 'move') {
            setIsDragging(true);
            setDragStart({ x: e.clientX, initialOffset: startOffset });
        } else {
            setIsResizing(type);
            setDragStart({ x: e.clientX, initialOffset: startOffset, initialDuration: effectiveDuration });
        }
    };
    
    const handleMouseMove = (e) => {
        if (isLocked) return;
        
        if (isDragging && dragStart) {
            const deltaX = (e.clientX - dragStart.x) / pixelsPerSecond;
            const newOffset = Math.max(0, Math.min(totalDuration - effectiveDuration, dragStart.initialOffset + deltaX));
            onUpdate(trackIndex, { startOffset: newOffset });
        } else if (isResizing && dragStart) {
            const deltaX = (e.clientX - dragStart.x) / pixelsPerSecond;
            
            if (isResizing === 'start') {
                const newTrimStart = Math.max(0, Math.min(trimEnd - 0.5, trimStart + deltaX));
                onUpdate(trackIndex, { trimStart: newTrimStart });
            } else if (isResizing === 'end') {
                const newTrimEnd = Math.max(trimStart + 0.5, Math.min(duration, trimEnd + deltaX));
                onUpdate(trackIndex, { trimEnd: newTrimEnd });
            }
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(null);
        setDragStart(null);
    };
    
    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart]);
    
    const getTrackColor = () => {
        switch(track.type) {
            case 'music': return 'from-indigo-500 to-purple-500';
            case 'sfx': return 'from-green-500 to-emerald-500';
            case 'voiceover': return 'from-blue-500 to-cyan-500';
            default: return 'from-gray-500 to-slate-500';
        }
    };
    
    const getTrackIcon = () => {
        switch(track.type) {
            case 'music': return '🎵';
            case 'sfx': return '🔊';
            case 'voiceover': return '🎤';
            default: return '🎧';
        }
    };
    
    return (
        <div
            className={`absolute h-14 rounded-lg shadow-lg border-2 transition-all group ${
                isDragging ? 'ring-2 ring-amber-400 scale-105 z-30' : 
                isResizing ? 'ring-2 ring-blue-400 z-30' :
                'border-slate-600 hover:border-amber-400 z-10'
            } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-move'} ${
                isHidden ? 'opacity-30' : ''
            }`}
            style={{ 
                left: trackLeft,
                width: trackWidth,
                background: `linear-gradient(to right, var(--tw-gradient-stops))`,
            }}
            className={`absolute h-14 rounded-lg shadow-lg border-2 transition-all group bg-gradient-to-r ${getTrackColor()} ${
                isDragging ? 'ring-2 ring-amber-400 scale-105 z-30' : 
                isResizing ? 'ring-2 ring-blue-400 z-30' :
                'border-slate-600 hover:border-amber-400 z-10'
            } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-move'} ${
                isHidden ? 'opacity-30' : ''
            }`}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
            {/* Waveform visualization */}
            <div className="absolute inset-0 flex items-center gap-px px-2 opacity-40">
                {Array.from({ length: Math.floor(trackWidth / 3) }).map((_, i) => {
                    const height = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 10;
                    return (
                        <div 
                            key={i}
                            className="w-0.5 bg-white rounded-full"
                            style={{ height: `${height * (track.volume || 1.0)}%` }}
                        />
                    );
                })}
            </div>
            
            {/* Track Info */}
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getTrackIcon()}</span>
                    <div>
                        <div className="text-xs font-bold text-white drop-shadow-md truncate max-w-[120px]">
                            {track.name}
                        </div>
                        <div className="text-[9px] text-white/80">
                            {effectiveDuration.toFixed(1)}s • {Math.round((track.volume || 1.0) * 100)}%
                        </div>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-1 pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(trackIndex, { muted: !isMuted });
                        }}
                    >
                        {isMuted ? <VolumeX className="w-3 h-3 text-white" /> : <Volume2 className="w-3 h-3 text-white" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(trackIndex, { locked: !isLocked });
                        }}
                    >
                        {isLocked ? <Lock className="w-3 h-3 text-white" /> : <Unlock className="w-3 h-3 text-white" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(trackIndex);
                        }}
                    >
                        <Settings className="w-3 h-3 text-white" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Supprimer "${track.name}" ?`)) {
                                onRemove(trackIndex);
                            }
                        }}
                    >
                        <Trash2 className="w-3 h-3 text-white" />
                    </Button>
                </div>
            </div>
            
            {/* Resize Handles */}
            {!isLocked && (
                <>
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400/50 transition-colors z-20"
                        onMouseDown={(e) => handleMouseDown(e, 'start')}
                    />
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cyan-400/50 transition-colors z-20"
                        onMouseDown={(e) => handleMouseDown(e, 'end')}
                    />
                </>
            )}
            
            {/* Fade indicators */}
            {track.fadeIn > 0 && (
                <div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"
                    style={{ width: `${Math.min(30, (track.fadeIn / effectiveDuration) * 100)}%` }}
                />
            )}
            {track.fadeOut > 0 && (
                <div 
                    className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"
                    style={{ width: `${Math.min(30, (track.fadeOut / effectiveDuration) * 100)}%` }}
                />
            )}
            
            {/* Lock indicator */}
            {isLocked && (
                <div className="absolute top-1 right-1">
                    <Lock className="w-3 h-3 text-white/60" />
                </div>
            )}
        </div>
    );
}