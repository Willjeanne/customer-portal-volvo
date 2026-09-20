import { test } from "node:test";
import assert from "node:assert/strict";

const origin = "http://127.0.0.1:3000";
const run = process.env.PORTAL_INTEGRATION_TESTS === "true";
test(
  "local API: session isolation, CSRF, scope denial, context reset and logout",
  { skip: !run },
  async () => {
    const call = (
      operation: string,
      body: unknown,
      cookie = "",
      source = origin,
    ) =>
      fetch(`${origin}/api/portal/${operation}`, {
        method: "POST",
        headers: {
          Origin: source,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      });
    assert.equal((await fetch(`${origin}/api/portal/context`)).status, 401);
    assert.equal(
      (await call("preview", { persona: "buyer" }, "", "https://evil.example"))
        .status,
      403,
    );
    const login = await call("preview", { persona: "buyer" });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie") || "";
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=strict/i);
    const cookie = setCookie.split(";")[0];
    assert.match(login.headers.get("cache-control") || "", /no-store/);
    const denied = await fetch(`${origin}/approvals`, {
      headers: { Cookie: cookie },
    });
    assert.match(await denied.text(), /Access not available/);
    const scope = await call(
      "context",
      { unitId: "foreign-unit", vehicle: "", urgency: "Normal" },
      cookie,
    );
    assert.equal(scope.status, 403);
    const draft = [{ sku: "123", quantity: 2 }];
    assert.equal(
      (await call("draft", { lines: draft, revision: 0 }, cookie)).status,
      200,
    );
    assert.equal(
      (
        await call(
          "draft",
          { lines: [{ sku: "123", quantity: -1 }], revision: 1 },
          cookie,
        )
      ).status,
      400,
    );
    const readDraft = async (token: string) =>
      (
        await fetch(`${origin}/api/portal/draft`, {
          headers: { Cookie: token },
        })
      ).json();
    assert.deepEqual((await readDraft(cookie)).lines, draft);
    const additions = await Promise.all(
      Array.from({ length: 8 }, () =>
        call("draft-add", { line: { sku: "456", quantity: 1 } }, cookie),
      ),
    );
    assert.ok(additions.every((response) => response.status === 200));
    assert.deepEqual((await readDraft(cookie)).lines, [
      ...draft,
      { sku: "456", quantity: 8 },
    ]);
    assert.equal(
      (await call("draft", { lines: [], revision: 1 }, cookie)).status,
      409,
    );
    assert.equal(
      (
        await call(
          "draft-add",
          { line: { sku: "456", quantity: 9999 } },
          cookie,
        )
      ).status,
      400,
    );

    const changed = await call(
      "context",
      // >>> CLAUDE — lot flotte : le contexte porte un identifiant, plus un libellé <<< CLAUDE
      { unitId: "preview-chicago", vehicle: "truck-147", urgency: "Normal" },
      cookie,
    );
    assert.equal(changed.status, 200);
    const result = await changed.json();
    assert.equal(result.context.unit.name, "Chicago Depot");
    assert.equal(result.context.vehicle, "");
    assert.deepEqual((await readDraft(cookie)).lines, []);
    await call(
      "draft",
      { lines: draft, revision: (await readDraft(cookie)).revision },
      cookie,
    );
    assert.equal(
      (
        await call(
          "context",
          {
            unitId: "preview-chicago",
            vehicle: "",
            urgency: "Normal",
            permissions: ["approve"],
          },
          cookie,
        )
      ).status,
      400,
    );
    const other = await call("preview", { persona: "procurement" });
    const otherCookie = (other.headers.get("set-cookie") || "").split(";")[0];
    assert.deepEqual((await readDraft(otherCookie)).lines, []);
    const otherContext = await (
      await fetch(`${origin}/api/portal/context`, {
        headers: { Cookie: otherCookie },
      })
    ).json();
    assert.equal(otherContext.context.unit.name, "Dallas Depot");
    assert.equal(otherContext.context.permissions.includes("purchase"), false);
    assert.equal((await call("logout", {}, cookie)).status, 200);
    assert.equal(
      (
        await fetch(`${origin}/api/portal/context`, {
          headers: { Cookie: cookie },
        })
      ).status,
      401,
    );
    await call("logout", {}, otherCookie);
  },
);
