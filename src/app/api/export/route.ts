import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses, savingGoals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  const months = await db.select().from(monthBudgets)
    .where(eq(monthBudgets.userId, session.userId))
    .orderBy(desc(monthBudgets.monthId));

  const allVariable = await db.select().from(variableExpenses)
    .where(eq(variableExpenses.userId, session.userId));

  const allFixed = await db.select().from(fixedExpenses)
    .where(eq(fixedExpenses.userId, session.userId));

  const goals = await db.select().from(savingGoals)
    .where(eq(savingGoals.userId, session.userId));

  if (format === "json") {
    return NextResponse.json({ months, variableExpenses: allVariable, fixedExpenses: allFixed, savingGoals: goals });
  }

  // CSV export
  let csv = "Type,Month,Category,Name,Amount,Date\n";
  for (const exp of allVariable) {
    const month = months.find(m => m.id === exp.monthBudgetId);
    csv += `Variable,${month?.monthId ?? ""},${exp.type},"${exp.name}",${exp.amount},${exp.date}\n`;
  }
  for (const exp of allFixed) {
    const month = months.find(m => m.id === exp.monthBudgetId);
    csv += `Fixed,${month?.monthId ?? ""},${exp.type},"${exp.name}",${exp.amount},${exp.date ?? ""}\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="flousy-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
