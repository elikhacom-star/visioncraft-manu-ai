import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
    Crop, Palette, Type, Shapes, Eraser, Undo2, Redo2, 
    Download, Save, ZoomIn, ZoomOut, Move, Square, Circle,
    Minus, RotateCcw, Pencil, Sparkles, Upload, Image as ImageIcon, Loader2,
    RefreshCw, MessageSquare, Wand2
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { base44 } from "@/api/base44Client";
import StyleSelector, { getStylePrompt } from './StyleSelector';
import PromptHistoryPanel from './PromptHistoryPanel';

export default function AdvancedSceneEditor({ isOpen, onClose, scene, onSave, onRegenerate }) {
    const canvasRef = useRef(null);
    const [tool, setTool] = useState('select');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Image state
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imgRef = useRef(null);
    
    // AI Regeneration
    const [regeneratePrompt, setRegeneratePrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [customStylePrompt, setCustomStylePrompt] = useState('');
    const [promptHistory, setPromptHistory] = useState([]);
    
    // Dialogue
    const [dialogue, setDialogue] = useState('');
    const [isRegeneratingDialogue, setIsRegeneratingDialogue] = useState(false);
    
    // Upload
    const [isUploading, setIsUploading] = useState(false);
    const uploadRef = useRef(null);
    
    // Image adjustments
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [hue, setHue] = useState(0);
    const [blur, setBlur] = useState(0);
    const [sharpen, setSharpen] = useState(0);
    
    // Crop state
    const [cropArea, setCropArea] = useState(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [cropStart, setCropStart] = useState(null);
    
    // Drawing state
    const [drawColor, setDrawColor] = useState('#FFFF00');
    const [drawWidth, setDrawWidth] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState(null);
    
    // Text annotations
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [newTextContent, setNewTextContent] = useState('');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [textSize, setTextSize] = useState(32);
    
    // Shapes
    const [shapes, setShapes] = useState([]);
    const [currentShape, setCurrentShape] = useState('rectangle');
    const [shapeColor, setShapeColor] = useState('#FF0000');
    const [shapeOpacity, setShapeOpacity] = useState(0.5);
    
    // Canvas state
    const [zoom, setZoom] = useState(1);

    // Reset when scene changes
    useEffect(() => {
        if (scene && isOpen) {
            setImageUrl(scene.url || null);
            setBrightness(scene.brightness || 100);
            setContrast(scene.contrast || 100);
            setSaturation(scene.saturation || 100);
            setRegeneratePrompt(scene.description || '');
            setDialogue(scene.dialogue || '');
            setPromptHistory(scene.prompt_history || (scene.description ? [{ prompt: scene.description, url: scene.url, timestamp: scene.created_date || new Date().toISOString() }] : []));
            setHue(0);
            setBlur(0);
            setSharpen(0);
            setAnnotations([]);
            setShapes([]);
            setHistory([]);
            setHistoryIndex(-1);
            setImageLoaded(false);
            setCropArea(null);
            setTool('select');
            setZoom(1);
        }
    }, [scene, isOpen]);

    // Load image onto canvas whenever imageUrl changes
    useEffect(() => {
        if (!isOpen || !imageUrl) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            imgRef.current = img;
            setImageLoaded(true);
            
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = img.width;
                canvas.height = img.height;
                drawCanvas(img);
            }
        };
        
        img.onerror = () => {
            // Retry without crossOrigin
            const img2 = new Image();
            img2.onload = () => {
                imgRef.current = img2;
                setImageLoaded(true);
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = img2.width;
                    canvas.height = img2.height;
                    drawCanvas(img2);
                }
            };
            img2.onerror = () => {
                console.error("Failed to load image");
                setImageLoaded(false);
            };
            img2.src = imageUrl;
        };
        
        img.src = imageUrl;
    }, [imageUrl, isOpen]);

    const drawCanvas = useCallback((imgOverride) => {
        const canvas = canvasRef.current;
        const img = imgOverride || imgRef.current;
        if (!canvas || !img) return;
        
        const ctx = canvas.getContext('2d');
        
        if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        
        // Draw shapes
        shapes.forEach(shape => {
            ctx.save();
            ctx.globalAlpha = shape.opacity || 0.5;
            ctx.fillStyle = shape.color;
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = 3;
            if (shape.type === 'rectangle') {
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === 'circle') {
                ctx.beginPath();
                ctx.arc(shape.x + shape.width/2, shape.y + shape.height/2, Math.min(shape.width, shape.height)/2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
        
        // Draw annotations
        annotations.forEach((annotation, idx) => {
            ctx.save();
            ctx.font = `bold ${annotation.size || 32}px Arial`;
            ctx.fillStyle = annotation.color || '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(annotation.text, annotation.x, annotation.y);
            ctx.fillText(annotation.text, annotation.x, annotation.y);
            if (selectedAnnotation === idx) {
                const metrics = ctx.measureText(annotation.text);
                ctx.strokeStyle = '#FFAA00';
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(annotation.x - 5, annotation.y - 5, metrics.width + 10, annotation.size + 10);
                ctx.setLineDash([]);
            }
            ctx.restore();
        });
        
        // Draw crop overlay
        if (cropArea) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, cropArea.y);
            ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height);
            ctx.fillRect(cropArea.x + cropArea.width, cropArea.y, canvas.width - cropArea.x - cropArea.width, cropArea.height);
            ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height - cropArea.y - cropArea.height);
            ctx.strokeStyle = '#FFAA00';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.restore();
        }
    }, [brightness, contrast, saturation, hue, blur, shapes, annotations, selectedAnnotation, cropArea]);

    // Redraw when adjustments change
    useEffect(() => {
        if (imageLoaded) {
            drawCanvas();
        }
    }, [brightness, contrast, saturation, hue, blur, sharpen, annotations, shapes, cropArea, selectedAnnotation, imageLoaded, drawCanvas]);

    // Upload image handler
    const handleUploadImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        toast.loading("Upload de l'image...");
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            if (file_url) {
                setImageUrl(file_url);
                setImageLoaded(false);
                toast.dismiss();
                toast.success("Image uploadée !");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de l'upload");
            console.error(error);
        } finally {
            setIsUploading(false);
            if (uploadRef.current) uploadRef.current.value = '';
        }
    };

    // AI Regenerate Image
    const handleRegenerate = async () => {
        if (!regeneratePrompt.trim()) return;
        setIsRegenerating(true);
        toast.loading("Génération de l'image IA...");
        try {
            // Load characters to inject appearance into prompt
            let characterContext = '';
            try {
                const characters = await base44.entities.Character.list();
                if (characters && characters.length > 0) {
                    const text = (regeneratePrompt + ' ' + (scene?.dialogue || '')).toLowerCase();
                    const matched = characters.filter(c => text.includes(c.name.toLowerCase()));
                    if (matched.length > 0) {
                        characterContext = matched.map(c =>
                            `CHARACTER "${c.name}": ${c.description}${c.personality ? ` Personality: ${c.personality}` : ''}`
                        ).join('\n');
                    }
                }
            } catch (e) {}

            // Build prompt with style + character context
            const stylePrompt = selectedStyle && selectedStyle !== 'custom' ? getStylePrompt(selectedStyle) : customStylePrompt;
            const fullPrompt = [
                regeneratePrompt,
                characterContext ? `\nCHARACTER APPEARANCE (strictly follow):\n${characterContext}` : '',
                stylePrompt ? `\nStyle: ${stylePrompt}` : ''
            ].filter(Boolean).join('');

            const result = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
            if (result?.url) {
                setImageUrl(result.url);
                setImageLoaded(false);
                const newEntry = { prompt: fullPrompt, url: result.url, timestamp: new Date().toISOString() };
                setPromptHistory(prev => [...prev, newEntry]);
                toast.dismiss();
                toast.success("Image régénérée !");
            } else {
                throw new Error("Pas d'image générée");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Échec: " + error.message);
            console.error(error);
        } finally {
            setIsRegenerating(false);
        }
    };

    // AI Enhance Prompt
    const handleEnhancePrompt = async () => {
        setIsEnhancingPrompt(true);
        toast.loading("Amélioration du prompt...");
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an expert AI image prompt engineer. Enhance and improve this image generation prompt to be more detailed, cinematic, and visually rich. Keep the core idea but add specific details about lighting, composition, colors, atmosphere, and style. Return ONLY the enhanced prompt text, nothing else.\n\nOriginal prompt: "${regeneratePrompt}"`,
            });
            if (result) {
                const cleaned = result.replace(/^"|"$/g, '').trim();
                setRegeneratePrompt(cleaned);
                toast.dismiss();
                toast.success("Prompt amélioré !");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de l'amélioration");
            console.error(error);
        } finally {
            setIsEnhancingPrompt(false);
        }
    };

    // AI Regenerate Dialogue
    const handleRegenerateDialogue = async () => {
        setIsRegeneratingDialogue(true);
        toast.loading("Régénération du dialogue...");
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Rewrite this dialogue/narration to be more cinematic, impactful and emotional. Keep the same language. Context of the scene: "${regeneratePrompt}"\n\nOriginal dialogue: "${dialogue || 'No dialogue yet - create one based on the scene description'}"\n\nReturn ONLY the improved dialogue text.`,
            });
            if (result) {
                const cleaned = result.replace(/^"|"$/g, '').trim();
                setDialogue(cleaned);
                toast.dismiss();
                toast.success("Dialogue régénéré !");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de la régénération");
            console.error(error);
        } finally {
            setIsRegeneratingDialogue(false);
        }
    };

    const handleCanvasMouseDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (tool === 'crop') {
            setCropStart({ x, y });
            setIsDraggingCrop(true);
        } else if (tool === 'draw' || tool === 'erase') {
            setIsDrawing(true);
            setLastPoint({ x, y });
        } else if (tool === 'text') {
            const text = newTextContent || prompt('Entrez le texte:');
            if (text) {
                setAnnotations([...annotations, { x, y, text, color: textColor, size: textSize }]);
            }
        } else if (tool === 'shape') {
            setCropStart({ x, y });
            setIsDraggingCrop(true);
        }
    };

    const handleCanvasMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (isDraggingCrop && cropStart && tool === 'crop') {
            setCropArea({
                x: Math.min(cropStart.x, x),
                y: Math.min(cropStart.y, y),
                width: Math.abs(x - cropStart.x),
                height: Math.abs(y - cropStart.y)
            });
        } else if (isDrawing && lastPoint) {
            const ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = drawWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            setLastPoint({ x, y });
        }
    };

    const handleCanvasMouseUp = (e) => {
        if (isDraggingCrop && cropStart && tool === 'shape') {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            setShapes([...shapes, {
                type: currentShape,
                x: Math.min(cropStart.x, x),
                y: Math.min(cropStart.y, y),
                width: Math.abs(x - cropStart.x),
                height: Math.abs(y - cropStart.y),
                color: shapeColor,
                opacity: shapeOpacity
            }]);
        }
        setIsDraggingCrop(false);
        setCropStart(null);
        setIsDrawing(false);
        setLastPoint(null);
    };

    const applyCrop = () => {
        if (!cropArea || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropArea.width;
        tempCanvas.height = cropArea.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);
        
        const img = new Image();
        img.src = tempCanvas.toDataURL();
        img.onload = () => {
            imgRef.current = img;
            canvas.width = img.width;
            canvas.height = img.height;
            setCropArea(null);
            setTool('select');
            drawCanvas(img);
            toast.success("Image recadrée !");
        };
    };

    const resetAdjustments = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setHue(0);
        setBlur(0);
        setSharpen(0);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Redraw final state
        drawCanvas();
        
        const baseData = { description: regeneratePrompt, dialogue, brightness, contrast, saturation, prompt_history: promptHistory, _edited: true };
        canvas.toBlob((blob) => {
            if (!blob) {
                onSave({ ...scene, ...baseData, url: imageUrl });
                toast.success("Scène mise à jour !");
                onClose();
                return;
            }
            
            const file = new File([blob], `edited_scene_${Date.now()}.png`, { type: 'image/png' });
            toast.loading("Sauvegarde...");
            base44.integrations.Core.UploadFile({ file })
                .then(({ file_url }) => {
                    onSave({ ...scene, ...baseData, url: file_url });
                    toast.dismiss();
                    toast.success("Scène mise à jour !");
                    onClose();
                })
                .catch(() => {
                    toast.dismiss();
                    onSave({ ...scene, ...baseData, url: imageUrl });
                    toast.success("Scène mise à jour !");
                    onClose();
                });
        });
    };

    if (!scene) return null;

    const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 md:max-w-[95vw]">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-500" />
                        Éditeur Avancé - Scène {scene.scene_number}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)] md:h-[calc(95vh-120px)] max-h-[80vh] md:max-h-none">
                    {/* Canvas Area */}
                    <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {!imageUrl ? (
                                <div className="text-white text-center space-y-4">
                                    <ImageIcon className="w-16 h-16 mx-auto text-slate-500" />
                                    <p className="text-lg">Aucune image</p>
                                    <p className="text-sm text-slate-400">Uploadez ou générez une image</p>
                                    <Button onClick={() => uploadRef.current?.click()} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Uploader une image
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative flex items-center justify-center w-full h-full">
                                    {/* Always show img as fallback / preview */}
                                    <img 
                                        src={imageUrl} 
                                        alt="Preview" 
                                        className="max-w-full max-h-[calc(95vh-200px)] object-contain rounded shadow-2xl"
                                        style={{ 
                                            filter: cssFilter,
                                            transform: `scale(${zoom})`,
                                            display: imageLoaded ? 'none' : 'block'
                                        }}
                                    />
                                    {/* Canvas on top when loaded */}
                                    <canvas
                                        ref={canvasRef}
                                        className="max-w-full max-h-[calc(95vh-200px)] border-2 border-slate-700 shadow-2xl cursor-crosshair object-contain"
                                        style={{ 
                                            transform: `scale(${zoom})`,
                                            display: imageLoaded ? 'block' : 'none'
                                        }}
                                        onMouseDown={handleCanvasMouseDown}
                                        onMouseMove={handleCanvasMouseMove}
                                        onMouseUp={handleCanvasMouseUp}
                                        onMouseLeave={handleCanvasMouseUp}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* Toolbar Overlay */}
                        {imageUrl && (
                            <div className="absolute top-4 left-4 flex gap-1 bg-white/90 backdrop-blur rounded-lg p-1.5 shadow-lg">
                                {[
                                    { name: 'select', icon: Move, label: 'Sélection' },
                                    { name: 'crop', icon: Crop, label: 'Recadrer' },
                                    { name: 'text', icon: Type, label: 'Texte' },
                                    { name: 'shape', icon: Shapes, label: 'Forme' },
                                    { name: 'draw', icon: Pencil, label: 'Dessiner' },
                                    { name: 'erase', icon: Eraser, label: 'Gommer' }
                                ].map(({ name, icon: Icon, label }) => (
                                    <button
                                        key={name}
                                        onClick={() => setTool(name)}
                                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors ${
                                            tool === name ? 'bg-purple-500 text-white' : 'hover:bg-slate-100 text-slate-600'
                                        }`}
                                        title={label}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Zoom Controls */}
                        {imageUrl && (
                            <div className="absolute bottom-4 right-4 flex gap-2 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
                                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 rounded">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="px-3 flex items-center text-sm font-medium">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 rounded">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Crop Actions */}
                        {cropArea && tool === 'crop' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur rounded-lg p-2 shadow-lg">
                                <Button size="sm" variant="outline" onClick={() => setCropArea(null)}>Annuler</Button>
                                <Button size="sm" onClick={applyCrop} className="bg-green-600 hover:bg-green-700">
                                    Appliquer le recadrage
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - scrollable on mobile */}
                    <div className="w-full lg:w-80 bg-white border-l lg:border-l border-t lg:border-t-0 overflow-y-auto max-h-[40vh] lg:max-h-none">
                        <Tabs defaultValue="style" className="w-full">
                            <TabsList className="w-full grid grid-cols-5">
                                <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                                <TabsTrigger value="adjust" className="text-xs">Ajuster</TabsTrigger>
                                <TabsTrigger value="annotate" className="text-xs">Annoter</TabsTrigger>
                                <TabsTrigger value="effects" className="text-xs">IA</TabsTrigger>
                                <TabsTrigger value="history" className="text-xs">Historique</TabsTrigger>
                            </TabsList>

                            {/* Style Selector Tab */}
                            <TabsContent value="style" className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-purple-500" />
                                        Sélecteur de Style
                                    </h4>
                                    <p className="text-xs text-slate-500">Choisissez un style artistique parmi les catégories ci-dessous, puis régénérez l'image via l'onglet IA.</p>
                                    <StyleSelector
                                        selectedStyle={selectedStyle}
                                        onSelect={setSelectedStyle}
                                        customStylePrompt={customStylePrompt}
                                        onCustomStyleChange={setCustomStylePrompt}
                                        onUploadReference={() => {}}
                                        styleRefDescription=""
                                        isAnalyzing={false}
                                    />
                                    {selectedStyle && (
                                        <div className="pt-2">
                                            <Button
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                disabled={!regeneratePrompt.trim() || isRegenerating}
                                                onClick={handleRegenerate}
                                            >
                                                {isRegenerating ? (
                                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                                                ) : (
                                                    <><Sparkles className="w-4 h-4 mr-2" /> Régénérer avec ce style</>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Color Adjustments */}
                            <TabsContent value="adjust" className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-semibold">Color Grading</h4>
                                        <Button size="sm" variant="ghost" onClick={resetAdjustments} className="h-7 text-xs">
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Luminosité', value: brightness, set: setBrightness, min: 0, max: 200, unit: '%' },
                                            { label: 'Contraste', value: contrast, set: setContrast, min: 0, max: 200, unit: '%' },
                                            { label: 'Saturation', value: saturation, set: setSaturation, min: 0, max: 200, unit: '%' },
                                            { label: 'Teinte', value: hue, set: setHue, min: -180, max: 180, unit: '°' },
                                            { label: 'Flou', value: blur, set: setBlur, min: 0, max: 20, unit: 'px' },
                                            { label: 'Netteté', value: sharpen, set: setSharpen, min: 0, max: 100, unit: '%' },
                                        ].map(item => (
                                            <div key={item.label}>
                                                <div className="flex justify-between mb-1">
                                                    <Label className="text-xs">{item.label}</Label>
                                                    <span className="text-xs text-slate-500">{item.value}{item.unit}</span>
                                                </div>
                                                <Slider value={[item.value]} onValueChange={([v]) => item.set(v)} min={item.min} max={item.max} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Annotations */}
                            <TabsContent value="annotate" className="p-4 space-y-4">
                                {tool === 'text' && (
                                    <div className="space-y-3 p-3 bg-blue-50 rounded border border-blue-200">
                                        <Label className="text-xs font-semibold">Paramètres du texte</Label>
                                        <input
                                            placeholder="Entrez le texte..."
                                            value={newTextContent}
                                            onChange={(e) => setNewTextContent(e.target.value)}
                                            className="w-full h-8 px-2 text-sm border rounded"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Couleur</Label>
                                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Taille</Label>
                                                <Slider value={[textSize]} onValueChange={([v]) => setTextSize(v)} min={12} max={72} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {tool === 'draw' && (
                                    <div className="space-y-3 p-3 bg-green-50 rounded border border-green-200">
                                        <Label className="text-xs font-semibold">Paramètres du dessin</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Couleur</Label>
                                                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Épaisseur</Label>
                                                <Slider value={[drawWidth]} onValueChange={([v]) => setDrawWidth(v)} min={1} max={50} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {tool === 'shape' && (
                                    <div className="space-y-3 p-3 bg-purple-50 rounded border border-purple-200">
                                        <Label className="text-xs font-semibold">Paramètres de forme</Label>
                                        <div className="flex gap-2">
                                            {['rectangle', 'circle'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setCurrentShape(s)}
                                                    className={`flex-1 p-2 rounded text-xs capitalize ${
                                                        currentShape === s ? 'bg-purple-500 text-white' : 'bg-white border'
                                                    }`}
                                                >
                                                    {s === 'rectangle' ? 'Rectangle' : 'Cercle'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Couleur</Label>
                                                <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Opacité</Label>
                                                <Slider value={[shapeOpacity * 100]} onValueChange={([v]) => setShapeOpacity(v / 100)} min={0} max={100} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Annotations ({annotations.length})</Label>
                                    {annotations.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">Aucune annotation</p>
                                    ) : (
                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {annotations.map((ann, idx) => (
                                                <div key={idx} className={`flex items-center justify-between p-2 rounded text-xs ${
                                                    selectedAnnotation === idx ? 'bg-amber-100' : 'bg-slate-50'
                                                }`}>
                                                    <span className="truncate flex-1">{ann.text}</span>
                                                    <button
                                                        onClick={() => {
                                                            setAnnotations(annotations.filter((_, i) => i !== idx));
                                                            setSelectedAnnotation(null);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* AI / Upload */}
                            <TabsContent value="effects" className="p-4 space-y-4">
                                {/* Upload Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-blue-500" />
                                        Uploader une image
                                    </h4>
                                    <input
                                        ref={uploadRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleUploadImage}
                                    />
                                    <Button
                                        variant="outline"
                                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                                        onClick={() => uploadRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Upload en cours...</>
                                        ) : (
                                            <><Upload className="w-4 h-4 mr-2" /> Choisir une image</>
                                        )}
                                    </Button>
                                </div>

                                <div className="border-t pt-3" />

                                {/* AI Regeneration */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        Régénérer avec IA
                                    </h4>
                                    
                                    <div className="space-y-2 p-3 bg-purple-50 rounded border border-purple-200">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold">Prompt de génération</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-amber-600 hover:text-amber-700"
                                                onClick={handleEnhancePrompt}
                                                disabled={isEnhancingPrompt || !regeneratePrompt.trim()}
                                            >
                                                {isEnhancingPrompt ? (
                                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Amélioration...</>
                                                ) : (
                                                    <><Wand2 className="w-3 h-3 mr-1" /> Améliorer via IA</>
                                                )}
                                            </Button>
                                        </div>
                                        <textarea
                                            placeholder="Décrivez l'image à générer..."
                                            value={regeneratePrompt}
                                            onChange={(e) => setRegeneratePrompt(e.target.value)}
                                            className="w-full h-20 text-sm p-2 border rounded-md resize-none"
                                        />
                                        
                                        {/* Style Selector */}
                                        <div className="pt-1">
                                            <StyleSelector
                                                selectedStyle={selectedStyle}
                                                onSelect={setSelectedStyle}
                                                customStylePrompt={customStylePrompt}
                                                onCustomStyleChange={setCustomStylePrompt}
                                                onUploadReference={() => {}}
                                                styleRefDescription=""
                                                isAnalyzing={false}
                                            />
                                        </div>

                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                            disabled={!regeneratePrompt.trim() || isRegenerating}
                                            onClick={handleRegenerate}
                                        >
                                            {isRegenerating ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4 mr-2" /> Régénérer l'image</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t pt-3" />

                                {/* Dialogue / Script */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-green-500" />
                                        Dialogue / Script
                                    </h4>
                                    <div className="space-y-2 p-3 bg-green-50 rounded border border-green-200">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold">Texte de narration</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-green-600 hover:text-green-700"
                                                onClick={handleRegenerateDialogue}
                                                disabled={isRegeneratingDialogue}
                                            >
                                                {isRegeneratingDialogue ? (
                                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Régénération...</>
                                                ) : (
                                                    <><RefreshCw className="w-3 h-3 mr-1" /> Régénérer via IA</>
                                                )}
                                            </Button>
                                        </div>
                                        <textarea
                                            placeholder="Entrez le dialogue ou la narration pour cette scène..."
                                            value={dialogue}
                                            onChange={(e) => setDialogue(e.target.value)}
                                            className="w-full h-20 text-sm p-2 border rounded-md resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-3" />

                                {/* Quick Presets */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-600">Préréglages rapides</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: '🎨 Couleurs Vibrantes', b: 110, c: 120, s: 130, bl: 0 },
                                            { label: '🎬 Dramatique', b: 80, c: 140, s: 50, bl: 0 },
                                            { label: '✨ Rêveur', b: 105, c: 95, s: 70, bl: 2 },
                                            { label: '🖤 Noir & Blanc', b: 100, c: 120, s: 0, bl: 0 },
                                        ].map(preset => (
                                            <Button
                                                key={preset.label}
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    setBrightness(preset.b);
                                                    setContrast(preset.c);
                                                    setSaturation(preset.s);
                                                    setBlur(preset.bl);
                                                    toast.success(`${preset.label} appliqué !`);
                                                }}
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            {/* Prompt History Tab */}
                            <TabsContent value="history" className="p-0">
                                <PromptHistoryPanel
                                    history={promptHistory}
                                    currentPrompt={regeneratePrompt}
                                    onReusePrompt={(prompt) => {
                                        setRegeneratePrompt(prompt);
                                        toast.success("Prompt chargé dans l'éditeur !");
                                    }}
                                    onRestoreImage={(entry) => {
                                        setImageUrl(entry.url);
                                        setRegeneratePrompt(entry.prompt);
                                        setImageLoaded(false);
                                    }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter className="border-t p-4">
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                                <Save className="w-4 h-4 mr-2" />
                                Sauvegarder
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}