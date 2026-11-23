import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Mic } from "lucide-react";
import VoiceOnlyRegenModal from '../VoiceOnlyRegenModal';
import DialogueModeToggle from '../storyboard/DialogueModeToggle';

export default function RegenerateButtons({
  script, language, ttsMode, isProcessing,
  generatedImages, onRegenerateDialogue,
  selectedVoice, speechSpeed, speechPitch,
  voices, generateSpeechAudio,
  onRegenerateVoiceOnly,
  dialogueMode, onDialogueModeChange
}) {
  const [showVoiceRegenModal, setShowVoiceRegenModal] = useState(false);

  const hasDialogue = generatedImages.some(img => img.dialogue);
  const hasImages = generatedImages.length > 0 && generatedImages.some(img => img.url);

  return (
    <>
      {/* Mode des dialogues — toujours visible avant et après la génération */}
      {onDialogueModeChange && (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg mt-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Mode des dialogues</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {dialogueMode === 'strict'
                ? "Reprend fidèlement le texte du script."
                : "L'IA réécrit pour un rendu cinématique."}
            </span>
          </div>
          <DialogueModeToggle mode={dialogueMode} onChange={onDialogueModeChange} />
        </div>
      )}

      {hasImages && (
        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={onRegenerateDialogue}
            disabled={!script.trim() || (ttsMode !== 'native' && !language) || isProcessing}
            variant="outline"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Régénérer dialogue uniquement (conserver visuels)
          </Button>
          <Button
            onClick={() => setShowVoiceRegenModal(true)}
            disabled={isProcessing || !hasDialogue}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50 py-2 rounded-xl"
          >
            <Mic className="w-4 h-4 mr-2" />
            Régénérer voix off uniquement (changer la voix)
          </Button>
        </div>
      )}

      {hasImages && (
        <VoiceOnlyRegenModal
          isOpen={showVoiceRegenModal}
          onClose={() => setShowVoiceRegenModal(false)}
          onConfirm={(params) => {
            setShowVoiceRegenModal(false);
            onRegenerateVoiceOnly(params);
          }}
          isProcessing={isProcessing}
          voices={voices}
          currentVoice={selectedVoice}
          currentSpeed={speechSpeed}
          currentPitch={speechPitch}
          language={language}
          generateSpeechAudio={generateSpeechAudio}
        />
      )}
    </>
  );
}