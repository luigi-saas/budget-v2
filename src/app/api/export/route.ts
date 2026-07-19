import { NextRequest } from "next/server";
import { db } from "@/db";
import { monthBudgets, variableExpenses, fixedExpenses, savingGoals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const months = await db.select().from(monthBudgets).where(eq(monthBudgets.userId, session.userId));
  const varExps = await db.select().from(variableExpenses).where(eq(variableExpenses.userId, session.userId));
  const fixExps = await db.select().from(fixedExpenses).where(eq(fixedExpenses.userId, session.userId));
  const goals = await db.select().from(savingGoals).where(eq(savingGoals.userId, session.userId));

  if (format === "csv") {
    const rows: string[] = ["Type,Month,Name,Category,Amount,Date"];
    for (const e of varExps) {
      const m = months.find(m => m.id === e.monthBudgetId);
      rows.push(`variable,${m?.monthId ?? ""},${JSON.stringify(e.name)},${e.type},${e.amount},${e.date}`);
    }
    for (const e of fixExps) {
      const m = months.find(m => m.id === e.monthBudgetId);
      rows.push(`fixed,${m?.monthId ?? ""},${JSON.stringify(e.name)},${e.type},${e.amount},${e.date ?? ""}`);
    }
    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="flousy-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return Response.json({ months, variableExpenses: varExps, fixedExpenses: fixExps, savingGoals: goals });
}
