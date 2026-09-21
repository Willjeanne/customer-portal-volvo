/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « import xlsx », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-XLSX.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { parseOrderXlsx } from "../src/domain/order-xlsx";

/**
 * Écrit une archive ZIP à entrées **non compressées**.
 *
 * Deux raisons : fabriquer un classeur à la manière d'Excel sans dépendance, et
 * exercer la branche « méthode 0 » qu'un fichier Excel réel n'emprunte jamais.
 */
function zip(files: Record<string, string>): ArrayBuffer {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const body = encoder.encode(content);
    const local = new Uint8Array(30 + nameBytes.length + body.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(8, 0, true); // stocké
    localView.setUint32(18, body.length, true);
    localView.setUint32(22, body.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(body, 30 + nameBytes.length);
    locals.push(local);

    const entry = new Uint8Array(46 + nameBytes.length);
    const entryView = new DataView(entry.buffer);
    entryView.setUint32(0, 0x02014b50, true);
    entryView.setUint16(10, 0, true);
    entryView.setUint32(20, body.length, true);
    entryView.setUint32(24, body.length, true);
    entryView.setUint16(28, nameBytes.length, true);
    entryView.setUint32(42, offset, true);
    entry.set(nameBytes, 46);
    central.push(entry);
    offset += local.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, central.length, true);
  endView.setUint16(10, central.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const parts = [...locals, ...central, end];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out.buffer;
}

/** Classeur à la manière d'Excel : chaînes partagées et cible relative. */
function excelWorkbook(rows: string): ArrayBuffer {
  return zip({
    "xl/workbook.xml":
      '<workbook xmlns:r="http://x"><sheets><sheet name="Feuil1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/sharedStrings.xml":
      "<sst><si><t>sku</t></si><si><t>quantity</t></si><si><t>21811707</t></si><si><t>3987120</t></si></sst>",
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData>${rows}</sheetData></worksheet>`,
  });
}

test("le modèle Excel livré s'importe tel quel", async () => {
  const file = await readFile(
    new URL("../public/assets/quick-order-template.xlsx", import.meta.url),
  );
  const result = await parseOrderXlsx(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.lines, [
    { sku: "21811707", quantity: 2 },
    { sku: "3987120", quantity: 1 },
    { sku: "20526087", quantity: 4 },
  ]);
});

test("les chaînes partagées, l'en-tête et les cellules creuses sont lus", async () => {
  // Excel range les textes dans sharedStrings ; les nombres restent en clair.
  const workbook = excelWorkbook(
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
      '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>4</v></c></row>' +
      // Colonne A absente du XML : la cellule doit être reconstituée vide.
      '<row r="3"><c r="B3"><v>9</v></c></row>' +
      '<row r="4"><c r="A4" t="s"><v>3</v></c><c r="B4"><v>2</v></c></row>',
  );
  const result = await parseOrderXlsx(workbook);
  // La ligne creuse est refusée par la règle existante, et rien n'est importé.
  assert.deepEqual(result.lines, []);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /^Row 2:/);

  const clean = await parseOrderXlsx(
    excelWorkbook(
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>4</v></c></row>' +
        '<row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>2</v></c></row>',
    ),
  );
  assert.deepEqual(clean.errors, []);
  assert.deepEqual(clean.lines, [
    { sku: "21811707", quantity: 4 },
    { sku: "3987120", quantity: 2 },
  ]);
});

test("les règles de préparation du CSV s'appliquent sans être réécrites", async () => {
  // Doublons fusionnés, exactement comme l'import CSV.
  const merged = await parseOrderXlsx(
    excelWorkbook(
      '<row r="1"><c r="A1" t="s"><v>2</v></c><c r="B1"><v>2</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>3</v></c></row>',
    ),
  );
  assert.deepEqual(merged.lines, [{ sku: "21811707", quantity: 5 }]);

  // Quantité hors bornes : refus complet, aucun import partiel.
  const rejected = await parseOrderXlsx(
    excelWorkbook(
      '<row r="1"><c r="A1" t="s"><v>2</v></c><c r="B1"><v>2</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>0</v></c></row>',
    ),
  );
  assert.deepEqual(rejected.lines, []);
  assert.match(rejected.errors[0], /whole quantity from 1 to 9999/);

  // Un en-tête incomplet est refusé par la même règle que le CSV.
  const header = await parseOrderXlsx(
    excelWorkbook('<row r="1"><c r="A1" t="s"><v>0</v></c></row>'),
  );
  assert.deepEqual(header.lines, []);
  assert.match(header.errors[0], /header sku,quantity/);
});

test("un fichier illisible produit une erreur compréhensible, pas une exception", async () => {
  const text = new TextEncoder().encode("sku,quantity\n21811707,2\n");
  const asCsv = await parseOrderXlsx(
    text.buffer.slice(text.byteOffset, text.byteOffset + text.byteLength),
  );
  assert.deepEqual(asCsv.lines, []);
  assert.deepEqual(asCsv.errors, ["This file is not an Excel workbook."]);

  assert.deepEqual((await parseOrderXlsx(new ArrayBuffer(0))).errors, [
    "This file is not an Excel workbook.",
  ]);

  // Signature ZIP correcte mais archive tronquée.
  const truncated = new Uint8Array([
    0x50,
    0x4b,
    0x03,
    0x04,
    ...Array(40).fill(0),
  ]);
  const damaged = await parseOrderXlsx(truncated.buffer);
  assert.deepEqual(damaged.lines, []);
  assert.match(
    damaged.errors[0],
    /damaged or incomplete|not an Excel workbook/,
  );

  // Archive valide sans feuille exploitable.
  const noSheet = await parseOrderXlsx(zip({ "docProps/core.xml": "<x/>" }));
  assert.deepEqual(noSheet.errors, ["This workbook has no readable sheet."]);

  // Feuille présente mais vide.
  const empty = await parseOrderXlsx(excelWorkbook(""));
  assert.deepEqual(empty.errors, ["The first sheet is empty."]);
});

test("le plafond de taille est celui de l'import CSV", async () => {
  const oversized = new ArrayBuffer(100_001);
  const result = await parseOrderXlsx(oversized);
  assert.deepEqual(result.lines, []);
  assert.deepEqual(result.errors, ["Excel file must be smaller than 100 KB."]);
});
