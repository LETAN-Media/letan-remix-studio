"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageRenderer } from "@/renderer/page-renderer";
import { authClient } from "@/lib/auth-client";
import {
  buildDraftSnapshot,
  DEFAULT_REMIX_DRAFT,
  REMIX_CATEGORIES,
  REMIX_SCENES,
  REMIX_STYLES,
  sanitizeRemixDraft,
  type RemixDraft,
} from "@/domain/remix-draft";
import { RemixColorPicker } from "./remix-color-picker";

const RemixScene = dynamic(() => import("./remix-scene").then((module) => module.RemixScene), { ssr: false });
const STORAGE_KEY = "letan-remix-draft-v1";

const STEP_COPY = [
  null,
  { title: "Start with Basics", question: "What's the name of your business/project?" },
  { title: "Start with Basics", question: "That's a cool name. What is the business about?" },
  { title: "Pick Your Style", question: "Select the style that fits your site." },
  { title: "Select 3D Design", question: "Choose the 3D design that you like most." },
  { title: "Color styles", question: "Customize the colors to fit your brand." },
] as const;

const COLOR_ROWS = [
  { label: "3D Main Primary", colorIndex: 1 },
  { label: "3D Main Secondary", colorIndex: 2 },
  { label: "3D Environment Primary", colorIndex: 0 },
  { label: "3D Lights Main", colorIndex: 3 },
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`remix-brand ${compact ? "remix-brand--compact" : ""}`}>
      <i aria-hidden="true"><b /><b /><b /></i>
      <span>LETAN <em>Remix</em></span>
    </span>
  );
}

function Spark() {
  return <span className="remix-spark" aria-hidden="true">✦</span>;
}

export function RemixBuilder({ aiConfigured }: { aiConfigured: boolean }) {
  const router = useRouter();
  const builderRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState<RemixDraft>(DEFAULT_REMIX_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const query = new URLSearchParams(window.location.search);
        if (query.get("new") === "1") {
          sessionStorage.removeItem(STORAGE_KEY);
          setDraft(DEFAULT_REMIX_DRAFT);
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          const saved = sessionStorage.getItem(STORAGE_KEY);
          if (saved) setDraft(sanitizeRemixDraft(JSON.parse(saved)));
        }
      } catch {
        setDraft(DEFAULT_REMIX_DRAFT);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const syncHeight = () => {
      builderRef.current?.style.setProperty("--remix-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
    };
    syncHeight();
    viewport?.addEventListener("resize", syncHeight);
    viewport?.addEventListener("scroll", syncHeight);
    window.addEventListener("resize", syncHeight);
    return () => {
      viewport?.removeEventListener("resize", syncHeight);
      viewport?.removeEventListener("scroll", syncHeight);
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  const snapshot = useMemo(() => buildDraftSnapshot(draft), [draft]);
  const scene = REMIX_SCENES.find((item) => item.id === draft.sceneId) ?? REMIX_SCENES[0];
  const currentStep = draft.step >= 1 ? STEP_COPY[draft.step] : null;
  const nextDisabled = draft.step === 1
    ? draft.name.trim().length === 0
    : draft.step === 2
      ? draft.description.trim().length === 0
      : draft.step === 3
        ? !draft.styleChosen
        : draft.step === 4
          ? !draft.sceneChosen
          : false;

  function patch(values: Partial<RemixDraft>) {
    setDraft((current) => ({ ...current, ...values }));
    setGenerateError("");
  }

  function start(category: RemixDraft["category"] = draft.category) {
    patch({ category, step: 1 });
  }

  function goBack() {
    setActiveColor(null);
    setPreviewOnly(false);
    patch({ step: draft.step <= 1 ? 0 : draft.step - 1 });
  }

  function goNext() {
    if (nextDisabled) return;
    setActiveColor(null);
    patch({ step: Math.min(5, draft.step + 1) });
  }

  function chooseStyle(styleId: RemixDraft["styleId"]) {
    setActiveColor(null);
    patch({ styleId, styleChosen: true, step: 4 });
  }

  function chooseScene(sceneId: RemixDraft["sceneId"]) {
    patch({ sceneId, sceneChosen: true });
  }

  function updateColor(index: number, color: string) {
    const colors = [...draft.colors] as RemixDraft["colors"];
    colors[index] = color;
    patch({ colors });
  }

  async function generate() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    const session = await authClient.getSession();
    if (session.error) {
      setGenerateError("We could not verify your session. Your brief is saved; check your connection and try again.");
      return;
    }
    if (!session.data) {
      router.push(`/sign-up?returnTo=${encodeURIComponent("/remix?resume=1")}`);
      return;
    }
    if (!aiConfigured) {
      setGenerateError("AI generation is not configured yet. Your brief is saved in this session; configure AI_API_KEY and AI_MODEL before generating.");
      return;
    }
    setGenerateError("AI credentials are present, but the generation worker is not enabled yet. No website was generated or marked complete.");
  }

  if (!hydrated) return <main className="remix-builder remix-builder--loading" aria-label="Loading Remix Builder" />;

  return (
    <main
      ref={builderRef}
      className={`remix-builder remix-step-${draft.step} ${previewOnly ? "remix-preview-only" : ""}`}
      style={
        {
          "--remix-environment": draft.colors[0],
          "--remix-primary": draft.colors[1],
          "--remix-secondary": draft.colors[2],
          "--remix-light": draft.colors[3],
        } as React.CSSProperties
      }
    >
      <div className="remix-ambient" aria-hidden="true" />
      <RemixScene variant={scene.id} colors={draft.colors} stage={draft.step} className="remix-background-scene" />

      {draft.step === 0 ? (
        <>
          <button className="remix-skip" type="button" onClick={() => start()} data-testid="skip-builder">Skip</button>
          <section className="remix-intro" aria-labelledby="remix-title">
            <h1 id="remix-title" aria-label="Create a Site in Seconds">
              {['Create', 'a', 'Site', 'in', 'Seconds'].map((word, index) => <span key={word} style={{ "--word-index": index } as React.CSSProperties}>{word}</span>)}
            </h1>
            <div className="remix-category-panel">
              <p><Spark />What kind of site do you want to generate?</p>
              <div className="remix-category-grid">
                {REMIX_CATEGORIES.map((category) => (
                  <button key={category} type="button" onClick={() => start(category)} data-testid={`category-${category.toLowerCase().replaceAll(" ", "-")}`}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <Brand />
          </section>
        </>
      ) : (
        <section className={`remix-workspace ${draft.step === 5 || (draft.step === 4 && draft.sceneChosen) ? "remix-workspace--preview" : ""}`}>
          <article className="remix-wizard-card">
            <header className="remix-wizard-head">
              <p>Step {draft.step} of 5</p>
            </header>
            <h1>{currentStep?.title}</h1>
            <p className="remix-question"><Spark />{currentStep?.question}</p>

            <div className="remix-step-content" key={draft.step}>
              {draft.step === 1 ? (
                <label className="remix-text-field">
                  <span className="remix-visually-hidden">Business or project name</span>
                  <input
                    autoFocus
                    value={draft.name}
                    maxLength={120}
                    aria-label="Business or project name"
                    onChange={(event) => patch({ name: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !nextDisabled) goNext();
                    }}
                  />
                </label>
              ) : null}

              {draft.step === 2 ? (
                <label className="remix-text-field remix-text-field--area">
                  <span className="remix-visually-hidden">Business description</span>
                  <textarea
                    autoFocus
                    value={draft.description}
                    maxLength={2000}
                    aria-label="Business description"
                    onChange={(event) => patch({ description: event.target.value })}
                  />
                </label>
              ) : null}

              {draft.step === 3 ? (
                <div className="remix-style-grid" data-testid="style-grid">
                  {REMIX_STYLES.map((style, index) => (
                    <button
                      key={style.id}
                      type="button"
                      className={draft.styleChosen && draft.styleId === style.id ? "selected" : ""}
                      aria-pressed={draft.styleChosen && draft.styleId === style.id}
                      onClick={() => chooseStyle(style.id)}
                    >
                      <span className={`remix-style-thumb style-${index}`} style={{ "--style-a": style.colors[0], "--style-b": style.colors[1], "--style-c": style.colors[2] } as React.CSSProperties}>
                        <i /><i /><i />
                      </span>
                      <b>{style.name}</b><span className="remix-choice-check" aria-hidden="true">✓</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {draft.step === 4 ? (
                <div className="remix-scene-grid" data-testid="scene-grid">
                  {REMIX_SCENES.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={draft.sceneChosen && draft.sceneId === item.id ? "selected" : ""}
                      aria-pressed={draft.sceneChosen && draft.sceneId === item.id}
                      onClick={() => chooseScene(item.id)}
                    >
                      <span className={`remix-scene-thumb scene-${index}`}><i /><i /><i /><em>Live</em><b>{item.name}</b></span>
                      <span className="remix-choice-check" aria-hidden="true">✓</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {draft.step === 5 ? (
                <div className="remix-palette" data-testid="color-styles">
                  <b className="remix-palette-title">Color Palette</b>
                  {COLOR_ROWS.map(({ label, colorIndex }, index) => (
                    <div className="remix-color-row" key={label}>
                      <button type="button" onClick={() => setActiveColor(activeColor === index ? null : index)} aria-expanded={activeColor === index}>
                        <b>{label}</b>
                        <span><i style={{ background: draft.colors[colorIndex] }} /><code>{draft.colors[colorIndex].toUpperCase()}</code></span>
                      </button>
                      {activeColor === index ? (
                        <RemixColorPicker
                          label={label}
                          value={draft.colors[colorIndex]}
                          onChange={(color) => updateColor(colorIndex, color)}
                          onClose={() => setActiveColor(null)}
                        />
                      ) : null}
                    </div>
                  ))}
                  <button className="remix-mobile-preview-button" type="button" onClick={() => setPreviewOnly(true)}>Open live preview ↗</button>
                </div>
              ) : null}
            </div>

            {generateError ? <p className="remix-generate-error" role="alert">{generateError}</p> : null}
            <footer className="remix-wizard-actions">
              <button type="button" className="remix-exit" onClick={() => patch({ step: 0 })}>Exit</button>
              <div>
                <button type="button" onClick={goBack}>Back</button>
                {draft.step < 5 ? (
                  <button type="button" className="primary" disabled={nextDisabled} onClick={goNext}>Next <span>→</span></button>
                ) : (
                  <button type="button" className="primary" onClick={generate}>Generate <span>↗</span></button>
                )}
              </div>
            </footer>
          </article>

          {draft.step === 5 || (draft.step === 4 && draft.sceneChosen) ? (
            <section className="remix-live-preview" aria-label="Website live preview">
              <header>
                <div><i /><i /><i /></div>
                <span>{draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "your-project"}.preview</span>
                <button type="button" onClick={() => setPreviewOnly(false)}>Close preview</button>
              </header>
              <div className="remix-live-preview-scroll">
                <PageRenderer
                  snapshot={snapshot}
                  heroVisual={<RemixScene compact variant={scene.id} colors={draft.colors} />}
                />
              </div>
            </section>
          ) : (
            <aside className="remix-scene-caption" aria-hidden="true">
              <span>0{draft.step}</span>
              <p>{draft.step === 4 ? scene.name : draft.category}</p>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
