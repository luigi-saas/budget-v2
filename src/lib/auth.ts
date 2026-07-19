// Re-export Supabase auth helper for backwards compatibility
export { getAuthUser as getSession } from "@/lib/supabase/server";
export type SessionPayload = { userId: string; email: string };
