import { FolderOpen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";
import { formatDate } from "../lib/utils";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loadProject, deleteProject } = useCampaign();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspaces</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Reopen previous local GrowthLens Campaign analyses from SQLite storage.</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {projects.length ? (
          projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between rounded-md border border-border bg-white p-4">
              <div>
                <div className="font-semibold text-slate-950">{project.name}</div>
                <div className="text-sm text-slate-500">
                  {project.clientName || "No client"} · {project.platform || "Custom"} · Updated {formatDate(project.updatedAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const ok = await loadProject(project.id);
                    if (ok) navigate("/dashboard");
                  }}
                >
                  <FolderOpen size={17} />
                  Open Workspace
                </Button>
                <Button variant="ghost" size="icon" onClick={() => void deleteProject(project.id)} aria-label="Delete project">
                  <Trash2 size={17} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No saved workspaces yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
