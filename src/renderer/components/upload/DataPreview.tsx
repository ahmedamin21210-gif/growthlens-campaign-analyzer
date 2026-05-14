import type { ParsedCampaignFile } from "@shared/types";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function DataPreview({ parsedFile }: { parsedFile: ParsedCampaignFile }) {
  const headers = parsedFile.headers.slice(0, 12);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Data preview</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{parsedFile.fileName}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="teal">{parsedFile.rowCount.toLocaleString()} rows</Badge>
          <Badge tone="blue">{parsedFile.columnCount} columns</Badge>
          {parsedFile.detectedPlatform ? <Badge tone="green">{parsedFile.detectedPlatform}</Badge> : <Badge>Custom report</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {parsedFile.warnings.length ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {parsedFile.warnings.slice(0, 3).join(" · ")}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-brand-border">
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>{headers.map((header) => <th key={header} className="border-b border-border px-3 py-2 font-semibold">{header}</th>)}</tr>
              </thead>
              <tbody>
                {parsedFile.previewRows.slice(0, 20).map((row, index) => (
                  <tr key={index} className="odd:bg-white even:bg-slate-50/60">
                    {headers.map((header) => (
                      <td key={header} className="max-w-56 truncate border-b border-border px-3 py-2 text-slate-700">
                        {String(row[header] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
