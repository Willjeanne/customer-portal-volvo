import Link from "next/link";
import Form from "next/form";
import { readPurchasingInsights } from "@/server/insights";
import type { PortalSession } from "@/server/session-store";
import { PortalError } from "@/server/security";
import { insightPeriodSchema } from "@/domain/insights";
import { PurchasingInsights } from "./purchasing-insights";

export async function Insights({
  session,
  period,
}: {
  session: PortalSession;
  period?: string;
}) {
  if (session.context.mode !== "vtex")
    return (
      <section className="detail-panel">
        <h2>Your purchasing intelligence</h2>
        <p>
          Sign in with VTEX to explore your purchases, recorded discounts and
          current offers. No sample savings are shown.
        </p>
        <Link className="button primary" href="/login">
          Sign in with VTEX
        </Link>
      </section>
    );
  const selected = insightPeriodSchema.safeParse(period || "90");
  const result = selected.success
    ? await readPurchasingInsights(session, selected.data)
        .then((data) => ({ data, error: null }))
        .catch((error: unknown) => ({ data: null, error }))
    : {
        data: null,
        error: new PortalError(
          400,
          "INSIGHT_PERIOD",
          "Choose a supported period.",
        ),
      };
  return (
    <div className="insights-workspace">
      <div className="insights-intro">
        <div>
          <p className="eyebrow">KNOW YOUR PARTS. PLAN YOUR NEXT PURCHASE.</p>
          <p>
            Understand what you buy, trace your discounts and check today’s
            offers.
          </p>
        </div>
        <Form action="/insights" className="insights-filter">
          <label htmlFor="insight-period">Order period</label>
          <select
            id="insight-period"
            name="period"
            defaultValue={selected.success ? selected.data : "90"}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 365 days</option>
            <option value="all">All available history</option>
          </select>
          <button className="button secondary">Apply</button>
        </Form>
      </div>
      {result.data ? (
        <PurchasingInsights key={result.data.updatedAt} report={result.data} />
      ) : (
        <section className="detail-panel" role="alert">
          <h2>Insights unavailable</h2>
          <p>
            {result.error instanceof PortalError
              ? result.error.message
              : "Your order history could not be analyzed. Please try again."}
          </p>
          <Link href="/insights">Reload insights</Link>
        </section>
      )}
    </div>
  );
}
