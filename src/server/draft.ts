import { z } from "zod";
import { draftLineSchema, type DraftLine } from "../domain/order-draft";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";

export const addDraftInput = z
  .object({ line: draftLineSchema.strict() })
  .strict();
export const replaceDraftInput = z
  .object({
    lines: z.array(draftLineSchema.strict()).max(200),
    revision: z.number().int().nonnegative(),
  })
  .strict();

function normalize(lines: DraftLine[]): DraftLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    const quantity = (merged.get(line.sku) ?? 0) + line.quantity;
    if (quantity > 9999)
      throw new PortalError(
        400,
        "DRAFT_QUANTITY_LIMIT",
        `Combined quantity for ${line.sku} exceeds 9999. Nothing was changed.`,
      );
    merged.set(line.sku, quantity);
  }
  if (merged.size > 200)
    throw new PortalError(
      400,
      "DRAFT_LINE_LIMIT",
      "The draft can contain at most 200 different references. Nothing was changed.",
    );
  return Array.from(merged, ([sku, quantity]) => ({ sku, quantity }));
}
function commit(session: PortalSession, lines: DraftLine[]) {
  if (session.cartBusy)
    throw new PortalError(
      409,
      "DRAFT_BUSY",
      "Wait for the cart check or transfer to finish before changing the saved draft.",
    );
  session.draft = lines;
  session.draftRevision = (session.draftRevision ?? 0) + 1;
  session.preparation = undefined;
  return session.draftRevision;
}

/** Synchronous read/merge/write: atomic in the supported single-process local runtime. */
export function addDraftLine(session: PortalSession, body: unknown) {
  const { line } = addDraftInput.parse(body);
  const lines = normalize([...(session.draft ?? []), line]);
  const revision = commit(session, lines);
  return {
    added: line.quantity,
    sku: line.sku,
    total: lines.find((item) => item.sku === line.sku)!.quantity,
    revision,
  };
}

export function replaceDraft(session: PortalSession, body: unknown) {
  const input = replaceDraftInput.parse(body);
  if (input.revision !== (session.draftRevision ?? 0))
    throw new PortalError(
      409,
      "DRAFT_CONFLICT",
      "The saved draft changed in another page. Export your current edits if needed, then restore the saved draft before saving again.",
    );
  const revision = commit(session, normalize(input.lines));
  return { saved: true, revision };
}
