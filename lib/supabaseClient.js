import { createClient } from "@supabase/supabase-js";

// Public client: safe to use in the browser. Can only READ data
// (see supabase/schema.sql row-level-security policies).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client: NEVER import this in a file that runs in the browser.
// Only used inside app/api/* routes, which run on the server.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
