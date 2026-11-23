import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, Film, Palette } from "lucide-react";

const VIDEO_STYLES = [
    { id: 'anime', name: 'Anime', emoji: '🎌', color: 'from-pink-500 to-purple-500', desc: 'Style japonais, cel shading' },
    { id: 'cartoon', name: 'Cartoon 3D', emoji: '🎬', color: 'from-blue-400 to-cyan-400', desc: 'Style Pixar/Disney' },
    { id: 'cinematic', name: 'Cinématique', emoji: '🎥', color: 'from-amber-600 to-orange-500', desc: 'Film hollywoodien' },
    { id: 'realistic', name: 'Réaliste', emoji: '📷', color: 'from-slate-600 to-gray-500', desc: 'Photoréaliste 8K' },
    { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🌃', color: 'from-purple-600 to-cyan-500', desc: 'Néon, futuriste' },
    { id: 'watercolor', name: 'Aquarelle', emoji: '🎨', color: 'from-teal-400 to-blue-400', desc: 'Peinture artistique' },
    { id: 'noir', name: 'Film Noir', emoji: '🎩', color: 'from-gray-700 to-black', desc: 'N&B dramatique' },
    { id: 'fantasy', name: 'Fantasy', emoji: '🧙', color: 'from-indigo-500 to-purple-600', desc: 'Épique magique' },
    { id: 'retro', name: 'Rétro 80s', emoji: '📼', color: 'from-pink-600 to-orange-500', desc: 'VHS synthwave' },
    { id: 'documentary', name: 'Documentaire', emoji: '🎞️', color: 'from-green-600 to-teal-500', desc: 'Style authentique' }
];

export default function VideoStyleSelector({ selectedStyle, onSelectStyle, onApply, isApplying }) {
    const [strength, setStrength] = useState([0.7]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Styles de Génération Vidéo</h3>
                <Badge variant="outline" className="ml-auto text-xs">IA intégrée</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {VIDEO_STYLES.map((style) => (
                    <Card
                        key={style.id}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedStyle === style.id 
                                ? 'ring-2 ring-purple-500 shadow-lg' 
                                : 'hover:shadow-md'
                        }`}
                        onClick={() => onSelectStyle(style.id)}
                    >
                        <CardContent className="p-3 text-center">
                            <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center text-2xl mb-2 shadow-inner`}>
                                {style.emoji}
                            </div>
                            <div className="font-medium text-sm">{style.name}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{style.desc}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedStyle && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-purple-800">
                            Style: {VIDEO_STYLES.find(s => s.id === selectedStyle)?.name}
                        </Label>
                        <span className="text-xs text-purple-600 font-mono">
                            Intensité: {Math.round(strength[0] * 100)}%
                        </span>
                    </div>
                    
                    <Slider
                        value={strength}
                        onValueChange={setStrength}
                        min={0.3}
                        max={1.0}
                        step={0.05}
                        className="[&_[role=slider]]:bg-purple-500"
                    />
                    
                    <div className="flex justify-between text-[10px] text-purple-500">
                        <span>Subtil</span>
                        <span>Équilibré</span>
                        <span>Intense</span>
                    </div>

                    <Button 
                        onClick={() => onApply({ style: selectedStyle, strength: strength[0] })}
                        disabled={isApplying}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                        {isApplying ? (
                            <>
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Appliquer le Style
                            </>
                        )}
                    </Button>
                </div>
            )}

            <div className="text-[10px] text-slate-400 text-center">
                💡 Les styles sont appliqués lors de la génération via nos serveurs IA (pas de clé API requise)
            </div>
        </div>
    );
}

export { VIDEO_STYLES };