import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const LANG_MAP = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German',
  it: 'Italian', ar: 'Arabic', ja: 'Japanese', pt: 'Portuguese'
};

export default function UrlToScriptButton({ onApplyScript, language, disabled }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('narrative');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast.error("Entrez une URL");
      return;
    }

    setLoading(true);
    const langName = LANG_MAP[language] || 'French';

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Read and analyze the content from this URL: "${url}"
        
Then create a compelling 60-90 second video narration script based on that content.

Style: ${style === 'narrative' ? 'Cinematic narrative storytelling' : style === 'summary' ? 'Clear, concise summary' : 'News report / documentary'}

Requirements:
- Write ENTIRELY in ${langName}
- 100-200 words
- Engaging opening hook
- Key points from the article
- Compelling conclusion
- Write as PURE narration text, no speaker labels

Return ONLY the script text, no quotes or explanations.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash'
      });

      if (result) {
        const cleaned = result.replace(/^["']|["']$/g, '').trim();
        onApplyScript(cleaned);
        setOpen(false);
        setUrl('');
        toast.success("Script généré depuis l'URL !");
      }
    } catch (e) {
      toast.error("Échec: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="text-cyan-600 hover:bg-cyan-50 h-8 gap-1"
      >
        <Link2 className="w-3 h-3" />
        URL
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-500" />
              Script depuis un lien web
            </DialogTitle>
            <DialogDescription>
              Collez un lien d'article ou de page web pour générer automatiquement un script vidéo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">URL de l'article</Label>
              <Input
                placeholder="https://example.com/article..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Style du script</Label>
              <Select value={style} onValueChange={setStyle} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrative">📖 Narratif (Storytelling)</SelectItem>
                  <SelectItem value="summary">📋 Résumé concis</SelectItem>
                  <SelectItem value="news">📺 Reportage / News</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !url.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                'Générer le script'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}