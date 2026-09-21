import { z } from "zod";
export const addressSchema = z.object({
  addressId: z.string().min(1),
  addressType: z.string(),
  receiverName: z.string().nullish(),
  postalCode: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string(),
  street: z.string().nullish(),
  number: z.string().nullish(),
  neighborhood: z.string().nullish(),
  complement: z.string().nullish(),
  reference: z.string().nullish(),
  geoCoordinates: z.array(z.number()).optional(),
});
export const checkoutFormSchema = z.object({
  orderFormId: z.string(),
  value: z.number().int(),
  storePreferencesData: z.object({
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      uniqueId: z.string(),
      name: z.string(),
      seller: z.string(),
      quantity: z.number().int().nonnegative(),
      sellingPrice: z.number().int(),
      availability: z.string().optional(),
    }),
  ),
  totalizers: z.array(
    z.object({ id: z.string(), name: z.string(), value: z.number().int() }),
  ),
  shippingData: z
    .object({
      availableAddresses: z.array(addressSchema).default([]),
      selectedAddresses: z.array(addressSchema).default([]),
      logisticsInfo: z
        .array(
          z.object({
            itemIndex: z.number().int().nonnegative(),
            addressId: z.string().nullish(),
            selectedSla: z.string().nullish(),
            selectedDeliveryChannel: z.string().nullish(),
            slas: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                deliveryChannel: z.string(),
                price: z.number().int(),
                shippingEstimate: z.string().nullish(),
                availableDeliveryWindows: z.array(z.unknown()).optional(),
              }),
            ),
          }),
        )
        .default([]),
    })
    .nullish(),
  messages: z
    .array(
      z.object({ text: z.string().optional(), status: z.string().optional() }),
    )
    .default([]),
});
export type CheckoutForm = z.infer<typeof checkoutFormSchema>;
export type CheckoutView = Omit<CheckoutForm, "orderFormId"> & {
  revision: string;
};
export const shippingInput = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("address"),
      revision: z.string().length(64),
      addressId: z.string().min(1).max(200),
    })
    .strict(),
  z
    .object({
      action: z.literal("delivery"),
      revision: z.string().length(64),
      options: z
        .array(
          z
            .object({
              itemIndex: z.number().int().nonnegative(),
              slaId: z.string().min(1).max(200),
            })
            .strict(),
        )
        .min(1)
        .max(200),
    })
    .strict(),
]);
