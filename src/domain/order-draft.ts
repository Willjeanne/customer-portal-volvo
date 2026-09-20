import Papa from "papaparse";
import { z } from "zod";
export const draftLineSchema = z.object({
  sku: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/, "Use a SKU or reference without spaces."),
  quantity: z.number().int().min(1).max(9999),
});
export type DraftLine = z.infer<typeof draftLineSchema>;
export function parseOrderCsv(text: string): { lines: DraftLine[]; errors: string[] } {
  if (text.length > 100_000) return { lines: [], errors: ["CSV must be smaller than 100 KB."] };
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" });
  if (parsed.errors.length) return { lines: [], errors: ["CSV formatting is invalid. Check quotes and separators."] };
  const rows = parsed.data;
  if (rows.length && rows[0][0]?.trim().toLowerCase() === "sku") {
    const header = rows.shift()!;
    if (header.length !== 2 || header[1]?.trim().toLowerCase() !== "quantity") return { lines: [], errors: ["Expected the header sku,quantity."] };
  }
  if (rows.length > 200) return { lines: [], errors: ["Import up to 200 rows at a time."] };
  const errors: string[] = []; const merged = new Map<string, number>();
  rows.forEach((row, index) => {
    const quantity = row[1]?.trim() || "";
    const result = draftLineSchema.safeParse({ sku: row[0], quantity: /^\d+$/.test(quantity) ? Number(quantity) : NaN });
    if (row.length !== 2 || !result.success) { errors.push(`Row ${index + 1}: provide a SKU and a whole quantity from 1 to 9999.`); return; }
    const sum = (merged.get(result.data.sku) || 0) + result.data.quantity;
    if (sum > 9999) errors.push(`Row ${index + 1}: combined quantity exceeds 9999.`);
    merged.set(result.data.sku, sum);
  });
  if (!rows.length) errors.push("Add at least one line.");
  return { lines: errors.length ? [] : Array.from(merged, ([sku, quantity]) => ({ sku, quantity })), errors };
}
export function draftCsv(lines: DraftLine[]) {
  return Papa.unparse({ fields: ["sku", "quantity"], data: lines.map(line => [line.sku, line.quantity]) }, { escapeFormulae: true });
}
