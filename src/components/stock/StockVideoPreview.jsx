import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, Play, Pause, Volume2, VolumeX, Clock, User, Check, ExternalLink, Maximize2 } from "lucide-react";

function formatDuration(seconds) {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export default function StockVideoPreview({ asset, isVideo, onClose, onSelect, sceneIndex }) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    }, [isVideo]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) { videoRef.current.pause(); }
        else { videoRef.current.play().catch(() => {}); }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <Button variant="ghost" size="icon" onClick={onClose}
                    className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8">
                    <X className="w-4 h-4" />
                </Button>

                {/* Video / Image */}
                <div className="relative aspect-video bg-black">
                    {isVideo && (asset.previewUrl || asset.url) ? (
                        <>
                            <video
                                ref={videoRef}
                                src={asset.previewUrl || asset.url}
                                muted={isMuted}
                                loop
                                playsInline
                                className="w-full h-full object-contain"
                                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                            />
                            {/* Video Controls Overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={togglePlay}
                                    className="text-white hover:bg-white/20 h-8 w-8">
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={toggleMute}
                                    className="text-white hover:bg-white/20 h-8 w-8">
                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </Button>
                                <span className="text-[11px] text-white/70 font-mono">
                                    {formatDuration(currentTime)} / {formatDuration(asset.duration)}
                                </span>
                                {asset.width >= 1920 && (
                                    <Badge className="bg-emerald-500/80 text-[10px] text-white border-0 ml-auto">
                                        {asset.width}×{asset.height}
                                    </Badge>
                                )}
                            </div>
                        </>
                    ) : (
                        <img
                            src={asset.thumbnail || asset.url}
                            alt={asset.title || ''}
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* Info & Actions */}
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{asset.title || 'Sans titre'}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            {asset.photographer && (
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {asset.photographer}</span>
                            )}
                            {asset.duration > 0 && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(asset.duration)}</span>
                            )}
                            <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
                                {asset.source}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        onClick={onSelect}
                        className="bg-amber-500 hover:bg-amber-600 text-white gap-2 px-5"
                    >
                        <Check className="w-4 h-4" />
                        Insérer dans Scène {(sceneIndex ?? 0) + 1}
                    </Button>
                </div>
            </div>
        </div>
    );
}