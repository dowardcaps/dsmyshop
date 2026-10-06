import { ServiceError } from "@/lib/errors";

/**
 * Turns a thrown error into an action result. Expected ServiceErrors show their own message;
 * anything else is logged and replaced with the generic fallback.
 */
export function actionFailure(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof ServiceError) return { ok: false, error: error.message };
  console.error(fallback, error);
  return { ok: false, error: fallback };
}
