import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const GENRES = [
  { value: 'Educational', label: 'Éducatif' },
  { value: 'Marketing', label: 'Marketing / Pub' },
  { value: 'Documentary', label: 'Documentaire' },
  { value: 'Story', label: 'Histoire / Fiction' },
  { value: 'Tutorial', label: 'Tutoriel' },
  { value: 'Social Media', label: 'Réseaux sociaux' },
];

export default function AIWriterDialog({ isOpen, onClose, onApply, language }) {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Educational');
  const [duration, setDuration] = useState('60s');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Saisissez un sujet ou une description.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await base44.functions.invoke('generateScript', { topic, genre, duration, language });
      if (res.data?.script) {
        onApply(res.data.script);
        toast.success("Script généré !");
        onClose();
        setTopic('');
      } else {
        toast.error("Échec de génération du script.");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Générer un script avec l'IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Sujet ou description</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Une vidéo sur les bienfaits du café pour la santé..."
              rows={3}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Genre</label>
              <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENRES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Durée cible</label>
              <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30s">30 secondes</SelectItem>
                  <SelectItem value="60s">1 minute</SelectItem>
                  <SelectItem value="90s">1 min 30</SelectItem>
                  <SelectItem value="120s">2 minutes</SelectItem>
                  <SelectItem value="3min">3 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Annuler</Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération...</> : <><Sparkles className="w-4 h-4 mr-2" />Générer</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}