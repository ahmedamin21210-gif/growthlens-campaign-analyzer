import { Download, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportPreview } from "../components/reports/ReportPreview";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Form";
import { useCampaign } from "../state/CampaignContext";

export function ReportsPage() {
  const navigate = useNavigate();
  const { analysis, aiInsights, settings, exportPdf, saveCurrentProject, activeProject, parsedFile } = useCampaign();
  const [name, setName] = useState(activeProject?.name ?? parsedFile?.fileName?.replace(/\.[^.]+$/, "") ?? "Campaign Analysis");
  const [client, setClient] = useState(activeProject?.clientName ?? settings.branding.clientName ?? "");
  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <CardTitle>No Executive Brief available</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Analyze campaign data before exporting an Executive Brief.</p>
          </div>
          <Button onClick={() => navigate("/upload")}>Upload Campaign Data</Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-3">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Workspace name
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Client name
            <Input value={client} onChange={(event) => setClient(event.target.value)} />
          </label>
          <Button variant="secondary" onClick={() => void saveCurrentProject(name, client)}>
            <Save size={17} />
            Save Workspace
          </Button>
          <Button onClick={() => void exportPdf()}>
            <Download size={17} />
            Export Executive Brief
          </Button>
        </CardContent>
      </Card>
      <ReportPreview analysis={analysis} aiInsights={aiInsights} branding={{ ...settings.branding, clientName: client }} />
    </div>
  );
}
