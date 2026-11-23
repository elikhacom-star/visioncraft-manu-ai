import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Music as MusicIcon } from "lucide-react";
import { toast } from "sonner";
import AdvancedAudioTimeline from './audio/AdvancedAudioTimeline';

export default function AdvancedAudioEditorDialog({
    isOpen, onClose,
    audioTracks, totalDuration,
    onUpdateTrack, onRemoveTrack, onReorderTracks,
    onOpenGenerator
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 bg-slate-950 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <MusicIcon className="w-5 h-5 text-green-500" />
                        Éditeur Audio Avancé - Timeline Multi-Pistes
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">
                        Gérez volume, fondus, ducking et pistes audio indépendamment
                    </DialogDescription>
                </DialogHeader>
                <div className="p-2 sm:p-4 overflow-auto overscroll-contain flex-1" style={{ maxHeight: 'calc(90vh - 180px)', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
                    <AdvancedAudioTimeline
                        audioTracks={audioTracks}
                        totalDuration={totalDuration}
                        onUpdateTrack={onUpdateTrack}
                        onRemoveTrack={(idx) => { if (window.confirm(`Supprimer "${audioTracks[idx]?.name}" ?`)) onRemoveTrack(idx); }}
                        onAddTrack={() => { onClose(); setTimeout(onOpenGenerator, 200); }}
                        onReorderTracks={onReorderTracks}
                        playheadPosition={0}
                        onPlayheadChange={() => {}}
                        isPlaying={false}
                        onPlayPause={() => {}}
                    />
                </div>
                <DialogFooter className="px-4 py-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
                    <Button onClick={() => { onClose(); toast.success("Modifications audio appliquées"); }} className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder et Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}