import { describe, expect, it } from "vitest";
import { detectColumns } from "../src/shared/columnDetection";
import { cleanCampaignData, parseDate, parseNumber } from "../src/shared/dataCleaning";

describe("data cleaning", () => {
  it("converts currency, commas, percentages, and spreadsheet dates", () => {
    expect(parseNumber("$1,200.50")).toBe(1200.5);
    expect(parseNumber("4.5%")).toBe(0.045);
    expect(parseNumber("1,000")).toBe(1000);
    expect(parseDate(45384)).toMatch(/2024-/);
  });

  it("cleans mapped campaign rows and removes duplicates", () => {
    const rows = [
      { Campaign: "Brand", Impressions: "1,000", Clicks: "50", Spend: "$100.00", Purchases: "5", Revenue: "$500" },
      { Campaign: "Brand", Impressions: "1,000", Clicks: "50", Spend: "$100.00", Purchases: "5", Revenue: "$500" },
      { Campaign: "", Impressions: "", Clicks: "", Spend: "" }
    ];
    const mapping = detectColumns(Object.keys(rows[0])).mapping;
    const result = cleanCampaignData(rows, mapping);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.duplicateRows).toBe(1);
    expect(result.rows[0].spend).toBe(100);
    expect(result.rows[0].revenue).toBe(500);
  });

  it("returns a clear error when required columns are missing", () => {
    const result = cleanCampaignData([{ Campaign: "A", Spend: "10" }], { campaign_name: "Campaign", spend: "Spend" });
    expect(result.errors[0].message).toContain("Required fields are missing");
  });
});
