import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Upload } from "lucide-react";

const STYLE_PRESETS = [
    { id: 'anime', name: 'Anime/Manga', emoji: '🎌' },
    { id: 'oil-painting', name: 'Oil Painting', emoji: '🖼️' },
    { id: 'watercolor', name: 'Watercolor', emoji: '🎨' },
    { id: 'comic-book', name: 'Comic Book', emoji: '💥' },
    { id: 'pixar', name: '3D Animation', emoji: '🎬' },
    { id: 'noir-film', name: 'Film Noir', emoji: '🎞️' },
    { id: 'cyberpunk-movie', name: 'Cyberpunk', emoji: '🌃' },
    { id: 'wes-anderson', name: 'Wes Anderson', emoji: '🎭' }
];

export default function StyleTransferModal({ isOpen, onClose, onApply, isProcessing }) {
    const [mode, setMode] = useState('preset');
    const [selectedPreset, setSelectedPreset] = useState('anime');
    const [customImage, setCustomImage] = useState(null);
    const [customImagePreview, setCustomImagePreview] = useState(null);
    const [videoStrength, setVideoStrength] = useState(0.7); // Default high strength for video
    const [temporalConsistency, setTemporalConsistency] = useState(0.5); // New Consistency State

    const handleCustomImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCustomImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setCustomImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleApply = () => {
        const config = { videoStrength, temporalConsistency };
        if (mode === 'preset') {
            onApply({ ...config, mode: 'preset', presetId: selectedPreset });
        } else {
            if (!customImage) {
                alert('Please upload a reference image');
                return;
            }
            onApply({ ...config, mode: 'custom', image: customImage });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-500" />
                        AI Style Transfer
                    </DialogTitle>
                    <DialogDescription>
                        Transform your video with AI-powered artistic styles. Choose a preset or upload your own reference image.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={setMode} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preset">Style Presets</TabsTrigger>
                        <TabsTrigger value="custom">Custom Style</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                            {STYLE_PRESETS.map(preset => (
                                <div
                                    key={preset.id}
                                    onClick={() => setSelectedPreset(preset.id)}
                                    className={`
                                        cursor-pointer p-4 rounded-lg border-2 transition-all
                                        ${selectedPreset === preset.id 
                                            ? 'border-purple-500 bg-purple-50 shadow-md' 
                                            : 'border-gray-200 hover:border-purple-300 bg-white'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{preset.emoji}</span>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm text-slate-800">{preset.name}</div>
                                            {selectedPreset === preset.id && (
                                                <Badge className="mt-1 bg-purple-500 text-white text-xs">Selected</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            <Sparkles className="w-4 h-4 inline mr-2" />
                            AI will regenerate all images to match the selected style aesthetic.
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <Label>Upload Style Reference Image</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCustomImageUpload}
                                    className="hidden"
                                    id="custom-style-upload"
                                />
                                <label htmlFor="custom-style-upload" className="cursor-pointer">
                                    {customImagePreview ? (
                                        <div className="relative">
                                            <img 
                                                src={customImagePreview} 
                                                alt="Style reference" 
                                                className="max-h-48 mx-auto rounded-lg shadow-md"
                                            />
                                            <div className="mt-3 text-sm text-gray-600">
                                                Click to change reference image
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-purple-100 rounded-full">
                                                <Upload className="w-8 h-8 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700">Upload a reference image</p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    AI will analyze and apply this style to your video
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                            <Sparkles className="w-4 h-4 inline mr-2" />
                            Upload an image with the artistic style you want (painting, photo, drawing, etc.)
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="py-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-700">Video Style Intensity</Label>
                        <div className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                            {Math.round(videoStrength * 100)}%
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Style Strength Slider */}
                        <div className="relative pt-6 pb-2">
                            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Style Strength</Label>
                            {/* Visual Guide Bar */}
                            <div className="absolute top-8 left-0 w-full flex justify-between px-1 pointer-events-none">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-gray-400 mt-2">Original</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-purple-400 mt-2">Balanced</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-purple-600 font-bold mt-2">Heavy</span>
                                </div>
                            </div>

                            <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1" 
                                value={videoStrength}
                                onChange={(e) => setVideoStrength(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-gray-200 via-purple-300 to-purple-600 rounded-lg appearance-none cursor-pointer accent-purple-700 z-10 relative mt-2"
                            />
                        </div>

                        {/* Temporal Consistency Slider */}
                        <div className="relative pt-6 pb-2">
                            <Label className="text-xs font-semibold text-slate-700 mb-2 block">Temporal Consistency</Label>
                            <div className="absolute top-8 left-0 w-full flex justify-between px-1 pointer-events-none">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-gray-400 mt-2">Fluid</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-blue-400 mt-2">Stable</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-blue-600 font-bold mt-2">Locked</span>
                                </div>
                            </div>

                            <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1" 
                                value={temporalConsistency} 
                                onChange={(e) => setTemporalConsistency(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-gray-200 via-blue-300 to-blue-600 rounded-lg appearance-none cursor-pointer accent-blue-700 z-10 relative mt-2"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 border border-slate-100 flex gap-2">
                        <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5 text-purple-400" />
                        <div className="space-y-1">
                            <p><strong>Style Strength:</strong> Controls how much the AI style overrides the original footage.</p>
                            <p><strong>Temporal Consistency:</strong> Higher values reduce flickering between frames but may limit motion.</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleApply} 
                        disabled={isProcessing || (mode === 'custom' && !customImage)}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Applying Style...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Apply Style Transfer
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}