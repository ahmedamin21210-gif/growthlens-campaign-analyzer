import Papa from "papaparse";
import * as XLSX from "@e965/xlsx";
import { detectPlatform } from "./columnDetection";
import type { ParsedCampaignFile, RawCampaignRow } from "./types";

function normalizeRows(rows: RawCampaignRow[]): { rows: RawCampaignRow[]; headers: string[] } {
  const headers: string[] = [];
  const seen = new Set<string>();
  const normalizedRows = rows.map((row) => {
    const normalized: RawCampaignRow = {};
    for (const [key, value] of Object.entries(row)) {
      const base = key.trim() || "Unnamed Column";
      let header = base;
      let index = 2;
      while (seen.has(header) && !headers.includes(header)) {
        header = `${base} ${index}`;
        index += 1;
      }
      if (!headers.includes(header)) headers.push(header);
      seen.add(header);
      normalized[header] = typeof value === "string" ? value.trim() : value;
    }
    return normalized;
  });
  return { rows: normalizedRows, headers };
}

export function parseCsvText(fileName: string, text: string, filePath?: string): ParsedCampaignFile {
  const result = Papa.parse<RawCampaignRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });
  const warnings = result.errors.map((error) => `Row ${error.row ?? "unknown"}: ${error.message}`);
  const { rows, headers } = normalizeRows(result.data.filter((row) => Object.keys(row).length > 0));
  return {
    fileName,
    filePath,
    rowCount: rows.length,
    columnCount: headers.length,
    headers,
    rows,
    previewRows: rows.slice(0, 20),
    detectedPlatform: detectPlatform(headers),
    warnings
  };
}

export function parseWorkbookBuffer(fileName: string, buffer: ArrayBuffer | Uint8Array, filePath?: string): ParsedCampaignFile {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The workbook does not contain any sheets.");
  }
  const worksheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json<RawCampaignRow>(worksheet, { defval: "", raw: false });
  const { rows, headers } = normalizeRows(jsonRows);
  return {
    fileName,
    filePath,
    rowCount: rows.length,
    columnCount: headers.length,
    headers,
    rows,
    previewRows: rows.slice(0, 20),
    detectedPlatform: detectPlatform(headers),
    warnings: []
  };
}

export function parseByExtension(fileName: string, content: string | ArrayBuffer | Uint8Array, filePath?: string): ParsedCampaignFile {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "csv") {
    if (typeof content !== "string") {
      const decoder = new TextDecoder();
      return parseCsvText(fileName, decoder.decode(content), filePath);
    }
    return parseCsvText(fileName, content, filePath);
  }
  if (extension === "xlsx" || extension === "xls") {
    if (typeof content === "string") {
      throw new Error("Excel files must be parsed from binary content.");
    }
    return parseWorkbookBuffer(fileName, content, filePath);
  }
  throw new Error("Unsupported file type. Please choose a CSV, XLSX, or XLS file.");
}
