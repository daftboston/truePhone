/**
 * @file resolve-email.ts
 * @description Resolves a Profile's auth email via Supabase Admin API.
 * @dependencies @/lib/db, @/lib/supabase/admin
 */

import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * resolveProfileEmail
 *
 * Looks up the Supabase Auth email for a Profile via service-role admin client.
 * Returns null when the profile/auth user is missing or admin client is unset.
 *
 * @param profileId - Profile UUID.
 * @returns Email string or null.
 * @calledBy createNotification (email channel)
 */
export async function resolveProfileEmail(
  profileId: string,
): Promise<string | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { authUserId: true },
  });
  if (!profile?.authUserId) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.getUserById(
    profile.authUserId,
  );
  if (error || !data.user?.email) return null;
  return data.user.email;
}
