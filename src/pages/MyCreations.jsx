import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Loader2, Music, Search, Inbox } from "lucide-react";
import AudioCreationCard from "../components/AudioCreationCard";

export default function MyCreations() {
    const [search, setSearch] = useState('');

    const { data: creations = [], isLoading, refetch } = useQuery({
        queryKey: ['audioCreations'],
        queryFn: () => base44.entities.AudioCreation.list('-created_date', 100),
    });

    const filtered = creations.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (c.title || '').toLowerCase().includes(q)
            || (c.source_text || '').toLowerCase().includes(q)
            || (c.voice || '').toLowerCase().includes(q)
            || (c.language || '').toLowerCase().includes(q);
    });

    const handleDeleted = (id) => {
        refetch();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Mes Créations Audio</h1>
                </div>
                <p className="text-sm text-slate-500 mb-6 ml-12">
                    Retrouvez tous vos fichiers audio générés. Écoutez, téléchargez ou supprimez-les.
                </p>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par texte, voix, langue..."
                        className="pl-10"
                    />
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Inbox className="w-16 h-16 mb-4 opacity-40" />
                        <p className="text-lg font-medium">
                            {search ? "Aucun résultat" : "Aucune création audio"}
                        </p>
                        <p className="text-sm mt-1">
                            {search ? "Essayez un autre terme de recherche." : "Vos fichiers audio générés apparaîtront ici."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-400 mb-2">{filtered.length} création{filtered.length > 1 ? 's' : ''}</p>
                        {filtered.map(creation => (
                            <AudioCreationCard
                                key={creation.id}
                                creation={creation}
                                onDeleted={handleDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}