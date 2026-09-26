import { z } from "zod";
export const claimReasons = {
  return: [
    "Wrong part ordered",
    "Part no longer needed",
    "Excess quantity",
    "Other",
  ],
  claim: [
    "Damaged part",
    "Wrong part received",
    "Missing quantity",
    "Defective part",
    "Warranty review",
    "Other",
  ],
} as const;
export const claimDraftSchema = z
  .object({
    type: z.enum(["return", "claim"]),
    reason: z.string(),
    subject: z.string().trim().min(1).max(120),
    description: z.string().trim().min(10).max(3000),
    resolution: z.enum([
      "Replacement",
      "Return instructions",
      "Refund review",
      "Assistance",
    ]),
    lines: z
      .array(
        z
          .object({
            index: z.number().int().nonnegative(),
            quantity: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .max(200),
  })
  .strict()
  .refine(
    (draft) =>
      (claimReasons[draft.type] as readonly string[]).includes(draft.reason),
    { message: "Choose a reason for the selected request type." },
  );
export function validateClaimDraft(
  input: unknown,
  items: { quantity: number }[],
) {
  const result = claimDraftSchema.safeParse(input);
  if (!result.success)
    return {
      error:
        "Select at least one part, a reason, a subject and a description of at least 10 characters.",
    } as const;
  if (
    new Set(result.data.lines.map((l) => l.index)).size !==
      result.data.lines.length ||
    result.data.lines.some(
      (l) => !items[l.index] || l.quantity > items[l.index].quantity,
    )
  )
    return {
      error: "Requested quantities must not exceed ordered quantities.",
    } as const;
  return { data: result.data } as const;
}

export interface SavedClaim {
  id: string;
  reference: string;
  orderId: string;
  revision: number;
  status: "draft" | "submitted";
  updatedAt: string;
  fingerprint: string;
  draft: z.infer<typeof claimDraftSchema>;
  parts: { index: number; quantity: number; sku: string; name: string }[];
}
