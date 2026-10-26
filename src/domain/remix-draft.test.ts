import { describe, expect, it } from "vitest";
import { projectSnapshotSchema } from "./project-schema";
import {
  buildDraftSnapshot,
  DEFAULT_REMIX_DRAFT,
  REMIX_SCENES,
  sanitizeRemixDraft,
} from "./remix-draft";

describe("Remix Builder draft", () => {
  it("restores a valid session draft and clamps its step", () => {
    const restored = sanitizeRemixDraft({
      ...DEFAULT_REMIX_DRAFT,
      category: "Finance",
      name: "Aurora Capital",
      description: "A clear investment platform for independent founders.",
      sceneId: "kinetic-rings",
      step: 99,
    });

    expect(restored.category).toBe("Finance");
    expect(restored.sceneId).toBe("kinetic-rings");
    expect(restored.step).toBe(5);
  });

  it("rejects unknown scene ids and invalid colors from session storage", () => {
    const restored = sanitizeRemixDraft({
      ...DEFAULT_REMIX_DRAFT,
      sceneId: "untrusted-scene",
      colors: ["red", "#ffffff", "#ffffff", "#ffffff"],
    });

    expect(restored.sceneId).toBe(DEFAULT_REMIX_DRAFT.sceneId);
    expect(restored.colors).toEqual(DEFAULT_REMIX_DRAFT.colors);
  });

  it("maps every working scene into a valid structured project snapshot", () => {
    for (const scene of REMIX_SCENES) {
      const snapshot = buildDraftSnapshot({
        ...DEFAULT_REMIX_DRAFT,
        category: "AI Tools",
        name: "Signal Atelier",
        description: "A practical AI workspace for creative operations teams.",
        sceneId: scene.id,
        step: 5,
      });

      expect(projectSnapshotSchema.safeParse(snapshot).success).toBe(true);
      expect(snapshot.scene.module).toBe(scene.module);
      expect(snapshot.pages[0]?.components[0]?.props.heading).toBe("Signal Atelier");
    }
  });

  it("keeps visual choices explicit without breaking the structured preview fallback", () => {
    expect(DEFAULT_REMIX_DRAFT.styleChosen).toBe(false);
    expect(DEFAULT_REMIX_DRAFT.sceneChosen).toBe(false);

    const snapshot = buildDraftSnapshot({
      ...DEFAULT_REMIX_DRAFT,
      name: "Unselected Brief",
      description: "A draft that has not selected its visual direction yet.",
      step: 3,
    });

    expect(projectSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.scene.module).toBe("orbital-glass");
  });
});
