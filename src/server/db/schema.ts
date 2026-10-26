import { relations, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ProjectSnapshot, SceneConfig, ThemeTokens } from "@/domain/project-schema";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

// Better Auth tables. Field names intentionally follow its Drizzle adapter contract.
export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("accounts_user_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_uidx").on(table.providerId, table.accountId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const projectStatus = pgEnum("project_status", [
  "draft",
  "generating",
  "ready",
  "published",
  "archived",
]);
export const pageStatus = pgEnum("page_status", ["draft", "published"]);
export const assetStatus = pgEnum("asset_status", ["pending", "ready", "failed", "deleted"]);
export const jobStatus = pgEnum("job_status", ["queued", "running", "succeeded", "failed", "cancelled"]);
export const deploymentStatus = pgEnum("deployment_status", [
  "queued",
  "building",
  "ready",
  "failed",
  "cancelled",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    industry: text("industry").notNull().default(""),
    status: projectStatus("status").notNull().default("draft"),
    schemaVersion: integer("schema_version").notNull().default(1),
    theme: jsonb("theme").$type<ThemeTokens>().notNull(),
    activeVersionId: uuid("active_version_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_owner_slug_uidx").on(table.ownerId, table.slug),
    index("projects_owner_updated_idx").on(table.ownerId, table.updatedAt),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: pageStatus("status").notNull().default("draft"),
    seo: jsonb("seo")
      .$type<{ title: string | null; description: string | null; noIndex: boolean }>()
      .notNull()
      .default({ title: null, description: null, noIndex: false }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pages_project_slug_uidx").on(table.projectId, table.slug),
    index("pages_project_order_idx").on(table.projectId, table.sortOrder),
  ],
);

export const components = pgTable(
  "components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => components.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    styles: jsonb("styles")
      .$type<{
        desktop: Record<string, string | number | boolean>;
        tablet: Record<string, string | number | boolean>;
        mobile: Record<string, string | number | boolean>;
      }>()
      .notNull()
      .default({ desktop: {}, tablet: {}, mobile: {} }),
    locked: boolean("locked").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("components_page_parent_order_idx").on(table.pageId, table.parentId, table.sortOrder),
  ],
);

export const sceneConfigurations = pgTable("scene_configurations", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  config: jsonb("config").$type<SceneConfig>().notNull(),
  ...timestamps,
});

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    objectKey: text("object_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    checksum: text("checksum"),
    status: assetStatus("status").notNull().default("pending"),
    width: integer("width"),
    height: integer("height"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [index("assets_project_created_idx").on(table.projectId, table.createdAt)],
);

export const projectVersions = pgTable(
  "project_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    label: text("label"),
    snapshot: jsonb("snapshot").$type<ProjectSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_versions_number_uidx").on(table.projectId, table.version),
    index("project_versions_created_idx").on(table.projectId, table.createdAt),
  ],
);

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(),
    status: jobStatus("status").notNull().default("queued"),
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    progress: integer("progress").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("generation_jobs_queue_idx").on(table.status, table.createdAt)],
);

export const generationLogs = pgTable(
  "generation_logs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => generationJobs.id, { onDelete: "cascade" }),
    level: text("level").notNull(),
    event: text("event").notNull(),
    context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("generation_logs_job_idx").on(table.jobId, table.createdAt)],
);

export const deployments = pgTable(
  "deployments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => projectVersions.id, { onDelete: "restrict" }),
    status: deploymentStatus("status").notNull().default("queued"),
    provider: text("provider").notNull(),
    providerDeploymentId: text("provider_deployment_id"),
    previewUrl: text("preview_url"),
    liveUrl: text("live_url"),
    errorMessage: text("error_message"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("deployments_project_created_idx").on(table.projectId, table.createdAt)],
);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull().unique(),
    status: text("status").notNull().default("pending"),
    verification: jsonb("verification").$type<Record<string, unknown>>().notNull().default({}),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("domains_project_idx").on(table.projectId)],
);

export const rateLimitWindows = pgTable(
  "rate_limit_windows",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.windowStart] }),
    index("rate_limit_expiry_idx").on(table.expiresAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    requestId: text("request_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_project_created_idx").on(table.projectId, table.createdAt)],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  pages: many(pages),
  assets: many(assets),
  versions: many(projectVersions),
  scene: one(sceneConfigurations),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  project: one(projects, { fields: [pages.projectId], references: [projects.id] }),
  components: many(components),
}));

export const componentsRelations = relations(components, ({ one, many }) => ({
  page: one(pages, { fields: [components.pageId], references: [pages.id] }),
  parent: one(components, {
    fields: [components.parentId],
    references: [components.id],
    relationName: "componentTree",
  }),
  children: many(components, { relationName: "componentTree" }),
}));

export const updateTimestamp = sql`now()`;
