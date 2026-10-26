import { updateComponentSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { deleteComponent, updateComponent } from "@/server/services/editor";

type Context = { params: Promise<{ projectId: string; pageId: string; componentId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId, componentId } = await context.params;
    const input = await readJson(request, updateComponentSchema);
    return jsonOk(await updateComponent(user.id, projectId, pageId, componentId, input));
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId, componentId } = await context.params;
    return jsonOk(await deleteComponent(user.id, projectId, pageId, componentId));
  } catch (error) {
    return routeError(error);
  }
}
