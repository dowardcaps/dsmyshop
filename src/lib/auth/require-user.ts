import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Server-side authorization check. Call at the top of every protected layout,
 * page, server action and route handler. Redirects to /login when signed out.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) redirect("/login");
  return { id: user.id, name: user.name ?? user.email, email: user.email };
}
