import { describe, expect, it } from "vitest";
import { detectColumns } from "../src/shared/columnDetection";

describe("column detection", () => {
  it("recognizes common campaign export aliases", () => {
    const result = detectColumns(["Campaign Name", "Link Clicks", "Amount spent", "Impressions", "Purchase value"]);
    expect(result.mapping.campaign_name).toBe("Campaign Name");
    expect(result.mapping.clicks).toBe("Link Clicks");
    expect(result.mapping.spend).toBe("Amount spent");
    expect(result.mapping.impressions).toBe("Impressions");
    expect(result.mapping.revenue).toBe("Purchase value");
    expect(result.missingRequiredFields).toHaveLength(0);
  });
});
