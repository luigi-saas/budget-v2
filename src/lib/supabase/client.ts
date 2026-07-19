import { createBrowserClient } from "@supabase/ssr";

// Use a placeholder that passes the library's validation when env vars are
// not configured.  The client will simply fail silently on actual API calls.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-key";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  return createBrowserClient(url, key);
}
