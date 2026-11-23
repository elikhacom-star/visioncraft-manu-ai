import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpTooltip({ title, description, steps }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors focus:outline-none"
        title="Aide"
        type="button"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Tooltip panel */}
          <div className="absolute z-50 left-1/2 -translate-x-1/2 top-7 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-amber-100 dark:border-amber-900/40 p-4 text-left">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{description}</p>
            )}
            {steps && steps.length > 0 && (
              <div className="space-y-1.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <a href="/Guide" className="text-[11px] text-amber-600 hover:underline">
                Voir le guide complet →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}