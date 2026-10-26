import { describe, expect, it } from "vitest";
import {
  createComponentSchema,
  createProjectSchema,
  defaultSceneConfig,
  sceneConfigSchema,
  toSlug,
  updateSceneSchema,
} from "./project-schema";
import { MAX_ASSET_BYTES, requestAssetUploadSchema } from "./asset-schema";

describe("project contracts", () => {
  it("normalizes Vietnamese names into portable slugs", () => {
    expect(toSlug("Studio Thiết Kế Tương Lai")).toBe("studio-thiet-ke-tuong-lai");
  });

  it("rejects invalid project input", () => {
    expect(createProjectSchema.safeParse({ name: "x", slug: "Not Valid" }).success).toBe(false);
  });

  it("accepts the default 3D contract used by later phases", () => {
    expect(sceneConfigSchema.parse(defaultSceneConfig)).toEqual(defaultSceneConfig);
  });

  it("creates components with responsive and stable editor defaults", () => {
    const component = createComponentSchema.parse({ type: "hero", name: "Hero" });
    expect(component.parentId).toBeNull();
    expect(component.styles.mobile).toEqual({});
  });

  it("accepts a scoped nested scene patch", () => {
    expect(updateSceneSchema.parse({ camera: { fov: 60 } })).toEqual({ camera: { fov: 60 } });
  });

  it("rejects executable and oversized assets before signing", () => {
    expect(
      requestAssetUploadSchema.safeParse({
        filename: "payload.exe",
        mimeType: "application/x-msdownload",
        size: 10,
      }).success,
    ).toBe(false);
    expect(
      requestAssetUploadSchema.safeParse({
        filename: "scene.glb",
        mimeType: "model/gltf-binary",
        size: MAX_ASSET_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});
