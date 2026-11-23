import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Timer, TrendingDown, TrendingUp, Scissors, Plus } from "lucide-react";

const SEVERITY_CONFIG = {
    ok: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Conforme', badge: 'bg-green-500 text-white' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Attention', badge: 'bg-amber-500 text-white' },
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critique', badge: 'bg-red-500 text-white' },
};

export default function DurationValidator({ validation, estimatedDuration, idealSceneCount, script }) {
    if (!validation) {
        return (
            <div className="text-center py-10">
                <Timer className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">Aucune validation de durée disponible.</p>
            </div>
        );
    }

    const config = SEVERITY_CONFIG[validation.severity] || SEVERITY_CONFIG.ok;
    const Icon = config.icon;
    const diff = validation.difference_seconds || 0;
    const isLong = diff > 0;
    const absDiff = Math.abs(diff);
    const target = validation.target_seconds || 60;
    const estimated = validation.estimated_seconds || estimatedDuration || 0;

    // Percentage of target
    const pct = target > 0 ? Math.round((estimated / target) * 100) : 100;
    const progressValue = Math.min(pct, 150);

    const wordCount = script ? script.trim().split(/\s+/).filter(w => w).length : 0;
    const wordsAdjust = Math.abs(validation.words_to_add_or_remove || 0);

    return (
        <div className="space-y-5">
            {/* Main status card */}
            <div className={`p-5 rounded-xl border-2 ${config.border} ${config.bg} text-center`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                    <Icon className={`w-7 h-7 ${config.color}`} />
                    <Badge className={`text-sm px-3 py-1 ${config.badge}`}>{config.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{estimated}s</p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Estimé</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{target}s</p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Cible</p>
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${isLong ? 'text-red-600' : diff < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                            {isLong ? '+' : ''}{diff}s
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Écart</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>0s</span>
                        <span className="font-semibold">{pct}% de la cible</span>
                        <span>{target}s</span>
                    </div>
                    <div className="relative">
                        <Progress value={Math.min(progressValue, 100)} className="h-3" />
                        {pct > 100 && (
                            <div
                                className="absolute top-0 h-3 bg-red-400 rounded-r-full opacity-60"
                                style={{ left: `${(100 / progressValue) * 100}%`, width: `${((progressValue - 100) / progressValue) * 100}%` }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Mots dans le script</p>
                    <p className="text-xl font-bold text-slate-800">{wordCount}</p>
                    <p className="text-[10px] text-slate-400">~2.5 mots/sec parlé</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Scènes idéales</p>
                    <p className="text-xl font-bold text-slate-800">{idealSceneCount || '-'}</p>
                    <p className="text-[10px] text-slate-400">Pour un bon rythme</p>
                </div>
            </div>

            {/* Recommendation */}
            {validation.recommendation && (
                <div className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
                    <div className="flex items-start gap-3">
                        {isLong ? <TrendingDown className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> : diff < 0 ? <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Recommandation</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{validation.recommendation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action hint */}
            {validation.severity !== 'ok' && wordsAdjust > 0 && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-3">
                    {isLong ? <Scissors className="w-5 h-5 text-indigo-500 shrink-0" /> : <Plus className="w-5 h-5 text-indigo-500 shrink-0" />}
                    <div>
                        <p className="text-sm font-medium text-indigo-700">
                            {isLong ? `Retirez ~${wordsAdjust} mots` : `Ajoutez ~${wordsAdjust} mots`}
                        </p>
                        <p className="text-xs text-indigo-500">
                            {isLong
                                ? `Votre script est trop long de ${absDiff}s. Supprimez environ ${wordsAdjust} mots pour atteindre la cible.`
                                : `Votre script est trop court de ${absDiff}s. Ajoutez environ ${wordsAdjust} mots pour couvrir la durée cible.`
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}