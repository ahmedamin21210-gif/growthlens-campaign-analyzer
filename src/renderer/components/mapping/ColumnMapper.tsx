import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { standardFields, type ColumnMapping, type ParsedCampaignFile, type StandardField } from "@shared/types";
import { requiredMappingFields } from "@shared/columnDetection";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Select } from "../ui/Form";
import { Badge } from "../ui/Badge";

const labels: Record<StandardField, string> = Object.fromEntries(
  standardFields.map((field) => [field, field.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())])
) as Record<StandardField, string>;

export function ColumnMapper({
  parsedFile,
  mapping,
  onApply
}: {
  parsedFile: ParsedCampaignFile;
  mapping: ColumnMapping;
  onApply: (mapping: ColumnMapping) => void;
}) {
  const [draft, setDraft] = useState<ColumnMapping>(mapping);
  const required = useMemo(() => requiredMappingFields(), []);
  const recommended: StandardField[] = ["date", "conversions", "revenue", "purchases", "leads", "platform"];

  const sections: Array<{ title: string; fields: StandardField[] }> = [
    { title: "Required fields", fields: required },
    { title: "Recommended fields", fields: recommended },
    { title: "Optional dimensions and platform metrics", fields: standardFields.filter((field) => !required.includes(field) && !recommended.includes(field)) }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Analysis mapping</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Confirm detected fields or manually map custom report columns.</p>
        </div>
        <Button onClick={() => onApply(draft)}>
          <CheckCircle2 size={17} />
          Run Analysis
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
              {section.title === "Required fields" ? <Badge tone="red">Required</Badge> : <Badge>Optional</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {section.fields.map((field) => (
                <div key={field} className="grid grid-cols-[190px_24px_1fr] items-center gap-3 rounded-2xl border border-brand-border bg-slate-50 px-3 py-2">
                  <div className="text-sm font-medium text-slate-700">{labels[field]}</div>
                  <ArrowRight size={16} className="text-slate-400" />
                  <Select
                    value={draft[field] ?? ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value || undefined }))}
                  >
                    <option value="">Not mapped</option>
                    {parsedFile.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
