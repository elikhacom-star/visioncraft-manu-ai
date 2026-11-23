import React from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2, Loader2, FileVideo } from 'lucide-react';
import { ASPECT_CONFIGS } from './AspectRatioCard';

export default function MultiFormatResults({ results, currentRatio, overallProgress, isRendering, onDownload }) {
    if (!results || results.length === 0) return null;

    return (
        <div className="space-y-3 py-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-amber-500" />
                Résultats multi-format
            </h4>
            {results.map((result) => {
                const config = ASPECT_CONFIGS[result.ratio] || {};
                const isDone = result.status === 'done';
                const isCurrent = result.ratio === currentRatio && isRendering;
                const isPending = result.status === 'pending';
                const isFailed = result.status === 'error';

                return (
                    <div
                        key={result.ratio}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isDone ? 'bg-green-50 border-green-200' :
                            isCurrent ? 'bg-amber-50 border-amber-200' :
                            isFailed ? 'bg-red-50 border-red-200' :
                            'bg-slate-50 border-slate-200'
                        }`}
                    >
                        <span className="text-xl">{config.icon || '📦'}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800">{result.ratio}</span>
                                <span className="text-[11px] text-slate-500">{config.label}</span>
                            </div>
                            {isCurrent && (
                                <Progress value={overallProgress} className="h-1.5 mt-1.5" />
                            )}
                            {isFailed && (
                                <span className="text-[11px] text-red-600">Échec du rendu</span>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                            {isDone && result.url && (
                                <Button size="sm" variant="outline" onClick={() => onDownload(result)} className="h-8 gap-1.5 border-green-300 text-green-700 hover:bg-green-100">
                                    <Download className="w-3.5 h-3.5" />
                                    DL
                                </Button>
                            )}
                            {isCurrent && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    En cours
                                </Badge>
                            )}
                            {isPending && (
                                <Badge variant="outline" className="text-slate-400">En attente</Badge>
                            )}
                            {isDone && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 ml-2" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}