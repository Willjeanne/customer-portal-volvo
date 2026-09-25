import "server-only";
import { assertCartEditable } from "./order-attempts";
import { createHash } from "node:crypto";
import {
  checkoutFormSchema,
  shippingInput,
  type CheckoutForm,
  type CheckoutView,
} from "../domain/checkout";
import { checkoutRequest } from "./cart";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";
import { mayPlaceOrders } from "./purchase-permission";

export function checkoutView(form: CheckoutForm): CheckoutView {
  const { orderFormId, ...data } = form;
  return {
    ...data,
    revision: createHash("sha256")
      .update(JSON.stringify({ orderFormId, ...data }))
      .digest("hex"),
  };
}
export async function currentCheckout(session: PortalSession) {
  if (!session.orderFormId)
    throw new PortalError(
      409,
      "CART_EMPTY",
      "Add parts to the cart before opening checkout.",
    );
  const form = await checkoutRequest(
    session,
    `/api/checkout/pub/orderForm/${session.orderFormId}`,
    checkoutFormSchema,
  );
  if (form.orderFormId !== session.orderFormId)
    throw new PortalError(
      409,
      "CART_CHANGED",
      "Your cart could not be confirmed. Reload checkout.",
    );
  return form;
}
export async function readCheckout(session: PortalSession) {
  return checkoutView(await currentCheckout(session));
}
export async function updateShipping(session: PortalSession, body: unknown) {
  const input = shippingInput.parse(body);
  await assertCartEditable(session);
  if (!(await mayPlaceOrders(session)))
    throw new PortalError(
      403,
      "PURCHASE_DENIED",
      "Purchasing is not authorized for this account.",
    );
  const form = await currentCheckout(session);
  if (checkoutView(form).revision !== input.revision)
    throw new PortalError(
      409,
      "CHECKOUT_CHANGED",
      "The cart or delivery options changed. Reload checkout and review them again.",
    );
  const shipping = form.shippingData;
  if (!shipping)
    throw new PortalError(
      409,
      "SHIPPING_UNAVAILABLE",
      "Delivery information is unavailable for this cart.",
    );
  let payload: unknown;
  if (input.action === "address") {
    const address = [
      ...shipping.availableAddresses,
      ...shipping.selectedAddresses,
    ].find((a) => a.addressId === input.addressId);
    if (!address)
      throw new PortalError(
        403,
        "ADDRESS_DENIED",
        "This address is not available in your cart.",
      );
    if (
      Object.values(address).some(
        (value) => typeof value === "string" && value.includes("*"),
      )
    )
      throw new PortalError(
        409,
        "ADDRESS_MASKED",
        "The saved address is masked. Its full details must be available before selection.",
      );
    payload = {
      selectedAddresses: [address],
      logisticsInfo: form.items.map((_, itemIndex) => ({
        itemIndex,
        selectedSla: null,
        selectedDeliveryChannel: null,
      })),
    };
  } else {
    if (!shipping.selectedAddresses.length)
      throw new PortalError(
        409,
        "ADDRESS_REQUIRED",
        "Select a delivery address first.",
      );
    const required = form.items.flatMap((item, index) =>
      item.quantity > 0 ? [index] : [],
    );
    if (
      new Set(input.options.map((o) => o.itemIndex)).size !== required.length ||
      input.options.length !== required.length ||
      required.some(
        (index) => !input.options.some((o) => o.itemIndex === index),
      )
    )
      throw new PortalError(
        400,
        "DELIVERY_INCOMPLETE",
        "Choose delivery for every cart item.",
      );
    const logisticsInfo = input.options.map((option) => {
      const line = shipping.logisticsInfo.find(
        (l) => l.itemIndex === option.itemIndex,
      );
      const sla = line?.slas.find(
        (s) =>
          s.id === option.slaId &&
          s.deliveryChannel === "delivery" &&
          !s.availableDeliveryWindows?.length,
      );
      if (!sla)
        throw new PortalError(
          409,
          "DELIVERY_UNAVAILABLE",
          "This delivery option is no longer available or requires an unsupported scheduled delivery.",
        );
      return {
        itemIndex: option.itemIndex,
        addressId: line?.addressId,
        selectedSla: sla.id,
        selectedDeliveryChannel: sla.deliveryChannel,
      };
    });
    payload = { selectedAddresses: shipping.selectedAddresses, logisticsInfo };
  }
  const updated = await checkoutRequest(
    session,
    `/api/checkout/pub/orderForm/${form.orderFormId}/attachments/shippingData`,
    checkoutFormSchema,
    payload,
  );
  if (updated.orderFormId !== form.orderFormId)
    throw new PortalError(
      409,
      "CART_CHANGED",
      "The updated cart could not be confirmed. Reload checkout.",
    );
  session.preparation = undefined;
  return checkoutView(updated);
}
