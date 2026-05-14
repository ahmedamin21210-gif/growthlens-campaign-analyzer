import { useNavigate } from "react-router-dom";
import { CampaignTable } from "../components/campaigns/CampaignTable";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";

export function CampaignsPage() {
  const navigate = useNavigate();
  const { analysis } = useCampaign();
  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <CardTitle>No analysis table yet</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Upload campaign data and run the analyzer first.</p>
          </div>
          <Button onClick={() => navigate("/upload")}>Upload Campaign Data</Button>
        </CardContent>
      </Card>
    );
  }
  return <CampaignTable campaigns={analysis.campaigns} />;
}
