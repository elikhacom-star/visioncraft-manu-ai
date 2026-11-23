import React, { useEffect, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CHARACTER_COLORS = [
  'border-l-amber-400',
  'border-l-blue-400',
  'border-l-green-400',
  'border-l-purple-400',
  'border-l-pink-400',
  'border-l-teal-400',
  'border-l-orange-400',
  'border-l-indigo-400',
];

export default function DialogueBlock({ block, index, characters, onUpdate, onDelete, disabled }) {
  const [localDialogue, setLocalDialogue] = useState(block.dialogue);

  useEffect(() => {
    setLocalDialogue(block.dialogue);
  }, [block.dialogue]);

  const handleBlur = () => {
    if (localDialogue !== block.dialogue) {
      onUpdate(block.id, { dialogue: localDialogue });
    }
  };

  const charIndex = characters.findIndex(c => c.name === block.character);
  const colorClass = charIndex >= 0 ? CHARACTER_COLORS[charIndex % CHARACTER_COLORS.length] : 'border-l-gray-300';

  const characterOptions = [
    { value: 'Narrateur', label: '🎙️ Narrateur' },
    { value: 'Aucun', label: '— Aucun (ambiance)' },
    ...characters.map(c => ({ value: c.name, label: `👤 ${c.name}` })),
  ];

  return (
    <Draggable draggableId={block.id} index={index} isDragDisabled={disabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex gap-2 items-start bg-white dark:bg-gray-900 rounded-lg border border-l-4 ${colorClass} shadow-sm p-3 transition-shadow ${snapshot.isDragging ? 'shadow-xl opacity-90' : ''}`}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Character selector */}
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <Select
                value={block.character}
                onValueChange={(val) => onUpdate(block.id, { character: val })}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-xs border-gray-200 bg-slate-50 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {characterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dialogue textarea */}
            <textarea
              value={localDialogue}
              onChange={(e) => setLocalDialogue(e.target.value)}
              onBlur={handleBlur}
              disabled={disabled}
              rows={2}
              className="w-full text-sm bg-transparent border border-gray-200 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 placeholder-gray-400 focus:border-amber-400 focus:outline-none resize-none"
              placeholder="Texte du dialogue..."
            />
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
            onClick={() => onDelete(block.id)}
            disabled={disabled}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}