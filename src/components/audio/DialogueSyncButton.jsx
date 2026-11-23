import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, AudioLines, Settings2, Eye, Zap, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const SPEECH_PRESETS = {
    slow: { label: 'Lent / Dramatique', speed: 0.75, pauseMultiplier: 1.8, icon: '🎭', breathPause: 0.4 },
    normal: { label: 'Normal / Narration', speed: 1.0, pauseMultiplier: 1.0, icon: '🗣️', breathPause: 0.2 },
    fast: { label: 'Rapide / Énergique', speed: 1.3, pauseMultiplier: 0.6, icon: '⚡', breathPause: 0.1 },
    cinematic: { label: 'Cinématique', speed: 0.85, pauseMultiplier: 1.5, icon: '🎬', breathPause: 0.35 },
};

const EMOTION_KEYWORDS = {
    tension: { words: ['danger','mort','peur','menace','sombre','guerre','combat','cri','hurle','sang','feu','explosion','détruit','fin','chute'], speedMod: 0.85, pauseMod: 1.6, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Tension' },
    joy: { words: ['joie','bonheur','rire','sourire','fête','danse','lumière','soleil','amour','embrasse','célèbre','victoire','brille','éclat'], speedMod: 1.1, pauseMod: 0.7, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Joie' },
    sadness: { words: ['triste','pleure','larme','perte','seul','vide','silence','absent','regret','adieu','ombre','nuit','froid','abandonne'], speedMod: 0.7, pauseMod: 2.0, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Tristesse' },
    mystery: { words: ['mystère','secret','ombre','inconnu','étrange','cache','révèle','murmure','invisible','brume','énigme','disparaît'], speedMod: 0.8, pauseMod: 1.4, color: 'text-purple-400', bg: 'bg-purple-900/20', label: 'Mystère' },
    action: { words: ['cours','vite','attaque','frappe','saute','attrape','lance','pousse','tire','échappe','fonce','rapide','urgence'], speedMod: 1.25, pauseMod: 0.5, color: 'text-orange-400', bg: 'bg-orange-900/20', label: 'Action' },
    neutral: { words: [], speedMod: 1.0, pauseMod: 1.0, color: 'text-slate-400', bg: 'bg-slate-800/30', label: 'Neutre' },
};

function analyzeEmotion(text) {
    if (!text || !text.trim()) return { emotion: 'neutral', confidence: 0, scores: {} };
    const lower = text.toLowerCase();
    const scores = {};
    let maxEmotion = 'neutral';
    let maxScore = 0;
    for (const [emo, config] of Object.entries(EMOTION_KEYWORDS)) {
        if (emo === 'neutral') continue;
        const count = config.words.reduce((acc, w) => acc + (lower.split(w).length - 1), 0);
        scores[emo] = count;
        if (count > maxScore) { maxScore = count; maxEmotion = emo; }
    }
    // Also check punctuation intensity
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const ellipsis = (text.match(/\.\.\./g) || []).length;
    if (exclamations >= 2 && maxScore < 2) { maxEmotion = 'action'; maxScore = 2; }
    if (ellipsis >= 2 && maxScore < 2) { maxEmotion = 'mystery'; maxScore = 2; }
    
    return { emotion: maxEmotion, confidence: Math.min(maxScore / 3, 1), scores };
}

function detectDramaticPauses(text) {
    if (!text) return [];
    const pauses = [];
    // Ellipsis = dramatic pause
    let match;
    const ellipsisRe = /\.{3}|…/g;
    while ((match = ellipsisRe.exec(text)) !== null) {
        pauses.push({ type: 'ellipsis', position: match.index / text.length, weight: 0.8 });
    }
    // Em-dash = beat pause
    const dashRe = /[—–]/g;
    while ((match = dashRe.exec(text)) !== null) {
        pauses.push({ type: 'beat', position: match.index / text.length, weight: 0.4 });
    }
    // Double line break = scene pause
    const breakRe = /\n\s*\n/g;
    while ((match = breakRe.exec(text)) !== null) {
        pauses.push({ type: 'scene_break', position: match.index / text.length, weight: 1.2 });
    }
    // End sentence with ? or ! after long sentence
    const sentenceRe = /[^.!?]{40,}[!?]/g;
    while ((match = sentenceRe.exec(text)) !== null) {
        pauses.push({ type: 'emphasis', position: (match.index + match[0].length) / text.length, weight: 0.6 });
    }
    return pauses;
}

function estimateAdvancedDuration(dialogue, speed, pauseMult, emotionMod, breathPause, dramaticPauses) {
    if (!dialogue || !dialogue.trim()) return 0;
    const words = dialogue.split(/\s+/).filter(w => w.length > 0);
    // Base: ~2.5 words/sec at normal speed. Speed >1 = faster = shorter duration
    const wordsPerSecond = 2.5 * speed;
    const baseDuration = words.length / wordsPerSecond;
    
    const sentenceBreaks = (dialogue.match(/[.!?…]+/g) || []).length;
    const commaBreaks = (dialogue.match(/[,;:–—]+/g) || []).length;
    // Simple pause additions (not multiplied by emotion — keep it predictable)
    const punctPause = sentenceBreaks * 0.3 * pauseMult + commaBreaks * 0.1 * pauseMult;
    const dramaticPauseTime = dramaticPauses.reduce((acc, p) => acc + p.weight * 0.3, 0) * pauseMult;
    const breathTime = sentenceBreaks * breathPause;
    
    let total = baseDuration + punctPause + dramaticPauseTime + breathTime + 0.3;
    // Apply emotion as a gentle modifier (±15% max), not compounding
    if (emotionMod && emotionMod.speedMod !== 1.0) {
        const emotionFactor = 1 + (1 - emotionMod.speedMod) * 0.5; // Halve the emotion effect
        total *= emotionFactor;
    }
    return total;
}

export default function DialogueSyncButton({ scenes, voiceovers, onSyncComplete }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [preset, setPreset] = useState('normal');
    const [customSpeed, setCustomSpeed] = useState([1.0]);
    const [customPause, setCustomPause] = useState([1.0]);
    const [customBreath, setCustomBreath] = useState([0.2]);
    const [minDuration, setMinDuration] = useState([2]);
    const [maxDuration, setMaxDuration] = useState([30]);
    const [isOpen, setIsOpen] = useState(false);
    const [emotionAdapt, setEmotionAdapt] = useState(true);
    const [dramaticPauses, setDramaticPauses] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('presets');

    const activeSpeed = preset === 'custom' ? customSpeed[0] : SPEECH_PRESETS[preset]?.speed || 1.0;
    const activePause = preset === 'custom' ? customPause[0] : SPEECH_PRESETS[preset]?.pauseMultiplier || 1.0;
    const activeBreath = preset === 'custom' ? customBreath[0] : SPEECH_PRESETS[preset]?.breathPause || 0.2;

    // Analyze all scenes for preview
    const sceneAnalysis = useMemo(() => {
        if (!scenes) return [];
        return scenes.map((scene, i) => {
            const voiceover = voiceovers?.[i];
            const dialogue = scene.dialogue || voiceover?.dialogue || '';
            const emotion = analyzeEmotion(dialogue);
            const pauses = detectDramaticPauses(dialogue);
            const emotionConfig = EMOTION_KEYWORDS[emotion.emotion];
            const targetDuration = estimateAdvancedDuration(
                dialogue, activeSpeed, activePause,
                emotionAdapt ? emotionConfig : null,
                activeBreath, dramaticPauses ? pauses : []
            );
            const clampedDuration = dialogue ? Math.max(minDuration[0], Math.min(maxDuration[0], Math.round(targetDuration * 10) / 10)) : scene.duration || 5;
            return {
                sceneIndex: i,
                dialogue: dialogue.slice(0, 80) + (dialogue.length > 80 ? '…' : ''),
                emotion,
                emotionConfig,
                pauses,
                currentDuration: scene.duration || 5,
                targetDuration: clampedDuration,
                changed: dialogue && Math.abs(clampedDuration - (scene.duration || 5)) > 0.3,
                hasDialogue: !!dialogue.trim(),
                wordCount: dialogue.split(/\s+/).filter(w => w.length > 0).length,
            };
        });
    }, [scenes, voiceovers, activeSpeed, activePause, activeBreath, minDuration, maxDuration, emotionAdapt, dramaticPauses]);

    const changedCount = sceneAnalysis.filter(s => s.changed).length;
    const totalOriginal = sceneAnalysis.reduce((a, s) => a + s.currentDuration, 0);
    const totalTarget = sceneAnalysis.reduce((a, s) => a + s.targetDuration, 0);

    const handleSync = async () => {
        if (!scenes || scenes.length === 0) return;
        setIsSyncing(true);
        const toastId = toast.loading("Synchronisation avancée dialogue ↔ scènes...");

        const syncedScenes = [];
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const analysis = sceneAnalysis[i];
            const voiceover = voiceovers?.[i];
            let targetDuration = analysis.targetDuration;

            // If audio blob exists, use ACTUAL audio duration as the ground truth
            if (voiceover?.audioBlob) {
                try {
                    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                    const ab = await voiceover.audioBlob.slice(0, voiceover.audioBlob.size, voiceover.audioBlob.type).arrayBuffer();
                    const audioBuffer = await tempContext.decodeAudioData(ab);
                    let audioDuration = audioBuffer.duration;
                    tempContext.close();
                    // Add a small buffer for breathing room (0.3-0.5s)
                    audioDuration += 0.3 + (activeBreath * 0.5);
                    targetDuration = Math.max(minDuration[0], Math.min(maxDuration[0], Math.round(audioDuration * 10) / 10));
                } catch (e) {
                    console.warn(`Audio decode failed scene ${i + 1}:`, e);
                }
            }

            syncedScenes.push({
                ...scene,
                duration: targetDuration,
                speechSpeed: activeSpeed,
                pauseStyle: activePause,
                _syncInfo: {
                    originalDuration: scene.duration || 5,
                    autoSynced: true,
                    preset,
                    emotion: analysis.emotion.emotion,
                    emotionConfidence: analysis.emotion.confidence,
                    dramaticPauses: analysis.pauses.length,
                }
            });
        }

        toast.dismiss(toastId);
        if (changedCount > 0) {
            onSyncComplete(syncedScenes);
            toast.success(`${changedCount} scène(s) synchronisée(s) avec analyse émotionnelle`);
        } else {
            toast.info("Les durées sont déjà synchronisées.");
        }
        setIsSyncing(false);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isSyncing || !scenes || scenes.length === 0}
                    className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                    title="Synchronisation avancée dialogues ↔ scènes">
                    {isSyncing ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sync...</>
                    ) : (
                        <><AudioLines className="w-3 h-3 mr-1" /> Sync Dialogue</>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-white p-0" side="bottom" align="start">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-slate-700">
                        <Settings2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold flex-1">Sync Avancée</span>
                        <TabsList className="h-7 bg-slate-800 p-0.5">
                            <TabsTrigger value="presets" className="text-[10px] h-6 px-2 data-[state=active]:bg-emerald-600/30 data-[state=active]:text-emerald-300">Rythme</TabsTrigger>
                            <TabsTrigger value="emotion" className="text-[10px] h-6 px-2 data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300">Émotion</TabsTrigger>
                            <TabsTrigger value="preview" className="text-[10px] h-6 px-2 data-[state=active]:bg-amber-600/30 data-[state=active]:text-amber-300">Aperçu</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="presets" className="p-3 space-y-3 mt-0">
                        {/* Presets */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Profil de rythme</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(SPEECH_PRESETS).map(([key, p]) => (
                                    <button key={key} onClick={() => setPreset(key)}
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all ${
                                            preset === key ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300' 
                                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                        }`}>
                                        <span>{p.icon}</span><span className="truncate">{p.label}</span>
                                    </button>
                                ))}
                                <button onClick={() => setPreset('custom')}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all col-span-2 ${
                                        preset === 'custom' ? 'bg-amber-600/30 border border-amber-500/50 text-amber-300' 
                                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                    }`}>
                                    <span>🎛️</span><span>Personnalisé</span>
                                </button>
                            </div>
                        </div>
                        
                        {preset === 'custom' && (
                            <div className="space-y-3 p-2 bg-slate-800/50 rounded border border-slate-700">
                                <SliderControl label="Vitesse de parole" value={customSpeed} onChange={setCustomSpeed} min={0.5} max={2.0} step={0.05} labels={['Lent','Normal','Rapide']} />
                                <SliderControl label="Intensité des pauses" value={customPause} onChange={setCustomPause} min={0.2} max={3.0} step={0.1} labels={['Compact','Normal','Dramatique']} />
                                <SliderControl label="Respiration entre phrases" value={customBreath} onChange={setCustomBreath} min={0} max={0.8} step={0.05} labels={['Aucune','Légère','Ample']} />
                            </div>
                        )}

                        {/* Duration limits */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-400">Min (s)</Label>
                                <Slider value={minDuration} onValueChange={setMinDuration} min={1} max={5} step={0.5} />
                                <span className="text-[9px] text-slate-500 font-mono">{minDuration[0]}s</span>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-400">Max (s)</Label>
                                <Slider value={maxDuration} onValueChange={setMaxDuration} min={10} max={60} step={5} />
                                <span className="text-[9px] text-slate-500 font-mono">{maxDuration[0]}s</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="emotion" className="p-3 space-y-3 mt-0">
                        {/* Emotion toggles */}
                        <div className="space-y-2">
                            <ToggleOption label="Adaptation émotionnelle" description="Ajuste le rythme selon l'émotion détectée dans le dialogue" enabled={emotionAdapt} onToggle={() => setEmotionAdapt(!emotionAdapt)} color="purple" />
                            <ToggleOption label="Pauses dramatiques" description="Détecte les … — et pauses narratives pour allonger la scène" enabled={dramaticPauses} onToggle={() => setDramaticPauses(!dramaticPauses)} color="amber" />
                        </div>

                        {/* Emotion legend */}
                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Émotions détectées</Label>
                            <div className="grid grid-cols-3 gap-1">
                                {Object.entries(EMOTION_KEYWORDS).filter(([k]) => k !== 'neutral').map(([key, cfg]) => {
                                    const count = sceneAnalysis.filter(s => s.emotion.emotion === key).length;
                                    return (
                                        <div key={key} className={`${cfg.bg} rounded px-1.5 py-1 text-center`}>
                                            <div className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</div>
                                            <div className="text-[9px] text-slate-500">{count} scène{count !== 1 ? 's' : ''}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {emotionAdapt && (
                            <div className="text-[9px] text-slate-500 bg-slate-800/40 rounded p-2">
                                <span className="text-purple-400">ℹ️</span> L'adaptation émotionnelle modifie automatiquement le rythme :
                                scènes tristes = plus lent, scènes d'action = plus rapide, etc.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="preview" className="p-3 space-y-2 mt-0">
                        {/* Preview summary */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{changedCount} scène(s) modifiée(s)</span>
                            <span className="font-mono">
                                {totalOriginal.toFixed(1)}s → <span className={totalTarget > totalOriginal ? 'text-amber-400' : 'text-emerald-400'}>{totalTarget.toFixed(1)}s</span>
                            </span>
                        </div>

                        {/* Scene-by-scene preview */}
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {sceneAnalysis.map((s, i) => {
                                const emoCfg = EMOTION_KEYWORDS[s.emotion.emotion];
                                return (
                                    <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] ${s.changed ? 'bg-slate-800/60 border border-slate-700' : 'bg-slate-800/20'}`}>
                                        <span className="text-slate-500 w-4 text-right shrink-0">{i + 1}</span>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.hasDialogue ? emoCfg.color.replace('text-', 'bg-') : 'bg-slate-600'}`} />
                                        <span className="truncate flex-1 text-slate-300">
                                            {s.hasDialogue ? s.dialogue : <span className="italic text-slate-500">Pas de dialogue</span>}
                                        </span>
                                        {s.hasDialogue && (
                                            <span className={`shrink-0 font-mono ${s.changed ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {s.currentDuration}s→{s.targetDuration}s
                                            </span>
                                        )}
                                        {s.pauses.length > 0 && dramaticPauses && (
                                            <span className="text-amber-500 shrink-0" title={`${s.pauses.length} pause(s) dramatique(s)`}>⏸{s.pauses.length}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Emotion distribution bar */}
                        {sceneAnalysis.some(s => s.hasDialogue) && (
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-400">Distribution émotionnelle</Label>
                                <div className="flex h-2 rounded-full overflow-hidden">
                                    {Object.entries(EMOTION_KEYWORDS).map(([emo, cfg]) => {
                                        const count = sceneAnalysis.filter(s => s.emotion.emotion === emo && s.hasDialogue).length;
                                        const total = sceneAnalysis.filter(s => s.hasDialogue).length;
                                        if (count === 0 || total === 0) return null;
                                        const pct = (count / total * 100);
                                        return <div key={emo} className={`${cfg.color.replace('text-', 'bg-')} opacity-60`} style={{ width: `${pct}%` }} title={`${cfg.label}: ${count}`} />;
                                    })}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Footer — always visible */}
                <div className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-2">
                    <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>⚡ {activeSpeed.toFixed(2)}x · Pauses {activePause.toFixed(1)}x</span>
                        <span>{emotionAdapt ? '🎭 Émo ON' : ''} {dramaticPauses ? '⏸ Pauses ON' : ''}</span>
                    </div>
                    <Button onClick={handleSync} disabled={isSyncing || !scenes || scenes.length === 0 || changedCount === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                        {isSyncing ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Synchronisation...</>
                        ) : (
                            <><AudioLines className="w-3 h-3 mr-1" /> Synchroniser {changedCount} scène(s)</>
                        )}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SliderControl({ label, value, onChange, min, max, step, labels }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
                <span>{label}</span>
                <span className="font-mono text-amber-400">{value[0].toFixed(2)}</span>
            </div>
            <Slider value={value} onValueChange={onChange} min={min} max={max} step={step} className="[&_[role=slider]]:bg-amber-500" />
            {labels && (
                <div className="flex justify-between text-[8px] text-slate-600">
                    {labels.map((l, i) => <span key={i}>{l}</span>)}
                </div>
            )}
        </div>
    );
}

function ToggleOption({ label, description, enabled, onToggle, color }) {
    const colors = {
        purple: { active: 'bg-purple-600/30 border-purple-500/50', dot: 'bg-purple-400' },
        amber: { active: 'bg-amber-600/30 border-amber-500/50', dot: 'bg-amber-400' },
    };
    const c = colors[color] || colors.purple;
    return (
        <button onClick={onToggle}
            className={`w-full flex items-start gap-2 p-2 rounded border text-left transition-all ${
                enabled ? `${c.active}` : 'bg-slate-800/30 border-slate-700'
            }`}>
            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 transition-all ${enabled ? c.dot : 'bg-slate-600'}`} />
            <div>
                <div className="text-[11px] font-medium text-slate-200">{label}</div>
                <div className="text-[9px] text-slate-500">{description}</div>
            </div>
        </button>
    );
}