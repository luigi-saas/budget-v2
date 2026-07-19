import { NextRequest } from "next/server";
import { db } from "@/db";
import { variableExpenses, fixedExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { kind, monthBudgetId, name, amount, type, date, person, base } = body;

  if (kind === "variable") {
    const [exp] = await db.insert(variableExpenses).values({
      userId: session.userId,
      monthBudgetId,
      name,
      amount: parseFloat(amount),
      type,
      date: date || new Date().toISOString().slice(0, 10),
      person,
    }).returning();
    return Response.json({ expense: exp }, { status: 201 });
  } else if (kind === "fixed") {
    const [exp] = await db.insert(fixedExpenses).values({
      userId: session.userId,
      monthBudgetId,
      name,
      amount: parseFloat(amount),
      type,
      base: parseFloat(base ?? "0"),
      date: date || new Date().toISOString().slice(0, 10),
    }).returning();
    return Response.json({ expense: exp }, { status: 201 });
  }

  return Response.json({ error: "Invalid kind" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind");
  if (!id || !kind) return Response.json({ error: "id and kind required" }, { status: 400 });

  if (kind === "variable") {
    await db.delete(variableExpenses).where(eq(variableExpenses.id, id));
  } else if (kind === "fixed") {
    await db.delete(fixedExpenses).where(eq(fixedExpenses.id, id));
  }

  return Response.json({ ok: true });
}
