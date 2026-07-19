import { NextRequest } from "next/server";
import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthId = searchParams.get("monthId");
  if (!monthId) return Response.json({ error: "monthId required" }, { status: 400 });

  const [budget] = await db.select().from(monthBudgets)
    .where(and(eq(monthBudgets.userId, session.userId), eq(monthBudgets.monthId, monthId)))
    .limit(1);

  if (!budget) return Response.json({ month: null });

  const varExp = await db.select().from(variableExpenses)
    .where(eq(variableExpenses.monthBudgetId, budget.id));

  const fixExp = await db.select().from(fixedExpenses)
    .where(eq(fixedExpenses.monthBudgetId, budget.id));

  return Response.json({
    month: {
      ...budget,
      variableExpenses: varExp,
      fixedExpenses: fixExp,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { monthId, label, totalBudget, homePart, walletPart, bankPart,
    variableCategoryBases, fixedCategoryBases, activeVariableCategories,
    activeFixedCategories, categoryColors, categoryIcons } = body;

  // Upsert
  const existing = await db.select().from(monthBudgets)
    .where(and(eq(monthBudgets.userId, session.userId), eq(monthBudgets.monthId, monthId)))
    .limit(1);

  let budget;
  if (existing.length > 0) {
    const [updated] = await db.update(monthBudgets).set({
      label, totalBudget, homePart, walletPart, bankPart,
      variableCategoryBases: variableCategoryBases ?? {},
      fixedCategoryBases: fixedCategoryBases ?? {},
      activeVariableCategories: activeVariableCategories ?? [],
      activeFixedCategories: activeFixedCategories ?? [],
      categoryColors: categoryColors ?? {},
      categoryIcons: categoryIcons ?? {},
      updatedAt: new Date(),
    }).where(eq(monthBudgets.id, existing[0].id)).returning();
    budget = updated;
  } else {
    const [created] = await db.insert(monthBudgets).values({
      userId: session.userId,
      monthId,
      label: label || monthId,
      totalBudget: totalBudget ?? 0,
      homePart: homePart ?? 0,
      walletPart: walletPart ?? 0,
      bankPart: bankPart ?? 0,
      variableCategoryBases: variableCategoryBases ?? {},
      fixedCategoryBases: fixedCategoryBases ?? {},
      activeVariableCategories: activeVariableCategories ?? [],
      activeFixedCategories: activeFixedCategories ?? [],
      categoryColors: categoryColors ?? {},
      categoryIcons: categoryIcons ?? {},
    }).returning();
    budget = created;
  }

  return Response.json({ budget });
}
