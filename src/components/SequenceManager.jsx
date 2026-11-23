import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Plus, Edit, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function SequenceManager({ isOpen, onClose, scenes, sequences, onUpdateSequences }) {
    const [editingSequence, setEditingSequence] = useState(null);
    const [sequenceName, setSequenceName] = useState("");
    const [sequenceColor, setSequenceColor] = useState("#3b82f6");
    const [selectedScenes, setSelectedScenes] = useState([]);

    const colors = [
        { value: '#3b82f6', label: 'Bleu' },
        { value: '#10b981', label: 'Vert' },
        { value: '#f59e0b', label: 'Orange' },
        { value: '#ef4444', label: 'Rouge' },
        { value: '#8b5cf6', label: 'Violet' },
        { value: '#ec4899', label: 'Rose' },
        { value: '#06b6d4', label: 'Cyan' }
    ];

    const handleCreateSequence = () => {
        if (!sequenceName.trim()) {
            toast.error("Entrez un nom pour la séquence");
            return;
        }

        if (selectedScenes.length === 0) {
            toast.error("Sélectionnez au moins une scène");
            return;
        }

        const newSequence = {
            id: Date.now(),
            name: sequenceName,
            color: sequenceColor,
            sceneIndexes: selectedScenes.sort((a, b) => a - b)
        };

        let updatedSequences;
        if (editingSequence !== null) {
            updatedSequences = sequences.map(seq => 
                seq.id === editingSequence.id ? newSequence : seq
            );
            toast.success("Séquence mise à jour");
        } else {
            updatedSequences = [...sequences, newSequence];
            toast.success("Séquence créée");
        }

        onUpdateSequences(updatedSequences);
        resetForm();
    };

    const handleEditSequence = (sequence) => {
        setEditingSequence(sequence);
        setSequenceName(sequence.name);
        setSequenceColor(sequence.color);
        setSelectedScenes(sequence.sceneIndexes);
    };

    const handleDeleteSequence = (sequenceId) => {
        if (confirm("Supprimer cette séquence ?")) {
            const updatedSequences = sequences.filter(seq => seq.id !== sequenceId);
            onUpdateSequences(updatedSequences);
            toast.success("Séquence supprimée");
        }
    };

    const resetForm = () => {
        setEditingSequence(null);
        setSequenceName("");
        setSequenceColor("#3b82f6");
        setSelectedScenes([]);
    };

    const toggleSceneSelection = (index) => {
        if (selectedScenes.includes(index)) {
            setSelectedScenes(selectedScenes.filter(i => i !== index));
        } else {
            setSelectedScenes([...selectedScenes, index]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-500" />
                        Gestion des Séquences
                        <Badge className="bg-blue-500">{sequences.length} séquences</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
                    {/* Left: Create/Edit Sequence */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">
                                        {editingSequence ? "Modifier la Séquence" : "Nouvelle Séquence"}
                                    </Label>
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-600 mb-1 block">Nom</Label>
                                    <Input
                                        placeholder="Ex: Scènes d'intro"
                                        value={sequenceName}
                                        onChange={(e) => setSequenceName(e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-600 mb-2 block">Couleur</Label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {colors.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setSequenceColor(color.value)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                                                    sequenceColor === color.value 
                                                        ? 'border-slate-900 ring-2 ring-slate-300' 
                                                        : 'border-slate-200'
                                                }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-600 mb-2 block">
                                        Scènes ({selectedScenes.length} sélectionnées)
                                    </Label>
                                    <ScrollArea className="h-48 border rounded-lg p-2">
                                        <div className="space-y-1">
                                            {scenes.map((scene, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => toggleSceneSelection(idx)}
                                                    className={`w-full text-left p-2 rounded text-xs transition-all ${
                                                        selectedScenes.includes(idx)
                                                            ? 'bg-blue-100 border-2 border-blue-500'
                                                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">S{idx + 1}</span>
                                                        <span className="text-slate-600 truncate">
                                                            {scene.description || scene.visual_description || 'Sans description'}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div className="flex gap-2">
                                    {editingSequence && (
                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                            className="flex-1"
                                        >
                                            Annuler
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleCreateSequence}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        {editingSequence ? "Mettre à jour" : "Créer"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Sequences List */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold">Séquences Existantes</Label>
                        <ScrollArea className="h-[calc(90vh-200px)]">
                            <div className="space-y-3 pr-4">
                                {sequences.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Aucune séquence créée</p>
                                        <p className="text-xs mt-1">Créez des séquences pour organiser vos scènes</p>
                                    </div>
                                ) : (
                                    sequences.map((sequence) => (
                                        <Card key={sequence.id} className="border-l-4" style={{ borderLeftColor: sequence.color }}>
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: sequence.color }}
                                                        />
                                                        <span className="font-semibold text-slate-800">
                                                            {sequence.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditSequence(sequence)}
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteSequence(sequence.id)}
                                                            className="h-7 w-7 p-0 text-red-500"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {sequence.sceneIndexes.map(idx => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-[10px]"
                                                            style={{ 
                                                                borderColor: sequence.color,
                                                                color: sequence.color
                                                            }}
                                                        >
                                                            S{idx + 1}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="mt-2 text-xs text-slate-500">
                                                    {sequence.sceneIndexes.length} scène(s)
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}