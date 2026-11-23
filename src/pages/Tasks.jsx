import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TaskAIBar from "../components/tasks/TaskAIBar";
import TaskList from "../components/tasks/TaskList";

export default function Tasks() {
  const [projectId, setProjectId] = React.useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 50)
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tâches & IA</h1>
          <div className="w-64">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!projectId ? (
          <Alert>
            <AlertTitle>Choisissez un projet</AlertTitle>
            <AlertDescription>Sélectionnez un projet pour gérer les tâches et utiliser l'IA.</AlertDescription>
          </Alert>
        ) : (
          <>
            <TaskAIBar projectId={projectId} onTasksCreated={() => { /* react-query will refetch via invalidation in list */ }} />
            <TaskList projectId={projectId} />
          </>
        )}
      </div>
    </div>
  );
}