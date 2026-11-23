import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Trash2, Loader2, Film, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function LoadStoryboardDialog({ isOpen, onClose, onLoad }) {
  const queryClient = useQueryClient();

  const { data: savedStoryboards = [], isLoading } = useQuery({
    queryKey: ['savedStoryboards'],
    queryFn: () => base44.entities.SavedStoryboard.list('-created_date', 50),
    enabled: isOpen
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce storyboard sauvegardé ?")) return;
    try {
      await base44.entities.SavedStoryboard.delete(id);
      queryClient.invalidateQueries({ queryKey: ['savedStoryboards'] });
      toast.success("Storyboard supprimé");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleLoad = (saved) => {
    onLoad(saved);
    onClose();
    toast.success(`Storyboard "${saved.name}" chargé !`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            Charger un Storyboard
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : savedStoryboards.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Film className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Aucun storyboard sauvegardé</p>
              <p className="text-xs mt-1">Générez un storyboard et sauvegardez-le pour le réutiliser.</p>
            </div>
          ) : (
            savedStoryboards.map((saved) => (
              <div
                key={saved.id}
                onClick={() => handleLoad(saved)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{saved.name}</h4>
                    {saved.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{saved.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        <Film className="w-3 h-3 mr-1" />{saved.scene_count || '?'} scènes
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />{saved.total_duration || '?'}s
                      </Badge>
                      {saved.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(saved.id, e)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}