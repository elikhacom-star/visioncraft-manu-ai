import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Mic, Music } from "lucide-react";

export default function PreviewTimeline({ scenes, voiceovers, currentTime, onSeekToScene }) {
  const scenePositions = useMemo(() => {
    let t = 0;
    return scenes.map((s, i) => {
      const start = t;
      const dur = s.duration || 5;
      t += dur;
      return { start, duration: dur, end: t, index: i };
    });
  }, [scenes]);

  const totalDuration = scenePositions[scenePositions.length - 1]?.end || 1;

  return (
    <div className="space-y-1.5">
      {/* Scene track */}
      <div className="flex gap-0.5 h-10 rounded-md overflow-hidden relative">
        {scenePositions.map(({ start, duration, index }) => {
          const widthPct = (duration / totalDuration) * 100;
          const scene = scenes[index];
          const isActive = currentTime >= start && currentTime < start + duration;
          return (
            <button
              key={index}
              onClick={() => onSeekToScene(start)}
              className={`relative overflow-hidden transition-all border ${
                isActive ? 'border-amber-400 ring-1 ring-amber-400/40 z-10' : 'border-slate-700 hover:border-slate-500'
              }`}
              style={{ width: `${widthPct}%`, minWidth: '24px' }}
            >
              {scene.url ? (
                <img src={scene.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <span className="text-[9px] text-slate-500">{index + 1}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-0.5 left-1 text-[8px] text-white font-bold">{index + 1}</span>
              {scene.transition && index > 0 && (
                <span className="absolute top-0.5 right-0.5 text-[7px] text-purple-300 bg-purple-900/60 px-1 rounded">
                  {scene.transition}
                </span>
              )}
            </button>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none"
          style={{ left: `${(currentTime / totalDuration) * 100}%` }}
        >
          <div className="w-2 h-2 bg-amber-400 rounded-full -ml-[3px] -mt-0.5" />
        </div>
      </div>

      {/* Audio track (voiceovers) */}
      <div className="flex gap-0.5 h-5 rounded-sm overflow-hidden">
        {scenePositions.map(({ start, duration, index }) => {
          const widthPct = (duration / totalDuration) * 100;
          const vo = voiceovers?.[index];
          const hasAudio = vo?.audioBlob || vo?.audioUrl;
          return (
            <div
              key={`vo-${index}`}
              className={`flex items-center justify-center gap-0.5 ${
                hasAudio ? 'bg-green-900/40 border border-green-800/50' : 'bg-slate-900 border border-slate-800'
              }`}
              style={{ width: `${widthPct}%`, minWidth: '16px' }}
            >
              {hasAudio && <Mic className="w-2.5 h-2.5 text-green-400" />}
              {hasAudio && <span className="text-[7px] text-green-400 truncate">{(vo.dialogue || '').substring(0, 12)}</span>}
            </div>
          );
        })}
      </div>

      {/* Scene metadata */}
      <div className="flex gap-1 flex-wrap">
        {scenes.map((s, i) => {
          const pos = scenePositions[i];
          const isActive = currentTime >= pos.start && currentTime < pos.end;
          if (!isActive) return null;
          return (
            <div key={`info-${i}`} className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-amber-900/50 text-amber-300 border-amber-700 text-[9px]">{s.effect || 'zoom-in'}</Badge>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[9px]">{s.duration || 5}s</Badge>
              {s.transition && <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 text-[9px]">→ {s.transition}</Badge>}
              {s.easing && s.easing !== 'linear' && <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-700 text-[9px]">{s.easing}</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}