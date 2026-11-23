import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateFolderDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f59e0b");

  useEffect(() => {
    if (!open) {
      setName("");
      setColor("#f59e0b");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), color });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clients 2025" />
          </div>
          <div className="grid gap-2">
            <Label>Couleur</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 p-0 border rounded" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleCreate} className="bg-slate-900 text-white hover:bg-slate-800">Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}