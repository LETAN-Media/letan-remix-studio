import type { ProjectSnapshot } from "./project-schema";

export const REMIX_CATEGORIES = [
  "Agency",
  "AI Tools",
  "Consulting",
  "CRM",
  "Finance",
  "Investor",
  "SaaS",
  "Sales & Marketing",
] as const;

export const REMIX_STYLES = [
  { id: "artificial-aura", name: "Artificial Aura", colors: ["#121630", "#7c72ee", "#c7b8ff", "#8ef1e3"] },
  { id: "dreamscape", name: "Dreamscape", colors: ["#251c45", "#8b75f6", "#f1b8da", "#f9d79f"] },
  { id: "tech", name: "Tech", colors: ["#071c2d", "#1592bb", "#55e1d2", "#b6fff7"] },
  { id: "abstract", name: "Abstract", colors: ["#2a1741", "#cf6649", "#ab70ee", "#ffd292"] },
  { id: "elegant-glass", name: "Elegant Glass", colors: ["#182133", "#809cb6", "#d4dded", "#ffffff"] },
  { id: "nature-artifacts", name: "Nature Artifacts", colors: ["#102923", "#4e9174", "#d7bd8c", "#d8f5df"] },
  { id: "machina", name: "Machina", colors: ["#17171d", "#777788", "#d1d0dc", "#f2efff"] },
] as const;

export const REMIX_SCENES = [
  { id: "orbital-glass", name: "Orbital Glass", description: "Glass core with illuminated orbit rings", module: "orbital-glass" },
  { id: "prism-bloom", name: "Prism Bloom", description: "Faceted crystal with a soft rotating bloom", module: "prism-bloom" },
  { id: "kinetic-rings", name: "Kinetic Rings", description: "Layered torus forms with kinetic depth", module: "kinetic-rings" },
] as const;

export type RemixDraft = {
  category: (typeof REMIX_CATEGORIES)[number];
  name: string;
  description: string;
  styleId: (typeof REMIX_STYLES)[number]["id"];
  sceneId: (typeof REMIX_SCENES)[number]["id"];
  styleChosen: boolean;
  sceneChosen: boolean;
  colors: [string, string, string, string];
  step: number;
};

export const DEFAULT_REMIX_DRAFT: RemixDraft = {
  category: "Agency",
  name: "",
  description: "",
  styleId: "artificial-aura",
  sceneId: "orbital-glass",
  styleChosen: false,
  sceneChosen: false,
  colors: ["#815BBA", "#FDCFFF", "#9E9E9E", "#AEA4CA"],
  step: 0,
};

const HEX = /^#[0-9a-f]{6}$/i;

export function sanitizeRemixDraft(value: unknown): RemixDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_REMIX_DRAFT;
  const candidate = value as Partial<RemixDraft>;
  const category = REMIX_CATEGORIES.includes(candidate.category as RemixDraft["category"])
    ? (candidate.category as RemixDraft["category"])
    : DEFAULT_REMIX_DRAFT.category;
  const styleId = REMIX_STYLES.some((style) => style.id === candidate.styleId)
    ? (candidate.styleId as RemixDraft["styleId"])
    : DEFAULT_REMIX_DRAFT.styleId;
  const sceneId = REMIX_SCENES.some((scene) => scene.id === candidate.sceneId)
    ? (candidate.sceneId as RemixDraft["sceneId"])
    : DEFAULT_REMIX_DRAFT.sceneId;
  const colors = Array.isArray(candidate.colors) && candidate.colors.length === 4 && candidate.colors.every((color) => typeof color === "string" && HEX.test(color))
    ? (candidate.colors as RemixDraft["colors"])
    : DEFAULT_REMIX_DRAFT.colors;
  return {
    category,
    styleId,
    sceneId,
    styleChosen: typeof candidate.styleChosen === "boolean" ? candidate.styleChosen : (candidate.step ?? 0) >= 4,
    sceneChosen: typeof candidate.sceneChosen === "boolean" ? candidate.sceneChosen : (candidate.step ?? 0) >= 5,
    colors,
    name: typeof candidate.name === "string" ? candidate.name.slice(0, 120) : "",
    description: typeof candidate.description === "string" ? candidate.description.slice(0, 2000) : "",
    step: typeof candidate.step === "number" ? Math.max(0, Math.min(5, Math.trunc(candidate.step))) : 0,
  };
}

export function buildDraftSnapshot(draft: RemixDraft): ProjectSnapshot {
  const style = REMIX_STYLES.find((item) => item.id === draft.styleId) ?? REMIX_STYLES[0];
  const scene = REMIX_SCENES.find((item) => item.id === draft.sceneId) ?? REMIX_SCENES[0];
  const name = draft.name.trim() || "Your next idea";
  const description = draft.description.trim() || "Describe the experience you want to create.";
  return {
    schemaVersion: 1,
    project: {
      id: "00000000-0000-4000-8000-000000000001",
      name,
      slug: "remix-preview",
      description,
      industry: draft.category,
      status: "draft",
    },
    theme: {
      colors: {
        background: draft.colors[0],
        foreground: "#f9f8ff",
        primary: draft.colors[1],
        secondary: draft.colors[2],
        accent: draft.colors[3],
        muted: "#a8a4b8",
      },
      typography: {
        headingFamily: style.id === "elegant-glass" ? "Georgia" : "Arial",
        bodyFamily: "Arial",
        scale: style.id === "machina" ? "compact" : "balanced",
      },
      radius: style.id === "machina" ? "small" : "large",
      spacing: "comfortable",
    },
    scene: {
      module: scene.module,
      assetId: null,
      quality: "auto",
      camera: { position: [0, 0, 5], target: [0, 0, 0], fov: 45 },
      lighting: {
        environment: null,
        environmentColor: draft.colors[0],
        keyColor: draft.colors[3],
        intensity: 1.4,
      },
      material: {
        preset: "glass",
        color: draft.colors[1],
        metalness: 0.35,
        roughness: 0.2,
      },
      animation: { name: "ambient-float", speed: 1, scrollDriven: false },
    },
    pages: [
      {
        id: "00000000-0000-4000-8000-000000000002",
        title: "Home",
        slug: "home",
        order: 0,
        status: "draft",
        seo: { title: name.slice(0, 70), description: description.slice(0, 170), noIndex: true },
        components: [
          {
            id: "00000000-0000-4000-8000-000000000003",
            pageId: "00000000-0000-4000-8000-000000000002",
            parentId: null,
            type: "hero",
            name: "Hero",
            order: 0,
            props: {
              eyebrow: `${draft.category} · ${style.name}`,
              heading: name,
              description,
              primaryAction: { label: "Start a conversation", href: "#contact" },
            },
            styles: { desktop: {}, tablet: {}, mobile: {} },
            locked: false,
            hidden: false,
          },
        ],
      },
    ],
  };
}
