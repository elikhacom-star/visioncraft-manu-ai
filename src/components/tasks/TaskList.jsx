import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Clock, Pencil } from "lucide-react";
import TaskForm from "./TaskForm";

export default function TaskList({ projectId }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] })
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ ...data, project_id: projectId });
    }
    setOpen(false);
    setEditing(null);
  };

  const estimateFor = async (task) => {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Estime le temps en minutes pour cette tâche. Donne un nombre entier.\n${JSON.stringify({title: task.title, description: task.description})}`,
      response_json_schema: { type: "object", properties: { estimated_minutes: { type: "integer" } } }
    });
    if (res?.estimated_minutes) {
      updateMutation.mutate({ id: task.id, data: { estimated_minutes: res.estimated_minutes } });
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tâches</h3>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Ajouter</Button>
        </div>

        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{t.title}</span>
                  <Badge variant="outline">{t.priority || 'medium'}</Badge>
                  {t.estimated_minutes && (
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.estimated_minutes} min</span>
                  )}
                </div>
                {t.description && <p className="text-sm text-slate-600 line-clamp-2">{t.description}</p>}
              </div>

              <Select value={t.status} onValueChange={(v) => updateMutation.mutate({ id: t.id, data: { status: v } })}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={() => setEditing(t)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="outline" onClick={() => estimateFor(t)}><Clock className="w-4 h-4 mr-1" /> Estimer</Button>
              {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </div>
          ))}
        </div>

        <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
            </DialogHeader>
            <TaskForm initialTask={editing || undefined} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(null); }} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}