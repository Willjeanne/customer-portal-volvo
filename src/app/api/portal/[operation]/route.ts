import { cartOperation, prepareCart, transferCart } from "@/server/cart";
import { draftLineSchema } from "@/domain/order-draft";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { makePreviewContext, previewUnits } from "@/domain/fixtures";
import {
  assertLocalRuntime,
  assertMutationOrigin,
  limitLoginAttempts,
  PortalError,
} from "@/server/security";
import { requireSession, SESSION_COOKIE } from "@/server/session";
import { sessions } from "@/server/session-store";
import { signInVtex, validateVtexSession } from "@/server/vtex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
interface RouteProps {
  params: Promise<{ operation: string }>;
}
function respond(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
function failure(error: unknown): NextResponse {
  const reference = randomUUID();
  if (error instanceof PortalError)
    return respond(
      { error: error.message, code: error.code, reference },
      error.status,
    );
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return respond(
      {
        error:
          "The request or service response did not match the expected format.",
        code: "INVALID_DATA",
        reference,
      },
      400,
    );
  // No upstream body, headers, password, or cookie in logs or responses.
  console.error("Portal request failed", { reference });
  return respond(
    {
      error: "This operation could not be completed.",
      code: "UNEXPECTED_ERROR",
      reference,
    },
    500,
  );
}
export async function GET(
  _request: Request,
  { params }: RouteProps,
): Promise<NextResponse> {
  try {
    assertLocalRuntime();
    const operation = (await params).operation;
    if (operation !== "context" && operation !== "draft")
      return respond({ error: "Not found" }, 404);
    const session = await requireSession();
    if (session.context.mode === "vtex")
      await validateVtexSession(session.upstreamCookies || "");
    if (operation === "draft") return respond({ lines: session.draft || [] });
    return respond({ context: session.context });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(
  request: Request,
  { params }: RouteProps,
): Promise<NextResponse> {
  try {
    assertLocalRuntime();
    assertMutationOrigin(request);
    const raw = await request.text();
    if (
      raw.length >
      (["draft", "prepare-cart"].includes((await params).operation)
        ? 30000
        : 4096)
    )
      throw new PortalError(413, "TOO_LARGE", "The request is too large.");
    const body: unknown = JSON.parse(raw);
    const { operation } = await params;
    const jar = await cookies();
    const oldId = jar.get(SESSION_COOKIE)?.value;
    if (operation === "logout") {
      sessions.revoke(oldId);
      const response = respond({ signedOut: true });
      response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    if (operation === "preview" || operation === "login") {
      limitLoginAttempts();
      let context;
      let cookie: string | undefined;
      if (operation === "preview") {
        if (process.env.PORTAL_ENABLE_PREVIEW !== "true")
          throw new PortalError(
            403,
            "PREVIEW_DISABLED",
            "Local preview is disabled.",
          );
        const input = z
          .object({
            persona: z.enum(["buyer", "admin", "approver", "procurement"]),
          })
          .strict()
          .parse(body);
        context = makePreviewContext(input.persona);
      } else {
        if (process.env.PORTAL_ENABLE_VTEX_LOGIN !== "true")
          throw new PortalError(
            503,
            "LOGIN_DISABLED",
            "VTEX local login is disabled.",
          );
        const input = z
          .object({
            username: z.string().trim().min(3).max(70),
            password: z.string().min(1).max(256),
          })
          .strict()
          .parse(body);
        ({ context, cookie } = await signInVtex(
          input.username,
          input.password,
        ));
      }
      sessions.revoke(oldId);
      const id = sessions.create(context, cookie);
      const response = respond({ context });
      response.cookies.set(SESSION_COOKIE, id, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: 1800,
        secure: false,
      });
      return response;
    }
    const session = await requireSession();
    if (operation === "prepare-cart" || operation === "transfer-cart") {
      return respond(
        await cartOperation(session, async () => {
          if (session.context.mode === "vtex") {
            const verified = await validateVtexSession(
              session.upstreamCookies || "",
            );
            if (
              verified.orgUnit.id !== session.context.unit.id ||
              verified.claims.userId !== session.context.user.id
            )
              throw new PortalError(
                409,
                "CONTEXT_CHANGED",
                "Your buyer context changed. Please sign in again.",
              );
          }
          if (operation === "prepare-cart") return prepareCart(session, body);
          const input = z
            .object({ preparationId: z.uuid() })
            .strict()
            .parse(body);
          return transferCart(session, input.preparationId);
        }),
      );
    }
    if (operation === "draft") {
      if (session.context.mode === "vtex")
        await validateVtexSession(session.upstreamCookies || "");
      const input = z
        .object({ lines: z.array(draftLineSchema).max(200) })
        .strict()
        .parse(body);
      session.draft = input.lines;
      return respond({ saved: true });
    }
    if (operation !== "context") return respond({ error: "Not found" }, 404);
    if (session.context.mode !== "preview")
      throw new PortalError(
        403,
        "CONTEXT_NOT_QUALIFIED",
        "Live context switching is not yet available.",
      );
    const input = z
      .object({
        unitId: z.string(),
        vehicle: z.enum(["", "Truck 147", "Truck 203"]),
        urgency: z.enum(["Normal", "Maintenance", "Vehicle off road"]),
      })
      .strict()
      .parse(body);
    const unit = previewUnits.find((entry) => entry.id === input.unitId);
    if (!unit)
      throw new PortalError(
        403,
        "UNIT_DENIED",
        "This unit is not available to this preview session.",
      );
    if (input.unitId !== session.context.unit.id) {
      session.draft = undefined;
      session.preparation = undefined;
      session.orderFormId = undefined;
      session.checkoutCookies = undefined;
    }
    session.context = {
      ...session.context,
      unit,
      vehicle: input.unitId === session.context.unit.id ? input.vehicle : "",
      urgency: input.urgency,
    };
    return respond({ context: session.context });
  } catch (error) {
    return failure(error);
  }
}
