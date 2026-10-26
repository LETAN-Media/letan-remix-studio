import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { assets } from "@/server/db/schema";
import { HttpError } from "@/server/http";
import {
  createAssetDownloadUrl,
  createAssetUploadUrl,
  deleteAssetObject,
  verifyAssetObject,
} from "@/server/storage/r2";
import { getOwnedProject, touchProject } from "./projects";

function safeFilename(filename: string) {
  const extension = filename.includes(".") ? `.${filename.split(".").pop()!.toLowerCase()}` : "";
  const stem = filename
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${stem || "asset"}${extension}`;
}

export async function listAssets(ownerId: string, projectId: string) {
  await getOwnedProject(ownerId, projectId);
  return getDb()
    .select({
      id: assets.id,
      filename: assets.filename,
      mimeType: assets.mimeType,
      size: assets.size,
      status: assets.status,
      width: assets.width,
      height: assets.height,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(and(eq(assets.projectId, projectId), eq(assets.ownerId, ownerId)))
    .orderBy(desc(assets.createdAt));
}

export async function requestAssetUpload(
  ownerId: string,
  projectId: string,
  input: { filename: string; mimeType: string; size: number; checksum?: string },
) {
  await getOwnedProject(ownerId, projectId);
  const assetId = crypto.randomUUID();
  const objectKey = `users/${ownerId}/projects/${projectId}/${assetId}/${safeFilename(input.filename)}`;
  await getDb().insert(assets).values({
    id: assetId,
    projectId,
    ownerId,
    filename: input.filename,
    objectKey,
    mimeType: input.mimeType,
    size: input.size,
    checksum: input.checksum,
  });
  try {
    const uploadUrl = await createAssetUploadUrl({ objectKey, ...input });
    await touchProject(projectId);
    return { assetId, uploadUrl, expiresIn: 600, method: "PUT" as const };
  } catch (error) {
    await getDb().update(assets).set({ status: "failed" }).where(eq(assets.id, assetId));
    throw error;
  }
}

export async function completeAssetUpload(ownerId: string, projectId: string, assetId: string) {
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.projectId, projectId), eq(assets.ownerId, ownerId)))
    .limit(1);
  if (!asset) throw new HttpError(404, "ASSET_NOT_FOUND", "Asset was not found");
  let object;
  try {
    object = await verifyAssetObject(asset.objectKey);
  } catch (error) {
    await getDb().update(assets).set({ status: "failed", updatedAt: new Date() }).where(eq(assets.id, asset.id));
    throw error;
  }
  if (Number(object.ContentLength) !== asset.size || object.ContentType !== asset.mimeType) {
    await getDb().update(assets).set({ status: "failed" }).where(eq(assets.id, asset.id));
    throw new HttpError(422, "ASSET_MISMATCH", "Uploaded object does not match the signed request");
  }
  const [updated] = await getDb()
    .update(assets)
    .set({ status: "ready", updatedAt: new Date() })
    .where(eq(assets.id, asset.id))
    .returning();
  await touchProject(projectId);
  return updated;
}

export async function getAssetAccess(ownerId: string, projectId: string, assetId: string) {
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.projectId, projectId), eq(assets.ownerId, ownerId)))
    .limit(1);
  if (!asset) throw new HttpError(404, "ASSET_NOT_FOUND", "Asset was not found");
  if (asset.status !== "ready") {
    throw new HttpError(409, "ASSET_NOT_READY", "Asset upload is not ready");
  }
  return {
    id: asset.id,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    downloadUrl: await createAssetDownloadUrl(asset),
    expiresIn: 300,
  };
}

export async function deleteAsset(ownerId: string, projectId: string, assetId: string) {
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.projectId, projectId), eq(assets.ownerId, ownerId)))
    .limit(1);
  if (!asset) throw new HttpError(404, "ASSET_NOT_FOUND", "Asset was not found");
  await deleteAssetObject(asset.objectKey);
  await getDb().update(assets).set({ status: "deleted", updatedAt: new Date() }).where(eq(assets.id, asset.id));
  await touchProject(projectId);
  return { id: asset.id };
}
