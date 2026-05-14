import { useNavigate } from "react-router-dom";
import { ColumnMapper } from "../components/mapping/ColumnMapper";
import { DataPreview } from "../components/upload/DataPreview";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";

export function MappingPage() {
  const navigate = useNavigate();
  const { parsedFile, detection, mapping, mappingScore, cleaning, applyMapping } = useCampaign();
  if (!parsedFile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <CardTitle>No uploaded data</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Upload a CSV or Excel campaign report before mapping columns.</p>
          </div>
          <Button onClick={() => navigate("/upload")}>Go to upload</Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Analysis readiness</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Review automatic mapping confidence before analysis.</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={mappingScore >= 90 ? "green" : mappingScore >= 75 ? "amber" : "red"}>{mappingScore}% mapped</Badge>
            {detection?.detectedPlatform ? <Badge tone="teal">{detection.detectedPlatform}</Badge> : <Badge>Custom file</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {detection?.missingRequiredFields.length ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Missing required fields: {detection.missingRequiredFields.map((field) => field.replace(/_/g, " ")).join(", ")}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Required fields were detected. You can still adjust the mapping below.
            </div>
          )}
        </CardContent>
      </Card>
      <ColumnMapper
        parsedFile={parsedFile}
        mapping={mapping}
        onApply={(nextMapping) => {
          if (applyMapping(nextMapping)) navigate("/dashboard");
        }}
      />
      {cleaning?.warnings.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Cleaning warnings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-700">
            {cleaning.warnings.slice(0, 8).map((warning, index) => (
              <div key={index} className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">{warning.message}</div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <DataPreview parsedFile={parsedFile} />
    </div>
  );
}
