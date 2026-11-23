import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Scissors, Merge, Wand2, Download, ZoomIn, ZoomOut, Sparkles, Split, Trash2, Type, Gauge, Undo, Redo, Volume2, Volume1, VolumeX, Check, Music, Copy, Bookmark, Move, TrendingUp, Palette, Upload, Bot, Layout, FolderOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AudioWaveform from "./AudioWaveform";
import { base44 } from "@/api/base44Client";
import { generateSecureVideo, isSecureVideoApiConfigured } from "@/api/videoApi";
import KeyframeEditor from "./KeyframeEditor";
import ColorOverlayEditor from "./ColorOverlayEditor";
import AiVideoAssistant from "./AiVideoAssistant";
import StoryboardView from "./StoryboardView";
import SequenceManager from "./SequenceManager";
import SceneTemplates from "./SceneTemplates";
import OfflineQueueIndicator from "./offline/OfflineQueueIndicator";
import useOfflineQueue from "./offline/useOfflineQueue";
import AdvancedAudioTimeline from "./audio/AdvancedAudioTimeline";

export default function VideoEditor({ isOpen, onClose, scenes, onSaveEdits, renderSpeed = 1.0, onChangeRenderSpeed, audioTracks = [], voiceoverTrack = null, onUpdateAudioTrack, onRemoveAudioTrack, onAddAudioTrack }) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
    const [trimStart, setTrimStart] = useState({});
    const [trimEnd, setTrimEnd] = useState({});
    const [selectedEffect, setSelectedEffect] = useState('none');
    const [effectPreview, setEffectPreview] = useState(false);
    const [timelineZoom, setTimelineZoom] = useState(1);
    const [clipboardScene, setClipboardScene] = useState(null);
    const [editHistory, setEditHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [multiSelect, setMultiSelect] = useState([]);
    const [sceneSpeed, setSceneSpeed] = useState({});
    const [textOverlays, setTextOverlays] = useState({});
    const [showTextEditor, setShowTextEditor] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [hoverSceneIndex, setHoverSceneIndex] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [transitionPreview, setTransitionPreview] = useState(false);
    const [audioVolumes, setAudioVolumes] = useState({});
    const [audioFades, setAudioFades] = useState({});
    const [showAudioPanel, setShowAudioPanel] = useState(false);
    const [showToolsPanel, setShowToolsPanel] = useState(true);
    const [showEffectsPanel, setShowEffectsPanel] = useState(false);
    const [effectIntensity, setEffectIntensity] = useState(1.0);
    const [lastAutoSave, setLastAutoSave] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [backgroundMusic, setBackgroundMusic] = useState(null);
    const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.5);
    const [timelineFadeIn, setTimelineFadeIn] = useState(0);
    const [timelineFadeOut, setTimelineFadeOut] = useState(0);
    const [audioTrimStart, setAudioTrimStart] = useState({});
    const [audioTrimEnd, setAudioTrimEnd] = useState({});
    const [chapters, setChapters] = useState([]);
    const [showChapterDialog, setShowChapterDialog] = useState(false);
    const [audioElements, setAudioElements] = useState({});
    const [trimMode, setTrimMode] = useState(false);
    const [trimHandleActive, setTrimHandleActive] = useState(null);
    const [draggedSceneIndex, setDraggedSceneIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [sceneKeyframes, setSceneKeyframes] = useState({});
    const [colorOverlays, setColorOverlays] = useState({});
    const [showKeyframeEditor, setShowKeyframeEditor] = useState(false);
    const [showColorOverlayEditor, setShowColorOverlayEditor] = useState(false);
    const [customEffects, setCustomEffects] = useState([]);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [showStoryboard, setShowStoryboard] = useState(false);
    const [showSequenceManager, setShowSequenceManager] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [sequences, setSequences] = useState([]);
    const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem('offline_mode_enabled') === '1');
    const { queue, addTask, removeTask, clearQueue, processQueue } = useOfflineQueue();
    const [showAudioTimeline, setShowAudioTimeline] = useState(true);
    const [splitMode, setSplitMode] = useState(false);
    const [splitPoint, setSplitPoint] = useState(0);
    
    const canvasRef = useRef(null);
    const comparisonCanvasRef = useRef(null);
    const videoRefs = useRef([]);
    const animationFrameRef = useRef(null);
    const timelineRef = useRef(null);
    const frameCache = useRef({});
    const thumbnailCanvasRef = useRef(null);
    const imageCache = useRef({});
    const audioRef = useRef(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);
    const pixelsPerSecond = 40 * timelineZoom;

    // Auto-save key for this project
    const autoSaveKey = `videoEditor_autosave_${scenes[0]?.id || 'draft'}`;

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    setCurrentTime(prev => Math.max(0, prev - 0.1));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setCurrentTime(prev => Math.min(totalDuration, prev + 0.1));
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleUndo();
                    }
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRedo();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, totalDuration]); // handleUndo and handleRedo are stable event handlers

    // Load auto-saved data on mount
    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(autoSaveKey);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) { // 24h expiry
                        setTrimStart(data.trimStart || {});
                        setTrimEnd(data.trimEnd || {});
                        setSceneSpeed(data.sceneSpeed || {});
                        setTextOverlays(data.textOverlays || {});
                        setAudioVolumes(data.audioVolumes || {});
                        setAudioFades(data.audioFades || {});
                        setBackgroundMusic(data.backgroundMusic || null);
                        setBackgroundMusicVolume(data.backgroundMusicVolume || 0.5);
                        setTimelineFadeIn(data.timelineFadeIn || 0);
                        setTimelineFadeOut(data.timelineFadeOut || 0);
                        setAudioTrimStart(data.audioTrimStart || {});
                        setAudioTrimEnd(data.audioTrimEnd || {});
                        setChapters(data.chapters || []);
                        setLastAutoSave(new Date(data.timestamp));
                        toast.success("🔄 Modifications restaurées depuis l'auto-sauvegarde");
                    }
                } catch (e) {
                    console.error('Failed to load auto-save:', e);
                }
            }
        }
    }, [isOpen, autoSaveKey]);

    // Auto-save changes
    useEffect(() => {
        if (!isOpen) return;
        
        const autoSaveData = {
            trimStart,
            trimEnd,
            sceneSpeed,
            textOverlays,
            audioVolumes,
            audioFades,
            backgroundMusic,
            backgroundMusicVolume,
            timelineFadeIn,
            timelineFadeOut,
            audioTrimStart,
            audioTrimEnd,
            chapters,
            sceneKeyframes,
            colorOverlays,
            customEffects,
            sequences,
            timestamp: Date.now()
        };
        
        const saveTimer = setTimeout(() => {
            localStorage.setItem(autoSaveKey, JSON.stringify(autoSaveData));
            setLastAutoSave(new Date());
            setHasUnsavedChanges(false);
        }, 2000); // Save after 2 seconds of inactivity
        
        setHasUnsavedChanges(true);
        
        return () => clearTimeout(saveTimer);
    }, [trimStart, trimEnd, sceneSpeed, textOverlays, audioVolumes, audioFades, backgroundMusic, backgroundMusicVolume, timelineFadeIn, timelineFadeOut, audioTrimStart, audioTrimEnd, chapters, sceneKeyframes, colorOverlays, customEffects, sequences, isOpen, autoSaveKey]);

    // Preload all scene images
    useEffect(() => {
        if (isOpen && scenes.length > 0) {
            scenes.forEach((scene, index) => {
                if ((scene.url || scene.videoUrl) && !imageCache.current[index]) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = scene.url || scene.videoUrl;
                    img.onload = () => {
                        imageCache.current[index] = img;
                    };
                }
            });
        }
    }, [isOpen, scenes]);

    useEffect(() => {
        if (!isOpen) {
            setIsPlaying(false);
            setCurrentTime(0);
            imageCache.current = {};
        }
    }, [isOpen]);

    useEffect(() => {
        if (isPlaying) {
            const startTime = Date.now();
            const startCurrentTime = currentTime;

            // Play audio at normal speed (not affected by renderSpeed)
            if (audioRef.current) {
                audioRef.current.currentTime = currentTime;
                audioRef.current.playbackRate = 1.0; // Force normal speed for audio
                audioRef.current.play().then(() => {
                    setIsAudioPlaying(true);
                }).catch(e => console.log("Audio play failed:", e));
            }

            const animate = () => {
                const elapsed = ((Date.now() - startTime) / 1000) * (renderSpeed || 1.0);
                const newTime = startCurrentTime + elapsed;

                if (newTime >= totalDuration) {
                    setCurrentTime(0);
                    setIsPlaying(false);
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setIsAudioPlaying(false);
                    }
                } else {
                    setCurrentTime(newTime);
                    renderCurrentFrame(newTime);
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsAudioPlaying(false);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                setIsAudioPlaying(false);
            }
        };
    }, [isPlaying, totalDuration, renderSpeed]);

    // Separate effect to render when not playing or when effects change
    useEffect(() => {
        if (!isPlaying) {
            renderCurrentFrame(currentTime);
        }
    }, [currentTime, scenes, selectedEffect, effectPreview, effectIntensity, textOverlays, sceneSpeed]);

    const renderCurrentFrame = (time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        canvas.width = 1280;
        canvas.height = 720;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let accumulatedTime = 0;
        let currentSceneIndex = -1;
        let sceneProgress = 0;

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const sceneDuration = getTrimmedDuration(i, scene.duration || 5);
            
            if (time >= accumulatedTime && time < accumulatedTime + sceneDuration) {
                currentSceneIndex = i;
                sceneProgress = (time - accumulatedTime) / sceneDuration;
                break;
            }
            accumulatedTime += sceneDuration;
        }

        if (currentSceneIndex !== -1) {
            setSelectedSceneIndex(currentSceneIndex);
            const scene = scenes[currentSceneIndex];
            
            // Cache key
            const cacheKey = `${currentSceneIndex}-${Math.floor(time * 10)}`;
            
            if (scene.url || scene.videoUrl) {
                // Use cached image if available
                const cachedImg = imageCache.current[currentSceneIndex];
                
                const drawScene = (img) => {
                    if (!img || !img.complete) return;
                    
                    ctx.save();
                    
                    // Enhanced rendering with image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Check if we need to render transition
                    const isTransitioning = transitionPreview && currentSceneIndex < scenes.length - 1 && sceneProgress > 0.85;
                    
                    if (isTransitioning) {
                        // Get next scene for transition preview
                        const nextScene = scenes[currentSceneIndex + 1];
                        const transitionProgress = (sceneProgress - 0.85) / 0.15; // Last 15% of scene
                        
                        if (effectPreview && selectedEffect !== 'none') {
                            applyEffectPreview(ctx, canvas, img, sceneProgress, selectedEffect, effectIntensity);
                        } else {
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        }
                        
                        // Render transition overlay
                        if (nextScene?.url) {
                            const nextImg = imageCache.current[currentSceneIndex + 1];
                            if (nextImg && nextImg.complete) {
                                ctx.globalAlpha = transitionProgress;
                                ctx.drawImage(nextImg, 0, 0, canvas.width, canvas.height);
                                ctx.globalAlpha = 1.0;
                            }
                        }
                    } else {
                        if (effectPreview && selectedEffect !== 'none') {
                            applyEffectPreview(ctx, canvas, img, sceneProgress, selectedEffect, effectIntensity);
                        } else {
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        }
                    }
                    
                    // Apply color overlay if exists
                    const colorOverlay = colorOverlays[currentSceneIndex];
                    if (colorOverlay?.enabled) {
                        ctx.globalCompositeOperation = colorOverlay.blendMode || 'overlay';
                        ctx.fillStyle = colorOverlay.color;
                        ctx.globalAlpha = colorOverlay.opacity;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.globalAlpha = 1.0;
                    }

                    // Apply keyframe animations if exists
                    const keyframes = sceneKeyframes[currentSceneIndex];
                    if (keyframes && keyframes.length > 0) {
                        keyframes.forEach(kf => {
                            if (time >= kf.time && time <= kf.time + 0.1) {
                                // Apply keyframe effect based on property
                                if (kf.property === 'opacity') {
                                    ctx.globalAlpha = kf.value;
                                } else if (kf.property === 'blur') {
                                    ctx.filter = `blur(${kf.value}px)`;
                                }
                            }
                        });
                    }

                    // Apply text overlay if exists
                    const overlayText = textOverlays[currentSceneIndex] || scene.overlayText;
                    if (overlayText) {
                        ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(overlayText, canvas.width / 2, canvas.height - 35);
                    }
                    
                    ctx.restore();
                    
                    // Info overlay
                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    ctx.fillRect(0, 0, canvas.width, 40);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Scene ${currentSceneIndex + 1} - ${time.toFixed(2)}s / ${totalDuration.toFixed(2)}s`, 20, 25);
                    
                    // Speed indicator
                    const speed = sceneSpeed[currentSceneIndex];
                    if (speed && speed !== 1.0) {
                        ctx.fillStyle = '#3b82f6';
                        ctx.fillText(`${speed}x`, canvas.width - 80, 25);
                    }
                    
                    // Cache frame for scrubbing
                    frameCache.current[cacheKey] = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Render comparison if enabled
                    if (showComparison) {
                        renderComparison(img, sceneProgress);
                    }
                };
                
                if (cachedImg) {
                    // Use already loaded image
                    drawScene(cachedImg);
                } else {
                    // Load image if not cached
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = scene.url || scene.videoUrl;
                    
                    img.onload = () => {
                        imageCache.current[currentSceneIndex] = img;
                        drawScene(img);
                    };
                }
            }
        }
    };

    const renderComparison = (img, progress) => {
        const compCanvas = comparisonCanvasRef.current;
        if (!compCanvas) return;
        
        const ctx = compCanvas.getContext('2d');
        compCanvas.width = 640;
        compCanvas.height = 360;
        
        // Draw original (no effects)
        ctx.drawImage(img, 0, 0, compCanvas.width, compCanvas.height);
    };

    const renderThumbnailPreview = (sceneIndex) => {
        const canvas = thumbnailCanvasRef.current;
        if (!canvas || sceneIndex === null) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 90;
        
        const scene = scenes[sceneIndex];
        if (scene?.url) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = scene.url;
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Scene info
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Scene ${sceneIndex + 1}`, canvas.width / 2, canvas.height - 6);
            };
        }
    };

    const applyEffectPreview = (ctx, canvas, img, progress, effect, intensity = 1.0) => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();

        switch (effect) {
            case 'warp-flow':
                const numStrips = 32;
                const stripHeight = canvas.height / numStrips;
                
                for (let i = 0; i < numStrips; i++) {
                    const y = i * stripHeight;
                    const phase = (progress * Math.PI * 2) + (i * 0.2);
                    const offsetX = Math.sin(phase) * 12 * intensity;
                    const offsetY = Math.cos(phase * 0.5) * 6 * intensity;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, y, canvas.width, stripHeight + 1);
                    ctx.clip();
                    ctx.drawImage(img, offsetX, offsetY, canvas.width, canvas.height);
                    ctx.restore();
                }
                break;

            case 'zoom-in':
                const scale = 1.0 + (0.3 * progress * intensity);
                ctx.translate(centerX, centerY);
                ctx.scale(scale, scale);
                ctx.translate(-centerX, -centerY);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                break;

            case 'pan-left':
                const panX = -canvas.width * 0.2 * progress * intensity;
                ctx.translate(panX, 0);
                ctx.scale(1.0 + (0.2 * intensity), 1.0 + (0.2 * intensity));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                break;
            case 'pan-right':
                const panRightX = canvas.width * 0.2 * progress * intensity;
                ctx.translate(panRightX, 0);
                ctx.scale(1.0 + (0.2 * intensity), 1.0 + (0.2 * intensity));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                break;

            case 'glitch':
                if (Math.random() > (0.7 + (0.2 * (1 - intensity)))) {
                    const slices = Math.floor(10 * intensity);
                    for (let i = 0; i < slices; i++) {
                        const h = canvas.height / slices;
                        const offset = (Math.random() - 0.5) * 20 * intensity;
                        ctx.drawImage(img, 0, i * h, canvas.width, h, offset, i * h, canvas.width, h);
                    }
                } else {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                break;

            default:
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        ctx.restore();
    };

    const getTrimmedDuration = (index, baseDuration) => {
        const start = trimStart[index] || 0;
        const end = trimEnd[index] || baseDuration;
        const speed = sceneSpeed[index] || 1.0;
        return Math.max(0.1, (end - start) / speed);
    };

    const saveToHistory = (newScenes) => {
        const newHistory = editHistory.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newScenes)));
        setEditHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            const prevState = editHistory[historyIndex - 1];
            if (prevState) {
                onSaveEdits(prevState);
                toast.success("Annulé");
            }
        }
    };

    const handleRedo = () => {
        if (historyIndex < editHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
            const nextState = editHistory[historyIndex + 1];
            if (nextState) {
                onSaveEdits(nextState);
                toast.success("Refait");
            }
        }
    };

    const handleTimelineClick = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedTime = (x / rect.width) * totalDuration;
        setCurrentTime(Math.max(0, Math.min(totalDuration, clickedTime)));
        setIsPlaying(false);
    };

    const handleTimelineHover = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hoveredTime = (x / rect.width) * totalDuration;
        setHoverTime(hoveredTime);
        
        // Find which scene is being hovered
        let accTime = 0;
        for (let i = 0; i < scenes.length; i++) {
            const sceneDuration = getTrimmedDuration(i, scenes[i].duration || 5);
            if (hoveredTime >= accTime && hoveredTime < accTime + sceneDuration) {
                if (hoverSceneIndex !== i) {
                    setHoverSceneIndex(i);
                    renderThumbnailPreview(i);
                }
                break;
            }
            accTime += sceneDuration;
        }
    };

    const toggleMultiSelect = (index) => {
        if (multiSelect.includes(index)) {
            setMultiSelect(multiSelect.filter(i => i !== index));
        } else {
            setMultiSelect([...multiSelect, index]);
        }
    };

    const handleTrimScene = (startVal = null, endVal = null) => {
        if (selectedSceneIndex === null) return;

        const scene = scenes[selectedSceneIndex];
        const duration = scene.duration || 5;

        let trimStartVal = startVal !== null ? startVal : parseFloat(prompt("Start time (seconds):", trimStart[selectedSceneIndex] || "0") || "0");
        let trimEndVal = endVal !== null ? endVal : parseFloat(prompt("End time (seconds):", trimEnd[selectedSceneIndex] || duration.toString()) || duration.toString());

        if (trimStartVal >= 0 && trimEndVal > trimStartVal && trimEndVal <= duration) {
            setTrimStart({ ...trimStart, [selectedSceneIndex]: trimStartVal });
            setTrimEnd({ ...trimEnd, [selectedSceneIndex]: trimEndVal });

            // Update scene duration in the scenes array
            const updatedScenes = [...scenes];
            updatedScenes[selectedSceneIndex] = {
                ...updatedScenes[selectedSceneIndex],
                duration: trimEndVal - trimStartVal
            };
            saveToHistory(updatedScenes);
            onSaveEdits(updatedScenes);

            toast.success(`Scene ${selectedSceneIndex + 1} trimmed: ${trimStartVal.toFixed(1)}s - ${trimEndVal.toFixed(1)}s`);
        } else {
            toast.error("Invalid trim values");
        }
    };

    const handleSplitScene = (customSplitPoint = null) => {
        if (selectedSceneIndex === null) return;

        const scene = scenes[selectedSceneIndex];
        const duration = scene.duration || 5;
        const split = customSplitPoint !== null ? customSplitPoint : (duration / 2);

        if (split <= 0.5 || split >= duration - 0.5) {
            toast.error("Point de division invalide");
            return;
        }

        const updatedScenes = [...scenes];

        // First half
        updatedScenes[selectedSceneIndex] = {
            ...scene,
            duration: split
        };

        // Second half
        updatedScenes.splice(selectedSceneIndex + 1, 0, {
            ...scene,
            scene_number: selectedSceneIndex + 2,
            duration: duration - split
        });

        // Update scene numbers
        updatedScenes.forEach((s, idx) => {
            s.scene_number = idx + 1;
        });

        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        setSplitMode(false);
        toast.success(`Scène divisée à ${split.toFixed(1)}s !`);
    };

    const handleRippleDelete = () => {
        if (selectedSceneIndex === null || scenes.length <= 1) {
            toast.error("Cannot delete last scene");
            return;
        }
        
        const updatedScenes = scenes.filter((_, i) => i !== selectedSceneIndex).map((s, i) => ({
            ...s,
            scene_number: i + 1
        }));
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        setSelectedSceneIndex(Math.max(0, selectedSceneIndex - 1));
        toast.success("Scène supprimée !");
    };

    const handleMergeScenes = () => {
        if (selectedSceneIndex === null || selectedSceneIndex >= scenes.length - 1) {
            toast.error("Select a scene to merge with next");
            return;
        }
        
        const updatedScenes = [...scenes];
        const current = updatedScenes[selectedSceneIndex];
        const next = updatedScenes[selectedSceneIndex + 1];
        
        updatedScenes[selectedSceneIndex] = {
            ...current,
            duration: (current.duration || 5) + (next.duration || 5),
            description: `${current.description} • ${next.description}`,
            dialogue: `${current.dialogue || ''} ${next.dialogue || ''}`.trim()
        };
        
        updatedScenes.splice(selectedSceneIndex + 1, 1);
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        toast.success("Scenes merged!");
    };

    const handleBatchApplyEffect = () => {
        if (multiSelect.length === 0 || selectedEffect === 'none') {
            toast.error("Sélectionnez des scènes et un effet");
            return;
        }
        
        const updatedScenes = [...scenes];
        multiSelect.forEach(index => {
            updatedScenes[index] = {
                ...updatedScenes[index],
                effect: selectedEffect,
                effectIntensity: effectIntensity
            };
        });
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        setMultiSelect([]);
        toast.success(`Effet "${selectedEffect}" (${Math.round(effectIntensity * 100)}%) appliqué à ${multiSelect.length} scènes !`);
    };

    const clearAutoSave = () => {
        localStorage.removeItem(autoSaveKey);
        setLastAutoSave(null);
        setHasUnsavedChanges(false);
        toast.success("Auto-sauvegarde effacée");
    };

    const handleApplyEffect = () => {
        if (selectedSceneIndex === null || selectedEffect === 'none') return;
        
        const updatedScenes = [...scenes];
        updatedScenes[selectedSceneIndex] = {
            ...updatedScenes[selectedSceneIndex],
            effect: selectedEffect,
            effectIntensity: effectIntensity
        };
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        toast.success(`Effet "${selectedEffect}" appliqué avec intensité ${Math.round(effectIntensity * 100)}%`);
    };

    const handleUpdateTextOverlay = (text) => {
        const updatedScenes = [...scenes];
        updatedScenes[selectedSceneIndex] = {
            ...updatedScenes[selectedSceneIndex],
            overlayText: text
        };
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        setTextOverlays({ ...textOverlays, [selectedSceneIndex]: text });
        toast.success("Texte mis à jour !");
    };

    const handleUpdateSpeed = (speed) => {
        const updatedScenes = [...scenes];
        updatedScenes[selectedSceneIndex] = {
            ...updatedScenes[selectedSceneIndex],
            speed: speed
        };
        
        saveToHistory(updatedScenes);
        setSceneSpeed({ ...sceneSpeed, [selectedSceneIndex]: speed });
        onSaveEdits(updatedScenes);
        toast.success(`Vitesse: ${speed}x`);
    };

    const handleDuplicateScene = () => {
        if (selectedSceneIndex === null) return;
        
        const updatedScenes = [...scenes];
        const sceneToDuplicate = { ...scenes[selectedSceneIndex] };
        updatedScenes.splice(selectedSceneIndex + 1, 0, sceneToDuplicate);
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        toast.success("Scène dupliquée !");
    };

    const handleBatchDuplicate = () => {
        if (multiSelect.length === 0) {
            toast.error("Sélectionnez des scènes à dupliquer");
            return;
        }
        
        const updatedScenes = [...scenes];
        const sortedIndexes = [...multiSelect].sort((a, b) => b - a);
        
        sortedIndexes.forEach(index => {
            const sceneToDuplicate = { ...scenes[index] };
            updatedScenes.splice(index + 1, 0, sceneToDuplicate);
        });
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        setMultiSelect([]);
        toast.success(`${multiSelect.length} scène(s) dupliquée(s) !`);
    };

    const handleAddChapter = () => {
        const newChapter = {
            time: currentTime,
            label: `Chapitre ${chapters.length + 1}`,
            color: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][chapters.length % 5]
        };
        setChapters([...chapters, newChapter].sort((a, b) => a.time - b.time));
        toast.success("Marqueur ajouté !");
    };

    const handleDeleteChapter = (index) => {
        setChapters(chapters.filter((_, i) => i !== index));
        toast.success("Marqueur supprimé");
    };

    const handleSceneDragStart = (e, index) => {
        setDraggedSceneIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
    };

    const handleSceneDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (index !== draggedSceneIndex) {
            setDragOverIndex(index);
        }
    };

    const handleSceneDrop = (e, dropIndex) => {
        e.preventDefault();
        
        if (draggedSceneIndex === null || draggedSceneIndex === dropIndex) {
            setDraggedSceneIndex(null);
            setDragOverIndex(null);
            return;
        }

        const updatedScenes = [...scenes];
        const [movedScene] = updatedScenes.splice(draggedSceneIndex, 1);
        updatedScenes.splice(dropIndex, 0, movedScene);

        // Update scene numbers
        updatedScenes.forEach((scene, idx) => {
            scene.scene_number = idx + 1;
        });

        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
        
        setDraggedSceneIndex(null);
        setDragOverIndex(null);
        setSelectedSceneIndex(dropIndex);
        
        toast.success(`Scène déplacée de ${draggedSceneIndex + 1} à ${dropIndex + 1}`);
    };

    const handleSceneDragEnd = () => {
        setDraggedSceneIndex(null);
        setDragOverIndex(null);
    };

    const handleSaveKeyframes = (sceneIndex, keyframes) => {
        setSceneKeyframes({ ...sceneKeyframes, [sceneIndex]: keyframes });
        toast.success("Keyframes enregistrés");
    };

    const handleSaveColorOverlay = (sceneIndex, overlay) => {
        setColorOverlays({ ...colorOverlays, [sceneIndex]: overlay });
    };

    const handleUploadCustomEffect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.loading("Upload de l'effet personnalisé...");
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            const newEffect = {
                id: Date.now(),
                name: file.name.replace(/\.[^/.]+$/, ""),
                url: file_url,
                type: file.type.includes('video') ? 'video' : 'image'
            };

            setCustomEffects([...customEffects, newEffect]);
            toast.dismiss();
            toast.success("Effet personnalisé ajouté !");
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de l'upload");
        }
    };

    const handleAddAiScene = (sceneData) => {
        const updatedScenes = [...scenes, sceneData];
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
    };

    const handleUpdateTransitions = (transitions) => {
        const updatedScenes = [...scenes];
        transitions.forEach(trans => {
            if (updatedScenes[trans.fromScene]) {
                updatedScenes[trans.fromScene].transition = trans.type;
                updatedScenes[trans.fromScene].transitionDuration = trans.duration;
            }
        });
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
    };

    const handleAiGenerateMusic = (file, theme) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setBackgroundMusic({ url: file_url, name: `AI: ${theme.substring(0, 30)}...` });
        };
        reader.readAsArrayBuffer(file);
    };

    const handleApplyTemplate = (templateScene) => {
        if (selectedSceneIndex === null) return;
        
        const updatedScenes = [...scenes];
        updatedScenes[selectedSceneIndex] = {
            ...updatedScenes[selectedSceneIndex],
            ...templateScene
        };
        
        saveToHistory(updatedScenes);
        onSaveEdits(updatedScenes);
    };

    const handleEnqueueTask = (task) => {
        addTask(task);
        toast.success('Ajouté à la file hors-ligne');
    };

    const processOfflineQueue = async () => {
        toast.loading('Synchronisation de la file hors-ligne...');
        const result = await processQueue(async (task) => {
            if (task.type === 't2v_generate') {
                if (isSecureVideoApiConfigured) {
                    const clipUrl = await generateSecureVideo({
                        prompt: task.payload?.prompt || '',
                        duration: Math.min(task.payload?.duration || 5, 5),
                        mode: 'text-to-video'
                    });
                    if (!clipUrl) throw new Error('Echec génération');
                    handleAddAiScene({ url: clipUrl, videoUrl: clipUrl, duration: task.payload?.duration || 5, description: task.payload?.prompt });
                    return;
                }
                const response = await base44.functions.invoke('generateVideoFromText', task.payload);
                let clipUrl = response.data?.videoUrl;
                if (!clipUrl && response.data?.videoBase64) {
                    const binaryString = atob(response.data.videoBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    const blob = new Blob([bytes], { type: response.data.contentType || 'video/mp4' });
                    clipUrl = URL.createObjectURL(blob);
                }
                if (!clipUrl) throw new Error(response.data?.error || 'Echec génération');
                handleAddAiScene({ url: clipUrl, duration: task.payload?.duration || 5, description: task.payload?.prompt });
            }
        });
        toast.dismiss();
        toast.success(`Synchronisé: ${result.processed}/${result.total}`);
    };

    const handleBackgroundMusicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            toast.loading("Upload de la musique de fond...");
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setBackgroundMusic({ url: file_url, name: file.name });
            toast.dismiss();
            toast.success("Musique de fond ajoutée !");
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de l'upload de la musique");
        }
    };

    const handleExportEdit = async () => {
        setIsExporting(true);
        toast.loading("Sauvegarde des modifications...");
        try {
            const editedScenes = scenes.map((scene, index) => ({
                ...scene,
                duration: getTrimmedDuration(index, scene.duration || 5),
                trimStart: trimStart[index] || 0,
                trimEnd: trimEnd[index] || scene.duration || 5,
                speed: sceneSpeed[index] || 1.0,
                overlayText: textOverlays[index] || scene.overlayText,
                audioVolume: audioVolumes[index] !== undefined ? audioVolumes[index] : 1.0,
                audioFadeIn: audioFades[index]?.fadeIn || 0,
                audioFadeOut: audioFades[index]?.fadeOut || 0,
                audioTrimStart: audioTrimStart[index] || 0,
                audioTrimEnd: audioTrimEnd[index] || (scene.duration || 5)
            }));
            
            const audioSettings = {
                backgroundMusic,
                backgroundMusicVolume,
                timelineFadeIn,
                timelineFadeOut
            };
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async save
            onSaveEdits(editedScenes, audioSettings);
            toast.dismiss();
            toast.success("Modifications enregistrées !");
            onClose();
        } catch (error) {
            toast.dismiss();
            toast.error("Échec de l'enregistrement des modifications");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full flex flex-col p-0 bg-slate-950 text-white overflow-hidden">
                <DialogHeader className="px-4 sm:px-6 py-3 border-b border-slate-800 flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-950">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-white">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                            Éditeur Vidéo
                            {scenes.length > 0 && (
                                <Badge className="bg-amber-500/20 text-amber-300 text-xs ml-2">
                                    {scenes.length} scènes • {totalDuration.toFixed(1)}s
                                </Badge>
                            )}
                        </DialogTitle>
                        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-1 px-1 sm:overflow-visible sm:px-0" style={{ scrollbarWidth: 'none' }}>
                            {lastAutoSave && (
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                                    <span className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                                    <span>Auto-sauvegardé {lastAutoSave.toLocaleTimeString()}</span>
                                    <button 
                                        onClick={clearAutoSave}
                                        className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
                                        title="Effacer l'auto-sauvegarde"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowStoryboard(true)}
                                className="h-7 px-3 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
                            >
                                <Layout className="w-3 h-3 mr-1" />
                                Storyboard
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSequenceManager(true)}
                                className="h-7 px-3 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                            >
                                <FolderOpen className="w-3 h-3 mr-1" />
                                Séquences
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTemplates(true)}
                                className="h-7 px-3 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
                            >
                                <Save className="w-3 h-3 mr-1" />
                                Modèles
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAiAssistant(true)}
                                className="h-7 px-3 text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30"
                            >
                                <Bot className="w-3 h-3 mr-1" />
                                IA
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const v = !offlineMode; 
                                    setOfflineMode(v);
                                    localStorage.setItem('offline_mode_enabled', v ? '1' : '0');
                                }}
                                className={`h-7 px-3 text-xs ${offlineMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {offlineMode ? '📴 Hors-ligne ON' : '📴 Hors-ligne OFF'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={processOfflineQueue}
                                disabled={queue.length === 0}
                                className="h-7 px-3 text-xs text-slate-300 hover:text-white"
                            >
                                {queue.length > 0 ? `Sync (${queue.length})` : 'Sync'}
                            </Button>
                            <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => setShowToolsPanel(!showToolsPanel)}
                                 className="h-7 text-xs text-slate-400 hover:text-white"
                             >
                                 {showToolsPanel ? '🛠️ Hide Tools' : '🛠️ Show Tools'}
                             </Button>
                            </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Canvas Preview */}
                    <div className="bg-black flex items-center justify-center p-2 sm:p-4 relative min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
                        <div className="relative flex items-center justify-center gap-2 w-full h-full">
                            {/* Main Preview */}
                            <div className={`relative ${showComparison ? 'w-1/2' : 'w-full'} h-full flex items-center justify-center transition-all`}>
                                <canvas 
                                    ref={canvasRef}
                                    className="max-w-full max-h-full rounded shadow-lg border border-slate-700"
                                    style={{ maxHeight: '40vh' }}
                                />
                                {showComparison && (
                                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-xs">
                                        Avec Effet
                                    </Badge>
                                )}
                            </div>
                            
                            {/* Comparison Preview */}
                            {showComparison && (
                                <div className="w-1/2 h-full flex items-center justify-center relative">
                                    <canvas 
                                        ref={comparisonCanvasRef}
                                        className="max-w-full max-h-full rounded shadow-lg border border-slate-700"
                                        style={{ maxHeight: '40vh' }}
                                    />
                                    <Badge className="absolute top-2 left-2 bg-slate-600 text-white text-xs">
                                        Original
                                    </Badge>
                                </div>
                            )}
                        </div>
                        
                        {/* Top Controls */}
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                            {effectPreview && selectedEffect !== 'none' && (
                                <Badge className="bg-purple-600 text-white text-xs shadow-lg animate-pulse">
                                    🎬 Preview: {selectedEffect}
                                </Badge>
                            )}
                            {transitionPreview && (
                                <Badge className="bg-purple-600 text-white text-xs shadow-lg animate-pulse">
                                    ↔️ Transitions ON
                                </Badge>
                            )}
                            {isAudioPlaying && (
                                <Badge className="bg-green-600 text-white text-xs shadow-lg flex items-center gap-1">
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    Audio
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowComparison(!showComparison)}
                                className={`h-7 text-xs px-3 rounded-lg font-medium transition-all shadow-md ${
                                    showComparison 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 backdrop-blur'
                                }`}
                            >
                                {showComparison ? '👁️ Vue Simple' : '👁️👁️ Comparer Avant/Après'}
                            </Button>
                        </div>
                        
                        {/* Hidden audio element for playback */}
                        {scenes[0]?.audioUrl && (
                            <audio
                                ref={audioRef}
                                src={scenes[0].audioUrl}
                                className="hidden"
                                onEnded={() => setIsAudioPlaying(false)}
                            />
                        )}
                    </div>

                    {/* Offline Queue Indicator */}
                    {(offlineMode || queue.length > 0) && (
                      <div className="px-3 sm:px-4 pt-3 bg-slate-900 border-t border-amber-700/30">
                        <OfflineQueueIndicator 
                          offlineMode={offlineMode} 
                          queue={queue}
                          onSync={processOfflineQueue}
                          onClear={clearQueue}
                          onRemove={removeTask}
                        />
                      </div>
                    )}

                    {/* Controls */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 p-3 sm:p-4 space-y-3 sm:space-y-4 flex-shrink-0">
                        {/* Playback Controls - Enhanced */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
                                    className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 sm:h-10 sm:w-10 rounded-lg transition-all"
                                    title="Reculer 1s"
                                >
                                    <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>

                                <Button
                                    size="icon"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg shadow-amber-500/30 transition-all"
                                    title={isPlaying ? "Pause (Espace)" : "Lecture (Espace)"}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))}
                                    className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 sm:h-10 sm:w-10 rounded-lg transition-all"
                                    title="Avancer 1s"
                                >
                                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-xs sm:text-sm text-slate-400 font-mono bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                    {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
                                </div>
                                {selectedSceneIndex !== null && (
                                    <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                                        Scène {selectedSceneIndex + 1}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Interactive Timeline */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-300 mb-1 bg-slate-800/50 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-amber-500 rounded" />
                                    <span className="font-semibold">Timeline Interactive</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-slate-700 rounded transition-all"
                                        title="Dézoomer"
                                    >
                                        <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </Button>
                                    <span className="w-10 sm:w-12 text-center text-[10px] sm:text-xs font-mono bg-slate-900 px-2 py-0.5 rounded">
                                        {Math.round(timelineZoom * 100)}%
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-slate-700 rounded transition-all"
                                        title="Zoomer"
                                    >
                                        <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div 
                                ref={timelineRef}
                                className="relative h-32 sm:h-40 bg-slate-950 rounded-lg border border-slate-700 overflow-x-auto cursor-pointer"
                                onClick={handleTimelineClick}
                                onMouseMove={handleTimelineHover}
                                onMouseLeave={() => {
                                    setHoverTime(null);
                                    setHoverSceneIndex(null);
                                }}
                            >
                                {/* Time Markers with improved visibility */}
                                <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-800 bg-slate-900/50">
                                    {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                                        <div 
                                            key={i}
                                            className="absolute text-[9px] text-slate-400"
                                            style={{ left: i * pixelsPerSecond }}
                                        >
                                            <div className={`w-px bg-slate-600 ${i % 5 === 0 ? 'h-4' : 'h-2'}`} />
                                            {i % 5 === 0 && <span className="ml-1 font-mono">{i}s</span>}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Enhanced Timeline Sections */}
                                <div className="absolute top-6 left-0 right-0 h-10 bg-slate-900/40 border-b border-slate-800">
                                    {scenes.map((scene, index) => {
                                        let startX = 0;
                                        for (let i = 0; i < index; i++) {
                                            startX += getTrimmedDuration(i, scenes[i].duration || 5) * pixelsPerSecond;
                                        }
                                        const width = getTrimmedDuration(index, scene.duration || 5) * pixelsPerSecond;
                                        const volume = audioVolumes[index] !== undefined ? audioVolumes[index] : 1.0;
                                        const audioTrimStartVal = audioTrimStart[index] || 0;
                                        const audioTrimEndVal = audioTrimEnd[index] || (scene.duration || 5);
                                        const hasAudioTrim = audioTrimStartVal > 0 || audioTrimEndVal < (scene.duration || 5);
                                        
                                        return (
                                            <div
                                                key={`wave-${index}`}
                                                className="absolute h-full group/wave"
                                                style={{ left: startX, width }}
                                            >
                                                {/* Video track indicator */}
                                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600/50 to-blue-500/50 border-b border-blue-400/30" />
                                                
                                                {/* Audio waveform with volume visualization */}
                                                <div className="w-full h-full flex items-center gap-px px-0.5 relative pt-2">
                                                    {Array.from({ length: Math.floor(width / 2.5) }).map((_, i) => {
                                                        const baseHeight = 20 + Math.sin(i * 0.4) * 15 + Math.random() * 15;
                                                        const adjustedHeight = baseHeight * volume;
                                                        return (
                                                            <div 
                                                                key={i}
                                                                className="w-0.5 bg-gradient-to-t from-green-600 to-green-400 rounded-full transition-all"
                                                                style={{ 
                                                                    height: `${adjustedHeight}%`,
                                                                    opacity: 0.5 + (volume * 0.5)
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                    
                                                    {/* Audio trim overlay */}
                                                    {hasAudioTrim && (
                                                        <>
                                                            <div 
                                                                className="absolute top-0 left-0 bottom-0 bg-red-900/40 border-r-2 border-red-500"
                                                                style={{ width: `${(audioTrimStartVal / (scene.duration || 5)) * 100}%` }}
                                                            />
                                                            <div 
                                                                className="absolute top-0 right-0 bottom-0 bg-red-900/40 border-l-2 border-red-500"
                                                                style={{ width: `${((scene.duration || 5) - audioTrimEndVal) / (scene.duration || 5) * 100}%` }}
                                                            />
                                                        </>
                                                    )}
                                                    
                                                    {/* Info overlay on hover */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/wave:opacity-100 transition-opacity bg-slate-900/90">
                                                        <div className="text-[9px] text-center space-y-0.5">
                                                            <div className="text-blue-400">📹 Vidéo: {(scene.duration || 5).toFixed(1)}s</div>
                                                            <div className="text-green-400">🔊 Audio: {Math.round(volume * 100)}%</div>
                                                            {hasAudioTrim && (
                                                                <div className="text-cyan-400">✂️ {audioTrimStartVal.toFixed(1)}s - {audioTrimEndVal.toFixed(1)}s</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Background music indicator */}
                                    {backgroundMusic && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600/60 to-purple-600/60 border-t border-indigo-400/30">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-[8px] text-indigo-200 font-bold opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    🎵 Musique de fond ({Math.round(backgroundMusicVolume * 100)}%)
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chapter Markers */}
                                {chapters.map((chapter, idx) => (
                                    <div
                                        key={`chapter-${idx}`}
                                        className="absolute top-0 bottom-0 z-15 cursor-pointer group/chapter"
                                        style={{ left: (chapter.time / totalDuration) * (totalDuration * pixelsPerSecond) }}
                                    >
                                        <div 
                                            className="w-0.5 h-full"
                                            style={{ backgroundColor: chapter.color }}
                                        />
                                        <div 
                                            className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap opacity-0 group-hover/chapter:opacity-100 transition-opacity"
                                            style={{ backgroundColor: chapter.color, color: 'white', marginTop: '-20px' }}
                                        >
                                            {chapter.label}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChapter(idx);
                                            }}
                                            className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover/chapter:opacity-100 transition-opacity"
                                            style={{ marginTop: '-6px', marginRight: '-6px' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* Sequence Markers */}
                                {sequences.map((seq) => {
                                    const firstSceneIndex = Math.min(...seq.sceneIndexes);
                                    const lastSceneIndex = Math.max(...seq.sceneIndexes);
                                    
                                    let startX = 0;
                                    for (let i = 0; i < firstSceneIndex; i++) {
                                        startX += getTrimmedDuration(i, scenes[i].duration || 5) * pixelsPerSecond;
                                    }
                                    
                                    let endX = startX;
                                    for (let i = firstSceneIndex; i <= lastSceneIndex; i++) {
                                        endX += getTrimmedDuration(i, scenes[i]?.duration || 5) * pixelsPerSecond;
                                    }
                                    
                                    return (
                                        <div
                                            key={seq.id}
                                            className="absolute top-0 h-full z-5 pointer-events-none border-t-2 border-b-2"
                                            style={{
                                                left: startX,
                                                width: endX - startX,
                                                borderColor: seq.color,
                                                backgroundColor: `${seq.color}15`
                                            }}
                                        >
                                            <div 
                                                className="absolute -top-5 left-2 text-[10px] font-bold px-2 py-0.5 rounded"
                                                style={{ backgroundColor: seq.color, color: 'white' }}
                                            >
                                                {seq.name}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Scene Blocks */}
                                <div className="absolute top-16 left-0 right-0 h-16 sm:h-20 flex gap-0.5 p-1">
                                    {scenes.map((scene, index) => {
                                        const sceneDuration = getTrimmedDuration(index, scene.duration || 5);
                                        const width = sceneDuration * pixelsPerSecond;
                                        const isSelected = index === selectedSceneIndex;
                                        const isMultiSelected = multiSelect.includes(index);
                                        const trimStartVal = trimStart[index] || 0;
                                        const trimEndVal = trimEnd[index] || (scene.duration || 5);
                                        const hasTrim = trimStartVal > 0 || trimEndVal < (scene.duration || 5);

                                        return (
                                            <div
                                                key={index}
                                                draggable
                                                onDragStart={(e) => handleSceneDragStart(e, index)}
                                                onDragOver={(e) => handleSceneDragOver(e, index)}
                                                onDrop={(e) => handleSceneDrop(e, index)}
                                                onDragEnd={handleSceneDragEnd}
                                                className={`relative h-full rounded overflow-hidden border-2 transition-all group cursor-move ${
                                                    isSelected ? 'border-amber-500 ring-1 sm:ring-2 ring-amber-300' : 
                                                    isMultiSelected ? 'border-blue-500 ring-1 ring-blue-300' : 'border-slate-600'
                                                } ${
                                                    draggedSceneIndex === index ? 'opacity-50 scale-95' : ''
                                                } ${
                                                    dragOverIndex === index ? 'ring-2 ring-amber-400' : ''
                                                }`}
                                                style={{ width: Math.max(60, width) }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (e.shiftKey) {
                                                        toggleMultiSelect(index);
                                                    } else {
                                                        setSelectedSceneIndex(index);
                                                        setMultiSelect([]);
                                                    }
                                                }}
                                                >
                                                {/* Thumbnail */}
                                                {scene.url && (
                                                    <img 
                                                        src={scene.url} 
                                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all"
                                                        alt={`Scene ${index + 1}`}
                                                    />
                                                )}

                                                {/* Scene Info */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/90 via-black/40 to-transparent p-0.5 sm:p-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-md">S{index + 1}</span>
                                                    <span className="text-[8px] sm:text-[9px] text-slate-200 drop-shadow">{sceneDuration.toFixed(1)}s</span>

                                                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                                                        {sceneSpeed[index] && sceneSpeed[index] !== 1.0 && (
                                                            <Badge className="text-[7px] sm:text-[8px] px-1 py-0 bg-blue-600 text-white border border-blue-400">
                                                                {sceneSpeed[index]}x
                                                            </Badge>
                                                        )}
                                                        {scene.effect && scene.effect !== 'none' && (
                                                            <Badge className="text-[7px] sm:text-[8px] px-1 py-0 bg-purple-600 text-white border border-purple-400 hidden sm:block">
                                                                {scene.effect}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Trim Indicators */}
                                                {hasTrim && (
                                                    <>
                                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50" />
                                                        {/* Trim handles */}
                                                        {trimMode && isSelected && (
                                                            <>
                                                                <div 
                                                                    className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize hover:w-2 transition-all z-20"
                                                                    onMouseDown={(e) => {
                                                                        e.stopPropagation();
                                                                        setTrimHandleActive({ index, handle: 'start' });
                                                                    }}
                                                                />
                                                                <div 
                                                                    className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 cursor-ew-resize hover:w-2 transition-all z-20"
                                                                    onMouseDown={(e) => {
                                                                        e.stopPropagation();
                                                                        setTrimHandleActive({ index, handle: 'end' });
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {/* Selection Glow */}
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Hover Preview with Thumbnail */}
                                {hoverTime !== null && (
                                    <>
                                        <div 
                                            className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-70 z-10 pointer-events-none"
                                            style={{ left: (hoverTime / totalDuration) * (totalDuration * pixelsPerSecond) }}
                                        >
                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-blue-400 bg-slate-900 px-1 rounded whitespace-nowrap">
                                                {hoverTime.toFixed(2)}s
                                            </div>
                                        </div>
                                        
                                        {/* Thumbnail Preview on Hover */}
                                        {hoverSceneIndex !== null && (
                                            <div 
                                                className="absolute z-30 pointer-events-none bg-slate-900 rounded-lg border-2 border-blue-500 shadow-2xl overflow-hidden"
                                                style={{ 
                                                    left: Math.min((hoverTime / totalDuration) * (totalDuration * pixelsPerSecond) - 80, totalDuration * pixelsPerSecond - 170),
                                                    top: -110
                                                }}
                                            >
                                                <canvas 
                                                    ref={thumbnailCanvasRef}
                                                    className="w-40 h-24"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {/* Enhanced Transition Preview Indicators */}
                                {transitionPreview && scenes.length > 1 && scenes.map((scene, index) => {
                                   if (index === scenes.length - 1) return null;

                                   let transitionX = 0;
                                   for (let i = 0; i <= index; i++) {
                                       transitionX += getTrimmedDuration(i, scenes[i].duration || 5) * pixelsPerSecond;
                                   }

                                   return (
                                       <div
                                           key={`trans-${index}`}
                                           className="absolute top-16 h-20 w-12 z-5 pointer-events-none group/trans"
                                           style={{ left: transitionX - 24 }}
                                       >
                                           {/* Transition zone with gradient */}
                                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent animate-pulse" />

                                           {/* Transition label */}
                                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                               <div className="text-[8px] text-purple-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-purple-500/50 whitespace-nowrap shadow-lg">
                                                   ↔️ {scene.transition || 'fade'}
                                               </div>
                                           </div>

                                           {/* Expanded preview on hover */}
                                           <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover/trans:opacity-100 transition-opacity bg-slate-900 p-2 rounded border border-purple-500 shadow-2xl whitespace-nowrap z-30">
                                               <div className="text-[9px] text-purple-200 text-center">
                                                   <div className="font-bold mb-1">Transition Preview</div>
                                                   <div className="flex items-center gap-1 text-[8px]">
                                                       <span>S{index + 1}</span>
                                                       <span className="text-purple-400">→</span>
                                                       <span>S{index + 2}</span>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   );
                                })}

                                {/* Playhead */}
                                <div 
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg z-20 pointer-events-none"
                                    style={{ left: (currentTime / totalDuration) * (totalDuration * pixelsPerSecond) }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md" />
                                </div>
                            </div>

                            {/* Scrubber */}
                            <Slider
                                value={[currentTime]}
                                onValueChange={([val]) => {
                                    setCurrentTime(val);
                                    setIsPlaying(false);
                                }}
                                min={0}
                                max={totalDuration}
                                step={0.01}
                                className="py-2"
                            />
                        </div>

                        {/* Editing Tools */}
                        {showToolsPanel && (
                            <div className="space-y-3 border-t border-slate-800 pt-3 animate-in slide-in-from-bottom-2">
                                {/* Quick Actions Bar */}
                                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                                    <div className="flex items-center gap-1">
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={handleUndo}
                                           disabled={historyIndex <= 0}
                                           className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all disabled:opacity-30"
                                           title="Annuler (Ctrl+Z)"
                                       >
                                           <Undo className="w-4 h-4" />
                                       </Button>
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={handleRedo}
                                           disabled={historyIndex >= editHistory.length - 1}
                                           className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all disabled:opacity-30"
                                           title="Refaire (Ctrl+Y)"
                                       >
                                           <Redo className="w-4 h-4" />
                                       </Button>
                                       <div className="w-px h-6 bg-slate-700 mx-1" />
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => setTrimMode(!trimMode)}
                                           className={`h-8 px-3 text-xs transition-all ${trimMode ? 'bg-green-500/20 text-green-300' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                           title="Mode Découpage"
                                       >
                                           <Move className="w-3 h-3 mr-1" />
                                           Trim
                                       </Button>
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => setSplitMode(!splitMode)}
                                           className={`h-8 px-3 text-xs transition-all ${splitMode ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                           title="Mode Division Précise"
                                       >
                                           <Scissors className="w-3 h-3 mr-1" />
                                           Split
                                       </Button>
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={handleAddChapter}
                                           className="h-8 px-3 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                                           title="Ajouter un marqueur"
                                       >
                                           <Bookmark className="w-3 h-3 mr-1" />
                                           Marqueur
                                       </Button>
                                       <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                                           className={`h-8 px-3 text-xs transition-all ${showEffectsPanel ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                       >
                                           <Wand2 className="w-3 h-3 mr-1" />
                                           Effets
                                           </Button>
                                           <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => setShowKeyframeEditor(true)}
                                           disabled={selectedSceneIndex === null}
                                           className="h-8 px-3 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                                           title="Keyframes"
                                           >
                                           <TrendingUp className="w-3 h-3 mr-1" />
                                           Animation
                                           </Button>
                                           <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => setShowColorOverlayEditor(true)}
                                           disabled={selectedSceneIndex === null}
                                           className="h-8 px-3 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                                           title="Filtres couleur"
                                           >
                                           <Palette className="w-3 h-3 mr-1" />
                                           Couleur
                                           </Button>
                                           </div>

                                    <div className="flex items-center gap-2">
                                        {multiSelect.length > 0 && (
                                            <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                                                {multiSelect.length} sélectionnées
                                            </Badge>
                                        )}
                                        {selectedSceneIndex !== null && (
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                S{selectedSceneIndex + 1} • {(scenes[selectedSceneIndex]?.duration || 5).toFixed(1)}s
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {/* Split Mode Info */}
                            {splitMode && selectedSceneIndex !== null && (
                                <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/50 animate-pulse">
                                    <div className="text-xs text-blue-300 font-semibold mb-2 flex items-center gap-2">
                                        <Scissors className="w-3 h-3" />
                                        Mode Division Activé - Scène {selectedSceneIndex + 1}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] text-blue-400">
                                            <span>Point de division</span>
                                            <span>{splitPoint.toFixed(1)}s / {(scenes[selectedSceneIndex]?.duration || 5).toFixed(1)}s</span>
                                        </div>
                                        <Slider
                                            value={[splitPoint]}
                                            onValueChange={([v]) => setSplitPoint(v)}
                                            min={0.5}
                                            max={(scenes[selectedSceneIndex]?.duration || 5) - 0.5}
                                            step={0.1}
                                            className="[&_[role=slider]]:bg-blue-500"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSplitScene(splitPoint)}
                                                className="flex-1 h-7 bg-blue-600 hover:bg-blue-700"
                                            >
                                                ✂️ Diviser ici
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setSplitMode(false)}
                                                className="h-7"
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scene Tools */}
                            <div className="space-y-2 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] sm:text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        Scène {selectedSceneIndex + 1} - Outils d'Édition
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden sm:block text-[9px] text-slate-500">Shift+clic = Multi-sélection</div>
                                        <div className="flex items-center gap-1">
                                            <Gauge className="w-3 h-3 text-slate-400" />
                                            <Select value={String(renderSpeed || 1)} onValueChange={(v) => onChangeRenderSpeed && onChangeRenderSpeed(parseFloat(v))}>
                                                <SelectTrigger className="h-7 w-[88px] text-xs bg-slate-900/50 border-slate-700 text-slate-200">
                                                    <SelectValue placeholder="1.00x" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    <SelectItem value="0.25">0.25x</SelectItem>
                                                    <SelectItem value="0.5">0.50x</SelectItem>
                                                    <SelectItem value="0.75">0.75x</SelectItem>
                                                    <SelectItem value="1">1.00x</SelectItem>
                                                    <SelectItem value="1.25">1.25x</SelectItem>
                                                    <SelectItem value="1.5">1.50x</SelectItem>
                                                    <SelectItem value="1.75">1.75x</SelectItem>
                                                    <SelectItem value="2">2.00x</SelectItem>
                                                    <SelectItem value="2.5">2.50x</SelectItem>
                                                    <SelectItem value="3">3.00x</SelectItem>
                                                    <SelectItem value="4">4.00x</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={multiSelect.length > 0 ? handleBatchDuplicate : handleDuplicateScene}
                                        className="border-slate-600 text-slate-300 hover:bg-cyan-900/30 hover:border-cyan-500 hover:text-cyan-300 h-9 text-xs transition-all"
                                        title="Dupliquer"
                                    >
                                        <Copy className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">{multiSelect.length > 0 ? `x${multiSelect.length}` : 'Dupliquer'}</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSplitScene}
                                        className="border-slate-600 text-slate-300 hover:bg-blue-900/30 hover:border-blue-500 hover:text-blue-300 h-9 text-xs transition-all"
                                        title="Diviser la scène en deux"
                                    >
                                        <Split className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Split</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTrimScene}
                                        className="border-slate-600 text-slate-300 hover:bg-green-900/30 hover:border-green-500 hover:text-green-300 h-9 text-xs transition-all"
                                        title="Découper début/fin"
                                    >
                                        <Scissors className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Trim</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMergeScenes}
                                        disabled={selectedSceneIndex >= scenes.length - 1}
                                        className="border-slate-600 text-slate-300 hover:bg-purple-900/30 hover:border-purple-500 hover:text-purple-300 h-9 text-xs transition-all disabled:opacity-30"
                                        title="Fusionner avec la scène suivante"
                                    >
                                        <Merge className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Merge</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRippleDelete}
                                        disabled={scenes.length <= 1}
                                        className="border-red-600/50 text-red-300 hover:bg-red-900/50 hover:border-red-500 h-9 text-xs transition-all disabled:opacity-30"
                                        title="Supprimer la scène"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowTextEditor(!showTextEditor)}
                                        className={`border-slate-600 text-slate-300 hover:bg-slate-700 h-9 text-xs transition-all ${showTextEditor ? 'bg-slate-700 border-amber-500' : ''}`}
                                        title="Ajouter du texte"
                                    >
                                        <Type className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Text</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAudioPanel(!showAudioPanel)}
                                        className={`border-slate-600 text-slate-300 hover:bg-slate-700 h-9 text-xs transition-all ${showAudioPanel ? 'bg-slate-700 border-green-500' : ''}`}
                                        title="Contrôles audio"
                                    >
                                        <Volume2 className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Audio</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const speed = parseFloat(prompt("Vitesse Scène (0.25-4.0):", sceneSpeed[selectedSceneIndex] || "1.0"));
                                            if (speed >= 0.25 && speed <= 4.0) {
                                                handleUpdateSpeed(speed);
                                            }
                                        }}
                                        className="border-slate-600 text-slate-300 hover:bg-indigo-900/30 hover:border-indigo-500 hover:text-indigo-300 h-9 text-xs transition-all"
                                        title="Vitesse de la scène (image/vidéo uniquement)"
                                    >
                                        <Gauge className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">
                                            {sceneSpeed[selectedSceneIndex] ? `${sceneSpeed[selectedSceneIndex]}x` : 'Speed'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            {/* Text Overlay Editor */}
                            {showTextEditor && (
                                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2 animate-in slide-in-from-top-2">
                                    <Label className="text-xs text-slate-300">Texte sur la scène</Label>
                                    <Input
                                        value={textOverlays[selectedSceneIndex] || scenes[selectedSceneIndex]?.overlayText || ''}
                                        onChange={(e) => setTextOverlays({ ...textOverlays, [selectedSceneIndex]: e.target.value })}
                                        placeholder="Entrez le texte..."
                                        className="bg-slate-900 border-slate-700 text-white h-8 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateTextOverlay(textOverlays[selectedSceneIndex] || '');
                                                setShowTextEditor(false);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 h-7 text-xs flex-1"
                                        >
                                            Appliquer
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowTextEditor(false)}
                                            className="h-7 text-xs"
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Chapters Info */}
                            {chapters.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs text-slate-300 flex items-center gap-2">
                                            <Bookmark className="w-3 h-3" />
                                            Chapitres & Navigation ({chapters.length})
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAudioTimeline(!showAudioTimeline)}
                                            className="h-6 text-[10px] text-slate-400 hover:text-white"
                                        >
                                            {showAudioTimeline ? '🔊 Hide Audio Timeline' : '🔊 Show Audio Timeline'}
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {chapters.map((ch, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentTime(ch.time);
                                                    setIsPlaying(false);
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-[10px] text-white font-medium hover:opacity-80 transition-all hover:scale-105 shadow-md flex items-center gap-1.5"
                                                style={{ backgroundColor: ch.color }}
                                            >
                                                <Bookmark className="w-2.5 h-2.5" />
                                                {ch.label}
                                                <span className="opacity-75">({ch.time.toFixed(1)}s)</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-700 text-[9px] text-slate-400">
                                        💡 Glissez-déposez les scènes pour réorganiser • Shift+clic pour sélection multiple
                                    </div>
                                    </div>
                                    )}

                                    {/* Advanced Audio Timeline */}
                                    {showAudioTimeline && (audioTracks?.length > 0 || voiceoverTrack) && (
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mt-3">
                                    <AdvancedAudioTimeline
                                        audioTracks={audioTracks || []}
                                        totalDuration={totalDuration}
                                        onUpdateTrack={(idx, updates) => {
                                            if (onUpdateAudioTrack) {
                                                onUpdateAudioTrack(idx, updates);
                                            }
                                        }}
                                        onRemoveTrack={(idx) => {
                                            if (onRemoveAudioTrack && window.confirm('Delete this audio track?')) {
                                                onRemoveAudioTrack(idx);
                                                toast.success('Audio track deleted');
                                            }
                                        }}
                                        onAddTrack={() => {
                                            if (onAddAudioTrack) {
                                                onAddAudioTrack();
                                            }
                                        }}
                                        onReorderTracks={(newTracks) => {
                                            // Completely replace audioTracks via parent
                                            if (onUpdateAudioTrack) {
                                                newTracks.forEach((track, idx) => {
                                                    onUpdateAudioTrack(idx, track);
                                                });
                                            }
                                        }}
                                        playheadPosition={currentTime}
                                        onPlayheadChange={(time) => {
                                            setCurrentTime(time);
                                            setIsPlaying(false);
                                        }}
                                        isPlaying={isPlaying}
                                        onPlayPause={() => setIsPlaying(!isPlaying)}
                                    />
                                    </div>
                                    )}

                            {/* Audio Panel - Enhanced */}
                            {showAudioPanel && (
                                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-3 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-slate-300 flex items-center gap-2">
                                            <Volume2 className="w-3 h-3" />
                                            Audio - Scène {selectedSceneIndex + 1}
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAudioPanel(false)}
                                            className="h-6 w-6 p-0"
                                        >
                                            ✕
                                        </Button>
                                    </div>

                                    {/* Volume Control */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Volume</span>
                                            <span>{Math.round((audioVolumes[selectedSceneIndex] || 1.0) * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[audioVolumes[selectedSceneIndex] || 1.0]}
                                            onValueChange={(val) => {
                                                const newVolumes = { ...audioVolumes, [selectedSceneIndex]: val[0] };
                                                setAudioVolumes(newVolumes);
                                            }}
                                            min={0}
                                            max={2}
                                            step={0.1}
                                            className="[&_[role=slider]]:bg-green-500"
                                        />
                                    </div>

                                    {/* Audio Trimming */}
                                    <div className="space-y-1 pt-2 border-t border-slate-700">
                                        <div className="text-[10px] text-slate-400 mb-1">Découpage Audio</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] text-slate-400">
                                                    <span>Début</span>
                                                    <span>{(audioTrimStart[selectedSceneIndex] || 0).toFixed(1)}s</span>
                                                </div>
                                                <Slider
                                                    value={[audioTrimStart[selectedSceneIndex] || 0]}
                                                    onValueChange={(val) => {
                                                        setAudioTrimStart({ ...audioTrimStart, [selectedSceneIndex]: val[0] });
                                                    }}
                                                    min={0}
                                                    max={(scenes[selectedSceneIndex]?.duration || 5) - 0.5}
                                                    step={0.1}
                                                    className="[&_[role=slider]]:bg-cyan-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] text-slate-400">
                                                    <span>Fin</span>
                                                    <span>{(audioTrimEnd[selectedSceneIndex] || (scenes[selectedSceneIndex]?.duration || 5)).toFixed(1)}s</span>
                                                </div>
                                                <Slider
                                                    value={[audioTrimEnd[selectedSceneIndex] || (scenes[selectedSceneIndex]?.duration || 5)]}
                                                    onValueChange={(val) => {
                                                        setAudioTrimEnd({ ...audioTrimEnd, [selectedSceneIndex]: val[0] });
                                                    }}
                                                    min={(audioTrimStart[selectedSceneIndex] || 0) + 0.5}
                                                    max={scenes[selectedSceneIndex]?.duration || 5}
                                                    step={0.1}
                                                    className="[&_[role=slider]]:bg-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fade In/Out */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>Fade In</span>
                                                <span>{(audioFades[selectedSceneIndex]?.fadeIn || 0).toFixed(1)}s</span>
                                            </div>
                                            <Slider
                                                value={[audioFades[selectedSceneIndex]?.fadeIn || 0]}
                                                onValueChange={(val) => {
                                                    const newFades = {
                                                        ...audioFades,
                                                        [selectedSceneIndex]: {
                                                            ...(audioFades[selectedSceneIndex] || {}),
                                                            fadeIn: val[0]
                                                        }
                                                    };
                                                    setAudioFades(newFades);
                                                }}
                                                min={0}
                                                max={3}
                                                step={0.1}
                                                className="[&_[role=slider]]:bg-blue-500"
                                            />
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>Fade Out</span>
                                                <span>{(audioFades[selectedSceneIndex]?.fadeOut || 0).toFixed(1)}s</span>
                                            </div>
                                            <Slider
                                                value={[audioFades[selectedSceneIndex]?.fadeOut || 0]}
                                                onValueChange={(val) => {
                                                    const newFades = {
                                                        ...audioFades,
                                                        [selectedSceneIndex]: {
                                                            ...(audioFades[selectedSceneIndex] || {}),
                                                            fadeOut: val[0]
                                                        }
                                                    };
                                                    setAudioFades(newFades);
                                                }}
                                                min={0}
                                                max={3}
                                                step={0.1}
                                                className="[&_[role=slider]]:bg-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Preset Buttons */}
                                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setAudioVolumes({ ...audioVolumes, [selectedSceneIndex]: 0 });
                                            }}
                                            className="flex-1 h-7 text-xs"
                                        >
                                            <VolumeX className="w-3 h-3 mr-1" />
                                            Mute
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setAudioFades({
                                                    ...audioFades,
                                                    [selectedSceneIndex]: { fadeIn: 0.5, fadeOut: 0.5 }
                                                });
                                            }}
                                            className="flex-1 h-7 text-xs"
                                        >
                                            Smooth Fades
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Effect Preview Panel */}
                            {showEffectsPanel && (
                                <div className="space-y-2 bg-purple-900/20 rounded-lg p-3 border border-purple-700/50 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] sm:text-xs text-purple-300 font-semibold uppercase tracking-wider flex items-center gap-2">
                                            <Wand2 className="w-3 h-3" />
                                            Effets Visuels {multiSelect.length > 0 && `(${multiSelect.length} scènes)`}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTransitionPreview(!transitionPreview)}
                                                className={`h-6 text-[10px] transition-all ${transitionPreview ? 'text-purple-300 bg-purple-500/20' : 'text-purple-400 hover:text-purple-300'}`}
                                            >
                                                {transitionPreview ? '✓ Transitions ON' : 'Voir Transitions'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Select value={selectedEffect} onValueChange={setSelectedEffect}>
                                            <SelectTrigger className="bg-slate-900 border-purple-700/50 text-white h-9 text-xs flex-1 hover:border-purple-500 transition-colors">
                                                <SelectValue placeholder="Choisir un effet..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-purple-700">
                                               <SelectItem value="none" className="text-slate-300">Aucun effet</SelectItem>
                                               <SelectItem value="zoom-in" className="text-slate-300">🔍 Zoom In</SelectItem>
                                               <SelectItem value="pan-left" className="text-slate-300">← Pan Left</SelectItem>
                                               <SelectItem value="pan-right" className="text-slate-300">→ Pan Right</SelectItem>
                                               <SelectItem value="warp-flow" className="text-slate-300">🌊 Warp Flow (Motion)</SelectItem>
                                               <SelectItem value="glitch" className="text-slate-300">⚡ Glitch Digital</SelectItem>
                                            </SelectContent>
                                            </Select>

                                            {/* Custom Effects Upload */}
                                            <div>
                                            <input
                                               type="file"
                                               accept="image/*,video/*,.cube,.3dl"
                                               onChange={handleUploadCustomEffect}
                                               className="hidden"
                                               id="custom-effect-upload"
                                            />
                                            <label htmlFor="custom-effect-upload">
                                               <Button
                                                   type="button"
                                                   variant="outline"
                                                   size="sm"
                                                   className="w-full border-purple-700/50 text-purple-300 hover:bg-purple-900/30"
                                                   onClick={() => document.getElementById('custom-effect-upload').click()}
                                               >
                                                   <Upload className="w-3 h-3 mr-2" />
                                                   Upload Effet Personnalisé
                                               </Button>
                                            </label>
                                            {customEffects.length > 0 && (
                                               <div className="mt-2 text-[10px] text-purple-400">
                                                   {customEffects.length} effet(s) personnalisé(s) disponible(s)
                                               </div>
                                            )}
                                            </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={effectPreview ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setEffectPreview(!effectPreview)}
                                                className={`h-9 text-xs px-3 transition-all ${effectPreview ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30" : "border-purple-700/50 text-purple-300 hover:bg-purple-900/30"}`}
                                            >
                                                <Wand2 className="w-3 h-3 sm:mr-1.5" />
                                                {effectPreview ? 'Preview ON' : 'Preview'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={multiSelect.length > 0 ? handleBatchApplyEffect : handleApplyEffect}
                                                disabled={selectedEffect === 'none'}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-9 text-xs px-4 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Check className="w-3 h-3 sm:mr-1.5" />
                                                {multiSelect.length > 0 ? `Appliquer (${multiSelect.length})` : 'Appliquer'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Effect Intensity Slider */}
                                    {selectedEffect !== 'none' && (
                                        <div className="space-y-2 pt-2 border-t border-purple-700/30">
                                            <div className="flex justify-between items-center text-[10px] text-purple-300">
                                                <span>Intensité de l'effet</span>
                                                <span className="font-mono bg-purple-900/50 px-2 py-0.5 rounded">{Math.round(effectIntensity * 100)}%</span>
                                            </div>
                                            <Slider
                                                value={[effectIntensity]}
                                                onValueChange={([val]) => setEffectIntensity(val)}
                                                min={0.1}
                                                max={2}
                                                step={0.1}
                                                className="[&_[role=slider]]:bg-purple-500"
                                            />
                                            <div className="flex justify-between text-[9px] text-purple-400">
                                                <span>Subtil (10%)</span>
                                                <span>Normal (100%)</span>
                                                <span>Fort (200%)</span>
                                            </div>
                                        </div>
                                    )}

                                    {effectPreview && selectedEffect !== 'none' && (
                                        <div className="bg-purple-950/50 p-2 rounded text-[10px] text-purple-300 border border-purple-700/30">
                                            ℹ️ Preview actif - Ajustez l'intensité en temps réel. Cliquez "Appliquer" pour sauvegarder.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* Background Music & Timeline Audio Controls */}
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-lg p-3 border border-indigo-700/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-indigo-300 font-semibold flex items-center gap-2">
                                    <Music className="w-3 h-3" />
                                    Musique de Fond & Timeline Audio
                                </Label>
                            </div>

                            {/* Background Music Upload */}
                            <div className="space-y-2">
                                {!backgroundMusic ? (
                                    <div>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleBackgroundMusicUpload}
                                            className="hidden"
                                            id="bg-music-upload"
                                        />
                                        <label htmlFor="bg-music-upload">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full border-indigo-600/50 text-indigo-300 hover:bg-indigo-900/30"
                                                onClick={() => document.getElementById('bg-music-upload').click()}
                                            >
                                                <Music className="w-3 h-3 mr-2" />
                                                Ajouter Musique de Fond
                                            </Button>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="bg-indigo-950/50 p-2 rounded border border-indigo-700/30 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-indigo-200">
                                                <Music className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">{backgroundMusic.name}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setBackgroundMusic(null)}
                                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                        
                                        {/* Background Music Volume */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-indigo-400">
                                                <span>Volume Musique</span>
                                                <span>{Math.round(backgroundMusicVolume * 100)}%</span>
                                            </div>
                                            <Slider
                                                value={[backgroundMusicVolume]}
                                                onValueChange={([val]) => setBackgroundMusicVolume(val)}
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                className="[&_[role=slider]]:bg-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timeline-wide Fade Controls */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-700/30">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-indigo-400">
                                        <span>🎬 Timeline Fade In</span>
                                        <span>{timelineFadeIn.toFixed(1)}s</span>
                                    </div>
                                    <Slider
                                        value={[timelineFadeIn]}
                                        onValueChange={([val]) => setTimelineFadeIn(val)}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="[&_[role=slider]]:bg-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-indigo-400">
                                        <span>🎬 Timeline Fade Out</span>
                                        <span>{timelineFadeOut.toFixed(1)}s</span>
                                    </div>
                                    <Slider
                                        value={[timelineFadeOut]}
                                        onValueChange={([val]) => setTimelineFadeOut(val)}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="[&_[role=slider]]:bg-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="text-[9px] text-indigo-400/70 bg-indigo-950/30 p-2 rounded">
                                💡 Les fades timeline s'appliquent au début/fin de toute la vidéo
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 border-t border-slate-800 pt-3 mt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 h-10 text-xs sm:text-sm transition-all"
                            >
                                ✕ Annuler
                            </Button>
                            <Button
                                onClick={handleExportEdit}
                                disabled={isExporting}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-10 text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                            >
                                <Download className="w-4 h-4 sm:mr-1.5" />
                                {isExporting ? "Export en cours..." : "✓ Sauvegarder les Modifications"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Keyframe Editor Modal */}
                {selectedSceneIndex !== null && (
                    <KeyframeEditor
                        isOpen={showKeyframeEditor}
                        onClose={() => setShowKeyframeEditor(false)}
                        sceneIndex={selectedSceneIndex}
                        sceneDuration={scenes[selectedSceneIndex]?.duration || 5}
                        initialKeyframes={sceneKeyframes[selectedSceneIndex] || []}
                        onSave={handleSaveKeyframes}
                    />
                )}

                {/* Color Overlay Editor Modal */}
                {selectedSceneIndex !== null && (
                    <ColorOverlayEditor
                        isOpen={showColorOverlayEditor}
                        onClose={() => setShowColorOverlayEditor(false)}
                        sceneIndex={selectedSceneIndex}
                        initialOverlay={colorOverlays[selectedSceneIndex]}
                        onSave={handleSaveColorOverlay}
                    />
                )}

                {/* AI Video Assistant Modal */}
                <AiVideoAssistant
                    isOpen={showAiAssistant}
                    onClose={() => setShowAiAssistant(false)}
                    scenes={scenes}
                    onAddScene={handleAddAiScene}
                    onUpdateTransitions={handleUpdateTransitions}
                    onGenerateMusic={handleAiGenerateMusic}
                    offlineMode={offlineMode}
                    onEnqueueTask={handleEnqueueTask}
                    queueCount={queue.length}
                    onProcessQueue={processOfflineQueue}
                />

                {/* Storyboard View Modal */}
                <StoryboardView
                    isOpen={showStoryboard}
                    onClose={() => setShowStoryboard(false)}
                    scenes={scenes}
                    onReorder={(updatedScenes) => {
                        saveToHistory(updatedScenes);
                        onSaveEdits(updatedScenes);
                    }}
                    onEdit={(index) => {
                        setSelectedSceneIndex(index);
                        setShowStoryboard(false);
                    }}
                    onDelete={(index) => {
                        if (scenes.length > 1) {
                            const updated = scenes.filter((_, i) => i !== index);
                            saveToHistory(updated);
                            onSaveEdits(updated);
                        }
                    }}
                    onDuplicate={handleDuplicateScene}
                />

                {/* Sequence Manager Modal */}
                <SequenceManager
                    isOpen={showSequenceManager}
                    onClose={() => setShowSequenceManager(false)}
                    scenes={scenes}
                    sequences={sequences}
                    onUpdateSequences={setSequences}
                />

                {/* Scene Templates Modal */}
                <SceneTemplates
                    isOpen={showTemplates}
                    onClose={() => setShowTemplates(false)}
                    currentScene={selectedSceneIndex !== null ? scenes[selectedSceneIndex] : null}
                    onApplyTemplate={handleApplyTemplate}
                />
                </DialogContent>
                </Dialog>
                );
}
