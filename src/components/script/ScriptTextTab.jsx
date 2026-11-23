import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SSMLEditor from '../SSMLEditor';
import DialogueBlockEditor, { assembleScript, textToBlocks } from './DialogueBlockEditor';
import ScriptActionButtons from './ScriptActionButtons';
import AutoLanguageDetector from './AutoLanguageDetector';

export default function ScriptTextTab({
  script,
  setScript,
  language,
  uiLanguage,
  isProcessing,
  fileInputRef,
  setShowFileImporter,
  setShowScriptTemplates,
  setIsProcessing,
  generateScriptImprovement,
  applyScriptImprovement,
  toast,
  t,
  setLanguage,
}) {
  const [inputMode, setInputMode] = useState('classic'); // 'classic' | 'blocks'
  const [dialogueBlocks, setDialogueBlocks] = useState([]);

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: () => base44.entities.Character.list(),
  });

  const handleSwitchToBlocks = () => {
    setInputMode('blocks');
    if (dialogueBlocks.length === 0 && script.trim()) {
      setDialogueBlocks(textToBlocks(script));
    }
  };

  return (
    <div id="tour-script-input">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('label_script')}
        </label>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setInputMode('classic')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              inputMode === 'classic'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Texte libre
          </button>
          <button
            onClick={handleSwitchToBlocks}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              inputMode === 'blocks'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            🎭 Blocs dialogues
          </button>
        </div>
      </div>

      {inputMode === 'classic' ? (
        <>
          <SSMLEditor
            value={script}
            onChange={setScript}
            placeholder={t('placeholder_script')}
            disabled={isProcessing}
          />
          <div className="flex items-center justify-between mt-3">
            <ScriptActionButtons
              script={script}
              language={language}
              uiLanguage={uiLanguage}
              isProcessing={isProcessing}
              fileInputRef={fileInputRef}
              setShowFileImporter={setShowFileImporter}
              setScript={setScript}
              setShowScriptTemplates={setShowScriptTemplates}
              setIsProcessing={setIsProcessing}
              generateScriptImprovement={generateScriptImprovement}
              applyScriptImprovement={applyScriptImprovement}
              base44={base44}
              toast={toast}
            />
            {setLanguage && (
              <AutoLanguageDetector
                script={script}
                currentLanguage={language}
                onLanguageDetected={setLanguage}
              />
            )}
            <span className="text-xs text-gray-500">{script.length} characters</span>
          </div>
        </>
      ) : (
        <>
          {/* Raw paste area used for AI splitting */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Script brut (pour découpage IA)
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Collez votre script brut ici, puis cliquez 'Découper avec l'IA'..."
              disabled={isProcessing}
              rows={3}
              className="w-full bg-white/50 border border-gray-300 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-gray-400 focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          <DialogueBlockEditor
            blocks={dialogueBlocks}
            onChange={(newBlocks) => {
              setDialogueBlocks(newBlocks);
              // Keep script in sync with assembled blocks
              setScript(assembleScript(newBlocks));
            }}
            characters={characters}
            disabled={isProcessing}
            rawScript={script}
          />
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (ev) => setScript(ev.target.result);
            reader.readAsText(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
}