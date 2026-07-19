import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, monthBudgets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const {
    monthId, label, totalBudget, homePart, walletPart, bankPart,
    variableCategoryBases, fixedCategoryBases,
    activeVariableCategories, activeFixedCategories,
  } = await req.json();

  // Create the first month budget
  const [budget] = await db.insert(monthBudgets).values({
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
  }).returning();

  // Mark onboarding complete
  await db.update(users).set({ onboardingComplete: true, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return Response.json({ budget, ok: true });
}
