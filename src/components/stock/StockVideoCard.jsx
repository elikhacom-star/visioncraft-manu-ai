import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Download, Clock, User, ExternalLink } from "lucide-react";

function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export default function StockVideoCard({ asset, isVideo, onPreview, onSelect }) {
    const [isHovering, setIsHovering] = useState(false);
    const videoRef = useRef(null);

    const handleMouseEnter = () => {
        setIsHovering(true);
        if (isVideo && asset.previewUrl && videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    if (asset.isExternalLink) {
        return (
            <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:shadow-lg transition-all flex items-center justify-center"
            >
                <div className="text-center p-3">
                    <ExternalLink className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{asset.title}</p>
                    {asset.description && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{asset.description}</p>}
                </div>
                <Badge className="absolute bottom-1 right-1 bg-black/50 text-[9px] text-white border-0">{asset.source}</Badge>
            </a>
        );
    }

    return (
        <div
            className="group relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onPreview}
        >
            {/* Thumbnail / Video Preview */}
            {isVideo && asset.previewUrl && isHovering ? (
                <video
                    ref={videoRef}
                    src={asset.previewUrl}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <img
                    src={asset.thumbnail || asset.url}
                    alt={asset.title || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            )}

            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity flex flex-col justify-end p-2 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/90 font-medium line-clamp-1">{asset.title || 'Sans titre'}</p>
                        {asset.photographer && (
                            <p className="text-[9px] text-white/60 flex items-center gap-1 mt-0.5">
                                <User className="w-2.5 h-2.5" /> {asset.photographer}
                            </p>
                        )}
                    </div>
                    <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] h-7 px-2 gap-1 shrink-0 ml-2"
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    >
                        <Download className="w-3 h-3" /> Utiliser
                    </Button>
                </div>
            </div>

            {/* Duration Badge */}
            {isVideo && asset.duration > 0 && (
                <Badge className="absolute top-1.5 right-1.5 bg-black/70 text-[10px] text-white border-0 gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" /> {formatDuration(asset.duration)}
                </Badge>
            )}

            {/* Video indicator */}
            {isVideo && !isHovering && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                </div>
            )}

            {/* Source Badge */}
            {asset.source && (
                <Badge className="absolute top-1.5 left-1.5 bg-black/50 text-[9px] text-white/80 border-0">
                    {asset.source}
                </Badge>
            )}

            {/* Resolution indicator */}
            {asset.width >= 1920 && (
                <Badge className="absolute bottom-1.5 left-1.5 bg-emerald-500/80 text-[9px] text-white border-0">
                    HD
                </Badge>
            )}
        </div>
    );
}