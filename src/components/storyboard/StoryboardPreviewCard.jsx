import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Save, FolderOpen } from "lucide-react";
import StoryboardSceneItem from '../StoryboardSceneItem';
import DialogueModeToggle from './DialogueModeToggle';
import SaveStoryboardDialog from './SaveStoryboardDialog';
import LoadStoryboardDialog from './LoadStoryboardDialog';

export default function StoryboardPreviewCard({
  storyboard,
  script,
  generatedImages,
  dialogueMode,
  onDialogueModeChange,
  onUpdateScene,
  onBranchNarrative,
  onAdvancedStoryboard,
  onLoadStoryboard
}) {
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  return (
    <>
      <Card className="bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Film className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="truncate">{storyboard.title}</span>
              </CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {storyboard.scenes?.length} scènes • {storyboard.total_duration}s estimé
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowSave(true)} className="h-7 px-2 text-[11px] border-green-200 text-green-700 hover:bg-green-50">
                <Save className="w-3 h-3 mr-1" />Sauvegarder
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLoad(true)} className="h-7 px-2 text-[11px] border-blue-200 text-blue-700 hover:bg-blue-50">
                <FolderOpen className="w-3 h-3 mr-1" />Charger
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <DialogueModeToggle mode={dialogueMode} onChange={onDialogueModeChange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {storyboard.scenes?.map((scene, index) => (
              <StoryboardSceneItem
                key={scene.scene_number}
                scene={scene}
                index={index}
                onUpdate={onUpdateScene}
                onBranchNarrative={onBranchNarrative}
                onAdvancedStoryboard={onAdvancedStoryboard}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <SaveStoryboardDialog
        isOpen={showSave}
        onClose={() => setShowSave(false)}
        storyboard={storyboard}
        script={script}
      />
      <LoadStoryboardDialog
        isOpen={showLoad}
        onClose={() => setShowLoad(false)}
        onLoad={onLoadStoryboard}
      />
    </>
  );
}