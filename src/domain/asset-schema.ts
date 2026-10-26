import { z } from "zod";

export const ALLOWED_ASSET_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "model/gltf-binary",
  "model/gltf+json",
] as const;

export const MAX_ASSET_BYTES = 100 * 1024 * 1024;

export const requestAssetUploadSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  mimeType: z.enum(ALLOWED_ASSET_MIME_TYPES),
  size: z.number().int().positive().max(MAX_ASSET_BYTES),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});

export const completeAssetUploadSchema = z.object({
  assetId: z.string().uuid(),
});
