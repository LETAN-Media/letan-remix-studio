import type { Route } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const session = await getCurrentSession();
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
        <nav>
          <Link href="/">Builder</Link>
          <Link className="button button-quiet" href={session ? "/dashboard" : "/sign-in"}>
            {session ? "Open dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>
      <section className="hero-grid">
        <div>
          <p className="kicker">AI-native website creation</p>
          <h1>Build a website.<br /><em>Keep the project.</em></h1>
          <p className="hero-copy">Structured pages, components, theme tokens, assets, scene settings, and version history stay editable after generation.</p>
          <div className="hero-actions"><Link className="button button-primary" href={"/remix" as Route}>Open Remix Builder</Link></div>
        </div>
        <div className="orbital" aria-hidden="true"><div /><i /><i /></div>
      </section>
    </main>
  );
}
