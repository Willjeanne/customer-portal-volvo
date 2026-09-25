import { populateBuyerList } from "@/server/list-items";
import { createBuyerList, getBuyerLists } from "@/server/lists";
import { updatePayment, placeOrder } from "@/server/checkout-payment";
import { orderStatus } from "@/server/order-attempts";
import {
  createCostCenter,
  createOrganizationUser,
} from "@/server/organization";
import { readCheckout, updateShipping } from "@/server/checkout";
import {
  cartOperation,
  prepareCart,
  transferCart,
  readPortalCart,
  checkoutHandoff,
} from "@/server/cart";
import { addDraftLine, replaceDraft } from "@/server/draft";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { makePreviewContext, previewUnits } from "@/domain/fixtures";
// >>> CLAUDE — lot flotte, 20/09/2026 — à relire
import { vehicleSelection } from "@/domain/fleet";
// <<< CLAUDE
import {
  assertLocalRuntime,
  assertMutationOrigin,
  limitLoginAttempts,
  PortalError,
} from "@/server/security";
import { requireSession, SESSION_COOKIE } from "@/server/session";
import { SESSION_TTL_SECONDS } from "@/server/session-store";
import {
  createSession,
  revokeSession,
  withSharedSession,
  sharedEnabled,
  sharedLoginLimit,
} from "@/server/shared-sessions";
import { signInVtex, validateVtexSession } from "@/server/vtex";

export const maxDuration = 120;
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
async function handleGET(
  _request: Request,
  { params }: RouteProps,
): Promise<NextResponse> {
  try {
    assertLocalRuntime();
    const operation = (await params).operation;
    if (
      operation !== "lists" &&
      operation !== "context" &&
      operation !== "draft" &&
      operation !== "cart" &&
      operation !== "checkout-order-status" &&
      operation !== "checkout"
    )
      return respond({ error: "Not found" }, 404);
    const session = await requireSession();
    if (session.context.mode === "vtex") {
      const verified = await validateVtexSession(session.upstreamCookies || "");
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
    if (operation === "lists") return respond(await getBuyerLists(session));
    if (operation === "checkout-order-status")
      return respond(await orderStatus(session));
    if (operation === "checkout")
      return respond(await cartOperation(session, () => readCheckout(session)));
    if (operation === "cart")
      return respond(
        await cartOperation(session, () => readPortalCart(session)),
      );
    if (operation === "draft")
      return respond({
        lines: session.draft || [],
        revision: session.draftRevision ?? 0,
      });
    return respond({ context: session.context });
  } catch (error) {
    return failure(error);
  }
}
async function handlePOST(
  request: Request,
  { params }: RouteProps,
): Promise<NextResponse> {
  try {
    assertLocalRuntime();
    assertMutationOrigin(request);
    const raw = await request.text();
    if (
      raw.length >
      (["draft", "prepare-cart", "checkout-shipping", "populate-list"].includes(
        (await params).operation,
      )
        ? 30000
        : 4096)
    )
      throw new PortalError(413, "TOO_LARGE", "The request is too large.");
    const body: unknown = JSON.parse(raw);
    const { operation } = await params;
    const jar = await cookies();
    const oldId = jar.get(SESSION_COOKIE)?.value;
    if (operation === "logout") {
      await revokeSession(oldId);
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
      if (sharedEnabled())
        await sharedLoginLimit(request.headers.get("x-real-ip") || "unknown");
      else limitLoginAttempts();
      let context;
      let cookie: string | undefined;
      if (operation === "preview") {
        if (sharedEnabled() || process.env.PORTAL_ENABLE_PREVIEW !== "true")
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
      await revokeSession(oldId);
      const id = await createSession(context, cookie);
      const response = respond({ context });
      response.cookies.set(SESSION_COOKIE, id, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
        secure: sharedEnabled(),
      });
      return response;
    }
    const session = await requireSession();
    if (
      operation === "prepare-cart" ||
      operation === "transfer-cart" ||
      operation === "checkout-handoff" ||
      operation === "checkout-payment" ||
      operation === "checkout-place-order" ||
      operation === "checkout-shipping" ||
      operation === "populate-list" ||
      operation === "create-list" ||
      operation === "create-cost-center" ||
      operation === "create-organization-user"
    ) {
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
          if (operation === "populate-list")
            return populateBuyerList(session, body);
          if (operation === "create-list")
            return createBuyerList(session, body);
          if (operation === "create-cost-center")
            return createCostCenter(session, body);
          if (operation === "create-organization-user")
            return createOrganizationUser(session, body);
          if (operation === "checkout-payment")
            return updatePayment(session, body);
          if (operation === "checkout-place-order")
            return placeOrder(session, body);
          if (operation === "checkout-shipping")
            return updateShipping(session, body);
          if (operation === "checkout-handoff") {
            z.object({}).strict().parse(body);
            return checkoutHandoff(session);
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
    if (operation === "draft" || operation === "draft-add") {
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
      return respond(
        operation === "draft-add"
          ? addDraftLine(session, body)
          : replaceDraft(session, body),
      );
    }
    if (operation !== "context") return respond({ error: "Not found" }, 404);
    // >>> CLAUDE — lot flotte, 20/09/2026 — à relire
    // Le véhicule et l'urgence ne sont que des filtres d'affichage : ils ne
    // confèrent aucun droit et sont donc modifiables aussi en session VTEX.
    // Le changement d'unité, lui, touche la portée commerciale et reste refusé
    // hors aperçu tant qu'il n'est pas qualifié.
    const input = z
      .object({
        unitId: z.string(),
        vehicle: vehicleSelection,
        urgency: z.enum(["Normal", "Maintenance", "Vehicle off road"]),
      })
      .strict()
      .parse(body);
    const live = session.context.mode !== "preview";
    if (live && input.unitId !== session.context.unit.id)
      throw new PortalError(
        403,
        "CONTEXT_NOT_QUALIFIED",
        "Live unit switching is not yet available.",
      );
    const unit = live
      ? session.context.unit
      : previewUnits.find((entry) => entry.id === input.unitId);
    if (!unit)
      throw new PortalError(
        403,
        "UNIT_DENIED",
        "This unit is not available to this preview session.",
      );
    // <<< CLAUDE
    if (input.unitId !== session.context.unit.id) {
      session.draft = undefined;
      session.draftRevision = (session.draftRevision ?? 0) + 1;
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

async function withSessionRequest(
  request: Request,
  props: RouteProps,
  handler: typeof handleGET,
) {
  try {
    assertLocalRuntime();
    if (request.method === "POST") assertMutationOrigin(request);
    const id = (await cookies()).get(SESSION_COOKIE)?.value;
    return await withSharedSession(id, () => handler(request, props));
  } catch (error) {
    return failure(error);
  }
}
export function GET(request: Request, props: RouteProps) {
  return withSessionRequest(request, props, handleGET);
}
export function POST(request: Request, props: RouteProps) {
  return withSessionRequest(request, props, handlePOST);
}
