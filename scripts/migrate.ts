import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

process.loadEnvFile?.(".env");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required");

const client = postgres(connectionString, { max: 1, prepare: false });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
await client.end();
