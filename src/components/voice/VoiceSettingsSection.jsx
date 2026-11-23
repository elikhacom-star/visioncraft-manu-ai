import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Play, User, Mic } from "lucide-react";

export default function VoiceSettingsSection({
  ttsMode, setTtsMode, selectedVoice, setSelectedVoice, VOICES, language,
  isProcessing, onTestVoice, onOpenClone, onOpenStudio, onOpenNativeVoice, t
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mode de voix</label>
        <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => setTtsMode('integrated')}
            className={`px-3 py-1.5 text-xs ${ttsMode === 'integrated' ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-50'}`}
            aria-pressed={ttsMode === 'integrated'}
          >
            Intégrée
          </button>
          <button
            onClick={() => setTtsMode('native')}
            className={`px-3 py-1.5 text-xs border-l border-gray-200 ${ttsMode === 'native' ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-50'}`}
            aria-pressed={ttsMode === 'native'}
          >
            Native
          </button>
        </div>
      </div>

      {ttsMode === 'integrated' ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('label_voice_selection')}</label>
          <div className="flex gap-2">
            <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isProcessing}>
              <SelectTrigger className="bg-white/50 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.filter(v => !language || v.lang === language).map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <span>{v.name}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{v.gender}</span>
                        {v.type === 'Free' && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 hover:bg-green-100">Free</Badge>}
                        {v.type === 'Cloned' && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100">Clonée</Badge>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {VOICES.filter(v => !language || v.lang === language).length === 0 && (
                  <div className="p-2 text-xs text-slate-500 text-center">No specific voices for this language. Standard will be used.</div>
                )}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" onClick={onOpenClone} disabled={isProcessing}
              className="shrink-0 border-purple-200 text-purple-600 hover:bg-purple-50" title="Cloner une voix">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={isProcessing} onClick={onTestVoice} title={t('btn_preview') || "Test Voice"}>
              <Play className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onOpenStudio} className="h-7 text-xs text-amber-700 hover:bg-amber-50">
              Voice Studio (options avancées)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Voix Native (Navigateur)</label>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onOpenNativeVoice} className="h-8 text-xs">
              <Mic className="w-3 h-3 mr-1.5" />
              Ouvrir la Voix Native
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">Préécoute locale via le navigateur. Pour l'export, capturez la voix native (depuis la fenêtre) puis elle sera incluse et remplacera la voix intégrée.</p>
        </div>
      )}
    </>
  );
}