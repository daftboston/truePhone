/**
 * @file identity.ts
 * @description Identity verification draft/queue helpers for sellers.
 * @dependencies @/lib/db (prisma)
 */

import { prisma } from "@/lib/db";

/**
 * getLatestIdentityVerification
 *
 * Returns the most recent IdentityVerification row for a profile.
 *
 * @param profileId - Profile UUID.
 * @returns Latest verification or null.
 * @calledBy getOrCreateDraftVerification, verification UI
 */
export async function getLatestIdentityVerification(profileId: string) {
  return prisma.identityVerification.findFirst({
    where: { profileId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * getOrCreateDraftVerification
 *
 * Returns an editable DRAFT (or creates one after REJECTED / when none exists).
 * Leaves PENDING, IN_REVIEW, or VERIFIED rows unchanged.
 *
 * @param profileId - Profile UUID.
 * @returns IdentityVerification suitable for editing or viewing current status.
 * @calledBy Verification flow pages and actions
 */
export async function getOrCreateDraftVerification(profileId: string) {
  const latest = await getLatestIdentityVerification(profileId);

  if (latest && (latest.status === "DRAFT" || latest.status === "REJECTED")) {
    if (latest.status === "REJECTED") {
      return prisma.identityVerification.create({
        data: {
          profileId,
          status: "DRAFT",
          provider: "manual",
        },
      });
    }
    return latest;
  }

  if (
    latest &&
    (latest.status === "PENDING" ||
      latest.status === "IN_REVIEW" ||
      latest.status === "VERIFIED")
  ) {
    return latest;
  }

  return prisma.identityVerification.create({
    data: {
      profileId,
      status: "DRAFT",
      provider: "manual",
    },
  });
}

/**
 * listPendingIdentityVerifications
 *
 * Lists PENDING and IN_REVIEW verifications oldest-first for the reviewer queue.
 *
 * @returns Verifications with profile summary fields.
 * @calledBy Reviewer identity queue page
 */
export async function listPendingIdentityVerifications() {
  return prisma.identityVerification.findMany({
    where: {
      status: { in: ["PENDING", "IN_REVIEW"] },
    },
    include: {
      profile: {
        select: {
          id: true,
          fullName: true,
          username: true,
          city: true,
          verifikStatus: true,
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
}

/**
 * countPendingIdentityVerifications
 *
 * Counts PENDING and IN_REVIEW identity verifications.
 *
 * @returns Pending queue size.
 * @calledBy Reviewer dashboard badges
 */
export async function countPendingIdentityVerifications() {
  return prisma.identityVerification.count({
    where: {
      status: { in: ["PENDING", "IN_REVIEW"] },
    },
  });
}
