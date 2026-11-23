import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Download, Upload, Trash2, Play, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SceneTemplates({ isOpen, onClose, currentScene, onApplyTemplate }) {
    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            const saved = localStorage.getItem('sceneTemplates');
            if (saved) {
                setTemplates(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveTemplates = (newTemplates) => {
        localStorage.setItem('sceneTemplates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    };

    const handleSaveAsTemplate = () => {
        if (!templateName.trim()) {
            toast.error("Entrez un nom pour le modèle");
            return;
        }

        if (!currentScene) {
            toast.error("Aucune scène sélectionnée");
            return;
        }

        const newTemplate = {
            id: Date.now(),
            name: templateName,
            description: templateDescription,
            createdAt: new Date().toISOString(),
            scene: {
                duration: currentScene.duration || 5,
                effect: currentScene.effect,
                effectIntensity: currentScene.effectIntensity,
                overlayText: currentScene.overlayText,
                transition: currentScene.transition,
                transitionDuration: currentScene.transitionDuration,
                mood: currentScene.mood,
                speed: currentScene.speed,
                filters: currentScene.filters
            }
        };

        const updatedTemplates = [...templates, newTemplate];
        saveTemplates(updatedTemplates);
        
        setTemplateName("");
        setTemplateDescription("");
        toast.success("Modèle de scène enregistré !");
    };

    const handleApply = (template) => {
        onApplyTemplate(template.scene);
        toast.success(`Modèle "${template.name}" appliqué !`);
        onClose();
    };

    const handleDelete = (templateId) => {
        if (confirm("Supprimer ce modèle ?")) {
            const updatedTemplates = templates.filter(t => t.id !== templateId);
            saveTemplates(updatedTemplates);
            toast.success("Modèle supprimé");
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(templates, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scene-templates-${Date.now()}.json`;
        link.click();
        toast.success("Modèles exportés");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    const merged = [...templates, ...imported];
                    saveTemplates(merged);
                    toast.success(`${imported.length} modèle(s) importé(s)`);
                }
            } catch (error) {
                toast.error("Fichier invalide");
            }
        };
        reader.readAsText(file);
    };

    // Built-in templates
    const builtInTemplates = [
        {
            id: 'builtin-1',
            name: "Intro Cinématique",
            description: "Zoom in lent avec texte d'ouverture",
            scene: {
                duration: 6,
                effect: 'zoom-in',
                effectIntensity: 0.8,
                overlayText: "Votre Titre Ici",
                transition: 'fade',
                transitionDuration: 1.0,
                mood: 'epic',
                speed: 0.8
            },
            isBuiltIn: true
        },
        {
            id: 'builtin-2',
            name: "Transition Rapide",
            description: "Pan rapide pour action",
            scene: {
                duration: 3,
                effect: 'pan-right',
                effectIntensity: 1.5,
                transition: 'wipe',
                transitionDuration: 0.3,
                mood: 'energetic',
                speed: 1.5
            },
            isBuiltIn: true
        },
        {
            id: 'builtin-3',
            name: "Scène Calme",
            description: "Mouvement doux pour ambiance contemplative",
            scene: {
                duration: 8,
                effect: 'pan-left',
                effectIntensity: 0.5,
                transition: 'dissolve',
                transitionDuration: 1.5,
                mood: 'calm',
                speed: 0.75
            },
            isBuiltIn: true
        },
        {
            id: 'builtin-4',
            name: "Glitch Dynamique",
            description: "Effet glitch pour style moderne",
            scene: {
                duration: 4,
                effect: 'glitch',
                effectIntensity: 1.2,
                transition: 'slide',
                transitionDuration: 0.5,
                mood: 'intense',
                speed: 1.2
            },
            isBuiltIn: true
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Modèles de Scènes
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="apply" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="apply">Appliquer un Modèle</TabsTrigger>
                        <TabsTrigger value="create">Créer un Modèle</TabsTrigger>
                    </TabsList>

                    <TabsContent value="apply" className="flex-1 overflow-hidden m-0 mt-4">
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="text-sm font-semibold">
                                    {templates.length + builtInTemplates.length} modèle(s) disponible(s)
                                </Label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="hidden"
                                        id="import-templates"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => document.getElementById('import-templates').click()}
                                    >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Importer
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleExport}
                                        disabled={templates.length === 0}
                                    >
                                        <Download className="w-3 h-3 mr-1" />
                                        Exporter
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="grid grid-cols-2 gap-3 pr-4">
                                    {/* Built-in Templates */}
                                    {builtInTemplates.map(template => (
                                        <Card key={template.id} className="border-2 border-purple-200 bg-purple-50/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                                            {template.name}
                                                            <Badge className="bg-purple-500 text-white text-[10px]">
                                                                Intégré
                                                            </Badge>
                                                        </h4>
                                                        <p className="text-xs text-slate-600 mt-1">
                                                            {template.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-3 mb-3">
                                                    {template.scene.effect && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {template.scene.effect}
                                                        </Badge>
                                                    )}
                                                    {template.scene.transition && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {template.scene.transition}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {template.scene.duration}s
                                                    </Badge>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApply(template)}
                                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Play className="w-3 h-3 mr-1" />
                                                    Appliquer
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {/* User Templates */}
                                    {templates.map(template => (
                                        <Card key={template.id} className="border-2 border-slate-200">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-800">
                                                            {template.name}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 mt-1">
                                                            {template.description || 'Pas de description'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(template.id)}
                                                        className="h-7 w-7 p-0 text-red-500"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>

                                                <div className="text-[10px] text-slate-500 mb-2">
                                                    Créé le {new Date(template.createdAt).toLocaleDateString()}
                                                </div>

                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {template.scene.effect && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {template.scene.effect}
                                                        </Badge>
                                                    )}
                                                    {template.scene.transition && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {template.scene.transition}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {template.scene.duration}s
                                                    </Badge>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApply(template)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Play className="w-3 h-3 mr-1" />
                                                    Appliquer
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="create" className="flex-1 overflow-hidden m-0 mt-4">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700">
                                        💡 Enregistrez la scène actuellement sélectionnée comme modèle réutilisable avec tous ses effets, textes et transitions.
                                    </p>
                                </div>

                                {currentScene ? (
                                    <Card className="border-2 border-blue-200">
                                        <CardContent className="p-4">
                                            <Label className="text-xs text-slate-600 mb-2 block">
                                                Aperçu de la scène actuelle
                                            </Label>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {currentScene.effect && currentScene.effect !== 'none' && (
                                                    <Badge className="bg-purple-500">
                                                        Effet: {currentScene.effect}
                                                    </Badge>
                                                )}
                                                {currentScene.overlayText && (
                                                    <Badge className="bg-blue-500">
                                                        Texte inclus
                                                    </Badge>
                                                )}
                                                {currentScene.transition && (
                                                    <Badge className="bg-green-500">
                                                        Transition: {currentScene.transition}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">
                                                    Durée: {currentScene.duration || 5}s
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        Sélectionnez une scène dans l'éditeur
                                    </div>
                                )}

                                <div>
                                    <Label className="text-sm mb-2 block">Nom du Modèle *</Label>
                                    <Input
                                        placeholder="Ex: Intro Dynamique"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm mb-2 block">Description</Label>
                                    <Textarea
                                        placeholder="Décrivez brièvement ce modèle..."
                                        value={templateDescription}
                                        onChange={(e) => setTemplateDescription(e.target.value)}
                                        className="h-24"
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveAsTemplate}
                                    disabled={!currentScene || !templateName.trim()}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Enregistrer comme Modèle
                                </Button>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}