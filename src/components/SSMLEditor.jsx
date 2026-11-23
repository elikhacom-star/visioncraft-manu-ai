import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer, Volume2, Zap, Hash, Type, Code, Eye, ChevronDown } from "lucide-react";
import CharacterAssigner from './script/CharacterAssigner';

const SSML_TAGS = [
    {
        id: 'pause',
        label: 'Pause',
        icon: Timer,
        description: 'Insère une pause',
        color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
        id: 'emphasis',
        label: 'Emphase',
        icon: Zap,
        description: 'Met en emphase un mot ou une phrase',
        color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
    },
    {
        id: 'prosody',
        label: 'Ton / Vitesse',
        icon: Volume2,
        description: 'Change le ton, la vitesse ou le volume',
        color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
    {
        id: 'phoneme',
        label: 'Prononciation',
        icon: Type,
        description: 'Forcer la prononciation phonétique d\'un mot',
        color: 'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100',
    },
    {
        id: 'say-as',
        label: 'Say As',
        icon: Hash,
        description: 'Indique comment interpréter le texte (nombre, date, épellation...)',
        color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
    },
];

function PausePopover({ onInsert }) {
    const [duration, setDuration] = useState('500');
    return (
        <div className="space-y-3 p-1">
            <Label className="text-xs font-semibold text-slate-600">Durée de la pause</Label>
            <div className="flex items-center gap-2">
                <Slider value={[parseInt(duration)]} onValueChange={([v]) => setDuration(String(v))} min={100} max={3000} step={100} className="flex-1" />
                <span className="text-xs font-mono w-14 text-right text-slate-500">{duration}ms</span>
            </div>
            <div className="flex gap-1 flex-wrap">
                {['200', '500', '1000', '2000'].map(d => (
                    <button key={d} onClick={() => setDuration(d)} className={`px-2 py-0.5 rounded text-[10px] border ${duration === d ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{d}ms</button>
                ))}
            </div>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onInsert(`<break time="${duration}ms"/>`)}>Insérer pause</Button>
        </div>
    );
}

function EmphasisPopover({ onInsert, selectedText }) {
    const [level, setLevel] = useState('strong');
    return (
        <div className="space-y-3 p-1">
            <Label className="text-xs font-semibold text-slate-600">Niveau d'emphase</Label>
            <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="reduced">Réduite</SelectItem>
                    <SelectItem value="moderate">Modérée</SelectItem>
                    <SelectItem value="strong">Forte</SelectItem>
                </SelectContent>
            </Select>
            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onInsert(`<emphasis level="${level}">${selectedText || 'texte'}</emphasis>`, !!selectedText)}>Appliquer emphase</Button>
        </div>
    );
}

function ProsodyPopover({ onInsert, selectedText }) {
    const [rate, setRate] = useState('medium');
    const [pitch, setPitch] = useState('medium');
    const [volume, setVolume] = useState('medium');
    return (
        <div className="space-y-3 p-1">
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Label className="text-[10px] text-slate-500">Vitesse</Label>
                    <Select value={rate} onValueChange={setRate}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="x-slow">Très lent</SelectItem>
                            <SelectItem value="slow">Lent</SelectItem>
                            <SelectItem value="medium">Normal</SelectItem>
                            <SelectItem value="fast">Rapide</SelectItem>
                            <SelectItem value="x-fast">Très rapide</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-[10px] text-slate-500">Ton</Label>
                    <Select value={pitch} onValueChange={setPitch}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="x-low">Très grave</SelectItem>
                            <SelectItem value="low">Grave</SelectItem>
                            <SelectItem value="medium">Normal</SelectItem>
                            <SelectItem value="high">Aigu</SelectItem>
                            <SelectItem value="x-high">Très aigu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-[10px] text-slate-500">Volume</Label>
                    <Select value={volume} onValueChange={setVolume}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="silent">Silence</SelectItem>
                            <SelectItem value="x-soft">Très doux</SelectItem>
                            <SelectItem value="soft">Doux</SelectItem>
                            <SelectItem value="medium">Normal</SelectItem>
                            <SelectItem value="loud">Fort</SelectItem>
                            <SelectItem value="x-loud">Très fort</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                const attrs = [];
                if (rate !== 'medium') attrs.push(`rate="${rate}"`);
                if (pitch !== 'medium') attrs.push(`pitch="${pitch}"`);
                if (volume !== 'medium') attrs.push(`volume="${volume}"`);
                const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
                onInsert(`<prosody${attrStr}>${selectedText || 'texte'}</prosody>`, !!selectedText);
            }}>Appliquer prosodie</Button>
        </div>
    );
}

function PhonemePopover({ onInsert, selectedText }) {
    const [alphabet, setAlphabet] = useState('ipa');
    const [phonetic, setPhonetic] = useState('');
    return (
        <div className="space-y-3 p-1">
            <Label className="text-xs font-semibold text-slate-600">Prononciation phonétique</Label>
            <Select value={alphabet} onValueChange={setAlphabet}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ipa">IPA (International)</SelectItem>
                    <SelectItem value="x-sampa">X-SAMPA</SelectItem>
                </SelectContent>
            </Select>
            <Input placeholder="Ex: təˈmeɪtoʊ" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} className="h-8 text-xs font-mono" />
            <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onInsert(`<phoneme alphabet="${alphabet}" ph="${phonetic}">${selectedText || 'mot'}</phoneme>`, !!selectedText)} disabled={!phonetic}>Appliquer</Button>
        </div>
    );
}

function SayAsPopover({ onInsert, selectedText }) {
    const [interpretAs, setInterpretAs] = useState('characters');
    return (
        <div className="space-y-3 p-1">
            <Label className="text-xs font-semibold text-slate-600">Interpréter comme</Label>
            <Select value={interpretAs} onValueChange={setInterpretAs}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="characters">Épeler (A-B-C)</SelectItem>
                    <SelectItem value="cardinal">Nombre cardinal</SelectItem>
                    <SelectItem value="ordinal">Nombre ordinal</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="telephone">Téléphone</SelectItem>
                    <SelectItem value="expletive">Bip (censuré)</SelectItem>
                </SelectContent>
            </Select>
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => onInsert(`<say-as interpret-as="${interpretAs}">${selectedText || 'texte'}</say-as>`, !!selectedText)}>Appliquer</Button>
        </div>
    );
}

export default function SSMLEditor({ value, onChange, placeholder, disabled, className }) {
    const textareaRef = useRef(null);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
    const [openPopover, setOpenPopover] = useState(null);

    const assignCharacterToLine = useCallback((characterName) => {
        const el = textareaRef.current;
        if (!el) return;

        const text = el.value;
        const cursorPos = el.selectionStart;

        // Find the start of the current line
        const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
        // Find the end of the current line
        const lineEnd = text.indexOf('\n', cursorPos);
        const lineEndPos = lineEnd === -1 ? text.length : lineEnd;
        const currentLine = text.substring(lineStart, lineEndPos);

        // Remove existing character prefix if any (e.g. "NOM: text" → "text")
        const cleanedLine = currentLine.replace(/^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ\s]+:\s*/, '');

        const newLine = `${characterName}: ${cleanedLine}`;
        const newText = text.substring(0, lineStart) + newLine + text.substring(lineEndPos);

        onChange(newText);

        // Restore cursor at end of prefix
        requestAnimationFrame(() => {
            if (el) {
                const newPos = lineStart + newLine.length;
                el.focus();
                el.setSelectionRange(newPos, newPos);
            }
        });
    }, [onChange]);

    const getSelectedText = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return '';
        return el.value.substring(el.selectionStart, el.selectionEnd);
    }, []);

    const insertAtCursor = useCallback((tag, replaceSelection = false) => {
        const el = textareaRef.current;
        if (!el) return;

        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;

        let newText;
        if (replaceSelection && start !== end) {
            newText = text.substring(0, start) + tag + text.substring(end);
        } else {
            newText = text.substring(0, start) + tag + text.substring(start);
        }

        onChange(newText);
        setOpenPopover(null);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
            if (el) {
                const newPos = start + tag.length;
                el.focus();
                el.setSelectionRange(newPos, newPos);
            }
        });
    }, [onChange]);

    // Strip SSML tags for preview
    const getPreviewText = (text) => {
        if (!text) return '';
        return text
            .replace(/<break\s+time="(\d+)ms"\s*\/>/g, ' ⏸️[$1ms] ')
            .replace(/<emphasis\s+level="([^"]+)">/g, '【$1: ')
            .replace(/<\/emphasis>/g, '】')
            .replace(/<prosody([^>]*)>/g, (_, attrs) => {
                const parts = [];
                const rateMatch = attrs.match(/rate="([^"]+)"/);
                const pitchMatch = attrs.match(/pitch="([^"]+)"/);
                const volMatch = attrs.match(/volume="([^"]+)"/);
                if (rateMatch) parts.push(`🏃${rateMatch[1]}`);
                if (pitchMatch) parts.push(`🎵${pitchMatch[1]}`);
                if (volMatch) parts.push(`🔊${volMatch[1]}`);
                return `〔${parts.join(' ')} `;
            })
            .replace(/<\/prosody>/g, '〕')
            .replace(/<say-as\s+interpret-as="([^"]+)">/g, '〈$1: ')
            .replace(/<\/say-as>/g, '〉')
            .replace(/<phoneme\s+alphabet="([^"]+)"\s+ph="([^"]+)">/g, '🗣️[$1: $2] ')
            .replace(/<\/phoneme>/g, '');
    };

    const hasSSML = value && (value.includes('<break') || value.includes('<emphasis') || value.includes('<prosody') || value.includes('<say-as') || value.includes('<phoneme'));

    return (
        <div className="space-y-2">
            {/* SSML Toolbar */}
            <div className="flex items-center gap-1 flex-wrap">
                <CharacterAssigner onAssign={assignCharacterToLine} disabled={disabled} />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                {SSML_TAGS.map((tag) => {
                    const PopoverComponent = {
                        'pause': PausePopover,
                        'emphasis': EmphasisPopover,
                        'prosody': ProsodyPopover,
                        'phoneme': PhonemePopover,
                        'say-as': SayAsPopover,
                    }[tag.id];

                    return (
                        <Popover key={tag.id} open={openPopover === tag.id} onOpenChange={(open) => setOpenPopover(open ? tag.id : null)}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${tag.color} disabled:opacity-40`}
                                    title={tag.description}
                                >
                                    <tag.icon className="w-3 h-3" />
                                    {tag.label}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                                <PopoverComponent
                                    onInsert={insertAtCursor}
                                    selectedText={getSelectedText()}
                                />
                            </PopoverContent>
                        </Popover>
                    );
                })}

                <div className="ml-auto flex items-center gap-1">
                    {hasSSML && (
                        <button
                            type="button"
                            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                                viewMode === 'preview'
                                    ? 'bg-slate-800 text-white border-slate-700'
                                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {viewMode === 'edit' ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                            {viewMode === 'edit' ? 'Aperçu' : 'Éditer'}
                        </button>
                    )}
                </div>
            </div>

            {/* Editor / Preview */}
            {viewMode === 'edit' ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full min-h-[200px] bg-white/50 border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400 focus:outline-none resize-none font-mono ${className || ''}`}
                />
            ) : (
                <div className={`w-full min-h-[200px] bg-gradient-to-br from-slate-50 to-amber-50/30 border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed ${className || ''}`}>
                    {getPreviewText(value) || <span className="text-gray-400">Aucun contenu</span>}
                </div>
            )}

            {/* Hint */}
            {hasSSML && viewMode === 'edit' && (
                <p className="text-[10px] text-amber-600/70 flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Des balises SSML ont été détectées. Cliquez sur "Aperçu" pour voir le rendu.
                </p>
            )}
        </div>
    );
}