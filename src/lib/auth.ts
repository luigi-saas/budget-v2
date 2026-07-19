// Auth helpers using JWT cookies (no Supabase dependency)
export type SessionPayload = { userId: string; email: string };

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "flousy-dev-secret-key-change-in-production";

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}
