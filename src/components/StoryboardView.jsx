import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Play, Trash2, Edit, Copy } from "lucide-react";
import { toast } from "sonner";

export default function StoryboardView({ isOpen, onClose, scenes, onReorder, onEdit, onDelete, onDuplicate }) {
    const [selectedScenes, setSelectedScenes] = useState([]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(scenes);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update scene numbers
        const updatedScenes = items.map((scene, idx) => ({
            ...scene,
            scene_number: idx + 1
        }));

        onReorder(updatedScenes);
        toast.success(`Scène déplacée de ${result.source.index + 1} à ${result.destination.index + 1}`);
    };

    const toggleSelect = (index) => {
        if (selectedScenes.includes(index)) {
            setSelectedScenes(selectedScenes.filter(i => i !== index));
        } else {
            setSelectedScenes([...selectedScenes, index]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedScenes.length === 0) return;
        if (confirm(`Supprimer ${selectedScenes.length} scène(s) ?`)) {
            const updatedScenes = scenes.filter((_, idx) => !selectedScenes.includes(idx));
            onReorder(updatedScenes);
            setSelectedScenes([]);
            toast.success(`${selectedScenes.length} scène(s) supprimée(s)`);
        }
    };

    const handleBulkDuplicate = () => {
        if (selectedScenes.length === 0) return;
        
        const updatedScenes = [...scenes];
        const sortedIndexes = [...selectedScenes].sort((a, b) => b - a);
        
        sortedIndexes.forEach(index => {
            const sceneToDuplicate = { ...scenes[index] };
            updatedScenes.splice(index + 1, 0, sceneToDuplicate);
        });
        
        onReorder(updatedScenes);
        setSelectedScenes([]);
        toast.success(`${selectedScenes.length} scène(s) dupliquée(s)`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            🎬 Storyboard Visuel
                            <Badge className="bg-blue-500">{scenes.length} scènes</Badge>
                        </DialogTitle>
                        {selectedScenes.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge className="bg-amber-500">{selectedScenes.length} sélectionnées</Badge>
                                <Button size="sm" variant="outline" onClick={handleBulkDuplicate}>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Dupliquer
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-500" onClick={handleBulkDelete}>
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Supprimer
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="storyboard" direction="horizontal">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 overflow-x-auto p-4"
                                style={{
                                    backgroundColor: snapshot.isDraggingOver ? '#f1f5f9' : 'transparent'
                                }}
                            >
                                <div className="flex gap-4 min-w-max pb-4">
                                    {scenes.map((scene, index) => (
                                        <Draggable key={`scene-${index}`} draggableId={`scene-${index}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`bg-white rounded-lg border-2 transition-all ${
                                                        selectedScenes.includes(index) 
                                                            ? 'border-blue-500 ring-2 ring-blue-200' 
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    } ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105' : 'shadow-md'}`}
                                                    style={{
                                                        width: '280px',
                                                        ...provided.draggableProps.style
                                                    }}
                                                    onClick={(e) => {
                                                        if (e.shiftKey) {
                                                            toggleSelect(index);
                                                        }
                                                    }}
                                                >
                                                    {/* Drag Handle */}
                                                    <div 
                                                        {...provided.dragHandleProps}
                                                        className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between cursor-grab active:cursor-grabbing"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                                            <span className="font-bold text-slate-700">Scène {scene.scene_number}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {scene.duration || 5}s
                                                        </Badge>
                                                    </div>

                                                    {/* Thumbnail */}
                                                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                                                        {scene.url || scene.videoUrl ? (
                                                            <img
                                                                src={scene.url || scene.videoUrl}
                                                                alt={`Scene ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Play className="w-12 h-12" />
                                                            </div>
                                                        )}
                                                        
                                                        {/* Overlay badges */}
                                                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                                            {scene.mood && (
                                                                <Badge className="bg-purple-500 text-white text-[10px]">
                                                                    {scene.mood}
                                                                </Badge>
                                                            )}
                                                            {scene.effect && scene.effect !== 'none' && (
                                                                <Badge className="bg-blue-500 text-white text-[10px]">
                                                                    {scene.effect}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-3 space-y-2">
                                                        <div className="text-xs text-slate-600 line-clamp-2">
                                                            {scene.description || scene.visual_description || 'Pas de description'}
                                                        </div>
                                                        {scene.dialogue && (
                                                            <div className="text-xs text-slate-500 italic border-l-2 border-blue-300 pl-2 line-clamp-2">
                                                                "{scene.dialogue}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="border-t border-slate-200 p-2 flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit(index);
                                                            }}
                                                            className="flex-1 h-8 text-xs"
                                                        >
                                                            <Edit className="w-3 h-3 mr-1" />
                                                            Éditer
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDuplicate(index);
                                                            }}
                                                            className="flex-1 h-8 text-xs"
                                                        >
                                                            <Copy className="w-3 h-3 mr-1" />
                                                            Copier
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(index);
                                                            }}
                                                            className="h-8 px-2 text-red-500"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500">
                            💡 Glissez-déposez pour réorganiser • Shift+clic pour sélection multiple
                        </p>
                        <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                            Fermer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}