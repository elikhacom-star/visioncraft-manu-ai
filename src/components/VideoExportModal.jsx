import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Download, FileVideo, Monitor, Server, Clock, CheckCircle2 } from "lucide-react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useLanguage } from './LanguageProvider';
import RenderQueue from './RenderQueue';
import MultiFormatSelector from './export/MultiFormatSelector';
import MultiFormatResults from './export/MultiFormatResults';
import { ASPECT_CONFIGS } from './export/AspectRatioCard';

export default function VideoExportModal({ isOpen, onClose, onRender, isRendering, progress, renderUrl, scenes, voiceovers, subtitleSettings, onSubtitleSettingsChange }) {
    const { t } = useLanguage();
    const [resolution, setResolution] = useState("1080p");
    const [format, setFormat] = useState("mp4");
    const [codec, setCodec] = useState("auto");
    const [bitrateMbps, setBitrateMbps] = useState(8);
    const [isConverting, setIsConverting] = useState(false);
    const [ffmpeg, setFfmpeg] = useState(null);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [renderMode, setRenderMode] = useState("local");
    const [serverJobId, setServerJobId] = useState(null);
    const [serverProgress, setServerProgress] = useState(0);
    const [serverStatus, setServerStatus] = useState(null);
    const pollingRef = useRef(null);

    // Multi-format state
    const [selectedRatios, setSelectedRatios] = useState(['16:9']);
    const [multiResults, setMultiResults] = useState([]); // [{ratio, status, url, blob}]
    const [currentRenderRatio, setCurrentRenderRatio] = useState(null);
    const [isMultiRendering, setIsMultiRendering] = useState(false);

    // Load FFmpeg
    useEffect(() => {
        const load = async () => {
            try {
                const ffmpegInstance = new FFmpeg();
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                await ffmpegInstance.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
                setFfmpeg(ffmpegInstance);
                setFfmpegLoaded(true);
            } catch (err) {
                console.error("FFmpeg load failed:", err);
            }
        };
        if (isOpen && !ffmpegLoaded) {
            load();
        }
    }, [isOpen, ffmpegLoaded]);

    // Poll server job status
    useEffect(() => {
        if (serverJobId && (serverStatus === 'queued' || serverStatus === 'processing')) {
            pollingRef.current = setInterval(async () => {
                try {
                    const res = await base44.functions.invoke('renderVideo', {
                        action: 'status',
                        jobId: serverJobId
                    });
                    const job = res.data;
                    setServerProgress(job.progress || 0);
                    setServerStatus(job.status);

                    if (job.status === 'completed') {
                        clearInterval(pollingRef.current);
                        toast.success("Rendu serveur terminé !");
                    } else if (job.status === 'failed') {
                        clearInterval(pollingRef.current);
                        toast.error("Rendu échoué: " + (job.error_message || "Erreur inconnue"));
                    }
                } catch (e) {
                    console.error("Poll error:", e);
                }
            }, 3000);
            return () => clearInterval(pollingRef.current);
        }
    }, [serverJobId, serverStatus]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setServerJobId(null);
            setServerStatus(null);
            setServerProgress(0);
            setCurrentRenderRatio(null);
            setIsMultiRendering(false);
        }
    }, [isOpen]);

    const handleToggleRatio = (ratio, reset) => {
        if (reset) {
            setSelectedRatios([ratio]);
            return;
        }
        setSelectedRatios(prev => {
            if (prev.includes(ratio)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(r => r !== ratio);
            }
            return [...prev, ratio];
        });
    };

    const handleExport = async () => {
        if (renderMode === 'server') {
            await handleServerRender();
            return;
        }

        // Multi-format local rendering
        if (selectedRatios.length === 1) {
            // Single format — use original callback with aspectRatio
            onRender({ resolution, format, codec, bitrateMbps, aspectRatio: selectedRatios[0], subtitleSettings });
            return;
        }

        // Multiple formats — render sequentially
        setIsMultiRendering(true);
        const results = selectedRatios.map(ratio => ({ ratio, status: 'pending', url: null, blob: null }));
        setMultiResults(results);

        for (let i = 0; i < selectedRatios.length; i++) {
            const ratio = selectedRatios[i];
            setCurrentRenderRatio(ratio);
            setMultiResults(prev => prev.map(r => r.ratio === ratio ? { ...r, status: 'rendering' } : r));

            try {
                // Call the parent's render with a promise-based approach
                await new Promise((resolve, reject) => {
                    // onRender will trigger assembleVideo which sets videoUrl when done
                    // We pass a callback via the settings
                    onRender({
                        resolution,
                        format,
                        codec,
                        bitrateMbps,
                        aspectRatio: ratio,
                        subtitleSettings,
                        _multiFormat: true,
                        _onComplete: (url, blob) => {
                            setMultiResults(prev => prev.map(r =>
                                r.ratio === ratio ? { ...r, status: 'done', url, blob } : r
                            ));
                            resolve();
                        },
                        _onError: (err) => {
                            setMultiResults(prev => prev.map(r =>
                                r.ratio === ratio ? { ...r, status: 'error' } : r
                            ));
                            resolve(); // Don't reject, continue to next
                        }
                    });
                });
            } catch (e) {
                setMultiResults(prev => prev.map(r =>
                    r.ratio === ratio ? { ...r, status: 'error' } : r
                ));
            }
        }

        setCurrentRenderRatio(null);
        setIsMultiRendering(false);
        toast.success(`${selectedRatios.length} formats rendus !`);
    };

    const handleServerRender = async () => {
        if (!scenes || scenes.length === 0) {
            toast.error("Aucune scène à rendre");
            return;
        }

        try {
            setServerStatus('queued');
            setServerProgress(0);

            const res = await base44.functions.invoke('renderVideo', {
                action: 'create',
                scenes: scenes,
                voiceovers: (voiceovers || []).map(v => ({
                    scene_number: v.scene_number,
                    dialogue: v.dialogue,
                    duration: v.duration,
                    audioUrl: v.audioUrl
                })),
                settings: {
                    resolution,
                    format,
                    bitrateMbps
                }
            });

            if (res.data?.jobId) {
                setServerJobId(res.data.jobId);
                setServerStatus('queued');
                toast.success("Rendu ajouté à la file d'attente !");
            } else {
                throw new Error(res.data?.error || "Échec de création du job");
            }
        } catch (e) {
            toast.error("Erreur: " + e.message);
            setServerStatus(null);
        }
    };

    const convertAndDownload = async (targetFormat = format) => {
        if (!renderUrl) return;

        try {
            const response = await fetch(renderUrl);
            const originalBlob = await response.blob();
            const isNativeMp4 = originalBlob.type.includes('mp4');

            if (targetFormat === 'webm') {
                downloadFile(renderUrl, `visioncraft_video.webm`);
                return;
            }

            if (targetFormat === 'mp4' && isNativeMp4) {
                downloadFile(renderUrl, `visioncraft_video.mp4`);
                return;
            }

            if (!ffmpegLoaded) {
                toast.error("Convertisseur indisponible. Téléchargement original.");
                downloadFile(renderUrl, `visioncraft_video.webm`);
                return;
            }

            setIsConverting(true);
            
            const inputExt = isNativeMp4 ? 'mp4' : 'webm';
            const inputName = `input.${inputExt}`; 
            const outputName = `output.${targetFormat}`;
            
            await ffmpeg.writeFile(inputName, await fetchFile(originalBlob));

            let args = ['-i', inputName];
            
            if (targetFormat === 'mp4') {
                args.push(
                    '-c:v', 'libx264', 
                    '-preset', 'fast',
                    '-b:v', `${Math.max(1, bitrateMbps)||8}M`,
                    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
                    '-c:a', 'aac',
                    '-ar', '48000',
                    '-ac', '2',
                    '-movflags', '+faststart'
                );
            } else if (targetFormat === 'avi') {
                args.push('-c:v', 'mpeg4', '-c:a', 'mp3');
            }
            
            args.push(outputName);

            await ffmpeg.exec(args);

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data.buffer], { type: `video/${targetFormat}` });
            const url = URL.createObjectURL(blob);
            
            downloadFile(url, `visioncraft_video.${targetFormat}`);
        } catch (error) {
            console.error(error);
            toast.error("Conversion échouée, téléchargement original.");
            downloadFile(renderUrl, `visioncraft_video.webm`);
        } finally {
            setIsConverting(false);
        }
    };

    const downloadFile = (url, filename) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadMultiResult = (result) => {
        if (result.url) {
            const ext = result.blob?.type?.includes('mp4') ? 'mp4' : 'webm';
            downloadFile(result.url, `visioncraft_${result.ratio.replace(':', 'x')}.${ext}`);
        }
    };

    const isServerActive = serverStatus === 'queued' || serverStatus === 'processing';
    const isServerDone = serverStatus === 'completed';
    const isBusy = isRendering || isConverting || isServerActive || isMultiRendering;
    const hasMultiResults = multiResults.length > 0 && multiResults.some(r => r.status === 'done');
    const showSettings = !isRendering && !isConverting && !renderUrl && !isServerActive && !isServerDone && !isMultiRendering && !hasMultiResults;

    return (
        <Dialog open={isOpen} onOpenChange={isBusy ? undefined : onClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileVideo className="w-5 h-5 text-amber-500" />
                        Export Vidéo Multi-Format
                    </DialogTitle>
                    <DialogDescription>
                        Sélectionnez un ou plusieurs formats, puis lancez le rendu.
                    </DialogDescription>
                </DialogHeader>

                {/* Settings */}
                {showSettings && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                            <div>
                                <Label className="text-sm font-semibold">Sous-titres animés</Label>
                                <p className="text-xs text-slate-500 mt-1">Basés sur le timing des voix off.</p>
                            </div>
                            <Tabs defaultValue="style" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="style">Style</TabsTrigger>
                                    <TabsTrigger value="animation">Animation</TabsTrigger>
                                </TabsList>
                                <TabsContent value="style" className="space-y-3 mt-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Police</Label>
                                            <Select value={subtitleSettings?.fontFamily || 'Arial'} onValueChange={(value) => onSubtitleSettingsChange?.({ ...subtitleSettings, fontFamily: value })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Arial">Arial</SelectItem>
                                                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                                                    <SelectItem value="Georgia">Georgia</SelectItem>
                                                    <SelectItem value="Verdana">Verdana</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Taille</Label>
                                            <Select value={String(subtitleSettings?.fontSize || 32)} onValueChange={(value) => onSubtitleSettingsChange?.({ ...subtitleSettings, fontSize: parseInt(value) })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="24">Petit</SelectItem>
                                                    <SelectItem value="32">Moyen</SelectItem>
                                                    <SelectItem value="40">Grand</SelectItem>
                                                    <SelectItem value="48">Très grand</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Couleur du texte</Label>
                                            <input type="color" value={subtitleSettings?.textColor || '#FFFFFF'} onChange={(e) => onSubtitleSettingsChange?.({ ...subtitleSettings, textColor: e.target.value })} className="h-10 w-full rounded-md border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mot actif</Label>
                                            <input type="color" value={subtitleSettings?.activeWordColor || '#FFFF00'} onChange={(e) => onSubtitleSettingsChange?.({ ...subtitleSettings, activeWordColor: e.target.value })} className="h-10 w-full rounded-md border" />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="animation" className="space-y-3 mt-3">
                                    <div className="space-y-2">
                                        <Label>Animation</Label>
                                        <Select value={subtitleSettings?.animation || 'highlight'} onValueChange={(value) => onSubtitleSettingsChange?.({ ...subtitleSettings, animation: value })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="highlight">Surbrillance</SelectItem>
                                                <SelectItem value="pop">Pop</SelectItem>
                                                <SelectItem value="slide">Slide</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        {/* Multi-format selector */}
                        <MultiFormatSelector
                            selectedRatios={selectedRatios}
                            onToggle={handleToggleRatio}
                            disabled={isBusy}
                        />

                        {/* Render Mode */}
                        <div className="space-y-2">
                            <Label>Mode de rendu</Label>
                            <Tabs value={renderMode} onValueChange={setRenderMode}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="local" className="flex-1 gap-1.5">
                                        <Monitor className="w-3.5 h-3.5" />
                                        Navigateur
                                    </TabsTrigger>
                                    <TabsTrigger value="server" className="flex-1 gap-1.5">
                                        <Server className="w-3.5 h-3.5" />
                                        Serveur
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <p className="text-xs text-slate-500">
                                {renderMode === 'local' 
                                    ? "Assemblage direct dans votre navigateur. Gardez l'onglet ouvert."
                                    : "File d'attente serveur. Vous pouvez fermer et revenir télécharger plus tard."
                                }
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Résolution</Label>
                            <Select value={resolution} onValueChange={setResolution}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="720p">HD (720p)</SelectItem>
                                    <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Format</Label>
                            <Select value={format} onValueChange={(v) => { setFormat(v); setCodec('auto'); }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                                    <SelectItem value="webm">WebM (VP8/VP9)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {renderMode === 'local' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Codec</Label>
                                    <Select value={codec} onValueChange={setCodec}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto</SelectItem>
                                            {format === 'mp4' && <SelectItem value="h264">H.264 (AVC)</SelectItem>}
                                            {format === 'webm' && (
                                                <>
                                                    <SelectItem value="vp9">VP9</SelectItem>
                                                    <SelectItem value="vp8">VP8</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Débit vidéo (Mbps)</Label>
                                    <div className="flex items-center gap-3">
                                        <input type="number" min={1} max={50} step={1} value={bitrateMbps}
                                               onChange={(e) => setBitrateMbps(Math.max(1, Math.min(50, Number(e.target.value || 8))))}
                                               className="h-9 rounded-md border px-3 w-28" />
                                        <div className="text-xs text-slate-500">720p≈3, 1080p≈8, 4K≈20</div>
                                    </div>
                                </div>
                            </>
                        )}

                        <RenderQueue className="mt-4 pt-4 border-t" />
                    </div>
                )}

                {/* Multi-format results */}
                {(isMultiRendering || hasMultiResults) && (
                    <MultiFormatResults
                        results={multiResults}
                        currentRatio={currentRenderRatio}
                        overallProgress={progress}
                        isRendering={isMultiRendering}
                        onDownload={handleDownloadMultiResult}
                    />
                )}

                {/* Single format: Result ready */}
                {!isRendering && !isConverting && renderUrl && !hasMultiResults && (
                    <div className="py-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-md mb-4">
                            <video src={renderUrl} controls className="w-full h-full object-contain" />
                        </div>

                        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm text-center font-medium">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Vidéo prête ! Prévisualisez ci-dessus ou téléchargez :
                        </div>

                        <Button onClick={() => convertAndDownload('mp4')} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <FileVideo className="w-4 h-4 mr-2" />
                            Télécharger MP4 (Universel)
                        </Button>
                        
                        <Button onClick={() => convertAndDownload('webm')} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger Original (WebM)
                        </Button>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button onClick={() => convertAndDownload('mov')} variant="ghost" size="sm" className="text-xs text-slate-500">
                                Télécharger MOV
                            </Button>
                            <Button onClick={() => convertAndDownload('avi')} variant="ghost" size="sm" className="text-xs text-slate-500">
                                Télécharger AVI
                            </Button>
                        </div>
                    </div>
                )}

                {/* Local Render: In progress (single) */}
                {(isRendering || isConverting) && !isMultiRendering && (
                    <div className="py-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span>{isRendering ? "Rendu vidéo en cours..." : "Conversion du format..."}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-center text-slate-500">
                            {isRendering ? "Assemblage des scènes et de l'audio..." : "Transcodage FFmpeg dans le navigateur..."}
                        </p>
                    </div>
                )}

                {/* Server Render: In progress */}
                {isServerActive && (
                    <div className="py-6 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <Server className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    Rendu serveur {serverStatus === 'queued' ? 'en attente' : 'en cours'}
                                </p>
                                <p className="text-xs text-blue-600">
                                    Vous pouvez fermer cette fenêtre et revenir plus tard.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>{serverStatus === 'queued' ? 'En attente...' : 'Traitement...'}</span>
                            <span>{Math.round(serverProgress)}%</span>
                        </div>
                        <Progress value={serverProgress} className="h-2" />
                    </div>
                )}

                {/* Server Render: Complete */}
                {isServerDone && (
                    <div className="py-4 space-y-3">
                        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm text-center font-medium">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Rendu serveur terminé !
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                            Retrouvez votre vidéo dans la file de rendu ci-dessous.
                        </p>
                        <RenderQueue className="mt-2" />
                    </div>
                )}

                <DialogFooter>
                    {showSettings && (
                        <>
                            <Button variant="outline" onClick={onClose}>Annuler</Button>
                            <Button onClick={handleExport} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                {renderMode === 'server' ? <Server className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                {selectedRatios.length > 1
                                    ? `Rendre ${selectedRatios.length} formats`
                                    : (renderMode === 'server' ? 'Ajouter à la file' : 'Lancer le rendu')
                                }
                            </Button>
                        </>
                    )}
                    {!isRendering && !isConverting && renderUrl && !hasMultiResults && (
                        <Button variant="outline" onClick={onClose} className="w-full">
                            Terminé
                        </Button>
                    )}
                    {hasMultiResults && !isMultiRendering && (
                        <Button variant="outline" onClick={onClose} className="w-full">
                            Terminé
                        </Button>
                    )}
                    {(isRendering || isConverting) && !isMultiRendering && (
                        <Button disabled variant="ghost" className="w-full">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isRendering ? "Rendu..." : "Conversion..."}
                        </Button>
                    )}
                    {isMultiRendering && (
                        <Button disabled variant="ghost" className="w-full">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rendu multi-format en cours...
                        </Button>
                    )}
                    {isServerActive && (
                        <Button variant="outline" onClick={onClose} className="w-full">
                            <Clock className="w-4 h-4 mr-2" />
                            Fermer (rendu continue en arrière-plan)
                        </Button>
                    )}
                    {isServerDone && (
                        <Button variant="outline" onClick={onClose} className="w-full">
                            Fermer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}