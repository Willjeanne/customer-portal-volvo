export class PortalError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function assertLocalRuntime(runtime = process.env.NODE_ENV): void {
  if (runtime !== "development" && runtime !== "test") {
    throw new PortalError(
      503,
      "LOCAL_ONLY",
      "Local validation is not enabled on this deployment.",
    );
  }
}
export function assertMutationOrigin(request: Request): void {
  const expected = process.env.PORTAL_ORIGIN || "http://127.0.0.1:3000";
  if (
    request.headers.get("origin") !== expected ||
    !["http://127.0.0.1:3000", "http://localhost:3000"].includes(expected)
  ) {
    throw new PortalError(
      403,
      "ORIGIN_DENIED",
      "This request did not originate from the local portal.",
    );
  }
  if (
    request.headers.get("content-type")?.split(";")[0] !== "application/json"
  ) {
    throw new PortalError(415, "CONTENT_TYPE", "A JSON request is required.");
  }
}
const attempts = globalThis as typeof globalThis & {
  volvoLoginAttempts?: number[];
};
export function limitLoginAttempts(now = Date.now()): void {
  attempts.volvoLoginAttempts = (attempts.volvoLoginAttempts ?? []).filter(
    (time) => time > now - 60_000,
  );
  if (attempts.volvoLoginAttempts.length >= 5)
    throw new PortalError(
      429,
      "RATE_LIMIT",
      "Please wait a minute before trying again.",
    );
  attempts.volvoLoginAttempts.push(now);
}
