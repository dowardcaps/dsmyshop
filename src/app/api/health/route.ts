import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + database connectivity check. Returns no business data. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
