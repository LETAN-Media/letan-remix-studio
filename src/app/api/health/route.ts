import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    return Response.json(
      { status: "unavailable", database: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
