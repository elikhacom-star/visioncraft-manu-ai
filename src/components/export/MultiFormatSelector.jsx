import React from 'react';
import AspectRatioCard, { ASPECT_CONFIGS } from './AspectRatioCard';

const ALL_RATIOS = Object.keys(ASPECT_CONFIGS);

export default function MultiFormatSelector({ selectedRatios, onToggle, disabled }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Formats de sortie</span>
                <button
                    type="button"
                    onClick={() => {
                        if (selectedRatios.length === ALL_RATIOS.length) {
                            onToggle('16:9', true); // Reset to just 16:9
                        } else {
                            ALL_RATIOS.forEach(r => {
                                if (!selectedRatios.includes(r)) onToggle(r);
                            });
                        }
                    }}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-medium"
                    disabled={disabled}
                >
                    {selectedRatios.length === ALL_RATIOS.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {ALL_RATIOS.map(ratio => (
                    <AspectRatioCard
                        key={ratio}
                        ratio={ratio}
                        selected={selectedRatios.includes(ratio)}
                        onToggle={onToggle}
                        disabled={disabled}
                    />
                ))}
            </div>
            {selectedRatios.length > 1 && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-center">
                    {selectedRatios.length} formats sélectionnés — les vidéos seront rendues séquentiellement
                </p>
            )}
        </div>
    );
}