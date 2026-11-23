import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Images, Search, X, ExternalLink, FileText, Loader2 } from 'lucide-react';

export default function Gallery() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null); // { imageUrl, scene, project }

    const { data: user } = useQuery({
        queryKey: ['userMe'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', user?.email],
        queryFn: () => base44.entities.Project.filter({ created_by: user.email }, '-updated_date'),
        enabled: !!user?.email,
    });

    // Flatten all images from all projects
    const allImages = useMemo(() => {
        const imgs = [];
        for (const project of projects) {
            const scenes = project.generated_images || [];
            for (const scene of scenes) {
                if (scene.url) {
                    imgs.push({
                        url: scene.url,
                        description: scene.description || scene.visual_description || '',
                        dialogue: scene.dialogue || '',
                        sceneNumber: scene.scene_number,
                        project,
                    });
                }
            }
        }
        return imgs;
    }, [projects]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allImages;
        const q = search.toLowerCase();
        return allImages.filter(img =>
            img.description.toLowerCase().includes(q) ||
            img.dialogue.toLowerCase().includes(q) ||
            img.project.name?.toLowerCase().includes(q) ||
            img.project.script?.toLowerCase().includes(q)
        );
    }, [allImages, search]);

    const handleOpenProject = (project) => {
        setSelected(null);
        navigate(createPageUrl('Home'), {
            state: { projectData: project, isResume: true }
        });
    };

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Images className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Connexion requise</h2>
                <Button onClick={() => base44.auth.redirectToLogin()}>Se connecter</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Images className="w-8 h-8 text-amber-500" />
                            Galerie
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {allImages.length} image{allImages.length !== 1 ? 's' : ''} générée{allImages.length !== 1 ? 's' : ''} dans {projects.length} projet{projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par description, projet..."
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                )}

                {/* Empty */}
                {!isLoading && allImages.length === 0 && (
                    <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Images className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune image générée pour l'instant.</p>
                        <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate(createPageUrl('Home'))}>
                            Créer mon premier projet
                        </Button>
                    </div>
                )}

                {/* No results */}
                {!isLoading && allImages.length > 0 && filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        Aucune image ne correspond à votre recherche.
                    </div>
                )}

                {/* Grid */}
                {!isLoading && filtered.length > 0 && (
                    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
                        {filtered.map((img, idx) => (
                            <div
                                key={idx}
                                className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                                onClick={() => setSelected(img)}
                            >
                                <img
                                    src={img.url}
                                    alt={img.description || `Scène ${img.sceneNumber}`}
                                    className="w-full h-auto block group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                                    <p className="text-white text-xs font-medium line-clamp-2">{img.project.name}</p>
                                    {img.sceneNumber && (
                                        <span className="text-white/70 text-[10px]">Scène {img.sceneNumber}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden">
                        <div className="relative">
                            <img
                                src={selected.url}
                                alt={selected.description}
                                className="w-full h-auto max-h-[60vh] object-contain bg-black"
                            />
                            <button
                                onClick={() => setSelected(null)}
                                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <span>{selected.project.name}</span>
                                    {selected.sceneNumber && (
                                        <Badge variant="secondary">Scène {selected.sceneNumber}</Badge>
                                    )}
                                </DialogTitle>
                            </DialogHeader>

                            {selected.description && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prompt / Description visuelle</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 leading-relaxed">
                                        {selected.description}
                                    </p>
                                </div>
                            )}

                            {selected.dialogue && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dialogue / Narration</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic border-l-2 border-amber-300 pl-3">
                                        "{selected.dialogue}"
                                    </p>
                                </div>
                            )}

                            {selected.project.script && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Script original (extrait)
                                    </p>
                                    <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 line-clamp-3">
                                        {selected.project.script}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={() => handleOpenProject(selected.project)}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Ouvrir le projet
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}