import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";

export default function UndoRedoToolbar({ 
    canUndo, 
    canRedo, 
    onUndo, 
    onRedo, 
    undoCount = 0, 
    redoCount = 0,
    className = "",
    showCounts = true,
    enableKeyboardShortcuts = true
}) {
    // Raccourcis clavier globaux
    useEffect(() => {
        if (!enableKeyboardShortcuts) return;

        const handleKeyDown = (e) => {
            // Ctrl+Z ou Cmd+Z pour Annuler
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    const success = onUndo();
                    if (success) toast.info("Action annulée", { duration: 1500 });
                }
            }
            // Ctrl+Shift+Z ou Cmd+Shift+Z pour Rétablir
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                if (canRedo) {
                    const success = onRedo();
                    if (success) toast.info("Action rétablie", { duration: 1500 });
                }
            }
            // Ctrl+Y pour Rétablir (alternative Windows)
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                if (canRedo) {
                    const success = onRedo();
                    if (success) toast.info("Action rétablie", { duration: 1500 });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, onUndo, onRedo, enableKeyboardShortcuts]);

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const success = onUndo();
                                if (success) toast.info("Action annulée", { duration: 1500 });
                            }}
                            disabled={!canUndo}
                            className="h-8 px-2 gap-1"
                        >
                            <Undo2 className="w-4 h-4" />
                            {showCounts && undoCount > 0 && (
                                <span className="text-[10px] text-slate-500">({undoCount})</span>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Annuler (Ctrl+Z)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const success = onRedo();
                                if (success) toast.info("Action rétablie", { duration: 1500 });
                            }}
                            disabled={!canRedo}
                            className="h-8 px-2 gap-1"
                        >
                            <Redo2 className="w-4 h-4" />
                            {showCounts && redoCount > 0 && (
                                <span className="text-[10px] text-slate-500">({redoCount})</span>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Rétablir (Ctrl+Shift+Z)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}