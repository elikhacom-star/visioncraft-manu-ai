import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Save, Volume2, Music, Scissors, Trash2, Plus, GripHorizontal, MoveHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AudioTrackEditor({ 
    isOpen, 
    onClose, 
    track, 
    trackIndex, 
    allTracks = [], 
    scenes = [], 
    totalDuration = 30,
    onSave, 
    onDelete,
    onAddTrack // Callback to add a new track "next to it"
}) {
    const [currentTrack, setCurrentTrack] = useState(track || {});
    const [zoom, setZoom] = useState(20); // Pixels per second
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState(null); // 'move', 'resize-start', 'resize-end'
    const [dragStartX, setDragStartX] = useState(0);
    const [initialDragState, setInitialDragState] = useState({});

    useEffect(() => {
        setCurrentTrack(track || {});
    }, [track]);

    const handleSave = () => {
        onSave(trackIndex, currentTrack);
        onClose();
    };

    // Calculate positions
    const startPx = (currentTrack.startOffset || 0) * zoom;
    const durationPx = (currentTrack.duration || (totalDuration - (currentTrack.startOffset || 0))) * zoom;
    const endPx = startPx + durationPx;

    const handleMouseDown = (e, mode) => {
        e.preventDefault();
        setIsDragging(true);
        setDragMode(mode);
        setDragStartX(e.clientX);
        setInitialDragState({
            start: currentTrack.startOffset || 0,
            duration: currentTrack.duration || (totalDuration - (currentTrack.startOffset || 0))
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const deltaPx = e.clientX - dragStartX;
            const deltaSec = deltaPx / zoom;

            if (dragMode === 'move') {
                let newStart = Math.max(0, initialDragState.start + deltaSec);
                // Snap to scene boundaries?
                setCurrentTrack(prev => ({ ...prev, startOffset: newStart }));
            } else if (dragMode === 'resize-end') {
                let newDuration = Math.max(0.5, initialDragState.duration + deltaSec);
                setCurrentTrack(prev => ({ ...prev, duration: newDuration }));
            } else if (dragMode === 'resize-start') {
                // Moving start edge implies changing startOffset AND duration (to keep end point fixed)
                // New Start
                const proposedStart = initialDragState.start + deltaSec;
                const limitedStart = Math.min(proposedStart, initialDragState.start + initialDragState.duration - 0.5); // Min 0.5s duration
                const finalStart = Math.max(0, limitedStart);
                
                // Duration shrinks/grows inversely
                const shift = finalStart - initialDragState.start;
                const newDuration = initialDragState.duration - shift;
                
                setCurrentTrack(prev => ({ ...prev, startOffset: finalStart, duration: newDuration }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragMode(null);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragMode, dragStartX, initialDragState, zoom]);

    if (!track) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Advanced Audio Editor
                    </DialogTitle>
                    <DialogDescription>
                        Drag to move, pull edges to trim. Align audio with video scenes.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Visual Timeline */}
                    <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 overflow-x-auto">
                        <div 
                            className="relative min-h-[200px]" 
                            style={{ width: `${Math.max(totalDuration * zoom + 100, 800)}px` }}
                            ref={containerRef}
                        >
                            {/* Time Ruler */}
                            <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-300 flex text-[10px] text-slate-400 select-none">
                                {Array.from({ length: Math.ceil(totalDuration) + 2 }).map((_, i) => (
                                    <div key={i} className="absolute border-l border-slate-300 h-2 pl-1" style={{ left: i * zoom }}>
                                        {i % 5 === 0 && <span>{i}s</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Video Track (Reference) */}
                            <div className="absolute top-8 left-0 right-0 h-16 bg-slate-200 rounded flex overflow-hidden">
                                {scenes.map((scene, idx) => {
                                    // Calculate rough start time from previous scenes
                                    const prevDuration = scenes.slice(0, idx).reduce((acc, s) => acc + (s.duration || 5), 0);
                                    return (
                                        <div 
                                            key={idx}
                                            className="h-full border-r border-white/20 relative group overflow-hidden"
                                            style={{ width: (scene.duration || 5) * zoom }}
                                        >
                                            {scene.url ? (
                                                <img src={scene.url} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all" alt="" draggable={false} />
                                            ) : (
                                                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-[9px] text-slate-500">Scene {idx+1}</div>
                                            )}
                                            <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white drop-shadow-md bg-black/30 px-1 rounded">
                                                S{idx+1}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Current Audio Track (Editable) */}
                            <div className="absolute top-28 left-0 right-0 h-24 bg-slate-100 rounded-lg border border-slate-200/50 mt-2">
                                <div 
                                    className={`absolute top-2 bottom-2 rounded-md shadow-lg border-2 flex items-center justify-center cursor-pointer group select-none transition-shadow
                                        ${isDragging ? 'shadow-xl ring-2 ring-amber-400/50' : ''}
                                        ${currentTrack.type === 'sfx' ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-indigo-100 border-indigo-400 text-indigo-700'}
                                    `}
                                    style={{ 
                                        left: `${startPx}px`, 
                                        width: `${durationPx}px`,
                                        minWidth: '20px'
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                                >
                                    {/* Left Handle */}
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 w-4 bg-black/5 hover:bg-black/20 cursor-w-resize flex items-center justify-center rounded-l-sm"
                                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-start'); }}
                                    >
                                        <div className="w-0.5 h-6 bg-black/20" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col items-center gap-1 overflow-hidden px-4 w-full">
                                        <span className="font-bold text-xs truncate max-w-full">{currentTrack.name}</span>
                                        <div className="flex items-center gap-2 text-[10px] opacity-70">
                                            <span>{(currentTrack.startOffset || 0).toFixed(1)}s</span>
                                            <MoveHorizontal className="w-3 h-3" />
                                            <span>{((currentTrack.startOffset || 0) + (currentTrack.duration || 0)).toFixed(1)}s</span>
                                        </div>
                                    </div>

                                    {/* Right Handle */}
                                    <div 
                                        className="absolute right-0 top-0 bottom-0 w-4 bg-black/5 hover:bg-black/20 cursor-e-resize flex items-center justify-center rounded-r-sm"
                                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-end'); }}
                                    >
                                        <div className="w-0.5 h-6 bg-black/20" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ghost tracks (other tracks context) */}
                            {allTracks.map((t, i) => {
                                if (i === trackIndex) return null; // Skip current
                                const tStart = (t.startOffset || 0) * zoom;
                                const tDur = (t.duration || 5) * zoom;
                                return (
                                    <div 
                                        key={i}
                                        className="absolute top-[180px] h-8 rounded border border-slate-300 bg-slate-50 opacity-50 text-[10px] flex items-center px-2 truncate pointer-events-none"
                                        style={{ left: tStart, width: tDur }}
                                    >
                                        {t.name} (Other)
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Precise Timing Controls */}
                    <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">Start Time (s)</Label>
                            <input 
                                type="number" 
                                className="w-full h-8 px-2 text-xs border rounded"
                                step="0.1"
                                min="0"
                                value={currentTrack.startOffset || 0}
                                onChange={(e) => setCurrentTrack({...currentTrack, startOffset: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">Duration (s)</Label>
                            <input 
                                type="number" 
                                className="w-full h-8 px-2 text-xs border rounded"
                                step="0.1"
                                min="0.5"
                                value={currentTrack.duration || 5}
                                onChange={(e) => setCurrentTrack({...currentTrack, duration: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">Fade In (s)</Label>
                            <input 
                                type="number" 
                                className="w-full h-8 px-2 text-xs border rounded"
                                step="0.1"
                                min="0"
                                value={currentTrack.fadeIn || 0}
                                onChange={(e) => setCurrentTrack({...currentTrack, fadeIn: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">Fade Out (s)</Label>
                            <input 
                                type="number" 
                                className="w-full h-8 px-2 text-xs border rounded"
                                step="0.1"
                                min="0"
                                value={currentTrack.fadeOut || 0}
                                onChange={(e) => setCurrentTrack({...currentTrack, fadeOut: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Volume Control */}
                        <div className="flex-1 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between">
                                <Label className="flex items-center gap-2 text-xs">
                                    <Volume2 className="w-3 h-3" /> Volume
                                </Label>
                                <span className="text-xs text-slate-500">{Math.round((currentTrack.volume || 1) * 100)}%</span>
                            </div>
                            <Slider 
                                value={[currentTrack.volume || 1]} 
                                onValueChange={(val) => setCurrentTrack({...currentTrack, volume: val[0]})}
                                min={0} max={1.5} step={0.05} 
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                            onClick={() => onAddTrack && onAddTrack()}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Track Next To It
                        </Button>

                        {/* Ducking Toggle */}
                        {track.type === 'music' && (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="ducking-toggle"
                                    checked={currentTrack.ducking || false}
                                    onChange={(e) => setCurrentTrack({...currentTrack, ducking: e.target.checked})}
                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <Label htmlFor="ducking-toggle" className="cursor-pointer text-xs">Auto-ducking</Label>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center border-t pt-4">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { onDelete(trackIndex); onClose(); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Track
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}