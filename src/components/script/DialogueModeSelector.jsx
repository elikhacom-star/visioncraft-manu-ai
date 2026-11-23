import React from 'react';
import DialogueModeToggle from '../storyboard/DialogueModeToggle';

/**
 * Bloc "Mode des dialogues" affiché AVANT la génération du storyboard,
 * dans la section script de Home.jsx.
 */
export default function DialogueModeSelector({ mode, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Mode des dialogues générés
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {mode === 'strict'
            ? "Reprend fidèlement le texte du script original."
            : "L'IA réécrit et adapte les dialogues pour un rendu plus cinématique."}
        </span>
      </div>
      <DialogueModeToggle mode={mode} onChange={onChange} />
    </div>
  );
}