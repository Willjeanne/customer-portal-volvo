"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  promissoryOptions,
  type CheckoutView,
  type OrderOutcome,
} from "@/domain/checkout";
export function Checkout() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [outcome, setOutcome] = useState<OrderOutcome | null>(null);
  const submitting = useRef(false);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [cart, setCart] = useState<CheckoutView | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [options, setOptions] = useState<Record<number, string>>({});
  function accept(data: CheckoutView) {
    setCart(data);
    setConfirmed(false);
    setPaymentSystem(data.paymentData?.payments[0]?.paymentSystem || "");
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
  const initialRequest = useRef<Promise<{
    status: OrderOutcome | null;
    cart: CheckoutView | null;
  }> | null>(null);
  useEffect(() => {
    let active = true;
    // React Strict Mode replays effects. Reuse the complete read (including
    // JSON parsing) rather than starting a second competing cart operation.
    initialRequest.current ??= (async () => {
      const response = await fetch("/api/portal/checkout-order-status", {
        cache: "no-store",
      });
      const status = await response.json();
      if (!response.ok)
        throw new Error(status.error || "Order status unavailable.");
      if (status) return { status, cart: null };
      const cartResponse = await fetch("/api/portal/checkout", {
        cache: "no-store",
      });
      const data = await cartResponse.json();
      if (!cartResponse.ok)
        throw new Error(data.error || "Checkout unavailable.");
      return { status: null, cart: data };
    })();
    initialRequest.current
      .then((result) => {
        if (!active) return;
        if (result.status) setOutcome(result.status);
        else if (result.cart) accept(result.cart);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function refresh(body?: unknown, operation = "checkout-shipping") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/${body ? operation : "checkout"}`,
        body
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : { cache: "no-store" },
      );
      if (response.status === 401) setSessionExpired(true);
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
  async function submitOrder() {
    if (!cart || !confirmed || submitting.current) return;
    submitting.current = true;
    setSubmissionLocked(true);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/checkout-place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: cart.revision, confirm: true }),
        signal: AbortSignal.timeout(90000),
      });
      if (response.status === 401) setSessionExpired(true);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Order submission could not be confirmed.",
        );
      setOutcome(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Order submission could not be confirmed.",
      );
      // Reconcile once, read-only. Never resubmit after a lost response.
      try {
        const response = await fetch("/api/portal/checkout-order-status", {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        if (response.status === 401) setSessionExpired(true);
        if (!response.ok) throw new Error();
        const status = await response.json();
        if (status) setOutcome(status);
        else {
          submitting.current = false;
          setSubmissionLocked(false);
        }
      } catch {
        setError(
          "Submission status is unavailable. Reload checkout before continuing; do not place the order again.",
        );
      }
    } finally {
      setBusy(false);
      setConfirmed(false);
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
  if (outcome)
    return (
      <section className="detail-panel checkout-confirmation" role="status">
        <span className="eyebrow">CHECKOUT</span>
        <h2>
          {outcome.status === "submitted"
            ? "Your order has been submitted"
            : "Your order needs confirmation"}
        </h2>
        <p>
          {outcome.status === "submitted"
            ? "VTEX has accepted the order for processing. Payment will follow your Promissory terms; this is not a payment receipt."
            : "We cannot confirm that every step completed. No new purchase will be attempted for this cart. Check your orders before continuing."}
        </p>
        {outcome.failure && (
          <p role="alert">
            Step: {outcome.failure.stage} · {outcome.failure.code}
            {outcome.failure.httpStatus
              ? ` · HTTP ${outcome.failure.httpStatus}`
              : ""}
            {outcome.failure.upstreamCode
              ? ` · VTEX ${outcome.failure.upstreamCode}`
              : ""}
            . Share this information with support to check the refusal and any
            budget or approval requirements.
          </p>
        )}
        <dl>
          <dt>
            {outcome.orderGroup ? "Order reference" : "Support reference"}
          </dt>
          <dd>{outcome.orderGroup || outcome.reference}</dd>
          <dt>Total</dt>
          <dd>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: outcome.currency,
            }).format(outcome.value / 100)}
          </dd>
        </dl>
        <div className="checkout-actions">
          <Link className="button primary" href="/orders">
            View orders
          </Link>
          <Link className="button secondary" href="/home">
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  const methods = cart ? promissoryOptions(cart) : [];
  const availableMethods = cart?.paymentData?.paymentSystems || [];
  const savedPayment = cart?.paymentData?.payments[0];
  const paymentSaved =
    !!savedPayment &&
    methods.some((m) => String(m.id) === savedPayment.paymentSystem) &&
    savedPayment.value === cart?.value;
  const deliverySaved =
    !!cart?.items.length &&
    cart.items.every(
      (item, index) =>
        !item.quantity ||
        cart.shippingData?.logisticsInfo.some(
          (l) =>
            l.itemIndex === index &&
            l.selectedSla &&
            l.selectedDeliveryChannel === "delivery",
        ),
    );
  const deliveryDirty =
    address !== (cart?.shippingData?.selectedAddresses[0]?.addressId || "") ||
    cart?.shippingData?.logisticsInfo.some(
      (l) => (options[l.itemIndex] || "") !== (l.selectedSla || ""),
    );
  return (
    <div className="portal-checkout">
      <Link href="/quick-order">Back to order preparation</Link>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => refresh()}
      >
        Reload checkout
      </button>
      {error && !cart && (
        <p role="alert">
          {error} <Link href="/login">Sign in again</Link>
        </p>
      )}
      {!cart ? (
        <p>{error ? "Checkout could not be loaded." : "Loading your cart…"}</p>
      ) : (
        <>
          <section className="detail-panel">
            <h2>1. Review your cart</h2>
            {!cart.items.length ? (
              <p>Your cart is empty.</p>
            ) : (
              <table className="orders-table checkout-items">
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
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setConfirmed(false);
                    }}
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
            <h2>4. Payment</h2>
            <p>Payment methods returned by VTEX for your current cart.</p>
            <ul aria-label="Available payment methods">
              {availableMethods.map((method) => (
                <li key={method.id}>
                  <strong>{method.name}</strong>
                  {method.description ? ` — ${method.description}` : ""}
                  {!methods.some((supported) => supported.id === method.id) && (
                    <span> · Not yet supported in this portal</span>
                  )}
                </li>
              ))}
            </ul>
            {!availableMethods.length ? (
              <p role="status">
                No payment method is currently offered for this cart. Save
                delivery and reload checkout to check again.
              </p>
            ) : (
              <form
                className="draft-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  refresh(
                    {
                      revision: cart.revision,
                      paymentSystem: Number(paymentSystem),
                    },
                    "checkout-payment",
                  );
                }}
              >
                <label>
                  Payment method
                  <select
                    required
                    disabled={busy}
                    value={paymentSystem}
                    onChange={(e) => {
                      setPaymentSystem(e.target.value);
                      setConfirmed(false);
                    }}
                  >
                    <option value="">Choose payment</option>
                    {availableMethods.map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                        disabled={
                          !methods.some((supported) => supported.id === m.id)
                        }
                      >
                        {m.name}
                        {m.description ? ` — ${m.description}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    !methods.some((m) => String(m.id) === paymentSystem) ||
                    !deliverySaved ||
                    !!deliveryDirty
                  }
                >
                  Save payment method
                </button>
              </form>
            )}
          </section>
          <section className="detail-panel">
            <h2>5. Review and place order</h2>
            <p>
              <strong>Deliver to:</strong>{" "}
              {cart.shippingData?.selectedAddresses
                .map((a) =>
                  [a.receiverName, a.street, a.number, a.city, a.postalCode]
                    .filter(Boolean)
                    .join(", "),
                )
                .join(" · ") || "Not selected"}
            </p>
            <p>
              <strong>Payment:</strong>{" "}
              {methods.find((m) => String(m.id) === savedPayment?.paymentSystem)
                ?.name || "Not selected"}
            </p>
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
            {sessionExpired ? (
              <p role="alert" className="checkout-error">
                Your session has expired. This request could not be completed.{" "}
                <Link href="/login">Sign in again</Link> to review your cart
                before continuing.
              </p>
            ) : (
              error && (
                <p role="alert" className="checkout-error">
                  {error}
                </p>
              )
            )}
            {busy && submissionLocked && (
              <p role="status">
                Submitting your order to VTEX. Please keep this page open…
              </p>
            )}
            <label className="checkout-consent">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={
                  busy ||
                  !paymentSaved ||
                  !deliverySaved ||
                  !!deliveryDirty ||
                  paymentSystem !== savedPayment?.paymentSystem
                }
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I confirm the items, delivery and total shown above.
            </label>
            <button
              className="button primary"
              disabled={
                busy ||
                submissionLocked ||
                sessionExpired ||
                !confirmed ||
                !paymentSaved ||
                !deliverySaved ||
                !!deliveryDirty ||
                paymentSystem !== savedPayment?.paymentSystem
              }
              onClick={submitOrder}
            >
              {busy ? "Please wait…" : `Place order · ${money(cart.value)}`}
            </button>
            <p className="muted">
              Your order will be submitted using the saved payment method.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
