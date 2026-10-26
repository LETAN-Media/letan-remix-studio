import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
      <section className="auth-card">
        <p className="kicker">Welcome back</p>
        <h1>Sign in to your workspace.</h1>
        <AuthForm mode="sign-in" />
        <p className="auth-switch">New to Remix Studio? <Link href="/sign-up">Create an account</Link></p>
      </section>
    </main>
  );
}
