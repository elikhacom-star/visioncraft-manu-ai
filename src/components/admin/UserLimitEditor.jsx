import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap } from "lucide-react";

export default function UserLimitEditor({ isOpen, onClose, user, onSave }) {
    const [monthlyLimit, setMonthlyLimit] = useState(user?.monthly_video_limit || 50);
    const [currentCount, setCurrentCount] = useState(user?.monthly_video_count || 0);

    const handleSave = () => {
        onSave({
            monthly_video_limit: monthlyLimit,
            monthly_video_count: currentCount
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Modifier les Limites - {user?.full_name}
                    </DialogTitle>
                    <DialogDescription>
                        Ajustez la limite mensuelle de génération et le compteur actuel.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label>Limite Mensuelle de Vidéos</Label>
                        <div className="flex items-center gap-4">
                            <Slider 
                                value={[monthlyLimit]} 
                                onValueChange={([v]) => setMonthlyLimit(v)}
                                min={0}
                                max={500}
                                step={5}
                                className="flex-1"
                            />
                            <Input 
                                type="number"
                                value={monthlyLimit}
                                onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 0)}
                                className="w-20"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Définissez combien de vidéos cet utilisateur peut générer par mois.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label>Compteur Actuel (Ce mois)</Label>
                        <Input 
                            type="number"
                            value={currentCount}
                            onChange={(e) => setCurrentCount(parseInt(e.target.value) || 0)}
                            className="w-full"
                        />
                        <p className="text-xs text-slate-500">
                            Nombre de vidéos déjà générées ce mois. Vous pouvez le réinitialiser à 0.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> La limite s'applique au cycle mensuel. 
                            Le compteur se réinitialise automatiquement chaque mois.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}