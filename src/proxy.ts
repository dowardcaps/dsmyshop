import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Runs before every matched request: unauthenticated visitors are sent to /login.
export default NextAuth(authConfig).auth;

export const config = {
  // Public: Auth.js endpoints, health check, and static assets.
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"],
};
