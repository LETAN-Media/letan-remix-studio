import { z } from "zod";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { createProjectVersion, listProjectVersions } from "@/server/services/projects";

const createVersionSchema = z.object({ label: z.string().trim().max(160).optional() });
type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    return jsonOk(await listProjectVersions(user.id, projectId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const input = await readJson(request, createVersionSchema);
    return jsonOk(await createProjectVersion(user.id, projectId, input.label), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
