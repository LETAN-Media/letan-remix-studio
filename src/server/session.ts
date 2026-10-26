import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";

export async function getCurrentSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requirePageUser() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  return session.user;
}
