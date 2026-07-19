import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const allowed = ["displayName", "currency", "locale", "darkMode", "notifications", "onboardingComplete"] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  await db.update(users).set(updates).where(eq(users.id, session.userId));
  return NextResponse.json({ ok: true });
}
