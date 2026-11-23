import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ScreenplayPreviewModal from './screenplay/ScreenplayPreviewModal';

export default function ScreenplayExportButton({ script, scenes, voiceovers, audioTracks, projectName, settings, className }) {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(true)} 
                disabled={!scenes || scenes.length === 0}
                className={`gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 ${className || ''}`}
            >
                <FileText className="w-4 h-4" />
                Export PDF
            </Button>

            <ScreenplayPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                script={script}
                scenes={scenes}
                voiceovers={voiceovers}
                audioTracks={audioTracks}
                projectName={projectName}
                settings={settings}
            />
        </>
    );
}