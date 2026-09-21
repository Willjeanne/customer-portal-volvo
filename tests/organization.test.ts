import test from "node:test";
import assert from "node:assert/strict";
import {
  getOrganizationChildren,
  getOrganizationUsers,
} from "../src/server/organization";
import { makePreviewContext } from "../src/domain/fixtures";
test("organization reads use only the session unit and preserve access denials", async (t) => {
  const session = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  session.context.unit.id = "58c2eac7-3334-495d-8bd9-5fde89f14391";
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.ok(
      url.startsWith(
        `https://volvoemea.myvtex.com/_v/store-front/units/${session.context.unit.id}/`,
      ),
    );
    assert.equal(init.cache, "no-store");
    assert.equal(new Headers(init.headers).get("X-VTEX-API-AppKey"), null);
    return Response.json(
      status === 200
        ? url.endsWith("children")
          ? { orgUnit: [] }
          : { users: [], total: 0 }
        : {},
      { status },
    );
  });
  assert.deepEqual(await getOrganizationChildren(session), { orgUnit: [] });
  assert.deepEqual(await getOrganizationUsers(session), {
    users: [],
    total: 0,
  });
  status = 403;
  await assert.rejects(getOrganizationUsers(session), {
    code: "ORGANIZATION_ACCESS_DENIED",
  });
  status = 500;
  await assert.rejects(getOrganizationChildren(session), {
    code: "ORGANIZATION_UNAVAILABLE",
  });
  await assert.rejects(
    getOrganizationUsers({
      ...session,
      context: { ...session.context, mode: "preview" },
    }),
    { code: "LIVE_REQUIRED" },
  );
});

test("organization creation fixes scope, checks roles and never exposes upstream tokens", async (t) => {
  const { createCostCenter, createOrganizationUser, getCostCenters } =
    await import("../src/server/organization");
  const session = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  session.context.unit.id = "58c2eac7-3334-495d-8bd9-5fde89f14391";
  session.context.contract = "2375f745-d036-4fd9-875a-23c2d1c93b00";
  let writes = 0,
    foreign = false,
    denied = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/roles/ids"))
      return Response.json([{ roleId: 2, roleName: "Buyer" }]);
    if (init.method === "POST") {
      writes++;
      if (denied) return Response.json({}, { status: 403 });
      const body = JSON.parse(String(init.body));
      if (url.endsWith("/users")) {
        assert.equal(body.orgUnitId, session.context.unit.id);
        assert.deepEqual(body.role, [2]);
        return Response.json({
          message: "User created",
          user: { id: "user-1" },
          accessToken: "must-not-leak",
        });
      }
      assert.ok(
        url.includes(
          `/customers/${session.context.contract}/units/${session.context.unit.id}/`,
        ),
      );
      assert.deepEqual(body, [{ value: "WORKSHOP", description: "Workshop" }]);
      return Response.json({ created: ["center-1"], message: "Created" });
    }
    return Response.json({
      total: 1,
      data: [
        {
          id: "center-1",
          customFieldId: "cost-centers",
          contractId: foreign ? "foreign" : session.context.contract,
          value: "WORKSHOP",
        },
      ],
    });
  });
  const input = {
    login: "new-user",
    name: "New user",
    email: "user@example.com",
    roleId: 2,
  };
  assert.deepEqual(await createOrganizationUser(session, input), {
    message: "User created",
  });
  await assert.rejects(
    createOrganizationUser(session, { ...input, roleId: 999 }),
    { code: "ORGANIZATION_ROLE" },
  );
  await assert.rejects(
    createOrganizationUser(session, { ...input, orgUnitId: "foreign" }),
  );
  assert.equal(writes, 1);
  await createCostCenter(session, {
    value: "WORKSHOP",
    description: "Workshop",
  });
  assert.equal((await getCostCenters(session)).total, 1);
  foreign = true;
  await assert.rejects(getCostCenters(session), { code: "ORGANIZATION_SCOPE" });
  denied = true;
  await assert.rejects(
    createCostCenter(session, { value: "WORKSHOP", description: "Workshop" }),
    { code: "ORGANIZATION_ACCESS_DENIED" },
  );
});

test("nested unit creation revalidates each hierarchy edge without changing shopping scope", async (t) => {
  const { createOrganizationUser, resolveOrganizationUnit } = await import(
    "../src/server/organization"
  );
  const root = "58c2eac7-3334-495d-8bd9-5fde89f14391",
    child = "58c2eac7-3334-495d-8bd9-5fde89f14392",
    leaf = "58c2eac7-3334-495d-8bd9-5fde89f14393";
  const session = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  session.context.unit = { id: root, name: "Root" };
  session.context.contract = "2375f745-d036-4fd9-875a-23c2d1c93b00";
  let revoked = false,
    writes = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/children"))
      return Response.json({
        orgUnit: revoked
          ? []
          : url.includes(root)
            ? [{ id: child, name: "Fleet" }]
            : [{ id: leaf, name: "Chicago" }],
      });
    if (url.endsWith("/roles/ids")) {
      assert.ok(url.includes(leaf));
      return Response.json([{ roleId: 2, roleName: "Buyer" }]);
    }
    assert.equal(init.method, "POST");
    assert.ok(url.includes(`/units/${leaf}/users`));
    assert.equal(JSON.parse(String(init.body)).orgUnitId, leaf);
    writes++;
    return Response.json({ message: "Created", user: { id: "new-user" } });
  });
  assert.equal(
    (await resolveOrganizationUnit(session, [child, leaf])).name,
    "Chicago",
  );
  const input = {
    login: "new",
    name: "New",
    email: "new@example.com",
    roleId: 2,
    unitPath: [child, leaf],
  };
  await createOrganizationUser(session, input);
  assert.equal(session.context.unit.id, root);
  revoked = true;
  await assert.rejects(createOrganizationUser(session, input), {
    code: "ORGANIZATION_SCOPE",
  });
  assert.equal(writes, 1);
  await assert.rejects(resolveOrganizationUnit(session, [root]), {
    code: "ORGANIZATION_PATH",
  });
});
