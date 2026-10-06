import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no database or Node-only imports).
 * Used by the proxy for route protection; the full config lives in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      if (nextUrl.pathname === "/login") {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
