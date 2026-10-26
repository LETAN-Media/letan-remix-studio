"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ApiResult = { data?: { id: string }; error?: { message?: string } };

export function CreateProjectForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        industry: form.get("industry"),
      }),
    });
    const result = (await response.json()) as ApiResult;
    if (!response.ok || !result.data) {
      setError(result.error?.message ?? "Could not create the project");
      setPending(false);
      return;
    }
    router.push(`/projects/${result.data.id}`);
    router.refresh();
  }

  return (
    <form className="project-form" onSubmit={submit}>
      <label>
        Project name
        <input name="name" placeholder="Example: Aurora Studio" minLength={2} maxLength={120} required />
      </label>
      <label>
        Industry
        <input name="industry" placeholder="Agency, SaaS, architecture…" maxLength={120} />
      </label>
      <label className="form-wide">
        What does the business do?
        <textarea name="description" rows={4} maxLength={2000} placeholder="Describe the product, audience, and goal." />
      </label>
      {error ? <p className="form-error form-wide" role="alert">{error}</p> : null}
      <div className="form-actions form-wide">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create structured project"}
        </button>
      </div>
    </form>
  );
}
