/**
 * Admin Supabase client — SERVER SIDE ONLY.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 * Never import this in client components, API routes, or middleware.
 * Only use in server-only scripts, migrations, or admin endpoints.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
        "This client is for server-side admin use only.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
