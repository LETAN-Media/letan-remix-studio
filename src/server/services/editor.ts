import { and, asc, eq } from "drizzle-orm";
import type { SceneConfig } from "@/domain/project-schema";
import { getDb } from "@/server/db";
import { components, pages, projects, sceneConfigurations, updateTimestamp } from "@/server/db/schema";
import { HttpError } from "@/server/http";
import { getOwnedProject, touchProject } from "./projects";

export async function listPages(ownerId: string, projectId: string) {
  await getOwnedProject(ownerId, projectId);
  return getDb().select().from(pages).where(eq(pages.projectId, projectId)).orderBy(asc(pages.sortOrder));
}

export async function createPage(
  ownerId: string,
  projectId: string,
  input: {
    title: string;
    slug: string;
    status: "draft" | "published";
    seo?: { title: string | null; description: string | null; noIndex: boolean };
  },
) {
  await getOwnedProject(ownerId, projectId);
  const existing = await getDb().select({ id: pages.id }).from(pages).where(eq(pages.projectId, projectId));
  const [page] = await getDb()
    .insert(pages)
    .values({ ...input, projectId, sortOrder: existing.length })
    .returning();
  await touchProject(projectId);
  return page;
}

export async function updatePage(
  ownerId: string,
  projectId: string,
  pageId: string,
  input: Partial<{
    title: string;
    slug: string;
    status: "draft" | "published";
    order: number;
    seo: { title: string | null; description: string | null; noIndex: boolean };
  }>,
) {
  await getOwnedProject(ownerId, projectId);
  const { order, ...rest } = input;
  const [page] = await getDb()
    .update(pages)
    .set({ ...rest, ...(order === undefined ? {} : { sortOrder: order }), updatedAt: updateTimestamp })
    .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
    .returning();
  if (!page) throw new HttpError(404, "PAGE_NOT_FOUND", "Page was not found");
  await touchProject(projectId);
  return page;
}

export async function deletePage(ownerId: string, projectId: string, pageId: string) {
  await getOwnedProject(ownerId, projectId);
  const [page] = await getDb()
    .delete(pages)
    .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
    .returning({ id: pages.id });
  if (!page) throw new HttpError(404, "PAGE_NOT_FOUND", "Page was not found");
  await touchProject(projectId);
  return page;
}

async function assertOwnedPage(ownerId: string, projectId: string, pageId: string) {
  const [page] = await getDb()
    .select({ id: pages.id })
    .from(pages)
    .innerJoin(projects, eq(pages.projectId, projects.id))
    .where(and(eq(pages.id, pageId), eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!page) throw new HttpError(404, "PAGE_NOT_FOUND", "Page was not found");
}

export async function listComponents(ownerId: string, projectId: string, pageId: string) {
  await assertOwnedPage(ownerId, projectId, pageId);
  return getDb()
    .select()
    .from(components)
    .where(eq(components.pageId, pageId))
    .orderBy(asc(components.sortOrder));
}

export async function createComponent(
  ownerId: string,
  projectId: string,
  pageId: string,
  input: {
    parentId: string | null;
    type: string;
    name: string;
    order: number;
    props: Record<string, unknown>;
    styles: {
      desktop: Record<string, string | number | boolean>;
      tablet: Record<string, string | number | boolean>;
      mobile: Record<string, string | number | boolean>;
    };
  },
) {
  await assertOwnedPage(ownerId, projectId, pageId);
  if (input.parentId) {
    const [parent] = await getDb()
      .select({ id: components.id })
      .from(components)
      .where(and(eq(components.id, input.parentId), eq(components.pageId, pageId)))
      .limit(1);
    if (!parent) throw new HttpError(422, "INVALID_PARENT", "Parent component is not on this page");
  }
  const { order, ...values } = input;
  const [component] = await getDb()
    .insert(components)
    .values({ ...values, pageId, sortOrder: order })
    .returning();
  await touchProject(projectId);
  return component;
}

export async function updateComponent(
  ownerId: string,
  projectId: string,
  pageId: string,
  componentId: string,
  input: Partial<{
    parentId: string | null;
    type: string;
    name: string;
    order: number;
    props: Record<string, unknown>;
    styles: {
      desktop: Record<string, string | number | boolean>;
      tablet: Record<string, string | number | boolean>;
      mobile: Record<string, string | number | boolean>;
    };
    locked: boolean;
    hidden: boolean;
  }>,
) {
  await assertOwnedPage(ownerId, projectId, pageId);
  if (input.parentId === componentId) {
    throw new HttpError(422, "INVALID_PARENT", "A component cannot be its own parent");
  }
  if (input.parentId) {
    const rows = await getDb()
      .select({ id: components.id, parentId: components.parentId })
      .from(components)
      .where(eq(components.pageId, pageId));
    const byId = new Map(rows.map((row) => [row.id, row.parentId]));
    if (!byId.has(input.parentId)) {
      throw new HttpError(422, "INVALID_PARENT", "Parent component is not on this page");
    }
    let cursor: string | null | undefined = input.parentId;
    while (cursor) {
      if (cursor === componentId) {
        throw new HttpError(422, "COMPONENT_CYCLE", "Component nesting cannot contain a cycle");
      }
      cursor = byId.get(cursor);
    }
  }
  const { order, ...values } = input;
  const [component] = await getDb()
    .update(components)
    .set({ ...values, ...(order === undefined ? {} : { sortOrder: order }), updatedAt: updateTimestamp })
    .where(and(eq(components.id, componentId), eq(components.pageId, pageId)))
    .returning();
  if (!component) throw new HttpError(404, "COMPONENT_NOT_FOUND", "Component was not found");
  await touchProject(projectId);
  return component;
}

export async function deleteComponent(ownerId: string, projectId: string, pageId: string, componentId: string) {
  await assertOwnedPage(ownerId, projectId, pageId);
  const [component] = await getDb()
    .delete(components)
    .where(and(eq(components.id, componentId), eq(components.pageId, pageId)))
    .returning({ id: components.id });
  if (!component) throw new HttpError(404, "COMPONENT_NOT_FOUND", "Component was not found");
  await touchProject(projectId);
  return component;
}

export async function updateScene(ownerId: string, projectId: string, config: SceneConfig) {
  await getOwnedProject(ownerId, projectId);
  const [scene] = await getDb()
    .insert(sceneConfigurations)
    .values({ projectId, config })
    .onConflictDoUpdate({
      target: sceneConfigurations.projectId,
      set: { config, updatedAt: updateTimestamp },
    })
    .returning();
  await touchProject(projectId);
  return scene;
}
