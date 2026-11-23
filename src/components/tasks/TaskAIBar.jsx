import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ListChecks, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function TaskAIBar({ projectId, onTasksCreated }) {
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggested, setSuggested] = React.useState([]);
  const [selected, setSelected] = React.useState({});
  const [report, setReport] = React.useState(null);

  const toggle = (idx) => setSelected((s) => ({ ...s, [idx]: !s[idx] }));

  const suggestTasks = async () => {
    setLoading(true);
    try {
      const [project] = await base44.entities.Project.filter({ id: projectId });
      const context = JSON.stringify({
        name: project?.name,
        description: project?.description,
        script: project?.script,
        settings: project?.settings,
        storyboard_data: project?.storyboard_data,
      });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un chef de projet vidéo. En te basant sur le contenu JSON suivant, propose une liste de tâches détaillées pour mener le projet à bien. Réponds en JSON selon le schéma.\nCONTEXTE:\n${context}`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  estimated_minutes: { type: "integer" }
                }
              }
            }
          }
        }
      });
      setSuggested(res?.tasks || []);
      setSelected({});
      setSuggestionsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const createSelected = async () => {
    const toCreate = suggested
      .filter((_, i) => selected[i])
      .map((t) => ({ ...t, project_id: projectId, status: 'todo', priority: t.priority || 'medium' }));
    if (toCreate.length === 0) return;
    if (toCreate.length === 1) {
      await base44.entities.Task.create(toCreate[0]);
    } else {
      await base44.entities.Task.bulkCreate(toCreate);
    }
    onTasksCreated?.();
    setSuggestionsOpen(false);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const tasks = await base44.entities.Task.filter({ project_id: projectId });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un rapport d'avancement clair et actionnable basé sur ces tâches (JSON). Inclusions: pourcentage d'avancement, tâches clés réalisées, tâches en retard (si due_date dépassée), risques, prochaines actions. Retourne JSON suivant le schéma.\nTACHES:\n${JSON.stringify(tasks)}`,
        response_json_schema: {
          type: "object",
          properties: {
            percent_complete: { type: "number" },
            summary_markdown: { type: "string" },
            next_actions: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } }
          }
        }
      });
      setReport(res);
      setReportOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap gap-2">
        <Button onClick={suggestTasks} disabled={!projectId || loading} className="gap-2">
          <Sparkles className="w-4 h-4" /> Suggérer des tâches (IA)
        </Button>
        <Button onClick={generateReport} disabled={!projectId || loading} variant="outline" className="gap-2">
          <FileText className="w-4 h-4" /> Rapport d'avancement (IA)
        </Button>

        {/* Suggestions Dialog */}
        <Dialog open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ListChecks className="w-4 h-4" /> Tâches suggérées</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-3">
                {suggested.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune suggestion.</p>
                ) : (
                  suggested.map((t, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <input type="checkbox" checked={!!selected[i]} onChange={() => toggle(i)} className="mt-1" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.title}</span>
                          {t.priority && <Badge variant="secondary">{t.priority}</Badge>}
                          {t.estimated_minutes && <Badge>~{t.estimated_minutes} min</Badge>}
                        </div>
                        {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuggestionsOpen(false)}>Annuler</Button>
              <Button onClick={createSelected} disabled={!Object.values(selected).some(Boolean)}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rapport d'avancement</DialogTitle>
            </DialogHeader>
            {report ? (
              <div className="space-y-3">
                <Badge>Progression: {Math.round(report.percent_complete || 0)}%</Badge>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{report.summary_markdown || ''}</ReactMarkdown>
                </div>
                {report.next_actions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Prochaines actions</h4>
                    <ul className="list-disc ml-5 text-sm">
                      {report.next_actions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {report.risks?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Risques</h4>
                    <ul className="list-disc ml-5 text-sm">
                      {report.risks.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
            </div>
            ) : (
              <p className="text-sm text-slate-500">Génération du rapport...</p>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}