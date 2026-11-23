import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Scissors, ZoomIn, ZoomOut, Undo, Volume2, ArrowLeftRight } from "lucide-react";

export default function InteractiveWaveformEditor({
    audioFile,
    audioUrl,
    duration = 10,
    trimStart = 0,
    trimEnd,
    fadeIn = 0,
    fadeOut = 0,
    volume = 1,
    onUpdate,
    height = 120,
    color = '#6366f1'
}) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const audioRef = useRef(null);
    const [peaks, setPeaks] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(null); // 'trimStart', 'trimEnd', 'fadeIn', 'fadeOut', 'playhead'
    const [selection, setSelection] = useState(null); // {start, end}

    const effectiveTrimEnd = trimEnd || duration;
    const visibleDuration = effectiveTrimEnd - trimStart;

    // Generate waveform peaks
    useEffect(() => {
        const loadAudio = async () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                let arrayBuffer;

                if (audioFile) {
                    arrayBuffer = await audioFile.arrayBuffer();
                } else if (audioUrl) {
                    const res = await fetch(audioUrl);
                    arrayBuffer = await res.arrayBuffer();
                } else {
                    return;
                }

                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const rawData = audioBuffer.getChannelData(0);
                const samples = 300;
                const blockSize = Math.floor(rawData.length / samples);
                const calculatedPeaks = [];

                for (let i = 0; i < samples; i++) {
                    const start = i * blockSize;
                    let max = 0;
                    let min = 0;
                    for (let j = 0; j < blockSize; j++) {
                        const val = rawData[start + j];
                        if (val > max) max = val;
                        if (val < min) min = val;
                    }
                    calculatedPeaks.push({ max, min });
                }

                setPeaks(calculatedPeaks);
                audioCtx.close();
            } catch (e) {
                console.warn("Waveform load failed", e);
            }
        };

        loadAudio();
    }, [audioFile, audioUrl]);

    // Draw waveform
    useEffect(() => {
        if (!canvasRef.current || peaks.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = height;
        const centerY = h / 2;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * w;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Draw trimmed regions (darker)
        const trimStartX = (trimStart / duration) * w;
        const trimEndX = (effectiveTrimEnd / duration) * w;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, trimStartX, h);
        ctx.fillRect(trimEndX, 0, w - trimEndX, h);

        // Draw waveform
        const barWidth = w / peaks.length;
        peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const peakX = (i / peaks.length) * duration;
            
            // Check if in trimmed region
            const isTrimmed = peakX < trimStart || peakX > effectiveTrimEnd;
            
            // Calculate fade opacity
            let opacity = 1;
            if (!isTrimmed) {
                if (peakX < trimStart + fadeIn) {
                    opacity = (peakX - trimStart) / fadeIn;
                } else if (peakX > effectiveTrimEnd - fadeOut) {
                    opacity = (effectiveTrimEnd - peakX) / fadeOut;
                }
            }

            const displayOpacity = isTrimmed ? 0.2 : opacity * volume;
            ctx.fillStyle = isTrimmed 
                ? 'rgba(100,116,139,0.3)' 
                : `rgba(99,102,241,${displayOpacity})`;

            const maxH = Math.abs(peak.max) * centerY * 0.9;
            const minH = Math.abs(peak.min) * centerY * 0.9;

            ctx.fillRect(x, centerY - maxH, Math.max(1, barWidth - 1), maxH);
            ctx.fillRect(x, centerY, Math.max(1, barWidth - 1), minH);
        });

        // Draw fade curves
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        
        // Fade In
        if (fadeIn > 0) {
            const fadeInEndX = ((trimStart + fadeIn) / duration) * w;
            ctx.beginPath();
            ctx.moveTo(trimStartX, h);
            ctx.lineTo(fadeInEndX, centerY);
            ctx.stroke();
        }

        // Fade Out
        if (fadeOut > 0) {
            const fadeOutStartX = ((effectiveTrimEnd - fadeOut) / duration) * w;
            ctx.beginPath();
            ctx.moveTo(fadeOutStartX, centerY);
            ctx.lineTo(trimEndX, h);
            ctx.stroke();
        }

        // Selection highlight
        if (selection) {
            const selStartX = (selection.start / duration) * w;
            const selEndX = (selection.end / duration) * w;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.fillRect(selStartX, 0, selEndX - selStartX, h);
        }

        // Playhead
        const playheadX = (playheadPosition / duration) * w;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();

        // Playhead triangle
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(playheadX - 6, 0);
        ctx.lineTo(playheadX + 6, 0);
        ctx.lineTo(playheadX, 8);
        ctx.closePath();
        ctx.fill();

    }, [peaks, trimStart, effectiveTrimEnd, fadeIn, fadeOut, volume, playheadPosition, selection, height, duration]);

    // Mouse handlers
    const getTimeFromX = useCallback((clientX) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        return (x / rect.width) * duration;
    }, [duration]);

    const handleMouseDown = (e) => {
        const time = getTimeFromX(e.clientX);
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Check if near handles
        const trimStartX = (trimStart / duration) * rect.width;
        const trimEndX = (effectiveTrimEnd / duration) * rect.width;
        const fadeInX = ((trimStart + fadeIn) / duration) * rect.width;
        const fadeOutX = ((effectiveTrimEnd - fadeOut) / duration) * rect.width;

        if (Math.abs(x - trimStartX) < 10) {
            setIsDragging('trimStart');
        } else if (Math.abs(x - trimEndX) < 10) {
            setIsDragging('trimEnd');
        } else if (fadeIn > 0 && Math.abs(x - fadeInX) < 10) {
            setIsDragging('fadeIn');
        } else if (fadeOut > 0 && Math.abs(x - fadeOutX) < 10) {
            setIsDragging('fadeOut');
        } else {
            // Move playhead or start selection
            setPlayheadPosition(time);
            setIsDragging('playhead');
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const time = getTimeFromX(e.clientX);

            if (isDragging === 'trimStart') {
                onUpdate?.({ trimStart: Math.max(0, Math.min(time, effectiveTrimEnd - 0.5)) });
            } else if (isDragging === 'trimEnd') {
                onUpdate?.({ trimEnd: Math.max(trimStart + 0.5, Math.min(time, duration)) });
            } else if (isDragging === 'fadeIn') {
                const newFadeIn = Math.max(0, Math.min(time - trimStart, visibleDuration / 2));
                onUpdate?.({ fadeIn: newFadeIn });
            } else if (isDragging === 'fadeOut') {
                const newFadeOut = Math.max(0, Math.min(effectiveTrimEnd - time, visibleDuration / 2));
                onUpdate?.({ fadeOut: newFadeOut });
            } else if (isDragging === 'playhead') {
                setPlayheadPosition(Math.max(0, Math.min(time, duration)));
            }
        };

        const handleMouseUp = () => setIsDragging(null);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, getTimeFromX, trimStart, effectiveTrimEnd, duration, visibleDuration, onUpdate]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    setIsPlaying(p => !p);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    setPlayheadPosition(p => Math.max(0, p - (e.shiftKey ? 1 : 0.1)));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setPlayheadPosition(p => Math.min(duration, p + (e.shiftKey ? 1 : 0.1)));
                    break;
                case 'i':
                    onUpdate?.({ trimStart: playheadPosition });
                    break;
                case 'o':
                    onUpdate?.({ trimEnd: playheadPosition });
                    break;
                case '[':
                    onUpdate?.({ fadeIn: Math.min(fadeIn + 0.5, visibleDuration / 2) });
                    break;
                case ']':
                    onUpdate?.({ fadeOut: Math.min(fadeOut + 0.5, visibleDuration / 2) });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playheadPosition, duration, fadeIn, fadeOut, visibleDuration, onUpdate]);

    // Playback sync
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setPlayheadPosition(p => {
                if (p >= effectiveTrimEnd) {
                    setIsPlaying(false);
                    return trimStart;
                }
                return p + 0.05;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isPlaying, trimStart, effectiveTrimEnd]);

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    size="sm"
                    variant={isPlaying ? "default" : "outline"}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-8"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <div className="h-6 w-px bg-slate-300" />

                <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="h-8 px-2">
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-500 w-10 text-center">{zoom}x</span>
                <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} className="h-8 px-2">
                    <ZoomOut className="w-4 h-4" />
                </Button>

                <div className="h-6 w-px bg-slate-300" />

                <Badge variant="outline" className="text-[10px] gap-1">
                    <Scissors className="w-3 h-3" />
                    I/O: Trim
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                    [ ]: Fades
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                    Space: Play
                </Badge>
            </div>

            {/* Waveform Canvas */}
            <div 
                ref={containerRef}
                className="relative rounded-lg overflow-hidden cursor-crosshair border border-slate-700"
                style={{ height }}
                onMouseDown={handleMouseDown}
            >
                <canvas ref={canvasRef} className="w-full h-full" style={{ height }} />

                {/* Trim handles */}
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 cursor-ew-resize hover:w-2 transition-all"
                    style={{ left: `${(trimStart / duration) * 100}%` }}
                    title="Trim Start (I)"
                />
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 cursor-ew-resize hover:w-2 transition-all"
                    style={{ left: `${(effectiveTrimEnd / duration) * 100}%` }}
                    title="Trim End (O)"
                />

                {/* Time display */}
                <div className="absolute bottom-1 left-2 text-[10px] text-slate-400 font-mono bg-black/50 px-1 rounded">
                    {playheadPosition.toFixed(2)}s / {duration.toFixed(2)}s
                </div>
            </div>

            {/* Quick controls */}
            <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Trim Start</Label>
                    <input 
                        type="number" 
                        step="0.1" 
                        value={trimStart.toFixed(1)}
                        onChange={(e) => onUpdate?.({ trimStart: parseFloat(e.target.value) })}
                        className="w-full h-7 px-2 rounded border text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Trim End</Label>
                    <input 
                        type="number" 
                        step="0.1" 
                        value={effectiveTrimEnd.toFixed(1)}
                        onChange={(e) => onUpdate?.({ trimEnd: parseFloat(e.target.value) })}
                        className="w-full h-7 px-2 rounded border text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Fade In</Label>
                    <input 
                        type="number" 
                        step="0.1" 
                        min="0"
                        value={fadeIn.toFixed(1)}
                        onChange={(e) => onUpdate?.({ fadeIn: parseFloat(e.target.value) })}
                        className="w-full h-7 px-2 rounded border text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Fade Out</Label>
                    <input 
                        type="number" 
                        step="0.1" 
                        min="0"
                        value={fadeOut.toFixed(1)}
                        onChange={(e) => onUpdate?.({ fadeOut: parseFloat(e.target.value) })}
                        className="w-full h-7 px-2 rounded border text-xs"
                    />
                </div>
            </div>
        </div>
    );
}