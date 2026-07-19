import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || email.split("@")[0],
    }).returning();

    const token = signToken({ userId: user.id, email: user.email });

    return Response.json(
      { user: { id: user.id, email: user.email, displayName: user.displayName, onboardingComplete: user.onboardingComplete } },
      {
        status: 201,
        headers: {
          "Set-Cookie": `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
        },
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
