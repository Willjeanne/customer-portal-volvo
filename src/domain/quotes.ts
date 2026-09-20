import { z } from "zod";
export const quoteStatuses = ["Draft", "Requested", "InReview", "Reviewed", "Approved", "Declined", "Expired", "ConvertedToCart", "ConvertedToOrder"] as const;
export const quoteFilters = z.object({ page:z.number().int().min(1).max(1000), status:z.enum(quoteStatuses).optional(), label:z.string().trim().max(100).default("") });
export const quoteListSchema = z.object({
  items:z.array(z.object({ id:z.string().min(1), status:z.string(), label:z.string().nullish(), createdAt:z.string(), expiresAt:z.string().nullish(), amount:z.number().finite() })),
  pageNumber:z.number().int().positive(), pageSize:z.number().int().positive(), totalItems:z.number().int().nonnegative(),
});
export function quoteDate(value?:string|null) { const date=value ? new Date(value) : null; return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeZone:"America/Chicago"}).format(date) : "Not provided"; }
