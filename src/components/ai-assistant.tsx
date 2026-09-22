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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import type { BuyerContext } from "@/domain/portal";
import {
  applyHistory,
  frameType,
  isDelta,
  makeContactId,
  parseFrame,
  readHistory,
  readProducts,
  readText,
  registerCallback,
  type ChatMessage,
  type ChatProduct,
} from "@/domain/wwc";
import {
  fleet,
  fleetCounts,
  fleetSites,
  statusModifier,
  vehiclePhoto,
  type Vehicle,
} from "@/domain/fleet";

type Status = "idle" | "connecting" | "ready" | "forbidden" | "closed";

const CONTACT_STORAGE_KEY = "volvo_assistant_contact";
const MAX_MESSAGE_LENGTH = 800;

/** A reconnect never fires faster than this, and backs off up to the cap. */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

function money(value: number | null): string | null {
  return value === null
    ? null
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
}

function ProductCard({ product }: { product: ChatProduct }): React.JSX.Element {
  const charged = money(product.price);
  const listed = money(product.listPrice);
  const body = (
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
        <small>SKU {product.id}</small>
      </span>
    </>
  );
  return product.url ? (
    <a
      className="assistant-product"
      href={product.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {body}
      <Icon name="ArrowSquareOut" size={16} />
    </a>
  ) : (
    <div className="assistant-product">{body}</div>
  );
}

function Bubble({ message }: { message: ChatMessage }): React.JSX.Element {
  return (
    <div className={`assistant-turn is-${message.role}`}>
      <div className="assistant-bubble">
        {message.text ? <p>{message.text}</p> : null}
        {message.products.length > 0 && (
          <div className="assistant-products">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
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
  const showcase = useMemo(() => fleet.slice(0, 4), []);

  /** Phrased against vehicles that exist, so no chip invents a reference. */
  const popular = useMemo(() => {
    const lead = highlighted[0];
    return [
      lead
        ? `What parts do I need for ${lead.fleetNumber}'s next service?`
        : "What parts do I need for my next service?",
      "Show vehicles with maintenance due",
      "Compare OEM vs aftermarket parts",
      "Where is my latest order?",
    ];
  }, [highlighted]);

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

      if (type === "typing_start") return setTyping(true);
      if (type === "typing_stop") return setTyping(false);

      if (type === "stream_start") {
        setStreamed("");
        setTyping(true);
        return;
      }

      if (isDelta(frame)) {
        setStreamed((current) => current + frame.v);
        return;
      }

      if (type === "stream_end") {
        const text = typeof frame.content === "string" ? frame.content : "";
        setStreamed("");
        setTyping(false);
        if (text)
          push({
            key: `agent-${Date.now()}-${Math.random()}`,
            role: "agent",
            text,
            products: [],
            at: Date.now(),
          });
        return;
      }

      if (type === "message") {
        const body = frame.message;
        const text = readText(body);
        const products = readProducts(body);
        setStreamed("");
        setTyping(false);
        if (text || products.length)
          push({
            key: `agent-${Date.now()}-${Math.random()}`,
            role: "agent",
            text,
            products,
            at: Date.now(),
          });
      }
    });

    socket.addEventListener("close", () => {
      // Ignore a superseded socket: only the live one may drive a reconnect.
      if (closingRef.current || socketRef.current !== socket) return;
      setStatus("closed");
      setTyping(false);
      // Backoff, and only when the close was neither forbidden nor our own.
      attemptsRef.current += 1;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** (attemptsRef.current - 1),
        RECONNECT_MAX_MS,
      );
      retryRef.current = setTimeout(() => connectRef.current(), delay);
    });
  }, [channelUuid, configured, flowsOrigin, push, socketUrl]);

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
      socketRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamed, typing]);

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
        at: Date.now(),
      });
      setDraft("");
      setTyping(true);
    },
    [contactFields, push],
  );

  const live = status === "ready";

  return (
    <section className="assistant" aria-label="AI Assistant">
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
            <div className="assistant-vehicles">
              {showcase.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
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
            <Bubble key={message.key} message={message} />
          ))}
          {streamed ? (
            <div className="assistant-turn is-agent">
              <div className="assistant-bubble">
                <p>{streamed}</p>
              </div>
            </div>
          ) : null}
          {typing && !streamed ? (
            <div className="assistant-turn is-agent">
              <div className="assistant-bubble assistant-typing">
                <span />
                <span />
                <span />
              </div>
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

      <p className="assistant-disclaimer">
        {!configured
          ? "The assistant channel is not configured for this environment."
          : status === "forbidden"
            ? "This portal address is not allowed on the assistant channel."
            : status === "closed"
              ? "Connection lost. Reconnecting…"
              : status === "connecting"
                ? "Connecting to the assistant…"
                : "Answers may be incomplete. Fleet data is demonstration data and part compatibility is not a certified Volvo fitment source — confirm before ordering."}
      </p>
    </section>
  );
}
