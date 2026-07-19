import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const monthId = req.nextUrl.searchParams.get("monthId");

  if (monthId) {
    const [month] = await db.select().from(monthBudgets)
      .where(and(eq(monthBudgets.userId, session.userId), eq(monthBudgets.monthId, monthId)))
      .limit(1);
    if (!month) return NextResponse.json({ month: null });

    const varExp = await db.select().from(variableExpenses)
      .where(eq(variableExpenses.monthBudgetId, month.id));
    const fixExp = await db.select().from(fixedExpenses)
      .where(eq(fixedExpenses.monthBudgetId, month.id));

    return NextResponse.json({ month: { ...month, variableExpenses: varExp, fixedExpenses: fixExp } });
  }

  const months = await db.select().from(monthBudgets)
    .where(eq(monthBudgets.userId, session.userId))
    .orderBy(desc(monthBudgets.monthId))
    .limit(24);

  return NextResponse.json({ months });
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { monthId, label, totalBudget, homePart, walletPart, bankPart,
    variableCategoryBases, fixedCategoryBases,
    activeVariableCategories, activeFixedCategories,
    categoryColors, categoryIcons } = body;

  const existing = await db.select().from(monthBudgets)
    .where(and(eq(monthBudgets.userId, session.userId), eq(monthBudgets.monthId, monthId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(monthBudgets)
      .set({
        totalBudget, homePart, walletPart, bankPart,
        variableCategoryBases, fixedCategoryBases,
        activeVariableCategories, activeFixedCategories,
        categoryColors: categoryColors ?? {}, categoryIcons: categoryIcons ?? {},
        updatedAt: new Date(),
      })
      .where(eq(monthBudgets.id, existing[0].id));
    return NextResponse.json({ month: { ...existing[0], totalBudget, homePart, walletPart, bankPart } });
  }

  const [month] = await db.insert(monthBudgets).values({
    userId: session.userId,
    monthId, label: label || monthId,
    totalBudget: totalBudget ?? 0,
    homePart: homePart ?? 0, walletPart: walletPart ?? 0, bankPart: bankPart ?? 0,
    variableCategoryBases: variableCategoryBases ?? {},
    fixedCategoryBases: fixedCategoryBases ?? {},
    activeVariableCategories: activeVariableCategories ?? [],
    activeFixedCategories: activeFixedCategories ?? [],
    categoryColors: categoryColors ?? {},
    categoryIcons: categoryIcons ?? {},
  }).returning();

  return NextResponse.json({ month });
}
