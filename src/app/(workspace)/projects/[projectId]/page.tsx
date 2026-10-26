import Link from "next/link";
import { PageRenderer } from "@/renderer/page-renderer";
import { buildProjectSnapshot } from "@/server/services/projects";
import { requirePageUser } from "@/server/session";

type Props = { params: Promise<{ projectId: string }> };

export default async function ProjectWorkspacePage({ params }: Props) {
  const user = await requirePageUser();
  const { projectId } = await params;
  const snapshot = await buildProjectSnapshot(user.id, projectId);
  const componentCount = snapshot.pages.reduce((sum, page) => sum + page.components.length, 0);
  return (
    <main className="project-workspace">
      <aside className="project-sidebar">
        <Link className="back-link" href="/dashboard">← My websites</Link>
        <p className="kicker">Project foundation</p>
        <h1>{snapshot.project.name}</h1>
        <span className={`status status-${snapshot.project.status}`}>{snapshot.project.status}</span>
        <dl>
          <div><dt>Pages</dt><dd>{snapshot.pages.length}</dd></div>
          <div><dt>Components</dt><dd>{componentCount}</dd></div>
          <div><dt>Schema</dt><dd>v{snapshot.schemaVersion}</dd></div>
          <div><dt>3D module</dt><dd>{snapshot.scene.module}</dd></div>
        </dl>
        <div className="phase-note"><strong>Phase 1</strong><p>This is the live React renderer reading the stored component tree. Visual editing and AI generation are intentionally not marked complete yet.</p></div>
      </aside>
      <section className="preview-panel">
        <header><span>Live structured preview</span><div><i /><i /><i /></div></header>
        <div className="preview-scroll"><PageRenderer snapshot={snapshot} /></div>
      </section>
    </main>
  );
}
