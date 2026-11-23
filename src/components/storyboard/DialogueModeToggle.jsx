import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DialogueModeToggle({ mode, onChange }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 shrink-0">
            <button
              onClick={() => onChange('strict')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mode === 'strict'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3 h-3" />
              Script strict
            </button>
            <button
              onClick={() => onChange('adaptive')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mode === 'adaptive'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              IA adaptée
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-xs">
          {mode === 'strict'
            ? "Les dialogues reprennent fidèlement le texte du script original."
            : "L'IA réécrit et adapte les dialogues pour un rendu plus cinématique."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}