import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus, Wand2, Loader2, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import DialogueBlock from './DialogueBlock';
import { base44 } from '@/api/base44Client';

let _idCounter = 0;
function newId() {
  return `block-${Date.now()}-${_idCounter++}`;
}

function createBlock(character = 'Narrateur', dialogue = '') {
  return { id: newId(), character, dialogue };
}

export default function DialogueBlockEditor({
  blocks,
  onChange,
  characters = [],
  disabled = false,
  rawScript = '',
}) {
  const [isSplitting, setIsSplitting] = useState(false);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const reordered = Array.from(blocks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  }, [blocks, onChange]);

  const handleUpdate = useCallback((id, updates) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [blocks, onChange]);

  const handleDelete = useCallback((id) => {
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const handleAdd = () => {
    onChange([...blocks, createBlock()]);
  };

  const handleAISplit = async () => {
    if (!rawScript.trim()) {
      toast.error("Collez d'abord un script brut dans la zone de texte.");
      return;
    }
    setIsSplitting(true);
    const toastId = toast.loading("L'IA découpe votre script en blocs...");
    try {
      const characterNames = characters.map(c => c.name);
      const res = await base44.functions.invoke('splitScriptIntoBlocks', {
        script: rawScript,
        characters: characterNames,
      });
      const data = res.data;
      if (data?.blocks && Array.isArray(data.blocks) && data.blocks.length > 0) {
        const newBlocks = data.blocks.map(b => createBlock(b.character || 'Narrateur', b.dialogue || ''));
        onChange(newBlocks);
        toast.success(`Script découpé en ${newBlocks.length} blocs !`, { id: toastId });
      } else {
        toast.error("L'IA n'a pas pu découper le script.", { id: toastId });
      }
    } catch (e) {
      toast.error("Erreur: " + e.message, { id: toastId });
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAISplit}
          disabled={disabled || isSplitting || !rawScript.trim()}
          className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs"
        >
          {isSplitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Découper avec l'IA
        </Button>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {blocks.length} bloc{blocks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Blocks list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dialogue-blocks">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-2"
            >
              {blocks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                  Aucun bloc. Cliquez "Découper avec l'IA" ou ajoutez un bloc manuellement.
                </div>
              )}
              {blocks.map((block, index) => (
                <DialogueBlock
                  key={block.id}
                  block={block}
                  index={index}
                  characters={characters}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  disabled={disabled}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add block */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
        className="border border-dashed border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter un bloc
      </Button>
    </div>
  );
}

// Export helper to assemble blocks back to script string
export function assembleScript(blocks) {
  return blocks
    .filter(b => b.dialogue.trim())
    .map(b => {
      if (b.character && b.character !== 'Aucun') {
        return `${b.character}: ${b.dialogue.trim()}`;
      }
      return b.dialogue.trim();
    })
    .join('\n\n');
}

// Export helper to create initial blocks from raw text
export function textToBlocks(text) {
  if (!text.trim()) return [];
  return text.split(/\n\n+/).filter(p => p.trim()).map(p => {
    const match = p.match(/^([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][A-Za-zÀ-ÿ\s]{1,30}):\s*([\s\S]+)$/);
    if (match) {
      return { id: `block-${Date.now()}-${Math.random()}`, character: match[1].trim(), dialogue: match[2].trim() };
    }
    return { id: `block-${Date.now()}-${Math.random()}`, character: 'Narrateur', dialogue: p.trim() };
  });
}