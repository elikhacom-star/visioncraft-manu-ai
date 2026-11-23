import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import PreviewCanvas from './preview/PreviewCanvas';
import PreviewTransport from './preview/PreviewTransport';
import PreviewTimeline from './preview/PreviewTimeline';

export default function ScenePreviewPlayer({ isOpen, onClose, scenes, voiceovers, initialSceneIndex = 0, effectIntensity = 1.0, renderSpeed = 1.0, subtitleSettings }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const animRef = useRef(null);
  const lastTickRef = useRef(null);
  const audioRef = useRef(null);
  const currentAudioScene = useRef(-1);
  const imageCacheRef = useRef({});

  const totalDuration = useMemo(() => scenes.reduce((sum, s) => sum + (s.duration || 5), 0), [scenes]);

  const getSceneAtTime = useCallback((time) => {
    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      const dur = scenes[i].duration || 5;
      if (time < elapsed + dur) return { index: i, localTime: time - elapsed, duration: dur, startTime: elapsed };
      elapsed += dur;
    }
    return { index: scenes.length - 1, localTime: 0, duration: scenes[scenes.length - 1]?.duration || 5, startTime: elapsed - (scenes[scenes.length - 1]?.duration || 5) };
  }, [scenes]);

  // Preload all images
  useEffect(() => {
    if (!isOpen) return;
    scenes.forEach(s => {
      if (s.url && !imageCacheRef.current[s.url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = s.url;
        img.onload = () => { imageCacheRef.current[s.url] = img; };
      }
    });
  }, [scenes, isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      let startTime = 0;
      for (let i = 0; i < initialSceneIndex && i < scenes.length; i++) {
        startTime += scenes[i].duration || 5;
      }
      setCurrentTime(startTime);
      setIsPlaying(false);
      currentAudioScene.current = -1;
    }
    return () => { stopAudio(); };
  }, [isOpen, initialSceneIndex, scenes]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    currentAudioScene.current = -1;
  }, []);

  // Sync audio with current scene
  useEffect(() => {
    if (!isPlaying || audioMuted || !voiceovers) return;
    const { index, localTime } = getSceneAtTime(currentTime);
    const vo = voiceovers[index];

    if (index !== currentAudioScene.current) {
      stopAudio();
      currentAudioScene.current = index;

      if (vo?.audioUrl) {
        const audio = new Audio(vo.audioUrl);
        audio.currentTime = Math.min(localTime, audio.duration || 0);
        audio.playbackRate = renderSpeed;
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
    }
  }, [isPlaying, audioMuted, currentTime, voiceovers, getSceneAtTime, renderSpeed, stopAudio]);

  // Stop audio when paused or muted
  useEffect(() => {
    if (!isPlaying || audioMuted) stopAudio();
  }, [isPlaying, audioMuted, stopAudio]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      lastTickRef.current = null;
      return;
    }

    const tick = (timestamp) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
      }
      const delta = (timestamp - lastTickRef.current) / 1000 * renderSpeed;
      lastTickRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          stopAudio();
          return totalDuration;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, totalDuration, renderSpeed, stopAudio]);

  const { index: currentSceneIndex } = getSceneAtTime(currentTime);

  const handleSeek = useCallback((time) => {
    stopAudio();
    setCurrentTime(time);
    if (isPlaying) {
      // Restart audio at new position
      const { index, localTime } = getSceneAtTime(time);
      const vo = voiceovers?.[index];
      if (vo?.audioUrl && !audioMuted) {
        currentAudioScene.current = index;
        const audio = new Audio(vo.audioUrl);
        audio.currentTime = Math.min(localTime, audio.duration || 0);
        audio.playbackRate = renderSpeed;
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
    }
  }, [stopAudio, isPlaying, getSceneAtTime, voiceovers, audioMuted, renderSpeed]);

  const handleGoToScene = useCallback((sceneIdx) => {
    let t = 0;
    for (let i = 0; i < sceneIdx && i < scenes.length; i++) t += scenes[i].duration || 5;
    handleSeek(t);
  }, [scenes, handleSeek]);

  const handleRestart = useCallback(() => {
    handleSeek(0);
    setIsPlaying(true);
  }, [handleSeek]);

  if (!scenes || scenes.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Prévisualisation interactive
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Transitions, effets d'image et audio synchronisé — ajustez le montage avant le rendu
          </DialogDescription>
        </DialogHeader>

        {/* Canvas */}
        <div className="px-4 pb-1">
          <PreviewCanvas
            scenes={scenes}
            currentTime={currentTime}
            totalDuration={totalDuration}
            effectIntensity={effectIntensity}
            isPlaying={isPlaying}
            imageCache={imageCacheRef}
            subtitleSettings={subtitleSettings}
          />
        </div>

        {/* Timeline strip */}
        <div className="px-4 py-1.5 border-t border-slate-800/50">
          <PreviewTimeline
            scenes={scenes}
            voiceovers={voiceovers}
            currentTime={currentTime}
            onSeekToScene={handleSeek}
          />
        </div>

        {/* Transport controls */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900">
          <PreviewTransport
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            currentTime={currentTime}
            totalDuration={totalDuration}
            currentSceneIndex={currentSceneIndex}
            totalScenes={scenes.length}
            onGoToScene={handleGoToScene}
            audioMuted={audioMuted}
            onToggleMute={() => setAudioMuted(!audioMuted)}
            onSeek={handleSeek}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
            onRestart={handleRestart}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}