import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings2, Play, Mic, Sparkles, User, Volume2, VolumeX, Music, AudioLines, ChevronDown, ChevronRight } from "lucide-react";

function Section({ title, icon: Icon, children, defaultOpen = false, accent = 'slate' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors`}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-amber-500" />}
          {title}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-white dark:bg-gray-900/40">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdvancedSettingsPanel({
  voiceoverEnabled, setVoiceoverEnabled,
  negativePrompt, setNegativePrompt, aspectRatio, setAspectRatio,
  renderSpeed, setRenderSpeed, ttsMode, setTtsMode,
  selectedVoice, setSelectedVoice, speechSpeed, speechPitch,
  VOICES, language, isProcessing,
  onTestVoice, onOpenVoiceClone, onOpenVoiceStudio, onOpenNativeVoice,
  backgroundMusicFile, setBackgroundMusicFile, musicVolume, setMusicVolume,
  autoDucking, setAutoDucking, backgroundAudioType, setBackgroundAudioType, onOpenAudioGenerator,
  subtitlesEnabled, setSubtitlesEnabled,
  watermarkLogo, setWatermarkLogo, watermarkText, setWatermarkText,
  effectIntensity, setEffectIntensity,
  globalFilter, setGlobalFilter, GLOBAL_FILTERS,
  t
}) {
  return (
    <div className="space-y-2 pt-4 border-t border-gray-200">
      <h4 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4" />
        Paramètres avancés
      </h4>

      {/* --- VOIX OFF --- */}
      <Section title="Voix off" icon={Mic} defaultOpen={true}>
        {/* Toggle Voix off */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {voiceoverEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Activer la voix off</p>
              <p className="text-[10px] text-slate-500">{voiceoverEnabled ? 'Voix off générée pour chaque scène' : 'Aucune voix off'}</p>
            </div>
          </div>
          <Switch checked={voiceoverEnabled} onCheckedChange={setVoiceoverEnabled} disabled={isProcessing} />
        </div>

        {voiceoverEnabled && (
          <>
            {/* Mode TTS */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Mode</label>
              <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden text-xs">
                <button onClick={() => setTtsMode('integrated')} className={`flex-1 px-3 py-1.5 ${ttsMode === 'integrated' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`} disabled={isProcessing}>Intégrée</button>
                <button onClick={() => setTtsMode('native')} className={`flex-1 px-3 py-1.5 border-l border-gray-200 ${ttsMode === 'native' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-slate-600 hover:bg-slate-50'}`} disabled={isProcessing}>Native (navigateur)</button>
              </div>
            </div>

            {ttsMode === 'integrated' ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">{t('label_voice_selection')}</label>
                <div className="flex gap-2">
                  <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isProcessing}>
                    <SelectTrigger className="bg-white/50 flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VOICES.filter(v => !language || v.lang === language).map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          <span className="flex items-center gap-2">
                            {v.name}
                            <span className="text-slate-400 text-[10px]">{v.gender}</span>
                            {v.type === 'Cloned' && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700">Clonée</Badge>}
                          </span>
                        </SelectItem>
                      ))}
                      {VOICES.filter(v => !language || v.lang === language).length === 0 && (
                        <div className="p-2 text-xs text-slate-500 text-center">Aucune voix pour cette langue.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={onOpenVoiceClone} disabled={isProcessing} className="shrink-0 border-purple-200 text-purple-600 hover:bg-purple-50 h-9 w-9" title="Cloner une voix"><User className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" disabled={isProcessing} onClick={onTestVoice} title="Tester la voix" className="h-9 w-9"><Play className="w-4 h-4" /></Button>
                </div>
                <Button size="sm" variant="ghost" onClick={onOpenVoiceStudio} className="h-7 text-xs text-amber-700 hover:bg-amber-50 w-full justify-start">
                  Voice Studio (options avancées)
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Button size="sm" variant="secondary" onClick={onOpenNativeVoice} className="h-8 text-xs w-full">
                  <Mic className="w-3 h-3 mr-1.5" />Configurer la voix native
                </Button>
                <p className="text-[10px] text-slate-500">Voix du navigateur. Pour l'export, capturez la voix native.</p>
              </div>
            )}
          </>
        )}

        {/* Sous-titres */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Sous-titres sur la vidéo</p>
            <p className="text-[10px] text-slate-500">{subtitlesEnabled ? 'Affichés sur la vidéo exportée' : 'Désactivés'}</p>
          </div>
          <Switch checked={subtitlesEnabled} onCheckedChange={setSubtitlesEnabled} disabled={isProcessing} />
        </div>
      </Section>

      {/* --- AUDIO DE FOND --- */}
      <Section title="Musique & Audio de fond" icon={Music}>
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
          <button onClick={() => { setBackgroundAudioType('music'); setAutoDucking(true); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-medium transition-all ${backgroundAudioType === 'music' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`} disabled={isProcessing}>
            <Music className="w-3 h-3" />Musique
          </button>
          <button onClick={() => { setBackgroundAudioType('voiceover'); setAutoDucking(false); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-medium transition-all border-l border-gray-200 ${backgroundAudioType === 'voiceover' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-50'}`} disabled={isProcessing}>
            <AudioLines className="w-3 h-3" />Voix off (upload)
          </button>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <Input type="file" accept="audio/*" onChange={(e) => setBackgroundMusicFile(e.target.files[0])} disabled={isProcessing} className="bg-white/50 text-xs flex-1" />
          {backgroundMusicFile && <Badge variant="outline" className={backgroundAudioType === 'music' ? 'text-green-600 bg-green-50 shrink-0' : 'text-blue-600 bg-blue-50 shrink-0'}>✓ Chargé</Badge>}
        </div>

        {backgroundAudioType === 'music' && (
          <Button size="sm" variant="secondary" className="h-8 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 w-full" onClick={onOpenAudioGenerator}>
            <Sparkles className="w-3 h-3 mr-1.5" />Générer de la musique IA
          </Button>
        )}

        {backgroundMusicFile && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{backgroundAudioType === 'music' ? 'Volume musique' : 'Volume voix off'}</span>
              <span>{Math.round(musicVolume[0] * 100)}%</span>
            </div>
            <Slider value={musicVolume} onValueChange={setMusicVolume} min={0} max={1} step={0.05} disabled={isProcessing} />
            {backgroundAudioType === 'music' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto-ducking" checked={autoDucking} onChange={(e) => setAutoDucking(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600" disabled={isProcessing} />
                <Label htmlFor="auto-ducking" className="text-xs cursor-pointer">Atténuer pendant les voix off</Label>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* --- FORMAT VIDÉO --- */}
      <Section title="Format & Rendu" icon={Settings2}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t('label_video_format')}</label>
            <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isProcessing}>
              <SelectTrigger className="bg-white/50 text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">{t('format_landscape')}</SelectItem>
                <SelectItem value="9:16">{t('format_portrait')}</SelectItem>
                <SelectItem value="1:1">{t('format_square')}</SelectItem>
                <SelectItem value="4:5">Instagram Feed (4:5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Vitesse vidéo</label>
            <Select value={String(renderSpeed)} onValueChange={(v) => setRenderSpeed(parseFloat(v))} disabled={isProcessing}>
              <SelectTrigger className="bg-white/50 text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(v => (
                  <SelectItem key={v} value={String(v)} className="text-xs">{v}x{v === 1 ? ' (Normal)' : v < 1 ? ' (Lent)' : ' (Rapide)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">{t('label_negative_prompt')}</label>
          <Input placeholder={t('placeholder_negative_prompt')} value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} disabled={isProcessing} className="bg-white/50 text-xs h-8" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('label_effect_intensity')}</span>
            <span>{effectIntensity[0]}x</span>
          </div>
          <Slider value={effectIntensity} onValueChange={setEffectIntensity} min={0.1} max={2.0} step={0.1} disabled={isProcessing} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">{t('label_global_filter')}</label>
          <Select value={globalFilter} onValueChange={setGlobalFilter} disabled={isProcessing}>
            <SelectTrigger className="bg-white/50 text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GLOBAL_FILTERS.map(filter => <SelectItem key={filter.id} value={filter.id} className="text-xs">{t('filter_' + filter.id) || filter.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* --- BRANDING --- */}
      <Section title="Branding (Logo & Filigrane)">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t('label_watermark_logo')}</label>
            <Input type="file" accept="image/*" onChange={(e) => setWatermarkLogo(e.target.files[0])} disabled={isProcessing} className="bg-white/50 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t('label_watermark_text')}</label>
            <Input type="text" placeholder="ex: @MaChaîne" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} disabled={isProcessing} className="bg-white/50 text-xs h-8" />
          </div>
        </div>
      </Section>
    </div>
  );
}