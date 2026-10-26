import { updatePageSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { deletePage, updatePage } from "@/server/services/editor";

type Context = { params: Promise<{ projectId: string; pageId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId } = await context.params;
    const input = await readJson(request, updatePageSchema);
    return jsonOk(await updatePage(user.id, projectId, pageId, input));
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, pageId } = await context.params;
    return jsonOk(await deletePage(user.id, projectId, pageId));
  } catch (error) {
    return routeError(error);
  }
}
