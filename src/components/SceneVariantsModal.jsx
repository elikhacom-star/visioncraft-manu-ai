import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SceneVariantsModal({ 
    isOpen, 
    onClose, 
    variants, 
    currentImage, 
    onSelectVariant,
    onRegenerateVariant,
    sceneDescription,
    selectedVariantIndex,
    onGenerateNarrative, // New Prop
    onApplyNarrative // New Prop
}) {
    const [regeneratingIndex, setRegeneratingIndex] = useState(null);
    const [customPrompts, setCustomPrompts] = useState({});
    const [narrativeVariants, setNarrativeVariants] = useState(null);
    const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
    
    if (!variants || variants.length === 0) return null;

    const allOptions = [currentImage, ...variants];

    const handleRegenerate = async (index) => {
        if (index === 0) return; // Can't regenerate original
        
        setRegeneratingIndex(index);
        const customPrompt = customPrompts[index] || '';
        await onRegenerateVariant(index - 1, customPrompt); // -1 because index 0 is original
        setRegeneratingIndex(null);
    };

    const handleGenerateNarratives = async () => {
        setIsGeneratingNarrative(true);
        try {
            const results = await onGenerateNarrative();
            setNarrativeVariants(results);
        } finally {
            setIsGeneratingNarrative(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Creative Variants
                    </DialogTitle>
                    <DialogDescription>
                        Explore visual and narrative alternatives for this scene.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="visual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="visual">Visual Variants (Images)</TabsTrigger>
                        <TabsTrigger value="narrative">Narrative Branching (Script)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visual">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-2">
                    {allOptions.map((option, index) => {
                        const isSelected = selectedVariantIndex === index;
                        const isOriginal = index === 0;
                        
                        return (
                            <div 
                                key={index}
                                className="relative group"
                            >
                                <div className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected ? 'border-green-500 shadow-lg' : 'border-gray-200 group-hover:border-amber-400'
                                }`}>
                                    <img 
                                        src={option.url} 
                                        alt={`Variant ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {regeneratingIndex === index && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {isOriginal ? 'Original' : `Variant ${index}`}
                                            </span>
                                            {isSelected && (
                                                <Badge className="bg-green-500 text-white text-xs">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                onSelectVariant(option.url, index);
                                            }}
                                            className={isSelected 
                                                ? "bg-green-500 hover:bg-green-600 text-white h-7 px-2" 
                                                : "bg-amber-500 hover:bg-amber-600 text-white h-7 px-2"
                                            }
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Selected
                                                </>
                                            ) : (
                                                'Use This'
                                            )}
                                        </Button>
                                    </div>
                                    
                                    {!isOriginal && (
                                        <div className="space-y-1">
                                            <Input
                                                placeholder="Add custom prompt (e.g., more dramatic)"
                                                value={customPrompts[index] || ''}
                                                onChange={(e) => setCustomPrompts({
                                                    ...customPrompts,
                                                    [index]: e.target.value
                                                })}
                                                className="h-8 text-xs"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRegenerate(index)}
                                                disabled={regeneratingIndex !== null}
                                                className="w-full h-7 text-xs"
                                            >
                                                <RefreshCw className={`w-3 h-3 mr-1 ${regeneratingIndex === index ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                        </div>
                    </TabsContent>

                    <TabsContent value="narrative" className="space-y-4">
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                            <Sparkles className="w-10 h-10 text-amber-400 mb-3" />
                            <h3 className="font-semibold text-slate-700">Explore Different Story Paths</h3>
                            <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">
                                Use AI to generate alternative plot directions, unexpected twists, or different tonal shifts for this scene.
                            </p>
                            <Button 
                                onClick={handleGenerateNarratives}
                                disabled={isGeneratingNarrative}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isGeneratingNarrative ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Brainstorming Ideas...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate 3 Narrative Branches
                                    </>
                                )}
                            </Button>
                        </div>

                        {narrativeVariants && (
                            <div className="grid gap-4 animate-in slide-in-from-bottom-2">
                                {narrativeVariants.map((nv, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg text-slate-800">{nv.title}</h4>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                Option {idx + 1}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            {nv.description}
                                        </p>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="w-full bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 group-hover:bg-amber-100"
                                            onClick={() => {
                                                onApplyNarrative(nv);
                                                onClose();
                                            }}
                                        >
                                            Apply This Narrative
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}