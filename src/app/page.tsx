import Link from "next/link";
import { getCurrentSession } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
        <nav>
          <a href="#platform">Platform</a>
          <a href="#architecture">Architecture</a>
          <Link className="button button-quiet" href={session ? "/dashboard" : "/sign-in"}>
            {session ? "Open dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>
      <section className="hero-grid">
        <div>
          <p className="kicker">AI-native website creation</p>
          <h1>Build a website.<br /><em>Keep the project.</em></h1>
          <p className="hero-copy">
            LETAN Remix Studio stores pages, components, theme tokens, assets, scene settings, and version history—so a generated site remains editable and publishable.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href={session ? "/dashboard/new" : "/sign-up"}>
              {session ? "Create a project" : "Start building"}
            </Link>
            <a className="button button-quiet" href="#platform">Explore the platform</a>
          </div>
        </div>
        <div className="orbital" aria-hidden="true"><div /><i /><i /></div>
      </section>
      <section className="feature-section" id="platform">
        <p className="kicker">One project model, five capabilities</p>
        <div className="feature-grid">
          {[
            ["01", "Structured generation", "AI plans will write validated pages and components, not an opaque HTML string."],
            ["02", "Visual editing", "Stable component IDs make scoped edits, undo, history, and autosave possible."],
            ["03", "Real 3D scenes", "A typed scene contract is ready for Three.js modules, assets, camera, light, and materials."],
            ["04", "Owned assets", "Signed R2 uploads keep credentials server-side and files isolated by user and project."],
            ["05", "Versioned publishing", "Immutable project snapshots feed future sandboxed build and deployment workers."],
          ].map(([number, title, copy]) => (
            <article key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></article>
          ))}
        </div>
      </section>
      <section className="architecture-strip" id="architecture">
        <p>User brief</p><i>→</i><p>Project schema</p><i>→</i><p>Component renderer</p><i>→</i><p>Editor</p><i>→</i><p>Publish worker</p>
      </section>
    </main>
  );
}
