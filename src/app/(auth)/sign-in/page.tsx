import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const requested = (await searchParams).returnTo;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  return (
    <main className="auth-shell">
      <Link href="/" className="brand"><i />LETAN <span>REMIX</span></Link>
      <section className="auth-card">
        <p className="kicker">Welcome back</p>
        <h1>Sign in to your workspace.</h1>
        <AuthForm mode="sign-in" returnTo={returnTo} />
        <p className="auth-switch">New to Remix Studio? <Link href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`}>Create an account</Link></p>
      </section>
    </main>
  );
}
