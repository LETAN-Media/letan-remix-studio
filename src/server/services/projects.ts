import { and, asc, desc, eq, max } from "drizzle-orm";
import {
  PROJECT_SCHEMA_VERSION,
  defaultSceneConfig,
  defaultThemeTokens,
  type ProjectSnapshot,
  toSlug,
} from "@/domain/project-schema";
import { getDb } from "@/server/db";
import {
  components,
  pages,
  projects,
  projectVersions,
  sceneConfigurations,
  updateTimestamp,
} from "@/server/db/schema";
import { HttpError } from "@/server/http";

export async function listOwnedProjects(ownerId: string) {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      industry: projects.industry,
      status: projects.status,
      updatedAt: projects.updatedAt,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.ownerId, ownerId))
    .orderBy(desc(projects.updatedAt));
}

export async function getOwnedProject(ownerId: string, projectId: string) {
  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "Project was not found");
  return project;
}

export async function touchProject(projectId: string) {
  await getDb().update(projects).set({ updatedAt: updateTimestamp }).where(eq(projects.id, projectId));
}

async function availableSlug(ownerId: string, requested: string) {
  const base = toSlug(requested);
  const rows = await getDb()
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.ownerId, ownerId));
  const used = new Set(rows.map((row) => row.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function createOwnedProject(
  ownerId: string,
  input: { name: string; slug?: string; description: string; industry: string },
) {
  const slug = await availableSlug(ownerId, input.slug ?? input.name);
  return getDb().transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        ownerId,
        name: input.name,
        slug,
        description: input.description,
        industry: input.industry,
        schemaVersion: PROJECT_SCHEMA_VERSION,
        theme: defaultThemeTokens,
      })
      .returning();

    const [page] = await tx
      .insert(pages)
      .values({ projectId: project.id, title: "Home", slug: "home", sortOrder: 0 })
      .returning();

    await tx.insert(components).values({
      pageId: page.id,
      type: "hero",
      name: "Hero",
      sortOrder: 0,
      props: {
        eyebrow: input.industry,
        heading: input.name,
        description: input.description,
        primaryAction: { label: "Get started", href: "#contact" },
      },
      styles: { desktop: {}, tablet: {}, mobile: {} },
    });

    await tx.insert(sceneConfigurations).values({ projectId: project.id, config: defaultSceneConfig });
    return project;
  });
}

export async function updateOwnedProject(
  ownerId: string,
  projectId: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    industry: string;
    status: "draft" | "generating" | "ready" | "published" | "archived";
    theme: typeof defaultThemeTokens;
  }>,
) {
  await getOwnedProject(ownerId, projectId);
  const values = { ...input, updatedAt: updateTimestamp };
  if (input.slug) values.slug = toSlug(input.slug);
  const [updated] = await getDb()
    .update(projects)
    .set(values)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .returning();
  return updated;
}

export async function deleteOwnedProject(ownerId: string, projectId: string) {
  const [deleted] = await getDb()
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .returning({ id: projects.id });
  if (!deleted) throw new HttpError(404, "PROJECT_NOT_FOUND", "Project was not found");
  return deleted;
}

export async function buildProjectSnapshot(ownerId: string, projectId: string): Promise<ProjectSnapshot> {
  const project = await getOwnedProject(ownerId, projectId);
  const [scene, pageRows] = await Promise.all([
    getDb().query.sceneConfigurations.findFirst({ where: eq(sceneConfigurations.projectId, projectId) }),
    getDb().select().from(pages).where(eq(pages.projectId, projectId)).orderBy(asc(pages.sortOrder)),
  ]);
  const pageIds = pageRows.map((page) => page.id);
  const componentRows = pageIds.length
    ? await getDb().query.components.findMany({
        where: (table, { inArray }) => inArray(table.pageId, pageIds),
        orderBy: [asc(components.sortOrder)],
      })
    : [];

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      industry: project.industry,
      status: project.status,
    },
    theme: project.theme,
    scene: scene?.config ?? defaultSceneConfig,
    pages: pageRows.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      order: page.sortOrder,
      status: page.status,
      seo: page.seo,
      components: componentRows
        .filter((component) => component.pageId === page.id)
        .map((component) => ({
          id: component.id,
          pageId: component.pageId,
          parentId: component.parentId,
          type: component.type,
          name: component.name,
          order: component.sortOrder,
          props: component.props,
          styles: component.styles,
          locked: component.locked,
          hidden: component.hidden,
        })),
    })),
  };
}

export async function createProjectVersion(ownerId: string, projectId: string, label?: string) {
  const snapshot = await buildProjectSnapshot(ownerId, projectId);
  const [latest] = await getDb()
    .select({ value: max(projectVersions.version) })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, projectId));
  const [version] = await getDb()
    .insert(projectVersions)
    .values({
      projectId,
      createdBy: ownerId,
      version: (latest?.value ?? 0) + 1,
      label,
      snapshot,
    })
    .returning();
  await touchProject(projectId);
  return version;
}

export async function listProjectVersions(ownerId: string, projectId: string) {
  await getOwnedProject(ownerId, projectId);
  return getDb()
    .select({
      id: projectVersions.id,
      version: projectVersions.version,
      label: projectVersions.label,
      createdAt: projectVersions.createdAt,
      createdBy: projectVersions.createdBy,
    })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, projectId))
    .orderBy(desc(projectVersions.version));
}
