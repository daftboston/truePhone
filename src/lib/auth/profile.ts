/**
 * @file profile.ts
 * @description Links Supabase Auth users to Prisma Profile rows.
 * @dependencies @/lib/db (prisma)
 */

import { prisma } from "@/lib/db";

type EnsureProfileInput = {
  authUserId: string;
  fullName?: string | null;
};

/**
 * ensureProfile
 *
 * Returns an existing Profile or creates one with role BUYER.
 * Backfills fullName when the profile has none and a name is provided.
 *
 * @param input.authUserId - Supabase auth user UUID.
 * @param input.fullName - Optional name; backfills when profile has no fullName.
 * @returns Profile row from Prisma.
 * @calledBy registerAction, loginAction, auth/callback/route, getCurrentProfile
 * @consumers profile actions, session helpers, listing ownership checks
 */
export async function ensureProfile({
  authUserId,
  fullName,
}: EnsureProfileInput) {
  const existing = await prisma.profile.findUnique({
    where: { authUserId },
  });

  if (existing) {
    if (fullName && !existing.fullName) {
      return prisma.profile.update({
        where: { authUserId },
        data: { fullName },
      });
    }
    return existing;
  }

  return prisma.profile.create({
    data: {
      authUserId,
      fullName: fullName ?? null,
      role: "BUYER",
    },
  });
}

/**
 * getProfileByAuthUserId
 *
 * Looks up a Profile by Supabase auth user id.
 *
 * @param authUserId - Supabase auth.users.id UUID.
 * @returns Profile or null.
 * @calledBy getCurrentProfile, server actions needing profile without create
 */
export async function getProfileByAuthUserId(authUserId: string) {
  return prisma.profile.findUnique({
    where: { authUserId },
  });
}
