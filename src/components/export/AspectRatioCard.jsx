import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const ASPECT_CONFIGS = {
    '16:9': { label: 'YouTube / Paysage', w: 1280, h: 720, icon: '🖥️', preview: 'aspect-video' },
    '9:16': { label: 'TikTok / Reels', w: 720, h: 1280, icon: '📱', preview: 'aspect-[9/16]' },
    '1:1':  { label: 'Instagram / Carré', w: 1080, h: 1080, icon: '📷', preview: 'aspect-square' },
    '4:5':  { label: 'Instagram Feed', w: 864, h: 1080, icon: '📸', preview: 'aspect-[4/5]' },
};

export { ASPECT_CONFIGS };

export default function AspectRatioCard({ ratio, selected, onToggle, disabled }) {
    const config = ASPECT_CONFIGS[ratio];
    if (!config) return null;

    return (
        <button
            type="button"
            onClick={() => onToggle(ratio)}
            disabled={disabled}
            className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                selected
                    ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {selected && (
                <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-amber-500" />
            )}
            <span className="text-2xl">{config.icon}</span>
            <div className="w-10 h-10 flex items-center justify-center">
                <div className={cn(
                    "border-2 rounded-sm",
                    selected ? "border-amber-500 bg-amber-100" : "border-slate-300 bg-slate-100",
                    ratio === '16:9' && "w-10 h-[22px]",
                    ratio === '9:16' && "w-[22px] h-10",
                    ratio === '1:1' && "w-8 h-8",
                    ratio === '4:5' && "w-7 h-[35px]",
                )} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">{ratio}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{config.label}</span>
        </button>
    );
}