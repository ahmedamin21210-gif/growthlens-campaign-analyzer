import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "@e965/xlsx";
import { parseByExtension } from "../src/shared/fileParsing";

describe("file parsing", () => {
  it("parses the sample CSV", () => {
    const csv = fs.readFileSync(path.join(process.cwd(), "sample-data/campaign_sample.csv"), "utf8");
    const parsed = parseByExtension("campaign_sample.csv", csv);
    expect(parsed.rowCount).toBeGreaterThanOrEqual(100);
    expect(parsed.headers).toContain("Campaign Name");
  });

  it("parses XLSX buffers", () => {
    const sheet = XLSX.utils.json_to_sheet([{ "Campaign Name": "A", Impressions: 100, Clicks: 10, Spend: 50 }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Data");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = parseByExtension("sample.xlsx", buffer);
    expect(parsed.rowCount).toBe(1);
    expect(parsed.headers).toContain("Spend");
  });
});
