import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, BookOpen } from "lucide-react";
import ToneRewriterButton from './ToneRewriterButton';
import UrlToScriptButton from './UrlToScriptButton';
import HelpTooltip from '../HelpTooltip';
import ScriptImproverComponent from '../ScriptImprover';
import AIWriterDialog from './AIWriterDialog';

export default function ScriptActionButtons({
  script,
  language,
  uiLanguage,
  isProcessing,
  fileInputRef,
  setShowFileImporter,
  setScript,
  setShowScriptTemplates,
  setIsProcessing,
  generateScriptImprovement,
  applyScriptImprovement,
}) {
  const [showAIWriter, setShowAIWriter] = useState(false);

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="border-gray-300 text-slate-600 hover:bg-gray-100"
          disabled={isProcessing}
        >
          Upload
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFileImporter(true)}
          className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1"
          disabled={isProcessing}
        >
          <FileText className="w-3 h-3" />PDF/Word
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowScriptTemplates(true)}
            disabled={isProcessing}
            className="text-green-600 hover:bg-green-50"
          >
            <BookOpen className="w-4 h-4 mr-1" />Templates
          </Button>
          <HelpTooltip
            title="Modèles de scripts par genre"
            description="Choisissez parmi des genres prédéfinis pour démarrer rapidement votre script."
            steps={[
              'Cliquez sur le bouton vert "Templates".',
              "Sélectionnez un genre (Pub, Tutoriel, Pitch, etc.).",
              "Le modèle se charge automatiquement dans la zone de saisie.",
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <ToneRewriterButton script={script} onRewrite={setScript} language={language || uiLanguage} disabled={isProcessing} />
          <HelpTooltip
            title="Réécriture par ton"
            description="Réécrit votre script avec un ton spécifique grâce à l'IA."
            steps={[
              "Assurez-vous d'avoir un script dans la zone de saisie.",
              'Cliquez sur le bouton "Ton".',
              "Choisissez un ton (Humoristique, Professionnel, Dramatique…).",
            ]}
          />
        </div>

        <div className="flex items-center gap-1">
          <UrlToScriptButton onApplyScript={setScript} language={language || uiLanguage} disabled={isProcessing} />
          <HelpTooltip
            title="Script depuis une URL"
            description="Génère un script vidéo à partir du contenu d'une page web ou d'un article."
            steps={[
              'Cliquez sur le bouton "URL".',
              "Collez l'adresse de la page web source.",
              "L'IA génère un script basé sur le contenu de la page.",
            ]}
          />
        </div>

        <ScriptImproverComponent
          originalScript={script}
          onGenerate={generateScriptImprovement}
          onApply={applyScriptImprovement}
          isProcessing={isProcessing}
          disabled={!script}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAIWriter(true)}
          disabled={isProcessing}
          className="text-amber-600 hover:bg-amber-50"
        >
          <Sparkles className="w-4 h-4 mr-1" />AI Writer
        </Button>
      </div>

      <AIWriterDialog
        isOpen={showAIWriter}
        onClose={() => setShowAIWriter(false)}
        onApply={setScript}
        language={language || uiLanguage}
      />
    </>
  );
}