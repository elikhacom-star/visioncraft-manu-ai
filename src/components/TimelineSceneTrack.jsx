import React, { useState, useEffect } from 'react';
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Wand2, Edit, Trash2, Target, Film, Image as ImageIcon, Lock, Unlock, Search, Clock, Heart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFavorites from './hooks/useFavorites';

export default function TimelineSceneTrack({ 
    scene, 
    index, 
    pixelsPerSecond, 
    onUpdate, 
    onEdit, 
    onDelete,
    onOpenStockBrowser,
    onToggleLock
}) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [initialDuration, setInitialDuration] = useState(0);

    const isLocked = !!scene.isLocked;
    const duration = scene.duration || 5;
    const width = Math.max(50, duration * pixelsPerSecond);

    useEffect(() => {
        if (!isResizing || isLocked) return;

        const handleMouseMove = (e) => {
            const deltaPx = e.clientX - resizeStartX;
            const deltaSec = deltaPx / pixelsPerSecond;
            const newDuration = Math.max(1, initialDuration + deltaSec); // Min 1s
            onUpdate(index, { duration: newDuration });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeStartX, initialDuration, pixelsPerSecond, index, onUpdate]);

    const handleResizeStart = (e) => {
        if (isLocked) return;
        e.preventDefault();
        e.stopPropagation(); // Prevent drag start
        setIsResizing(true);
        setResizeStartX(e.clientX);
        setInitialDuration(duration);
    };

    return (
        <Draggable draggableId={`scene-${index}`} index={index} isDragDisabled={isLocked}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="relative flex items-center h-full group"
                    style={{ 
                        ...provided.draggableProps.style,
                        marginRight: '4px' // Gap for transition
                    }}
                >
                    {/* Scene Card */}
                    <div 
                        className={`
                            relative h-28 rounded-lg overflow-hidden border-2 transition-all select-none
                            ${isLocked ? 'border-red-500/60 ring-1 ring-red-500/30' : ''}
                            ${snapshot.isDragging ? 'border-amber-500 shadow-xl z-50 scale-105' : !isLocked ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : ''}
                        `}
                        style={{ width: `${width}px` }}
                        onClick={() => !isLocked && onEdit(index)}
                    >
                        {/* Thumbnail */}
                        {scene.url ? (
                            <div className="absolute inset-0">
                                <img src={scene.url} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" draggable={false} />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-slate-600" />
                            </div>
                        )}

                        {/* Scene Info */}
                        <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-1">
                            <span className="text-amber-400">S{scene.scene_number}</span>
                            <span className="opacity-70">{duration.toFixed(1)}s</span>
                        </div>

                        {/* Top-right controls */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {scene.url && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const sceneId = scene.url || `scene-${scene.scene_number}`;
                                        toggleFavorite('scene', sceneId, {
                                            item_name: `Scène ${scene.scene_number}`,
                                            item_description: scene.dialogue || scene.description || '',
                                            item_category: scene.mood || '',
                                            item_thumbnail: scene.url,
                                            item_data: { description: scene.description, mood: scene.mood, effect: scene.effect },
                                        });
                                    }}
                                    className="p-1 bg-black/40 rounded hover:bg-black/60 transition-colors"
                                    title={isFavorite('scene', scene.url || `scene-${scene.scene_number}`) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                >
                                    <Heart className={`w-3 h-3 ${isFavorite('scene', scene.url || `scene-${scene.scene_number}`) ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                                </button>
                            )}
                            {!isLocked && (
                                <div 
                                    {...provided.dragHandleProps}
                                    className="p-1 bg-black/40 rounded text-white cursor-grab active:cursor-grabbing hover:bg-black/60 transition-colors"
                                >
                                    <GripVertical className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                        {isLocked && <div {...provided.dragHandleProps} />}

                        {/* Lock indicator overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 pointer-events-none">
                                <Lock className="w-5 h-5 text-red-400 drop-shadow-lg" />
                            </div>
                        )}

                        {/* Bottom bar: Lock Toggle + Duration + Stock */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1 py-0.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleLock?.(index); }}
                                className={`p-0.5 rounded flex items-center gap-0.5 transition-colors ${isLocked ? 'bg-red-600/80 hover:bg-red-500' : 'bg-slate-700/80 hover:bg-green-600/80'}`}
                                title={isLocked ? "Déverrouiller la scène" : "Verrouiller la scène"}
                            >
                                {isLocked ? <Lock className="w-2.5 h-2.5 text-white" /> : <Unlock className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <div className="flex items-center gap-1">
                                {/* Precise Duration Input */}
                                {!isLocked && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="px-1 py-0.5 bg-slate-700/80 rounded text-[9px] text-slate-300 hover:bg-amber-500/60 hover:text-white transition-colors flex items-center gap-0.5" title="Ajuster durée">
                                                <Clock className="w-2.5 h-2.5" />
                                                {duration.toFixed(1)}s
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-3 bg-slate-900 border-slate-700 text-white" side="top">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold text-slate-300">Durée précise</h4>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={0.5}
                                                        max={60}
                                                        step={0.1}
                                                        value={duration}
                                                        onChange={(e) => onUpdate(index, { duration: parseFloat(e.target.value) || 1 })}
                                                        className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-20"
                                                    />
                                                    <span className="text-xs text-slate-400">sec</span>
                                                </div>
                                                <Slider
                                                    value={[duration]}
                                                    min={0.5}
                                                    max={30}
                                                    step={0.5}
                                                    onValueChange={([v]) => onUpdate(index, { duration: v })}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {isLocked && (
                                    <span className="px-1 py-0.5 text-[9px] text-slate-400 flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {duration.toFixed(1)}s
                                    </span>
                                )}
                                {/* Stock Browser Button */}
                                {onOpenStockBrowser && !isLocked && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenStockBrowser(index); }}
                                        className="p-1 bg-slate-700/80 rounded text-slate-300 hover:bg-blue-500/60 hover:text-white transition-colors"
                                        title="Importer depuis la bibliothèque"
                                    >
                                        <Search className="w-2.5 h-2.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Keyframe Indicator */}
                        {scene.motionPoints && scene.motionPoints.length > 0 && (
                            <div className="absolute bottom-1 right-1 bg-purple-500/80 p-1 rounded-full" title="Has Keyframes">
                                <Target className="w-3 h-3 text-white" />
                            </div>
                        )}

                        {/* Resize Handle (Right Edge) */}
                        {!isLocked && (
                            <div 
                                className="absolute top-0 right-0 bottom-0 w-4 cursor-e-resize hover:bg-white/20 transition-colors flex items-center justify-center group/resize z-20"
                                onMouseDown={handleResizeStart}
                            >
                                <div className="w-1 h-8 bg-white/30 rounded-full group-hover/resize:bg-white/60" />
                            </div>
                        )}
                    </div>

                    {/* Transition Connector (Right Side) */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-5 h-5 bg-slate-700 rounded-full border border-slate-600 hover:bg-amber-500 hover:border-amber-400 hover:text-white text-slate-400 flex items-center justify-center transition-colors shadow-sm">
                                    <Wand2 className="w-2.5 h-2.5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3 bg-slate-900 border-slate-700 text-white">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-slate-300">Transition Settings</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['fade', 'wipe', 'slide', 'iris', 'zoom', 'glitch'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => onUpdate(index, { transition: t })}
                                                className={`px-2 py-1 text-[10px] rounded border ${scene.transition === t ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-600 hover:bg-slate-800'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Duration</span>
                                            <span>{scene.transitionDuration || 1.0}s</span>
                                        </div>
                                        <Slider 
                                            value={[scene.transitionDuration || 1.0]} 
                                            min={0.1} max={2.0} step={0.1}
                                            onValueChange={([v]) => onUpdate(index, { transitionDuration: v })}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
        </Draggable>
    );
}