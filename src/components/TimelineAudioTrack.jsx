import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Volume2, MoveHorizontal, Trash2, GripVertical, AlertCircle, Pencil, Copy, Scissors } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";

// Helper to generate waveform data
const useAudioWaveform = (fileUrl, fileBlob) => {
    const [peaks, setPeaks] = useState([]);
    
    useEffect(() => {
        if (!fileBlob && !fileUrl) return;
        
        let isActive = true;
        const processAudio = async () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                let arrayBuffer;
                
                if (fileBlob) {
                    arrayBuffer = await fileBlob.arrayBuffer();
                } else {
                    const response = await fetch(fileUrl);
                    arrayBuffer = await response.arrayBuffer();
                }
                
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const rawData = audioBuffer.getChannelData(0);
                const samples = 100; // Number of peaks to draw
                const blockSize = Math.floor(rawData.length / samples);
                const calculatedPeaks = [];
                
                for (let i = 0; i < samples; i++) {
                    const start = i * blockSize;
                    let max = 0;
                    for (let j = 0; j < blockSize; j++) {
                        if (rawData[start + j] > max) max = rawData[start + j];
                    }
                    calculatedPeaks.push(max);
                }
                
                if (isActive) setPeaks(calculatedPeaks);
                audioCtx.close(); // Clean up
            } catch (e) {
                console.warn("Waveform gen failed", e);
            }
        };
        
        processAudio();
        return () => { isActive = false; };
    }, [fileUrl, fileBlob]);
    
    return peaks;
};

export default function TimelineAudioTrack({ 
    track, 
    index, 
    pixelsPerSecond, 
    totalDuration, 
    onUpdate, 
    onRemove, 
    onClick,
    onEdit,
    onDuplicate,
    onSplit
}) {
    const peaks = useAudioWaveform(track.url, track.file);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState(null); // 'move', 'resize-left', 'resize-right', 'fade-in', 'fade-out'
    const [dragStartX, setDragStartX] = useState(0);
    const [initialState, setInitialState] = useState({});
    const [isSelected, setIsSelected] = useState(false);
    const trackRef = useRef(null);

    // Keyboard shortcuts for selected track
    useEffect(() => {
        if (!isSelected) return;

        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const step = e.shiftKey ? 1 : 0.1;
            
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    onRemove?.(index);
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onUpdate?.(index, { startOffset: Math.max(0, (track.startOffset || 0) - step) });
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onUpdate?.(index, { startOffset: (track.startOffset || 0) + step });
                    }
                    break;
                case 'ArrowUp':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onUpdate?.(index, { volume: Math.min(2, (track.volume || 1) + 0.1) });
                    }
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onUpdate?.(index, { volume: Math.max(0, (track.volume || 1) - 0.1) });
                    }
                    break;
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onDuplicate?.(index);
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    onEdit?.(index);
                    break;
                case 'm':
                    e.preventDefault();
                    onUpdate?.(index, { muted: !track.muted });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelected, index, track, onRemove, onUpdate, onDuplicate, onEdit]);
    
    const duration = track.duration || (totalDuration - (track.startOffset || 0));
    const startOffset = track.startOffset || 0;
    const width = Math.max(20, duration * pixelsPerSecond);
    const left = startOffset * pixelsPerSecond;

    // Handlers for drag interactions
    const handleMouseDown = (e, mode) => {
        e.stopPropagation();
        setIsDragging(true);
        setDragMode(mode);
        setDragStartX(e.clientX);
        setInitialState({
            startOffset: track.startOffset || 0,
            duration: duration,
            trimStart: track.trimStart || 0,
            fadeIn: track.fadeIn || 0,
            fadeOut: track.fadeOut || 0
        });
        
        // Global mouse listeners are added/removed in useEffect
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const deltaPx = e.clientX - dragStartX;
            const deltaSec = deltaPx / pixelsPerSecond;

            if (dragMode === 'move') {
                const newStart = Math.max(0, initialState.startOffset + deltaSec);
                onUpdate(index, { startOffset: newStart });
            } else if (dragMode === 'resize-right') {
                const newDuration = Math.max(0.5, initialState.duration + deltaSec);
                onUpdate(index, { duration: newDuration });
            } else if (dragMode === 'resize-left') {
                const proposedStart = initialState.startOffset + deltaSec;
                // Don't allow start to cross end (min duration 0.5)
                const maxStart = initialState.startOffset + initialState.duration - 0.5;
                const newStart = Math.max(0, Math.min(proposedStart, maxStart));

                // Calculate how much we moved (delta) to adjust trimStart
                const actualMove = newStart - initialState.startOffset;
                const newDuration = initialState.duration - actualMove;
                const newTrimStart = Math.max(0, initialState.trimStart + actualMove);

                onUpdate(index, { startOffset: newStart, duration: newDuration, trimStart: newTrimStart });
            } else if (dragMode === 'fade-in') {
                const newFadeIn = Math.max(0, Math.min(duration, initialState.fadeIn + deltaSec));
                onUpdate(index, { fadeIn: newFadeIn });
            } else if (dragMode === 'fade-out') {
                // Dragging left increases fade out duration
                const newFadeOut = Math.max(0, Math.min(duration, initialState.fadeOut - deltaSec));
                onUpdate(index, { fadeOut: newFadeOut });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragMode(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragMode, dragStartX, initialState, pixelsPerSecond, index, onUpdate]);

    return (
        <div 
            className={`relative h-20 bg-slate-900/30 rounded-lg mb-2 overflow-hidden border transition-colors ${
                isSelected ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => setIsSelected(true)}
            onBlur={() => setIsSelected(false)}
            tabIndex={0}
            ref={trackRef}
        >
            {/* Muted overlay */}
            {track.muted && (
                <div className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium">MUTED</span>
                </div>
            )}
            
            {/* The Clip with Context Menu */}
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div 
                        className={`absolute top-1 bottom-1 rounded-md border shadow-sm group select-none cursor-grab active:cursor-grabbing
                            ${track.type === 'sfx' ? 'bg-amber-900/40 border-amber-500/50' : 'bg-indigo-900/40 border-indigo-500/50'}
                            ${isDragging ? 'ring-2 ring-white/20 z-20' : 'z-10'}
                            ${isSelected ? 'ring-2 ring-amber-400/50' : ''}
                        `}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                        onDoubleClick={(e) => { e.stopPropagation(); onEdit?.(index); }}
                        onClick={(e) => { e.stopPropagation(); setIsSelected(true); onClick?.(index); }}
                    >
                {/* Waveform Visualization */}
                <div className="absolute inset-0 flex items-center justify-between px-1 opacity-50 pointer-events-none">
                    {peaks.map((peak, i) => (
                        <div 
                            key={i} 
                            className={`w-[2px] rounded-full ${track.type === 'sfx' ? 'bg-amber-400' : 'bg-indigo-400'}`}
                            style={{ height: `${Math.max(10, peak * 100)}%` }}
                        />
                    ))}
                </div>

                {/* Volume Envelope / Ducking Visualization */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" preserveAspectRatio="none">
                    <polyline 
                        points={`
                            0,${100 - (track.fadeIn > 0 ? 0 : (track.volume*100 || 100))} 
                            ${(track.fadeIn/duration)*100},${100 - (track.volume*100 || 100)} 
                            ${track.ducking ? `
                                ${(duration/2 - 1)/duration*100},${100 - (track.volume*100 || 100)}
                                ${(duration/2)/duration*100},${100 - (track.volume*20 || 20)}
                                ${(duration/2 + 1)/duration*100},${100 - (track.volume*100 || 100)}
                            ` : ''}
                            ${100 - (track.fadeOut/duration)*100},${100 - (track.volume*100 || 100)} 
                            100,${100}
                        `}
                        fill="none"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="2"
                    />
                </svg>

                {/* Info Text */}
                <div className="absolute top-1 left-2 text-[10px] font-medium text-white truncate max-w-full drop-shadow-md">
                    {track.name}
                </div>

                {/* Fade Handles */}
                <div 
                    className="absolute top-0 w-3 h-3 bg-white/50 rounded-full cursor-e-resize hover:bg-white z-30"
                    style={{ left: `${(track.fadeIn/duration)*100}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleMouseDown(e, 'fade-in')}
                    title={`Fade In: ${track.fadeIn?.toFixed(1)}s`}
                />
                <div 
                    className="absolute top-0 w-3 h-3 bg-white/50 rounded-full cursor-w-resize hover:bg-white z-30"
                    style={{ right: `${(track.fadeOut/duration)*100}%`, transform: 'translate(50%, -50%)' }}
                    onMouseDown={(e) => handleMouseDown(e, 'fade-out')}
                    title={`Fade Out: ${track.fadeOut?.toFixed(1)}s`}
                />

                {/* Resize Handles */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize hover:bg-white/20 transition-colors z-20 flex items-center justify-center"
                    onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                >
                    <div className="w-1 h-6 bg-white/30 rounded-full" />
                </div>
                <div 
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 transition-colors z-20 flex items-center justify-center"
                    onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                >
                    <div className="w-1 h-6 bg-white/30 rounded-full" />
                </div>

                {/* Controls Overlay (Hover) */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-30">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit?.(index); }}
                        className="p-1 bg-slate-800/80 rounded hover:bg-slate-700 text-white"
                        title="Edit Track (E)"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                    {track.type === 'music' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdate(index, { ducking: !track.ducking }); }}
                            className={`p-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${track.ducking ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-800/80 text-slate-300 border-slate-600 hover:bg-slate-700'}`}
                            title="Toggle Auto-Ducking"
                        >
                            <Volume2 className="w-3 h-3" />
                            {track.ducking && "DUCK"}
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                        className="p-1 bg-red-500/80 rounded hover:bg-red-600 text-white"
                        title="Delete Track (Del)"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => onEdit?.(index)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Éditer (E)
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDuplicate?.(index)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliquer (Ctrl+D)
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onSplit?.(index)}>
                        <Scissors className="w-4 h-4 mr-2" />
                        Diviser au curseur
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onUpdate?.(index, { muted: !track.muted })}>
                        <Volume2 className="w-4 h-4 mr-2" />
                        {track.muted ? 'Réactiver' : 'Muter'} (M)
                    </ContextMenuItem>
                    {track.type === 'music' && (
                        <ContextMenuItem onClick={() => onUpdate?.(index, { ducking: !track.ducking })}>
                            <Volume2 className="w-4 h-4 mr-2" />
                            {track.ducking ? 'Désactiver' : 'Activer'} Ducking
                        </ContextMenuItem>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onRemove?.(index)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer (Del)
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    );
}