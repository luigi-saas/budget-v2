import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Try to find existing profile
  const [profile] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      plan: users.plan,
      currency: users.currency,
      locale: users.locale,
      onboardingComplete: users.onboardingComplete,
      darkMode: users.darkMode,
      notifications: users.notifications,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (profile) {
    return NextResponse.json({ user: profile });
  }

  // Lazy-create profile for new Supabase users
  const displayName =
    authUser.user_metadata?.display_name ??
    authUser.user_metadata?.full_name ??
    authUser.email?.split("@")[0] ??
    "User";

  const [newProfile] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email!,
      displayName,
    })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      plan: users.plan,
      currency: users.currency,
      locale: users.locale,
      onboardingComplete: users.onboardingComplete,
      darkMode: users.darkMode,
      notifications: users.notifications,
      createdAt: users.createdAt,
    });

  return NextResponse.json({ user: newProfile });
}
