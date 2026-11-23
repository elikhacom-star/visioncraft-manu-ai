import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Zap, Heart, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Loader2, BarChart3, Clock, MessageSquare, Scissors, Timer, ArrowRight } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import PacingHighlighter from './analysis/PacingHighlighter';
import SceneBreakSuggestions from './analysis/SceneBreakSuggestions';
import DurationValidator from './analysis/DurationValidator';

const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);

const SCORE_COLORS = {
    low: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    high: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', bar: 'bg-green-500' },
};

function getScoreLevel(score) {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

function ScoreCard({ icon: Icon, label, score, maxScore = 10, description }) {
    const level = getScoreLevel(score);
    const colors = SCORE_COLORS[level];
    return (
        <div className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
                <span className={`text-lg font-bold ${colors.text}`}>{score}/{maxScore}</span>
            </div>
            <Progress value={(score / maxScore) * 100} className="h-1.5 mb-1.5" />
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    );
}

function SuggestionItem({ suggestion, index }) {
    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        low: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    const priorityLabel = { high: 'Priorité haute', medium: 'Priorité moyenne', low: 'Amélioration' };
    const p = suggestion.priority || 'medium';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
        >
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">{suggestion.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${priorityColors[p]}`}>
                        {priorityLabel[p]}
                    </Badge>
                </div>
                <p className="text-xs text-slate-500">{suggestion.description}</p>
                {suggestion.example && (
                    <div className="mt-1.5 p-2 bg-slate-50 rounded text-xs text-slate-600 italic border-l-2 border-amber-300">
                        "{suggestion.example}"
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function ScriptAnalyzer({ script, isOpen, onClose, onApplySuggestion, targetDuration, desiredSceneCount }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const analyzeScript = async () => {
        if (!script || script.trim().length < 20) return;
        setIsAnalyzing(true);
        setAnalysis(null);

        const wordCount = script.trim().split(/\s+/).filter(w => w).length;
        const estimatedDur = Math.round(wordCount / 2.5);
        const targetDur = targetDuration || 60;
        const targetScenes = desiredSceneCount || 6;

        const prompt = `
You are an expert video script analyst. Analyze this script comprehensively.

SCRIPT:
"""
${script}
"""

TARGET CONSTRAINTS:
- Target video duration: ${targetDur} seconds
- Desired scene count: ${targetScenes}
- Estimated script reading time: ~${estimatedDur} seconds (at 2.5 words/sec)

Provide a comprehensive analysis:

1. SCORES (1-10 each with description):
   - rhythm: Pacing variety, sentence length variation, flow
   - tone: Consistency, appropriateness
   - emotional_impact: Hook, arc, climax, CTA
   - clarity: Message clarity, structure
   - video_readiness: Visual cues, scene transitions

2. dominant_tone, estimated_duration_seconds, ideal_scene_count

3. PACING ANALYSIS (pacing_issues array): For each section of the script that has a pacing issue, provide:
   - text_excerpt: the exact problematic text (15-40 words)
   - issue_type: "too_fast" | "too_slow" | "monotone" | "abrupt_shift" | "no_pause"
   - severity: "high" | "medium" | "low"
   - explanation: why this is a pacing issue
   - fix_suggestion: how to fix it

4. SCENE BREAK SUGGESTIONS (scene_breaks array): Analyze dialogue/narration length and suggest where to split scenes. Each:
   - break_after_text: the last words before the break (10-20 words)
   - scene_number: suggested scene number (1-based)
   - reason: why this is a good break point
   - estimated_scene_duration: seconds for this scene
   - dialogue_word_count: words in this scene's dialogue

5. DURATION VALIDATION (duration_validation object):
   - is_valid: boolean - does script match target duration?
   - estimated_seconds: actual estimated duration
   - target_seconds: the target
   - difference_seconds: gap (positive = too long, negative = too short)
   - severity: "ok" | "warning" | "critical"
   - recommendation: what to do to fix the mismatch
   - words_to_add_or_remove: approximate word count adjustment needed

6. suggestions: 3-6 actionable improvements (title, description, priority, example)

Return JSON.
`;

        const result = await InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    rhythm: { type: "object", properties: { score: { type: "number" }, description: { type: "string" } } },
                    tone: { type: "object", properties: { score: { type: "number" }, description: { type: "string" } } },
                    emotional_impact: { type: "object", properties: { score: { type: "number" }, description: { type: "string" } } },
                    clarity: { type: "object", properties: { score: { type: "number" }, description: { type: "string" } } },
                    video_readiness: { type: "object", properties: { score: { type: "number" }, description: { type: "string" } } },
                    dominant_tone: { type: "string" },
                    estimated_duration_seconds: { type: "number" },
                    ideal_scene_count: { type: "number" },
                    pacing_issues: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                text_excerpt: { type: "string" },
                                issue_type: { type: "string" },
                                severity: { type: "string" },
                                explanation: { type: "string" },
                                fix_suggestion: { type: "string" }
                            }
                        }
                    },
                    scene_breaks: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                break_after_text: { type: "string" },
                                scene_number: { type: "number" },
                                reason: { type: "string" },
                                estimated_scene_duration: { type: "number" },
                                dialogue_word_count: { type: "number" }
                            }
                        }
                    },
                    duration_validation: {
                        type: "object",
                        properties: {
                            is_valid: { type: "boolean" },
                            estimated_seconds: { type: "number" },
                            target_seconds: { type: "number" },
                            difference_seconds: { type: "number" },
                            severity: { type: "string" },
                            recommendation: { type: "string" },
                            words_to_add_or_remove: { type: "number" }
                        }
                    },
                    suggestions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                priority: { type: "string" },
                                example: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        setAnalysis(result);
        setIsAnalyzing(false);
    };

    React.useEffect(() => {
        if (isOpen && !analysis && !isAnalyzing && script?.trim().length >= 20) {
            analyzeScript();
        }
    }, [isOpen]);

    const overallScore = analysis
        ? Math.round(((analysis.rhythm?.score || 0) + (analysis.tone?.score || 0) + (analysis.emotional_impact?.score || 0) + (analysis.clarity?.score || 0) + (analysis.video_readiness?.score || 0)) / 5 * 10) / 10
        : 0;

    const overallLevel = getScoreLevel(overallScore);
    const overallColors = SCORE_COLORS[overallLevel];

    const pacingIssueCount = analysis?.pacing_issues?.length || 0;
    const durationSeverity = analysis?.duration_validation?.severity || 'ok';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                        Analyse Avancée du Script
                    </DialogTitle>
                    <DialogDescription>
                        Rythme, découpage, validation de durée et suggestions d'amélioration
                    </DialogDescription>
                </DialogHeader>

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <p className="text-sm text-slate-500">Analyse approfondie en cours...</p>
                    </div>
                )}

                {analysis && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="overview" className="text-xs">Vue d'ensemble</TabsTrigger>
                            <TabsTrigger value="pacing" className="text-xs relative">
                                Rythme
                                {pacingIssueCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                                        {pacingIssueCount}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="scenes" className="text-xs">Découpage</TabsTrigger>
                            <TabsTrigger value="duration" className="text-xs relative">
                                Durée
                                {durationSeverity !== 'ok' && (
                                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${durationSeverity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: Overview (original) */}
                        <TabsContent value="overview" className="space-y-5">
                            <div className={`p-4 rounded-xl border-2 ${overallColors.border} ${overallColors.bg} text-center`}>
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    {overallScore >= 7 ? <CheckCircle2 className="w-6 h-6 text-green-600" /> :
                                     overallScore >= 4 ? <AlertTriangle className="w-6 h-6 text-amber-600" /> :
                                     <AlertTriangle className="w-6 h-6 text-red-600" />}
                                    <span className={`text-3xl font-bold ${overallColors.text}`}>{overallScore}/10</span>
                                </div>
                                <p className="text-sm text-slate-600">Score global du script</p>
                                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        Ton : <strong className="text-slate-700">{analysis.dominant_tone}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ~{analysis.estimated_duration_seconds}s
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        {analysis.ideal_scene_count} scènes idéales
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ScoreCard icon={Activity} label="Rythme" score={analysis.rhythm?.score || 0} description={analysis.rhythm?.description} />
                                <ScoreCard icon={Heart} label="Ton" score={analysis.tone?.score || 0} description={analysis.tone?.description} />
                                <ScoreCard icon={Zap} label="Impact émotionnel" score={analysis.emotional_impact?.score || 0} description={analysis.emotional_impact?.description} />
                                <ScoreCard icon={TrendingUp} label="Clarté" score={analysis.clarity?.score || 0} description={analysis.clarity?.description} />
                                <div className="sm:col-span-2">
                                    <ScoreCard icon={BarChart3} label="Prêt pour la vidéo" score={analysis.video_readiness?.score || 0} description={analysis.video_readiness?.description} />
                                </div>
                            </div>

                            {analysis.suggestions?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                        Suggestions d'amélioration ({analysis.suggestions.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {analysis.suggestions
                                            .sort((a, b) => {
                                                const order = { high: 0, medium: 1, low: 2 };
                                                return (order[a.priority] || 1) - (order[b.priority] || 1);
                                            })
                                            .map((s, i) => (
                                                <SuggestionItem key={i} suggestion={s} index={i} />
                                            ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB 2: Pacing */}
                        <TabsContent value="pacing">
                            <PacingHighlighter script={script} issues={analysis.pacing_issues || []} />
                        </TabsContent>

                        {/* TAB 3: Scene Breaks */}
                        <TabsContent value="scenes">
                            <SceneBreakSuggestions breaks={analysis.scene_breaks || []} idealCount={analysis.ideal_scene_count} />
                        </TabsContent>

                        {/* TAB 4: Duration Validation */}
                        <TabsContent value="duration">
                            <DurationValidator
                                validation={analysis.duration_validation}
                                estimatedDuration={analysis.estimated_duration_seconds}
                                idealSceneCount={analysis.ideal_scene_count}
                                script={script}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {!isAnalyzing && !analysis && (
                    <div className="text-center py-8 text-slate-500">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">Le script doit contenir au moins 20 caractères pour être analysé.</p>
                    </div>
                )}

                {/* Actions */}
                {analysis && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Button variant="outline" size="sm" onClick={() => { setAnalysis(null); analyzeScript(); }} disabled={isAnalyzing} className="gap-2">
                            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                            Ré-analyser
                        </Button>
                        <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}