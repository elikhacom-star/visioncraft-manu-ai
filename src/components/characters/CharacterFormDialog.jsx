import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VOICES_BASE } from '../voiceData';

const INITIAL = { name: '', description: '', personality: '', voice_id: '', voice_gender: 'female', avatar_url: '', tags: [] };

export default function CharacterFormDialog({ isOpen, onClose, character }) {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      if (character) {
        setForm({ ...INITIAL, ...character });
        setTagsInput((character.tags || []).join(', '));
      } else {
        setForm(INITIAL);
        setTagsInput('');
      }
    }
  }, [isOpen, character]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, avatar_url: file_url }));
      toast.success("Avatar uploadé");
    } catch (err) {
      toast.error("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Nom et description requis");
      return;
    }
    setSaving(true);
    const data = { ...form, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (character?.id) {
        await base44.entities.Character.update(character.id, data);
        toast.success("Personnage mis à jour");
      } else {
        await base44.entities.Character.create(data);
        toast.success("Personnage créé");
      }
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      onClose();
    } catch (err) {
      toast.error("Erreur: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-500" />
            {character ? 'Modifier le personnage' : 'Nouveau personnage'}
          </DialogTitle>
          <DialogDescription>
            Définissez un personnage réutilisable dans vos scènes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-violet-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-500 text-2xl font-bold">
                {form.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <Label className="text-xs">Avatar (optionnel)</Label>
              <Input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="text-xs mt-1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nom *</Label>
            <Input placeholder="Ex: Jean Dupont" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description physique *</Label>
            <Textarea placeholder="Ex: Homme de 35 ans, cheveux bruns courts, costume sombre..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-20" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Personnalité</Label>
            <Input placeholder="Ex: Confiant, charismatique, voix posée" value={form.personality} onChange={e => setForm(p => ({ ...p, personality: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Genre de voix</Label>
              <Select value={form.voice_gender} onValueChange={v => setForm(p => ({ ...p, voice_gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Féminine</SelectItem>
                  <SelectItem value="male">Masculine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Voix spécifique</Label>
              <Select value={form.voice_id || '_none'} onValueChange={v => setForm(p => ({ ...p, voice_id: v === '_none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Automatique</SelectItem>
                  {VOICES_BASE.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.gender})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tags (séparés par des virgules)</Label>
            <Input placeholder="Ex: héros, protagoniste, narration" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {character ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}