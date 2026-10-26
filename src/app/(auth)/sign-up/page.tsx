import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
      <section className="auth-card">
        <p className="kicker">Create your workspace</p>
        <h1>Start with a real project.</h1>
        <AuthForm mode="sign-up" />
        <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  );
}
