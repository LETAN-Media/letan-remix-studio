import Link from "next/link";
import { listOwnedProjects } from "@/server/services/projects";
import { requirePageUser } from "@/server/session";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const projects = await listOwnedProjects(user.id);
  return (
    <main className="dashboard">
      <section className="dashboard-heading">
        <div><p className="kicker">Project workspace</p><h1>My websites</h1><p>Structured projects you can return to, edit, version, and publish.</p></div>
        <Link className="button button-primary" href="/dashboard/new">Create new</Link>
      </section>
      {projects.length ? (
        <section className="project-grid">
          {projects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <div className="project-thumbnail"><span>{project.name.slice(0, 1).toUpperCase()}</span></div>
              <div className="project-card-body">
                <div className="status-row"><span className={`status status-${project.status}`}>{project.status}</span><time>{project.updatedAt.toLocaleDateString("en-GB")}</time></div>
                <h2>{project.name}</h2>
                <p>{project.description || "No description yet."}</p>
                <small>{project.industry || "Uncategorized"} · Open workspace →</small>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="empty-state"><div>✦</div><h2>Your first structured website starts here.</h2><p>Create a project to get a Home page, stable component tree, theme tokens, and scene configuration.</p><Link className="button button-primary" href="/dashboard/new">Create your first project</Link></section>
      )}
    </main>
  );
}
