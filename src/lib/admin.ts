import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerKey } from "./server-key";
export function adminDatabase() {
  const key = supabaseServerKey();
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL)
    throw new Error("Server integration credentials are not configured.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function rateLimit(key: string, limit = 10, seconds = 60) {
  const db = adminDatabase();
  const { data, error } = await db.rpc("limit_request", {
    p_key: key,
    p_limit: limit,
    p_seconds: seconds,
  });
  if (error)
    throw new Error("Could not verify request limit. Try again later.");
  if (!data) throw new Error("Too many requests. Please try again later.");
}
