import { Preparation, ReplenishmentLists } from "@/components/replenishment";
import { Quotes } from "@/components/quotes";
import { quoteStatuses } from "@/domain/quotes";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { validateVtexSession } from "@/server/vtex";
import { canVisit, navigation } from "@/domain/portal";
import { Shell } from "@/components/shell";
import { Home } from "@/components/home";
import { BuyerProfile, BuyerOrders } from "@/components/account-data";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string | string[]; order?: string; list?: string; status?: string; label?: string }>;
}): Promise<React.JSX.Element> {
  const { section } = await params;
  const query = await searchParams;
  const pageNumber = typeof query.page === "string" && /^[1-9][0-9]{0,2}$/.test(query.page) ? Number(query.page) : 1;
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
        <main className="standalone-error">
          <h1>VTEX access could not be confirmed</h1>
          <p>
            Your private workspace is unavailable until access is verified
            again.
          </p>
          <Link href="/login" className="button primary">
            Return to sign in
          </Link>
        </main>
      );
    }
  }
  if (!canVisit(context, section))
    return (
      <Shell context={context}>
        <section className="empty-panel large">
          <Icon name="ShieldCheck" size={44} />
          <h1>Access not available</h1>
          <p>Your current context does not grant access to this action.</p>
          <Link href="/home" className="button secondary">
            Back to home
          </Link>
        </section>
      </Shell>
    );
  return (
    <Shell context={context}>
      {section === "home" ? (
        <Home context={context} />
      ) : (
        <>
          <p className="eyebrow">WANDERGARAGE · CUSTOMER PORTAL</p>
          <h1>{item.label}</h1>
          {section === "quotes" ? (<Quotes session={session} page={pageNumber} status={typeof query.status === "string" && quoteStatuses.some(status => status === query.status) ? query.status : undefined} label={typeof query.label === "string" ? query.label.slice(0,100) : ""} />) : section === "quick-order" ? (<Preparation session={session} orderId={typeof query.order === "string" ? query.order : undefined} listId={typeof query.list === "string" ? query.list : undefined} />) : section === "lists" ? (<ReplenishmentLists session={session} />) : section === "profile" && context.mode === "vtex" ? (
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
            <section className="detail-panel">
              <h2>{context.company}</h2>
              <p className="lead">Your active organizational context</p>
              <dl>
                <dt>Unit</dt>
                <dd>{context.unit.name}</dd>
                <dt>Commercial contract</dt>
                <dd>{context.contract}</dd>
                <dt>Access</dt>
                <dd>{context.user.persona}</dd>
              </dl>
              <p className="form-note">
                Team, addresses, budgets and purchasing controls are scheduled
                in the account-management tranche.
              </p>
            </section>
          ) : section === "fleet" && context.mode === "preview" ? (
            <section className="detail-panel">
              <span className="tag">SAMPLE VEHICLES</span>
              <h2>Your fleet at {context.unit.name}</h2>
              <p>
                Use the vehicle selector above to set or clear your working
                context.
              </p>
              <div className="vehicle-row">
                <Icon name="Truck" size={40} />
                <div>
                  <h3>Truck 147 · Volvo VNL 860</h3>
                  <p>Illustrative vehicle · Fitment not connected</p>
                </div>
              </div>
              <div className="vehicle-row">
                <Icon name="Truck" size={40} />
                <div>
                  <h3>Truck 203 · Volvo VNL 760</h3>
                  <p>Illustrative vehicle · Fitment not connected</p>
                </div>
              </div>
            </section>
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
    </Shell>
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
