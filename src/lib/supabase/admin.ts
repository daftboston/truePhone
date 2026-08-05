/**
 * @file admin.ts
 * @description Service-role Supabase client and signed storage URL helpers.
 * @dependencies @supabase/supabase-js, @/lib/env
 */

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * createAdminClient
 *
 * Builds a service-role client for privileged server work (signed URLs).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 *
 * @returns Supabase admin client or null.
 * @calledBy createSignedStorageUrl, reviewer identity document access
 */
export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    return null;
  }

  const { url } = getSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * createSignedStorageUrl
 *
 * Parses `bucket/object/path` storage keys and returns a short-lived signed URL.
 *
 * @param storedPath - Stored path as `bucket/object/...`, or nullish.
 * @param expiresInSeconds - URL lifetime; defaults to 15 minutes.
 * @returns Signed URL string, or null when path/admin client is unavailable.
 * @calledBy Reviewer identity queues, private document previews
 */
export async function createSignedStorageUrl(
  storedPath: string | null | undefined,
  expiresInSeconds = 60 * 15,
) {
  if (!storedPath) return null;

  const slash = storedPath.indexOf("/");
  if (slash <= 0) return null;

  const bucket = storedPath.slice(0, slash);
  const objectPath = storedPath.slice(slash + 1);
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
