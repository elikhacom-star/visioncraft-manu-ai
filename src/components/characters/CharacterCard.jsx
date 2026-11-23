import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User } from "lucide-react";

export default function CharacterCard({ character, onEdit, onDelete }) {
  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {character.avatar_url ? (
            <img src={character.avatar_url} alt={character.name} className="w-14 h-14 rounded-full object-cover border-2 border-violet-200 shadow" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900 dark:to-purple-800 flex items-center justify-center text-violet-600 dark:text-violet-300 font-bold text-lg shrink-0">
              {character.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{character.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{character.description}</p>
            {character.personality && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic line-clamp-1">{character.personality}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200">
                {character.voice_gender === 'male' ? '♂ Masculine' : '♀ Féminine'}
              </Badge>
              {character.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => onEdit(character)}>
            <Edit className="w-3 h-3 mr-1" /> Modifier
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200" onClick={() => onDelete(character)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}