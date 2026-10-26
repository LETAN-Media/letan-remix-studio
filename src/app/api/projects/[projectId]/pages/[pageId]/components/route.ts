import { createComponentSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { createComponent, listComponents } from "@/server/services/editor";

type Context = { params: Promise<{ projectId: string; pageId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId } = await context.params;
    return jsonOk(await listComponents(user.id, projectId, pageId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId } = await context.params;
    const input = await readJson(request, createComponentSchema);
    return jsonOk(await createComponent(user.id, projectId, pageId, input), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
