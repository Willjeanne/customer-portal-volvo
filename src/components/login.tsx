"use client";
import { useState, type FormEvent } from "react";
import { personas } from "@/domain/fixtures";
import type { Persona } from "@/domain/portal";
import { Icon } from "./icons";

export function Login(): React.JSX.Element {
  const [mode, setMode] = useState<"vtex" | "preview">("preview");
  const [persona, setPersona] = useState<Persona>("buyer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch(
        `/api/portal/${mode === "preview" ? "preview" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "preview"
              ? { persona }
              : {
                  username: values.get("username"),
                  password: values.get("password"),
                },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.error === "string" ? result.error : "Sign-in failed.",
        );
      // Full navigation discards all previous identity/context data in the client router cache.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/home");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      form.reset();
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <div className="login-brand">
        <Brand />
        <span>Customer Portal</span>
      </div>
      <section className="login-card">
        <p className="eyebrow">VOLVO TRUCKS · CUSTOMER PORTAL</p>
        <h1>
          Your work.
          <br />
          Connected.
        </h1>
        <p className="lead">Parts, people and your fleet, in one place.</p>
        <div className="tabs" aria-label="Sign-in mode">
          <button
            type="button"
            aria-pressed={mode === "preview"}
            onClick={() => {
              setMode("preview");
              setError("");
            }}
          >
            Local preview
          </button>
          <button
            type="button"
            aria-pressed={mode === "vtex"}
            onClick={() => {
              setMode("vtex");
              setError("");
            }}
          >
            VTEX sign-in
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "preview" ? (
            <>
              <label htmlFor="persona">Explore as</label>
              <select
                id="persona"
                value={persona}
                onChange={(event) => setPersona(event.target.value as Persona)}
              >
                {Object.entries(personas).map(([id, value]) => (
                  <option key={id} value={id}>
                    {value.label}
                  </option>
                ))}
              </select>
              <p className="form-note">
                Sample WanderGarage data and permissions. This preview does not
                connect to your VTEX account.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                maxLength={70}
                placeholder="wandergarage-buyer"
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
              <p className="form-note">
                Local connection check with your existing VTEX identity. Only
                sign-in and account context are connected in this first version.
              </p>
            </>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button primary wide" disabled={busy}>
            {busy
              ? "Connecting…"
              : mode === "preview"
                ? "Open local preview"
                : "Sign in with VTEX"}
            <Icon name="ArrowRight" size={20} />
          </button>
        </form>
        {mode === "vtex" && (
          <a
            className="external-login"
            href="https://www.emeafaststore.com/api/io/login"
            target="_blank"
            rel="noreferrer"
          >
            Password recovery or SSO on the existing store{" "}
            <Icon name="ArrowSquareOut" size={16} />
          </a>
        )}
      </section>
      <p className="login-footer">
        WanderGarage · Local validation · USA / USD
      </p>
    </main>
  );
}
export function Brand(): React.JSX.Element {
  // Supplied Volvo wordmark, preserved as a raster asset (no recreated logo).
  return (
    <div className="wordmark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/volvo-wordmark.png" alt="Volvo" />
      <span>TRUCKS</span>
    </div>
  );
}
