import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Upload, RefreshCw, Image as ImageIcon, ChevronDown } from 'lucide-react';

const STYLE_CATEGORIES = [
    {
        id: 'realistic',
        name: 'Réaliste / Photoréaliste',
        emoji: '📷',
        color: 'from-slate-600 to-slate-800',
        prompt: 'Photorealistic style, ultra-detailed, high resolution photography, natural lighting, sharp focus, professional cinematography',
        sub: [
            { id: 'modern-urban', name: 'Moderne Urbain', prompt: 'Modern urban setting, contemporary city, glass buildings, neon signs, street photography style, diverse modern clothing, realistic people' },
            { id: 'modern-rural', name: 'Moderne Rural', prompt: 'Modern rural countryside, natural landscapes, farms, villages, contemporary clothing, warm natural lighting' },
            { id: 'historical-ancient', name: 'Historique Ancien', prompt: 'Ancient historical setting, archaeological accuracy, period-correct architecture, ancient civilizations, dramatic lighting, oil painting aesthetic' },
            { id: 'historical-medieval', name: 'Médiéval', prompt: 'Medieval European setting, castles, knights, villages, period-accurate medieval clothing, dramatic atmospheric lighting' },
            { id: 'historical-biblical', name: 'Biblique / Oriental', prompt: 'Biblical/Oriental historical setting, ancient Middle East, robes and turbans, grand temples and palaces, golden divine lighting, epic oil painting Renaissance art style' },
            { id: 'futuristic', name: 'Futuriste / Sci-Fi', prompt: 'Futuristic sci-fi setting, advanced technology, sleek architecture, holographic displays, neon lighting, cybernetic elements' },
            { id: 'nature', name: 'Nature / Paysages', prompt: 'Stunning nature photography, dramatic landscapes, mountains, oceans, forests, golden hour lighting, National Geographic quality' },
        ]
    },
    {
        id: 'anime',
        name: 'Anime / Manga',
        emoji: '🎌',
        color: 'from-pink-500 to-rose-500',
        prompt: 'Japanese anime style, vibrant colors, cel-shaded, clean lines, expressive characters',
        sub: [
            { id: 'anime-ghibli', name: 'Studio Ghibli', prompt: 'Studio Ghibli anime style, soft watercolor backgrounds, whimsical characters, warm colors, detailed nature, magical atmosphere' },
            { id: 'anime-shonen', name: 'Shonen (Action)', prompt: 'Shonen anime style, dynamic action poses, speed lines, intense expressions, bold colors, dramatic lighting, epic battles' },
            { id: 'anime-seinen', name: 'Seinen (Mature)', prompt: 'Seinen anime style, detailed and realistic proportions, darker color palette, mature themes, atmospheric lighting' },
            { id: 'manga-bw', name: 'Manga Noir & Blanc', prompt: 'Black and white manga style, detailed ink drawings, screentones, dramatic paneling, expressive linework' },
        ]
    },
    {
        id: '3d',
        name: '3D / Animation',
        emoji: '🧸',
        color: 'from-blue-400 to-indigo-500',
        prompt: '3D rendered style, smooth surfaces, professional CGI, vibrant colors',
        sub: [
            { id: '3d-pixar', name: 'Pixar / Disney', prompt: 'Pixar Disney 3D animation style, smooth rendering, expressive cartoon characters, vibrant saturated colors, professional CGI lighting' },
            { id: '3d-realistic', name: '3D Réaliste', prompt: 'Hyper-realistic 3D render, Unreal Engine 5 quality, ray tracing, photorealistic materials, cinematic composition' },
            { id: '3d-lowpoly', name: 'Low Poly', prompt: 'Low poly 3D art style, geometric shapes, flat shading, minimalist design, pastel colors' },
            { id: '3d-isometric', name: 'Isométrique', prompt: 'Isometric 3D illustration, miniature diorama style, detailed scenes, soft shadows, clean design' },
        ]
    },
    {
        id: 'cinematic',
        name: 'Cinématique',
        emoji: '🎬',
        color: 'from-slate-700 to-slate-900',
        prompt: 'Cinematic film style, professional color grading, anamorphic lens, dramatic lighting',
        sub: [
            { id: 'cine-drama', name: 'Drame', prompt: 'Cinematic drama style, deep shadows, warm highlights, emotional close-ups, film grain, 35mm aesthetic' },
            { id: 'cine-noir', name: 'Film Noir', prompt: '1940s film noir aesthetic, dramatic shadows, high contrast black and white, venetian blind lighting, mystery atmosphere' },
            { id: 'cine-horror', name: 'Horreur', prompt: 'Horror film aesthetic, dark shadows, unsettling angles, desaturated colors, fog, eerie lighting' },
            { id: 'cine-scifi', name: 'Sci-Fi Cinéma', prompt: 'Sci-fi cinema style like Blade Runner, neon lights, dark atmosphere, futuristic dystopia, volumetric lighting' },
            { id: 'cine-wes', name: 'Wes Anderson', prompt: 'Wes Anderson film aesthetic, symmetrical composition, pastel colors, whimsical, meticulously framed, retro styling' },
        ]
    },
    {
        id: 'artistic',
        name: 'Artistique / Peinture',
        emoji: '🎨',
        color: 'from-amber-600 to-orange-700',
        prompt: 'Artistic painting style, rich textures, expressive brushwork',
        sub: [
            { id: 'art-oil', name: 'Peinture à l\'Huile', prompt: 'Classic oil painting style, thick brush strokes, rich textures, impressionist technique, museum quality, dramatic lighting' },
            { id: 'art-watercolor', name: 'Aquarelle', prompt: 'Soft watercolor painting, flowing colors, delicate brush strokes, artistic paper texture, translucent washes' },
            { id: 'art-comic', name: 'Bande Dessinée', prompt: 'Comic book illustration style, bold outlines, halftone dots, pop art colors, dynamic compositions' },
            { id: 'art-digital', name: 'Art Digital', prompt: 'Digital art illustration, vibrant colors, clean lines, concept art quality, detailed fantasy art' },
            { id: 'art-impressionist', name: 'Impressionniste', prompt: 'Impressionist painting style, visible brushstrokes, light and movement capture, Monet-inspired, natural scenes' },
        ]
    },
    {
        id: 'special',
        name: 'Styles Spéciaux',
        emoji: '✨',
        color: 'from-purple-500 to-violet-600',
        prompt: 'Unique artistic vision',
        sub: [
            { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Cyberpunk aesthetic, neon lights, dark atmosphere, futuristic dystopia, rain-soaked streets, holographic ads' },
            { id: 'steampunk', name: 'Steampunk', prompt: 'Steampunk aesthetic, Victorian era with advanced steam technology, brass gears, goggles, airships, warm tones' },
            { id: 'vaporwave', name: 'Vaporwave', prompt: 'Vaporwave aesthetic, pink and purple gradients, retro 80s/90s elements, glitch art, neon grids, sunset colors' },
            { id: 'minimalist', name: 'Minimaliste', prompt: 'Minimalist design, clean lines, limited color palette, lots of whitespace, elegant typography, simple geometric shapes' },
            { id: 'retro-vintage', name: 'Rétro / Vintage', prompt: 'Retro vintage aesthetic, faded colors, film grain, 1970s photography style, warm color cast, soft focus' },
        ]
    }
];

// Flatten all styles for quick lookup
const ALL_STYLES = STYLE_CATEGORIES.flatMap(cat => 
    [{ id: cat.id, name: cat.name, prompt: cat.prompt, emoji: cat.emoji, color: cat.color, isCategory: true },
     ...cat.sub.map(s => ({ ...s, parentId: cat.id, color: cat.color }))]
);

export function getStylePrompt(styleId) {
    if (!styleId || styleId === 'custom') return '';
    const style = ALL_STYLES.find(s => s.id === styleId);
    if (!style) return '';
    // If it's a parent category, return category prompt
    if (style.isCategory) return style.prompt;
    // If it's a sub-style, combine parent + sub
    const parent = STYLE_CATEGORIES.find(c => c.id === style.parentId);
    return parent ? `${parent.prompt}. ${style.prompt}` : style.prompt;
}

export default function StyleSelector({ 
    selectedStyle, 
    onSelect, 
    customStylePrompt,
    onCustomStyleChange,
    onUploadReference, 
    styleRefDescription, 
    isAnalyzing 
}) {
    const [expandedCategory, setExpandedCategory] = useState(null);
    
    // Find which category the selected style belongs to
    const selectedStyleData = ALL_STYLES.find(s => s.id === selectedStyle);
    const selectedCategoryId = selectedStyleData?.parentId || (selectedStyleData?.isCategory ? selectedStyleData.id : null);

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                Style Visuel
            </Label>
            
            {/* Main Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {STYLE_CATEGORIES.map(cat => {
                    const isCatSelected = selectedCategoryId === cat.id;
                    const isExpanded = expandedCategory === cat.id;
                    return (
                        <div key={cat.id} className="relative">
                            <div
                                onClick={() => {
                                    if (expandedCategory === cat.id) {
                                        setExpandedCategory(null);
                                    } else {
                                        setExpandedCategory(cat.id);
                                    }
                                    // Select the category itself as default
                                    onSelect(cat.id);
                                }}
                                className={`
                                    cursor-pointer relative overflow-hidden rounded-lg border-2 transition-all duration-200 h-16
                                    ${isCatSelected 
                                        ? 'border-amber-500 shadow-md scale-[1.02]' 
                                        : 'border-transparent hover:scale-[1.02] hover:border-slate-300'
                                    }
                                `}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-80`} />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 text-white p-2">
                                    <span className="text-xl filter drop-shadow-lg">{cat.emoji}</span>
                                    <span className="text-xs font-bold shadow-black drop-shadow-md text-center leading-tight">
                                        {cat.name}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                {isCatSelected && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sub-style Selector (appears when category is expanded) */}
            {expandedCategory && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Affiner le style
                    </Label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {STYLE_CATEGORIES.find(c => c.id === expandedCategory)?.sub.map(sub => {
                            const isSubSelected = selectedStyle === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => onSelect(sub.id)}
                                    className={`text-left px-3 py-2 rounded-md text-xs font-medium transition-all ${
                                        isSubSelected 
                                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300 shadow-sm' 
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    {sub.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current selection display */}
            {selectedStyle && selectedStyle !== 'custom' && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                        {selectedStyleData?.emoji || '🎨'} {selectedStyleData?.name || selectedStyle}
                    </Badge>
                </div>
            )}

            {/* Custom Style Input */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Ou tapez un style personnalisé (ex: 'polaroid années 80')"
                            value={customStylePrompt}
                            onChange={(e) => {
                                onCustomStyleChange(e.target.value);
                                if (e.target.value && selectedStyle !== 'custom') {
                                    onSelect('custom');
                                }
                            }}
                            className={`bg-white/50 pl-9 ${selectedStyle === 'custom' ? 'border-amber-500 ring-1 ring-amber-200' : ''}`}
                        />
                        <Palette className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    
                    <div className="relative">
                        <input
                            type="file"
                            id="style-ref-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={onUploadReference}
                            disabled={isAnalyzing}
                        />
                        <Button 
                            variant="outline" 
                            className={`
                                relative overflow-hidden
                                ${styleRefDescription ? 'border-green-500 text-green-700 bg-green-50' : 'border-slate-200 text-slate-600'}
                            `}
                            onClick={() => document.getElementById('style-ref-upload').click()}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : styleRefDescription ? (
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-xs">Analysé</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-xs hidden sm:inline">Image Réf</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
                
                {styleRefDescription && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2">
                        Référence: "{styleRefDescription}"
                    </div>
                )}
            </div>
        </div>
    );
}