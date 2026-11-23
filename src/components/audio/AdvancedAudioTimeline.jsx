import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
    Volume2, VolumeX, Scissors, Trash2, GripVertical, 
    ChevronDown, ChevronUp, Play, Pause, SkipBack,
    Plus, Music, Mic, Sparkles, Copy, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';

// Waveform visualization component
function AudioWaveformVisual({ track, width, height, color = '#f59e0b' }) {
    const canvasRef = useRef(null);
    const [waveformData, setWaveformData] = useState([]);

    useEffect(() => {
        if (!track?.file) {
            // Generate fake waveform for visual
            const fakeData = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
            setWaveformData(fakeData);
            return;
        }

        const generateWaveform = async () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await track.file.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const channelData = audioBuffer.getChannelData(0);
                
                const samples = 100;
                const blockSize = Math.floor(channelData.length / samples);
                const filteredData = [];
                
                for (let i = 0; i < samples; i++) {
                    let sum = 0;
                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(channelData[i * blockSize + j]);
                    }
                    filteredData.push(sum / blockSize);
                }
                
                const maxVal = Math.max(...filteredData);
                const normalized = filteredData.map(v => v / maxVal);
                setWaveformData(normalized);
                audioContext.close();
            } catch (e) {
                const fakeData = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
                setWaveformData(fakeData);
            }
        };

        generateWaveform();
    }, [track?.file]);

    useEffect(() => {
        if (!canvasRef.current || waveformData.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / waveformData.length;
        const centerY = height / 2;
        
        // Draw fade regions
        const fadeInWidth = (track?.fadeIn || 0) / (track?.duration || 10) * width;
        const fadeOutStart = width - (track?.fadeOut || 0) / (track?.duration || 10) * width;
        
        if (fadeInWidth > 0) {
            const gradient = ctx.createLinearGradient(0, 0, fadeInWidth, 0);
            gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, fadeInWidth, height);
        }
        
        if (track?.fadeOut > 0) {
            const gradient = ctx.createLinearGradient(fadeOutStart, 0, width, 0);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(fadeOutStart, 0, width - fadeOutStart, height);
        }
        
        // Draw waveform
        ctx.fillStyle = color;
        waveformData.forEach((val, i) => {
            const barHeight = val * (height - 4);
            const x = i * barWidth;
            ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
        });
        
    }, [waveformData, width, height, color, track?.fadeIn, track?.fadeOut, track?.duration]);

    return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}

// Volume envelope editor with keyframes
function VolumeEnvelope({ track, width, height, onChange }) {
    const canvasRef = useRef(null);
    const [keyframes, setKeyframes] = useState(track?.volumeKeyframes || [
        { time: 0, value: track?.volume || 1 },
        { time: 1, value: track?.volume || 1 }
    ]);
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        
        // Draw envelope line
        ctx.beginPath();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        
        keyframes.forEach((kf, i) => {
            const x = kf.time * width;
            const y = height - (kf.value * height);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw keyframe points
        keyframes.forEach((kf, i) => {
            const x = kf.time * width;
            const y = height - (kf.value * height);
            
            ctx.beginPath();
            ctx.arc(x, y, hoveredIndex === i ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = draggingIndex === i ? '#16a34a' : '#22c55e';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
    }, [keyframes, width, height, draggingIndex, hoveredIndex]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking near a keyframe
        for (let i = 0; i < keyframes.length; i++) {
            const kfX = keyframes[i].time * width;
            const kfY = height - (keyframes[i].value * height);
            const dist = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);
            
            if (dist < 12) {
                setDraggingIndex(i);
                return;
            }
        }
        
        // Add new keyframe
        const time = Math.max(0, Math.min(1, x / width));
        const value = Math.max(0, Math.min(1, 1 - y / height));
        
        const newKeyframes = [...keyframes, { time, value }].sort((a, b) => a.time - b.time);
        setKeyframes(newKeyframes);
        onChange?.({ volumeKeyframes: newKeyframes });
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (draggingIndex !== null) {
            const time = draggingIndex === 0 ? 0 : 
                         draggingIndex === keyframes.length - 1 ? 1 :
                         Math.max(0.01, Math.min(0.99, x / width));
            const value = Math.max(0, Math.min(1, 1 - y / height));
            
            const newKeyframes = [...keyframes];
            newKeyframes[draggingIndex] = { time, value };
            newKeyframes.sort((a, b) => a.time - b.time);
            setKeyframes(newKeyframes);
        } else {
            // Check hover
            let hovered = null;
            for (let i = 0; i < keyframes.length; i++) {
                const kfX = keyframes[i].time * width;
                const kfY = height - (keyframes[i].value * height);
                const dist = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);
                if (dist < 12) {
                    hovered = i;
                    break;
                }
            }
            setHoveredIndex(hovered);
        }
    };

    const handleMouseUp = () => {
        if (draggingIndex !== null) {
            onChange?.({ volumeKeyframes: keyframes });
            setDraggingIndex(null);
        }
    };

    const handleDoubleClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Find and remove keyframe (except first and last)
        for (let i = 1; i < keyframes.length - 1; i++) {
            const kfX = keyframes[i].time * width;
            if (Math.abs(x - kfX) < 12) {
                const newKeyframes = keyframes.filter((_, idx) => idx !== i);
                setKeyframes(newKeyframes);
                onChange?.({ volumeKeyframes: newKeyframes });
                return;
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 cursor-crosshair z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
        />
    );
}

// Single audio track row
function AudioTrackRow({ 
    track, 
    index, 
    totalDuration, 
    pixelsPerSecond,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onSplit,
    onDuplicate
}) {
    const trackRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [isDraggingPosition, setIsDraggingPosition] = useState(false);
    const [showVolumeEnvelope, setShowVolumeEnvelope] = useState(false);
    const [localTrack, setLocalTrack] = useState(track);

    useEffect(() => {
        setLocalTrack(track);
    }, [track]);

    const trackDuration = localTrack.duration || 10;
    const startOffset = localTrack.startOffset || 0;
    const trimStart = localTrack.trimStart || 0;
    const trimEnd = localTrack.trimEnd || 0;
    const effectiveDuration = trackDuration - trimStart - trimEnd;
    
    const trackWidth = effectiveDuration * pixelsPerSecond;
    const trackLeft = startOffset * pixelsPerSecond;

    const getTypeColor = (type) => {
        switch (type) {
            case 'music': return { bg: 'bg-amber-500/20', border: 'border-amber-500', color: '#f59e0b' };
            case 'sfx': return { bg: 'bg-purple-500/20', border: 'border-purple-500', color: '#a855f7' };
            case 'voiceover': return { bg: 'bg-blue-500/20', border: 'border-blue-500', color: '#3b82f6' };
            case 'voiceover_native': return { bg: 'bg-green-500/20', border: 'border-green-500', color: '#22c55e' };
            case 'voiceover_recorded': return { bg: 'bg-red-500/20', border: 'border-red-500', color: '#ef4444' };
            default: return { bg: 'bg-slate-500/20', border: 'border-slate-500', color: '#64748b' };
        }
    };

    const colors = getTypeColor(localTrack.type);

    const handleTrimStart = (e) => {
        if (localTrack.locked) return;
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingStart(true);
    };

    const handleTrimEnd = (e) => {
        if (localTrack.locked) return;
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingEnd(true);
    };

    const handlePositionDrag = (e) => {
        if (localTrack.locked) return;
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingPosition(true);
    };

    useEffect(() => {
        if (!isDraggingStart && !isDraggingEnd && !isDraggingPosition) return;

        const handleMove = (e) => {
            e.preventDefault();
            const container = trackRef.current?.parentElement?.parentElement;
            if (!container) return;

            const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left - 128; // Account for sidebar
            const time = Math.max(0, x / pixelsPerSecond);

            if (isDraggingStart) {
                const newTrimStart = Math.max(0, Math.min(trackDuration - trimEnd - 0.5, time - startOffset));
                setLocalTrack(prev => ({ ...prev, trimStart: Math.round(newTrimStart * 10) / 10 }));
            } else if (isDraggingEnd) {
                const trackEndTime = startOffset + trackDuration - trimStart;
                const newTrimEnd = Math.max(0, Math.min(trackDuration - trimStart - 0.5, trackEndTime - time));
                setLocalTrack(prev => ({ ...prev, trimEnd: Math.round(newTrimEnd * 10) / 10 }));
            } else if (isDraggingPosition) {
                const newOffset = Math.max(0, Math.min(totalDuration - effectiveDuration, time));
                setLocalTrack(prev => ({ ...prev, startOffset: Math.round(newOffset * 10) / 10 }));
            }
        };

        const handleEnd = () => {
            if (isDraggingStart || isDraggingEnd || isDraggingPosition) {
                onUpdate(index, localTrack);
                toast.success(`Track updated: ${localTrack.name}`, { duration: 1000 });
            }
            setIsDraggingStart(false);
            setIsDraggingEnd(false);
            setIsDraggingPosition(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDraggingStart, isDraggingEnd, isDraggingPosition, localTrack, index, onUpdate, pixelsPerSecond, startOffset, trackDuration, trimStart, trimEnd, effectiveDuration, totalDuration]);

    const handleSplitAtPlayhead = () => {
        if (localTrack.locked) {
            toast.error("Cannot split locked track");
            return;
        }
        // Split at middle for now (could be enhanced with playhead position)
        const splitPoint = effectiveDuration / 2;
        onSplit(index, splitPoint);
        toast.success(`Split track: ${localTrack.name}`);
    };

    return (
        <div className={`relative group ${isSelected ? 'z-10' : ''}`}>
            {/* Track info sidebar */}
            <div className="absolute left-0 top-0 w-32 h-full bg-slate-800 border-r border-slate-700 flex flex-col justify-center px-2 z-20">
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(index, { muted: !localTrack.muted });
                        toast.info(localTrack.muted ? 'Unmuted' : 'Muted', { duration: 1000 });
                    }}
                    className={`p-1 rounded transition-colors ${localTrack.muted ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-white'}`}
                    title={localTrack.muted ? 'Unmute' : 'Mute'}
                >
                    {localTrack.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(index, { locked: !localTrack.locked });
                        toast.info(localTrack.locked ? 'Unlocked' : 'Locked', { duration: 1000 });
                    }}
                    className={`p-1 rounded transition-colors ${localTrack.locked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-white'}`}
                    title={localTrack.locked ? 'Unlock' : 'Lock'}
                >
                    {localTrack.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
                <span className="text-[10px] text-slate-300 truncate flex-1" title={localTrack.name}>
                    {localTrack.name?.substring(0, 12) || 'Track'}
                </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
                <Slider
                    value={[localTrack.volume || 1]}
                    onValueChange={([v]) => {
                        const rounded = Math.round(v * 100) / 100;
                        setLocalTrack(prev => ({ ...prev, volume: rounded }));
                        onUpdate(index, { volume: rounded });
                    }}
                    min={0}
                    max={1.5}
                    step={0.05}
                    className="flex-1"
                />
                <span className="text-[9px] text-slate-400 w-8 text-right">{Math.round((localTrack.volume || 1) * 100)}%</span>
            </div>
            </div>

            {/* Track content area */}
            <div className="ml-32 h-16 relative bg-slate-900/50 touch-none">
                {/* Audio clip */}
                <div
                    ref={trackRef}
                    className={`absolute h-12 top-2 rounded-md border-2 transition-shadow select-none ${localTrack.locked ? 'cursor-not-allowed' : 'cursor-move'} ${colors.bg} ${colors.border} ${isSelected ? 'ring-2 ring-white/50 shadow-lg' : ''} ${localTrack.locked ? 'opacity-60' : ''}`}
                    style={{
                        left: `${trackLeft}px`,
                        width: `${Math.max(20, trackWidth)}px`,
                        touchAction: localTrack.locked ? 'auto' : 'none'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(index);
                    }}
                    onMouseDown={handlePositionDrag}
                    onTouchStart={(e) => {
                        if (!localTrack.locked) {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const fakeEvent = {
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                stopPropagation: () => {},
                                preventDefault: () => {}
                            };
                            handlePositionDrag(fakeEvent);
                        }
                    }}
                >
                    {/* Waveform */}
                    <AudioWaveformVisual 
                        track={localTrack} 
                        width={Math.max(20, trackWidth)} 
                        height={48} 
                        color={colors.color}
                    />
                    
                    {/* Volume envelope overlay */}
                    {showVolumeEnvelope && (
                        <VolumeEnvelope
                            track={localTrack}
                            width={Math.max(20, trackWidth)}
                            height={48}
                            onChange={(updates) => {
                                setLocalTrack(prev => ({ ...prev, ...updates }));
                                onUpdate(index, updates);
                            }}
                        />
                    )}

                    {/* Trim handles - Enhanced for mobile */}
                    {!localTrack.locked && (
                        <>
                            <div
                                className="absolute left-0 top-0 w-4 h-full bg-white/30 hover:bg-white/80 active:bg-white/90 cursor-ew-resize rounded-l-md z-20 transition-colors"
                                onMouseDown={handleTrimStart}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    const fakeEvent = {
                                        clientX: touch.clientX,
                                        clientY: touch.clientY,
                                        stopPropagation: () => {},
                                        preventDefault: () => {}
                                    };
                                    handleTrimStart(fakeEvent);
                                }}
                                title="Drag to trim start"
                            />
                            <div
                                className="absolute right-0 top-0 w-4 h-full bg-white/30 hover:bg-white/80 active:bg-white/90 cursor-ew-resize rounded-r-md z-20 transition-colors"
                                onMouseDown={handleTrimEnd}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    const fakeEvent = {
                                        clientX: touch.clientX,
                                        clientY: touch.clientY,
                                        stopPropagation: () => {},
                                        preventDefault: () => {}
                                    };
                                    handleTrimEnd(fakeEvent);
                                }}
                                title="Drag to trim end"
                            />
                        </>
                    )}

                    {/* Fade indicators */}
                    {localTrack.fadeIn > 0 && (
                        <div 
                            className="absolute top-0 left-0 h-full pointer-events-none bg-gradient-to-r from-black/40 to-transparent"
                            style={{ width: `${Math.min(100, (localTrack.fadeIn || 0) / effectiveDuration * 100)}%` }}
                        />
                    )}
                    {localTrack.fadeOut > 0 && (
                        <div 
                            className="absolute top-0 right-0 h-full pointer-events-none bg-gradient-to-l from-black/40 to-transparent"
                            style={{ width: `${Math.min(100, (localTrack.fadeOut || 0) / effectiveDuration * 100)}%` }}
                        />
                    )}

                    {/* Track label */}
                    <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[9px] text-white/70 z-10">
                        <span className="truncate">{localTrack.name}</span>
                        <span>{effectiveDuration.toFixed(1)}s</span>
                    </div>
                </div>

                {/* Track actions (visible on hover/select) */}
                {isSelected && !localTrack.locked && (
                <div className="absolute right-2 top-2 flex gap-1 z-20" onClick={(e) => e.stopPropagation()}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVolumeEnvelope(!showVolumeEnvelope);
                                    }}
                                    className={`p-1 rounded text-xs transition-all ${showVolumeEnvelope ? 'bg-green-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Volume Envelope (Click to add keyframes)</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSplitAtPlayhead();
                                    }}
                                    className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
                                >
                                    <Scissors className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Split Clip at Center</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate(index);
                                    }}
                                    className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate Track</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete "${localTrack.name}"?`)) {
                                            onDelete(index);
                                        }
                                    }}
                                    className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Track</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                )}
            </div>

            {/* Expanded controls */}
            {isExpanded && isSelected && (
                <div className="ml-32 bg-slate-800 border-t border-slate-700 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Fade In</label>
                        <Slider
                            value={[localTrack.fadeIn || 0]}
                            onValueChange={([v]) => {
                                const rounded = Math.round(v * 10) / 10;
                                setLocalTrack(prev => ({ ...prev, fadeIn: rounded }));
                                onUpdate(index, { fadeIn: rounded });
                            }}
                            min={0}
                            max={5}
                            step={0.1}
                        />
                        <span className="text-[9px] text-slate-500">{(localTrack.fadeIn || 0).toFixed(1)}s</span>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Fade Out</label>
                        <Slider
                            value={[localTrack.fadeOut || 0]}
                            onValueChange={([v]) => {
                                const rounded = Math.round(v * 10) / 10;
                                setLocalTrack(prev => ({ ...prev, fadeOut: rounded }));
                                onUpdate(index, { fadeOut: rounded });
                            }}
                            min={0}
                            max={5}
                            step={0.1}
                        />
                        <span className="text-[9px] text-slate-500">{(localTrack.fadeOut || 0).toFixed(1)}s</span>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Duck Level</label>
                        <Slider
                            value={[localTrack.duckLevel || 0.15]}
                            onValueChange={([v]) => {
                                setLocalTrack(prev => ({ ...prev, duckLevel: v }));
                                onUpdate(index, { duckLevel: v });
                            }}
                            min={0}
                            max={1}
                            step={0.05}
                            disabled={!localTrack.ducking}
                        />
                        <span className="text-[9px] text-slate-500">{Math.round((localTrack.duckLevel || 0.15) * 100)}%</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`duck-${index}`}
                                checked={localTrack.ducking || false}
                                onChange={(e) => {
                                    setLocalTrack(prev => ({ ...prev, ducking: e.target.checked }));
                                    onUpdate(index, { ducking: e.target.checked });
                                }}
                                className="rounded h-3 w-3"
                            />
                            <label htmlFor={`duck-${index}`} className="text-[10px] text-slate-400 cursor-pointer">Auto-Duck Voiceover</label>
                        </div>
                    </div>
                </div>
            )}

            {/* Expand/collapse button */}
            {isSelected && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="absolute left-36 bottom-1 p-0.5 rounded bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 z-20 transition-colors"
                    title={isExpanded ? 'Collapse controls' : 'Expand controls'}
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
}

// Main timeline component
export default function AdvancedAudioTimeline({
    audioTracks = [],
    totalDuration = 60,
    onUpdateTrack,
    onRemoveTrack,
    onAddTrack,
    onReorderTracks,
    playheadPosition = 0,
    onPlayheadChange,
    isPlaying = false,
    onPlayPause
}) {
    const timelineRef = useRef(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [scrollLeft, setScrollLeft] = useState(0);

    const pixelsPerSecond = 20 * zoom;
    const timelineWidth = totalDuration * pixelsPerSecond;

    const handleTimelineClick = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft - 128; // 128 = sidebar width
        const time = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
        onPlayheadChange?.(time);
    };

    const handleSplitTrack = (trackIndex, splitTime) => {
        const track = audioTracks[trackIndex];
        if (!track || track.locked) return;

        const absoluteSplitTime = splitTime + (track.trimStart || 0);
        
        // Create two new tracks from the split
        const track1 = {
            ...track,
            id: `${track.id || trackIndex}_1_${Date.now()}`,
            name: `${track.name} (Part 1)`,
            duration: absoluteSplitTime - (track.trimStart || 0),
            trimEnd: 0,
        };
        
        const track2 = {
            ...track,
            id: `${track.id || trackIndex}_2_${Date.now()}`,
            name: `${track.name} (Part 2)`,
            trimStart: absoluteSplitTime,
            trimEnd: track.trimEnd || 0,
            duration: (track.duration || 10) - absoluteSplitTime,
            startOffset: (track.startOffset || 0) + splitTime,
        };

        // Update tracks array
        const newTracks = [...audioTracks];
        newTracks.splice(trackIndex, 1, track1, track2);
        
        onReorderTracks?.(newTracks);
        toast.success(`Split "${track.name}" at ${splitTime.toFixed(1)}s`);
    };

    const handleDuplicateTrack = (trackIndex) => {
        const track = audioTracks[trackIndex];
        if (!track) return;

        const effectiveDur = (track.duration || 10) - (track.trimStart || 0) - (track.trimEnd || 0);
        const duplicate = {
            ...track,
            id: `${track.id || trackIndex}_copy_${Date.now()}`,
            name: `${track.name} (copy)`,
            startOffset: (track.startOffset || 0) + effectiveDur + 0.5,
        };

        const newTracks = [...audioTracks, duplicate];
        onReorderTracks?.(newTracks);
        toast.success(`Duplicated: ${track.name}`);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return;
        
        const newTracks = Array.from(audioTracks);
        const [removed] = newTracks.splice(result.source.index, 1);
        newTracks.splice(result.destination.index, 0, removed);
        
        onReorderTracks?.(newTracks);
        toast.success(`Moved "${removed.name}" to position ${result.destination.index + 1}`, { duration: 1500 });
    };

    // Time ruler marks
    const timeMarks = [];
    const interval = zoom >= 2 ? 1 : zoom >= 1 ? 2 : 5;
    for (let t = 0; t <= totalDuration; t += interval) {
        timeMarks.push(t);
    }

    return (
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlayheadChange?.(0)}
                        className="h-7 px-2 text-slate-300 hover:text-white"
                    >
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={isPlaying ? 'default' : 'ghost'}
                        onClick={onPlayPause}
                        className={`h-7 px-3 ${isPlaying ? 'bg-green-600 hover:bg-green-700' : 'text-slate-300 hover:text-white'}`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <span className="text-xs text-slate-400 font-mono ml-2">
                        {Math.floor(playheadPosition / 60)}:{String(Math.floor(playheadPosition % 60)).padStart(2, '0')}.{String(Math.floor((playheadPosition % 1) * 10)).padStart(1, '0')}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Zoom</span>
                        <Slider
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            min={0.5}
                            max={4}
                            step={0.25}
                            className="w-24"
                        />
                        <span className="text-[10px] text-slate-400">{zoom}x</span>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddTrack?.()}
                        className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Track
                    </Button>
                </div>
            </div>

            {/* Timeline area */}
            <div 
                className="relative overflow-x-auto overflow-y-auto overscroll-contain"
                style={{ 
                    maxHeight: '400px',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x pan-y'
                }}
                onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
            >
                {/* Time ruler */}
                <div 
                    className="sticky top-0 h-6 bg-slate-800 border-b border-slate-700 z-30 flex"
                    style={{ width: `${timelineWidth + 128}px` }}
                >
                    <div className="w-32 flex-shrink-0 bg-slate-800 border-r border-slate-700" />
                    <div 
                        className="relative flex-1 cursor-pointer"
                        onClick={handleTimelineClick}
                    >
                        {timeMarks.map(t => (
                            <div
                                key={t}
                                className="absolute top-0 h-full flex flex-col items-center"
                                style={{ left: `${t * pixelsPerSecond}px` }}
                            >
                                <div className="w-px h-2 bg-slate-600" />
                                <span className="text-[9px] text-slate-500">{t}s</span>
                            </div>
                        ))}
                        
                        {/* Playhead */}
                        <div
                            className="absolute top-0 w-0.5 h-full bg-red-500 z-40 pointer-events-none"
                            style={{ left: `${playheadPosition * pixelsPerSecond}px` }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
                        </div>
                    </div>
                </div>

                {/* Tracks */}
                <div 
                    ref={timelineRef}
                    className="relative touch-pan-x touch-pan-y"
                    style={{ 
                        width: `${timelineWidth + 128}px`, 
                        minHeight: '200px',
                        touchAction: 'pan-x pan-y'
                    }}
                >
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="audio-tracks">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {audioTracks.map((track, index) => (
                                        <Draggable key={`track-${index}`} draggableId={`track-${index}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={snapshot.isDragging ? 'opacity-80' : ''}
                                                >
                                                    <div {...provided.dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 z-30 cursor-grab">
                                                        <GripVertical className="w-3 h-3 text-slate-600" />
                                                    </div>
                                                    <AudioTrackRow
                                                        track={track}
                                                        index={index}
                                                        totalDuration={totalDuration}
                                                        pixelsPerSecond={pixelsPerSecond}
                                                        isSelected={selectedTrack === index}
                                                        onSelect={setSelectedTrack}
                                                        onUpdate={onUpdateTrack}
                                                        onDelete={onRemoveTrack}
                                                        onSplit={handleSplitTrack}
                                                        onDuplicate={handleDuplicateTrack}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* Playhead line (extends through tracks) */}
                    <div
                        className="absolute top-0 w-0.5 bg-red-500/50 pointer-events-none z-10"
                        style={{ 
                            left: `${128 + playheadPosition * pixelsPerSecond}px`,
                            height: '100%'
                        }}
                    />

                    {/* Empty state */}
                    {audioTracks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <Music className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No audio tracks</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAddTrack?.()}
                                className="mt-2 text-xs border-slate-600"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Audio Track
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer with tips */}
            <div className="px-3 py-1.5 bg-slate-800 border-t border-slate-700 text-[10px] text-slate-500 flex items-center justify-between">
                <span>💡 Drag edges to trim • Drag track to move • Click for options • Double-click envelope keyframe to delete</span>
                {selectedTrack !== null && (
                    <span className="text-amber-400 font-medium">
                        Selected: {audioTracks[selectedTrack]?.name || 'Track'}
                    </span>
                )}
            </div>
        </div>
    );
}