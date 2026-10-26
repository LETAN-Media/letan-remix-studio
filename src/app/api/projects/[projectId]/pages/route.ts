import { createPageSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { createPage, listPages } from "@/server/services/editor";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    return jsonOk(await listPages(user.id, projectId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const input = await readJson(request, createPageSchema);
    return jsonOk(await createPage(user.id, projectId, input), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
