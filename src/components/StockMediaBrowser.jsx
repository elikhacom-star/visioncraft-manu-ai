import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Image as ImageIcon, Video, Loader2, Download, Play, Clock, User, Film, X, ExternalLink, Volume2, VolumeX, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import StockVideoCard from './stock/StockVideoCard';
import StockVideoPreview from './stock/StockVideoPreview';

const CURATED_CATEGORIES = [
    { label: '🏔️ Nature', query: 'nature landscape cinematic' },
    { label: '🏙️ Ville', query: 'city urban aerial' },
    { label: '💼 Business', query: 'business office professional' },
    { label: '💻 Tech', query: 'technology digital futuristic' },
    { label: '👥 Personnes', query: 'people lifestyle diverse' },
    { label: '🎬 Cinéma', query: 'cinematic dramatic film' },
    { label: '🌊 Eau', query: 'ocean water underwater' },
    { label: '🔥 Énergie', query: 'fire energy abstract motion' },
    { label: '🌅 Coucher', query: 'sunset golden hour timelapse' },
    { label: '🚗 Transport', query: 'car driving road travel' },
];

export default function StockMediaBrowser({ isOpen, onClose, onSelectImage, onSelectVideo, sceneIndex }) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('videos');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewAsset, setPreviewAsset] = useState(null);
    const [orientation, setOrientation] = useState('');
    const [durationFilter, setDurationFilter] = useState('');

    const searchAssets = useCallback(async (searchQuery) => {
        const q = searchQuery || query;
        if (!q.trim()) return;
        setLoading(true);
        setResults([]);
        setPreviewAsset(null);

        try {
            const params = { query: q, type: activeTab, page: 1 };
            if (orientation) params.orientation = orientation;
            if (durationFilter === 'short') { params.max_duration = 10; }
            else if (durationFilter === 'medium') { params.min_duration = 10; params.max_duration = 30; }
            else if (durationFilter === 'long') { params.min_duration = 30; }

            const response = await base44.functions.invoke('searchStock', params);

            if (response.data?.assets?.length > 0) {
                setResults(response.data.assets);
            } else {
                toast.info("Aucun résultat. Essayez un autre terme.");
            }
        } catch (error) {
            console.error("Stock search failed:", error);
            toast.error("La recherche a échoué. Réessayez.");
        } finally {
            setLoading(false);
        }
    }, [query, activeTab, orientation, durationFilter]);

    const handleSelect = (asset) => {
        if (activeTab === 'videos' && onSelectVideo) {
            onSelectVideo({
                url: asset.url,
                previewUrl: asset.previewUrl,
                thumbnail: asset.thumbnail,
                title: asset.title,
                source: asset.source,
                duration: asset.duration,
                isVideo: true
            }, sceneIndex);
        } else if (onSelectImage) {
            onSelectImage({
                url: asset.url,
                title: asset.title,
                source: asset.source
            }, sceneIndex);
        }
        toast.success(`"${asset.title?.slice(0, 30) || 'Clip'}" inséré dans la scène ${(sceneIndex ?? 0) + 1}`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[920px] max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                            <Film className="w-4 h-4 text-white" />
                        </div>
                        Bibliothèque Médias Libres de Droits
                        {sceneIndex !== undefined && (
                            <Badge variant="secondary" className="text-xs ml-2">Scène {sceneIndex + 1}</Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Recherchez et insérez des clips vidéo et images HD gratuits pour enrichir vos scènes.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResults([]); setPreviewAsset(null); }} className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 pt-3 space-y-3">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="videos" className="gap-1.5 text-xs">
                                <Video className="w-3.5 h-3.5" /> Vidéos HD
                            </TabsTrigger>
                            <TabsTrigger value="images" className="gap-1.5 text-xs">
                                <ImageIcon className="w-3.5 h-3.5" /> Images
                            </TabsTrigger>
                        </TabsList>

                        {/* Search Bar */}
                        <div className="flex gap-2">
                            <Input
                                placeholder={`Rechercher des ${activeTab === 'videos' ? 'clips vidéo' : 'images'}...`}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchAssets()}
                                className="flex-1"
                                autoFocus
                            />
                            <Button
                                onClick={() => searchAssets()}
                                disabled={loading || !query.trim()}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-5"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>

                        {/* Filters for Videos */}
                        {activeTab === 'videos' && (
                            <div className="flex gap-2 items-center">
                                <Select value={orientation} onValueChange={setOrientation}>
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                        <SelectValue placeholder="Orientation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes</SelectItem>
                                        <SelectItem value="landscape">Paysage</SelectItem>
                                        <SelectItem value="portrait">Portrait</SelectItem>
                                        <SelectItem value="square">Carré</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={durationFilter} onValueChange={setDurationFilter}>
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                        <SelectValue placeholder="Durée" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes</SelectItem>
                                        <SelectItem value="short">&lt; 10s</SelectItem>
                                        <SelectItem value="medium">10-30s</SelectItem>
                                        <SelectItem value="long">&gt; 30s</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Quick Category Pills */}
                        <div className="flex flex-wrap gap-1.5 pb-1">
                            {CURATED_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.label}
                                    onClick={() => { setQuery(cat.query); searchAssets(cat.query); }}
                                    className="px-2.5 py-1 text-xs rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 hover:text-amber-700 transition-colors"
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-5 pb-3">
                        {/* Empty State */}
                        {results.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Video className="w-14 h-14 mb-3 text-slate-300 dark:text-slate-600" />
                                <p className="font-medium text-base">Trouvez le clip parfait</p>
                                <p className="text-xs mt-1 text-center max-w-xs">
                                    Recherchez par mot-clé ou choisissez une catégorie pour découvrir des milliers de clips vidéo HD libres de droits.
                                </p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
                                <p className="text-sm text-slate-500">Recherche en cours...</p>
                            </div>
                        )}

                        {/* Results Grid */}
                        {!loading && results.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                {results.map((asset, i) => (
                                    <StockVideoCard
                                        key={asset.id || i}
                                        asset={asset}
                                        isVideo={activeTab === 'videos'}
                                        onPreview={() => setPreviewAsset(asset)}
                                        onSelect={() => handleSelect(asset)}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </Tabs>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">
                        Médias libres de droits via Pexels, Pixabay & recherche web. Utilisation gratuite.
                    </p>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                        Fermer
                    </Button>
                </div>

                {/* Video Preview Modal */}
                {previewAsset && (
                    <StockVideoPreview
                        asset={previewAsset}
                        isVideo={activeTab === 'videos'}
                        onClose={() => setPreviewAsset(null)}
                        onSelect={() => { handleSelect(previewAsset); setPreviewAsset(null); }}
                        sceneIndex={sceneIndex}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}