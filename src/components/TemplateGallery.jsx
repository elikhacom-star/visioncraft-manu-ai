import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { LayoutTemplate, Search, Film, Briefcase, Smartphone, ShoppingBag, Heart, BookOpen, Music, Wand2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import useFavorites from './hooks/useFavorites';
import FavoriteButton from './FavoriteButton';

const CATEGORIES = [
    { id: 'all', icon: LayoutTemplate, key: 'cat_all' },
    { id: 'Business', icon: Briefcase, key: 'cat_business' },
    { id: 'Social Media', icon: Smartphone, key: 'cat_social_media' },
    { id: 'Marketing', icon: ShoppingBag, key: 'cat_marketing' },
    { id: 'Education', icon: BookOpen, key: 'cat_education' },
    { id: 'Personal', icon: Heart, key: 'cat_personal' },
];

export default function TemplateGallery({ templates, selectedTemplate, onSelect, onUseTemplate }) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const { isFavorite, toggleFavorite } = useFavorites();

    const filtered = templates.filter(t => {
        const matchesCategory = filter === 'all' || t.category === filter;
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                             t.description?.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <Button
                            key={cat.id}
                            variant={filter === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(cat.id)}
                            className={`rounded-full px-4 ${filter === cat.id ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : 'border-slate-200 text-slate-600'}`}
                        >
                            <cat.icon className="w-3 h-3 mr-2" />
                            {t(cat.key)}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white border-slate-200"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(template => {
                    const isSelected = selectedTemplate?.id === template.id;
                    return (
                        <div
                            key={template.id}
                            className={`
                                group relative bg-white border-2 rounded-xl p-4 cursor-pointer transition-all duration-300
                                ${isSelected 
                                    ? 'border-amber-500 shadow-md ring-2 ring-amber-200 ring-offset-2' 
                                    : 'border-slate-100 hover:border-amber-200 hover:shadow-lg'
                                }
                            `}
                            onClick={() => onSelect(template)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <FavoriteButton
                                        isFavorite={isFavorite('template', template.id)}
                                        onToggle={() => toggleFavorite('template', template.id, {
                                            item_name: template.name,
                                            item_description: template.description,
                                            item_category: template.category,
                                        })}
                                        size="sm"
                                    />
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                                        {template.category}
                                    </Badge>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                {template.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-3">
                                <div className="flex items-center">
                                    <Film className="w-3 h-3 mr-1" />
                                    <span>HD Ready</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <div className="flex items-center">
                                    <Music className="w-3 h-3 mr-1" />
                                    <span>Music</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <div className="flex items-center">
                                    <Wand2 className="w-3 h-3 mr-1" />
                                    <span>AI Styled</span>
                                </div>
                            </div>
                            
                            {isSelected && (
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                                    <Button 
                                        size="sm" 
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUseTemplate(template);
                                        }}
                                    >
                                        Use Template
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}