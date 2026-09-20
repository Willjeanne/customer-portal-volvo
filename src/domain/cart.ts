import { z } from "zod";
import { draftLineSchema } from "./order-draft";
export const preparationInput = z
  .object({ lines: z.array(draftLineSchema).min(1).max(200) })
  .strict();
export interface CheckedLine {
  reference: string;
  sku: string | null;
  name: string;
  seller: string | null;
  requested: number;
  available: number;
  price: number | null;
  issue: string | null;
}
export interface Preparation {
  id: string;
  expiresAt: number;
  currency: string;
  lines: CheckedLine[];
  canTransfer: boolean;
  transferBlock: string | null;
}
export interface CartResult {
  complete: boolean;
  lines: {
    sku: string;
    seller: string;
    requested: number;
    added: number;
    inCart: number;
  }[];
}
export interface CartItem {
  id: string;
  seller: string;
  quantity: number;
}
export function cartDifference(
  requested: CartItem[],
  before: CartItem[],
  after: CartItem[],
): CartResult {
  const count = (items: CartItem[], item: CartItem) =>
    items
      .filter((i) => i.id === item.id && i.seller === item.seller)
      .reduce((sum, i) => sum + i.quantity, 0);
  const lines = requested.map((item) => ({
    sku: item.id,
    seller: item.seller,
    requested: item.quantity,
    added: count(after, item) - count(before, item),
    inCart: count(after, item),
  }));
  return {
    complete: lines.every((line) => line.added === line.requested),
    lines,
  };
}
