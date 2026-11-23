import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw } from "lucide-react";

export default function PreviewTransport({
  isPlaying, onTogglePlay, currentTime, totalDuration,
  currentSceneIndex, totalScenes, onGoToScene,
  audioMuted, onToggleMute, onSeek, autoAdvance, onToggleAutoAdvance, onRestart
}) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {/* Seek bar */}
      <div className="px-1">
        <Slider
          value={[currentTime]}
          onValueChange={([v]) => onSeek(v)}
          min={0}
          max={Math.max(totalDuration, 0.1)}
          step={0.1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onRestart} className="text-slate-400 hover:text-white h-7 w-7">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        <Button size="icon" variant="ghost" onClick={() => onGoToScene(Math.max(0, currentSceneIndex - 1))} disabled={currentSceneIndex === 0} className="text-slate-400 hover:text-white h-7 w-7">
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        <Button size="icon" onClick={onTogglePlay} className="bg-amber-500 hover:bg-amber-600 text-white h-9 w-9 rounded-full">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>

        <Button size="icon" variant="ghost" onClick={() => onGoToScene(Math.min(totalScenes - 1, currentSceneIndex + 1))} disabled={currentSceneIndex === totalScenes - 1} className="text-slate-400 hover:text-white h-7 w-7">
          <SkipForward className="w-3.5 h-3.5" />
        </Button>

        <div className="h-5 w-px bg-slate-700 mx-1" />

        <Button size="icon" variant="ghost" onClick={onToggleMute} className="text-slate-400 hover:text-white h-7 w-7">
          {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </Button>

        <button
          onClick={onToggleAutoAdvance}
          className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
            autoAdvance
              ? 'bg-amber-900/60 text-amber-300 border-amber-700'
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
          }`}
        >
          Auto-enchaîner
        </button>

        <div className="ml-auto">
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
            Scène {currentSceneIndex + 1}/{totalScenes}
          </Badge>
        </div>
      </div>
    </div>
  );
}