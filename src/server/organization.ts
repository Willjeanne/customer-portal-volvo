import "server-only";
import { z } from "zod";
import type { PortalSession } from "./session-store";
import { buyerHeaders } from "./buyer-headers";
import { PortalError } from "./security";

async function request<T>(
  session: PortalSession,
  suffix: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  if (session.context.mode !== "vtex" || !session.upstreamCookies)
    throw new PortalError(
      401,
      "LIVE_REQUIRED",
      "Sign in with VTEX to view your organization.",
    );
  let response: Response;
  try {
    response = await fetch(
      `https://volvoemea.myvtex.com/_v/store-front/${suffix}`,
      {
        headers: {
          ...buyerHeaders(session.upstreamCookies),
          "Content-Type": "application/json",
        },
        method: body === undefined ? "GET" : "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      },
    );
  } catch {
    throw new PortalError(
      502,
      "ORGANIZATION_UNAVAILABLE",
      "The organization service could not be reached.",
    );
  }
  if (response.status === 401 || response.status === 403)
    throw new PortalError(
      403,
      "ORGANIZATION_ACCESS_DENIED",
      "VTEX has not authorized this account for this organization operation. An authorized organization administrator is required.",
    );
  if (!response.ok)
    throw new PortalError(
      502,
      "ORGANIZATION_UNAVAILABLE",
      "VTEX could not load this organization information.",
    );
  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success)
    throw new PortalError(
      502,
      "ORGANIZATION_FORMAT",
      "VTEX returned an unexpected organization response.",
    );
  return parsed.data;
}
export function getOrganizationChildren(
  session: PortalSession,
  unitId = session.context.unit.id,
) {
  return request(
    session,
    `units/${z.uuid().parse(unitId)}/children`,
    z.object({
      orgUnit: z.array(z.object({ id: z.string().min(1), name: z.string() })),
    }),
  );
}
export function getOrganizationUsers(
  session: PortalSession,
  unitId = session.context.unit.id,
) {
  return request(
    session,
    `units/${z.uuid().parse(unitId)}/users?page=1&search=`,
    z.object({
      total: z.number().int().nonnegative(),
      users: z.array(
        z.object({
          userId: z.string().min(1),
          name: z.string().nullish(),
          login: z.string().nullish(),
          userName: z.string().nullish(),
          email: z.string().nullish(),
        }),
      ),
    }),
  );
}

function contractPath(
  session: PortalSession,
  unitId = session.context.unit.id,
) {
  return `customers/${z.uuid().parse(session.context.contract)}/units/${z.uuid().parse(unitId)}`;
}
const valueSchema = z.object({
  id: z.string().min(1),
  customFieldId: z.literal("cost-centers"),
  contractId: z.string(),
  value: z.string(),
  description: z.string().nullish(),
});
export async function getCostCenters(session: PortalSession) {
  const result = await request(
    session,
    `${contractPath(session)}/custom-fields/cost-centers/values?page=1&filterByUnit=true`,
    z.object({
      data: z.array(valueSchema),
      total: z.number().int().nonnegative(),
    }),
  );
  if (result.data.some((item) => item.contractId !== session.context.contract))
    throw new PortalError(
      403,
      "ORGANIZATION_SCOPE",
      "The cost center contract does not match your session.",
    );
  return result;
}
export function getOrganizationRoles(
  session: PortalSession,
  unitId = session.context.unit.id,
) {
  return request(
    session,
    `${contractPath(session, unitId)}/roles/ids`,
    z.array(z.object({ roleName: z.string(), roleId: z.number().int() })),
  );
}
export async function createCostCenter(session: PortalSession, body: unknown) {
  const input = z
    .object({
      value: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500),
    })
    .strict()
    .parse(body);
  const result = await request(
    session,
    `${contractPath(session)}/custom-fields/cost-centers/values`,
    z.object({
      created: z.array(z.string().min(1)).min(1),
      message: z.string(),
    }),
    [input],
  );
  // A separate read failure must never invite a duplicate POST.
  return {
    message: `VTEX confirmed creation of ${result.created.length} cost center. Refresh the list to verify visibility.`,
  };
}
export async function createOrganizationUser(
  session: PortalSession,
  body: unknown,
) {
  const input = z
    .object({
      login: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(100),
      email: z.email(),
      roleId: z.number().int(),
      unitPath: z.array(z.uuid()).max(12).default([]),
    })
    .strict()
    .parse(body);
  const selection = await resolveOrganizationUnit(session, input.unitPath);
  const roles = await getOrganizationRoles(session, selection.id);
  if (!roles.some((role) => role.roleId === input.roleId))
    throw new PortalError(
      403,
      "ORGANIZATION_ROLE",
      "The selected role is not available in your current context.",
    );
  const result = await request(
    session,
    `v3/units/${selection.id}/users`,
    z.object({
      message: z.string(),
      user: z.object({ id: z.string().min(1) }),
    }),
    {
      orgUnitId: selection.id,
      login: input.login,
      name: input.name,
      email: input.email,
      role: [input.roleId],
    },
  );
  // Never forward optional accessToken returned by the upstream service.
  return { message: result.message };
}

// Validate every hierarchy edge against live, shopper-authorized responses.
// Selecting an administrative unit never mutates the shopping session.
export async function resolveOrganizationUnit(
  session: PortalSession,
  path: unknown,
) {
  const ids = z.array(z.uuid()).max(12).parse(path);
  let unit = { id: session.context.unit.id, name: session.context.unit.name };
  const trail = [unit];
  const seen = new Set([unit.id]);
  for (const id of ids) {
    if (seen.has(id))
      throw new PortalError(
        400,
        "ORGANIZATION_PATH",
        "Invalid organization path.",
      );
    const children = await getOrganizationChildren(session, unit.id);
    const next = children.orgUnit.find((child) => child.id === id);
    if (!next)
      throw new PortalError(
        403,
        "ORGANIZATION_SCOPE",
        "This unit is not available in your organization hierarchy.",
      );
    unit = next;
    trail.push(unit);
    seen.add(id);
  }
  return { ...unit, trail };
}
