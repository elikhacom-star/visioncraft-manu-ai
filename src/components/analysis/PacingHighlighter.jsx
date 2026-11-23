import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Clock, Pause, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

const ISSUE_CONFIG = {
    too_fast: { label: 'Trop rapide', icon: Zap, color: 'bg-red-100 text-red-700 border-red-300', highlight: 'bg-red-50 border-red-200' },
    too_slow: { label: 'Trop lent', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-300', highlight: 'bg-blue-50 border-blue-200' },
    monotone: { label: 'Monotone', icon: Activity, color: 'bg-amber-100 text-amber-700 border-amber-300', highlight: 'bg-amber-50 border-amber-200' },
    abrupt_shift: { label: 'Transition brusque', icon: ArrowRight, color: 'bg-purple-100 text-purple-700 border-purple-300', highlight: 'bg-purple-50 border-purple-200' },
    no_pause: { label: 'Pas de pause', icon: Pause, color: 'bg-orange-100 text-orange-700 border-orange-300', highlight: 'bg-orange-50 border-orange-200' },
};

const SEVERITY_BADGE = {
    high: 'bg-red-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-blue-400 text-white',
};

export default function PacingHighlighter({ script, issues }) {
    if (!issues || issues.length === 0) {
        return (
            <div className="text-center py-10">
                <Activity className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="text-sm font-medium text-green-700">Aucun problème de rythme détecté !</p>
                <p className="text-xs text-slate-400 mt-1">Votre script a un bon flux et un bon rythme.</p>
            </div>
        );
    }

    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">
                        {issues.length} problème{issues.length > 1 ? 's' : ''} de rythme détecté{issues.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2 mt-1">
                        {highCount > 0 && <Badge className="text-[10px] bg-red-500 text-white">{highCount} critique{highCount > 1 ? 's' : ''}</Badge>}
                        {mediumCount > 0 && <Badge className="text-[10px] bg-amber-500 text-white">{mediumCount} moyen{mediumCount > 1 ? 's' : ''}</Badge>}
                        {lowCount > 0 && <Badge className="text-[10px] bg-blue-400 text-white">{lowCount} mineur{lowCount > 1 ? 's' : ''}</Badge>}
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {issues
                    .sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.severity] || 1) - (order[b.severity] || 1);
                    })
                    .map((issue, idx) => {
                        const config = ISSUE_CONFIG[issue.issue_type] || ISSUE_CONFIG.monotone;
                        const Icon = config.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-3 rounded-lg border ${config.highlight}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                                            <Badge className={`text-[10px] ${SEVERITY_BADGE[issue.severity] || SEVERITY_BADGE.medium}`}>
                                                {issue.severity === 'high' ? 'Critique' : issue.severity === 'medium' ? 'Moyen' : 'Mineur'}
                                            </Badge>
                                        </div>

                                        {/* Highlighted text excerpt */}
                                        <div className="p-2 bg-white rounded border border-slate-200 mb-2">
                                            <p className="text-xs text-slate-800 italic leading-relaxed">
                                                "...{issue.text_excerpt}..."
                                            </p>
                                        </div>

                                        <p className="text-xs text-slate-600 mb-1.5">{issue.explanation}</p>
                                        <div className="p-2 bg-green-50 rounded border border-green-200">
                                            <p className="text-xs text-green-700 flex items-start gap-1.5">
                                                <span className="font-semibold shrink-0">💡 Fix :</span>
                                                {issue.fix_suggestion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
            </div>
        </div>
    );
}