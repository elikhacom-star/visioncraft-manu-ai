import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitBranch, Wand2, Check, ArrowRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useLanguage } from './LanguageProvider';

export default function NarrativeBranchingModal({ 
    isOpen, 
    onClose, 
    scene, 
    sceneIndex,
    fullScript,
    onApplyBranch 
}) {
    const { t } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isApplying, setIsApplying] = useState(false);

    const generateBranches = async () => {
        setIsGenerating(true);
        try {
            const prompt = `
                Tu es un scénariste créatif expert. Analyse cette scène et génère 3 branches narratives RADICALEMENT DIFFÉRENTES qui pourraient suivre.
                
                Contexte de l'histoire: "${fullScript?.substring(0, 500)}"
                
                Scène actuelle:
                - Description: "${scene.description}"
                - Dialogue: "${scene.dialogue}"
                - Mood: "${scene.mood || 'neutral'}"
                
                Pour chaque branche, fournis:
                1. Un titre accrocheur (5-7 mots)
                2. Un résumé de l'impact narratif (1 phrase)
                3. Une description visuelle détaillée pour la génération d'image
                4. Un nouveau dialogue qui reflète la direction choisie
                5. Le mood/ton de la scène
                6. Les conséquences narratives potentielles
                
                Crée 3 branches très distinctes:
                - Branche 1: Évolution dramatique/intense
                - Branche 2: Tournant inattendu/twist
                - Branche 3: Développement émotionnel/introspectif
                
                Format JSON:
                {
                    "branches": [
                        {
                            "title": "...",
                            "summary": "...",
                            "visualDescription": "...",
                            "dialogue": "...",
                            "mood": "...",
                            "consequences": "...",
                            "tone": "dramatic|suspenseful|emotional|action|mystery"
                        }
                    ]
                }
            `;
            
            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        branches: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    visualDescription: { type: "string" },
                                    dialogue: { type: "string" },
                                    mood: { type: "string" },
                                    consequences: { type: "string" },
                                    tone: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });
            
            if (response?.branches) {
                setBranches(response.branches);
                toast.success("3 branches narratives générées !");
            }
        } catch (error) {
            console.error(error);
            toast.error("Échec de la génération des branches");
        } finally {
            setIsGenerating(false);
        }
    };

    const applyBranch = async (branch, branchIndex) => {
        setIsApplying(true);
        try {
            toast.loading("Application de la branche narrative...");
            
            // Appliquer la branche avec régénération automatique des visuels
            await onApplyBranch({
                sceneIndex,
                newDescription: branch.visualDescription,
                newDialogue: branch.dialogue,
                newMood: branch.mood,
                branchTitle: branch.title,
                consequences: branch.consequences,
                regenerateVisuals: true
            });
            
            toast.dismiss();
            toast.success(`Branche "${branch.title}" appliquée !`);
            onClose();
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Échec de l'application de la branche");
        } finally {
            setIsApplying(false);
        }
    };

    const getToneColor = (tone) => {
        const colors = {
            dramatic: 'bg-red-100 text-red-700 border-red-200',
            suspenseful: 'bg-purple-100 text-purple-700 border-purple-200',
            emotional: 'bg-pink-100 text-pink-700 border-pink-200',
            action: 'bg-orange-100 text-orange-700 border-orange-200',
            mystery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[tone] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <GitBranch className="w-5 h-5 text-amber-500" />
                        Branchement Narratif - Scène {sceneIndex + 1}
                    </DialogTitle>
                    <DialogDescription>
                        Explorez différentes directions narratives et choisissez celle qui enrichit votre histoire.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Scène actuelle */}
                    <Card className="border-2 border-slate-300 bg-slate-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-slate-200">Scène Actuelle</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{scene.description}</p>
                            <p className="text-xs text-slate-500 italic">"{scene.dialogue}"</p>
                        </CardContent>
                    </Card>

                    {branches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <GitBranch className="w-16 h-16 text-amber-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                Créez des branches narratives alternatives
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-md">
                                L'IA va générer 3 directions narratives distinctes pour cette scène, 
                                chacune avec ses propres conséquences et visuels.
                            </p>
                            <Button
                                onClick={generateBranches}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                                size="lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Génération en cours...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Générer les Branches
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Choisissez votre direction narrative
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={generateBranches}
                                    disabled={isGenerating}
                                    className="text-amber-600 hover:text-amber-700"
                                >
                                    <Wand2 className="w-4 h-4 mr-1" />
                                    Régénérer
                                </Button>
                            </div>

                            {branches.map((branch, idx) => (
                                <Card 
                                    key={idx}
                                    className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                                        selectedBranch === idx 
                                            ? 'border-amber-500 shadow-md ring-2 ring-amber-200 bg-amber-50' 
                                            : 'border-slate-200 hover:border-amber-300'
                                    }`}
                                    onClick={() => setSelectedBranch(idx)}
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-amber-500 text-white">
                                                        Branche {idx + 1}
                                                    </Badge>
                                                    <Badge variant="outline" className={getToneColor(branch.tone)}>
                                                        {branch.tone}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-bold text-slate-800 mb-1 text-lg">
                                                    {branch.title}
                                                </h4>
                                                <p className="text-sm text-slate-600 mb-3 italic">
                                                    {branch.summary}
                                                </p>
                                            </div>
                                            {selectedBranch === idx && (
                                                <Check className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                            )}
                                        </div>

                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                            <div className="text-xs text-slate-500 mb-1 font-semibold">Visuel:</div>
                                            <p className="text-xs text-slate-700">{branch.visualDescription}</p>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                            <div className="text-xs text-blue-600 mb-1 font-semibold">Dialogue:</div>
                                            <p className="text-xs text-blue-800 italic">"{branch.dialogue}"</p>
                                        </div>

                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                            <div className="text-xs text-purple-600 mb-1 font-semibold flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3" />
                                                Conséquences Narratives:
                                            </div>
                                            <p className="text-xs text-purple-800">{branch.consequences}</p>
                                        </div>

                                        {selectedBranch === idx && (
                                            <Button
                                                onClick={() => applyBranch(branch, idx)}
                                                disabled={isApplying}
                                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                                            >
                                                {isApplying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Application...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Appliquer cette Branche
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}