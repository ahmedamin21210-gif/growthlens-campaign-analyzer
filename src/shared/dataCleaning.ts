import type { CampaignRow, CleaningIssue, CleaningResult, ColumnMapping, RawCampaignRow, StandardField } from "./types";

const numericFields: StandardField[] = [
  "impressions",
  "clicks",
  "spend",
  "conversions",
  "conversion_value",
  "revenue",
  "purchases",
  "leads",
  "ctr",
  "cpc",
  "cpm",
  "cpa",
  "roas"
];

function raw(row: RawCampaignRow, mapping: ColumnMapping, field: StandardField): unknown {
  const column = mapping[field];
  return column ? row[column] : undefined;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function parseNumber(value: unknown): number | null {
  if (isBlank(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const original = String(value).trim();
  const isPercent = original.includes("%");
  const isNegativeParentheses = /^\(.*\)$/.test(original);
  const cleaned = original
    .replace(/[,$£€¥₹%\s]/g, "")
    .replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  const signed = isNegativeParentheses ? -Math.abs(parsed) : parsed;
  return isPercent ? signed / 100 : signed;
}

export function parseDate(value: unknown): string | undefined {
  if (isBlank(value)) return undefined;
  if (typeof value === "number" && value > 25569 && value < 60000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);

  const parts = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!parts) return undefined;
  const [, a, b, c] = parts;
  const year = c.length === 2 ? Number(`20${c}`) : Number(c);
  const monthFirst = Number(a) <= 12;
  const month = monthFirst ? Number(a) - 1 : Number(b) - 1;
  const day = monthFirst ? Number(b) : Number(a);
  const parsed = new Date(Date.UTC(year, month, day));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function textValue(value: unknown): string | undefined {
  if (isBlank(value)) return undefined;
  return String(value).trim().replace(/\s+/g, " ");
}

function nonNegative(value: number | null, field: StandardField, rowIndex: number, warnings: CleaningIssue[]): number | undefined {
  if (value === null) return undefined;
  if (value < 0) {
    warnings.push({
      rowIndex,
      field,
      severity: "warning",
      message: `Negative ${field.replace(/_/g, " ")} was changed to 0.`
    });
    return 0;
  }
  return value;
}

function hasAnyValue(row: RawCampaignRow): boolean {
  return Object.values(row).some((value) => !isBlank(value));
}

export function cleanCampaignData(rawRows: RawCampaignRow[], mapping: ColumnMapping): CleaningResult {
  const warnings: CleaningIssue[] = [];
  const errors: CleaningIssue[] = [];
  const required: StandardField[] = ["campaign_name", "impressions", "clicks", "spend"];
  const missingRequired = required.filter((field) => !mapping[field]);

  if (missingRequired.length > 0) {
    errors.push({
      severity: "error",
      message: `Required fields are missing: ${missingRequired.map((field) => field.replace(/_/g, " ")).join(", ")}.`
    });
    return { rows: [], warnings, errors, duplicateRows: 0, removedRows: rawRows.length, missingValueCount: 0 };
  }

  const rows: CampaignRow[] = [];
  const seen = new Set<string>();
  let duplicateRows = 0;
  let removedRows = 0;
  let missingValueCount = 0;

  rawRows.forEach((sourceRow, rowIndex) => {
    if (!hasAnyValue(sourceRow)) {
      removedRows += 1;
      return;
    }

    const mappedNumeric: Partial<Record<StandardField, number>> = {};
    for (const field of numericFields) {
      const value = parseNumber(raw(sourceRow, mapping, field));
      if (value === null && mapping[field]) missingValueCount += 1;
      const cleaned = nonNegative(value, field, rowIndex + 1, warnings);
      if (cleaned !== undefined) mappedNumeric[field] = cleaned;
    }

    const campaignName = textValue(raw(sourceRow, mapping, "campaign_name"));
    const impressions = mappedNumeric.impressions;
    const clicks = mappedNumeric.clicks;
    const spend = mappedNumeric.spend;

    if (!campaignName || impressions === undefined || clicks === undefined || spend === undefined) {
      removedRows += 1;
      warnings.push({
        rowIndex: rowIndex + 1,
        severity: "warning",
        message: "Row was skipped because campaign name, impressions, clicks, or spend is missing."
      });
      return;
    }

    if (clicks > impressions && impressions > 0) {
      warnings.push({
        rowIndex: rowIndex + 1,
        field: "clicks",
        severity: "warning",
        message: "Clicks are higher than impressions. The row was kept but flagged for review."
      });
    }

    const row: CampaignRow = {
      date: parseDate(raw(sourceRow, mapping, "date")),
      campaignName,
      adsetName: textValue(raw(sourceRow, mapping, "adset_name")),
      adName: textValue(raw(sourceRow, mapping, "ad_name")),
      impressions,
      clicks,
      spend,
      conversions: mappedNumeric.conversions ?? mappedNumeric.purchases ?? mappedNumeric.leads ?? 0,
      conversionValue: mappedNumeric.conversion_value,
      revenue: mappedNumeric.revenue ?? mappedNumeric.conversion_value ?? 0,
      leads: mappedNumeric.leads ?? 0,
      purchases: mappedNumeric.purchases ?? 0,
      platform: textValue(raw(sourceRow, mapping, "platform")),
      objective: textValue(raw(sourceRow, mapping, "objective")),
      country: textValue(raw(sourceRow, mapping, "country")),
      device: textValue(raw(sourceRow, mapping, "device")),
      age: textValue(raw(sourceRow, mapping, "age")),
      gender: textValue(raw(sourceRow, mapping, "gender"))
    };

    const duplicateKey = JSON.stringify(row);
    if (seen.has(duplicateKey)) {
      duplicateRows += 1;
      warnings.push({
        rowIndex: rowIndex + 1,
        severity: "info",
        message: "Duplicate row removed."
      });
      return;
    }
    seen.add(duplicateKey);
    rows.push(row);
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push({
      severity: "error",
      message: "No usable campaign rows were found after cleaning."
    });
  }

  return { rows, warnings, errors, duplicateRows, removedRows, missingValueCount };
}
