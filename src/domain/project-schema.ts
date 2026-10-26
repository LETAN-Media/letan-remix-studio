import { z } from "zod";

export const PROJECT_SCHEMA_VERSION = 1 as const;

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Expected a six-digit hex color");
const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

export const projectStatusSchema = z.enum(["draft", "generating", "ready", "published", "archived"]);
export const pageStatusSchema = z.enum(["draft", "published"]);

export const themeTokensSchema = z.object({
  colors: z.object({
    background: hexColor,
    foreground: hexColor,
    primary: hexColor,
    secondary: hexColor,
    accent: hexColor,
    muted: hexColor,
  }),
  typography: z.object({
    headingFamily: z.string().min(1).max(120),
    bodyFamily: z.string().min(1).max(120),
    scale: z.enum(["compact", "balanced", "editorial"]),
  }),
  radius: z.enum(["none", "small", "medium", "large", "pill"]),
  spacing: z.enum(["compact", "comfortable", "spacious"]),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

export const defaultThemeTokens: ThemeTokens = {
  colors: {
    background: "#0b1020",
    foreground: "#f7f8ff",
    primary: "#7267f0",
    secondary: "#b8a7ff",
    accent: "#49e6d1",
    muted: "#9298ad",
  },
  typography: {
    headingFamily: "Inter",
    bodyFamily: "Inter",
    scale: "balanced",
  },
  radius: "large",
  spacing: "comfortable",
};

export const sceneConfigSchema = z.object({
  module: z.string().min(1).max(80).default("none"),
  assetId: z.string().uuid().nullable().default(null),
  quality: z.enum(["auto", "low", "medium", "high"]).default("auto"),
  camera: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
    fov: z.number().min(15).max(100),
  }),
  lighting: z.object({
    environment: z.string().max(200).nullable(),
    environmentColor: hexColor,
    keyColor: hexColor,
    intensity: z.number().min(0).max(20),
  }),
  material: z.object({
    preset: z.string().min(1).max(80),
    color: hexColor,
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
  }),
  animation: z.object({
    name: z.string().max(120).nullable(),
    speed: z.number().min(0).max(5),
    scrollDriven: z.boolean(),
  }),
});

export type SceneConfig = z.infer<typeof sceneConfigSchema>;

export const defaultSceneConfig: SceneConfig = {
  module: "none",
  assetId: null,
  quality: "auto",
  camera: { position: [0, 0, 5], target: [0, 0, 0], fov: 45 },
  lighting: {
    environment: null,
    environmentColor: "#0b1020",
    keyColor: "#ffffff",
    intensity: 1,
  },
  material: { preset: "standard", color: "#7267f0", metalness: 0.2, roughness: 0.55 },
  animation: { name: null, speed: 1, scrollDriven: false },
};

export const responsiveStylesSchema = z.object({
  desktop: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  tablet: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  mobile: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const componentPropsSchema = z.record(z.string(), z.unknown());

export const componentSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  type: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  order: z.number().int().min(0),
  props: componentPropsSchema,
  styles: responsiveStylesSchema,
  locked: z.boolean(),
  hidden: z.boolean(),
});

export const pageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(160),
  slug,
  order: z.number().int().min(0),
  status: pageStatusSchema,
  seo: z.object({
    title: z.string().max(70).nullable(),
    description: z.string().max(170).nullable(),
    noIndex: z.boolean(),
  }),
  components: z.array(componentSchema),
});

export const projectSnapshotSchema = z.object({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  project: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(120),
    slug,
    description: z.string().max(2000),
    industry: z.string().max(120),
    status: projectStatusSchema,
  }),
  theme: themeTokensSchema,
  scene: sceneConfigSchema,
  pages: z.array(pageSchema),
});

export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slug.optional(),
  description: z.string().trim().max(2000).default(""),
  industry: z.string().trim().max(120).default(""),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: projectStatusSchema.optional(),
  theme: themeTokensSchema.optional(),
});

export const createPageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug,
  status: pageStatusSchema.default("draft"),
  seo: pageSchema.shape.seo.optional(),
});

export const updatePageSchema = createPageSchema.partial().extend({ order: z.number().int().min(0).optional() });

export const createComponentSchema = z.object({
  parentId: z.string().uuid().nullable().default(null),
  type: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  order: z.number().int().min(0).default(0),
  props: componentPropsSchema.default({}),
  styles: responsiveStylesSchema.default({ desktop: {}, tablet: {}, mobile: {} }),
});

export const updateComponentSchema = createComponentSchema.partial().extend({
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const updateSceneSchema = z.object({
  module: z.string().min(1).max(80).optional(),
  assetId: z.string().uuid().nullable().optional(),
  quality: z.enum(["auto", "low", "medium", "high"]).optional(),
  camera: z
    .object({
      position: z.tuple([z.number(), z.number(), z.number()]).optional(),
      target: z.tuple([z.number(), z.number(), z.number()]).optional(),
      fov: z.number().min(15).max(100).optional(),
    })
    .optional(),
  lighting: z
    .object({
      environment: z.string().max(200).nullable().optional(),
      environmentColor: hexColor.optional(),
      keyColor: hexColor.optional(),
      intensity: z.number().min(0).max(20).optional(),
    })
    .optional(),
  material: z
    .object({
      preset: z.string().min(1).max(80).optional(),
      color: hexColor.optional(),
      metalness: z.number().min(0).max(1).optional(),
      roughness: z.number().min(0).max(1).optional(),
    })
    .optional(),
  animation: z
    .object({
      name: z.string().max(120).nullable().optional(),
      speed: z.number().min(0).max(5).optional(),
      scrollDriven: z.boolean().optional(),
    })
    .optional(),
});

export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "untitled-project";
}
