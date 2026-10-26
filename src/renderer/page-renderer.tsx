import type { ProjectSnapshot } from "@/domain/project-schema";

type Component = ProjectSnapshot["pages"][number]["components"][number];

function stringProp(component: Component, key: string, fallback = "") {
  const value = component.props[key];
  return typeof value === "string" ? value : fallback;
}

function Hero({ component }: { component: Component }) {
  const action = component.props.primaryAction;
  const safeAction =
    action && typeof action === "object" && !Array.isArray(action)
      ? (action as Record<string, unknown>)
      : undefined;
  return (
    <section className="render-hero" data-component-id={component.id}>
      <div>
        <p className="render-eyebrow">{stringProp(component, "eyebrow", "Website")}</p>
        <h1>{stringProp(component, "heading", component.name)}</h1>
        <p className="render-lead">{stringProp(component, "description")}</p>
        {typeof safeAction?.label === "string" && typeof safeAction?.href === "string" ? (
          <a className="render-action" href={safeAction.href}>
            {safeAction.label}
          </a>
        ) : null}
      </div>
      <div className="render-art" aria-label="3D scene placeholder">
        <span />
      </div>
    </section>
  );
}

function TextSection({ component }: { component: Component }) {
  return (
    <section className="render-section" data-component-id={component.id}>
      <p className="render-eyebrow">{stringProp(component, "eyebrow")}</p>
      <h2>{stringProp(component, "heading", component.name)}</h2>
      <p className="render-lead">{stringProp(component, "body")}</p>
    </section>
  );
}

function RenderComponent({ component }: { component: Component }) {
  if (component.hidden) return null;
  switch (component.type) {
    case "hero":
      return <Hero component={component} />;
    case "text":
    case "section":
      return <TextSection component={component} />;
    default:
      return (
        <section className="render-section render-unknown" data-component-id={component.id}>
          <p>{component.name}</p>
          <small>{component.type}</small>
        </section>
      );
  }
}

export function PageRenderer({ snapshot, pageSlug = "home" }: { snapshot: ProjectSnapshot; pageSlug?: string }) {
  const page = snapshot.pages.find((candidate) => candidate.slug === pageSlug) ?? snapshot.pages[0];
  if (!page) return <div className="render-empty">This project has no pages yet.</div>;
  const roots = page.components.filter((component) => component.parentId === null);
  return (
    <div
      className="render-site"
      style={
        {
          "--render-bg": snapshot.theme.colors.background,
          "--render-fg": snapshot.theme.colors.foreground,
          "--render-primary": snapshot.theme.colors.primary,
          "--render-secondary": snapshot.theme.colors.secondary,
        } as React.CSSProperties
      }
    >
      <nav className="render-nav">
        <strong>{snapshot.project.name}</strong>
        <div>{snapshot.pages.map((item) => <span key={item.id}>{item.title}</span>)}</div>
      </nav>
      {roots.map((component) => <RenderComponent key={component.id} component={component} />)}
    </div>
  );
}
