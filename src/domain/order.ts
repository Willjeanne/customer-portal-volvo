import { z } from "zod";
export const orderIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/);
export const orderDetailSchema = z.object({
  orderId: orderIdSchema, creationDate: z.string().datetime({ offset: true }),
  status: z.string(), statusDescription: z.string().nullish(), value: z.number().finite(),
  storePreferencesData: z.object({ currencyCode: z.string().regex(/^[A-Z]{3}$/) }).nullish(),
  items: z.array(z.object({ id: z.string(), name: z.string(), quantity: z.number().int().positive(), sellingPrice: z.number().finite(), refId: z.string().nullish() })),
  packageAttachment: z.object({ packages: z.array(z.object({
    invoiceNumber: z.string().nullish(), invoiceUrl: z.string().nullish(),
    trackingNumber: z.string().nullish(), trackingUrl: z.string().nullish(), courier: z.string().nullish(),
  })).nullish() }).nullish(),
});
export function documentLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function orderMoney(value: number, currency?: string | null) {
  return currency ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100) : `${(value / 100).toFixed(2)} · currency unavailable`;
}

const englishOrderStatuses: Record<string, string> = {
  "order-created": "Order created",
  "on-order-completed": "Order completed",
  "payment-pending": "Payment pending",
  "waiting-for-order-authorization": "Awaiting order authorization",
  "waiting-for-authorization": "Awaiting authorization",
  "approve-payment": "Awaiting payment approval",
  "payment-approved": "Payment approved",
  "request-cancel": "Cancellation requested",
  "waiting-for-seller-confirmation": "Awaiting seller confirmation",
  "window-to-cancel": "Cancellation window",
  "ready-for-handling": "Ready for handling",
  "start-handling": "Handling started",
  handling: "Preparing order",
  invoiced: "Invoiced",
  canceled: "Canceled",
  "cancellation-requested": "Cancellation requested",
  "cancelation-requested": "Cancellation requested",
};
export function orderStatusLabel(status: string): string {
  return englishOrderStatuses[status] || "Status unavailable";
}
