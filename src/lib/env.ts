/**
 * @file env.ts
 * @description Reads and validates required environment variables for Supabase and Prisma.
 * @dependencies process.env
 */

/**
 * getSupabaseEnv
 *
 * Returns public Supabase URL and anon/publishable key for browser and SSR clients.
 * Prefers NEXT_PUBLIC_SUPABASE_ANON_KEY; falls back to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 *
 * @returns Object with url and anonKey.
 * @throws When URL or key env vars are missing.
 * @calledBy supabase/client, supabase/server, supabase/proxy, supabase/admin
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    );
  }

  return { url, anonKey };
}

/**
 * getDatabaseUrl
 *
 * Returns the Prisma/Postgres connection string.
 *
 * @returns DATABASE_URL value.
 * @throws When DATABASE_URL is unset.
 * @calledBy db.ts createPrismaClient
 */
export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  return url;
}

/**
 * getSupabaseServiceRoleKey
 *
 * Returns the optional service-role key for privileged storage/admin work.
 *
 * @returns Service role key or null when not configured.
 * @calledBy supabase/admin createAdminClient
 */
export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
