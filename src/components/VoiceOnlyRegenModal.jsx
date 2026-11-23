import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, RefreshCw } from "lucide-react";

export default function VoiceOnlyRegenModal({
  isOpen, onClose, onConfirm, isProcessing,
  voices, currentVoice, currentSpeed, currentPitch,
  language, generateSpeechAudio
}) {
  const [selectedVoice, setSelectedVoice] = useState(currentVoice);
  const [speed, setSpeed] = useState(currentSpeed);
  const [pitch, setPitch] = useState(currentPitch);
  const [isTesting, setIsTesting] = useState(false);
  const [browserVoices, setBrowserVoices] = useState([]);

  // Load native browser voices
  useEffect(() => {
    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const raw = synth.getVoices();
      const langPrefix = language ? language.toLowerCase() : '';
      const filtered = raw.filter(v => !langPrefix || v.lang.toLowerCase().startsWith(langPrefix));
      setBrowserVoices(filtered.map(v => ({
        id: `browser_${v.name}`,
        name: v.name,
        lang: language || v.lang.split('-')[0].toLowerCase(),
        locale: v.lang,
        gender: v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('femme') ? 'Female' : 'Male',
        type: 'Browser',
        _nativeVoice: v
      })));
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, [language]);

  const handleTestVoice = async () => {
    setIsTesting(true);
    try {
      const testText = language === 'fr' ? "Ceci est un test de la nouvelle voix." :
        language === 'es' ? "Esta es una prueba de la nueva voz." :
        language === 'ar' ? "هذا اختبار للصوت الجديد." :
        "This is a test of the new voice.";
      
      const voiceConfig = allVoices.find(v => v.id === selectedVoice);
      const isBrowser = voiceConfig?.type === 'Browser';
      const isFree = isBrowser || !voiceConfig || voiceConfig.type === 'Free';

      // Native browser voice (web speech API)
      if (isBrowser && voiceConfig._nativeVoice) {
        const utt = new SpeechSynthesisUtterance(testText);
        utt.voice = voiceConfig._nativeVoice;
        utt.rate = speed[0];
        utt.pitch = pitch[0];
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
        setIsTesting(false);
        return;
      }

      if (isFree && window.speechSynthesis) {
        const { speakText } = await import('../components/voice/BrowserTTSEngine');
        const gender = voiceConfig ? (voiceConfig.gender || '').toLowerCase() : 'female';
        const locale = voiceConfig ? voiceConfig.locale : (language || 'en');
        await speakText(testText, { gender, langCode: locale, speed: speed[0] * (voiceConfig?.speedAdj || 1.0), pitch: pitch[0] * (voiceConfig?.pitch || 1.0) });
      } else {
        const blob = await generateSpeechAudio(testText, language || 'en', {
          voiceId: selectedVoice,
          speed: speed[0],
          pitch: pitch[0],
          stability: 0.5,
          similarity: 0.75,
          style: 0.0,
          emotional_style: 'neutral',
          speaking_style: 'narrative'
        });
        if (blob) {
          const audio = new Audio(URL.createObjectURL(blob));
          audio.play();
        }
      }
    } catch (err) {
      console.error("Voice test failed:", err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      voice: selectedVoice,
      speed: speed,
      pitch: pitch
    });
  };

  const filteredVoices = voices.filter(v => !language || v.lang === language);
  const allVoices = [...filteredVoices, ...browserVoices];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-green-600" />
            Régénérer la voix off uniquement
          </DialogTitle>
          <DialogDescription>
            Changez la voix, la vitesse ou le ton sans modifier le texte ni les visuels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Voice Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Voix</Label>
            <div className="flex gap-2">
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choisir une voix" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Voix intégrées</div>
                      {filteredVoices.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center justify-between w-full min-w-[180px]">
                            <span>{v.name}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
                              <span>{v.gender}</span>
                              {v.type === 'Cloned' && (
                                <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700">Clonée</Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {browserVoices.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-t mt-1 pt-2">Voix navigateur</div>
                      {browserVoices.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center justify-between w-full min-w-[180px]">
                            <span className="truncate max-w-[160px]">{v.name}</span>
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 ml-2 shrink-0">Navigateur</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {allVoices.length === 0 && (
                    <div className="p-2 text-xs text-slate-500 text-center">
                      Aucune voix disponible.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                onClick={handleTestVoice}
                disabled={isTesting}
                title="Tester la voix"
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Vitesse</Label>
              <span className="text-xs text-slate-500">{speed[0].toFixed(2)}x</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.5}
              max={2.0}
              step={0.05}
            />
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Tonalité</Label>
              <span className="text-xs text-slate-500">{pitch[0].toFixed(2)}x</span>
            </div>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              min={0.5}
              max={2.0}
              step={0.05}
            />
          </div>

          {selectedVoice !== currentVoice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              La voix sera changée de <strong>{allVoices.find(v => v.id === currentVoice)?.name || currentVoice}</strong> vers <strong>{allVoices.find(v => v.id === selectedVoice)?.name || selectedVoice}</strong>.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Régénération...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Régénérer la voix off
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}