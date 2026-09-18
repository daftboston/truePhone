"use server";

/**
 * @file landing-preference.ts
 * @description Server action to persist signed-in landing preference on Profile.
 * @dependencies prisma, auth session helpers
 */

import type { LandingPreference as PrismaLandingPreference } from "@prisma/client";

import { ensureProfile } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { LandingPreference } from "@/lib/landing-preference";

/**
 * updateLandingPreferenceAction
 *
 * Stores the authenticated user's preferred public landing route.
 *
 * @param preference - HOME or ANUNCIOS.
 */
export async function updateLandingPreferenceAction(
  preference: LandingPreference,
) {
  const user = await getAuthUser();
  if (!user) return;

  const profile = await ensureProfile({ authUserId: user.id });
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      landingPreference: preference as PrismaLandingPreference,
    },
  });
}
