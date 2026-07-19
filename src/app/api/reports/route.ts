import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const months = await db.select().from(monthBudgets).where(eq(monthBudgets.userId, session.userId));
  const varExps = await db.select().from(variableExpenses).where(eq(variableExpenses.userId, session.userId));
  const fixExps = await db.select().from(fixedExpenses).where(eq(fixedExpenses.userId, session.userId));

  const overallCategories: Record<string, number> = {};

  const monthlySummaries = months
    .sort((a, b) => a.monthId.localeCompare(b.monthId))
    .map(m => {
      const mv = varExps.filter(e => e.monthBudgetId === m.id);
      const mf = fixExps.filter(e => e.monthBudgetId === m.id);
      const totalVariable = mv.reduce((s, e) => s + e.amount, 0);
      const totalFixed = mf.reduce((s, e) => s + e.amount, 0);
      const totalSpent = totalVariable + totalFixed;
      const remaining = m.totalBudget - totalSpent;

      // Accumulate overall categories
      for (const e of mv) {
        overallCategories[e.type] = (overallCategories[e.type] ?? 0) + e.amount;
      }
      for (const e of mf) {
        overallCategories[e.type] = (overallCategories[e.type] ?? 0) + e.amount;
      }

      return {
        monthId: m.monthId,
        label: m.label,
        budget: m.totalBudget,
        totalVariable,
        totalFixed,
        totalSpent,
        remaining,
      };
    });

  return Response.json({ monthlySummaries, overallCategories });
}
