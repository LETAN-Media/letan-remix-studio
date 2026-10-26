import { jsonOk, requireApiUser, routeError } from "@/server/http";
import { deleteAsset, getAssetAccess } from "@/server/services/assets";

type Context = { params: Promise<{ projectId: string; assetId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, assetId } = await context.params;
    return jsonOk(await getAssetAccess(user.id, projectId, assetId));
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId, assetId } = await context.params;
    return jsonOk(await deleteAsset(user.id, projectId, assetId));
  } catch (error) {
    return routeError(error);
  }
}
