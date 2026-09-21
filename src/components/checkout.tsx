"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CheckoutView } from "@/domain/checkout";
export function Checkout() {
  const [cart, setCart] = useState<CheckoutView | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [options, setOptions] = useState<Record<number, string>>({});
  function accept(data: CheckoutView) {
    setCart(data);
    setAddress(data.shippingData?.selectedAddresses[0]?.addressId || "");
    setOptions(
      Object.fromEntries(
        (data.shippingData?.logisticsInfo || []).map((line) => [
          line.itemIndex,
          line.selectedSla || "",
        ]),
      ),
    );
  }
  useEffect(() => {
    let active = true;
    fetch("/api/portal/checkout", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Checkout unavailable.");
        if (active) accept(data);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function refresh(body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/${body ? "checkout-shipping" : "checkout"}`,
        body
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout unavailable.");
      accept(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Checkout unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart?.storePreferencesData.currencyCode || "USD",
    }).format(value / 100);
  const addresses = [
    ...new Map(
      [
        ...(cart?.shippingData?.availableAddresses || []),
        ...(cart?.shippingData?.selectedAddresses || []),
      ].map((a) => [a.addressId, a]),
    ).values(),
  ];
  return (
    <>
      <Link href="/quick-order">Back to order preparation</Link>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => refresh()}
      >
        Reload checkout
      </button>
      {error && <p role="alert">{error}</p>}
      {!cart ? (
        <p>{error ? "Checkout could not be loaded." : "Loading your cart…"}</p>
      ) : (
        <>
          <section className="detail-panel">
            <h2>1. Review your cart</h2>
            {!cart.items.length ? (
              <p>Your cart is empty.</p>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.uniqueId}>
                      <td>
                        {item.name}
                        <br />
                        SKU {item.id} · Seller {item.seller}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{money(item.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {cart.messages.map((message, i) => (
              <p key={i} role="status">
                {message.text}
              </p>
            ))}
          </section>
          <section className="detail-panel">
            <h2>2. Delivery address</h2>
            {!addresses.length ? (
              <p>
                No saved address is available for this cart. Adding a new
                address is not connected yet.
              </p>
            ) : (
              <form
                className="draft-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  refresh({
                    action: "address",
                    revision: cart.revision,
                    addressId: address,
                  });
                }}
              >
                <label>
                  Saved address
                  <select
                    value={address}
                    disabled={busy}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  >
                    <option value="">Choose an address</option>
                    {addresses.map((a) => (
                      <option key={a.addressId} value={a.addressId}>
                        {[
                          a.receiverName,
                          a.street,
                          a.number,
                          a.city,
                          a.postalCode,
                          a.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button primary" disabled={busy || !address}>
                  Use this address
                </button>
              </form>
            )}
          </section>
          <section className="detail-panel">
            <h2>3. Delivery options</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                refresh({
                  action: "delivery",
                  revision: cart.revision,
                  options: cart.items.flatMap((item, itemIndex) =>
                    item.quantity > 0
                      ? [{ itemIndex, slaId: options[itemIndex] || "" }]
                      : [],
                  ),
                });
              }}
            >
              {cart.items.map((item, itemIndex) => {
                const line = cart.shippingData?.logisticsInfo.find(
                  (l) => l.itemIndex === itemIndex,
                );
                const available =
                  line?.slas.filter(
                    (s) =>
                      s.deliveryChannel === "delivery" &&
                      !s.availableDeliveryWindows?.length,
                  ) || [];
                return (
                  <label
                    key={item.uniqueId}
                    style={{ display: "block", marginBottom: 16 }}
                  >
                    {item.name}
                    {available.length ? (
                      <select
                        required
                        disabled={busy}
                        value={options[itemIndex] || ""}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            [itemIndex]: e.target.value,
                          })
                        }
                      >
                        <option value="">Choose delivery</option>
                        {available.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {money(s.price)}
                            {s.shippingEstimate
                              ? ` · ${s.shippingEstimate}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p>
                        No supported delivery option available. Select an
                        address or review the cart messages.
                      </p>
                    )}
                  </label>
                );
              })}
              <button
                className="button primary"
                disabled={
                  busy ||
                  !cart.items.length ||
                  !cart.items.every(
                    (item, i) => item.quantity === 0 || options[i],
                  )
                }
              >
                Save delivery options
              </button>
            </form>
          </section>
          <section className="detail-panel">
            <h2>Order summary</h2>
            <dl>
              {cart.totalizers.map((t) => (
                <div key={t.id}>
                  <dt>{t.name}</dt>
                  <dd>{money(t.value)}</dd>
                </div>
              ))}
              <dt>Total</dt>
              <dd>{money(cart.value)}</dd>
            </dl>
            <p>
              Payment and order confirmation are the next step under
              development. No order has been placed.
            </p>
          </section>
        </>
      )}
    </>
  );
}
