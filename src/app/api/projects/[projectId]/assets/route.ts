import { requestAssetUploadSchema } from "@/domain/asset-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { listAssets, requestAssetUpload } from "@/server/services/assets";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    return jsonOk(await listAssets(user.id, projectId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const input = await readJson(request, requestAssetUploadSchema);
    return jsonOk(await requestAssetUpload(user.id, projectId, input), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
