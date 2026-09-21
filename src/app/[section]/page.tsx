import { Organization } from "@/components/organization";
import { Preparation, ReplenishmentLists } from "@/components/replenishment";
import { Quotes } from "@/components/quotes";
// >>> CLAUDE — lot flotte, 20/09/2026 — à relire
import { FleetList } from "@/components/fleet-list";
// <<< CLAUDE
// >>> CLAUDE — lot find parts, 20/09/2026 — à relire
import { FindParts } from "@/components/find-parts";
import { parseSelectedFacets } from "@/domain/parts";
// <<< CLAUDE

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { validateVtexSession } from "@/server/vtex";
import { canVisit, navigation } from "@/domain/portal";
import { Home } from "@/components/home";
import { BuyerProfile, BuyerOrders } from "@/components/account-data";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{
    page?: string | string[];
    order?: string;
    list?: string;
    status?: string;
    label?: string;
    unitPath?: string;
    // >>> CLAUDE — lot find parts, 20/09/2026 — à relire
    q?: string;
    f?: string | string[];
    // <<< CLAUDE
  }>;
}): Promise<React.JSX.Element> {
  const { section } = await params;
  const query = await searchParams;
  const pageNumber =
    typeof query.page === "string" && /^[1-9][0-9]{0,2}$/.test(query.page)
      ? Number(query.page)
      : 1;
  const item = navigation.find((entry) => entry.slug === section);
  if (!item) notFound();
  const session = await getSession();
  if (!session) redirect("/login");
  const context = session.context;
  if (context.mode === "vtex") {
    try {
      await validateVtexSession(session.upstreamCookies || "");
    } catch {
      return (
        <section className="detail-panel">
          <h1>VTEX access could not be confirmed</h1>
          <p>
            Your private workspace is unavailable until access is verified
            again.
          </p>
          <Link href="/login" className="button primary">
            Return to sign in
          </Link>
        </section>
      );
    }
  }
  if (!canVisit(context, section))
    return (
      <>
        <section className="empty-panel large">
          <Icon name="ShieldCheck" size={44} />
          <h1>Access not available</h1>
          <p>Your current context does not grant access to this action.</p>
          <Link href="/home" className="button secondary">
            Back to home
          </Link>
        </section>
      </>
    );
  return (
    <>
      {section === "home" ? (
        <Home context={context} />
      ) : /* >>> CLAUDE — lot flotte, 20/09/2026 — à relire
             La flotte porte son propre titre « My fleet », comme la maquette. */
      section === "fleet" ? (
        <FleetList selected={context.vehicle || undefined} />
      ) : (
        /* <<< CLAUDE */ <>
          <p className="eyebrow">WANDERGARAGE · CUSTOMER PORTAL</p>
          <h1>{item.label}</h1>
          {/* >>> CLAUDE — lot find parts, 20/09/2026 — à relire */}
          {section === "parts" ? (
            <FindParts
              session={session}
              query={typeof query.q === "string" ? query.q.slice(0, 120) : ""}
              facets={parseSelectedFacets(query.f)}
              page={pageNumber}
            />
          ) : /* <<< CLAUDE */ section === "quotes" ? (
            <Quotes
              session={session}
              page={pageNumber}
              status={
                typeof query.status === "string" &&
                ["pending", "expired"].includes(query.status)
                  ? query.status
                  : undefined
              }
              label={
                typeof query.label === "string" ? query.label.slice(0, 100) : ""
              }
            />
          ) : section === "quick-order" ? (
            <Preparation
              session={session}
              orderId={
                typeof query.order === "string" ? query.order : undefined
              }
              listId={typeof query.list === "string" ? query.list : undefined}
            />
          ) : section === "lists" ? (
            <ReplenishmentLists session={session} />
          ) : section === "profile" && context.mode === "vtex" ? (
            <BuyerProfile session={session} />
          ) : section === "orders" && context.mode === "vtex" ? (
            <BuyerOrders session={session} page={pageNumber} />
          ) : section === "profile" ? (
            <section className="detail-panel">
              <h2>Your account</h2>
              <dl>
                <dt>Name</dt>
                <dd>{context.user.name}</dd>
                <dt>Username</dt>
                <dd>{context.user.username}</dd>
                <dt>Organization</dt>
                <dd>{context.company}</dd>
                <dt>Location</dt>
                <dd>{context.unit.name}</dd>
                <dt>Commercial contract</dt>
                <dd>{context.contract}</dd>
                <dt>Session</dt>
                <dd>
                  {context.mode === "preview"
                    ? "Local preview · Sample permissions"
                    : "VTEX · Effective permissions pending verification"}
                </dd>
              </dl>
              <p className="form-note">
                Profile editing and preferences will be connected to the account
                service. Sign out ends this portal session.
              </p>
            </section>
          ) : section === "organization" ? (
            <Organization
              session={session}
              unitPath={
                typeof query.unitPath === "string" ? query.unitPath : ""
              }
            />
          ) : (
            <section className="empty-panel large">
              <Icon name={item.icon} size={44} />
              <h2>
                {section === "support"
                  ? "Your dealer connection is being prepared"
                  : "This workspace is coming next"}
              </h2>
              <p>
                {descriptions[section] ||
                  "This capability remains in scope and will be connected in its delivery tranche."}
              </p>
              <p className="form-note">
                No request, purchase or external action has been submitted.
              </p>
              <Link href="/home" className="button secondary">
                Back to home
                <Icon name="ArrowRight" size={18} />
              </Link>
            </section>
          )}
        </>
      )}
    </>
  );
}
const descriptions: Record<string, string> = {
  "quick-order":
    "Manual entry, paste and CSV import arrive in tranche 2. XLSX remains planned in tranche 5.",
  orders:
    "Order history, delivery details, documents and reordering arrive in tranche 2.",
  lists: "Saved lists and replenishment arrive in tranche 2.",
  quotes:
    "Quote creation, review and conversion arrive in tranche 4 with persistent server-side rules.",
  approvals: "The authorized approval queue and decisions arrive in tranche 3.",
  payments:
    "Authorized payment methods and commercial terms arrive in tranche 3.",
  parts:
    "Contextual part discovery and vehicle compatibility arrive with the Volvo journeys.",
  claims:
    "Returns, warranty and Parts Assure claims need their own identified services.",
  services:
    "Vehicle coverage, service needs and dealer handover will be connected in the Volvo tranches.",
  support:
    "The receiving dealer service must be identified before a request can be sent.",
};
