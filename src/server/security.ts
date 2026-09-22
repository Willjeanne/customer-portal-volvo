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
  if (
    runtime !== "development" &&
    runtime !== "test" &&
    !(
      runtime === "production" &&
      process.env.PORTAL_ORIGIN ===
        "https://customer-portal-volvo.vercel.app" &&
      (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
    )
  ) {
    throw new PortalError(
      503,
      "LOCAL_ONLY",
      "This deployment requires the portal domain and shared session storage configuration.",
    );
  }
}
export function assertMutationOrigin(request: Request): void {
  const expected = process.env.PORTAL_ORIGIN || "http://127.0.0.1:3000";
  if (
    request.headers.get("origin") !== expected ||
    ![
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3001",
      "https://customer-portal-volvo.vercel.app",
    ].includes(expected)
  ) {
    throw new PortalError(
      403,
      "ORIGIN_DENIED",
      "This request did not originate from the configured portal.",
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
