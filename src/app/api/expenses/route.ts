import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { variableExpenses, fixedExpenses, monthBudgets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { kind, monthBudgetId, name, amount, type, date, base, person } = body;

  // Verify ownership
  const [mb] = await db.select().from(monthBudgets)
    .where(and(eq(monthBudgets.id, monthBudgetId), eq(monthBudgets.userId, session.userId)))
    .limit(1);
  if (!mb) return NextResponse.json({ error: "Month budget not found" }, { status: 404 });

  if (kind === "fixed") {
    const [exp] = await db.insert(fixedExpenses).values({
      userId: session.userId, monthBudgetId, name, amount, type, base: base ?? 0, date,
    }).returning();
    return NextResponse.json({ expense: exp });
  }

  const [exp] = await db.insert(variableExpenses).values({
    userId: session.userId, monthBudgetId, name, amount, type, date: date ?? new Date().toISOString().slice(0, 10), person,
  }).returning();
  return NextResponse.json({ expense: exp });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const kind = req.nextUrl.searchParams.get("kind");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (kind === "fixed") {
    await db.delete(fixedExpenses).where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, session.userId)));
  } else {
    await db.delete(variableExpenses).where(and(eq(variableExpenses.id, id), eq(variableExpenses.userId, session.userId)));
  }

  return NextResponse.json({ ok: true });
}
