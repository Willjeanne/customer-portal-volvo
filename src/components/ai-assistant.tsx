"use client";
/**
 * AI Assistant — conversational surface over the WWC socket.
 *
 * The socket is opened from the browser, as the protocol guide describes: the
 * channel UUID is public and the origin allowlist is enforced by the channel.
 * No portal session cookie is readable here (HttpOnly) and none is sent: the
 * identity below is the display context the server already rendered.
 *
 * What the agent can actually answer is decided on the Weni platform. This file
 * owns the transport and the presentation only.
 *
 * Endpoints match the native widget bootstrap for this channel (`socketUrl`
 * `https://websocket.weni.ai` → `wss://websocket.weni.ai/ws`, `host`
 * `https://flows.weni.ai`). That config also sets `showVoiceRecordingButton`
 * and `showCameraButton` to false, so the composer here ships neither.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Icon } from "./icons";
import type { BuyerContext } from "@/domain/portal";
import {
  appendMessage,
  applyHistory,
  buildOrderFrame,
  canAddToCart,
  cartQuantity,
  cartTotals,
  frameType,
  isDelta,
  makeContactId,
  parseFrame,
  readEnvelope,
  readHistory,
  readProducts,
  readStoredCart,
  readText,
  readVehicles,
  registerCallback,
  setCartQuantity,
  MAX_CART_QUANTITY,
  type ChatCartLine,
  type ChatMessage,
  type ChatOrderSummary,
  type ChatProduct,
} from "@/domain/wwc";
import {
  fleet,
  fleetCounts,
  fleetSites,
  statusModifier,
  vehicleById,
  vehiclePhoto,
  type Vehicle,
} from "@/domain/fleet";

type Status = "idle" | "connecting" | "ready" | "forbidden" | "closed";

const CONTACT_STORAGE_KEY = "volvo_assistant_contact";
/** Same lifetime as the contact: the cart belongs to this conversation. */
const CART_STORAGE_KEY = "volvo_assistant_cart";
const MAX_MESSAGE_LENGTH = 800;

/** A reconnect never fires faster than this, and backs off up to the cap. */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

/**
 * How long the waiting truck may run without a single frame. The wait survives
 * interim messages, so a flow that never sends `typing_stop` would otherwise
 * leave it running for good. Any frame re-arms it.
 */
const TYPING_TIMEOUT_MS = 45_000;

/**
 * Grace before the wait actually ends. Flows announce their progress as normal
 * messages and stop typing between each one, so ending on the first signal made
 * the truck blink out at every step. Anything arriving inside this window keeps
 * it running; only real silence lets it go.
 */
const TYPING_SETTLE_MS = 2_500;

/**
 * The cart is a tiny external store rather than component state: it survives
 * leaving the section and coming back, and the server snapshot is always
 * empty, so hydration never disagrees with what sessionStorage holds.
 */
const EMPTY_CART: ChatCartLine[] = [];
let cartSnapshot: ChatCartLine[] | null = null;
const cartListeners = new Set<() => void>();

function readCart(): ChatCartLine[] {
  if (cartSnapshot === null) {
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(CART_STORAGE_KEY);
    } catch {
      // Blocked storage: the cart simply starts empty.
    }
    cartSnapshot = readStoredCart(raw);
  }
  return cartSnapshot;
}

function writeCart(next: ChatCartLine[]): void {
  cartSnapshot = next;
  try {
    if (next.length) {
      window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } else {
      window.sessionStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch {
    // Blocked storage only costs the cart surviving a reload.
  }
  cartListeners.forEach((listener) => listener());
}

function subscribeCart(listener: () => void): () => void {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function money(value: number | null): string | null {
  return value === null
    ? null
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
}

type SetQuantity = (product: ChatProduct, quantity: number) => void;

/** At one, the minus becomes a remove: the line leaves the cart. */
function QuantityStepper({
  product,
  quantity,
  onQuantity,
}: {
  product: ChatProduct;
  quantity: number;
  onQuantity: SetQuantity;
}): React.JSX.Element {
  const last = quantity <= 1;
  return (
    <div
      className="assistant-stepper"
      role="group"
      aria-label={`Quantity of ${product.name}`}
    >
      <button
        type="button"
        onClick={() => onQuantity(product, quantity - 1)}
        aria-label={
          last
            ? `Remove ${product.name} from cart`
            : `Decrease quantity of ${product.name}`
        }
      >
        <Icon name={last ? "Trash" : "Minus"} size={14} />
      </button>
      <output aria-live="polite">{quantity}</output>
      <button
        type="button"
        onClick={() => onQuantity(product, quantity + 1)}
        disabled={quantity >= MAX_CART_QUANTITY}
        aria-label={`Increase quantity of ${product.name}`}
      >
        <Icon name="Plus" size={14} />
      </button>
    </div>
  );
}

/** Nothing for an unpriced part: an order line needs an amount. */
function CartControl({
  product,
  quantity,
  onQuantity,
}: {
  product: ChatProduct;
  quantity: number;
  onQuantity: SetQuantity;
}): React.JSX.Element | null {
  if (!canAddToCart(product)) return null;
  if (quantity > 0) {
    return (
      <QuantityStepper
        product={product}
        quantity={quantity}
        onQuantity={onQuantity}
      />
    );
  }
  return (
    <button
      type="button"
      className="assistant-add"
      onClick={() => onQuantity(product, 1)}
      aria-label={`Add ${product.name} to cart`}
    >
      <Icon name="ShoppingCart" size={16} />
      Add to cart
    </button>
  );
}

function ProductCard({
  product,
  quantity,
  onQuantity,
}: {
  product: ChatProduct;
  quantity: number;
  onQuantity: SetQuantity;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  // The same part can appear in several messages, so the id is per instance.
  const panelId = useId();
  const charged = money(product.price);
  const listed = money(product.listPrice);
  const summary = (
    <>
      {product.image ? (
        // Catalogue images come from arbitrary CDNs; next/image would need each
        // host declared, so a plain img keeps unknown sources working.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt="" className="assistant-product-image" />
      ) : (
        <span className="assistant-product-image is-empty" aria-hidden="true">
          <Icon name="Package" size={22} />
        </span>
      )}
      <span className="assistant-product-text">
        <strong>{product.name}</strong>
        {charged ? (
          <span className="assistant-product-price">
            {charged}
            {listed ? <s>{listed}</s> : null}
          </span>
        ) : null}
        {/* The id may carry `#seller#tradePolicy`; only the SKU is for reading. */}
        <small>SKU {product.id.split("#")[0]}</small>
      </span>
    </>
  );
  // The cart control sits beside the summary, never inside it: the summary may
  // be a button, and a button cannot hold another.
  const control = (
    <CartControl product={product} quantity={quantity} onQuantity={onQuantity} />
  );
  // Without a description there is nothing to reveal, so the card stays static.
  if (!product.description) {
    return (
      <div className="assistant-product">
        <div className="assistant-product-row">
          <div className="assistant-product-summary">{summary}</div>
          {control}
        </div>
      </div>
    );
  }
  return (
    <div className={`assistant-product${open ? " is-open" : ""}`}>
      <div className="assistant-product-row">
        <button
          type="button"
          className="assistant-product-summary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {summary}
          <Icon name="CaretDown" size={16} />
        </button>
        {control}
      </div>
      {open ? (
        <p id={panelId} className="assistant-product-description">
          {product.description}
        </p>
      ) : null}
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }): React.JSX.Element {
  return (
    <Link href={`/fleet/${vehicle.id}`} className="assistant-vehicle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={vehiclePhoto(vehicle)} alt="" />
      <span>
        <strong>{vehicle.fleetNumber}</strong>
        <small>{vehicle.modelLabel}</small>
        <span className={`status-pill ${statusModifier(vehicle.status)}`}>
          {vehicle.status}
        </span>
      </span>
    </Link>
  );
}

/**
 * Horizontal vehicle strip driven by explicit arrows rather than a scrollbar.
 * The native scrollbar is hidden; the arrows page by the visible width and the
 * dots below show where the strip is, as in the approved mock.
 */
function VehicleCarousel({
  vehicles,
}: {
  vehicles: Vehicle[];
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [pages, setPages] = useState(1);
  const [current, setCurrent] = useState(0);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // Two pixels of slack: browser zoom leaves scrollLeft fractional, so it
    // never lands exactly on the maximum.
    setCanPrev(track.scrollLeft > 2);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
    const width = track.clientWidth || 1;
    const total = Math.max(1, Math.ceil(track.scrollWidth / width));
    setPages(total);
    setCurrent(Math.min(total - 1, Math.round(track.scrollLeft / width)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    Array.from(track.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [measure, vehicles]);

  const scrollToPage = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }, []);

  const page = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="assistant-carousel">
      <div className="assistant-carousel-track">
        <button
          type="button"
          className="assistant-carousel-arrow is-prev"
          onClick={() => page(-1)}
          disabled={!canPrev}
          aria-label="Show previous vehicles"
        >
          <Icon name="CaretLeft" size={16} />
        </button>
        <div className="assistant-vehicles" ref={trackRef} onScroll={measure}>
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
        <button
          type="button"
          className="assistant-carousel-arrow is-next"
          onClick={() => page(1)}
          disabled={!canNext}
          aria-label="Show next vehicles"
        >
          <Icon name="CaretRight" size={16} />
        </button>
      </div>
      {pages > 1 ? (
        <div className="assistant-carousel-dots">
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`assistant-carousel-dot${index === current ? " is-active" : ""}`}
              onClick={() => scrollToPage(index)}
              aria-label={`Show vehicles, page ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Vehicles an agent pointed at, drawn from the portal's own fleet. Only ids
 * that resolve are shown: an unknown id gets no card, and the agent's
 * `product_url` is never followed — the link is always built here, in-app.
 */
function MessageVehicles({ ids }: { ids: string[] }): React.JSX.Element | null {
  const vehicles = ids
    .map((id) => vehicleById(id))
    .filter((vehicle): vehicle is Vehicle => vehicle !== undefined);
  if (!vehicles.length) return null;
  return (
    <div className="assistant-message-vehicles">
      {vehicles.length === 1 ? (
        <VehicleCard vehicle={vehicles[0]} />
      ) : (
        <VehicleCarousel vehicles={vehicles} />
      )}
    </div>
  );
}

/**
 * A sent cart, as the native widget shows it: a single "cart · N items" row.
 * "Sent", not "placed": the agent receives it, and nothing here knows whether
 * an order was created.
 */
function OrderSummary({ order }: { order: ChatOrderSummary }): React.JSX.Element {
  const total = money(order.total);
  return (
    <div className="assistant-order">
      <span className="assistant-order-icon" aria-hidden="true">
        <Icon name="ShoppingCart" size={20} />
      </span>
      <span>
        <strong>Cart sent</strong>
        <small>
          {order.units} {order.units === 1 ? "item" : "items"}
          {total ? ` · ${total}` : ""}
        </small>
      </span>
    </div>
  );
}

function Bubble({
  message,
  cart,
  onQuantity,
}: {
  message: ChatMessage;
  cart: ChatCartLine[];
  onQuantity: SetQuantity;
}): React.JSX.Element {
  // A carousel sizes to its container, so the bubble takes its full width.
  const wide = message.vehicles.filter((id) => vehicleById(id)).length > 1;
  return (
    <div className={`assistant-turn is-${message.role}`}>
      <div className={`assistant-bubble${wide ? " is-wide" : ""}`}>
        {message.text ? <p>{message.text}</p> : null}
        {message.order ? <OrderSummary order={message.order} /> : null}
        {message.vehicles.length > 0 && (
          <MessageVehicles ids={message.vehicles} />
        )}
        {message.products.length > 0 && (
          <div className="assistant-products">
            {message.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cartQuantity(cart, product.id)}
                onQuantity={onQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The internal cart, as a side panel over the conversation. A modal dialog
 * gives Escape, focus containment and a backdrop for free; closing it by any
 * route — Escape, backdrop, the close button or "Continue shopping" — keeps
 * every line.
 */
function CartDrawer({
  open,
  onClose,
  cart,
  onQuantity,
  onPlaceOrder,
  canOrder,
}: {
  open: boolean;
  onClose: () => void;
  cart: ChatCartLine[];
  onQuantity: SetQuantity;
  onPlaceOrder: () => void;
  canOrder: boolean;
}): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const totals = cartTotals(cart);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="assistant-cart"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Only the backdrop targets the dialog itself; the panel fills it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="assistant-cart-panel">
        <header className="assistant-cart-header">
          <div>
            <h2 id={titleId}>Your cart</h2>
            <p>
              {totals.units} {totals.units === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            className="assistant-cart-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            <Icon name="X" size={20} />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="assistant-cart-empty">
            <span className="assistant-cart-empty-icon" aria-hidden="true">
              <Icon name="ShoppingCart" size={28} />
            </span>
            <strong>Your cart is empty</strong>
            <p>Add parts from the assistant&apos;s answers to build an order.</p>
          </div>
        ) : (
          <ul className="assistant-cart-lines">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="assistant-cart-line">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" className="assistant-product-image" />
                ) : (
                  <span className="assistant-product-image is-empty" aria-hidden="true">
                    <Icon name="Package" size={22} />
                  </span>
                )}
                <div className="assistant-cart-line-text">
                  <strong>{product.name}</strong>
                  <small>
                    SKU {product.id.split("#")[0]} · {money(product.price)} each
                  </small>
                </div>
                <div className="assistant-cart-line-actions">
                  <QuantityStepper
                    product={product}
                    quantity={quantity}
                    onQuantity={onQuantity}
                  />
                  <span className="assistant-cart-line-total">
                    {money((product.price ?? 0) * quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="assistant-cart-footer">
          {cart.length > 0 ? (
            <>
              <dl className="assistant-cart-totals">
                {totals.savings > 0 ? (
                  <>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{money(totals.subtotal)}</dd>
                    </div>
                    <div className="is-discount">
                      <dt>Discount</dt>
                      <dd>−{money(totals.savings)}</dd>
                    </div>
                  </>
                ) : null}
                <div className="is-total">
                  <dt>Total</dt>
                  <dd>{money(totals.total)}</dd>
                </div>
              </dl>
              <p className="assistant-cart-note">
                {canOrder
                  ? "The cart is sent to the assistant, which confirms the next steps."
                  : "Reconnecting to the assistant. Your cart is kept."}
              </p>
              <button
                type="button"
                className="button primary wide"
                onClick={onPlaceOrder}
                disabled={!canOrder}
              >
                Place order
              </button>
            </>
          ) : null}
          <button type="button" className="button secondary wide" onClick={onClose}>
            Continue shopping
          </button>
        </footer>
      </div>
    </dialog>
  );
}

export function AiAssistant({
  context,
}: {
  context: BuyerContext;
}): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  /**
   * Status is seeded from configuration and then only ever moved by socket
   * lifecycle callbacks — never synchronously from an effect body.
   */
  const [status, setStatus] = useState<Status>(() =>
    process.env.NEXT_PUBLIC_WENI_SOCKET_URL &&
    process.env.NEXT_PUBLIC_WENI_CHANNEL_UUID
      ? "connecting"
      : "idle",
  );
  const [typing, setTyping] = useState(false);
  const [streamed, setStreamed] = useState("");
  const cart = useSyncExternalStore(subscribeCart, readCart, () => EMPTY_CART);
  const [cartOpen, setCartOpen] = useState(false);
  const cartUnits = useMemo(() => cartTotals(cart).units, [cart]);
  const setQuantity = useCallback<SetQuantity>((product, quantity) => {
    writeCart(setCartQuantity(readCart(), product, quantity));
  }, []);

  const socketRef = useRef<WebSocket | null>(null);
  const contactRef = useRef<string>("");
  const registeredRef = useRef(false);
  const closingRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const firstSendRef = useRef(true);
  /** Reconnect reaches the latest `connect` through this ref, not itself. */
  const connectRef = useRef<() => void>(() => {});
  /** Pending end of the wait, cancelled by the next frame. */
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const socketUrl = process.env.NEXT_PUBLIC_WENI_SOCKET_URL || "";
  const channelUuid = process.env.NEXT_PUBLIC_WENI_CHANNEL_UUID || "";
  const flowsOrigin =
    process.env.NEXT_PUBLIC_WENI_FLOWS_ORIGIN || "https://flows.weni.ai";
  const configured = Boolean(socketUrl && channelUuid);

  const started = messages.length > 0 || streamed.length > 0;
  const counts = useMemo(() => fleetCounts(), []);

  /**
   * Suggestions are built from the fleet actually present, so a chip never
   * names a vehicle or a symptom that the data does not contain.
   */
  const highlighted = useMemo(() => fleet.filter((v) => v.alert).slice(0, 2), []);
  const showcase = useMemo(() => fleet.slice(0, 8), []);

  /** Phrased against vehicles that exist, so no chip invents a reference. */
  const popular = useMemo(() => {
    const lead = highlighted[0];
    return [
      lead
        ? `What parts do I need for ${lead.fleetNumber}'s next service?`
        : "What parts do I need for my next service?",
      "Show vehicles with maintenance due",
      "Where is my latest order?",
    ];
  }, [highlighted]);

  /**
   * The wait is a single state with a settle delay, not a switch: every frame
   * keeps the truck running, and an end signal only schedules its stop, so a
   * progress message and the truck are on screen at the same time.
   */
  const startWaiting = useCallback(() => {
    if (settleRef.current) {
      clearTimeout(settleRef.current);
      settleRef.current = null;
    }
    setTyping(true);
  }, []);

  const endWaiting = useCallback(() => {
    if (settleRef.current) {
      clearTimeout(settleRef.current);
      settleRef.current = null;
    }
    setTyping(false);
  }, []);

  const settleWaiting = useCallback(() => {
    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      settleRef.current = null;
      setTyping(false);
    }, TYPING_SETTLE_MS);
  }, []);

  /**
   * One agent turn as it should be read. An envelope is expanded into the
   * parts it announces; the duplicate guard then drops whichever copy arrives
   * second, envelope or real frame.
   */
  const pushAgent = useCallback(
    (text: string, products: ChatProduct[], vehicles: string[]) => {
      const parts = text ? readEnvelope(text) : null;
      const turns = parts ?? [{ text, products, vehicles }];
      setMessages((current) =>
        turns.reduce(
          (thread, turn) =>
            turn.text || turn.products.length || turn.vehicles.length
              ? appendMessage(thread, {
                  key: `agent-${Date.now()}-${Math.random()}`,
                  role: "agent",
                  text: turn.text,
                  products: turn.products,
                  vehicles: turn.vehicles,
                  at: Date.now(),
                })
              : thread,
          current,
        ),
      );
    },
    [],
  );

  const push = useCallback((message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  }, []);

  /** Identity travels as custom fields; nothing here is a credential. */
  const contactFields = useMemo(
    () => ({
      portal_user: context.user.username,
      portal_unit: context.unit.name,
      portal_company: context.company,
      portal_mode: context.mode,
    }),
    [context],
  );

  const connect = useCallback(() => {
    if (!configured || closingRef.current) return;
    if (typeof window === "undefined") return;

    let contact = contactRef.current;
    if (!contact) {
      try {
        contact = window.sessionStorage.getItem(CONTACT_STORAGE_KEY) || "";
      } catch {
        contact = "";
      }
      if (!contact) {
        contact = makeContactId(window.location.hostname);
        try {
          window.sessionStorage.setItem(CONTACT_STORAGE_KEY, contact);
        } catch {
          // A blocked storage only costs thread continuity, not the session.
        }
      }
      contactRef.current = contact;
    }

    registeredRef.current = false;

    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch {
      // Retry later rather than change state inside this synchronous path.
      retryRef.current = setTimeout(
        () => connectRef.current(),
        RECONNECT_BASE_MS,
      );
      return;
    }
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "register",
          from: contact,
          callback: registerCallback(flowsOrigin, channelUuid),
        }),
      );
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      // A socket replaced by a remount must not keep writing to state.
      if (socketRef.current !== socket) return;
      const frame = parseFrame(event.data);
      if (!frame) return;
      const type = frameType(frame);

      // Terminal: the page origin is not on the channel allowlist.
      if (type === "forbidden") {
        closingRef.current = true;
        setStatus("forbidden");
        socket.close();
        return;
      }

      // Any non-forbidden frame proves the register landed — including an
      // early ping, which must mark ready before the pong is answered.
      if (!registeredRef.current) {
        registeredRef.current = true;
        attemptsRef.current = 0;
        setStatus("ready");
      }

      if (type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }

      if (type === "ready_for_message") {
        const history = readHistory(
          (frame.data as Record<string, unknown> | undefined)?.history,
        );
        setMessages((current) => applyHistory(current, history));
        return;
      }

      if (type === "typing_start") return startWaiting();
      if (type === "typing_stop") return settleWaiting();

      if (type === "stream_start") {
        setStreamed("");
        startWaiting();
        return;
      }

      if (isDelta(frame)) {
        startWaiting();
        setStreamed((current) => current + frame.v);
        return;
      }

      if (type === "stream_end") {
        const text = typeof frame.content === "string" ? frame.content : "";
        setStreamed("");
        settleWaiting();
        if (text) pushAgent(text, [], []);
        return;
      }

      if (type === "message") {
        const body = frame.message;
        const text = readText(body);
        const products = readProducts(body);
        const vehicles = readVehicles(body);
        setStreamed("");
        // Not an immediate stop. An agent that answers "one moment" and keeps
        // working sends that as an ordinary message; ending the wait on it
        // would claim the turn is over. The settle window below keeps the
        // truck running, and the message simply lands above it.
        settleWaiting();
        if (text || products.length || vehicles.length)
          pushAgent(text, products, vehicles);
      }
    });

    socket.addEventListener("close", () => {
      // Ignore a superseded socket: only the live one may drive a reconnect.
      if (closingRef.current || socketRef.current !== socket) return;
      setStatus("closed");
      endWaiting();
      // Backoff, and only when the close was neither forbidden nor our own.
      attemptsRef.current += 1;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** (attemptsRef.current - 1),
        RECONNECT_MAX_MS,
      );
      retryRef.current = setTimeout(() => connectRef.current(), delay);
    });
  }, [
    channelUuid,
    configured,
    flowsOrigin,
    endWaiting,
    pushAgent,
    settleWaiting,
    socketUrl,
    startWaiting,
  ]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    // Cleared on every mount: the cleanup below sets it, and a remount — a
    // dev double-invoke, or simply leaving this section and coming back —
    // must be able to open a socket again.
    closingRef.current = false;
    connect();
    return () => {
      closingRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    // The waiting truck weighs ~335 KB. Fetched on mount, it is cached before
    // the first question, so the wait never starts on an empty frame.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const image = new window.Image();
    image.decoding = "async";
    image.src = "/assistant/truck-loader.webp";
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamed, typing]);

  // Re-armed by every new message or delta: the wait lasts as long as the
  // agent keeps producing, and ends by itself when it goes quiet.
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(endWaiting, TYPING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [typing, messages, streamed, endWaiting]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      const socket = socketRef.current;
      if (!trimmed || !socket || socket.readyState !== WebSocket.OPEN) return;

      // The contact does not exist before the first message, so the fields
      // ride along with it; afterwards they would go one at a time.
      socket.send(
        JSON.stringify(
          firstSendRef.current
            ? {
                type: "message_with_fields",
                message: { type: "text", text: trimmed },
                data: contactFields,
              }
            : { type: "message", message: { type: "text", text: trimmed } },
        ),
      );
      firstSendRef.current = false;

      push({
        key: `visitor-${Date.now()}`,
        role: "visitor",
        text: trimmed,
        products: [],
        vehicles: [],
        at: Date.now(),
      });
      setDraft("");
      startWaiting();
    },
    [contactFields, push, startWaiting],
  );

  /**
   * "Place order": the whole cart goes to the agent as one `order` message,
   * the native widget's payload. The cart is emptied only once the frame is
   * handed to an open socket; otherwise every line stays where it was.
   */
  const placeOrder = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const current = readCart();
    const frame = buildOrderFrame(current, {
      first: firstSendRef.current,
      fields: contactFields,
    });
    if (!frame) return;
    socket.send(JSON.stringify(frame));
    firstSendRef.current = false;

    const totals = cartTotals(current);
    push({
      key: `visitor-order-${Date.now()}`,
      role: "visitor",
      text: "",
      products: [],
      vehicles: [],
      order: { units: totals.units, lines: current.length, total: totals.total },
      at: Date.now(),
    });
    writeCart([]);
    setCartOpen(false);
    startWaiting();
  }, [contactFields, push, startWaiting]);

  /**
   * Restart: the thread is dropped locally and a new contact id is drawn, so
   * the channel opens a fresh conversation instead of replaying the history of
   * the previous one. The old socket is detached before closing, so its close
   * handler cannot schedule a reconnect that would race this one.
   */
  const restart = useCallback(() => {
    const previous = socketRef.current;
    socketRef.current = null;
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    previous?.close();

    contactRef.current = "";
    try {
      window.sessionStorage.removeItem(CONTACT_STORAGE_KEY);
    } catch {
      // A blocked storage only means the next reload starts a new thread too.
    }

    registeredRef.current = false;
    firstSendRef.current = true;
    attemptsRef.current = 0;
    setMessages([]);
    setStreamed("");
    // The cart belongs to the conversation it was built in.
    writeCart([]);
    setCartOpen(false);
    endWaiting();
    setDraft("");
    setStatus(configured ? "connecting" : "idle");
    closingRef.current = false;
    connectRef.current();
  }, [configured, endWaiting]);

  const live = status === "ready";

  return (
    <section className="assistant" aria-label="AI Assistant">
      <div className="assistant-actions">
        <button
          type="button"
          className={`assistant-cart-toggle${cartUnits > 0 ? " has-items" : ""}`}
          onClick={() => setCartOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Open cart, ${cartUnits} ${cartUnits === 1 ? "item" : "items"}`}
        >
          <Icon name="ShoppingCart" size={18} />
          Cart
          {cartUnits > 0 ? (
            // Keyed on the count so the badge replays its bump on every add.
            <span key={cartUnits} className="assistant-cart-count">
              {cartUnits > 99 ? "99+" : cartUnits}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="assistant-restart"
          onClick={restart}
        >
          <Icon name="Plus" size={16} />
          New conversation
        </button>
      </div>

      {!started ? (
        <div className="assistant-landing">
          <div className="assistant-intro">
            <p className="eyebrow">AI ASSISTANT</p>
            {/*
              `user.name` is the VTEX login, not a given name (server/vtex.ts:173),
              and no email is exposed by the session. It is shown verbatim rather
              than prettified into a first name that was never provided.
            */}
            <h1>Hello, {context.user.name}</h1>
            <p className="assistant-tagline">
              Your Volvo expert, always at hand.
            </p>
            <p className="assistant-lede">
              Ask about parts, vehicles, orders, quotes, contracts or services.
              Answers come from this portal and from the Volvo catalogue.
            </p>
          </div>

          <aside className="assistant-fleet">
            <header>
              <div>
                <h2>Your fleet</h2>
                <p>
                  {counts.all} vehicles across {fleetSites.length} locations
                </p>
              </div>
              <Link href="/fleet" className="button secondary">
                View all vehicles
                <Icon name="ArrowRight" size={16} />
              </Link>
            </header>
            <VehicleCarousel vehicles={showcase} />
          </aside>

          <div className="assistant-prompts">
            <h2>How can I help you today?</h2>
            <p className="assistant-prompts-note">
              Try one of these, based on your fleet:
            </p>
            <div className="assistant-suggestions">
              {highlighted.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  className="assistant-suggestion"
                  disabled={!live}
                  onClick={() =>
                    send(
                      `Which parts should I check for ${vehicle.fleetNumber} (${vehicle.modelLabel}) after the alert "${vehicle.alert?.title}"?`,
                    )
                  }
                >
                  <span className="assistant-suggestion-icon">
                    <Icon name="MagnifyingGlass" size={20} />
                  </span>
                  <span>
                    <strong>Find parts for {vehicle.fleetNumber}</strong>
                    <small>{vehicle.alert?.title}</small>
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="assistant-suggestion"
                disabled={!live}
                onClick={() =>
                  send("Which vehicles in my fleet need maintenance?")
                }
              >
                <span className="assistant-suggestion-icon">
                  <Icon name="Truck" size={20} />
                </span>
                <span>
                  <strong>Vehicles needing attention</strong>
                  <small>
                    {counts.needsAttention} due · {counts.critical} off road
                  </small>
                </span>
              </button>
              <button
                type="button"
                className="assistant-suggestion"
                disabled={!live}
                onClick={() => send("Show me my most recent orders.")}
              >
                <span className="assistant-suggestion-icon">
                  <Icon name="Package" size={20} />
                </span>
                <span>
                  <strong>Track an order</strong>
                  <small>See latest updates</small>
                </span>
              </button>
            </div>

            <h3 className="assistant-popular-title">Popular questions</h3>
            <div className="assistant-popular">
              {popular.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="assistant-chip"
                  disabled={!live}
                  onClick={() => send(question)}
                >
                  {question}
                  <Icon name="ArrowRight" size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="assistant-thread" ref={threadRef}>
          {messages.map((message) => (
            <Bubble
              key={message.key}
              message={message}
              cart={cart}
              onQuantity={setQuantity}
            />
          ))}
          {streamed ? (
            <div className="assistant-turn is-agent">
              <div className="assistant-bubble">
                <p>{streamed}</p>
              </div>
            </div>
          ) : null}
          {typing ? (
            <div className="assistant-turn is-agent">
              {/*
                The wait is a Volvo truck on the move, the same asset the
                FastStore copilot uses (`Copilot/assets/truck-loader.webp`):
                an animated WebP with transparency, so it loops on its own and
                plays in every browser. A still frame is served under
                prefers-reduced-motion; the spoken status lives in the label.
              */}
              <picture className="assistant-waiting">
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet="/assistant/truck-loader-still.webp"
                />
                <img
                  src="/assistant/truck-loader.webp"
                  width={360}
                  height={84}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                />
              </picture>
              <span className="visually-hidden" aria-live="polite">
                The assistant is preparing an answer
              </span>
            </div>
          ) : null}
        </div>
      )}

      <form
        className="assistant-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <label className="visually-hidden" htmlFor="assistant-input">
          Ask the assistant
        </label>
        <input
          id="assistant-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          autoComplete="off"
          placeholder={
            live
              ? "Ask anything about your fleet, parts, orders…"
              : "Connecting to the assistant…"
          }
          disabled={!live}
        />
        <button
          type="submit"
          className="assistant-send"
          disabled={!live || !draft.trim()}
          aria-label="Send message"
        >
          <Icon name="PaperPlaneRight" size={18} />
        </button>
      </form>

      {/*
        Connection state only. The standing data disclaimer was dropped on
        request; nothing is rendered once the channel is live, so the line
        never takes space when it has nothing to say.
      */}
      {!configured ? (
        <p className="assistant-disclaimer">
          The assistant channel is not configured for this environment.
        </p>
      ) : status === "forbidden" ? (
        <p className="assistant-disclaimer">
          This portal address is not allowed on the assistant channel.
        </p>
      ) : status === "closed" ? (
        <p className="assistant-disclaimer">Connection lost. Reconnecting…</p>
      ) : status === "connecting" ? (
        <p className="assistant-disclaimer">Connecting to the assistant…</p>
      ) : null}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onQuantity={setQuantity}
        onPlaceOrder={placeOrder}
        canOrder={live}
      />
    </section>
  );
}
