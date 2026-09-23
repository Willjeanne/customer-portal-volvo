/**
 * WWC (Weni Web Chat) socket protocol.
 *
 * Pure parsing and mapping helpers for the frames described in
 * `references/GUIA-WEBSOCKET-Y-CATALOGO.md`. No DOM, no network: the browser
 * client in `components/ai-assistant.tsx` owns the socket and calls into here,
 * so every rule below is unit-testable without a live channel.
 *
 * The guide's own values are mocks. The channel UUID and endpoints for this
 * portal come from environment variables, never from a literal in this file.
 */

export type ChatRole = "agent" | "visitor";

export interface ChatProduct {
  id: string;
  name: string;
  price: number | null;
  listPrice: number | null;
  image: string | null;
  url: string | null;
  sellerId: string;
  description: string | null;
}

export interface ChatMessage {
  key: string;
  role: ChatRole;
  text: string;
  products: ChatProduct[];
  /** Portal `Vehicle.id`s, in the order sent. Resolved by the renderer. */
  vehicles: string[];
  at: number;
}

/** A frame is only trusted after `JSON.parse`; anything else is ignored. */
export function parseFrame(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string") return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Text deltas carry no `type` — they are recognised by a string `v`.
 * Distinguishing them by absence of `type` is the guide's rule, not a guess.
 */
export function isDelta(
  frame: Record<string, unknown>,
): frame is { v: string; seq?: number } {
  return frame.type === undefined && typeof frame.v === "string";
}

export function frameType(frame: Record<string, unknown>): string | null {
  return typeof frame.type === "string" ? frame.type : null;
}

/** `{flowsOrigin}/c/wwc/{channelUuid}/receive` — the registration callback. */
export function registerCallback(
  flowsOrigin: string,
  channelUuid: string,
): string {
  return `${flowsOrigin.replace(/\/+$/, "")}/c/wwc/${channelUuid}/receive`;
}

/**
 * Contact identity. Reopening the same thread requires the same `from`, so the
 * caller persists it; a new conversation means a new `from` and a new register.
 */
export function makeContactId(hostname: string): string {
  const random = Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000;
  return `${random}@${hostname}`;
}

function readString(source: unknown, key: string): string | null {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readArray(source: unknown, key: string): unknown[] {
  if (!source || typeof source !== "object") return [];
  const value = (source as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

/** Prices arrive as strings and may use a decimal comma. */
export function readMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * `<sku>` | `<sku>#<seller>` | `<sku>#<seller>#<tradePolicy>`.
 * The third part is a trade policy, never a sales channel: it must not reach
 * checkout as `?sc=`, so it is parsed and deliberately dropped here.
 */
export function readSeller(id: string, fallback: unknown): string {
  const fromId = id.split("#")[1];
  if (fromId) return fromId;
  return typeof fallback === "string" && fallback.trim() ? fallback : "1";
}

function readEntryId(entry: unknown): string | null {
  return (
    readString(entry, "product_retailer_id") || readString(entry, "retailer_id")
  );
}

/**
 * Agents send fleet vehicles through the same catalogue SDK as parts, marked
 * by this prefix on the retailer id. The rest is the portal `Vehicle.id`.
 */
const VEHICLE_PREFIX = "vehicle:";

/** The vehicle id carried by an entry, or null when it is not a vehicle. */
function readVehicleId(entry: unknown): string | null {
  const id = readEntryId(entry);
  if (!id?.startsWith(VEHICLE_PREFIX)) return null;
  const vehicleId = id.slice(VEHICLE_PREFIX.length).trim();
  return vehicleId || null;
}

function readProduct(entry: unknown): ChatProduct | null {
  if (!entry || typeof entry !== "object") return null;
  const id = readEntryId(entry);
  // A vehicle entry is never a part, even when it is malformed.
  if (id?.startsWith(VEHICLE_PREFIX)) return null;
  const name = readString(entry, "name");
  // The guide is explicit: without an id or a name there is no product.
  if (!id || !name) return null;

  const record = entry as Record<string, unknown>;
  const charged = readMoney(record.sale_price) ?? readMoney(record.price);
  const listed = readMoney(record.price);
  return {
    id,
    name,
    price: charged,
    // A list price is only a discount when it sits above what is charged.
    listPrice: listed !== null && charged !== null && listed > charged ? listed : null,
    image: readString(entry, "image"),
    url: readString(entry, "product_url"),
    sellerId: readSeller(id, record.seller_id),
    description: readString(entry, "description"),
  };
}

/**
 * Products may arrive through four shapes. Catalogue agents on WebChat send
 * `catalog_message`, whose item id is `retailer_id` — reading only
 * `interactive.action.product_items` returns an empty list.
 */
function readEntries(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  const interactive = record.interactive as Record<string, unknown> | undefined;
  const action = interactive?.action as Record<string, unknown> | undefined;

  return [
    ...readArray(action, "product_items"),
    ...readArray(action, "sections").flatMap((section) =>
      readArray(section, "product_items"),
    ),
    ...readArray(record.order, "product_items"),
    ...readArray(record.catalog_message, "products").flatMap((group) =>
      readArray(group, "product_retailer_info"),
    ),
  ];
}

export function readProducts(body: unknown): ChatProduct[] {
  const seen = new Set<string>();
  const products: ChatProduct[] = [];
  for (const entry of readEntries(body)) {
    const product = readProduct(entry);
    if (product && !seen.has(product.id)) {
      seen.add(product.id);
      products.push(product);
    }
  }
  return products;
}

/**
 * Vehicle ids sent as `vehicle:<id>` catalogue entries. Their price, seller and
 * currency are placeholders the SDK requires, so only the id is kept: the card
 * is drawn from the portal's own fleet data, never from what the agent sent.
 */
export function readVehicles(body: unknown): string[] {
  const ids: string[] = [];
  for (const entry of readEntries(body)) {
    const id = readVehicleId(entry);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Some flows escape their text twice: the `interactive` message that follows a
 * catalogue answer carries a literal backslash-n and backslash-quote where the
 * envelope of the same turn carries a real line break and a real quote. Decoded
 * here, so the text reads correctly and matches its twin for de-duplication.
 */
export function unescapeText(text: string): string {
  if (!/\\[n"t\\]/.test(text)) return text;
  // A JSON object keeps its escapes: they are valid there, and a leaked
  // envelope must still parse in `readEnvelope`.
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return text;
  return text.replace(/\\([n"t\\])/g, (_, code: string) =>
    code === "n" ? "\n" : code === "t" ? "\t" : code,
  );
}

export function readText(body: unknown): string {
  return unescapeText(
    readString(body, "text") || readString(body, "caption") || "",
  );
}

/** Optional group heading, used so a catalogue block does not repeat its text. */
export function readCatalogTitle(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const interactive = record.interactive as Record<string, unknown> | undefined;
  const fromHeader = readString(interactive?.header, "text");
  if (fromHeader) return fromHeader;
  const groups = readArray(record.catalog_message, "products");
  return groups.length ? readString(groups[0], "product") : null;
}

/**
 * Some flows leak their own delivery envelope as the text of a message:
 * `{"is_final_output": true, "messages_sent": [{ text, catalog_message }]}`.
 * Rendered as-is it fills the thread with raw JSON, and the same content then
 * arrives again as proper frames. The envelope is recognised by those two keys
 * only — an ordinary answer that merely starts with a brace is left alone —
 * and unwrapped into the parts it announces, so nothing is lost if the real
 * frames never follow. An empty array means it carried nothing to show.
 */
export function readEnvelope(
  text: string,
): { text: string; products: ChatProduct[]; vehicles: string[] }[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;

  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (!("messages_sent" in record) && !("is_final_output" in record))
    return null;

  return readArray(record, "messages_sent")
    .map((entry) => ({
      text: readText(entry),
      products: readProducts(entry),
      vehicles: readVehicles(entry),
    }))
    .filter(
      (part) =>
        part.text || part.products.length > 0 || part.vehicles.length > 0,
    );
}

/** Spacing is not content: two copies may differ only in their line breaks. */
function comparable(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Same author, same words, same cards: the second copy adds nothing. */
export function sameContent(
  a: Pick<ChatMessage, "role" | "text" | "products" | "vehicles">,
  b: Pick<ChatMessage, "role" | "text" | "products" | "vehicles">,
): boolean {
  return (
    a.role === b.role &&
    comparable(a.text) === comparable(b.text) &&
    a.products.length === b.products.length &&
    a.products.every((product, index) => product.id === b.products[index].id) &&
    a.vehicles.length === b.vehicles.length &&
    a.vehicles.every((id, index) => id === b.vehicles[index])
  );
}

/**
 * Appends unless one of the last few messages already says exactly the same
 * thing. An unwrapped envelope is normally followed by the real frames, and
 * the visitor must not read the answer twice.
 */
export function appendMessage(
  current: ChatMessage[],
  message: ChatMessage,
  window = 4,
): ChatMessage[] {
  const recent = current.slice(-window);
  if (recent.some((existing) => sameContent(existing, message))) return current;
  return [...current, message];
}

/** Timestamps arrive in seconds or milliseconds depending on the frame. */
export function normaliseTimestamp(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed <= 0)
    return fallback;
  return parsed < 1e12 ? parsed * 1000 : parsed;
}

/**
 * Server history is newest-first, and its direction labels are inverted from
 * what a chat usually assumes: `in` is the agent, `out` is the visitor.
 */
export function readHistory(entries: unknown, now = Date.now()): ChatMessage[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry, index): ChatMessage | null => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const body = record.message ?? record;
      const text = readText(body);
      const products = readProducts(body);
      const vehicles = readVehicles(body);
      if (!text && !products.length && !vehicles.length) return null;
      return {
        key: `history-${index}`,
        role: record.direction === "out" ? "visitor" : "agent",
        text,
        products,
        vehicles,
        at: normaliseTimestamp(record.timestamp, now),
      };
    })
    .filter((message): message is ChatMessage => message !== null)
    .sort((a, b) => a.at - b.at);
}

/**
 * A shorter history must never replace a longer local thread: a message the
 * visitor already sent cannot be allowed to disappear on reconnect.
 */
export function applyHistory(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  return incoming.length > current.length ? incoming : current;
}
