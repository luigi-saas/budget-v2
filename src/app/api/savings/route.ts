import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savingGoals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const goals = await db.select().from(savingGoals)
    .where(eq(savingGoals.userId, session.userId));
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { name, target, source } = body;

  const [goal] = await db.insert(savingGoals).values({
    userId: session.userId, name, target, source: source ?? "BANK",
  }).returning();

  return NextResponse.json({ goal });
}

export async function PUT(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { id, current, active, name, target } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (current !== undefined) updates.current = current;
  if (active !== undefined) updates.active = active;
  if (name !== undefined) updates.name = name;
  if (target !== undefined) updates.target = target;

  await db.update(savingGoals).set(updates)
    .where(and(eq(savingGoals.id, id), eq(savingGoals.userId, session.userId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(savingGoals).where(and(eq(savingGoals.id, id), eq(savingGoals.userId, session.userId)));
  return NextResponse.json({ ok: true });
}
