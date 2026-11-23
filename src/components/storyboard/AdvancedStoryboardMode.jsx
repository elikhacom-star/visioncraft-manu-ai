import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Check, Layers, GitBranch } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getEmotionStyle } from '../ai/EmotionVoiceMap';

const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);

export default function AdvancedStoryboardMode({
  isOpen,
  onClose,
  scene,
  sceneIndex,
  fullScript,
  allScenes,
  onApplyVariant
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const generateVariants = async () => {
    setIsGenerating(true);
    setVariants([]);
    setSelectedIdx(null);

    const prompt = `You are a world-class film director. Given this scene from a storyboard, generate 3 COMPLETELY DIFFERENT creative variants.
Each variant must reimagine the scene with a different narrative angle, visual style, and emotional tone.

Context of the full story: "${(fullScript || '').substring(0, 400)}"

Current scene (#${sceneIndex + 1}):
- Visual: "${scene.visual_description || scene.description || ''}"
- Dialogue: "${scene.dialogue || ''}"
- Mood: "${scene.mood || 'neutral'}"

For EACH of the 3 variants, provide:
- title: A short creative title (3-6 words)
- visual_description: Detailed cinematic visual description
- dialogue: New dialogue/narration text
- mood: Emotional mood keyword
- emotion_label: One of: dramatic, urgent, calm, joyful, melancholic, suspenseful, romantic, epic, mysterious, angry
- camera_angle: Suggested camera angle
- rationale: Why this variant works (1 sentence)

Make each variant RADICALLY different:
Variant 1 — Intensified/dramatic take
Variant 2 — Unexpected twist or contrast
Variant 3 — Intimate/emotional reimagining`;

    try {
      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  visual_description: { type: "string" },
                  dialogue: { type: "string" },
                  mood: { type: "string" },
                  emotion_label: { type: "string" },
                  camera_angle: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.variants?.length) {
        setVariants(result.variants);
        toast.success(`${result.variants.length} variantes générées`);
      }
    } catch (err) {
      console.error("Variant generation failed:", err);
      toast.error("Échec de la génération des variantes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async (variant) => {
    setIsApplying(true);
    try {
      await onApplyVariant({
        sceneIndex,
        newDescription: variant.visual_description,
        newDialogue: variant.dialogue,
        newMood: variant.mood,
        emotionLabel: variant.emotion_label,
        cameraAngle: variant.camera_angle,
        variantTitle: variant.title,
        regenerateVisuals: true
      });
      toast.success(`Variante "${variant.title}" appliquée`);
      onClose();
    } catch (err) {
      toast.error("Échec de l'application");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-amber-500" />
            Storyboarding Avancé — Scène {sceneIndex + 1}
          </DialogTitle>
          <DialogDescription>
            Générez 3 variantes narratives et visuelles pour explorer les meilleures directions créatives.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Current scene summary */}
          <Card className="border-2 border-slate-300 bg-slate-50 dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-slate-200 dark:bg-slate-700">Scène Actuelle</Badge>
                {scene.emotion_label && (
                  <Badge variant="outline" className={getEmotionStyle(scene.emotion_label).color}>
                    {getEmotionStyle(scene.emotion_label).icon} {scene.emotion_label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{scene.visual_description || scene.description}</p>
              {scene.dialogue && <p className="text-xs text-slate-500 italic mt-2">"{scene.dialogue}"</p>}
            </CardContent>
          </Card>

          {variants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="w-16 h-16 text-amber-400 opacity-50 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Explorez des variantes créatives
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                L'IA va générer 3 directions radicalement différentes avec des émotions, visuels et dialogues uniques.
              </p>
              <Button
                onClick={generateVariants}
                disabled={isGenerating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                size="lg"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Génération en cours...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />Générer 3 Variantes</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Choisissez votre variante
                </h3>
                <Button variant="ghost" size="sm" onClick={generateVariants} disabled={isGenerating} className="text-amber-600">
                  <Sparkles className="w-4 h-4 mr-1" />Régénérer
                </Button>
              </div>

              {variants.map((variant, idx) => {
                const emotionInfo = getEmotionStyle(variant.emotion_label);
                const isSelected = selectedIdx === idx;

                return (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                      isSelected
                        ? 'border-amber-500 shadow-md ring-2 ring-amber-200 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                    }`}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="bg-amber-500 text-white">Variante {idx + 1}</Badge>
                            <Badge variant="outline" className={emotionInfo.color}>
                              {emotionInfo.icon} {variant.emotion_label}
                            </Badge>
                            {variant.camera_angle && (
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-xs">
                                📷 {variant.camera_angle}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{variant.title}</h4>
                          <p className="text-xs text-slate-500 italic mt-1">{variant.rationale}</p>
                        </div>
                        {isSelected && <Check className="w-6 h-6 text-amber-500 flex-shrink-0" />}
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 mb-1 font-semibold">Visuel:</div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{variant.visual_description}</p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">Dialogue:</div>
                        <p className="text-xs text-blue-800 dark:text-blue-200 italic">"{variant.dialogue}"</p>
                      </div>

                      {isSelected && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleApply(variant); }}
                          disabled={isApplying}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          {isApplying ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Application...</>
                          ) : (
                            <><Check className="w-4 h-4 mr-2" />Appliquer cette Variante</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}