import { eq } from "drizzle-orm";
import { defaultSceneConfig, sceneConfigSchema, updateSceneSchema } from "@/domain/project-schema";
import { getDb } from "@/server/db";
import { sceneConfigurations } from "@/server/db/schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { updateScene } from "@/server/services/editor";
import { getOwnedProject } from "@/server/services/projects";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    await getOwnedProject(user.id, projectId);
    const [scene] = await getDb()
      .select()
      .from(sceneConfigurations)
      .where(eq(sceneConfigurations.projectId, projectId))
      .limit(1);
    return jsonOk(scene?.config ?? defaultSceneConfig);
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    await getOwnedProject(user.id, projectId);
    const input = await readJson(request, updateSceneSchema);
    const [current] = await getDb()
      .select({ config: sceneConfigurations.config })
      .from(sceneConfigurations)
      .where(eq(sceneConfigurations.projectId, projectId))
      .limit(1);
    const base = current?.config ?? defaultSceneConfig;
    const merged = sceneConfigSchema.parse({
      ...base,
      ...input,
      camera: { ...base.camera, ...input.camera },
      lighting: { ...base.lighting, ...input.lighting },
      material: { ...base.material, ...input.material },
      animation: { ...base.animation, ...input.animation },
    });
    return jsonOk(await updateScene(user.id, projectId, merged));
  } catch (error) {
    return routeError(error);
  }
}
