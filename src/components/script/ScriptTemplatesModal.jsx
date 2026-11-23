import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, BookOpen, Megaphone, GraduationCap, ShoppingBag, Film, Heart, Mic, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SCRIPT_TEMPLATES = [
  {
    id: 'product-ad',
    name: 'Pub Produit',
    icon: ShoppingBag,
    color: 'bg-blue-100 text-blue-700',
    description: 'Vidéo promotionnelle pour un produit ou service',
    prompt: (topic, lang) => `Write a compelling 60-second product advertisement video script in ${lang} about: "${topic}". Include a hook opening, key features/benefits, social proof, and a clear call-to-action. Style: energetic, persuasive, modern.`
  },
  {
    id: 'tutorial',
    name: 'Tutoriel',
    icon: GraduationCap,
    color: 'bg-green-100 text-green-700',
    description: 'Vidéo éducative étape par étape',
    prompt: (topic, lang) => `Write a clear, engaging 90-second tutorial/educational video script in ${lang} about: "${topic}". Structure: Introduction > Problem > Step-by-step solution > Summary. Style: clear, friendly, informative.`
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-700',
    description: 'Récit narratif captivant',
    prompt: (topic, lang) => `Write a captivating 60-second storytelling video script in ${lang} about: "${topic}". Use narrative arc: Setup > Rising action > Climax > Resolution. Style: cinematic, emotional, immersive narration.`
  },
  {
    id: 'pitch',
    name: 'Pitch / Présentation',
    icon: Megaphone,
    color: 'bg-orange-100 text-orange-700',
    description: 'Pitch commercial ou présentation d\'entreprise',
    prompt: (topic, lang) => `Write a professional 60-second pitch/presentation video script in ${lang} about: "${topic}". Structure: Problem > Solution > Differentiation > Call-to-action. Style: confident, data-driven, inspiring.`
  },
  {
    id: 'vlog',
    name: 'Vlog / Personnel',
    icon: Mic,
    color: 'bg-pink-100 text-pink-700',
    description: 'Style vlog, personnel et authentique',
    prompt: (topic, lang) => `Write a personal, authentic 60-second vlog-style video script in ${lang} about: "${topic}". Style: conversational, relatable, first-person narration with personal anecdotes.`
  },
  {
    id: 'cinematic',
    name: 'Court-métrage',
    icon: Film,
    color: 'bg-slate-100 text-slate-700',
    description: 'Script de court-métrage cinématique',
    prompt: (topic, lang) => `Write a cinematic short film script of about 90 seconds in ${lang} about: "${topic}". Include vivid visual descriptions, atmospheric mood, and compelling dialogue. Style: artistic, dramatic, visually rich.`
  },
  {
    id: 'motivational',
    name: 'Motivation',
    icon: Heart,
    color: 'bg-red-100 text-red-700',
    description: 'Vidéo motivationnelle et inspirante',
    prompt: (topic, lang) => `Write an inspiring, motivational 60-second video script in ${lang} about: "${topic}". Use powerful imagery, rhetorical questions, and an uplifting conclusion. Style: epic, empowering, emotional.`
  },
  {
    id: 'news',
    name: 'Reportage / News',
    icon: Globe,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Format journal télévisé ou reportage',
    prompt: (topic, lang) => `Write a professional news report / documentary-style video script of 60 seconds in ${lang} about: "${topic}". Include facts, context, quotes, and balanced perspective. Style: authoritative, factual, engaging.`
  }
];

const LANG_MAP = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German',
  it: 'Italian', ar: 'Arabic', ja: 'Japanese', pt: 'Portuguese',
  nl: 'Dutch', tr: 'Turkish', ko: 'Korean', zh: 'Chinese', hi: 'Hindi'
};

export default function ScriptTemplatesModal({ isOpen, onClose, onApplyScript, language }) {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(null);

  const handleGenerate = async (template) => {
    if (!topic.trim()) {
      toast.error("Entrez un sujet ou une idée");
      return;
    }
    
    setGenerating(template.id);
    const langName = LANG_MAP[language] || LANG_MAP.fr;
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: template.prompt(topic, langName)
      });
      
      if (result) {
        const cleaned = result.replace(/^["']|["']$/g, '').trim();
        onApplyScript(cleaned);
        onClose();
        toast.success(`Script "${template.name}" généré !`);
      }
    } catch (e) {
      toast.error("Échec de la génération: " + e.message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Modèles de Scripts par Genre
          </DialogTitle>
          <DialogDescription>
            Choisissez un genre et décrivez votre sujet pour générer un script adapté.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Décrivez votre sujet (ex: 'Les bienfaits du yoga', 'Notre nouvelle app mobile')"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            {SCRIPT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleGenerate(tpl)}
                disabled={generating !== null || !topic.trim()}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all text-left disabled:opacity-50"
              >
                <div className={`p-2 rounded-lg ${tpl.color} shrink-0`}>
                  {generating === tpl.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <tpl.icon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{tpl.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}