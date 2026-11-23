import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Film, Upload, Wand2, Zap, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import VideoStyleSelector, { VIDEO_STYLES } from "./VideoStyleSelector";

export default function AdvancedVideoGenerator({ isOpen, onClose, onVideoGenerated }) {
    const [activeTab, setActiveTab] = useState("text2video");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Text-to-Video state
    const [prompt, setPrompt] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [duration, setDuration] = useState([5]);
    const [model, setModel] = useState("auto");
    const [guidanceScale, setGuidanceScale] = useState([7.5]);
    
    // Video-to-Video state
    const [sourceVideo, setSourceVideo] = useState(null);
    const [sourceVideoUrl, setSourceVideoUrl] = useState(null);
    const [targetStyle, setTargetStyle] = useState(null);
    const [styleStrength, setStyleStrength] = useState([0.7]);
    const [preserveMotion, setPreserveMotion] = useState(true);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setSourceVideo(file);
        setSourceVideoUrl(URL.createObjectURL(file));
    };

    const generateTextToVideo = async () => {
        if (!prompt.trim()) {
            toast.error("Entrez une description pour la vidéo");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await base44.functions.invoke('generateVideoFromText', {
                prompt: prompt,
                negative_prompt: negativePrompt || "blurry, low quality, distorted, watermark",
                guidance_scale: guidanceScale[0],
                num_frames: Math.round(duration[0] * 8), // ~8 fps approximation
                model: model,
                style_preset: selectedStyle,
                duration: duration[0]
            });

            if (response.data?.success && response.data?.videoBase64) {
                const binaryString = atob(response.data.videoBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: response.data.contentType || 'video/mp4' });
                const url = URL.createObjectURL(blob);
                
                onVideoGenerated?.({
                    url,
                    blob,
                    type: 'generated',
                    style: selectedStyle,
                    prompt: prompt
                });
                
                toast.success("Vidéo générée avec succès!");
                onClose();
            } else {
                toast.error(response.data?.error || "Échec de la génération");
            }
        } catch (error) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const transformVideoStyle = async () => {
        if (!sourceVideo || !targetStyle) {
            toast.error("Sélectionnez une vidéo et un style");
            return;
        }

        setIsGenerating(true);
        try {
            // Upload source video first
            const { file_url } = await base44.integrations.Core.UploadFile({ file: sourceVideo });
            
            const response = await base44.functions.invoke('animateVideoStyle', {
                video_url: file_url,
                style: targetStyle,
                strength: styleStrength[0],
                preserve_motion: preserveMotion
            });

            if (response.data?.success) {
                const videoUrl = response.data.videoUrl;
                
                if (videoUrl) {
                    onVideoGenerated?.({
                        url: videoUrl,
                        type: 'styled',
                        style: targetStyle,
                        originalVideo: sourceVideoUrl
                    });
                    
                    toast.success(`Style "${targetStyle}" appliqué!`);
                    onClose();
                } else {
                    toast.info(response.data.message || "Transformation partielle");
                }
            } else {
                toast.error(response.data?.error || "Échec de la transformation");
            }
        } catch (error) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Générateur Vidéo IA Avancé
                    </DialogTitle>
                    <DialogDescription>
                        Créez des vidéos à partir de texte ou transformez vos vidéos avec des styles artistiques
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text2video">
                            <Film className="w-4 h-4 mr-2" />
                            Texte → Vidéo
                        </TabsTrigger>
                        <TabsTrigger value="video2video">
                            <Palette className="w-4 h-4 mr-2" />
                            Style Transfer
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text2video" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Description de la vidéo *</Label>
                            <Textarea
                                placeholder="Ex: Un astronaute marchant sur Mars au coucher du soleil, cinématique, 4K..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Prompt négatif (optionnel)</Label>
                            <Input
                                placeholder="Ce qu'il faut éviter: flou, distorsion..."
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                            />
                        </div>

                        <VideoStyleSelector
                            selectedStyle={selectedStyle}
                            onSelectStyle={setSelectedStyle}
                            onApply={() => {}}
                            isApplying={false}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Durée</Label>
                                    <span className="text-xs text-slate-500">{duration[0]}s</span>
                                </div>
                                <Slider
                                    value={duration}
                                    onValueChange={setDuration}
                                    min={2}
                                    max={10}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Guidance</Label>
                                    <span className="text-xs text-slate-500">{guidanceScale[0]}</span>
                                </div>
                                <Slider
                                    value={guidanceScale}
                                    onValueChange={setGuidanceScale}
                                    min={5}
                                    max={15}
                                    step={0.5}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Modèle IA</Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">🤖 Auto (meilleur disponible)</SelectItem>
                                    <SelectItem value="fal-ltxv">⚡ LTX-Video (Lightricks)</SelectItem>
                                    <SelectItem value="fal-mochi">🎬 Mochi-1 (Genmo)</SelectItem>
                                    <SelectItem value="fal-hunyuan">🐉 HunyuanVideo (Tencent)</SelectItem>
                                    <SelectItem value="stability-svd">🎨 Stable Video (Stability)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-400">
                                Tous les modèles utilisent nos clés API intégrées - aucune configuration requise
                            </p>
                        </div>

                        <Button 
                            onClick={generateTextToVideo}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Génération en cours (~30-60s)...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Générer la Vidéo
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="video2video" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Vidéo source</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label htmlFor="video-upload" className="cursor-pointer">
                                    {sourceVideoUrl ? (
                                        <div className="space-y-2">
                                            <video 
                                                src={sourceVideoUrl} 
                                                className="max-h-40 mx-auto rounded-lg"
                                                controls
                                            />
                                            <p className="text-xs text-slate-500">Cliquez pour changer</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="w-10 h-10 mx-auto text-slate-400" />
                                            <p className="text-sm text-slate-600">Cliquez pour uploader une vidéo</p>
                                            <p className="text-xs text-slate-400">MP4, WebM, MOV (max 50MB)</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Style cible</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {VIDEO_STYLES.slice(0, 8).map((style) => (
                                    <Card
                                        key={style.id}
                                        className={`cursor-pointer transition-all hover:scale-105 ${
                                            targetStyle === style.id 
                                                ? 'ring-2 ring-purple-500 shadow-lg' 
                                                : 'hover:shadow-md'
                                        }`}
                                        onClick={() => setTargetStyle(style.id)}
                                    >
                                        <CardContent className="p-2 text-center">
                                            <div className="text-xl mb-1">{style.emoji}</div>
                                            <div className="text-xs font-medium">{style.name}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Intensité du style</Label>
                                <span className="text-xs text-slate-500">{Math.round(styleStrength[0] * 100)}%</span>
                            </div>
                            <Slider
                                value={styleStrength}
                                onValueChange={setStyleStrength}
                                min={0.3}
                                max={1.0}
                                step={0.05}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="preserve-motion"
                                checked={preserveMotion}
                                onChange={(e) => setPreserveMotion(e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="preserve-motion" className="cursor-pointer text-sm">
                                Préserver les mouvements originaux
                            </Label>
                        </div>

                        <Button 
                            onClick={transformVideoStyle}
                            disabled={isGenerating || !sourceVideo || !targetStyle}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Transformation en cours...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Transformer la Vidéo
                                </>
                            )}
                        </Button>

                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-xs text-purple-700">
                            <strong>💡 Conseil:</strong> Pour de meilleurs résultats, utilisez des vidéos courtes (5-15s) avec des mouvements fluides.
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}