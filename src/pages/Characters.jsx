import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, User, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CharacterFormDialog from '../components/characters/CharacterFormDialog';
import CharacterCard from '../components/characters/CharacterCard';

export default function Characters() {
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const queryClient = useQueryClient();

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: () => base44.entities.Character.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Character.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success("Personnage supprimé");
    },
  });

  const handleEdit = (char) => {
    setEditingCharacter(char);
    setShowForm(true);
  };

  const handleDelete = (char) => {
    if (window.confirm(`Supprimer "${char.name}" ?`)) {
      deleteMutation.mutate(char.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              Mes Personnages
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Définissez vos personnages pour une cohérence dans toutes vos scènes.
            </p>
          </div>
          <Button onClick={() => { setEditingCharacter(null); setShowForm(true); }}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau personnage
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : characters.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-gray-900/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4">
                <User className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Aucun personnage</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Créez des personnages avec un nom, une description physique et une voix pour les réutiliser dans vos vidéos.
              </p>
              <Button onClick={() => { setEditingCharacter(null); setShowForm(true); }}
                className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" /> Créer mon premier personnage
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <CharacterFormDialog
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingCharacter(null); }}
          character={editingCharacter}
        />
      </div>
    </div>
  );
}