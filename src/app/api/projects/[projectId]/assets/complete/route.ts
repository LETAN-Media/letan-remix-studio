import { completeAssetUploadSchema } from "@/domain/asset-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { completeAssetUpload } from "@/server/services/assets";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const input = await readJson(request, completeAssetUploadSchema);
    return jsonOk(await completeAssetUpload(user.id, projectId, input.assetId));
  } catch (error) {
    return routeError(error);
  }
}
