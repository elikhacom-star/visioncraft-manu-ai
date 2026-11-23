import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Play, Square, Settings2, Download, Save, Trash2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function NativeVoiceEnhancer({
        isOpen,
        onClose,
        initialText = "",
        defaultRate = 1.0,
        defaultPitch = 1.0,
        onApply,
        onApplyAudio,
      }) {
  const [voices, setVoices] = React.useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = React.useState("");
  const [text, setText] = React.useState(initialText || "Ceci est un aperçu de la voix native.");
  const [rate, setRate] = React.useState([defaultRate || 1.0]);
  const [pitch, setPitch] = React.useState([defaultPitch || 1.0]);
  const [volume, setVolume] = React.useState([1.0]);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("voice");
  const [emotion, setEmotion] = React.useState("neutral");
  const [reverb, setReverb] = React.useState([0]);
  const [echo, setEcho] = React.useState([0]);
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const queryClient = useQueryClient();

  const { data: userPresets = [] } = useQuery({
    queryKey: ['voicePresets', 'native'],
    queryFn: () => base44.entities.VoicePreset.filter({ provider: 'native' })
  });

  const creativePresets = [
    { name: "Narrateur Confiant", rate: 1.0, pitch: 0.95, description: "Voix posée et professionnelle", emotion: "neutral", reverb: 15, echo: 0 },
    { name: "Présentateur Dynamique", rate: 1.15, pitch: 1.05, description: "Énergique et engageant", emotion: "happy", reverb: 10, echo: 5 },
    { name: "Documentaire", rate: 0.95, pitch: 0.9, description: "Voix calme et informative", emotion: "neutral", reverb: 20, echo: 0 },
    { name: "Conférence TED", rate: 1.05, pitch: 1.0, description: "Inspirant et clair", emotion: "happy", reverb: 12, echo: 0 },
    { name: "Formation Professionnelle", rate: 1.0, pitch: 1.0, description: "Neutre et pédagogique", emotion: "neutral", reverb: 5, echo: 0 },
    { name: "Publicité Premium", rate: 1.1, pitch: 1.05, description: "Voix de marque haut de gamme", emotion: "neutral", reverb: 18, echo: 8 },
    { name: "Méditation/Relaxation", rate: 0.85, pitch: 0.9, description: "Doux et apaisant", emotion: "neutral", reverb: 35, echo: 15 },
    { name: "Actualités Sérieuses", rate: 1.0, pitch: 0.88, description: "Grave et factuel", emotion: "neutral", reverb: 8, echo: 0 }
  ];

  const savePresetMutation = useMutation({
    mutationFn: async (data) => base44.entities.VoicePreset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voicePresets'] });
      toast.success("Préréglage sauvegardé!");
      setPresetName("");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde")
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id) => base44.entities.VoicePreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voicePresets'] });
      toast.success("Préréglage supprimé");
    }
  });

  const loadVoices = React.useCallback(() => {
    try {
      const list = window.speechSynthesis?.getVoices?.() || [];
      setVoices(list);
      if (!selectedVoiceName && list.length > 0) {
        setSelectedVoiceName(list[0].name);
      }
    } catch {}
  }, [selectedVoiceName]);

  React.useEffect(() => {
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [loadVoices]);

  React.useEffect(() => {
    setText(initialText || "");
    setRate([defaultRate || 1.0]);
    setPitch([defaultPitch || 1.0]);
  }, [initialText, defaultRate, defaultPitch]);

  const stopSpeaking = () => {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}
    setIsSpeaking(false);
  };

  const sanitizeForSpeech = (t) => {
    if (!t) return "";
    let s = t;
    s = s.replace(/!\[[^\]]*\]\([^\)]*\)/g, "");
    s = s.replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1");
    s = s.replace(/[•·◦▪▶►]/g, ", ");
    s = s.replace(/\s*[-–—]{1,}\s*/g, ", ");
    s = s.replace(/[*_~`^|>#]+/g, "");
    s = s.replace(/<[^>]*>/g, "");
    s = s.replace(/[@#$%_=+{}\[\]\\/]+/g, "");
    s = s.replace(/([.,;:!?])\1+/g, "$1");
    s = s.replace(/\.{4,}/g, "…");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  };

  const preview = () => {
    try {
      stopSpeaking();
      const utter = new SpeechSynthesisUtterance(sanitizeForSpeech(text || ""));
      const v = voices.find((x) => x.name === selectedVoiceName);
      if (v) utter.voice = v;
      utter.rate = rate[0];
      utter.pitch = pitch[0];
      utter.volume = volume[0];
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis?.speak?.(utter);
    } catch {}
  };

  // Apply audio effects using Web Audio API
  // Always render through an OfflineAudioContext at 48kHz to guarantee identical speed/pitch in final export
  const applyAudioEffects = async (audioBlob, effectsConfig) => {
    const { reverb: reverbAmount, echo: echoAmount } = effectsConfig;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Normalize to 48kHz to avoid any pitch/speed drift between preview and export
      const TARGET_SAMPLE_RATE = 48000;
      const targetLength = Math.ceil(audioBuffer.length * (TARGET_SAMPLE_RATE / audioBuffer.sampleRate));
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        targetLength,
        TARGET_SAMPLE_RATE
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      const destination = offlineContext.destination;
      let lastNode = source;

      // Apply Echo
      if (echoAmount > 0) {
        const delay = offlineContext.createDelay(1.0);
        const feedback = offlineContext.createGain();
        const wetGain = offlineContext.createGain();

        delay.delayTime.value = 0.3 * (echoAmount / 100);
        feedback.gain.value = 0.4 * (echoAmount / 100);
        wetGain.gain.value = 0.5 * (echoAmount / 100);

        lastNode.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(destination);
        // Dry signal
        lastNode.connect(destination);
      }

      // Apply Reverb
      if (reverbAmount > 0) {
        const convolver = offlineContext.createConvolver();
        const reverbGain = offlineContext.createGain();

        const impulseLength = offlineContext.sampleRate * (1 + (reverbAmount / 50));
        const impulse = offlineContext.createBuffer(2, impulseLength, offlineContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
          }
        }

        convolver.buffer = impulse;
        reverbGain.gain.value = 0.6 * (reverbAmount / 100);

        // Send dry + wet
        lastNode.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(destination);
        if (echoAmount === 0) {
          lastNode.connect(destination);
        }
      }

      // If no effects, just pass-through (still re-render at 48kHz for fidelity)
      if (echoAmount === 0 && reverbAmount === 0) {
        lastNode.connect(destination);
      }

      source.start();
      const renderedBuffer = await offlineContext.startRendering();

      const wavBlob = await audioBufferToWav(renderedBuffer);
      audioContext.close();

      return wavBlob;
    } catch (error) {
      console.warn("Audio effects failed, returning original:", error);
      return audioBlob;
    }
  };

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = async (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const recordNativeSpeech = async () => {
    const spokenText = sanitizeForSpeech(text || "");
    if (!spokenText) throw new Error("Aucun texte à lire.");

    // Speak the text aloud so the user can hear it, and measure the duration
    stopSpeaking();
    const startTime = Date.now();

    await new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(spokenText);
      const v = voices.find((x) => x.name === selectedVoiceName);
      if (v) utter.voice = v;
      utter.rate = rate[0];
      utter.pitch = pitch[0];
      utter.volume = volume[0];
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis?.speak?.(utter);
    });

    const durationSec = (Date.now() - startTime) / 1000;

    // Create a silent WAV of the correct duration as a placeholder.
    // The VoiceoverScheduler will detect the _browserTTS flag and
    // replay the speech LIVE during video assembly — this guarantees
    // the audio is captured into the MediaRecorder stream.
    const sampleRate = 48000;
    const numSamples = Math.floor(sampleRate * durationSec);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const wavBlob = new Blob([buffer], { type: 'audio/wav' });
    // Tag the blob so VoiceoverScheduler knows to replay speech live
    wavBlob._browserTTS = true;
    wavBlob._ttsText = spokenText;
    wavBlob._ttsSpeed = rate[0];
    wavBlob._ttsPitch = pitch[0];
    wavBlob._ttsVoiceName = selectedVoiceName;
    wavBlob._ttsLang = voices.find((x) => x.name === selectedVoiceName)?.lang || 'fr';
    wavBlob._ttsDuration = durationSec;
    wavBlob.provider = 'browser_native';

    return wavBlob;
  };

  const handleRecordAndApply = async () => {
    try {
      setIsSpeaking(true);
      const blob = await recordNativeSpeech();
      setIsSpeaking(false);
      const file = new File([blob], `voice_native_${Date.now()}.wav`, { type: 'audio/wav' });

      // Persist exact synth params for final render fidelity
      const exactParams = {
        rate: Number(rate[0].toFixed(3)),
        pitch: Number(pitch[0].toFixed(3)),
        voiceName: selectedVoiceName,
        emotion: emotion,
        reverb: reverb[0],
        echo: echo[0],
        sampleRate: 48000
      };

      if (onApply) onApply(exactParams);

      // Pass the tagged blob to the parent — it will be replayed live during
      // video assembly by VoiceoverScheduler (no silent file issue).
      if (typeof onApplyAudio === "function") {
        onApplyAudio({ file, meta: exactParams, blob });
      }
      toast.success("Voix native enregistrée ! Elle sera utilisée automatiquement lors de la génération vidéo.");
    } catch (e) {
      setIsSpeaking(false);
      alert(e?.message || "Échec de la capture de la voix native.");
    }
  };

  const handleApply = () => {
    if (onApply) onApply({ 
      rate: rate[0], 
      pitch: pitch[0], 
      voiceName: selectedVoiceName,
      emotion: emotion,
      reverb: reverb[0],
      echo: echo[0]
    });
    onClose?.();
  };

  const loadPreset = (preset) => {
    setRate([preset.settings?.rate || 1]);
    setPitch([preset.settings?.pitch || 1]);
    setVolume([preset.settings?.volume || 1]);
    setEmotion(preset.settings?.emotion || "neutral");
    setReverb([preset.settings?.reverb || 0]);
    setEcho([preset.settings?.echo || 0]);
    if (preset.voice_id) setSelectedVoiceName(preset.voice_id);
    toast.success(`Préréglage "${preset.name}" chargé`);
  };

  const loadCreativePreset = (preset) => {
    setRate([preset.rate]);
    setPitch([preset.pitch]);
    setEmotion(preset.emotion || "neutral");
    setReverb([preset.reverb || 0]);
    setEcho([preset.echo || 0]);
    toast.success(`Effet "${preset.name}" appliqué`);
  };

  const saveCurrentAsPreset = () => {
    if (!presetName.trim()) {
      toast.error("Entrez un nom pour le préréglage");
      return;
    }
    savePresetMutation.mutate({
      name: presetName.trim(),
      description: `Voix: ${selectedVoiceName}, Vitesse: ${rate[0].toFixed(2)}x, Timbre: ${pitch[0].toFixed(2)}x, Émotion: ${emotion}`,
      provider: "native",
      voice_id: selectedVoiceName,
      settings: {
        rate: rate[0],
        pitch: pitch[0],
        volume: volume[0],
        emotion: emotion,
        reverb: reverb[0],
        echo: echo[0]
      },
      category: "Custom"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopSpeaking(); onClose?.(); } }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-500" />
            Voix Native Professionnelle
          </DialogTitle>
          <DialogDescription>
            Configurez votre voix avec des préréglages professionnels et des effets audio avancés.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice">Voix</TabsTrigger>
            <TabsTrigger value="creative">
              <Sparkles className="w-3 h-3 mr-1" />
              Effets
            </TabsTrigger>
            <TabsTrigger value="presets">Mes Préréglages</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs">Texte d'aperçu</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="h-24" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Voix</Label>
                <Select value={selectedVoiceName} onValueChange={setSelectedVoiceName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une voix" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {voices.length === 0 && (
                      <SelectItem value="none" disabled>Aucune voix disponible</SelectItem>
                    )}
                    {(() => {
                      const groupedVoices = {};
                      voices.forEach(v => {
                        const lang = v.lang || 'Autre';
                        if (!groupedVoices[lang]) groupedVoices[lang] = [];
                        groupedVoices[lang].push(v);
                      });
                      
                      return Object.entries(groupedVoices).sort((a, b) => a[0].localeCompare(b[0])).map(([lang, voiceList]) => (
                        <React.Fragment key={lang}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0 z-10">
                            {lang}
                          </div>
                          {voiceList.map((v) => {
                            const isFemale = v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('femme') || v.name.toLowerCase().includes('woman');
                            const isMale = v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('homme') || v.name.toLowerCase().includes('man');
                            const gender = isFemale ? '♀' : isMale ? '♂' : '•';
                            
                            return (
                              <SelectItem key={v.name} value={v.name}>
                                <div className="flex items-center justify-between w-full min-w-[250px]">
                                  <span className="truncate">{v.name}</span>
                                  <span className="text-xs text-slate-400 ml-2">{gender}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </React.Fragment>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {voices.length} voix disponibles sur votre système
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Émotion</Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une émotion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">😐 Neutre</SelectItem>
                    <SelectItem value="happy">😊 Heureux</SelectItem>
                    <SelectItem value="sad">😢 Triste</SelectItem>
                    <SelectItem value="angry">😠 En Colère</SelectItem>
                    <SelectItem value="whispering">🤫 Chuchotant</SelectItem>
                    <SelectItem value="shouting">📢 Criant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Vitesse <span className="text-slate-400">{rate[0].toFixed(2)}x</span></Label>
                <Slider value={rate} onValueChange={setRate} min={0.5} max={2} step={0.05} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Timbre <span className="text-slate-400">{pitch[0].toFixed(2)}x</span></Label>
                <Slider value={pitch} onValueChange={setPitch} min={0} max={2} step={0.05} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Volume <span className="text-slate-400">{Math.round(volume[0]*100)}%</span></Label>
                <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.05} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Réverbération <span className="text-slate-400">{reverb[0]}%</span></Label>
                <Slider value={reverb} onValueChange={setReverb} min={0} max={100} step={5} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Écho <span className="text-slate-400">{echo[0]}%</span></Label>
                <Slider value={echo} onValueChange={setEcho} min={0} max={100} step={5} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={preview} className="gap-2">
                <Play className="w-4 h-4" /> Préécouter
              </Button>
              <Button variant="outline" onClick={stopSpeaking} className="gap-2">
                <Square className="w-4 h-4" /> Arrêter
              </Button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[11px] text-blue-800 font-medium mb-1">💡 Comment ça marche</p>
              <p className="text-[10px] text-blue-700 leading-relaxed">
                <strong>Préécouter</strong> : Testez la voix avec vos réglages (vitesse, timbre).<br/>
                <strong>Capturer</strong> : Écoute complète du texte + enregistrement des paramètres.<br/>
                <strong>Appliquer</strong> : Sauvegarde les réglages pour la génération vidéo.<br/><br/>
                Lors de l'export vidéo, une voix de synthèse sera générée automatiquement 
                et intégrée dans la bande son de votre vidéo.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="creative" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Préréglages Professionnels</Label>
              <p className="text-xs text-slate-500">Styles vocaux optimisés pour contenus sérieux et professionnels</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {creativePresets.map((preset) => (
                <Card 
                  key={preset.name} 
                  className="cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-all"
                  onClick={() => loadCreativePreset(preset)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{preset.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            V:{preset.rate}x
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                            T:{preset.pitch.toFixed(2)}
                          </span>
                          {preset.reverb > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                              R:{preset.reverb}
                            </span>
                          )}
                          {preset.echo > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                              E:{preset.echo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Button onClick={preview} className="gap-2 flex-1">
                  <Play className="w-4 h-4" /> Tester l'effet
                </Button>
                <Button variant="outline" onClick={stopSpeaking}>
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sauvegarder la configuration actuelle</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nom du préréglage..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveCurrentAsPreset()}
                  />
                  <Button 
                    onClick={saveCurrentAsPreset} 
                    disabled={savePresetMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Config actuelle : V:{rate[0].toFixed(2)}x, T:{pitch[0].toFixed(2)}x, Émo:{emotion}, R:{reverb[0]}%, E:{echo[0]}%
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Mes préréglages ({userPresets.length})</Label>
                {userPresets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Save className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun préréglage sauvegardé</p>
                    <p className="text-xs mt-1">Créez votre premier préréglage ci-dessus</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {userPresets.map((preset) => (
                      <Card key={preset.id} className="hover:bg-slate-50">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => loadPreset(preset)}
                            >
                              <h4 className="font-medium text-sm">{preset.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                  {preset.settings?.rate?.toFixed(2) || 1}x
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  {preset.settings?.pitch?.toFixed(2) || 1}x
                                </span>
                                {preset.settings?.emotion && preset.settings?.emotion !== "neutral" && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                    {preset.settings?.emotion}
                                  </span>
                                )}
                                {preset.settings?.reverb > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    R:{preset.settings?.reverb}
                                  </span>
                                )}
                                {preset.settings?.echo > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                    E:{preset.settings?.echo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deletePresetMutation.mutate(preset.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => { stopSpeaking(); onClose?.(); }}>Fermer</Button>
          <Button variant="secondary" onClick={handleRecordAndApply} disabled={isSpeaking} className="gap-2">
            {isSpeaking ? (
              <><Mic className="w-4 h-4 animate-pulse text-red-500" /> Écoute en cours...</>
            ) : (
              <><Mic className="w-4 h-4" /> Capturer la voix</>
            )}
          </Button>
          <Button onClick={handleApply} className="bg-amber-600 hover:bg-amber-700 text-white">Appliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}