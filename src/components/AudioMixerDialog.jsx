import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Music as MusicIcon } from "lucide-react";
import AudioMixerPanel from './audio/AudioMixerPanel';

export default function AudioMixerDialog({
    isOpen, onClose,
    audioTracks, voiceoverVolume, 
    onUpdateTrack, onRemoveTrack, onAddTrack, onUpdateVoiceover,
    scenes, totalDuration,
    onOpenGenerator, onOpenSmartSFX
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MusicIcon className="w-5 h-5 text-green-500" />
                        Audio Mixer
                    </DialogTitle>
                    <DialogDescription>Fine-tune volume, pan, and effects for each audio track</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <AudioMixerPanel 
                        audioTracks={audioTracks} voiceoverVolume={voiceoverVolume} 
                        onUpdateTrack={onUpdateTrack} onRemoveTrack={onRemoveTrack} onAddTrack={onAddTrack} 
                        onUpdateVoiceover={onUpdateVoiceover} scenes={scenes} totalDuration={totalDuration} 
                        onGenerateMusic={() => { onClose(); setTimeout(onOpenGenerator, 200); }} 
                        onGenerateSFX={() => { onClose(); setTimeout(onOpenSmartSFX, 200); }} 
                    />
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}