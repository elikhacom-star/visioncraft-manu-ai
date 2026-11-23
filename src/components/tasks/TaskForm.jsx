import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function TaskForm({ initialTask, onSubmit, onCancel }) {
  const [task, setTask] = React.useState(
    initialTask || {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      estimated_minutes: undefined,
      due_date: undefined,
    }
  );
  const [estimating, setEstimating] = React.useState(false);

  const handleEstimate = async () => {
    if (!task.title && !task.description) return;
    setEstimating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un chef de projet vidéo. Estime en minutes le temps pour accomplir la tâche suivante. Donne uniquement un nombre entier.\nTitre: ${task.title}\nDescription: ${task.description}`,
        response_json_schema: {
          type: "object",
          properties: { estimated_minutes: { type: "integer" } },
        },
      });
      if (res?.estimated_minutes) {
        setTask({ ...task, estimated_minutes: res.estimated_minutes });
      }
    } finally {
      setEstimating(false);
    }
  };

  const onSave = (e) => {
    e.preventDefault();
    onSubmit?.(task);
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-2">
        <Label>Titre</Label>
        <Input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label>Description</Label>
        <Textarea value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Priorité</Label>
          <Select value={task.priority} onValueChange={(v) => setTask({ ...task, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Statut</Label>
          <Select value={task.status} onValueChange={(v) => setTask({ ...task, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">À faire</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="done">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="grid gap-2">
          <Label>Estimation (min)</Label>
          <Input type="number" value={task.estimated_minutes || ''} onChange={(e) => setTask({ ...task, estimated_minutes: parseInt(e.target.value || '0') })} />
        </div>
        <Button type="button" onClick={handleEstimate} disabled={estimating} className="mt-6">
          <Sparkles className="w-4 h-4 mr-2" /> {estimating ? 'Estimation en cours...' : 'Estimer avec IA'}
        </Button>
      </div>
      <div className="grid gap-2">
        <Label>Échéance</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {task.due_date ? format(new Date(task.due_date), 'PPP') : 'Choisir une date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar 
              mode="single" 
              selected={task.due_date ? new Date(task.due_date) : undefined}
              onSelect={(d) => setTask({ ...task, due_date: d })}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}