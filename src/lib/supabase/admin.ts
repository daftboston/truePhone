import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * Service-role client for privileged server work (signed URLs for reviewers).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
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
 * Paths are stored as `bucket/object/path`. Returns a short-lived signed URL
 * when the admin client is available.
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
