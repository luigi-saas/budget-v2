import { NextResponse } from "next/server";
import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const months = await db.select().from(monthBudgets)
    .where(eq(monthBudgets.userId, session.userId))
    .orderBy(desc(monthBudgets.monthId))
    .limit(12);

  const allVariable = await db.select().from(variableExpenses)
    .where(eq(variableExpenses.userId, session.userId));

  const allFixed = await db.select().from(fixedExpenses)
    .where(eq(fixedExpenses.userId, session.userId));

  // Build monthly summaries
  const monthlySummaries = months.map(m => {
    const varExps = allVariable.filter(e => e.monthBudgetId === m.id);
    const fixExps = allFixed.filter(e => e.monthBudgetId === m.id);
    const totalVariable = varExps.reduce((s, e) => s + e.amount, 0);
    const totalFixed = fixExps.reduce((s, e) => s + e.amount, 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const e of varExps) {
      categoryBreakdown[e.type] = (categoryBreakdown[e.type] ?? 0) + e.amount;
    }
    for (const e of fixExps) {
      categoryBreakdown[e.type] = (categoryBreakdown[e.type] ?? 0) + e.amount;
    }

    return {
      monthId: m.monthId,
      label: m.label,
      budget: m.totalBudget,
      totalVariable,
      totalFixed,
      totalSpent: totalVariable + totalFixed,
      remaining: m.totalBudget - totalVariable - totalFixed,
      categoryBreakdown,
    };
  }).reverse();

  // Overall category totals
  const overallCategories: Record<string, number> = {};
  for (const e of allVariable) {
    overallCategories[e.type] = (overallCategories[e.type] ?? 0) + e.amount;
  }
  for (const e of allFixed) {
    overallCategories[e.type] = (overallCategories[e.type] ?? 0) + e.amount;
  }

  return NextResponse.json({ monthlySummaries, overallCategories });
}
