"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canVisit, navigation, type BuyerContext } from "@/domain/portal";
import { previewUnits } from "@/domain/fixtures";
// >>> CLAUDE — lot flotte, 20/09/2026 — à relire
import { fleet } from "@/domain/fleet";
// <<< CLAUDE
import { Icon } from "./icons";
import { Brand } from "./login";

export function Shell({
  context,
  children,
}: {
  context: BuyerContext;
  children: ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = sidebar.current;
    panel?.querySelector<HTMLButtonElement>(".mobile-close")?.focus();
    function keydown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const elements = Array.from(
        panel.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"),
      );
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    panel?.addEventListener("keydown", keydown);
    return () => {
      panel?.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open]);
  async function mutate(operation: string, data: unknown): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/${operation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        // A full navigation clears private pages from the client router cache.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        if (response.status === 401) window.location.assign("/login");
        throw new Error(result.error || "The change could not be saved.");
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (operation === "logout") window.location.assign("/login");
      else router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  function change(
    patch: Partial<Pick<BuyerContext, "vehicle" | "urgency">> & {
      unitId?: string;
    },
  ): void {
    void mutate("context", {
      unitId: context.unit.id,
      vehicle: context.vehicle,
      urgency: context.urgency,
      ...patch,
    });
  }
  const preview = context.mode === "preview";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${open ? "is-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label={open ? "Navigation" : undefined}
      >
        <Link
          href="/home"
          className="brand-link"
          aria-label="Volvo Trucks home"
        >
          <Brand />
          <span>Customer Portal</span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <Icon name="X" />
        </button>
        <nav aria-label="Main navigation">
          {navigation
            .filter((item) => canVisit(context, item.slug))
            .map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                onClick={() => setOpen(false)}
                aria-current={pathname === `/${item.slug}` ? "page" : undefined}
              >
                <Icon name={item.icon} size={23} />
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>
        <div className="sidebar-footer">
          <span>
            DRIVING
            <br />
            PROGRESS
            <br />
            TOGETHER
          </span>
          <button onClick={() => void mutate("logout", {})} disabled={busy}>
            <Icon name="SignOut" size={19} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace" inert={open}>
        <header className="context-bar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Icon name="List" />
          </button>
          <div className="context-field company">
            <Icon name="Buildings" />
            <div>
              <span>Company</span>
              <strong>{context.company}</strong>
            </div>
          </div>
          <div className="context-field">
            <div>
              <label htmlFor="unit">Location</label>
              <select
                id="unit"
                value={context.unit.id}
                disabled={busy || !preview}
                onChange={(event) => change({ unitId: event.target.value })}
              >
                {(preview ? previewUnits : [context.unit]).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="context-field vehicle-context">
            <Icon name="Truck" />
            <div>
              <label htmlFor="vehicle">
                Vehicle <span>(optional)</span>
              </label>
              {/* >>> CLAUDE — lot flotte, 20/09/2026 — à relire
                  Le véhicule est un filtre d'affichage, jamais un droit : il est
                  donc modifiable aussi en session VTEX, contrairement à l'unité. */}
              <select
                id="vehicle"
                disabled={busy}
                value={context.vehicle}
                onChange={(event) => change({ vehicle: event.target.value })}
              >
                <option value="">Not selected</option>
                {fleet.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.fleetNumber} · {vehicle.modelLabel}
                  </option>
                ))}
              </select>
              {/* <<< CLAUDE */}
            </div>
          </div>
          <div className="context-field urgency-context">
            <div>
              <label htmlFor="urgency">Urgency</label>
              <select
                id="urgency"
                /* >>> CLAUDE — lot flotte, 20/09/2026 — à relire */
                disabled={busy}
                /* <<< CLAUDE */
                value={context.urgency}
                onChange={(event) =>
                  change({
                    urgency: event.target.value as BuyerContext["urgency"],
                  })
                }
              >
                <option>Normal</option>
                <option>Maintenance</option>
                <option>Vehicle off road</option>
              </select>
            </div>
          </div>
          <Link href="/profile" className="user-link">
            <span className="avatar">
              {context.user.name
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <span>
              <strong>{context.user.name}</strong>
              <small>{context.user.persona}</small>
            </span>
          </Link>
        </header>
        <div className="mode-banner">
          <Icon name={preview ? "Info" : "ShieldCheck"} size={17} />
          <span>
            {preview
              ? "Local preview · Sample data and permissions · No VTEX changes"
              : "VTEX session · Account context connected · Other features are not integrated yet"}
          </span>
          <span className="currency">USA / USD</span>
        </div>
        {error && (
          <p role="alert" className="error-message global-error">
            {error}
          </p>
        )}
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
