import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Play, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function KeyframeEditor({ isOpen, onClose, sceneIndex, sceneDuration, initialKeyframes, onSave }) {
    const [keyframes, setKeyframes] = useState(initialKeyframes || []);
    const [selectedProperty, setSelectedProperty] = useState('opacity');

    const properties = [
        { value: 'opacity', label: 'Opacité', min: 0, max: 1, step: 0.1 },
        { value: 'scale', label: 'Échelle', min: 0.5, max: 3, step: 0.1 },
        { value: 'rotation', label: 'Rotation', min: -360, max: 360, step: 5 },
        { value: 'blur', label: 'Flou', min: 0, max: 20, step: 1 },
        { value: 'brightness', label: 'Luminosité', min: 0, max: 2, step: 0.1 },
        { value: 'contrast', label: 'Contraste', min: 0, max: 2, step: 0.1 },
        { value: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.1 }
    ];

    const addKeyframe = () => {
        const newKeyframe = {
            id: Date.now(),
            time: sceneDuration / 2,
            property: selectedProperty,
            value: 1,
            easing: 'linear'
        };
        setKeyframes([...keyframes, newKeyframe].sort((a, b) => a.time - b.time));
        toast.success("Keyframe ajouté");
    };

    const updateKeyframe = (id, updates) => {
        setKeyframes(keyframes.map(kf => kf.id === id ? { ...kf, ...updates } : kf));
    };

    const deleteKeyframe = (id) => {
        setKeyframes(keyframes.filter(kf => kf.id !== id));
        toast.success("Keyframe supprimé");
    };

    const handleSave = () => {
        onSave(sceneIndex, keyframes);
        onClose();
        toast.success("Keyframes enregistrés");
    };

    const getPropertyConfig = (prop) => properties.find(p => p.value === prop) || properties[0];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Éditeur de Keyframes - Scène {sceneIndex + 1}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Timeline Visualization */}
                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                        <div className="relative h-16 bg-slate-950 rounded border border-slate-700">
                            {/* Time markers */}
                            {Array.from({ length: 11 }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute top-0 bottom-0 border-l border-slate-700"
                                    style={{ left: `${i * 10}%` }}
                                >
                                    <span className="absolute -bottom-5 -translate-x-1/2 text-[9px] text-slate-500">
                                        {((sceneDuration * i) / 10).toFixed(1)}s
                                    </span>
                                </div>
                            ))}
                            
                            {/* Keyframes */}
                            {keyframes.map(kf => (
                                <div
                                    key={kf.id}
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                                    style={{ left: `${(kf.time / sceneDuration) * 100}%` }}
                                    title={`${kf.property}: ${kf.value} @ ${kf.time.toFixed(1)}s`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Add Keyframe */}
                    <div className="flex gap-2">
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                        >
                            {properties.map(prop => (
                                <option key={prop.value} value={prop.value}>{prop.label}</option>
                            ))}
                        </select>
                        <Button onClick={addKeyframe} className="bg-amber-500 hover:bg-amber-600">
                            <Plus className="w-4 h-4 mr-1" />
                            Ajouter Keyframe
                        </Button>
                    </div>

                    {/* Keyframes List */}
                    <div className="space-y-2">
                        {keyframes.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucun keyframe. Ajoutez-en pour animer les propriétés.</p>
                            </div>
                        ) : (
                            keyframes.map(kf => {
                                const config = getPropertyConfig(kf.property);
                                return (
                                    <div key={kf.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-amber-400">
                                                {config.label}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteKeyframe(kf.id)}
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-slate-400">Temps (s)</Label>
                                                <Input
                                                    type="number"
                                                    value={kf.time}
                                                    onChange={(e) => updateKeyframe(kf.id, { time: Math.min(sceneDuration, Math.max(0, parseFloat(e.target.value))) })}
                                                    min={0}
                                                    max={sceneDuration}
                                                    step={0.1}
                                                    className="bg-slate-900 border-slate-700 h-8 text-xs"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-slate-400">Easing</Label>
                                                <select
                                                    value={kf.easing}
                                                    onChange={(e) => updateKeyframe(kf.id, { easing: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white h-8"
                                                >
                                                    <option value="linear">Linear</option>
                                                    <option value="ease-in">Ease In</option>
                                                    <option value="ease-out">Ease Out</option>
                                                    <option value="ease-in-out">Ease In-Out</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>Valeur</span>
                                                <span>{kf.value.toFixed(2)}</span>
                                            </div>
                                            <Slider
                                                value={[kf.value]}
                                                onValueChange={([val]) => updateKeyframe(kf.id, { value: val })}
                                                min={config.min}
                                                max={config.max}
                                                step={config.step}
                                                className="[&_[role=slider]]:bg-amber-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex gap-2 border-t border-slate-800 pt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Annuler
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-amber-500 hover:bg-amber-600">
                        Enregistrer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}