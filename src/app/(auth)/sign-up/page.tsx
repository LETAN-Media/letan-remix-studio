import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const requested = (await searchParams).returnTo;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  return (
    <main className="auth-shell">
      <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
      <section className="auth-card">
        <p className="kicker">Create your workspace</p>
        <h1>Start with a real project.</h1>
        <AuthForm mode="sign-up" returnTo={returnTo} />
        <p className="auth-switch">Already have an account? <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link></p>
      </section>
    </main>
  );
}
