import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

// Used to keep response time similar when the email does not exist.
const DUMMY_HASH = "$2b$12$MJHQALoBJVbOY6.h1pKcYu.u/b6YsgykFc72ozp3joiD6ThSpMF5W";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || !valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
