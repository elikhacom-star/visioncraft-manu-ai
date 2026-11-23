import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Globe, Check } from "lucide-react";

const LANG_PATTERNS = {
  fr: /\b(le|la|les|des|une|est|sont|dans|pour|avec|que|qui|mais|cette|très|aussi|nous|vous|ils|elles|leur|notre|votre|ce|mon|ton|son|pas|plus|fait)\b/gi,
  en: /\b(the|is|are|was|were|have|has|been|this|that|with|from|they|their|about|would|could|should|which|there|these|those|where|when|what)\b/gi,
  es: /\b(el|los|las|una|unos|está|son|para|con|que|pero|esta|muy|también|nosotros|ustedes|ellos|nuestro|hacer|tiene|desde|como|más)\b/gi,
  de: /\b(der|die|das|ein|eine|ist|sind|haben|werden|nicht|auch|noch|dann|wenn|über|nach|oder|und|aber|diese|dieser|diesem)\b/gi,
  it: /\b(il|lo|la|gli|una|uno|è|sono|hanno|nella|nella|questo|questa|anche|molto|loro|nostro|fare|perché|come|più|dove)\b/gi,
  ar: /[\u0600-\u06FF]{3,}/g,
  ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]{2,}/g,
  pt: /\b(o|os|as|uma|uns|está|são|para|com|que|mas|esta|muito|também|nosso|fazer|onde|como|mais|porque|quando)\b/gi,
  nl: /\b(het|een|zijn|hebben|worden|niet|ook|nog|dan|als|over|naar|maar|deze|dit|waar|wat|wie|hoe)\b/gi,
  tr: /\b(bir|ve|bu|ile|için|var|olan|gibi|daha|çok|ancak|ama|hem|ya|veya|nasıl|neden|nerede)\b/gi,
};

const LANG_NAMES = {
  fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch',
  it: 'Italiano', ar: 'العربية', ja: '日本語', pt: 'Português',
  nl: 'Nederlands', tr: 'Türkçe'
};

export function detectLanguage(text) {
  if (!text || text.length < 20) return null;
  
  const scores = {};
  for (const [lang, pattern] of Object.entries(LANG_PATTERNS)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }
  
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 3) return best[0];
  return null;
}

export default function AutoLanguageDetector({ script, currentLanguage, onLanguageDetected }) {
  const [detectedLang, setDetectedLang] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    const lang = detectLanguage(script);
    setDetectedLang(lang);
  }, [script]);

  if (!detectedLang || detectedLang === currentLanguage || dismissed) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs animate-in fade-in slide-in-from-top-2">
      <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="text-amber-800 dark:text-amber-200">
        Langue détectée : <strong>{LANG_NAMES[detectedLang] || detectedLang}</strong>
      </span>
      <button
        onClick={() => { onLanguageDetected(detectedLang); setDismissed(true); }}
        className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-medium hover:bg-amber-600 transition-colors"
      >
        <Check className="w-3 h-3" /> Appliquer
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 text-[10px]"
      >
        ✕
      </button>
    </div>
  );
}