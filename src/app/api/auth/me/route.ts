import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return Response.json({ user: null }, { status: 401 });

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      currency: user.currency,
      onboardingComplete: user.onboardingComplete,
      darkMode: user.darkMode,
      notifications: user.notifications,
      plan: user.plan,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.currency === "string") allowed.currency = body.currency;
  if (typeof body.displayName === "string") allowed.displayName = body.displayName;
  if (typeof body.darkMode === "boolean") allowed.darkMode = body.darkMode;
  if (typeof body.notifications === "boolean") allowed.notifications = body.notifications;

  const [user] = await db.update(users).set({ ...allowed, updatedAt: new Date() }).where(eq(users.id, session.userId)).returning();
  return Response.json({ user });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(users).where(eq(users.id, session.userId));
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    }
  );
}
