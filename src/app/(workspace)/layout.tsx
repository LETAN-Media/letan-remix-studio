import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { requirePageUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <div className="workspace-shell">
      <header className="workspace-nav">
        <Link href="/dashboard" className="brand"><i />LETAN <span>REMIX</span></Link>
        <div><span className="user-email">{user.email}</span><SignOutButton /></div>
      </header>
      {children}
    </div>
  );
}
