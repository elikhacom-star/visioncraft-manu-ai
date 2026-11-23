import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Download, Wand2, Languages, Video, Sparkles, ChevronRight, Film, Mic, Image as ImageIcon, Briefcase, Smartphone, Heart, BookOpen, LayoutTemplate, Palette, Settings2, Upload, RefreshCw, Save, Edit, Package, Plane, Tag, Plus, GripVertical, Music as MusicIcon, Lightbulb, Loader2, Scissors, Trash2, User, Eye, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
const InvokeLLM = (p) => base44.integrations.Core.InvokeLLM(p);
const GenerateImage = (p) => base44.integrations.Core.GenerateImage(p);
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '../components/LanguageProvider';
import SceneEditor from '../components/SceneEditor';
import StoryboardSceneItem from '../components/StoryboardSceneItem';
import SceneVariantsModal from '../components/SceneVariantsModal';
import NarrativeBranchingModal from '../components/NarrativeBranchingModal';
import VideoEditor from '../components/VideoEditor';
import StyleTransferModal from '../components/StyleTransferModal';
import AudioGeneratorModal from '../components/AudioGeneratorModal';
import AudioTrackEditor from '../components/AudioTrackEditor';
import VideoTimeline from '../components/VideoTimeline';
import VideoExportModal from '../components/VideoExportModal';
import TemplateGallery from '../components/TemplateGallery';
import StyleSelector, { getStylePrompt } from '../components/StyleSelector';
import ScriptImprover from '../components/ScriptImprover';
import OnboardingTour from '../components/OnboardingTour';
import VoiceStudio from '../components/VoiceStudio';
import AiCreativeAssistant from '../components/AiCreativeAssistant';
import VoiceCloneModal from '../components/VoiceCloneModal';import SSMLEditor from '../components/SSMLEditor';import ScriptTextTab from '../components/script/ScriptTextTab';import TextToVoiceTab from '../components/script/TextToVoiceTab';import ScenePreviewPlayer from '../components/ScenePreviewPlayer';import ScriptFileImporter from '../components/ScriptFileImporter';import StockMediaBrowser from '../components/StockMediaBrowser';import HomeVideoPreviewSection from '../components/HomeVideoPreviewSection';import { VOICES_BASE } from '../components/voiceData';
import { renderImageSceneWithEffects as _renderScene, renderPlaceholderScene as _renderPlaceholder } from '../components/rendering/SceneEffectsRenderer';
import LandingPage from '../components/LandingPage';
import NativeVoiceEnhancer from '../components/NativeVoiceEnhancer';
import AdvancedAudioTimeline from '../components/audio/AdvancedAudioTimeline';
import MicrophoneRecorder from '../components/MicrophoneRecorder';
import UndoRedoToolbar from '../components/UndoRedoToolbar';import SubtitleToggle from '../components/subtitles/SubtitleToggle';import SubtitleManager from '../components/subtitles/SubtitleManager';
import ScriptAnalyzer from '../components/ScriptAnalyzer';import SaveTemplateDialog from '../components/SaveTemplateDialog';import AdvancedAudioEditorDialog from '../components/AdvancedAudioEditorDialog';import AudioMixerDialog from '../components/AudioMixerDialog';import RegenerateButtons from '../components/script/RegenerateButtons';import ImageUploadTab from '../components/script/ImageUploadTab';import AdvancedSettingsPanel from '../components/script/AdvancedSettingsPanel';
import StoryboardPreviewCard from '../components/storyboard/StoryboardPreviewCard';
import { autoSyncSceneDurations, suggestSceneDurations } from '../components/audio/AudioSyncAnalyzer';
import { HelpCircle as HelpIcon, Bot, BarChart3 } from "lucide-react";
import { generateProceduralAudio } from "../components/proceduralAudio";
import SmartSFXGenerator from '../components/audio/SmartSFXGenerator';
import AdvancedSceneEditor from '../components/AdvancedSceneEditor';
import ScreenplayExportButton from '../components/ScreenplayExportButton';
import AdvancedStoryboardMode from '../components/storyboard/AdvancedStoryboardMode';import AutoLanguageDetector from '../components/script/AutoLanguageDetector';import ScriptTemplatesModal from '../components/script/ScriptTemplatesModal';import ToneRewriterButton from '../components/script/ToneRewriterButton';import UrlToScriptButton from '../components/script/UrlToScriptButton';import ScriptActionButtons from '../components/script/ScriptActionButtons';import HelpTooltip from '../components/HelpTooltip';
import { enrichWithEmotions, getSceneEmotionStyle } from '../components/storyboard/VoiceoverCreator';import { LANGUAGES, SLIDE_EFFECTS, CINEMATIC_ANGLES, CINEMATIC_MOODS, GLOBAL_FILTERS, STYLE_PRESETS, playSFX, PACING_PROFILES, EMOTION_PRESETS } from '../components/effects/SlideEffects';import { wrapText, addSynchronizedCaption } from '../components/rendering/CanvasRenderer';
export default function Home() {
  const { t, language: uiLanguage } = useLanguage();
  const location = useLocation();
  const [script, setScript] = useState(location.state?.script || '');
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDemo, setShowDemo] = useState(location.state?.showDemo || false);

  useEffect(() => {
    document.title = "Visioncraft AI";

    // Handle loading project data from Resume action
    if (location.state?.projectData && location.state?.isResume) {
      const data = location.state.projectData;
      setCurrentProjectId(data.id);
      setScript(data.script || '');
      setLanguage(data.language || '');

      // Restore settings
      if (data.settings) {
        if (data.settings.artStyle) setArtStyle(data.settings.artStyle);
        if (data.settings.negativePrompt) setNegativePrompt(data.settings.negativePrompt);
        if (data.settings.voice) setSelectedVoice(data.settings.voice);
        if (data.settings.speed) setSpeechSpeed(data.settings.speed);
        if (data.settings.aspectRatio) setAspectRatio(data.settings.aspectRatio);
        if (data.settings.effectIntensity) setEffectIntensity(data.settings.effectIntensity);
        if (data.settings.watermarkText) setWatermarkText(data.settings.watermarkText);
        // Cannot restore file blobs (music, logo) from JSON, user must re-upload if needed
        // But we can keep URL references if we implemented file upload for assets. 
        // For V1 we just skip blobs.
      }

      // Restore Storyboard & Images
      if (data.storyboard_data) {
        setStoryboard(data.storyboard_data);
        setCurrentStep(3); // Jump to visuals
        if (data.generated_images && data.generated_images.length > 0) {
          setGeneratedImages(data.generated_images);
          setProgress(50);
          setCurrentStep(4); // Jump to voiceover if images exist
        }
      }

      // We force a clean history state to avoid reloading on refresh
      window.history.replaceState({}, "Visioncraft AI");
    } else if (location.state?.script) {
      setScript(location.state.script);
      window.history.replaceState({}, "Visioncraft AI");
    }
  }, [location.state]);

  const [language, setLanguage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [desiredSceneCount, setDesiredSceneCount] = useState(6);
  const [targetTotalDuration, setTargetTotalDuration] = useState(60);

  // New Advanced Settings State
  const [artStyle, setArtStyle] = useState('');
  const [styleRefDescription, setStyleRefDescription] = useState('');
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('en-US-F');
  const [speechSpeed, setSpeechSpeed] = useState([1.0]);
  const [speechPitch, setSpeechPitch] = useState([1.0]); // New Pitch State
  const [speechEmotion, setSpeechEmotion] = useState('neutral'); // New Emotion State
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true); // Toggle voiceover on/off
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [backgroundMusicFile, setBackgroundMusicFile] = useState(null);
  const [musicVolume, setMusicVolume] = useState([0.1]);
  const [watermarkLogo, setWatermarkLogo] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [effectIntensity, setEffectIntensity] = useState([1.0]);
  const [autoDucking, setAutoDucking] = useState(true);
  const [backgroundAudioType, setBackgroundAudioType] = useState('music'); // 'music' or 'voiceover'

  // Image to Video State
  const [inputMode, setInputMode] = useState('text');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [animationPrompt, setAnimationPrompt] = useState('');
  const [animationEffect, setAnimationEffect] = useState('zoom-in');
  const [animationModel, setAnimationModel] = useState('auto');
  const [animationDuration, setAnimationDuration] = useState(5);
  const [animationEasing, setAnimationEasing] = useState('linear');
  const [imageFilters, setImageFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, vignette: false, tiltX: 0, tiltY: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Personal');
  const [newTemplateTags, setNewTemplateTags] = useState('');
  const [showTemplateSaveDialog, setShowTemplateSaveDialog] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('all'); // 'all', 'system', 'my'

  // NEW: Global Filters (Color Grading)
  const [globalFilter, setGlobalFilter] = useState('none');

  // NEW: Scene Variants (Branching Story)
  const [sceneVariants, setSceneVariants] = useState({}); // { sceneIndex: [variant1, variant2, variant3] }
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [currentVariantScene, setCurrentVariantScene] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({}); // { sceneIndex: variantIndexInModal }

  // NEW: Timeline Audio Tracks
  const [audioTracks, setAudioTracks] = useState([]); // [{ name: "BG Music", type: "music", file: null, volume: 1.0, ducking: true, fadeIn: 0, fadeOut: 0 }]
  const [voiceoverVolume, setVoiceoverVolume] = useState(1.0);

  // NEW: Image Cache for Performance
  const [imageCache, setImageCache] = useState({});

  // NEW: AI Style Transfer
  const [showStyleTransferModal, setShowStyleTransferModal] = useState(false);
  const [styleTransferMode, setStyleTransferMode] = useState('preset'); // 'preset' or 'custom'
  const [selectedStylePreset, setSelectedStylePreset] = useState('custom');
  const [customStyleImage, setCustomStyleImage] = useState(null);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);

  // Audio Editing State
  const [editingAudioTrackIndex, setEditingAudioTrackIndex] = useState(null);
  const [showAdvancedAudioEditor, setShowAdvancedAudioEditor] = useState(false);

  // AI Scene Motion State
  const [storyboardMotion, setStoryboardMotion] = useState('static'); // 'static' | 'ai-video'

  // Narrative Branching State
  const [showNarrativeBranching, setShowNarrativeBranching] = useState(false);
  const [branchingSceneIndex, setBranchingSceneIndex] = useState(null);
  const [showAdvancedStoryboard, setShowAdvancedStoryboard] = useState(false);
  const [advStoryboardIdx, setAdvStoryboardIdx] = useState(null);

  // Video Editor State
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  // Load persisted model preference
  const [videoModel, setVideoModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('visioncraft_video_model') || 'auto';
    }
    return 'auto';
  });

  // Persist model selection
  useEffect(() => {
    if (videoModel) localStorage.setItem('visioncraft_video_model', videoModel);
  }, [videoModel]);

  const [videoFrames, setVideoFrames] = useState(24);
  const [videoGuidance, setVideoGuidance] = useState(12.0);
  const [videoMotionBucket, setVideoMotionBucket] = useState(127); // 1-255 for SVD

  // NEW: Motion Interpolation & Consistency
  const [motionInterpolation, setMotionInterpolation] = useState('none'); // 'none', 'rife', 'film'
  const [sceneConsistency, setSceneConsistency] = useState(true); // Default true for better results
  const [transitionIntensity, setTransitionIntensity] = useState(1.0); // 0.5 - 2.0
  const [renderSpeed, setRenderSpeed] = useState(1.0);
  const [pacingProfile, setPacingProfile] = useState('storytelling'); // 'storytelling', 'action', 'cinematic', 'documentary', 'balanced'

  // AI Audio Generation State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioGenerator, setShowAudioGenerator] = useState(false);
  const [audioGeneratorPrompt, setAudioGeneratorPrompt] = useState("");
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [showNativeVoice, setShowNativeVoice] = useState(false);
  const [ttsMode, setTtsMode] = useState('integrated');
  const [captureNativeTts, setCaptureNativeTts] = useState(false);
  const [nativeVoiceName, setNativeVoiceName] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showMicRecorder, setShowMicRecorder] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportSettings, setExportSettings] = useState({ resolution: '1080p', format: 'mp4' });
  const [showAudioMixer, setShowAudioMixer] = useState(false);
  const [showSmartSFX, setShowSmartSFX] = useState(false);
  const [showAdvancedSceneEditor, setShowAdvancedSceneEditor] = useState(false);const [showScriptAnalyzer, setShowScriptAnalyzer] = useState(false);
  const [dialogueMode, setDialogueMode] = useState('adaptive');

  const [subtitleSettings, setSubtitleSettings] = useState({ enabled: true, fontFamily: 'Arial', fontSize: 32, textColor: '#FFFFFF', activeWordColor: '#FFFF00', backgroundColor: 'rgba(0, 0, 0, 0.7)', animation: 'highlight' });
  const [showSubtitleManager, setShowSubtitleManager] = useState(false);
  const [showVoiceClone, setShowVoiceClone] = useState(false);const [showScenePreview, setShowScenePreview] = useState(false);const [previewSceneIndex, setPreviewSceneIndex] = useState(0);const [showFileImporter, setShowFileImporter] = useState(false);const [showStockBrowser, setShowStockBrowser] = useState(false);const [stockBrowserSceneIdx, setStockBrowserSceneIdx] = useState(undefined);const [showScriptTemplates, setShowScriptTemplates] = useState(false);
  const [clonedVoices, setClonedVoices] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity: 0.75,
    style: 0.0,
    speed: 1.0,
    pitch: 1.0,
    voiceId: null,
    emotional_style: 'neutral',
    speaking_style: 'narrative'
  });

  // Onboarding State
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStartStep, setTourStartStep] = useState(0);

  const openHelp = (stepIndex) => {
    setTourStartStep(stepIndex);
    setIsTourOpen(true);
  };

  // NEW: Check Backend Capabilities (e.g. is Stability Key set?)
  const { data: capabilities } = useQuery({
    queryKey: ['capabilities'],
    queryFn: async () => {
      const res = await base44.functions.invoke('checkCapabilities');
      return res.data || {};
    }
  });

  // Fetch templates
  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['videoTemplates'],
    queryFn: () => base44.entities.VideoTemplate.list()
  });

  // Fetch current user for template ownership check
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const getIcon = (iconName) => {
    const icons = { Briefcase, Smartphone, Heart, BookOpen, Box: Package, Plane, Tag };
    return icons[iconName] || LayoutTemplate;
  };

  const handleAnalyzeStyle = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsAnalyzingStyle(true);

      // 1. Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
      if (!uploadRes || !uploadRes.file_url) throw new Error("Failed to upload style image");

      // 2. Analyze style
      const response = await base44.functions.invoke('analyzeStyle', { imageUrl: uploadRes.file_url });

      if (response.data && response.data.styleDescription) {
        setStyleRefDescription(response.data.styleDescription);
      } else {
        throw new Error("Failed to extract style");
      }

    } catch (error) {
      console.error("Style analysis failed:", error);
      setError("Failed to analyze style image.");
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert(t('error_template_name_required') || "Template name is required");
      return;
    }

    setIsSavingTemplate(true);
    try {
      const tagsArray = newTemplateTags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);

      const newTemplate = {
        name: newTemplateName,
        description: `Custom template created on ${new Date().toLocaleDateString()}`,
        category: newTemplateCategory,
        tags: tagsArray,
        icon_name: 'Tag', // Default icon for custom templates
        is_system: false,
        system_prompt_addendum: `
                    Style: Custom User Style
                    Art Style: ${artStyle || 'Default'}
                    Negative Prompt: ${negativePrompt || 'None'}
                    Voice: ${selectedVoice}
                    Speed: ${speechSpeed[0]}
                    Effect Intensity: ${effectIntensity[0]}
                `
      };

      await base44.entities.VideoTemplate.create(newTemplate);
      await refetchTemplates();
      setShowTemplateSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateTags('');
      // Optional: Select the new template
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (templateFilter === 'all') return true;
    // Assume undefined is_system means it's likely a system template from before migration, 
    // or check ownership if we had created_by.
    // For now: is_system === true OR undefined => System. is_system === false => User.
    const isSystem = t.is_system !== false;
    if (templateFilter === 'system') return isSystem;
    if (templateFilter === 'my') return !isSystem && t.created_by === currentUser?.email;
    return true;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [storyboard, setStoryboard] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const bgMusicInputRef = useRef(null);
  const audioContextRef = useRef(null); // Keep AudioContext reference to persist user gesture
  const [audioData, setAudioData] = useState([]);
  const [generatedVideoBlob, setGeneratedVideoBlob] = useState(null);
  const [voiceovers, setVoiceovers] = useState([]);

  // Undo/Redo History State (must be after state declarations)
  const historyRef = useRef({ past: [], future: [] });
  const MAX_HISTORY = 30;

  // Save state to history
  const saveToHistory = useCallback(() => {
    const currentState = {
      script,
      generatedImages: JSON.parse(JSON.stringify(generatedImages)),
      audioTracks: JSON.parse(JSON.stringify(audioTracks.map((t) => ({ ...t, file: null })))),
      storyboard: storyboard ? JSON.parse(JSON.stringify(storyboard)) : null
    };
    historyRef.current.past.push(currentState);
    if (historyRef.current.past.length > MAX_HISTORY) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, [script, generatedImages, audioTracks, storyboard]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return false;

    const currentState = {
      script,
      generatedImages: JSON.parse(JSON.stringify(generatedImages)),
      audioTracks: JSON.parse(JSON.stringify(audioTracks.map((t) => ({ ...t, file: null })))),
      storyboard: storyboard ? JSON.parse(JSON.stringify(storyboard)) : null
    };
    historyRef.current.future.unshift(currentState);

    const previous = historyRef.current.past.pop();
    setScript(previous.script);
    setGeneratedImages(previous.generatedImages);
    setStoryboard(previous.storyboard);

    return true;
  }, [script, generatedImages, audioTracks, storyboard]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return false;

    const currentState = {
      script,
      generatedImages: JSON.parse(JSON.stringify(generatedImages)),
      audioTracks: JSON.parse(JSON.stringify(audioTracks.map((t) => ({ ...t, file: null })))),
      storyboard: storyboard ? JSON.parse(JSON.stringify(storyboard)) : null
    };
    historyRef.current.past.push(currentState);

    const next = historyRef.current.future.shift();
    setScript(next.script);
    setGeneratedImages(next.generatedImages);
    setStoryboard(next.storyboard);

    return true;
  }, [script, generatedImages, audioTracks, storyboard]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // User Limit Logic
  const { data: userData, refetch: refetchUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userMe'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const checkUsageLimit = async () => {
    // DEMO MODE LIMITATION
    if (!userData) {
      const demoCount = parseInt(localStorage.getItem('visioncraft_demo_count') || '0');
      const DEMO_LIMIT = 1; // 1 free video for demo users

      if (demoCount >= DEMO_LIMIT) {
        return 'demo_limit';
      }
      return true;
    }

    // AUTHENTICATED USER LIMIT
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const lastReset = userData.last_reset_date ? userData.last_reset_date.slice(0, 7) : null;

    if (lastReset !== currentMonth) {
      await base44.auth.updateMe({
        monthly_video_count: 0,
        last_reset_date: now.toISOString()
      });
      userData.monthly_video_count = 0;
    }

    const limit = userData.subscription_plan === 'pro' ? 50 : 3;

    if (userData.monthly_video_count >= limit) {
      return 'user_limit';
    }
    return true;
  };

  const incrementUsage = async () => {
    if (!userData) {
      const demoCount = parseInt(localStorage.getItem('visioncraft_demo_count') || '0');
      localStorage.setItem('visioncraft_demo_count', demoCount + 1);
      return;
    }

    const newCount = (userData.monthly_video_count || 0) + 1;
    await base44.auth.updateMe({
      monthly_video_count: newCount
    });
    refetchUser();
  };

  const handleVoiceCloned = (clonedVoiceData) => {
    const newClonedVoice = {
      id: `cloned_${clonedVoiceData.id}`,
      locale: language || 'en',
      name: `${clonedVoiceData.name} (Clonée)`,
      gender: 'Custom',
      type: 'Cloned',
      lang: language || 'en',
      pitch: 1.0,
      speedAdj: 1.0,
      voiceId: clonedVoiceData.id,
      settings: clonedVoiceData.settings
    };
    setClonedVoices([...clonedVoices, newClonedVoice]);
    toast.success(`Voix "${clonedVoiceData.name}" ajoutée aux options disponibles`);
  };

  const VOICES = [...clonedVoices, ...(typeof VOICES_BASE !== 'undefined' ? VOICES_BASE : [])];
  // EMOTION_PRESETS imported from components/effects/SlideEffects

  const steps = [
  { number: 1, title: t('step_1'), icon: Languages },
  { number: 2, title: t('step_2'), icon: Wand2 },
  { number: 3, title: t('step_3'), icon: ImageIcon },
  { number: 4, title: t('step_4'), icon: Mic },
  { number: 5, title: t('step_5'), icon: Video }];


  const handleScriptUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => setScript(e.target.result);
      reader.readAsText(file);
    }
  };

  const generateScriptImprovement = async (options = {}) => {
    if (!script) return null;
    const { tone = 'cinematic', length = 'maintain', dialogue = 'natural' } = options;
    const improved = await InvokeLLM({ prompt: `Act as a script doctor. Refine: "${script}". Tone:${tone}. Length:${length==='summarize'?'Condense':'maintain'}. Dialogue:${dialogue}. Return ONLY improved text.` });
    return improved ? improved.replace(/^"|"$/g, '') : null;
  };
  const applyScriptImprovement = (s) => { if (s) { setScript(s); toast.success("Script updated!"); playSFX('success'); } };

  // AI Smart Editing: Contextual SFX (Enhanced to open Smart SFX modal)
  const autoGenerateContextualSFX = async () => {
    if (generatedImages.length === 0) {
      toast.error("Generate scenes first before adding SFX");
      return;
    }

    // Open the Smart SFX Generator modal
    setShowSmartSFX(true);
  };

  // Handle adding SFX tracks from Smart Generator
  const handleAddSFXTracks = (tracks) => {
    setAudioTracks([...audioTracks, ...tracks]);
    toast.success(`Added ${tracks.length} SFX tracks to timeline!`);
  };

  // PACING_PROFILES imported from components/effects/SlideEffects

  const autoPaceScenes = async () => {
    if (generatedImages.length === 0) return;
    setIsProcessing(true); const profile = PACING_PROFILES[pacingProfile] || PACING_PROFILES.balanced; setCurrentTask(`AI Editor analyzing pacing (${profile.name})...`);
    try {
      const screenplay = generatedImages.map((s, i) => `Scene ${i+1}: [Mood:${s.mood||'neutral'}] Visual:${s.description} Dialogue:"${s.dialogue||''}" Words:${(s.dialogue||'').split(/\s+/).filter(w=>w).length}`).join('\n---\n');
      const response = await InvokeLLM({ prompt: `Expert Film Editor. Analyze storyboard for "${profile.name}" pacing. Rules: base=${profile.rules.baseDuration}s, range=${profile.rules.minDuration}-${profile.rules.maxDuration}s. Screenplay:\n${screenplay}\nReturn JSON: {scenes:[{duration,emotion_score,action_score,suggested_effect,suggested_camera,transition_to_next,transition_duration,pacing_note}],overall_rhythm,climax_scene}`, response_json_schema: { type: "object", properties: { scenes: { type: "array", items: { type: "object", properties: { duration:{type:"number"},emotion_score:{type:"number"},action_score:{type:"number"},suggested_effect:{type:"string"},suggested_camera:{type:"string"},transition_to_next:{type:"string"},transition_duration:{type:"number"},pacing_note:{type:"string"} } } }, overall_rhythm:{type:"string"}, climax_scene:{type:"number"} } } });
      if (response?.scenes?.length === generatedImages.length) { setGeneratedImages(generatedImages.map((scene, idx) => { const a = response.scenes[idx]; return { ...scene, duration: Math.min(Math.max(a.duration, profile.rules.minDuration), profile.rules.maxDuration), effect: a.suggested_effect || scene.effect, transition: a.transition_to_next || scene.transition || 'fade', transitionDuration: a.transition_duration || 0.8, _pacingNote: a.pacing_note, _emotionScore: a.emotion_score, _actionScore: a.action_score }; })); toast.success(`${profile.icon} Pacing "${profile.name}" appliqué !${response.climax_scene ? ` Climax: Scène ${response.climax_scene}.` : ''}`, { duration: 4000 }); playSFX('success'); } else throw new Error("Invalid pacing data");
    } catch (err) {
      console.error("Auto pacing failed:", err); toast.info("Utilisation du pacing heuristique...");
      const p = PACING_PROFILES[pacingProfile] || PACING_PROFILES.balanced;
      setGeneratedImages(generatedImages.map((scene, idx) => { const wc = (scene.dialogue||"").split(/\s+/).filter(w=>w).length; const desc = (scene.description||"").toLowerCase(); const mood = (scene.mood||"").toLowerCase(); let dur = Math.max(p.rules.baseDuration, wc * p.rules.dialogueMultiplier); if (desc.includes("action")||desc.includes("fight")) dur *= p.rules.actionMultiplier; if (mood.includes("emotional")||mood.includes("dramatic")) dur *= p.rules.emotionalMultiplier; if (desc.includes("landscape")||desc.includes("establishing")) dur *= p.rules.landscapeMultiplier; dur = Math.min(Math.max(dur, p.rules.minDuration), p.rules.maxDuration); return { ...scene, duration: Math.round(dur*2)/2, _suggestedCamera: p.rules.cameraMovements[idx % p.rules.cameraMovements.length] }; }));
      toast.success(`${p.icon} Pacing heuristique appliqué`);
    } finally { setIsProcessing(false); setCurrentTask(''); }
  };

  const autoAssignTransitions = async () => {
    if (generatedImages.length === 0) return;
    setIsProcessing(true);setCurrentTask("AI Director is designing transitions...");
    try {
      const sceneSummaries = generatedImages.map((s, i) => ({ index: i, description: s.description, mood: s.mood }));
      const response = await InvokeLLM({ prompt: `Act as a Film Editor. Analyze scenes and assign transitions. Available: fade,wipe,slide,iris,zoom,glitch. Intensity: ${transitionIntensity}. Scenes: ${JSON.stringify(sceneSummaries)}. Return JSON with "transitions" array: [{sceneIndex,type,duration,params:{wipeAngle?,irisX?,irisY?}}]`, response_json_schema: { type: "object", properties: { transitions: { type: "array", items: { type: "object", properties: { sceneIndex: { type: "number" }, type: { type: "string" }, duration: { type: "number" }, params: { type: "object" } } } } } } });
      if (response?.transitions) { const ni = [...generatedImages]; response.transitions.forEach(t => { if (ni[t.sceneIndex]) ni[t.sceneIndex] = { ...ni[t.sceneIndex], transition: t.type, transitionDuration: t.duration, wipeAngle: t.params?.wipeAngle, irisX: t.params?.irisX, irisY: t.params?.irisY }; }); setGeneratedImages(ni); toast.success("AI Transitions Applied!"); playSFX('success'); } else throw new Error("Invalid");
    } catch (err) {
      console.error("Auto transitions failed:", err); toast("Smart transitions failed, using standard rules.");
      setGeneratedImages(generatedImages.map((scene, idx) => { if (idx === generatedImages.length - 1) return scene; let transition = 'fade'; let duration = 1.0 / transitionIntensity; const desc = (scene.description + " " + (scene.mood || "")).toLowerCase(); if (desc.includes("action") || desc.includes("fast")) { transition = 'wipe'; duration = 0.5 / transitionIntensity; } else if (desc.includes("tech") || desc.includes("glitch")) { transition = 'glitch'; duration = 0.3 / transitionIntensity; } else if (desc.includes("dream")) { transition = 'fade'; duration = 1.5 / transitionIntensity; } return { ...scene, transition, transitionDuration: Math.max(0.2, duration) }; }));
    } finally { setIsProcessing(false); setCurrentTask(''); }
  };

  const handleGenerateAiMusic = async () => {
    setIsGeneratingAudio(true);
    const toastId = toast.loading("Synthesizing native music...");
    try {
      // Use Native Procedural Audio (Browser-based)
      const wavBlob = await generateProceduralAudio('music', 15);
      const file = new File([wavBlob], `native_music_${Date.now()}.wav`, { type: "audio/wav" });
      setBackgroundMusicFile(file);
      toast.success("Native Music Generated!", { id: toastId });
    } catch (error) {
      console.error("Native Music generation failed:", error);
      toast.error(`Failed to generate music: ${error.message}`, { id: toastId });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedImageFile(file);

    try {
      setIsAnalyzingImage(true);
      setCurrentTask(t('analyzing_image'));

      // 1. Upload file to storage
      const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
      if (!uploadRes || !uploadRes.file_url) {
        throw new Error("Failed to upload image");
      }

      setUploadedImageUrl(uploadRes.file_url);

      // 2. Analyze with LLM
      const languageName = uiLanguage === 'fr' ? 'French' :
      uiLanguage === 'es' ? 'Spanish' :
      uiLanguage === 'ar' ? 'Arabic' :
      uiLanguage === 'de' ? 'German' :
      uiLanguage === 'it' ? 'Italian' :
      uiLanguage === 'pt' ? 'Portuguese' :
      'English';

      const prompt = `
                Analyze this image and write a creative, engaging video script based on it.
                The script should tell a short story or explain the concept shown in the image.
                Keep it under 60 seconds (about 100-150 words).
                The tone should be cinematic and professional.
                
                CRITICAL: Write the ENTIRE script in ${languageName}. Every word, sentence, and phrase must be in ${languageName}.
            `;

      // Auto-set the voiceover language to match UI if not set
      if (!language) {
        setLanguage(uiLanguage);
      }

      const analysisRes = await InvokeLLM({
        prompt: prompt,
        file_urls: [uploadRes.file_url]
      });

      if (analysisRes) {
        setScript(analysisRes);
        // Switch to text tab to show result
        setInputMode('text');
      }

    } catch (error) {
      console.error("Image analysis failed:", error);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzingImage(false);
      setCurrentTask('');
    }
  };

  // Regenerate ONLY voiceover audio (keep text + visuals) — uses explicit params to avoid stale state
  const handleRegenerateVoiceOnly = async ({ voice, speed, pitch }) => {
    if (!generatedImages.length || generatedImages.every(img => !img.dialogue)) { toast.error("Aucun dialogue."); return; }
    setSelectedVoice(voice); setSpeechSpeed(speed); setSpeechPitch(pitch);
    setIsProcessing(true); setError(''); setProgress(40); setCurrentStep(4); setCurrentTask('Régénération voix off...');
    try { const { regenerateVoiceOnly } = await import('../components/voice/VoiceOnlyRegenerator'); const { updatedImages, newVoiceovers } = await regenerateVoiceOnly({ generatedImages, voiceParams: { voice, speed, pitch }, voiceSettings, voices: VOICES, language, uiLanguage, generateSpeechAudio, onProgress: setProgress, onTask: setCurrentTask }); setGeneratedImages(updatedImages); setVoiceovers(newVoiceovers); setAudioData(newVoiceovers); setProgress(80); setCurrentTask('Réassemblage vidéo...'); await assembleVideo(updatedImages, newVoiceovers); toast.success("Voix off régénérée !"); } catch (err) { console.error(err); setError(err.message); setIsProcessing(false); setCurrentStep(5); setProgress(videoUrl?100:50); }
  };
  // Regenerate dialogue text + voiceover (keep visuals)
  const handleRegenerateDialogueOnly = async () => {
    if (!script.trim() || (!language && ttsMode !== 'native')) {setError(t('error_script_lang'));return;}
    setIsProcessing(true);setError('');setProgress(10);setCurrentStep(4);setCurrentTask('Régénération du dialogue...');
    try { const { regenerateDialogueData } = await import('../components/StoryboardGenerator'); const res = await regenerateDialogueData({ script, sceneCount: generatedImages.length, uiLanguage, dialogueMode }); if (res?.scenes) { const ni = generatedImages.map((img, i) => ({ ...img, dialogue: res.scenes[i]?.dialogue || img.dialogue, duration: res.scenes[i]?.duration || img.duration })); setGeneratedImages(ni); if (storyboard) setStoryboard({ ...storyboard, scenes: (storyboard.scenes || []).map((s, i) => ({ ...s, dialogue: res.scenes[i]?.dialogue || s.dialogue, duration: res.scenes[i]?.duration || s.duration })) }); setProgress(40);setCurrentTask('Régénération voix off...'); await createVoiceover({ scenes: ni.map((img) => ({ scene_number: img.scene_number, dialogue: img.dialogue || "", duration: img.duration, visual_description: img.description })) }, ni); toast.success("Dialogue régénéré !"); } } catch (err) {console.error(err);setError(err.message);setIsProcessing(false);setCurrentStep(5);setProgress(videoUrl?100:50);}
  };

  const generateStoryboard = async () => {
    if (!script.trim() || (!voiceoverEnabled ? false : !language && ttsMode !== 'native')) {setError(t('error_script_lang'));return;}
    if (generatedImages.length > 0 && generatedImages.some((img) => img.url)) {
      if (window.confirm("Des visuels existent déjà.\n\n• OK = Conserver visuels, régénérer dialogue/voix\n• Annuler = Tout régénérer")) {await handleRegenerateDialogueOnly();return;}
    }
    try {base44.entities.ActivityLog.create({ action: 'generate_video_start', details: `Started generating video`, metadata: { script_length: script.length } });} catch (e) {}
    const limitStatus = await checkUsageLimit();
    if (limitStatus === 'demo_limit') {if (window.confirm("Demo Limit Reached\n\nSign up to create more!")) base44.auth.redirectToLogin();return;}
    if (limitStatus === 'user_limit') {if (window.confirm(`${t('limit_reached_title')}\n${t('limit_reached_desc')}`)) window.location.href = '/Pricing';return;}
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    try {if (!audioContextRef.current || audioContextRef.current.state === 'closed') audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();const o = audioContextRef.current.createOscillator();const g = audioContextRef.current.createGain();g.gain.value = 0.00001;o.connect(g);g.connect(audioContextRef.current.destination);o.start();} catch (e) {}
    setIsProcessing(true);setError('');setCurrentStep(2);setProgress(10);setCurrentTask('Analyzing script and creating storyboard...');

    try {
      let styleInstructions = "";
      if (selectedTemplate) {
        styleInstructions = selectedTemplate.system_prompt_addendum;
      }

      const languageName = uiLanguage === 'fr' ? 'French' :
      uiLanguage === 'es' ? 'Spanish' :
      uiLanguage === 'ar' ? 'Arabic' :
      uiLanguage === 'de' ? 'German' :
      uiLanguage === 'it' ? 'Italian' :
      uiLanguage === 'pt' ? 'Portuguese' :
      'English';

      const { generateStoryboardData } = await import('../components/StoryboardGenerator');
      const storyboardResult = await generateStoryboardData({
        script, language, uiLanguage, selectedTemplate, artStyle, negativePrompt,
        styleRefDescription, desiredSceneCount, targetTotalDuration, dialogueMode
      });

      if (storyboardResult && storyboardResult.scenes && storyboardResult.scenes.length > 0) {
        setStoryboard(storyboardResult);
        setProgress(25);
        setCurrentStep(3);
        await generateImages(storyboardResult);
      } else {
        throw new Error("Failed to generate a valid storyboard.");
      }

    } catch (err) {
      console.error('Storyboard generation failed, using offline fallback:', err);
      try {
        const { generateOfflineStoryboard } = await import('../components/StoryboardGenerator');
        const fb = generateOfflineStoryboard(script, desiredSceneCount, targetTotalDuration);
        setStoryboard(fb);setProgress(25);setCurrentStep(3);
        await generateImages(fb);
      } catch (e2) {
        setError(err.message || 'Failed to process script. Please try again.');
        setIsProcessing(false);setCurrentStep(1);setProgress(0);
      }
    }
  };

  const generateAiVideoFromImage = async (imageUrl, prompt) => {const { generateAiVideoFromImage: g } = await import('../components/rendering/VideoAssembler');return g(imageUrl, prompt, animationModel);};

  const generateImages = async (storyboardData) => {
    const { generateImagesLogic } = await import('../components/rendering/generateImagesLogic');
    await generateImagesLogic({ storyboardData, existingImages: generatedImages, setCurrentTask, setProgress, artStyle, styleRefDescription, negativePrompt, uploadedImageUrl, storyboardMotion, sceneConsistency, videoGuidance, videoFrames, videoModel, videoMotionBucket, motionInterpolation, SLIDE_EFFECTS, setGeneratedImages, setSceneVariants, setCurrentStep, createVoiceover, generateAiVideoFromImage });
  };

  // NEW: Generate Narrative Branching Options
  const handleGenerateNarrative = async (sceneDescription) => {
    const prompt = `
            Analyze this scene: "${sceneDescription}"
            Generate 3 distinct narrative branches/continuations for this scene.
            Return JSON: [{ "title": "Branch Name", "description": "New plot direction..." }]
        `;
    try {
      const res = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            branches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });
      return res.branches;
    } catch (e) {
      console.error("Narrative gen failed", e);
      return [];
    }
  };

  const handleApplyNarrative = (narrative) => {
    if (currentVariantScene === null) return;

    const newImages = [...generatedImages];
    newImages[currentVariantScene] = {
      ...newImages[currentVariantScene],
      description: narrative.description,
      // Clear image to force regeneration with new narrative
      url: null,
      videoUrl: null
    };
    setGeneratedImages(newImages);
    toast.success(`Applied Branch: ${narrative.title}. Please regenerate the visual.`);

    // Also update the storyboard text if possible
    if (storyboard && storyboard.scenes && storyboard.scenes[currentVariantScene]) {
      const newStoryboard = { ...storyboard };
      newStoryboard.scenes[currentVariantScene].visual_description = narrative.description;
      setStoryboard(newStoryboard);
    }
  };

  // NEW: Generate Scene Variants (Branching Story)
  const generateSceneVariants = async (scene, sceneIndex, basePrompt, customPrompt = '') => {
    const variantUrls = [];
    try {
      // Generate 2 variants with slight prompt variations
      for (let v = 0; v < 2; v++) {
        const defaultVariation = v === 0 ? 'warmer tones and closer framing' : 'cooler tones and wider perspective';
        const variation = customPrompt || defaultVariation;
        const variantPrompt = `${basePrompt}\n\nVariation ${v + 1}: ${variation}`;
        const result = await GenerateImage({ prompt: variantPrompt });
        if (result && result.url) {
          variantUrls.push(result.url);
        }
        await new Promise((r) => setTimeout(r, 500)); // Small delay
      }
    } catch (err) {
      console.error('Variant generation failed:', err);
    }
    return variantUrls;
  };

  // Regenerate specific variant with custom prompt
  const handleRegenerateVariant = async (sceneIndex, variantIndex, customPrompt) => {
    if (currentVariantScene === null) return;

    const scene = generatedImages[currentVariantScene];
    const imagePrompt = `
            Create a high-quality, cinematic image for this scene:
            Scene: ${scene.description}
            Style: Professional cinematography, detailed and realistic, high resolution.
            ${artStyle ? `Artistic Style: ${artStyle}.` : ''}
            ${styleRefDescription ? `VISUAL STYLE REFERENCE: ${styleRefDescription}` : ''}
            ${negativePrompt ? `Avoid: ${negativePrompt}.` : ''}
            ${customPrompt ? `\n\nCustom Direction: ${customPrompt}` : ''}
        `;

    try {
      const result = await GenerateImage({ prompt: imagePrompt });
      if (result && result.url) {
        const updatedVariants = [...(sceneVariants[currentVariantScene] || [])];
        updatedVariants[variantIndex] = { ...scene, url: result.url };
        setSceneVariants({
          ...sceneVariants,
          [currentVariantScene]: updatedVariants
        });
      }
    } catch (err) {
      console.error('Failed to regenerate variant:', err);
      alert('Failed to regenerate variant. Please try again.');
    }
  };

  const handleApplyStyleTransfer = async (styleConfig) => {
    const { applyStyleTransfer } = await import('../components/storyboard/StyleTransferHandler');
    await applyStyleTransfer({ styleConfig, generatedImages, storyboardMotion, artStyle, setIsApplyingStyle, setCurrentTask, setProgress, setGeneratedImages, setShowStyleTransferModal, playSFX });
  };

  const createVoiceover = async (storyboardData, images, exportOptions = {}) => {
    if (!voiceoverEnabled) {
      // Skip voiceover — create placeholders but KEEP dialogue text for subtitles
      const emptyVoiceovers = (storyboardData.scenes || []).map((scene, idx) => ({
        scene_number: scene.scene_number,
        dialogue: scene.dialogue || images[idx]?.dialogue || "",
        duration: scene.duration || 5,
        language,
        wordTimings: [],
        audioBlob: null,
        audioUrl: null
      }));
      setVoiceovers(emptyVoiceovers);
      setAudioData(emptyVoiceovers);
      setProgress(75);
      setCurrentStep(5);
      setCurrentTask('Assemblage vidéo sans voix off...');
      await assembleVideo(images, emptyVoiceovers, exportOptions);
      return;
    }
    const { createVoiceoverLogic } = await import('../components/voice/createVoiceoverLogic');
    await createVoiceoverLogic({ storyboardData, images, language, uiLanguage, ttsMode, speechSpeed, speechPitch, nativeVoiceName, selectedVoice, voiceSettings, VOICES, generateSpeechAudio, assembleVideo, setCurrentTask, setProgress, setError, setIsProcessing, setCurrentStep, setVoiceovers, setAudioData, script, exportOptions });
  };

  // Generate speech audio — uses backend TTS for video export, browser TTS for previews
  const generateSpeechAudio = async (text, languageCode, settingsOverride = null) => {
    const currentVoiceSettings = settingsOverride || voiceSettings;
    let voiceIdToUse = currentVoiceSettings.voiceId || selectedVoice;
    const voiceConfig = VOICES.find((v) => v.id === voiceIdToUse);
    if (voiceConfig?.type === 'Cloned' && voiceConfig.voiceId) voiceIdToUse = voiceConfig.voiceId;
    let targetLocale = voiceConfig ? voiceConfig.locale : languageCode;
    const voiceBaseSpeed = voiceConfig ? voiceConfig.speedAdj : 1.0;
    const finalSpeed = settingsOverride ? (settingsOverride.speed || 1.0) * voiceBaseSpeed : speechSpeed[0] * voiceBaseSpeed * (voiceSettings.speed || 1.0);
    const gender = currentVoiceSettings.gender || (voiceConfig ? (voiceConfig.gender || '').toLowerCase() : undefined);
    const isCloned = voiceConfig?.type === 'Cloned';
    console.log(`[TTS] voice: ${voiceIdToUse}, locale: ${targetLocale}, speed: ${finalSpeed}, gender: ${gender}`);
    const response = await base44.functions.invoke('textToSpeech', {
      text, language: targetLocale, gender, voice: 'google_fallback', speed: finalSpeed,
      use_elevenlabs: !!(isCloned || currentVoiceSettings.voiceId && currentVoiceSettings.voiceId !== 'default'),
      voice_id: voiceIdToUse,
      stability: voiceConfig?.settings?.stability || currentVoiceSettings.stability,
      similarity_boost: voiceConfig?.settings?.similarity_boost || currentVoiceSettings.similarity,
      style: voiceConfig?.settings?.style || currentVoiceSettings.style,
      emotion: voiceConfig?.settings?.emotional_style || currentVoiceSettings.emotional_style || 'neutral',
      prefer_hf_bark: false
    });
    if (response.data?.error) throw new Error(response.data.error);
    if (response.data?.audioBase64) {
      const binaryString = window.atob(response.data.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      blob.provider = response.data.provider;
      return blob;
    }
    throw new Error("No audio data received from server");
  };

  const renderImageSceneWithEffects = async (ctx, canvas, img, imageData, duration, voiceData, previousImg = null, fallbackImg = null, visualSpeedMultiplier = 1.0, optsOverride = null) => {
    const opts = optsOverride || {
      effectIntensity: effectIntensity[0], globalFilter, GLOBAL_FILTERS, storyboardMotion, watermarkLogo, watermarkText, subtitleSettings
    };
    return _renderScene(ctx, canvas, img, imageData, duration, voiceData, previousImg, fallbackImg, visualSpeedMultiplier, opts);
  };
  const renderPlaceholderScene = async (ctx, canvas, imageData, duration, voiceData, optsOverride = null) => {
    const opts = (optsOverride && typeof optsOverride === 'object' && !optsOverride.nativeEvent) ? optsOverride : {
      effectIntensity: effectIntensity[0], globalFilter, GLOBAL_FILTERS, storyboardMotion, watermarkLogo, watermarkText, subtitleSettings
    };
    return _renderPlaceholder(ctx, canvas, imageData, duration, voiceData, t('scene'), opts);
  };

  const assembleVideo = async (images, voiceoverData, options = {}) => {
    // Snapshot current subtitle settings to avoid stale closures
    const currentSubtitleSettings = { ...subtitleSettings };
    const currentRenderOpts = {
      effectIntensity: effectIntensity[0], globalFilter, GLOBAL_FILTERS, storyboardMotion, watermarkLogo, watermarkText, subtitleSettings: currentSubtitleSettings
    };
    // Wrap renderImageSceneWithEffects to inject snapshotted opts
    const wrappedRenderScene = async (ctx, canvas, img, imageData, duration, voiceData, previousImg = null, fallbackImg = null, visualSpeedMultiplier = 1.0) => {
      return renderImageSceneWithEffects(ctx, canvas, img, imageData, duration, voiceData, previousImg, fallbackImg, visualSpeedMultiplier, currentRenderOpts);
    };
    // Wrap renderPlaceholderScene to inject snapshotted opts
    const wrappedRenderPlaceholder = async (ctx, canvas, imageData, duration, voiceData) => {
      return renderPlaceholderScene(ctx, canvas, imageData, duration, voiceData, t('scene'), currentRenderOpts);
    };
    const { runAssembleVideo } = await import('../components/rendering/assembleVideoLogic');
    await runAssembleVideo({ images, voiceoverData, options, setCurrentTask, setProgress, setError, setIsProcessing, setGeneratedVideoBlob, setVideoUrl, audioContextRef, aspectRatio, audioTracks, backgroundMusicFile, musicVolume, autoDucking, backgroundAudioType, voiceoverVolume, selectedVoice, speechPitch, speechSpeed, VOICES, renderSpeed, imageCache, renderImageSceneWithEffects: wrappedRenderScene, renderPlaceholderScene: wrappedRenderPlaceholder, incrementUsage, t });
  };

  const handlePreviewVideo = () => { if (videoUrl) setIsVideoPlaying(true); else setError('Video not yet generated.'); };
  const handleAnimateImage = async () => {
    const { animateImage: doAnimate } = await import('../components/ImageAnimator');
    await doAnimate({ uploadedImageFile, uploadedImageUrl, animationModel, animationPrompt, animationEffect, animationEasing, animationDuration, imageFilters, setIsAnimating, setError, setCurrentTask, setProgress, setGeneratedVideoBlob, setVideoUrl, renderImageSceneWithEffects, t });
  };

  const handleDownloadVideo = async () => { try { if (generatedVideoBlob) { const link = document.createElement('a'); link.href = URL.createObjectURL(generatedVideoBlob); const ext = generatedVideoBlob.type.includes('mp4') ? 'mp4' : 'webm'; link.download = `ai-storyboard-${Date.now()}.${ext}`; document.body.appendChild(link); link.click(); setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); URL.revokeObjectURL(link.href); }, 100); } else setError('Video not ready for download.'); } catch (error) { setError('Download failed.'); } };
  const closeVideoPreview = () => setIsVideoPlaying(false);
  const resetApp = () => { setScript(''); setLanguage(''); setSelectedTemplate(null); setCurrentStep(1); setIsProcessing(false); setProgress(0); setCurrentTask(''); setStoryboard(null); setGeneratedImages([]); setAudioData([]); setVoiceovers([]); setGeneratedVideoBlob(null); setError(''); setVideoUrl(''); setIsVideoPlaying(false); setUploadedImageUrl(''); setInputMode('text'); if (fileInputRef.current) fileInputRef.current.value = ''; setBackgroundMusicFile(null); setWatermarkLogo(null); setWatermarkText(''); setEffectIntensity([1.0]); setCurrentProjectId(null); };

  const handleSaveScene = (u) => { import('../components/script/SceneManagement').then(m => m.handleSaveSceneLogic(editingSceneIndex, u, generatedImages, storyboard, setGeneratedImages, setStoryboard, saveToHistory)); };

  const handleAddScene = () => { import('../components/script/SceneManagement').then(m => m.handleAddSceneLogic(generatedImages, storyboard, setGeneratedImages, setStoryboard, saveToHistory)); };
  const handleDeleteScene = (i) => { import('../components/script/SceneManagement').then(m => m.handleDeleteSceneLogic(i, generatedImages, storyboard, voiceovers, setGeneratedImages, setStoryboard, setVoiceovers, saveToHistory)); };

  const handleApplyNarrativeBranch = (bd) => { import('../components/script/SceneManagement').then(m => m.handleApplyNarrativeBranchLogic(bd, generatedImages, storyboard, setGeneratedImages, setStoryboard, artStyle, styleRefDescription, negativePrompt, GenerateImage, userData, base44)); };
  const onDragEnd = (r) => { import('../components/script/SceneManagement').then(m => m.onDragEndLogic(r, generatedImages, voiceovers, storyboard, setGeneratedImages, setVoiceovers, setStoryboard)); };

  const handleAddAudioTrack = () => {
    if (bgMusicInputRef.current) {
      bgMusicInputRef.current.click();
    } else {
      console.error("Background music input ref not found");
      // Fallback
      const elem = document.getElementById('bg-music-upload');
      if (elem) elem.click();
    }
  };

  const handleGenerateAudioTrack = () => {
    setShowAudioGenerator(true);
  };

  const onAudioGenerated = (ad) => {
    const isMu = ad.type === 'music';
    setAudioTracks([...audioTracks, { name: ad.name, type: ad.type, volume: 1.0, ducking: isMu, fadeIn: isMu ? 1.0 : 0, fadeOut: isMu ? 1.0 : 0, file: ad.file }]);
    if (isMu) setBackgroundMusicFile(ad.file);
  };

  const handleUpdateAudioTrack = (index, updatesMaybe, updatesAlt) => {
    const updates = updatesAlt || updatesMaybe || {};
    if (index === 'voiceover') {if (typeof updates.volume === 'number') setVoiceoverVolume(updates.volume);return;}
    if (typeof index === 'number') {const nt = [...audioTracks];if (!nt[index]) return;nt[index] = { ...nt[index], ...updates };setAudioTracks(nt);}
  };
  const handleRemoveAudioTrack = (index) => {const nt = [...audioTracks];nt.splice(index, 1);setAudioTracks(nt);if (!nt.length) setBackgroundMusicFile(null);};
  const totalVideoDuration = generatedImages.reduce((acc, img) => acc + (img.duration || 5), 0);

  const handleRegenerateSceneImage = async (newPrompt) => {
    if (editingSceneIndex === null) return;

    const scene = generatedImages[editingSceneIndex];

    try {
      const imagePrompt = `
                Create a high-quality, cinematic image for this scene:
                Scene: ${newPrompt}
                Style: Professional cinematography, detailed and realistic, high resolution.
                ${artStyle ? `Artistic Style: ${artStyle}.` : ''}
                ${styleRefDescription ? `VISUAL STYLE REFERENCE (STRICTLY FOLLOW): ${styleRefDescription}` : ''}
                ${negativePrompt ? `Avoid: ${negativePrompt}.` : ''}
            `;

      const imageResult = await GenerateImage({ prompt: imagePrompt });

      if (imageResult && imageResult.url) {
        const newImages = [...generatedImages];
        newImages[editingSceneIndex] = {
          ...scene,
          url: imageResult.url,
          description: newPrompt
        };
        setGeneratedImages(newImages);
        // Also update local editing state if the modal is open? 
        // The SceneEditor will receive the new 'scene' prop and update itself.
      }
    } catch (err) {
      console.error("Failed to regenerate scene image:", err);
      alert("Failed to regenerate image. Please try again.");
    }
  };

  const handleRenderWithSettings = async (settings) => {
    setExportSettings(settings);
    if (generatedImages.length === 0) return;
    if (settings.aspectRatio) setAspectRatio(settings.aspectRatio);
    setIsProcessing(true);setCurrentTask('Initializing Render...');
    try {
      const needsVoiceover = !voiceovers?.length || voiceovers.length !== generatedImages.length || (!voiceoverEnabled ? false : voiceovers.some((v) => !v.audioBlob));
      if (needsVoiceover) {
        await createVoiceover({ scenes: generatedImages.map((img) => ({ scene_number: img.scene_number, dialogue: img.dialogue || "", duration: img.duration, visual_description: img.description })) }, generatedImages, settings);
        return; // createVoiceover already calls assembleVideo internally
      }
      await assembleVideo(generatedImages, voiceovers, settings);
    } catch (err) {console.error("Render failed:", err);setError("Render failed: " + err.message);setIsProcessing(false);if (settings._onError) settings._onError(err);}
  };

  const handleUpdateVideo = async () => {
    if (!generatedImages.length) {toast.error("Aucune scène");return;}
    const hasVO = voiceovers?.length === generatedImages.length;
    if (!window.confirm(hasVO ? "Réassembler la vidéo ?" : "Régénérer vidéo complète ?")) return;
    setIsProcessing(true);setProgress(hasVO ? 75 : 50);setCurrentTask(hasVO ? "Réassemblage..." : "Régénération voix off...");
    try {
      if (hasVO) {await assembleVideo(generatedImages, voiceovers);} else
      {await createVoiceover({ scenes: generatedImages.map((img) => ({ scene_number: img.scene_number, dialogue: img.dialogue, duration: img.duration, visual_description: img.description })) }, generatedImages);}
      toast.success("Vidéo mise à jour !");playSFX('success');
    } catch (e) {console.error("Update failed:", e);setIsProcessing(false);setProgress(0);setCurrentTask('');toast.error("Échec: " + e.message);}
  };

  // Auto-sync scene durations with voiceover (now handled via DialogueSyncButton in VideoTimeline)
  const handleAutoSyncDurations = async () => {
    if (!generatedImages.length || !voiceovers.length) {toast.error("Générez d'abord les voix off.");return;}
    setIsSyncing(true);saveToHistory();
    try {
      const suggestions = await suggestSceneDurations(generatedImages, voiceovers);
      setGeneratedImages(generatedImages.map((s, i) => {const sg = suggestions.find((x) => x.sceneIndex === i);return sg?.suggestedDuration ? { ...s, duration: sg.suggestedDuration } : s;}));
      toast.success("Durées synchronisées !");playSFX('success');
    } catch (e) {toast.error("Sync failed: " + e.message);} finally {setIsSyncing(false);}
  };

  const handleMicRecordingSave = (rd) => {
    saveToHistory();
    setAudioTracks([...audioTracks, { name: rd.name, type: rd.type, volume: rd.volume, ducking: false, fadeIn: 0.1, fadeOut: 0.3, file: rd.file, duration: rd.duration }]);
    toast.success(`Enregistrement "${rd.name}" ajouté !`);
  };

  const handleClearAllAudio = () => {
    if (!window.confirm("Supprimer TOUTES les pistes audio ?")) return;
    saveToHistory();setVoiceovers([]);setAudioData([]);setAudioTracks([]);setBackgroundMusicFile(null);
    toast.success("Pistes audio effacées.");playSFX('click');
  };

  const handleSaveProject = async (forceNew = false) => {
    const { saveProject } = await import('../components/ProjectSaveHandler');
    await saveProject({ userData, script, language, currentProjectId, setCurrentProjectId, generatedVideoBlob, generatedImages, storyboard, artStyle, selectedVoice, aspectRatio, setIsSaving, forceNew });
  };

  // Loading State to prevent flash
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>);

  }

  // Show Landing Page for unauthenticated users (unless they clicked Try Demo)
  if (!userData && !showDemo) {
    return <LandingPage onTryDemo={() => setShowDemo(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-950 dark:to-gray-900 relative overflow-x-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 dark:opacity-10 pointer-events-none" />
            
            <div className="bg-slate-600 mx-auto px-4 py-8 relative z-10 container max-w-6xl w-full">
                {/* Header */}
                <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">

                    <div className="absolute top-0 right-0 p-4">
                        <Button variant="outline" size="sm" onClick={() => setIsTourOpen(true)} className="gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                            <HelpIcon className="w-4 h-4 text-amber-600" />
                            {t('btn_start_tour')}
                        </Button>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-2xl">
                            <Film className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                        {t('hero_title')}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> {t('hero_subtitle')}</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4">
                        {t('hero_desc')}
                    </p>
                    {userData &&
          <div className="flex justify-center">
                            <Badge variant="outline" className="bg-white/50 border-amber-200 text-amber-700 px-4 py-1 text-sm">
                                {t('usage_status')}: {userData.monthly_video_count || 0} / {userData.subscription_plan === 'pro' ? '50' : '3'}
                            </Badge>
                        </div>
          }
                </motion.div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        {steps.map((step, index) =>
            <div key={step.number} className="flex items-center">
                                <div className={`
                                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500
                                    ${currentStep >= step.number ?
              'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white shadow-lg' :
              'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'}
                                `
              }>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <div className="ml-3 hidden lg:block">
                                    <p className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`
                }>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 &&
              <div className={`
                                        hidden sm:block w-8 h-0.5 ml-4 transition-all duration-500
                                        ${currentStep > step.number ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}
                                    `} />
              }
                            </div>
            )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 w-full">
                    {/* Left Column - Input */}
                    <div className="space-y-6 min-w-0">
                        <Card className="bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-2xl">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                        <Languages className="w-5 h-5 text-amber-500" />
                                        {t('card_script_title')}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiAssistant(true)}
                      className="h-8 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700">

                                            <Bot className="w-4 h-4" />
                                            AI Assistant
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => openHelp(0)} className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                            <HelpIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="text">{t('tab_text')}</TabsTrigger>
                                        <TabsTrigger value="image">{t('tab_image')}</TabsTrigger>
                                        <TabsTrigger value="tts"><Mic className="w-3 h-3 mr-1" />Voix off</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="text" className="mt-0">
                                        <ScriptTextTab
                                            script={script}
                                            setScript={setScript}
                                            language={language}
                                            setLanguage={setLanguage}
                                            uiLanguage={uiLanguage}
                                            isProcessing={isProcessing}
                                            fileInputRef={fileInputRef}
                                            setShowFileImporter={setShowFileImporter}
                                            setShowScriptTemplates={setShowScriptTemplates}
                                            setIsProcessing={setIsProcessing}
                                            generateScriptImprovement={generateScriptImprovement}
                                            applyScriptImprovement={applyScriptImprovement}
                                            t={t}
                                        />
                                    </TabsContent>

                                    <TabsContent value="image" className="mt-0">
                                        <ImageUploadTab uploadedImageUrl={uploadedImageUrl} isAnalyzingImage={isAnalyzingImage} isAnimating={isAnimating} isProcessing={isProcessing} animationPrompt={animationPrompt} setAnimationPrompt={setAnimationPrompt} animationEffect={animationEffect} setAnimationEffect={setAnimationEffect} animationEasing={animationEasing} setAnimationEasing={setAnimationEasing} animationDuration={animationDuration} setAnimationDuration={setAnimationDuration} animationModel={animationModel} imageFilters={imageFilters} setImageFilters={setImageFilters} handleImageUpload={handleImageUpload} handleAnimateImage={handleAnimateImage} t={t} />
                                    </TabsContent>

                                    <TabsContent value="tts" className="mt-0">
                                        <TextToVoiceTab />
                                    </TabsContent>
                                            </Tabs>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {t('label_style')}
                                        </label>
                                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                            <button
                        onClick={() => setTemplateFilter('all')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${templateFilter === 'all' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>

                                                All
                                            </button>
                                            <button
                        onClick={() => setTemplateFilter('system')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${templateFilter === 'system' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>

                                                System
                                            </button>
                                            <button
                        onClick={() => setTemplateFilter('my')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${templateFilter === 'my' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>

                                                My Templates
                                            </button>
                                        </div>
                                    </div>

                                    {/* Use New Template Gallery */}
                                    <div className="mb-4">
                                        <TemplateGallery
                      templates={templates}
                      selectedTemplate={selectedTemplate}
                      onSelect={setSelectedTemplate}
                      onUseTemplate={(t) => {
                        setSelectedTemplate(t);
                        // Auto-advance or just select
                      }} />

                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                                        {t('label_voice_lang')}
                                    </label>
                                    <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                                        <SelectTrigger className="bg-white/50 border-gray-300 text-slate-900 focus:border-amber-400 focus:ring-amber-400">
                                            <SelectValue placeholder={t('placeholder_voice_lang')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200">
                                            {LANGUAGES.map((lang) =>
                      <SelectItem
                        key={lang.code}
                        value={lang.code}
                        className="text-slate-800 hover:bg-gray-100 focus:bg-gray-100">

                                                    <div className="flex items-center gap-2">
                                                        <span>{lang.flag}</span>
                                                        <span>{lang.name}</span>
                                                    </div>
                                                </SelectItem>
                      )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-slate-500 mt-1">La langue sert à la génération du script et à la voix intégrée. Les voix natives s’appuient sur les voix de votre navigateur et ne nécessitent pas ce choix.</p>
                                </div>

                                {/* Visual Style Selector (New) */}
                                <div className="space-y-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <Wand2 className="w-4 h-4" />
                                            Visual Style & Motion
                                        </h4>
                                        <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplateSaveDialog(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8"
                      disabled={isProcessing}>

                                            <Save className="w-3 h-3 mr-1" />
                                            Save Settings as Template
                                        </Button>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 block">Scene Motion Type</label>
                                        <div className="flex bg-white rounded-md p-1 border border-gray-200 shadow-sm">
                                            <button
                        onClick={() => setStoryboardMotion('static')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-all ${storyboardMotion === 'static' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>

                                                <ImageIcon className="w-3 h-3" />
                                                Static Images (Ken Burns)
                                            </button>
                                            <button
                        onClick={() => setStoryboardMotion('ai-video')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-all ${storyboardMotion === 'ai-video' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>

                                                <Video className="w-3 h-3" />
                                                AI Text-to-Video
                                            </button>
                                        </div>
                                        {storyboardMotion === 'ai-video' &&
                    <div className="mt-3 space-y-3 p-3 bg-purple-50 rounded-md border border-purple-100">
                                                <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-1">
                                                    <div className="flex items-center gap-1">
                                                        <Settings2 className="w-3 h-3" />
                                                        Text-to-Video Settings
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-purple-700">AI Model</Label>
                                                        <Select value={videoModel} onValueChange={setVideoModel}>
                                                            <SelectTrigger className="h-7 text-xs bg-white border-purple-200">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[10px] text-slate-400 px-2 py-1">Standard (Included)</SelectLabel>
                                                                    <SelectItem value="auto">Auto (Best Available)</SelectItem>
                                                                    <SelectItem value="ali-vilab/text-to-video-ms-1.7b">Ali-Vilab (Fastest)</SelectItem>
                                                                    <SelectItem value="damo-vilab/text-to-video-ms-1.7b">ModelScope (Balanced)</SelectItem>
                                                                    <SelectItem value="cerspense/zeroscope_v2_576w">Zeroscope v2 (Higher Res)</SelectItem>
                                                                </SelectGroup>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[10px] text-purple-400 px-2 py-1 mt-1 border-t border-purple-100">Pro (Premium)</SelectLabel>
                                                                    <SelectItem value="stability-svd">Stable Video Diffusion</SelectItem>
                                                                    <SelectItem value="pika-labs" disabled>Pika Labs (Soon)</SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-purple-700">Motion Intensity (SVD)</Label>
                                                        <Slider
                            value={[videoMotionBucket]}
                            onValueChange={([v]) => setVideoMotionBucket(v)}
                            min={1} max={255} step={1}
                            className="py-1"
                            disabled={videoModel !== 'stability-svd'} />

                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-purple-700">Duration / Frames</Label>
                                                        <Select value={String(videoFrames)} onValueChange={(v) => setVideoFrames(parseInt(v))}>
                                                            <SelectTrigger className="h-7 text-xs bg-white border-purple-200">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="16">Short (16 frames, ~2s)</SelectItem>
                                                                <SelectItem value="24">Standard (24 frames, ~3s)</SelectItem>
                                                                <SelectItem value="48">Long (48 frames, ~5s)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-purple-700">
                                                        <span>Creativity (CFG Scale)</span>
                                                        <span>{videoGuidance}</span>
                                                    </div>
                                                    <Slider
                          value={[videoGuidance]}
                          onValueChange={([v]) => setVideoGuidance(v)}
                          min={5} max={20} step={0.5}
                          className="py-1" />

                                                    <p className="text-[9px] text-purple-600/70">
                                                    Higher = stricter adherence to prompt. Lower = more creative freedom.
                                                    </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200/50">
                                                    <div className="space-y-1">
                                                    <Label className="text-[10px] text-purple-700">Motion Interpolation (Smoothing)</Label>
                                                    <Select value={motionInterpolation} onValueChange={setMotionInterpolation}>
                                                        <SelectTrigger className="h-7 text-xs bg-white border-purple-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None (Standard)</SelectItem>
                                                            <SelectItem value="rife">RIFE (Flow)</SelectItem>
                                                            <SelectItem value="film">FILM (Cinematic)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    </div>
                                                    <div className="space-y-1 flex flex-col justify-end">
                                                    <div className="flex items-center gap-2">
                                                        <input
                              type="checkbox"
                              id="scene-consistency"
                              checked={sceneConsistency}
                              onChange={(e) => setSceneConsistency(e.target.checked)}
                              className="h-3 w-3 rounded border-purple-300 text-purple-600 focus:ring-purple-500" />

                                                        <Label htmlFor="scene-consistency" className="text-[10px] text-purple-700 cursor-pointer">
                                                            Scene Consistency (Pass Context)
                                                        </Label>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    
                                                    <div className="pt-2 mt-2 border-t border-purple-200/50">
                                                        <div className="flex justify-between text-[10px] text-purple-700 mb-1">
                                                            <span>Transition Intensity</span>
                                                            <span>{transitionIntensity}x</span>
                                                        </div>
                                                        <Slider
                          value={[transitionIntensity]}
                          onValueChange={([v]) => setTransitionIntensity(v)}
                          min={0.5} max={2.0} step={0.1}
                          className="py-1" />

                                                        <p className="text-[9px] text-purple-600/70">
                                                            Controls speed and impact of auto-generated transitions.
                                                        </p>
                                                    </div>
                                                    </div>
                    }
                                                    </div>

                                    <StyleSelector
                    selectedStyle={selectedStylePreset}
                    onSelect={(styleId) => {
                      setSelectedStylePreset(styleId);
                      if (styleId !== 'custom') {
                        const stylePrompt = getStylePrompt(styleId);
                        if (stylePrompt) setArtStyle(stylePrompt);
                      }
                    }}
                    customStylePrompt={artStyle}
                    onCustomStyleChange={(val) => {
                      setArtStyle(val);
                      if (selectedStylePreset !== 'custom') setSelectedStylePreset('custom');
                    }}
                    onUploadReference={handleAnalyzeStyle}
                    styleRefDescription={styleRefDescription}
                    isAnalyzing={isAnalyzingStyle} />

                                </div>

                                <AdvancedSettingsPanel voiceoverEnabled={voiceoverEnabled} setVoiceoverEnabled={setVoiceoverEnabled} negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} renderSpeed={renderSpeed} setRenderSpeed={setRenderSpeed} ttsMode={ttsMode} setTtsMode={setTtsMode} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} speechSpeed={speechSpeed} speechPitch={speechPitch} VOICES={VOICES} language={language} isProcessing={isProcessing} onTestVoice={async () => { try { const testText = language==='fr'?"Ceci est un test de voix.":language==='es'?"Esta es una prueba de voz.":"This is a voice test."; const vc=VOICES.find(v=>v.id===selectedVoice); if((!vc||vc.type==='Free')&&window.speechSynthesis){const{speakText}=await import('../components/voice/BrowserTTSEngine');await speakText(testText,{gender:vc?(vc.gender||'').toLowerCase():'female',langCode:vc?vc.locale:(language||'en'),speed:speechSpeed[0]*(vc?.speedAdj||1.0),pitch:speechPitch[0]*(vc?.pitch||1.0)});}else{const blob=await generateSpeechAudio(testText,language||'en');if(blob)new Audio(URL.createObjectURL(blob)).play();}}catch(err){console.error(err);alert("Voice Test Failed: "+err.message);}}} onOpenVoiceClone={()=>setShowVoiceClone(true)} onOpenVoiceStudio={()=>setShowVoiceStudio(true)} onOpenNativeVoice={()=>setShowNativeVoice(true)} backgroundMusicFile={backgroundMusicFile} setBackgroundMusicFile={setBackgroundMusicFile} musicVolume={musicVolume} setMusicVolume={setMusicVolume} autoDucking={autoDucking} setAutoDucking={setAutoDucking} backgroundAudioType={backgroundAudioType} setBackgroundAudioType={setBackgroundAudioType} onOpenAudioGenerator={()=>setShowAudioGenerator(true)} subtitlesEnabled={subtitleSettings.enabled} setSubtitlesEnabled={(v) => setSubtitleSettings(s => ({...s, enabled: v}))} watermarkLogo={watermarkLogo} setWatermarkLogo={setWatermarkLogo} watermarkText={watermarkText} setWatermarkText={setWatermarkText} effectIntensity={effectIntensity} setEffectIntensity={setEffectIntensity} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} GLOBAL_FILTERS={GLOBAL_FILTERS} t={t} />

                                {/* Scene count + total duration controls */}
                                <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre de scènes</label>
                                            <div className="flex items-center gap-2">
                                                <Slider value={[desiredSceneCount]} onValueChange={([v]) => setDesiredSceneCount(Math.max(1, Math.min(20, v)))} min={1} max={20} step={1} className="flex-1" />
                                                <Input type="number" min={1} max={20} value={desiredSceneCount} onChange={(e) => setDesiredSceneCount(Math.max(1, Math.min(20, parseInt(e.target.value || '1'))))} className="w-20 h-8" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Durée totale (secondes)</label>
                                            <div className="flex items-center gap-2">
                                                <Slider value={[targetTotalDuration]} onValueChange={([v]) => setTargetTotalDuration(Math.max(10, Math.min(600, v)))} min={10} max={600} step={5} className="flex-1" />
                                                <Input type="number" min={10} max={600} value={targetTotalDuration} onChange={(e) => setTargetTotalDuration(Math.max(10, Math.min(600, parseInt(e.target.value || '10'))))} className="w-24 h-8" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2"><Button onClick={() => setShowScriptAnalyzer(true)} disabled={!script.trim() || script.trim().length < 20 || isProcessing} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-xl shrink-0"><BarChart3 className="w-4 h-4 mr-1" />Analyser</Button><Button id="tour-generate-btn" onClick={generateStoryboard} disabled={!script.trim() || (!voiceoverEnabled ? false : ttsMode !== 'native' && !language) || isProcessing} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50">{isProcessing ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />{t('btn_generating')}</div> : <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" />{t('btn_generate')}<ChevronRight className="w-4 h-4" /></div>}</Button></div>
                                <RegenerateButtons script={script} language={language} ttsMode={ttsMode} isProcessing={isProcessing} generatedImages={generatedImages} onRegenerateDialogue={handleRegenerateDialogueOnly} selectedVoice={selectedVoice} speechSpeed={speechSpeed} speechPitch={speechPitch} voices={VOICES} generateSpeechAudio={generateSpeechAudio} onRegenerateVoiceOnly={handleRegenerateVoiceOnly} dialogueMode={dialogueMode} onDialogueModeChange={setDialogueMode} />
                            </CardContent>
                        </Card>

                        {error &&
            <Alert className="border-red-500 bg-red-500/10">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-600">{error}</AlertDescription>
                            </Alert>
            }
                    </div>

                    {/* Right Column - Output */}
                    <div className="space-y-6 min-w-0">
                        {/* Processing Status */}
                        <AnimatePresence>
                            {isProcessing &&
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}>

                                    <Card className="bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-2xl">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('status_processing')}</h3>
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                        {Math.round(progress)}%
                                                    </Badge>
                                                </div>
                                                <Progress value={progress} className="h-2 bg-gray-200" />
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{currentTask}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
              }
                        </AnimatePresence>

                        {/* Storyboard Preview */}
                        <AnimatePresence>
                            {storyboard &&
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}>

                                    <StoryboardPreviewCard
                      storyboard={storyboard}
                      script={script}
                      generatedImages={generatedImages}
                      dialogueMode={dialogueMode}
                      onDialogueModeChange={setDialogueMode}
                      onUpdateScene={(idx, updates) => {
                        const newStoryboard = { ...storyboard };
                        newStoryboard.scenes[idx] = { ...newStoryboard.scenes[idx], ...updates };
                        setStoryboard(newStoryboard);
                        if (generatedImages.length > idx) {
                          const newImages = [...generatedImages];
                          newImages[idx] = { ...newImages[idx], ...updates };
                          setGeneratedImages(newImages);
                        }
                      }}
                      onBranchNarrative={(idx) => { setBranchingSceneIndex(idx); setShowNarrativeBranching(true); }}
                      onAdvancedStoryboard={(idx) => { setAdvStoryboardIdx(idx); setShowAdvancedStoryboard(true); }}
                      onLoadStoryboard={(saved) => {
                        if (saved.storyboard_data) {
                          setStoryboard(saved.storyboard_data);
                          if (saved.original_script) setScript(saved.original_script);
                          setCurrentStep(3);
                        }
                      }}
                    />
                                </motion.div>
              }
                        </AnimatePresence>

                        {/* Generated Images Preview */}
                        <AnimatePresence>
                            {generatedImages.length > 0 &&
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}>

                                    <Card className="bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-2xl">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                                    <ImageIcon className="w-5 h-5 text-amber-500" />
                                                    {t('card_visuals_title')}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <UndoRedoToolbar
                          canUndo={canUndo}
                          canRedo={canRedo}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          undoCount={historyRef.current.past.length}
                          redoCount={historyRef.current.future.length}
                          showCounts={true} />

                                                    <Button variant="ghost" size="sm" onClick={() => openHelp(2)} className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                                        <HelpIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Advanced Video Timeline Editor */}
                                    <div id="tour-timeline">
                                    <VideoTimeline scenes={generatedImages} onReorder={onDragEnd} onSceneEdit={(i) => {setEditingSceneIndex(i);setShowAdvancedSceneEditor(true);}} onSceneUpdate={(i, u) => {const ni = [...generatedImages];if (ni[i]) {ni[i] = { ...ni[i], ...u };setGeneratedImages(ni);}}} onSceneDelete={handleDeleteScene} onAddScene={handleAddScene} totalDuration={totalVideoDuration} audioTracks={audioTracks} onAddAudioTrack={handleAddAudioTrack} onGenerateAudioTrack={handleGenerateAudioTrack} onUpdateTrack={handleUpdateAudioTrack} onRemoveTrack={handleRemoveAudioTrack} onOpenStyleTransfer={() => setShowStyleTransferModal(true)} onAutoPace={autoPaceScenes} onAutoTransitions={autoAssignTransitions} onAutoSFX={autoGenerateContextualSFX} pacingProfile={pacingProfile} onPacingProfileChange={setPacingProfile} pacingProfiles={PACING_PROFILES} onTrackClick={(i) => setEditingAudioTrackIndex(i)} voiceovers={voiceovers} onDialogueSync={(s) => {saveToHistory();setGeneratedImages(s);}} onOpenStockBrowser={(idx) => {setStockBrowserSceneIdx(idx);setShowStockBrowser(true);}} onToggleSceneLock={(idx) => {const ni = [...generatedImages];if (ni[idx]) {ni[idx] = { ...ni[idx], isLocked: !ni[idx].isLocked };setGeneratedImages(ni);}}} />
                                    </div>
                                    
                                    {/* Hidden fallback input for the add track button mock */}
                                    <input
                      ref={bgMusicInputRef}
                      id="bg-music-upload"
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          const file = e.target.files[0];
                          setAudioTracks([...audioTracks, {
                            name: file.name,
                            type: 'music',
                            volume: 1.0,
                            ducking: true,
                            fadeIn: 1.0,
                            fadeOut: 1.0,
                            file: file
                          }]);
                          // Also set main BG music for backward compatibility
                          setBackgroundMusicFile(file);
                          toast.success(`Track added: ${file.name}`);
                        }
                      }} />


                                                                                {/* AI Style Transfer & Render Buttons */}
                                                                                {generatedImages.length > 0 &&
                    <div className="mt-4 space-y-3">
                                                                                       {/* Primary Actions */}
                                                                                       <div className="grid grid-cols-3 gap-2">
                                                                                           <Button onClick={() => {setPreviewSceneIndex(0);setShowScenePreview(true);}} disabled={isProcessing} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 h-10 text-xs"><Eye className="w-4 h-4 mr-1" />Prévisualiser</Button>
                                                                                           <Button onClick={() => setShowAudioMixer(true)} disabled={isProcessing} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 h-10 text-xs"><MusicIcon className="w-4 h-4 mr-1" />Audio Mixer</Button>
                                                                                           <Button onClick={() => setShowVideoEditor(true)} disabled={isProcessing} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-10 text-xs"><Scissors className="w-4 h-4 mr-1" />Video Editor</Button>
                                                                                           <Button onClick={() => setShowStyleTransferModal(true)} disabled={isProcessing || isApplyingStyle} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 h-10 text-xs"><Palette className="w-4 h-4 mr-1" />Style</Button><SubtitleToggle enabled={subtitleSettings.enabled} onToggle={() => setSubtitleSettings(s => ({...s, enabled: !s.enabled}))} onOpenManager={() => setShowSubtitleManager(true)} />
                                                                                           <ScreenplayExportButton script={script} scenes={generatedImages} voiceovers={voiceovers} audioTracks={audioTracks} projectName={storyboard?.title} settings={{ resolution: exportSettings?.resolution, artStyle }} className="h-10 text-xs" /><Button id="tour-render-btn" onClick={() => {setVideoUrl('');setGeneratedVideoBlob(null);setShowExportModal(true);}} disabled={isProcessing} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg h-10 text-xs"><Video className="w-4 h-4 mr-1" />Export</Button>
                                                                                       </div>

                                                                                       {/* Audio Tools - Collapsible */}
                                                                                       <details className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                                                                                           <summary className="cursor-pointer px-3 py-2 flex items-center justify-between font-medium text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                                                                               <span className="flex items-center gap-2">
                                                                                                   <MusicIcon className="w-4 h-4" />
                                                                                                   Audio Tools
                                                                                               </span>
                                                                                               <ChevronRight className="w-4 h-4 transition-transform" />
                                                                                           </summary>
                                                                                           <div className="p-3 pt-2 grid grid-cols-2 gap-2">
                                                                                               <Button
                            onClick={() => setShowMicRecorder(true)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50">

                                                                                                   <Mic className="w-3 h-3 mr-1.5" />
                                                                                                   Enregistrer
                                                                                               </Button>

                                                                                               <Button
                            onClick={handleAutoSyncDurations}
                            disabled={isProcessing || isSyncing || voiceovers.length === 0}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50">

                                                                                                   {isSyncing ?
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> :

                            <RefreshCw className="w-3 h-3 mr-1.5" />
                            }
                                                                                                   Auto-Sync
                                                                                               </Button>

                                                                                               <Button
                            onClick={() => setShowAdvancedAudioEditor(true)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="border-teal-200 text-teal-700 hover:bg-teal-50">

                                                                                                   <Scissors className="w-3 h-3 mr-1.5" />
                                                                                                   Timeline Editor
                                                                                               </Button>

                                                                                               <Button
                            onClick={handleUpdateVideo}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50">

                                                                                                   <RefreshCw className="w-3 h-3 mr-1.5" />
                                                                                                   Update Video
                                                                                               </Button>

                                                                                               <Button
                            onClick={handleClearAllAudio}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 col-span-2">

                                                                                                   <Trash2 className="w-3 h-3 mr-1.5" />
                                                                                                   Effacer Audio
                                                                                               </Button>
                                                                                           </div>
                                                                                       </details>
                                                                                   </div>
                    }

                                                                                {/* Advanced Scene Editor Modal */}
                                                                                {editingSceneIndex !== null && showAdvancedSceneEditor &&
                    <AdvancedSceneEditor
                      isOpen={showAdvancedSceneEditor}
                      onClose={() => {
                        setShowAdvancedSceneEditor(false);
                        setEditingSceneIndex(null);
                      }}
                      scene={generatedImages[editingSceneIndex]}
                      onSave={(updatedScene) => {
                        handleSaveScene(updatedScene);
                        setShowAdvancedSceneEditor(false);
                      }} />

                    }

                                                                                {/* Basic Scene Editor Modal (Fallback) */}
                                                                                {editingSceneIndex !== null && !showAdvancedSceneEditor &&
                    <SceneEditor
                      isOpen={true}
                      onClose={() => setEditingSceneIndex(null)}
                      scene={generatedImages[editingSceneIndex]}
                      onSave={handleSaveScene}
                      onRegenerate={handleRegenerateSceneImage}
                      effects={SLIDE_EFFECTS} />

                    }
                                            
                                            {/* Scene Variants Modal */}
                                            {currentVariantScene !== null && sceneVariants[currentVariantScene] &&
                    <SceneVariantsModal
                      isOpen={showVariantsModal}
                      onClose={() => {
                        setShowVariantsModal(false);
                        setCurrentVariantScene(null);
                      }}
                      variants={sceneVariants[currentVariantScene]}
                      currentImage={generatedImages[currentVariantScene]}
                      sceneDescription={generatedImages[currentVariantScene]?.description}
                      onGenerateNarrative={() => handleGenerateNarrative(generatedImages[currentVariantScene]?.description)}
                      onApplyNarrative={handleApplyNarrative}
                      selectedVariantIndex={selectedVariants[currentVariantScene] || 0}
                      onSelectVariant={(url, variantIndex) => {
                        const newImages = [...generatedImages];
                        newImages[currentVariantScene] = {
                          ...newImages[currentVariantScene],
                          url: url
                        };
                        setGeneratedImages(newImages);
                        setSelectedVariants({
                          ...selectedVariants,
                          [currentVariantScene]: variantIndex
                        });
                        playSFX('success');
                      }}
                      onRegenerateVariant={(variantIndex, customPrompt) =>
                      handleRegenerateVariant(currentVariantScene, variantIndex, customPrompt)
                      } />

                    }
                                            
                                            {/* AI Style Transfer Modal */}
                                            <StyleTransferModal
                      isOpen={showStyleTransferModal}
                      onClose={() => setShowStyleTransferModal(false)}
                      onApply={handleApplyStyleTransfer}
                      isProcessing={isApplyingStyle} />


                                            {/* Modals moved to global scope */}
                                        </CardContent>
                                    </Card>
                                </motion.div>
              }
                        </AnimatePresence>

                        {/* Final Video */}
                        <AnimatePresence>
                            {videoUrl && <HomeVideoPreviewSection videoUrl={videoUrl} isVideoPlaying={isVideoPlaying} setIsVideoPlaying={setIsVideoPlaying} handlePreviewVideo={handlePreviewVideo} handleDownloadVideo={handleDownloadVideo} handleSaveProject={handleSaveProject} currentProjectId={currentProjectId} isSaving={isSaving} resetApp={resetApp} openHelp={openHelp} />}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Global Modals */}
            <VideoExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onRender={handleRenderWithSettings} isRendering={isProcessing} progress={progress} renderUrl={videoUrl} scenes={generatedImages} voiceovers={voiceovers} />

            {editingAudioTrackIndex !== null &&
      <AudioTrackEditor
        isOpen={editingAudioTrackIndex !== null}
        onClose={() => setEditingAudioTrackIndex(null)}
        track={audioTracks[editingAudioTrackIndex]}
        trackIndex={editingAudioTrackIndex}
        allTracks={audioTracks}
        scenes={generatedImages}
        totalDuration={totalVideoDuration}
        onSave={handleUpdateAudioTrack}
        onDelete={handleRemoveAudioTrack}
        onAddTrack={() => {
          setShowAudioGenerator(true);
          setEditingAudioTrackIndex(null); // Close editor to generate new
        }} />

      }

            <AudioGeneratorModal
        isOpen={showAudioGenerator}
        onClose={() => {
          setShowAudioGenerator(false);
          setAudioGeneratorPrompt("");
        }}
        onGenerate={onAudioGenerated}
        initialPrompt={audioGeneratorPrompt}
        context={script}
        pacingProfile={pacingProfile} />


            <AiCreativeAssistant
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        script={script}
        scenes={generatedImages}
        onApplyScript={(newScript) => {
          setScript(newScript);
          setShowAiAssistant(false);
          toast.success("Script variation applied!");
        }}
        onUpdateScene={(index, updates) => {
          const newImages = [...generatedImages];
          if (newImages[index]) {
            newImages[index] = { ...newImages[index], ...updates };
            setGeneratedImages(newImages);
            toast.success(`Updated Scene ${index + 1}`);
          }
        }}
        onGenerateMusic={(prompt) => {
          setAudioGeneratorPrompt(prompt);
          setShowAiAssistant(false);
          setTimeout(() => setShowAudioGenerator(true), 300);
        }} />


            <VoiceStudio
        isOpen={showVoiceStudio}
        onClose={() => setShowVoiceStudio(false)}
        selectedVoice={selectedVoice}
        onApply={(s) => { setVoiceSettings(s); setSpeechPitch([s.pitch]); setSpeechSpeed([s.speed]); }}
        onPreview={async (tempSettings) => {
          if (!showVoiceStudio) return;
          try {
            const previewText = language === 'fr' ? "Ceci est un aperçu de votre voix modifiée." : "This is a preview of your adjusted voice.";
            const blob = await generateSpeechAudio(previewText, language || 'en', tempSettings);
            if (blob) { const url = URL.createObjectURL(blob); const audio = new Audio(url); audio.play(); }
          } catch (e) { toast.error("Erreur de prévisualisation : " + e.message); }
        }}
        currentVoiceSettings={{ ...voiceSettings, voiceId: selectedVoice }} />


            <NativeVoiceEnhancer
        isOpen={showNativeVoice}
        onClose={() => setShowNativeVoice(false)}
        initialText={script || (generatedImages || []).map((s) => s.dialogue).filter(Boolean).join(" ")}
        defaultRate={speechSpeed?.[0] || 1}
        defaultPitch={speechPitch?.[0] || 1}
        onApply={(cfg) => {
          if (cfg?.rate) setSpeechSpeed([cfg.rate]);
          if (cfg?.pitch) setSpeechPitch([cfg.pitch]);
          if (cfg?.voiceName) setNativeVoiceName(cfg.voiceName);
        }}
        onApplyAudio={({ file, meta }) => {
          setAudioTracks((prev) => [
          ...prev.filter((t) => t.type !== 'voiceover_native'),
          {
            name: 'Native Voice',
            type: 'voiceover_native',
            volume: 1.0,
            ducking: false,
            fadeIn: 0.1,
            fadeOut: 0.3,
            file
          }]
          );
          setShowNativeVoice(false);
          toast.success('Voix native capturée et ajoutée à la timeline.');
        }} />


            {/* Video Preview Modal */}
            <OnboardingTour
        isOpen={isTourOpen}
        initialStep={tourStartStep}
        onClose={() => setIsTourOpen(false)}
        steps={[
        { title: t('tour_script_title'), description: t('tour_script_desc'), targetId: 'tour-script-input' },
        { title: t('tour_generate_title'), description: t('tour_generate_desc'), targetId: 'tour-generate-btn' },
        { title: t('tour_timeline_title'), description: t('tour_timeline_desc'), targetId: 'tour-timeline' },
        { title: t('tour_render_title'), description: t('tour_render_desc'), targetId: 'tour-render-btn' }]
        } />


            {advStoryboardIdx !== null && <AdvancedStoryboardMode isOpen={showAdvancedStoryboard} onClose={() => { setShowAdvancedStoryboard(false); setAdvStoryboardIdx(null); }} scene={storyboard?.scenes?.[advStoryboardIdx] || generatedImages[advStoryboardIdx] || {}} sceneIndex={advStoryboardIdx} fullScript={script} allScenes={generatedImages} onApplyVariant={handleApplyNarrativeBranch} />}
            {branchingSceneIndex !== null &&
      <NarrativeBranchingModal
        isOpen={showNarrativeBranching}
        onClose={() => {
          setShowNarrativeBranching(false);
          setBranchingSceneIndex(null);
        }}
        scene={storyboard?.scenes?.[branchingSceneIndex] || generatedImages[branchingSceneIndex]}
        sceneIndex={branchingSceneIndex}
        fullScript={script}
        onApplyBranch={handleApplyNarrativeBranch} />

      }

            <AdvancedAudioEditorDialog isOpen={showAdvancedAudioEditor} onClose={() => setShowAdvancedAudioEditor(false)} audioTracks={audioTracks} totalDuration={totalVideoDuration} onUpdateTrack={handleUpdateAudioTrack} onRemoveTrack={handleRemoveAudioTrack} onReorderTracks={setAudioTracks} onOpenGenerator={() => setShowAudioGenerator(true)} />

            {/* Microphone Recorder */}
            <MicrophoneRecorder
        isOpen={showMicRecorder}
        onClose={() => setShowMicRecorder(false)}
        onSave={handleMicRecordingSave}
        suggestedText={generatedImages.map((s) => s.dialogue).filter(Boolean).join(" ") || script} />


            <AudioMixerDialog isOpen={showAudioMixer} onClose={() => setShowAudioMixer(false)} audioTracks={audioTracks} voiceoverVolume={voiceoverVolume} onUpdateTrack={handleUpdateAudioTrack} onRemoveTrack={handleRemoveAudioTrack} onAddTrack={handleAddAudioTrack} onUpdateVoiceover={(vol) => setVoiceoverVolume(vol)} scenes={generatedImages} totalDuration={totalVideoDuration} onOpenGenerator={() => setShowAudioGenerator(true)} onOpenSmartSFX={() => setShowSmartSFX(true)} />

            {/* Smart SFX Generator */}
            <SmartSFXGenerator
        isOpen={showSmartSFX}
        onClose={() => setShowSmartSFX(false)}
        scenes={generatedImages}
        onAddSFXTracks={handleAddSFXTracks}
        pacingProfile={pacingProfile} />


            <VoiceCloneModal isOpen={showVoiceClone} onClose={() => setShowVoiceClone(false)} onVoiceCloned={handleVoiceCloned} existingClonedVoices={clonedVoices} /><ScenePreviewPlayer isOpen={showScenePreview} onClose={() => setShowScenePreview(false)} scenes={generatedImages} voiceovers={voiceovers} initialSceneIndex={previewSceneIndex} effectIntensity={effectIntensity[0]} renderSpeed={renderSpeed} subtitleSettings={subtitleSettings} /><ScriptFileImporter isOpen={showFileImporter} onClose={() => setShowFileImporter(false)} onImport={({ fullScript }) => {setScript(fullScript);toast.success("Script importé depuis le fichier");}} /><StockMediaBrowser isOpen={showStockBrowser} onClose={() => setShowStockBrowser(false)} sceneIndex={stockBrowserSceneIdx} onSelectImage={(asset, idx) => {saveToHistory();const ni = [...generatedImages];if (ni[idx]) {ni[idx] = { ...ni[idx], url: asset.url, videoUrl: null, _stockSource: asset.source };setGeneratedImages(ni);}}} onSelectVideo={(asset, idx) => {saveToHistory();const ni = [...generatedImages];if (ni[idx]) {ni[idx] = { ...ni[idx], url: asset.thumbnail || asset.url, videoUrl: asset.isVideo ? asset.url : null, effect: asset.isVideo ? 'none' : ni[idx].effect, _stockSource: asset.source, _stockDuration: asset.duration };if (asset.isVideo && asset.duration > 0 && asset.duration < 60) { ni[idx].duration = Math.min(asset.duration, ni[idx].duration || 5); }setGeneratedImages(ni);}}} />

            {/* Interactive Video Editor */}
            <VideoEditor
        isOpen={showVideoEditor}
        onClose={() => setShowVideoEditor(false)}
        scenes={generatedImages}
        renderSpeed={renderSpeed}
        onChangeRenderSpeed={(v) => setRenderSpeed(v)}
        audioTracks={audioTracks}
        voiceoverTrack={voiceovers.length > 0 ? { volume: voiceoverVolume } : null}
        onUpdateAudioTrack={handleUpdateAudioTrack}
        onRemoveAudioTrack={handleRemoveAudioTrack}
        onAddAudioTrack={handleGenerateAudioTrack}
        onSaveEdits={(editedScenes) => {
          setGeneratedImages(editedScenes);
          setShowVideoEditor(false);
        }} />


            <SubtitleManager isOpen={showSubtitleManager} onClose={() => setShowSubtitleManager(false)} scenes={generatedImages} subtitleSettings={subtitleSettings} onUpdateSettings={setSubtitleSettings} onUpdateSceneSubtitles={setGeneratedImages} />
            <SaveTemplateDialog isOpen={showTemplateSaveDialog} onClose={() => setShowTemplateSaveDialog(false)} newTemplateName={newTemplateName} setNewTemplateName={setNewTemplateName} newTemplateCategory={newTemplateCategory} setNewTemplateCategory={setNewTemplateCategory} newTemplateTags={newTemplateTags} setNewTemplateTags={setNewTemplateTags} onSave={handleSaveTemplate} isSaving={isSavingTemplate} />
            <ScriptAnalyzer script={script} isOpen={showScriptAnalyzer} onClose={() => setShowScriptAnalyzer(false)} targetDuration={targetTotalDuration} desiredSceneCount={desiredSceneCount} /><ScriptTemplatesModal isOpen={showScriptTemplates} onClose={() => setShowScriptTemplates(false)} onApplyScript={setScript} language={language||uiLanguage||'fr'} />
            {isVideoPlaying && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeVideoPreview}><div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}><video controls autoPlay className="w-full h-auto rounded-lg shadow-2xl"><source src={videoUrl} type="video/webm" /></video><Button variant="ghost" size="icon" onClick={closeVideoPreview} className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white">✕</Button></div></div>}
        </div>);

}