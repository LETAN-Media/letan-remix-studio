import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
  database?: ReturnType<typeof drizzle<typeof schema>>;
};

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is not configured");
  }
  return value;
}

export function getDb() {
  if (!globalForDb.sqlClient) {
    globalForDb.sqlClient = postgres(databaseUrl(), {
      max: process.env.NODE_ENV === "production" ? 10 : 2,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  if (!globalForDb.database) {
    globalForDb.database = drizzle(globalForDb.sqlClient, { schema });
  }
  return globalForDb.database;
}
