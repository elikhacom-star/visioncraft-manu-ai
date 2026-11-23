import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Trash2, Eye } from "lucide-react";

/**
 * CharacterConsistencyPanel — Lets users define persistent character descriptions
 * that get injected into every image generation prompt for visual consistency.
 */
export default function CharacterConsistencyPanel({ isOpen, onClose, characters, onSave }) {
  const [localChars, setLocalChars] = useState(characters || []);

  const addCharacter = () => {
    setLocalChars([...localChars, { name: '', appearance: '', role: '' }]);
  };

  const updateChar = (index, field, value) => {
    const updated = [...localChars];
    updated[index] = { ...updated[index], [field]: value };
    setLocalChars(updated);
  };

  const removeChar = (index) => {
    setLocalChars(localChars.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const valid = localChars.filter(c => c.name.trim() && c.appearance.trim());
    onSave(valid);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Cohérence des Personnages
          </DialogTitle>
          <DialogDescription>
            Décrivez vos personnages pour maintenir une apparence cohérente entre les scènes. Ces descriptions seront injectées dans chaque prompt de génération d'image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localChars.map((char, i) => (
            <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">Personnage {i + 1}</Badge>
                <Button variant="ghost" size="sm" onClick={() => removeChar(i)} className="h-6 w-6 p-0 text-red-400 hover:text-red-600">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Nom</Label>
                  <Input
                    placeholder="ex: Marie"
                    value={char.name}
                    onChange={(e) => updateChar(i, 'name', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Rôle</Label>
                  <Input
                    placeholder="ex: Protagoniste"
                    value={char.role}
                    onChange={(e) => updateChar(i, 'role', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px]">Apparence physique détaillée</Label>
                <Textarea
                  placeholder="ex: Femme de 30 ans, cheveux noirs longs, yeux verts, veste en cuir marron, jean bleu, taille moyenne, peau claire"
                  value={char.appearance}
                  onChange={(e) => updateChar(i, 'appearance', e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addCharacter} className="w-full border-dashed gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un personnage
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Build character consistency prompt to inject into image generation
 */
export function buildCharacterPrompt(characters) {
  if (!characters || characters.length === 0) return '';
  
  const descriptions = characters.map(c => 
    `CHARACTER "${c.name}"${c.role ? ` (${c.role})` : ''}: ${c.appearance}`
  ).join('\n');
  
  return `\n\nCRITICAL CHARACTER CONSISTENCY - Maintain EXACT appearance across all scenes:\n${descriptions}\nIf any of these characters appear in this scene, they MUST look exactly as described above.`;
}