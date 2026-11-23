import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Scissors, Clock, MessageSquare, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export default function SceneBreakSuggestions({ breaks, idealCount }) {
    if (!breaks || breaks.length === 0) {
        return (
            <div className="text-center py-10">
                <Scissors className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">Aucune suggestion de découpage disponible.</p>
            </div>
        );
    }

    const totalDuration = breaks.reduce((sum, b) => sum + (b.estimated_scene_duration || 0), 0);
    const totalWords = breaks.reduce((sum, b) => sum + (b.dialogue_word_count || 0), 0);
    const avgWordsPerScene = totalWords > 0 ? Math.round(totalWords / breaks.length) : 0;

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{breaks.length}</p>
                    <p className="text-[10px] text-indigo-500 uppercase font-semibold">Scènes suggérées</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-lg border border-violet-200 text-center">
                    <p className="text-2xl font-bold text-violet-700">~{totalDuration}s</p>
                    <p className="text-[10px] text-violet-500 uppercase font-semibold">Durée totale</p>
                </div>
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-center">
                    <p className="text-2xl font-bold text-sky-700">{avgWordsPerScene}</p>
                    <p className="text-[10px] text-sky-500 uppercase font-semibold">Mots/scène</p>
                </div>
            </div>

            {idealCount && breaks.length !== idealCount && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                    <Badge className="bg-amber-500 text-white text-[10px] shrink-0">Info</Badge>
                    <p className="text-xs text-amber-700">
                        L'analyse recommande <strong>{idealCount} scènes</strong> pour un résultat optimal. {breaks.length} scènes suggérées ici.
                    </p>
                </div>
            )}

            {/* Scene breaks timeline */}
            <div className="space-y-0 max-h-[50vh] overflow-y-auto">
                {breaks.map((sceneBreak, idx) => {
                    const isLong = (sceneBreak.dialogue_word_count || 0) > 50;
                    const isShort = (sceneBreak.dialogue_word_count || 0) < 10;
                    const balanceBg = isLong ? 'border-l-amber-400' : isShort ? 'border-l-blue-400' : 'border-l-green-400';

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                        >
                            <div className={`p-3 bg-white rounded-lg border border-slate-200 border-l-4 ${balanceBg} mb-2`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Badge className="bg-indigo-600 text-white text-[10px]">
                                                Scène {sceneBreak.scene_number}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {sceneBreak.estimated_scene_duration}s
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {sceneBreak.dialogue_word_count} mots
                                            </span>
                                            {isLong && <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600">Long</Badge>}
                                            {isShort && <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-600">Court</Badge>}
                                        </div>

                                        <p className="text-xs text-slate-600 mb-1">{sceneBreak.reason}</p>

                                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <p className="text-[11px] text-slate-500 italic">
                                                Fin de scène : "...{sceneBreak.break_after_text}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {idx < breaks.length - 1 && (
                                <div className="flex justify-center py-0.5">
                                    <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}