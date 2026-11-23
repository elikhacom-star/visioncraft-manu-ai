import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PromptHistoryPanel({ history = [], currentPrompt, onReusePrompt, onRestoreImage }) {
    const [copiedIdx, setCopiedIdx] = React.useState(null);

    const handleCopy = (prompt, idx) => {
        navigator.clipboard.writeText(prompt);
        setCopiedIdx(idx);
        toast.success("Prompt copié !");
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <History className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Aucun historique</p>
                <p className="text-xs text-slate-400 mt-1">
                    Les prompts utilisés pour régénérer cette image apparaîtront ici.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-semibold">Historique des prompts</h4>
                <Badge variant="secondary" className="ml-auto text-xs">{history.length}</Badge>
            </div>

            <div className="space-y-3 max-h-[calc(60vh-80px)] overflow-y-auto pr-1">
                {[...history].reverse().map((entry, idx) => {
                    const realIdx = history.length - 1 - idx;
                    const isLatest = realIdx === history.length - 1;
                    return (
                        <div
                            key={realIdx}
                            className={`rounded-lg border p-3 space-y-2 ${isLatest ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30'}`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    {isLatest && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 px-1.5 py-0">Actuel</Badge>}
                                    {entry.timestamp && (
                                        <span className="text-[10px] text-slate-400">
                                            {format(new Date(entry.timestamp), 'dd/MM HH:mm')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleCopy(entry.prompt, realIdx)}
                                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                                        title="Copier le prompt"
                                    >
                                        {copiedIdx === realIdx ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    {!isLatest && (
                                        <button
                                            onClick={() => onReusePrompt(entry.prompt)}
                                            className="p-1 rounded hover:bg-amber-100 text-amber-600 hover:text-amber-700 transition-colors"
                                            title="Réutiliser ce prompt"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Image thumbnail */}
                            {entry.url && (
                                <div className="relative group">
                                    <img
                                        src={entry.url}
                                        alt={`Variante ${realIdx + 1}`}
                                        className="w-full h-24 object-cover rounded border border-slate-200 dark:border-slate-700"
                                    />
                                    {!isLatest && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-white text-slate-800 hover:bg-slate-100"
                                                onClick={() => { onRestoreImage(entry); toast.success("Image restaurée !"); }}
                                            >
                                                Restaurer
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prompt text */}
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {entry.prompt}
                            </p>

                            {/* Reuse button */}
                            {!isLatest && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() => onReusePrompt(entry.prompt)}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Réutiliser ce prompt
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}