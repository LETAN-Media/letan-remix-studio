import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/server/db";
import { accounts, sessions, users, verifications } from "@/server/db/schema";

function createAuth() {
  return betterAuth({
      appName: "LETAN Remix Studio",
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(getDb(), {
        provider: "pg",
        schema: {
          user: users,
          session: sessions,
          account: accounts,
          verification: verifications,
        },
      }),
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 12,
        maxPasswordLength: 128,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      rateLimit: {
        enabled: true,
        window: 60,
        max: 20,
      },
      advanced: {
        database: { generateId: "uuid" },
        useSecureCookies:
          process.env.BETTER_AUTH_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production",
      },
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  authInstance ??= createAuth();
  return authInstance;
}
