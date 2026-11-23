import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Trash2, Clock, Languages, Mic } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AudioCreationCard({ creation, onDeleted }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleEnded = () => setIsPlaying(false);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = creation.audio_url;
        a.download = `audio-${creation.id}.mp3`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = async () => {
        if (!window.confirm("Supprimer cette création audio ?")) return;
        await base44.entities.AudioCreation.delete(creation.id);
        toast.success("Création supprimée");
        onDeleted?.(creation.id);
    };

    const truncateText = (text, maxLen = 120) => {
        if (!text) return "";
        return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Play button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                        className={`shrink-0 h-12 w-12 rounded-full border-2 ${isPlaying ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-300 hover:border-amber-400'}`}
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-800 truncate">
                                {creation.title || "Audio sans titre"}
                            </span>
                            {creation.provider && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                    {creation.provider}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                            {truncateText(creation.source_text)}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {creation.created_date 
                                    ? format(new Date(creation.created_date), "d MMM yyyy 'à' HH:mm", { locale: fr })
                                    : "—"}
                            </span>
                            {creation.language && (
                                <span className="flex items-center gap-1">
                                    <Languages className="w-3 h-3" />
                                    {creation.language}
                                </span>
                            )}
                            {creation.voice && (
                                <span className="flex items-center gap-1">
                                    <Mic className="w-3 h-3" />
                                    {creation.voice}
                                </span>
                            )}
                            {creation.duration_seconds > 0 && (
                                <span>{Math.round(creation.duration_seconds)}s</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 text-slate-500 hover:text-amber-600">
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Hidden audio element */}
                <audio
                    ref={audioRef}
                    src={creation.audio_url}
                    onEnded={handleEnded}
                    preload="none"
                />
            </CardContent>
        </Card>
    );
}