import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const TONES = [
  { id: 'humorous', label: '😂 Humoristique', prompt: 'Rewrite in a humorous, witty, fun tone with clever wordplay and light jokes' },
  { id: 'professional', label: '👔 Professionnel', prompt: 'Rewrite in a polished, corporate, professional tone suitable for business presentations' },
  { id: 'dramatic', label: '🎭 Dramatique', prompt: 'Rewrite in a dramatic, intense, cinematic tone with emotional impact and suspense' },
  { id: 'childlike', label: '🧸 Enfantin', prompt: 'Rewrite in a simple, fun, child-friendly tone using easy vocabulary and playful language' },
  { id: 'poetic', label: '✨ Poétique', prompt: 'Rewrite in a lyrical, poetic tone with metaphors, rhythm, and beautiful imagery' },
  { id: 'urgent', label: '🚨 Urgent / News', prompt: 'Rewrite in an urgent, breaking-news journalistic tone with authority and immediacy' },
  { id: 'intimate', label: '💭 Intime / ASMR', prompt: 'Rewrite in a soft, intimate, ASMR-like whisper tone with gentle pacing and calm energy' },
  { id: 'epic', label: '⚔️ Épique', prompt: 'Rewrite in an epic, grandiose, heroic tone like a movie trailer or legendary tale' },
];

const LANG_MAP = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German',
  it: 'Italian', ar: 'Arabic', ja: 'Japanese', pt: 'Portuguese'
};

export default function ToneRewriterButton({ script, onRewrite, language, disabled }) {
  const [loading, setLoading] = useState(null);

  const handleRewrite = async (tone) => {
    if (!script?.trim()) {
      toast.error("Écrivez d'abord un script");
      return;
    }
    
    setLoading(tone.id);
    const langName = LANG_MAP[language] || 'the same language as the original';
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${tone.prompt}. Keep the SAME meaning and information but completely change the style and tone. Write in ${langName}. Return ONLY the rewritten text, no quotes or explanations.\n\nOriginal script:\n"${script}"`
      });
      
      if (result) {
        const cleaned = result.replace(/^["']|["']$/g, '').trim();
        onRewrite(cleaned);
        toast.success(`Script réécrit en style "${tone.label}" !`);
      }
    } catch (e) {
      toast.error("Échec: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || !script?.trim() || loading !== null}
          className="text-purple-600 hover:bg-purple-50 h-8 gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Palette className="w-3 h-3" />}
          Ton
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-[10px] text-slate-400">Réécrire le script avec un ton</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TONES.map((tone) => (
          <DropdownMenuItem
            key={tone.id}
            onClick={() => handleRewrite(tone)}
            disabled={loading !== null}
            className="text-sm cursor-pointer"
          >
            {loading === tone.id ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
            {tone.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}