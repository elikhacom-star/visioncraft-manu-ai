import React, { useState } from 'react';
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Clock, Volume2, Wand2, Plus, ChevronDown, AudioLines, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from './LanguageProvider';
import TimelineAudioTrack from './TimelineAudioTrack';
import TimelineSceneTrack from './TimelineSceneTrack';
import EnhancedAudioTrackEditor from './audio/EnhancedAudioTrackEditor';
import DialogueSyncButton from './audio/DialogueSyncButton';

export default function VideoTimeline({ 
    scenes, 
    onReorder, 
    onSceneEdit, 
    onSceneDelete, 
    totalDuration,
    audioTracks = [],
    onAddAudioTrack,
    onUpdateTrack,
    onRemoveTrack,
    onOpenStyleTransfer,
    onGenerateAudioTrack,
    onAutoPace,
    onAutoTransitions,
    onTrackClick,
    onAddScene,
    onSceneUpdate,
    onDuplicateTrack,
    onSplitTrack,
    pacingProfile = 'balanced',
    onPacingProfileChange,
    pacingProfiles = {},
    voiceovers = [],
    onDialogueSync,
    onOpenAdaptiveMusic,
    onAutoSFX,
    onOpenStockBrowser,
    onToggleSceneLock
}) {
    const { t } = useLanguage();
    const pixelsPerSecond = 20;
    const [editingTrackIndex, setEditingTrackIndex] = useState(null);

    const handleEditTrack = (index) => {
        setEditingTrackIndex(index);
    };

    const handleSaveTrack = (index, updatedTrack) => {
        onUpdateTrack?.(index, updatedTrack);
        setEditingTrackIndex(null);
    };

    const handleDeleteTrack = (index) => {
        onRemoveTrack?.(index);
        setEditingTrackIndex(null);
    };

    const handleDuplicateTrack = (index) => {
        if (onDuplicateTrack) {
            onDuplicateTrack(index);
        } else {
            // Fallback: create a copy at a slightly later offset
            const track = audioTracks[index];
            const newTrack = {
                ...track,
                name: `${track.name} (copie)`,
                startOffset: (track.startOffset || 0) + (track.duration || 5)
            };
            onAddAudioTrack?.(newTrack);
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl overflow-hidden text-white w-full max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-800 pb-2 gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold">Timeline</span>
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                            {totalDuration.toFixed(1)}s
                        </Badge>
                    </div>

                    {/* AI Smart Edit Tools with Pacing Profile Selector */}
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        {/* Pacing Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400 transition-colors text-xs">
                                    <span>{pacingProfiles[pacingProfile]?.icon || '⚖️'}</span>
                                    <span className="hidden sm:inline">{pacingProfiles[pacingProfile]?.name || 'Pacing'}</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                {Object.entries(pacingProfiles).map(([key, profile]) => (
                                    <DropdownMenuItem 
                                        key={key}
                                        onClick={() => onPacingProfileChange?.(key)}
                                        className={`cursor-pointer ${pacingProfile === key ? 'bg-amber-900/30 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                                    >
                                        <span className="mr-2">{profile.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{profile.name}</span>
                                            <span className="text-[10px] text-slate-500">{profile.description}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-4 bg-slate-700" />

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onAutoPace}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-amber-400 transition-colors"
                                        title={`Apply ${pacingProfiles[pacingProfile]?.name || 'Balanced'} pacing`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('tip_auto_pace')}</p>
                                    <p className="text-[10px] text-slate-400">Profile: {pacingProfiles[pacingProfile]?.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={onAutoTransitions}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('tip_auto_trans')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="w-px h-4 bg-slate-700" />

                        <DialogueSyncButton
                            scenes={scenes}
                            voiceovers={voiceovers}
                            onSyncComplete={(syncedScenes) => {
                                if (onDialogueSync) onDialogueSync(syncedScenes);
                            }}
                        />

                        {onAutoSFX && (
                            <>
                                <div className="w-px h-4 bg-slate-700" />
                                <button onClick={onAutoSFX} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-purple-400 transition-colors" title="Smart SFX">
                                    <Volume2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={onOpenStyleTransfer}
                                    className="h-7 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-900/30"
                                >
                                    <Wand2 className="w-3 h-3 mr-1.5" />
                                    Apply AI Style
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('tip_style_transfer')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs text-slate-500 hidden sm:block">
                        {t('tip_timeline_drag')}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[800px] relative">
                    {/* Time Ruler */}
                    <div className="flex h-6 mb-2 border-b border-slate-800 relative select-none">
                        {Array.from({ length: Math.ceil(Math.max(totalDuration, 30)) + 5 }).map((_, i) => (
                            <div 
                                key={i} 
                                className="absolute border-l border-slate-700 h-2 text-[10px] text-slate-500 pl-1"
                                style={{ left: i * pixelsPerSecond }}
                            >
                                {i % 5 === 0 && <span>{i}s</span>}
                            </div>
                        ))}
                    </div>

                    {/* Video Track (Interactive) */}
                    <div className="mb-4 relative min-h-[130px]">
                        <div className="absolute left-0 top-0 bottom-0 w-full bg-slate-950/50 rounded-lg" />
                        
                        <DragDropContext onDragEnd={onReorder}>
                            <Droppable droppableId="timeline-scenes" direction="horizontal">
                                {(provided) => (
                                    <div 
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex items-center absolute left-0 top-0 h-full p-2 gap-1"
                                    >
                                        {scenes.map((scene, index) => (
                                            <TimelineSceneTrack
                                                key={`scene-${index}`}
                                                scene={scene}
                                                index={index}
                                                pixelsPerSecond={pixelsPerSecond}
                                                onUpdate={(idx, upd) => {
                                                    if (scene.isLocked) return;
                                                    onSceneUpdate ? onSceneUpdate(idx, upd) : onSceneEdit(idx);
                                                }}
                                                onEdit={(idx) => {
                                                    if (scene.isLocked) return;
                                                    onSceneEdit(idx);
                                                }}
                                                onDelete={onSceneDelete}
                                                onOpenStockBrowser={onOpenStockBrowser}
                                                onToggleLock={onToggleSceneLock}
                                            />
                                        ))}
                                        {provided.placeholder}
                                        <button
                                            onClick={onAddScene}
                                            className="h-28 min-w-[60px] flex items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg text-slate-500 hover:text-slate-300 transition-colors ml-1"
                                            title="Add New Scene"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Audio Tracks */}
                    <div className="space-y-2 mt-2">
                        {/* Voiceover Track (Fixed Reference) */}
                        <div className="relative h-14 bg-slate-900/50 rounded border border-slate-800 flex items-center px-2 overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-24 bg-slate-800 border-r border-slate-700 flex flex-col items-center justify-center z-20 gap-1 p-1">
                                <div className="flex items-center gap-1 text-blue-400">
                                    <Volume2 className="w-3 h-3" />
                                    <span className="text-[9px] font-bold">VOICE</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.1" 
                                    defaultValue="1"
                                    className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                    onChange={(e) => onUpdateTrack && onUpdateTrack('voiceover', null, { volume: parseFloat(e.target.value) })}
                                    title="Voiceover Volume"
                                />
                            </div>
                            <div className="ml-24 flex gap-1 w-full relative">
                                {scenes.map((scene, i) => {
                                    const sceneDur = scene.duration || 5;
                                    const sceneWidth = Math.max(50, sceneDur * pixelsPerSecond);
                                    const dialogue = scene.dialogue || '';
                                    const wordCount = dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                    const estimatedDialogueDur = wordCount > 0 ? (wordCount / 2.5) + 0.5 : 0;
                                    const fillRatio = estimatedDialogueDur > 0 ? Math.min(1, estimatedDialogueDur / sceneDur) : 0;
                                    const hasGap = estimatedDialogueDur > 0 && (sceneDur - estimatedDialogueDur) > 1.5;
                                    const isTooLong = estimatedDialogueDur > sceneDur + 0.5;

                                    return (
                                        <div 
                                            key={i}
                                            className={`h-10 mt-0 rounded border text-[9px] relative overflow-hidden group/vo ${
                                                hasGap ? 'border-amber-500/60 bg-amber-500/10' : 
                                                isTooLong ? 'border-red-500/60 bg-red-500/10' :
                                                'border-blue-500/40 bg-blue-500/20'
                                            }`}
                                            style={{ width: sceneWidth }}
                                            title={`${dialogue || 'No Audio'}\n\nDialogue: ~${estimatedDialogueDur.toFixed(1)}s | Scène: ${sceneDur.toFixed(1)}s`}
                                        >
                                            {/* Dialogue fill bar */}
                                            {estimatedDialogueDur > 0 && (
                                                <div 
                                                    className={`absolute top-0 left-0 bottom-0 rounded-l ${
                                                        isTooLong ? 'bg-red-500/30' : 'bg-blue-500/30'
                                                    }`}
                                                    style={{ width: `${Math.min(100, fillRatio * 100)}%` }}
                                                />
                                            )}
                                            {/* Silence zone indicator */}
                                            {hasGap && (
                                                <div 
                                                    className="absolute top-0 bottom-0 right-0 bg-amber-500/15 border-l border-dashed border-amber-500/40 flex items-center justify-center"
                                                    style={{ width: `${Math.max(0, (1 - fillRatio) * 100)}%` }}
                                                >
                                                    <span className="text-[7px] text-amber-400 font-bold">⏸</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center px-1 truncate text-blue-200 z-10">
                                                {dialogue || "No Audio"}
                                            </div>
                                            {/* Timing badge on hover */}
                                            <div className="absolute top-0 right-0 opacity-0 group-hover/vo:opacity-100 transition-opacity bg-black/80 px-1 py-0.5 rounded-bl text-[7px] z-20">
                                                {hasGap && <span className="text-amber-400">⚠ silence {(sceneDur - estimatedDialogueDur).toFixed(1)}s</span>}
                                                {isTooLong && <span className="text-red-400">⚠ déborde +{(estimatedDialogueDur - sceneDur).toFixed(1)}s</span>}
                                                {!hasGap && !isTooLong && estimatedDialogueDur > 0 && <span className="text-green-400">✓ sync</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Interactive Audio Tracks */}
                        {audioTracks.map((track, idx) => (
                            <TimelineAudioTrack
                                key={idx}
                                track={track}
                                index={idx}
                                pixelsPerSecond={pixelsPerSecond}
                                totalDuration={Math.max(totalDuration, 30)}
                                onUpdate={onUpdateTrack}
                                onRemove={onRemoveTrack}
                                onClick={onTrackClick}
                                onEdit={handleEditTrack}
                                onDuplicate={handleDuplicateTrack}
                                onSplit={onSplitTrack}
                            />
                        ))}
                        
                        {/* Add Track Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={onAddAudioTrack}
                                className="h-8 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex-1 border border-dashed border-slate-800"
                            >
                                <Plus className="w-3 h-3 mr-2" /> Upload Track
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={onGenerateAudioTrack}
                                className="h-8 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 flex-1 border border-dashed border-purple-900/50"
                            >
                                <Wand2 className="w-3 h-3 mr-2" /> Generate AI Audio
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #0f172a;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-2 p-2 bg-slate-800/50 rounded text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span><kbd className="px-1 bg-slate-700 rounded">E</kbd> Éditer</span>
                <span><kbd className="px-1 bg-slate-700 rounded">M</kbd> Muter</span>
                <span><kbd className="px-1 bg-slate-700 rounded">Del</kbd> Supprimer</span>
                <span><kbd className="px-1 bg-slate-700 rounded">Ctrl+D</kbd> Dupliquer</span>
                <span><kbd className="px-1 bg-slate-700 rounded">Ctrl+←/→</kbd> Déplacer</span>
                <span><kbd className="px-1 bg-slate-700 rounded">Ctrl+↑/↓</kbd> Volume</span>
            </div>

            {/* Enhanced Audio Track Editor Modal */}
            {editingTrackIndex !== null && audioTracks[editingTrackIndex] && (
                <EnhancedAudioTrackEditor
                    isOpen={true}
                    onClose={() => setEditingTrackIndex(null)}
                    track={audioTracks[editingTrackIndex]}
                    trackIndex={editingTrackIndex}
                    totalDuration={totalDuration}
                    onSave={handleSaveTrack}
                    onDelete={handleDeleteTrack}
                />
            )}
        </div>
    );
}