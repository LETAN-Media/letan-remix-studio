import { RemixBuilder } from "@/components/remix-builder";

export function RemixBuilderPage() {
  const aiConfigured = Boolean(process.env.AI_API_KEY && process.env.AI_MODEL && process.env.AI_BASE_URL);
  return <RemixBuilder aiConfigured={aiConfigured} />;
}
