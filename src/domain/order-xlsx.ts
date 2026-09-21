/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « import xlsx », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-XLSX.md.
 *
 * Lecture d'un classeur `.xlsx` sans dépendance.
 *
 * Pourquoi pas une bibliothèque : `xlsx` porte une vulnérabilité haute et
 * `exceljs` deux modérées, or le projet revendique un audit npm propre ; la
 * seule candidate saine, `read-excel-file`, n'expose pas son entrée navigateur
 * à l'ESM de Node, donc les tests n'auraient pas exercé le code que le
 * navigateur exécute. Ici un seul chemin de code sert l'écran et les tests.
 *
 * Un `.xlsx` est une archive ZIP de fichiers XML. On n'en lit que ce qui est
 * nécessaire à deux colonnes : la première feuille, ses lignes, ses chaînes.
 * La validation, elle, n'est pas réécrite — les lignes lues sont repassées à
 * `parseOrderCsv`, qui reste l'unique source des règles (références, quantités,
 * doublons, limites, refus d'import partiel).
 */
import Papa from "papaparse";
import { parseOrderCsv, type DraftLine } from "./order-draft";

/** Même plafond que l'import CSV. */
const MAX_BYTES = 100_000;
/** Garde-fou de lecture : `parseOrderCsv` refuse déjà au-delà de 200 lignes. */
const MAX_ROWS_READ = 5_000;

const SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

class XlsxError extends Error {}

function decodeEntities(value: string): string {
  return value.replace(
    /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,
    (all, code) => {
      if (code === "amp") return "&";
      if (code === "lt") return "<";
      if (code === "gt") return ">";
      if (code === "quot") return '"';
      if (code === "apos") return "'";
      const point =
        code[1] === "x" || code[1] === "X"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : all;
    },
  );
}

async function inflate(bytes: Uint8Array, method: number): Promise<Uint8Array> {
  if (method === 0) return bytes;
  if (method !== 8)
    throw new XlsxError("This workbook uses an unsupported compression.");
  // `deflate-raw` existe côté navigateur comme sous Node : un seul chemin.
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Entrées de l'archive, lues depuis le répertoire central. */
async function readArchive(data: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(data);
  if (
    bytes.length < 22 ||
    SIGNATURE.some((byte, index) => bytes[index] !== byte)
  )
    throw new XlsxError("This file is not an Excel workbook.");

  const view = new DataView(data);
  let end = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66_000; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new XlsxError("This workbook is damaged or incomplete.");

  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, string>();

  for (let i = 0; i < count; i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50)
      throw new XlsxError("This workbook is damaged or incomplete.");
    const method = view.getUint16(cursor + 10, true);
    const compressed = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLength),
    );

    // Seules ces parties nous intéressent : inutile de décompresser le reste.
    if (
      name === "xl/workbook.xml" ||
      name === "xl/_rels/workbook.xml.rels" ||
      name === "xl/sharedStrings.xml" ||
      name.startsWith("xl/worksheets/")
    ) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const chunk = bytes.subarray(start, start + compressed);
      entries.set(name, decoder.decode(await inflate(chunk, method)));
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Première feuille de l'onglet, résolue par le classeur puis ses relations. */
function firstSheetXml(entries: Map<string, string>): string {
  const workbook = entries.get("xl/workbook.xml");
  const rels = entries.get("xl/_rels/workbook.xml.rels");
  if (workbook && rels) {
    const first = /<sheet\b[^>]*\/?>/.exec(workbook)?.[0];
    const id = first && /r:id="([^"]+)"/.exec(first)?.[1];
    const relation =
      id && new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*>`).exec(rels)?.[0];
    const target = relation && /Target="([^"]+)"/.exec(relation)?.[1];
    if (target) {
      // Excel écrit un chemin relatif, openpyxl un chemin absolu.
      const path = target.startsWith("/")
        ? target.slice(1)
        : `xl/${target.replace(/^\.\//, "")}`;
      const sheet = entries.get(path);
      if (sheet) return sheet;
    }
  }
  const fallback =
    entries.get("xl/worksheets/sheet1.xml") ??
    [...entries.entries()]
      .filter(([name]) => name.startsWith("xl/worksheets/"))
      .sort(([a], [b]) => a.localeCompare(b))[0]?.[1];
  if (!fallback) throw new XlsxError("This workbook has no readable sheet.");
  return fallback;
}

function sharedStrings(entries: Map<string, string>): string[] {
  const xml = entries.get("xl/sharedStrings.xml");
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((entry) =>
    // Une chaîne peut être découpée en plusieurs fragments mis en forme.
    [...entry[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeEntities(part[1]))
      .join(""),
  );
}

function columnIndex(reference: string): number {
  const letters = /^([A-Z]+)/.exec(reference.toUpperCase())?.[1] ?? "";
  let index = 0;
  for (const letter of letters)
    index = index * 26 + (letter.charCodeAt(0) - 64);
  return Math.max(0, index - 1);
}

/** Lignes de la feuille, cellules vides comprises, sans colonnes vides finales. */
function sheetRows(xml: string, strings: string[]): string[][] {
  const rows: string[][] = [];
  for (const row of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    if (rows.length >= MAX_ROWS_READ)
      throw new XlsxError("This sheet has too many rows to import.");
    const cells: string[] = [];
    for (const cell of row[1].matchAll(
      /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const attributes = cell[1];
      const body = cell[2] ?? "";
      const type = /\bt="([^"]+)"/.exec(attributes)?.[1] ?? "n";
      let value = "";
      if (type === "inlineStr") {
        value = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map((part) => decodeEntities(part[1]))
          .join("");
      } else {
        const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        value =
          type === "s" ? (strings[Number(raw)] ?? "") : decodeEntities(raw);
      }
      const reference = /\br="([^"]+)"/.exec(attributes)?.[1];
      const index = reference ? columnIndex(reference) : cells.length;
      while (cells.length < index) cells.push("");
      cells[index] = value.trim();
    }
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    // Une ligne à une seule colonne rendrait le CSV intermédiaire ambigu : Papa
    // ne détecterait aucun séparateur et l'utilisateur lirait « CSV formatting
    // is invalid » après avoir importé un Excel. On complète à deux colonnes,
    // et la règle existante rend alors le message juste : en-tête attendu, ou
    // quantité manquante sur la ligne.
    while (cells.length && cells.length < 2) cells.push("");
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/**
 * Lit un classeur et rend exactement ce que rend l'import CSV.
 *
 * Aucune règle n'est réimplémentée : les lignes lues sont transmises telles
 * quelles à `parseOrderCsv`, qui reste seul juge des références, des quantités,
 * des doublons, de l'en-tête, du plafond de 200 lignes et du refus d'un import
 * partiel.
 */
export async function parseOrderXlsx(
  data: ArrayBuffer,
): Promise<{ lines: DraftLine[]; errors: string[] }> {
  if (data.byteLength > MAX_BYTES)
    return { lines: [], errors: ["Excel file must be smaller than 100 KB."] };
  let rows: string[][];
  try {
    const entries = await readArchive(data);
    rows = sheetRows(firstSheetXml(entries), sharedStrings(entries));
  } catch (error) {
    return {
      lines: [],
      errors: [
        error instanceof XlsxError
          ? error.message
          : "This file could not be read as an Excel workbook.",
      ],
    };
  }
  if (!rows.length) return { lines: [], errors: ["The first sheet is empty."] };
  return parseOrderCsv(Papa.unparse(rows, { escapeFormulae: true }));
}
