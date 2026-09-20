import Link from "next/link";
import type { BuyerContext } from "@/domain/portal";
import { Icon } from "./icons";

const tasks = [
  {
    href: "/parts",
    icon: "MagnifyingGlass",
    title: "Find the right part",
    description: "Search parts by vehicle, category or part number.",
    permission: "purchase",
  },
  {
    href: "/quick-order",
    icon: "ShoppingCart",
    title: "Replenish workshop stock",
    description: "Order commonly used parts and keep your workshop ready.",
    permission: "purchase",
  },
  {
    href: "/quotes",
    icon: "FileText",
    title: "Review quotes",
    description: "Keep track of quotes and their next steps.",
  },
  {
    href: "/orders",
    icon: "Package",
    title: "Track orders & deliveries",
    description: "See the latest status of your orders and deliveries.",
  },
] as const;
export function Home({
  context,
}: {
  context: BuyerContext;
}): React.JSX.Element {
  const preview = context.mode === "preview";
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER PORTAL</p>
          <h1>
            Welcome,{" "}
            {context.user.name === "WanderGarage Buyer"
              ? "WanderGarage"
              : context.user.name.split(" ")[0]}
            .
          </h1>
          <p className="lead">
            Here’s what needs your attention at {context.unit.name}.
          </p>
        </div>
        <div className="heading-aside">
          {preview ? "Your local workspace" : "Your connected workspace"}
          <br />
          <span>Keep your fleet moving.</span>
        </div>
      </div>
      {preview && context.vehicle ? (
        <section className="vehicle-alert" aria-labelledby="alert-title">
          <div className="vehicle-art">
            <span className="alert-kicker">
              <Icon name="Warning" size={24} />
              VEHICLE ALERT
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/volvo-truck.png"
              alt="Silver Volvo truck, illustrative vehicle"
            />
          </div>
          <div className="alert-copy">
            <span className="tag">ILLUSTRATIVE SCENARIO</span>
            <h2 id="alert-title">Brake wear detected</h2>
            <p>Review the vehicle need with your dealer.</p>
            <small>
              {context.vehicle} <span> | </span> Volvo VNL 860 <span> | </span>{" "}
              Sample vehicle
            </small>
          </div>
          <div className="alert-actions">
            <p>
              This sample alert does not provide a driving or safety
              recommendation.
            </p>
            <Link className="button primary" href="/services">
              Build a solution
              <Icon name="ArrowRight" size={18} />
            </Link>
            <Link className="button secondary" href="/fleet">
              View vehicle
            </Link>
          </div>
        </section>
      ) : (
        <section className="context-notice">
          <Icon name="ShieldCheck" size={32} />
          <div>
            <h2>
              {preview
                ? "Ready for your next stock order"
                : "Your account context is connected"}
            </h2>
            <p>
              {preview
                ? "A vehicle is optional. Keep working with your workshop and purchasing context."
                : "Your unit was read from VTEX. Effective purchasing permissions and business data still need to be qualified."}
            </p>
          </div>
        </section>
      )}
      <div className="home-columns">
        <section>
          <h2>What do you need to do?</h2>
          <p className="section-subtitle">
            Common tasks to keep your fleet running.
          </p>
          <div className="task-list">
            {tasks
              .filter(
                (task) =>
                  !("permission" in task) ||
                  context.permissions.includes(task.permission),
              )
              .map((task) => (
                <Link key={task.href} href={task.href} className="task">
                  <span className="task-icon">
                    <Icon name={task.icon} size={34} />
                  </span>
                  <span>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </span>
                  <Icon name="CaretRight" size={21} />
                </Link>
              ))}
            {context.permissions.includes("approve") && (
              <Link href="/approvals" className="task">
                <span className="task-icon">
                  <Icon name="CheckCircle" size={34} />
                </span>
                <span>
                  <h3>Review approvals</h3>
                  <p>Review purchases awaiting an authorized decision.</p>
                </span>
                <Icon name="CaretRight" size={21} />
              </Link>
            )}
            {context.permissions.includes("manage-organization") && (
              <Link href="/organization" className="task">
                <span className="task-icon">
                  <Icon name="UsersThree" size={34} />
                </span>
                <span>
                  <h3>Manage your organization</h3>
                  <p>Your team, locations and purchasing controls.</p>
                </span>
                <Icon name="CaretRight" size={21} />
              </Link>
            )}
          </div>
        </section>
        <aside className="work-panel">
          <div className="section-heading">
            <h2>My work</h2>
            {preview && <span className="subtle-label">SAMPLE DATA</span>}
          </div>
          {preview ? (
            <div className="work-list">
              <WorkItem
                href="/quotes"
                icon="FileText"
                title="Quote QT-DEMO-10457"
                status="Ready for review"
                detail="Sample quote · USD"
              />
              <WorkItem
                href="/orders"
                icon="Package"
                title="Order DEMO-78451"
                status="Delivery update"
                detail="Sample order · Tracking preview"
              />
              <WorkItem
                href="/claims"
                icon="Certificate"
                title="Parts Assure claim"
                status="Review supporting documents"
                detail="Sample service scenario"
              />
            </div>
          ) : (
            <div className="empty-panel">
              <Icon name="ListBullets" size={32} />
              <h3>Work queue not connected yet</h3>
              <p>
                Orders, quotes and claims will appear after their services are
                integrated.
              </p>
            </div>
          )}
          <Link href="/support" className="dealer-card">
            <Icon name="Headset" size={30} />
            <span>
              <small>Dealer support</small>
              <strong>Keep the context of your request</strong>
            </span>
            <Icon name="ArrowRight" size={20} />
          </Link>
          <div className="help-card">
            <Icon name="Info" size={30} />
            <div>
              <h3>Need help?</h3>
              <p>Find support for parts, orders and your account.</p>
              <Link href="/support">
                Go to support <Icon name="ArrowRight" size={18} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
function WorkItem({
  href,
  icon,
  title,
  status,
  detail,
}: {
  href: string;
  icon: "FileText" | "Package" | "Certificate";
  title: string;
  status: string;
  detail: string;
}): React.JSX.Element {
  return (
    <Link className="work-item" href={href}>
      <Icon name={icon} size={30} />
      <span>
        <h3>{title}</h3>
        <p>{status}</p>
        <small>{detail}</small>
      </span>
      <Icon name="CaretRight" size={18} />
    </Link>
  );
}
