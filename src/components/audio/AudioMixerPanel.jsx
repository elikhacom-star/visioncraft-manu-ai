import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Volume2, VolumeX, Music, Mic, Sparkles, 
    Plus, Trash2, Play, Pause, ChevronDown, ChevronUp,
    Layers, Sliders, Link2, Link2Off, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import AdaptiveMusicEngine from './AdaptiveMusicEngine';
import AIMixerEngine from './AIMixerEngine';

// Individual Track Strip Component
function TrackStrip({ 
    track, 
    index, 
    isSelected, 
    onSelect, 
    onUpdate, 
    onRemove, 
    onSolo, 
    isSoloed,
    masterVolume = 1 
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const getTrackColor = (type) => {
        switch (type) {
            case 'music': return { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700' };
            case 'sfx': return { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' };
            case 'voiceover': return { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' };
            case 'voiceover_native': return { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' };
            case 'voiceover_recorded': return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-700' };
        }
    };

    const colors = getTrackColor(track.type);
    const effectiveVolume = (track.volume || 1) * masterVolume;
    const isMuted = track.muted || effectiveVolume === 0;

    return (
        <div 
            className={`border rounded-lg transition-all ${
                isSelected ? 'border-amber-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
            } ${isMuted ? 'opacity-60' : ''}`}
            onClick={() => onSelect(index)}
        >
            {/* Track Header */}
            <div className={`flex items-center gap-2 p-2 ${colors.light} rounded-t-lg`}>
                <div className={`w-2 h-8 ${colors.bg} rounded`} />
                
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colors.text} truncate`}>
                        {track.name || `Track ${index + 1}`}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{track.type}</p>
                </div>

                {/* Quick Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(index, { muted: !track.muted }); }}
                        className={`p-1.5 rounded transition-colors ${
                            track.muted ? 'bg-red-100 text-red-600' : 'hover:bg-white/50 text-slate-500'
                        }`}
                        title={track.muted ? 'Unmute' : 'Mute'}
                    >
                        {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); onSolo(index); }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                            isSoloed ? 'bg-amber-500 text-white' : 'hover:bg-white/50 text-slate-500'
                        }`}
                        title="Solo"
                    >
                        S
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-1 rounded hover:bg-white/50 text-slate-500"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Volume Fader */}
            <div className="px-3 py-2 bg-white">
                <div className="flex items-center gap-3">
                    <Slider
                        value={[track.volume || 1]}
                        onValueChange={([v]) => onUpdate(index, { volume: v })}
                        min={0}
                        max={1.5}
                        step={0.01}
                        className="flex-1"
                        disabled={track.muted}
                    />
                    <span className="text-xs text-slate-500 w-10 text-right">
                        {Math.round((track.volume || 1) * 100)}%
                    </span>
                </div>
                
                {/* Level Meter Visual */}
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${colors.bg} transition-all`}
                        style={{ width: `${Math.min(100, effectiveVolume * 100)}%` }}
                    />
                </div>
            </div>

            {/* Expanded Controls */}
            {isExpanded && (
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 space-y-3">
                    {/* Pan (Left/Right) */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Pan</span>
                            <span>{((track.pan || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                            value={[track.pan || 0]}
                            onValueChange={([v]) => onUpdate(index, { pan: v })}
                            min={-1}
                            max={1}
                            step={0.1}
                        />
                        <div className="flex justify-between text-[9px] text-slate-400">
                            <span>L</span>
                            <span>C</span>
                            <span>R</span>
                        </div>
                    </div>

                    {/* Fade Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px]">Fade In</Label>
                            <Slider
                                value={[track.fadeIn || 0]}
                                onValueChange={([v]) => onUpdate(index, { fadeIn: v })}
                                min={0}
                                max={5}
                                step={0.1}
                            />
                            <span className="text-[9px] text-slate-400">{(track.fadeIn || 0).toFixed(1)}s</span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">Fade Out</Label>
                            <Slider
                                value={[track.fadeOut || 0]}
                                onValueChange={([v]) => onUpdate(index, { fadeOut: v })}
                                min={0}
                                max={5}
                                step={0.1}
                            />
                            <span className="text-[9px] text-slate-400">{(track.fadeOut || 0).toFixed(1)}s</span>
                        </div>
                    </div>

                    {/* Ducking */}
                    {track.type === 'music' && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={track.ducking || false}
                                    onCheckedChange={(v) => onUpdate(index, { ducking: v })}
                                    id={`duck-${index}`}
                                />
                                <Label htmlFor={`duck-${index}`} className="text-xs cursor-pointer">
                                    Auto-Duck (during voice)
                                </Label>
                            </div>
                            {track.ducking && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400">to</span>
                                    <input
                                        type="number"
                                        value={Math.round((track.duckLevel || 0.15) * 100)}
                                        onChange={(e) => onUpdate(index, { duckLevel: parseInt(e.target.value) / 100 })}
                                        className="w-10 h-5 text-[10px] text-center border rounded"
                                        min={0}
                                        max={100}
                                    />
                                    <span className="text-[10px] text-slate-400">%</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delete Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                        className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 h-7 text-xs"
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove Track
                    </Button>
                </div>
            )}
        </div>
    );
}

// Main Mixer Panel
export default function AudioMixerPanel({
    audioTracks = [],
    voiceoverVolume = 1,
    onUpdateTrack,
    onRemoveTrack,
    onAddTrack,
    onUpdateVoiceover,
    onGenerateMusic,
    onGenerateSFX,
    scenes = [],
    totalDuration = 0,
    className = ""
}) {
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [soloedTrack, setSoloedTrack] = useState(null);
    const [masterVolume, setMasterVolume] = useState(1);
    const [isLinked, setIsLinked] = useState(false);
    const [showAdaptiveMusic, setShowAdaptiveMusic] = useState(false);
    const [showAIMixer, setShowAIMixer] = useState(false);

    const handleSolo = (index) => {
        setSoloedTrack(soloedTrack === index ? null : index);
    };

    const handleMasterChange = (value) => {
        setMasterVolume(value);
        
        // If linked, adjust all tracks proportionally
        if (isLinked) {
            audioTracks.forEach((track, idx) => {
                const newVol = Math.min(1.5, (track.volume || 1) * (value / masterVolume));
                onUpdateTrack(idx, { volume: newVol });
            });
        }
    };

    const musicTracks = audioTracks.filter(t => t.type === 'music');
    const sfxTracks = audioTracks.filter(t => t.type === 'sfx');
    const voiceTracks = audioTracks.filter(t => t.type?.startsWith('voiceover'));

    return (
        <Card className={`bg-white border-slate-200 ${className}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-500" />
                        Audio Mixer
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLinked(!isLinked)}
                            className={`p-1.5 rounded transition-colors ${
                                isLinked ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            title={isLinked ? 'Unlink faders' : 'Link all faders'}
                        >
                            {isLinked ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Master Volume */}
                <div className="p-3 bg-slate-900 rounded-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">MASTER</span>
                        <span className="text-xs text-slate-400">{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <Slider
                        value={[masterVolume]}
                        onValueChange={([v]) => handleMasterChange(v)}
                        min={0}
                        max={1.5}
                        step={0.01}
                        className="[&_[role=slider]]:bg-amber-500"
                    />
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(70, masterVolume * 70)}%` }} />
                        <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.max(0, Math.min(20, (masterVolume - 0.7) * 100))}%` }} />
                        <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.max(0, Math.min(10, (masterVolume - 0.9) * 100))}%` }} />
                    </div>
                </div>

                {/* Voiceover Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Mic className="w-3 h-3" />
                            Voiceover
                        </h4>
                        <Badge variant="outline" className="text-[10px]">{Math.round(voiceoverVolume * 100)}%</Badge>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border border-blue-100">
                        <Slider
                            value={[voiceoverVolume]}
                            onValueChange={([v]) => onUpdateVoiceover?.(v)}
                            min={0}
                            max={1.5}
                            step={0.01}
                        />
                    </div>
                </div>

                {/* Music Tracks */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            Music ({musicTracks.length})
                        </h4>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-[10px] text-amber-600 hover:bg-amber-50"
                            onClick={onGenerateMusic}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                        </Button>
                    </div>
                    {musicTracks.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No music tracks</p>
                    ) : (
                        <div className="space-y-2">
                            {musicTracks.map((track, idx) => {
                                const realIndex = audioTracks.findIndex(t => t === track);
                                return (
                                    <TrackStrip
                                        key={realIndex}
                                        track={track}
                                        index={realIndex}
                                        isSelected={selectedTrack === realIndex}
                                        onSelect={setSelectedTrack}
                                        onUpdate={onUpdateTrack}
                                        onRemove={onRemoveTrack}
                                        onSolo={handleSolo}
                                        isSoloed={soloedTrack === realIndex}
                                        masterVolume={masterVolume}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SFX Tracks */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Sound Effects ({sfxTracks.length})
                        </h4>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-[10px] text-purple-600 hover:bg-purple-50"
                            onClick={onGenerateSFX}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Auto SFX
                        </Button>
                    </div>
                    {sfxTracks.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No SFX tracks</p>
                    ) : (
                        <div className="space-y-2">
                            {sfxTracks.map((track, idx) => {
                                const realIndex = audioTracks.findIndex(t => t === track);
                                return (
                                    <TrackStrip
                                        key={realIndex}
                                        track={track}
                                        index={realIndex}
                                        isSelected={selectedTrack === realIndex}
                                        onSelect={setSelectedTrack}
                                        onUpdate={onUpdateTrack}
                                        onRemove={onRemoveTrack}
                                        onSolo={handleSolo}
                                        isSoloed={soloedTrack === realIndex}
                                        masterVolume={masterVolume}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Voice Tracks (recorded/native) */}
                {voiceTracks.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Mic className="w-3 h-3" />
                            Recorded Voice ({voiceTracks.length})
                        </h4>
                        <div className="space-y-2">
                            {voiceTracks.map((track, idx) => {
                                const realIndex = audioTracks.findIndex(t => t === track);
                                return (
                                    <TrackStrip
                                        key={realIndex}
                                        track={track}
                                        index={realIndex}
                                        isSelected={selectedTrack === realIndex}
                                        onSelect={setSelectedTrack}
                                        onUpdate={onUpdateTrack}
                                        onRemove={onRemoveTrack}
                                        onSolo={handleSolo}
                                        isSoloed={soloedTrack === realIndex}
                                        masterVolume={masterVolume}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* AI-Powered Audio Mixer */}
                <div className="border-t border-slate-100 pt-3">
                    <button 
                        onClick={() => setShowAIMixer(!showAIMixer)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-300 transition-all"
                    >
                        <span className="text-xs font-semibold text-violet-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Audio Mixer
                        </span>
                        <span className="text-[10px] text-violet-500">{showAIMixer ? 'Hide' : 'Show'}</span>
                    </button>
                    
                    {showAIMixer && (
                        <div className="mt-2">
                            <AIMixerEngine
                                audioTracks={audioTracks}
                                voiceoverVolume={voiceoverVolume}
                                scenes={scenes}
                                onUpdateTrack={onUpdateTrack}
                                onUpdateVoiceover={onUpdateVoiceover}
                            />
                        </div>
                    )}
                </div>

                {/* Adaptive Music */}
                {scenes.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Musique Adaptative
                                </p>
                                <p className="text-[10px] text-amber-600 mt-0.5">Génère une musique qui s'adapte à chaque scène</p>
                            </div>
                            <Button size="sm" onClick={() => setShowAdaptiveMusic(true)} className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                                <Music className="w-3 h-3 mr-1" /> Générer
                            </Button>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={onAddTrack} className="flex-1 h-8 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Upload Track
                    </Button>
                    <Button size="sm" variant="outline" onClick={onGenerateMusic} className="flex-1 h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50">
                        <Sparkles className="w-3 h-3 mr-1" /> AI Music
                    </Button>
                </div>
            </CardContent>

            {/* Adaptive Music Engine Modal */}
            <AdaptiveMusicEngine
                isOpen={showAdaptiveMusic}
                onClose={() => setShowAdaptiveMusic(false)}
                scenes={scenes}
                totalDuration={totalDuration}
                onApplyTracks={(tracks) => {
                    tracks.forEach(t => onAddTrack?.(t));
                    toast.success(`${tracks.length} piste(s) adaptative(s) ajoutée(s) !`);
                }}
            />
        </Card>
    );
}