import Link from "next/link";
import { CreateProjectForm } from "@/components/create-project-form";

export default function NewProjectPage() {
  return (
    <main className="dashboard narrow">
      <Link className="back-link" href="/dashboard">← Back to projects</Link>
      <section className="new-project-card">
        <p className="kicker">New website</p>
        <h1>Start with the basics.</h1>
        <p>This data becomes the first version of the project model. Generation will extend it in Phase 2 without replacing it.</p>
        <CreateProjectForm />
      </section>
    </main>
  );
}
