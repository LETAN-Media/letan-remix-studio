"use client";

import type { Route } from "next";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode, returnTo = "/dashboard" }: { mode: "sign-in" | "sign-up"; returnTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const result = mode === "sign-up"
      ? await authClient.signUp.email({
          name: String(form.get("name") ?? ""),
          email,
          password,
          callbackURL: returnTo,
        })
      : await authClient.signIn.email({ email, password, callbackURL: returnTo });
    if (result.error) {
      setError(result.error.message ?? "Authentication failed");
      setPending(false);
      return;
    }
    router.push(returnTo as Route);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "sign-up" ? (
        <label>
          Name
          <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
      ) : null}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      {mode === "sign-up" ? <small>Use at least 12 characters.</small> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
