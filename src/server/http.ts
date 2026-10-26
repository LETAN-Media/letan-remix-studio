import { ZodError, type ZodType } from "zod";
import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";
import { rateLimitWindows } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function requireApiUser(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Sign in is required");
  const limit = Number(process.env.API_RATE_LIMIT_MAX ?? 120);
  const windowSeconds = Number(process.env.API_RATE_LIMIT_WINDOW_SECONDS ?? 60);
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000 * 2);
  const key = `api:user:${session.user.id}`;
  const [bucket] = await getDb()
    .insert(rateLimitWindows)
    .values({ key, windowStart, expiresAt, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitWindows.key, rateLimitWindows.windowStart],
      set: { count: sql`${rateLimitWindows.count} + 1`, expiresAt },
    })
    .returning({ count: rateLimitWindows.count });
  if (bucket.count > limit) throw new HttpError(429, "RATE_LIMITED", "Too many requests");
  return session.user;
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(422, "VALIDATION_ERROR", "Request validation failed", result.error.flatten());
  }
  return result.data;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function routeError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: error.flatten() } },
      { status: 422 },
    );
  }
  const requestId = crypto.randomUUID();
  console.error(JSON.stringify({ level: "error", event: "route.unhandled", requestId, error }));
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId } },
    { status: 500 },
  );
}
