"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation/auth";

export interface LoginState {
  error?: string;
  /** Echoed back so the email field survives React resetting the form after a failed attempt. */
  email?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : undefined;
  const parsed = loginSchema.safeParse({ email: rawEmail, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password.", email };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: error.type === "CredentialsSignin" ? "Invalid email or password." : "Something went wrong. Please try again.",
        email,
      };
    }
    throw error; // the success redirect is thrown by Next.js and must propagate
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
