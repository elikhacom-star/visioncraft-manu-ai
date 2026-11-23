import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function CharacterAssigner({ onAssign, disabled }) {
    const [open, setOpen] = useState(false);

    const { data: characters = [] } = useQuery({
        queryKey: ['characters'],
        queryFn: () => base44.entities.Character.list(),
    });

    const handleSelect = (character) => {
        onAssign(character.name.toUpperCase());
        setOpen(false);
    };

    const handleNarrator = () => {
        onAssign('NARRATEUR');
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100 disabled:opacity-40"
                    title="Attribuer un personnage à la ligne sélectionnée"
                >
                    <User className="w-3 h-3" />
                    Personnage
                    <ChevronDown className="w-3 h-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
                <p className="text-[10px] text-slate-400 px-2 pb-1 font-medium uppercase tracking-wider">
                    Attribuer à...
                </p>
                <button
                    onClick={handleNarrator}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
                >
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">N</div>
                    Narrateur
                </button>
                {characters.length === 0 && (
                    <p className="text-xs text-slate-400 px-3 py-2 italic">Aucun personnage créé.<br/>Rendez-vous sur "Mes Personnages".</p>
                )}
                {characters.map((char) => (
                    <button
                        key={char.id}
                        onClick={() => handleSelect(char)}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-violet-50 flex items-center gap-2"
                    >
                        {char.avatar_url ? (
                            <img src={char.avatar_url} alt={char.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">
                                {char.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span>{char.name}</span>
                    </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                    <p className="text-[9px] text-slate-400 leading-tight">
                        💡 Placez le curseur sur la ligne souhaitée, puis choisissez un personnage pour préfixer automatiquement.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}