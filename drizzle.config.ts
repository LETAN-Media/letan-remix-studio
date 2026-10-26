import { defineConfig } from "drizzle-kit";

process.loadEnvFile?.(".env");

const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required for Drizzle commands");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
