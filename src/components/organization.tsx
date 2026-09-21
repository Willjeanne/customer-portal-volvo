import { Icon } from "./icons";
import Link from "next/link";
import { OrganizationActions } from "./organization-actions";
import type { PortalSession } from "@/server/session-store";
import {
  resolveOrganizationUnit,
  getOrganizationChildren,
  getOrganizationUsers,
  getCostCenters,
  getOrganizationRoles,
} from "@/server/organization";
import { PortalError } from "@/server/security";

export async function Organization({
  session,
  unitPath = "",
}: {
  session: PortalSession;
  unitPath?: string;
}) {
  const path = unitPath ? unitPath.split(",") : [];
  let selected;
  try {
    selected = await resolveOrganizationUnit(session, path);
  } catch {
    return (
      <section className="detail-panel" role="alert">
        <h2>Unit unavailable</h2>
        <p>This organization path could not be verified.</p>
        <Link href="/organization">Return to your organization</Link>
      </section>
    );
  }
  const unitLink = (ids: string[]) =>
    ids.length
      ? `/organization?unitPath=${encodeURIComponent(ids.join(","))}`
      : "/organization";

  const results =
    session.context.mode === "vtex"
      ? await Promise.allSettled([
          getOrganizationChildren(session, selected.id),
          getOrganizationUsers(session, selected.id),
          getCostCenters(session),
          getOrganizationRoles(session, selected.id),
        ])
      : null;
  function failure(error: unknown) {
    return (
      <p role="status">
        {error instanceof PortalError
          ? error.message
          : "Organization information could not be loaded."}
      </p>
    );
  }
  const children = results?.[0];
  const users = results?.[1];
  const centers = results?.[2];
  const roles = results?.[3];
  return (
    <>
      <section className="detail-panel">
        <h2>{session.context.company}</h2>
        <dl>
          <dt>Unit being managed</dt>
          <dd>{selected.name}</dd>
          <dt>Commercial contract</dt>
          <dd>{session.context.contract}</dd>
        </dl>
      </section>
      <section className="detail-panel">
        <h2>Organization units</h2>
        <nav
          className="organization-breadcrumb"
          aria-label="Organization hierarchy"
        >
          {selected.trail.map((unit, index) => (
            <span key={unit.id}>
              {index > 0 && <Icon name="CaretRight" size={14} />}
              {index === selected.trail.length - 1 ? (
                <strong aria-current="page">{unit.name}</strong>
              ) : (
                <Link href={unitLink(path.slice(0, index))}>{unit.name}</Link>
              )}
            </span>
          ))}
        </nav>
        <p className="organization-hint">Select a unit to manage its team.</p>
        {!children ? (
          <p>Sign in with VTEX to load units.</p>
        ) : children.status === "rejected" ? (
          failure(children.reason)
        ) : children.value.orgUnit.length ? (
          <ul className="organization-unit-list">
            {children.value.orgUnit.map((unit) => (
              <li key={unit.id}>
                <Link
                  className="organization-unit-row"
                  href={unitLink([...path, unit.id])}
                >
                  <span className="organization-unit-icon">
                    <Icon name="Buildings" size={22} />
                  </span>
                  <span className="organization-unit-label">
                    <strong>{unit.name}</strong>
                    <span>Organizational unit</span>
                  </span>
                  <Icon name="CaretRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No child units returned for your current unit.</p>
        )}
      </section>
      <section className="detail-panel">
        <h2>Team · {selected.name}</h2>
        {!users ? (
          <p>Sign in with VTEX to load your team.</p>
        ) : users.status === "rejected" ? (
          failure(users.reason)
        ) : (
          <>
            <p>
              {users.value.users.length} of {users.value.total} users · First
              page
            </p>
            <ul>
              {users.value.users.map((user) => (
                <li key={user.userId}>
                  {user.name || user.login || user.userName || user.userId}
                  {user.email ? ` · ${user.email}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
        {users?.status === "fulfilled" && roles?.status === "fulfilled" ? (
          <OrganizationActions
            key={selected.id}
            kind="user"
            roles={roles.value}
            unitPath={path}
            unitName={selected.name}
          />
        ) : roles?.status === "rejected" ? (
          failure(roles.reason)
        ) : null}
        <p className="form-note">
          Changes to existing users’ roles are not connected yet. VTEX checks
          creation permissions when you submit.
        </p>
      </section>
      <section className="detail-panel">
        <h2>Cost centers · {session.context.unit.name}</h2>
        <p>
          Cost centers belong to the commercial contract’s accounting fields.
          They are separate from organization units. This section keeps the
          shopping unit’s accounting scope.
        </p>
        {!centers ? (
          <p>Sign in with VTEX to load cost centers.</p>
        ) : centers.status === "rejected" ? (
          failure(centers.reason)
        ) : (
          <>
            <p>
              {centers.value.data.length} of {centers.value.total} cost centers
              · First page
            </p>
            <ul>
              {centers.value.data.map((center) => (
                <li key={center.id}>
                  {center.value}
                  {center.description ? ` · ${center.description}` : ""}
                </li>
              ))}
            </ul>
            <OrganizationActions kind="cost-center" />
            <p className="form-note">
              VTEX checks creation permissions when you submit. Editing and
              deletion are not connected yet.
            </p>
          </>
        )}
      </section>
    </>
  );
}
