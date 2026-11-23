import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Image as ImageIcon, Video, Music, Loader2, Download, Play, Pause } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AssetLibrary({ isOpen, onClose, onSelect }) {
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState("images");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [playingPreview, setPlayingPreview] = useState(null);

    const searchAssets = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]);
        
        try {
            const response = await base44.functions.invoke('searchStock', { 
                query, 
                type: activeTab 
            });
            
            if (response.data && response.data.assets) {
                setResults(response.data.assets);
            } else if (response.data && response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Search failed. Check your API keys.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') searchAssets();
    };

    const togglePreview = (url) => {
        if (playingPreview === url) {
            setPlayingPreview(null);
        } else {
            setPlayingPreview(url);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 gap-0">
                <div className="p-6 border-b border-gray-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Search className="w-5 h-5 text-amber-500" />
                            Stock Asset Library
                        </DialogTitle>
                        <DialogDescription>
                            Search for professional royalty-free videos, images, and music.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 mt-4">
                        <Input 
                            placeholder={`Search ${activeTab}...`} 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1"
                        />
                        <Button onClick={searchAssets} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setResults([]); }} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-2">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="images" className="flex gap-2"><ImageIcon className="w-4 h-4" /> Images</TabsTrigger>
                            <TabsTrigger value="videos" className="flex gap-2"><Video className="w-4 h-4" /> Videos</TabsTrigger>
                            <TabsTrigger value="music" className="flex gap-2"><Music className="w-4 h-4" /> Music</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden p-6 bg-slate-50/50">
                        <ScrollArea className="h-full">
                            {results.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <p>No results found.</p>
                                    <p className="text-xs mt-1">Try a different search term or category.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                                {results.map((asset, i) => (
                                    <div key={i} className="group relative aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                        {activeTab === 'images' && (
                                            <img src={asset.thumbnail} alt={asset.title} className="w-full h-full object-cover" />
                                        )}
                                        {activeTab === 'videos' && (
                                            <>
                                                {playingPreview === asset.previewUrl ? (
                                                    <video 
                                                        src={asset.previewUrl} 
                                                        autoPlay 
                                                        loop 
                                                        muted 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <img src={asset.thumbnail} alt={asset.title} className="w-full h-full object-cover" />
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); togglePreview(asset.previewUrl); }}
                                                    className="absolute bottom-2 left-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-amber-500 transition-colors"
                                                >
                                                    {playingPreview === asset.previewUrl ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                                </button>
                                            </>
                                        )}
                                        {activeTab === 'music' && (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-4 text-center">
                                                <Music className="w-8 h-8 mb-2 text-amber-400" />
                                                <p className="text-xs font-medium line-clamp-2">{asset.title}</p>
                                                <p className="text-[10px] text-slate-400">{asset.duration}s</p>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        // Simple audio preview logic
                                                        const audio = document.getElementById(`audio-preview-${i}`);
                                                        if (audio.paused) {
                                                            document.querySelectorAll('audio').forEach(a => a.pause());
                                                            audio.play();
                                                            setPlayingPreview(i);
                                                        } else {
                                                            audio.pause();
                                                            setPlayingPreview(null);
                                                        }
                                                    }}
                                                    className="mt-2 p-2 bg-white/10 rounded-full hover:bg-amber-500 transition-colors"
                                                >
                                                    {playingPreview === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </button>
                                                <audio id={`audio-preview-${i}`} src={asset.previewUrl} className="hidden" onEnded={() => setPlayingPreview(null)} />
                                            </div>
                                        )}

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    onSelect({ ...asset, type: activeTab });
                                                    onClose();
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Use This
                                            </Button>
                                        </div>
                                        
                                        {/* Credit Badge */}
                                        <div className="absolute bottom-0 right-0 bg-black/40 text-[10px] text-white px-2 py-0.5 rounded-tl-lg pointer-events-none">
                                            {asset.source}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}