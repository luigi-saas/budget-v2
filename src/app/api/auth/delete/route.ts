import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Delete profile data (cascades to budgets, expenses, goals)
  await db.delete(users).where(eq(users.id, user.id));

  // Sign the user out of Supabase
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
