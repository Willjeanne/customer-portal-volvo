import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  checkoutFormSchema,
  paymentInput,
  placeOrderInput,
  promissoryOptions,
  type CheckoutForm,
  type OrderOutcome,
} from "../domain/checkout";
import { checkoutRequest } from "./cart";
import { checkoutView, currentCheckout } from "./checkout";
import { assertCartEditable, claimOrder, saveOrder } from "./order-attempts";
import { mayPlaceOrders } from "./purchase-permission";
import { PortalError } from "./security";
import type { PortalSession } from "./session-store";
async function reviewedCart(session: PortalSession, revision: string) {
  if (!(await mayPlaceOrders(session)))
    throw new PortalError(
      403,
      "PURCHASE_DENIED",
      "Purchasing is not authorized for this account.",
    );
  await assertCartEditable(session);
  const form = await currentCheckout(session);
  if (checkoutView(form).revision !== revision)
    throw new PortalError(
      409,
      "CHECKOUT_CHANGED",
      "Your cart changed. Reload checkout and review the total again.",
    );
  return form;
}
export async function updatePayment(session: PortalSession, body: unknown) {
  const input = paymentInput.parse(body);
  const form = await reviewedCart(session, input.revision);
  if (!promissoryOptions(form).some((s) => s.id === input.paymentSystem))
    throw new PortalError(
      409,
      "PAYMENT_UNAVAILABLE",
      "Promissory is not available for this cart at the displayed total.",
    );
  if (form.paymentData?.giftCards?.some((g) => g.inUse))
    throw new PortalError(
      409,
      "PAYMENT_MIXED",
      "Remove the gift card before using this payment method.",
    );
  const updated = await checkoutRequest(
    session,
    `/api/checkout/pub/orderForm/${form.orderFormId}/attachments/paymentData`,
    checkoutFormSchema,
    {
      payments: [
        {
          paymentSystem: String(input.paymentSystem),
          installments: 1,
          value: form.value,
          referenceValue: form.value,
        },
      ],
    },
  );
  if (updated.orderFormId !== form.orderFormId)
    throw new PortalError(
      409,
      "CART_CHANGED",
      "The updated cart could not be confirmed.",
    );
  return checkoutView(updated);
}
function ready(form: CheckoutForm) {
  const payment = form.paymentData?.payments[0];
  if (
    form.value <= 0 ||
    !form.items.some((i) => i.quantity > 0) ||
    form.items.some((i) => i.quantity > 0 && i.availability !== "available") ||
    form.messages.some((m) => m.status === "error")
  )
    throw new PortalError(
      409,
      "CART_NOT_READY",
      "Review stock and cart messages before placing your order.",
    );
  const shipping = form.shippingData;
  if (
    !shipping?.selectedAddresses.length ||
    form.items.some(
      (item, index) =>
        item.quantity > 0 &&
        !shipping.logisticsInfo.some(
          (l) =>
            l.itemIndex === index &&
            shipping.selectedAddresses.some(
              (a) => a.addressId === l.addressId,
            ) &&
            l.selectedDeliveryChannel === "delivery" &&
            l.slas.some(
              (s) =>
                s.id === l.selectedSla &&
                s.deliveryChannel === "delivery" &&
                !s.availableDeliveryWindows?.length,
            ),
        ),
    )
  )
    throw new PortalError(
      409,
      "DELIVERY_INCOMPLETE",
      "Save a delivery address and delivery option for every item.",
    );
  if (
    !payment ||
    form.paymentData?.updateStatus === "outdated" ||
    form.paymentData?.payments.length !== 1 ||
    form.paymentData.giftCards?.some((g) => g.inUse) ||
    payment.installments !== 1 ||
    payment.value !== form.value ||
    payment.referenceValue !== form.value ||
    !promissoryOptions(form).some((s) => String(s.id) === payment.paymentSystem)
  )
    throw new PortalError(
      409,
      "PAYMENT_REQUIRED",
      "Save the available Promissory payment method before placing your order.",
    );
  return payment;
}
const transactionSchema = z.object({
  orderFormId: z.string(),
  orderGroup: z.string().regex(/^[A-Za-z0-9-]+$/),
  merchantTransactions: z
    .array(
      z.object({
        transactionId: z.string().regex(/^[A-Za-z0-9-]+$/),
        merchantName: z.string().min(1),
        payments: z.array(
          z.object({
            paymentSystem: z.string(),
            value: z.number().int(),
            referenceValue: z.number().int(),
          }),
        ),
      }),
    )
    .min(1),
});
export async function placeOrder(
  session: PortalSession,
  body: unknown,
): Promise<OrderOutcome> {
  const input = placeOrderInput.parse(body);
  const form = await reviewedCart(session, input.revision);
  const payment = ready(form);
  let outcome: OrderOutcome = {
    status: "processing",
    reference: randomUUID(),
    value: form.value,
    currency: form.storePreferencesData.currencyCode,
  };
  await claimOrder(form.orderFormId, outcome);
  session.preparation = undefined;
  let stage: "transaction" | "payment" | "processing" = "transaction";
  try {
    const transaction = await checkoutRequest(
      session,
      `/api/checkout/pub/orderForm/${form.orderFormId}/transaction`,
      transactionSchema,
      {
        referenceId: form.orderFormId,
        value: form.value,
        referenceValue: form.value,
        interestValue: 0,
        savePersonalData: false,
        optinNewsLetter: false,
      },
    );
    outcome = { ...outcome, orderGroup: transaction.orderGroup };
    await saveOrder(form.orderFormId, outcome);
    if (
      transaction.orderFormId !== form.orderFormId ||
      new Set(transaction.merchantTransactions.map((m) => m.transactionId))
        .size !== transaction.merchantTransactions.length ||
      transaction.merchantTransactions
        .flatMap((m) => m.payments)
        .some(
          (p) =>
            p.paymentSystem !== payment.paymentSystem ||
            p.value <= 0 ||
            p.referenceValue !== p.value,
        ) ||
      transaction.merchantTransactions
        .flatMap((m) => m.payments)
        .reduce((sum, p) => sum + p.value, 0) !== form.value
    )
      throw new Error("Transaction mismatch");
    // Promissory ONLY: no card fields accepted or proxied. All three steps run
    // in this request; there is no cross-request transaction handoff to session.
    stage = "payment";
    for (const merchant of transaction.merchantTransactions) {
      const response = await fetch(
        `https://volvoemea.vtexpayments.com.br/api/pub/transactions/${merchant.transactionId}/payments?orderId=${transaction.orderGroup}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            merchant.payments.map((p) => ({
              paymentSystem: Number(p.paymentSystem),
              installments: 1,
              currencyCode: form.storePreferencesData.currencyCode,
              value: p.value,
              referenceValue: p.referenceValue,
              installmentsInterestRate: 0,
              installmentsValue: p.value,
              fields: {},
              transaction: {
                id: merchant.transactionId,
                merchantName: merchant.merchantName,
              },
            })),
          ),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) {
        const failure = new PortalError(
          502,
          "PAYMENT_REJECTED",
          "VTEX did not accept the payment submission.",
        );
        failure.upstreamStatus = response.status;
        throw failure;
      }
    }
    stage = "processing";
    await checkoutRequest(
      session,
      `/api/checkout/pub/gatewayCallback/${transaction.orderGroup}`,
      z.null(),
      {},
    );
    outcome = { ...outcome, status: "submitted" };
    await saveOrder(form.orderFormId, outcome);
    session.lastOrderCartId = form.orderFormId;
    session.orderFormId = undefined;
    session.checkoutCookies = undefined;
    return outcome;
  } catch (error) {
    const failure = {
      stage,
      code: error instanceof PortalError ? error.code : "RESPONSE_UNCONFIRMED",
      httpStatus:
        error instanceof PortalError ? error.upstreamStatus : undefined,
      upstreamCode:
        error instanceof PortalError ? error.upstreamCode : undefined,
    };
    outcome = { ...outcome, status: "uncertain", failure };
    console.error("checkout-submission", {
      reference: outcome.reference,
      ...failure,
    });
    await saveOrder(form.orderFormId, outcome);
    return outcome;
  }
}
