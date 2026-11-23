import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Palette, Droplet, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export default function ColorOverlayEditor({ isOpen, onClose, sceneIndex, initialOverlay, onSave }) {
    const [overlay, setOverlay] = useState(initialOverlay || {
        enabled: false,
        color: '#ff6b35',
        opacity: 0.3,
        blendMode: 'overlay'
    });

    const presetColors = [
        { name: 'Cinématic Orange', color: '#ff6b35', mood: '🔥' },
        { name: 'Cool Blue', color: '#0077b6', mood: '❄️' },
        { name: 'Vintage Sepia', color: '#d4a574', mood: '📼' },
        { name: 'Noir Mystery', color: '#1a1a2e', mood: '🌙' },
        { name: 'Neon Purple', color: '#9d4edd', mood: '💜' },
        { name: 'Warm Sunset', color: '#fb8500', mood: '🌅' },
        { name: 'Forest Green', color: '#2d6a4f', mood: '🌲' },
        { name: 'Rose Gold', color: '#f08080', mood: '🌸' }
    ];

    const blendModes = [
        { value: 'overlay', label: 'Overlay' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'screen', label: 'Screen' },
        { value: 'color', label: 'Color' },
        { value: 'hard-light', label: 'Hard Light' },
        { value: 'soft-light', label: 'Soft Light' }
    ];

    const handleSave = () => {
        onSave(sceneIndex, overlay);
        onClose();
        toast.success("Overlay de couleur appliqué");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-amber-500" />
                        Filtres de Couleur - Scène {sceneIndex + 1}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <Label className="text-sm">Activer le filtre de couleur</Label>
                        <Button
                            variant={overlay.enabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOverlay({ ...overlay, enabled: !overlay.enabled })}
                            className={overlay.enabled ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                            {overlay.enabled ? 'Activé' : 'Désactivé'}
                        </Button>
                    </div>

                    {overlay.enabled && (
                        <>
                            {/* Preview */}
                            <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: overlay.color,
                                        opacity: overlay.opacity,
                                        mixBlendMode: overlay.blendMode
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                                    Aperçu du Filtre
                                </div>
                            </div>

                            {/* Color Presets */}
                            <div>
                                <Label className="text-sm mb-2 block">Préréglages Cinématiques</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {presetColors.map(preset => (
                                        <button
                                            key={preset.color}
                                            onClick={() => setOverlay({ ...overlay, color: preset.color })}
                                            className={`relative h-16 rounded-lg border-2 transition-all hover:scale-105 ${
                                                overlay.color === preset.color ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-600'
                                            }`}
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.name}
                                        >
                                            <span className="absolute top-1 right-1 text-lg">{preset.mood}</span>
                                            <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1 rounded">
                                                {preset.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Color Picker */}
                            <div>
                                <Label className="text-sm mb-2 block">Couleur Personnalisée</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={overlay.color}
                                        onChange={(e) => setOverlay({ ...overlay, color: e.target.value })}
                                        className="h-10 w-20 rounded border border-slate-700 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={overlay.color}
                                        onChange={(e) => setOverlay({ ...overlay, color: e.target.value })}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 text-sm text-white"
                                    />
                                </div>
                            </div>

                            {/* Opacity */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <Label>Opacité</Label>
                                    <span className="text-slate-400">{Math.round(overlay.opacity * 100)}%</span>
                                </div>
                                <Slider
                                    value={[overlay.opacity]}
                                    onValueChange={([val]) => setOverlay({ ...overlay, opacity: val })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    className="[&_[role=slider]]:bg-amber-500"
                                />
                            </div>

                            {/* Blend Mode */}
                            <div>
                                <Label className="text-sm mb-2 block">Mode de Fusion</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {blendModes.map(mode => (
                                        <button
                                            key={mode.value}
                                            onClick={() => setOverlay({ ...overlay, blendMode: mode.value })}
                                            className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                                                overlay.blendMode === mode.value
                                                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-2 border-t border-slate-800 pt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Annuler
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-amber-500 hover:bg-amber-600">
                        Appliquer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}