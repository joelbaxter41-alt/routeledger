import "server-only";

/** Server-side only: accept current Supabase secret keys and legacy projects. */
export function supabaseServerKey() {
  return (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
