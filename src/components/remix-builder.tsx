"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
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
  { title: "Business Description", question: "What do you do, who is it for, and what should the site achieve?" },
  { title: "Pick Your Style", question: "Choose a visual direction for your new website." },
  { title: "Select 3D Design", question: "Choose a live WebGL scene for the hero." },
  { title: "Color styles", question: "Tune your palette and inspect the structured live preview." },
] as const;

const COLOR_LABELS = ["Environment", "Primary", "Secondary", "3D light"];

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

  const snapshot = useMemo(() => buildDraftSnapshot(draft), [draft]);
  const scene = REMIX_SCENES.find((item) => item.id === draft.sceneId) ?? REMIX_SCENES[0];
  const currentStep = draft.step >= 1 ? STEP_COPY[draft.step] : null;
  const nextDisabled = draft.step === 1
    ? draft.name.trim().length < 2
    : draft.step === 2
      ? draft.description.trim().length < 20
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
    const style = REMIX_STYLES.find((item) => item.id === styleId) ?? REMIX_STYLES[0];
    patch({ styleId, colors: [...style.colors] as RemixDraft["colors"] });
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
      <RemixScene variant={scene.id} colors={draft.colors} className="remix-background-scene" />

      {draft.step === 0 ? (
        <>
          <button className="remix-skip" type="button" onClick={() => start()} data-testid="skip-builder">Skip</button>
          <section className="remix-intro" aria-labelledby="remix-title">
            <h1 id="remix-title">Create a Site<br />in Seconds.</h1>
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
        <section className={`remix-workspace ${draft.step === 5 ? "remix-workspace--preview" : ""}`}>
          <article className={`remix-wizard-card ${draft.step === 3 || draft.step === 4 ? "remix-wizard-card--catalog" : ""}`}>
            <header className="remix-wizard-head">
              <p>Step {draft.step} of 5</p>
              <div aria-label={`Step ${draft.step} of 5`}>
                {[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= draft.step ? "active" : ""} />)}
              </div>
            </header>
            <h1>{currentStep?.title}</h1>
            <p className="remix-question"><Spark />{currentStep?.question}</p>

            <div className="remix-step-content" key={draft.step}>
              {draft.step === 1 ? (
                <label className="remix-text-field">
                  <span>Business or project name</span>
                  <input
                    autoFocus
                    value={draft.name}
                    maxLength={120}
                    placeholder="Example: Northstar Studio"
                    onChange={(event) => patch({ name: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !nextDisabled) goNext();
                    }}
                  />
                </label>
              ) : null}

              {draft.step === 2 ? (
                <label className="remix-text-field remix-text-field--area">
                  <span>Business, audience, and goal</span>
                  <textarea
                    autoFocus
                    value={draft.description}
                    maxLength={2000}
                    placeholder="We help… Our audience is… The website should…"
                    onChange={(event) => patch({ description: event.target.value })}
                  />
                  <small>{draft.description.trim().length}/20 minimum characters</small>
                </label>
              ) : null}

              {draft.step === 3 ? (
                <div className="remix-style-grid" data-testid="style-grid">
                  {REMIX_STYLES.map((style, index) => (
                    <button
                      key={style.id}
                      type="button"
                      className={draft.styleId === style.id ? "selected" : ""}
                      aria-pressed={draft.styleId === style.id}
                      onClick={() => chooseStyle(style.id)}
                    >
                      <span className={`remix-style-thumb style-${index}`} style={{ background: `linear-gradient(140deg, ${style.colors[0]}, ${style.colors[1]} 48%, ${style.colors[2]})` }}>
                        <i /><i /><i />
                      </span>
                      <b>{style.name}</b>
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
                      className={draft.sceneId === item.id ? "selected" : ""}
                      aria-pressed={draft.sceneId === item.id}
                      onClick={() => patch({ sceneId: item.id })}
                    >
                      <span className={`remix-scene-thumb scene-${index}`}><i /><i /><i /></span>
                      <span><b>{item.name}</b><small>{item.description}</small><em>Live WebGL</em></span>
                    </button>
                  ))}
                </div>
              ) : null}

              {draft.step === 5 ? (
                <div className="remix-palette" data-testid="color-styles">
                  {COLOR_LABELS.map((label, index) => (
                    <div className="remix-color-row" key={label}>
                      <button type="button" onClick={() => setActiveColor(activeColor === index ? null : index)} aria-expanded={activeColor === index}>
                        <span style={{ background: draft.colors[index] }} />
                        <span><b>{label}</b><code>{draft.colors[index].toUpperCase()}</code></span>
                        <i aria-hidden="true">⌄</i>
                      </button>
                      {activeColor === index ? (
                        <RemixColorPicker
                          label={label}
                          value={draft.colors[index]}
                          onChange={(color) => updateColor(index, color)}
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

          {draft.step === 5 ? (
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
