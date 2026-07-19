import { NextRequest } from "next/server";
import { db } from "@/db";
import { savingGoals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await db.select().from(savingGoals)
    .where(eq(savingGoals.userId, session.userId));

  return Response.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, target, source } = await req.json();
  const [goal] = await db.insert(savingGoals).values({
    userId: session.userId,
    name,
    target: parseFloat(target),
    source: source || "BANK",
  }).returning();

  return Response.json({ goal }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof updates.current === "number") allowed.current = updates.current;
  if (typeof updates.active === "boolean") allowed.active = updates.active;
  if (typeof updates.name === "string") allowed.name = updates.name;
  if (typeof updates.target === "number") allowed.target = updates.target;

  const [goal] = await db.update(savingGoals).set({ ...allowed, updatedAt: new Date() })
    .where(and(eq(savingGoals.id, id), eq(savingGoals.userId, session.userId)))
    .returning();

  return Response.json({ goal });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await db.delete(savingGoals).where(and(eq(savingGoals.id, id), eq(savingGoals.userId, session.userId)));
  return Response.json({ ok: true });
}
