import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SaveStoryboardDialog({ isOpen, onClose, storyboard, script }) {
  const [name, setName] = useState(storyboard?.title || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Donnez un nom au storyboard"); return; }
    setIsSaving(true);
    try {
      await base44.entities.SavedStoryboard.create({
        name: name.trim(),
        description: description.trim(),
        scene_count: storyboard?.scenes?.length || 0,
        total_duration: storyboard?.total_duration || 0,
        storyboard_data: storyboard,
        original_script: script || '',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success("Storyboard sauvegardé !");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-amber-500" />
            Sauvegarder le Storyboard
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nom</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mon storyboard Palestine" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Description (optionnel)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brève description..." className="h-20" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Tags (séparés par des virgules)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="poésie, politique, documentaire" />
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded">
            {storyboard?.scenes?.length || 0} scènes • {storyboard?.total_duration || 0}s
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}