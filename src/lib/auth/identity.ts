/**
 * @file identity.ts
 * @description Identity verification draft/queue helpers for sellers and reviewers.
 * @dependencies @prisma/client, @/lib/db, @/features/verification/schemas/identity
 */

import type { IdentityVerificationStatus, Prisma } from "@prisma/client";

import type { IdentityReviewTab } from "@/features/verification/schemas/identity";
import { prisma } from "@/lib/db";

const ACTIVE_IDENTITY: IdentityVerificationStatus[] = ["PENDING", "IN_REVIEW"];

const identityReviewInclude = {
  profile: {
    select: {
      id: true,
      fullName: true,
      username: true,
      city: true,
      verifikStatus: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
} as const;

/**
 * identityQueueWhere
 *
 * Builds the Prisma filter for one identity-review tab.
 *
 * Unclaimed IN_REVIEW rows (legacy bulk-claim) stay in Pendiente.
 *
 * @param tab - Identity queue tab.
 * @returns Prisma where clause.
 * @calledBy listIdentityVerificationsForReview, countIdentityVerificationsForReview
 */
function identityQueueWhere(
  tab: IdentityReviewTab,
): Prisma.IdentityVerificationWhereInput {
  switch (tab) {
    case "pendiente":
      return { status: { in: ACTIVE_IDENTITY }, reviewerId: null };
    case "en_revision":
      return { status: { in: ACTIVE_IDENTITY }, reviewerId: { not: null } };
    case "aprobados":
      return { status: "VERIFIED" };
    case "rechazados":
      return { status: "REJECTED" };
    default:
      return { status: { in: ACTIVE_IDENTITY }, reviewerId: null };
  }
}

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
 * Returns an editable DRAFT, or the latest non-draft row (PENDING / IN_REVIEW /
 * REJECTED / VERIFIED) so callers can show status instead of wiping history.
 *
 * @param profileId - Profile UUID.
 * @returns IdentityVerification suitable for editing or viewing current status.
 * @calledBy Verification flow pages and actions
 */
export async function getOrCreateDraftVerification(profileId: string) {
  const latest = await getLatestIdentityVerification(profileId);

  if (
    latest &&
    (latest.status === "DRAFT" ||
      latest.status === "REJECTED" ||
      latest.status === "PENDING" ||
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
 * Lists PENDING and IN_REVIEW verifications oldest-first for hub counts.
 *
 * @returns Verifications with profile summary fields.
 * @calledBy Ops analytics fallback; prefer tabbed list helpers for the queue
 */
export async function listPendingIdentityVerifications() {
  return prisma.identityVerification.findMany({
    where: {
      status: { in: ACTIVE_IDENTITY },
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
 * Counts PENDING and IN_REVIEW identity verifications for the ops hub.
 *
 * @returns Open identity-review work size.
 * @calledBy Reviewer dashboard badges
 */
export async function countPendingIdentityVerifications() {
  return prisma.identityVerification.count({
    where: {
      status: { in: ACTIVE_IDENTITY },
    },
  });
}

/**
 * parseIdentityReviewTab
 *
 * Parses a query string into an IdentityReviewTab.
 *
 * @param value - Raw tab query param.
 * @returns Valid tab, defaulting to pendiente.
 * @calledBy Identity review queue page
 */
export function parseIdentityReviewTab(
  value: string | undefined,
): IdentityReviewTab {
  if (
    value === "pendiente" ||
    value === "en_revision" ||
    value === "aprobados" ||
    value === "rechazados"
  ) {
    return value;
  }
  return "pendiente";
}

/**
 * identityQueueTabForVerification
 *
 * Maps a verification row to its queue tab.
 *
 * @param item - Status and assigned reviewer.
 * @returns Queue tab id, or null for drafts.
 * @calledBy identity-review tests
 */
export function identityQueueTabForVerification(item: {
  status: string;
  reviewerId: string | null;
}): IdentityReviewTab | null {
  if (item.status === "PENDING" || item.status === "IN_REVIEW") {
    return item.reviewerId ? "en_revision" : "pendiente";
  }
  if (item.status === "VERIFIED") return "aprobados";
  if (item.status === "REJECTED") return "rechazados";
  return null;
}

/**
 * identityReviewStatusLabel
 *
 * Spanish status label for the identity queue.
 *
 * @param item - Status and reviewer assignment.
 * @returns Localized status string.
 * @calledBy Identity review queue UI
 */
export function identityReviewStatusLabel(item: {
  status: string;
  reviewerId: string | null;
}) {
  if (item.status === "PENDING" || item.status === "IN_REVIEW") {
    return item.reviewerId ? "En revisión" : "Pendiente";
  }
  if (item.status === "VERIFIED") return "Aprobado";
  if (item.status === "REJECTED") return "Rechazado";
  return item.status;
}

/**
 * identityReviewStatusBadgeVariant
 *
 * Picks a Badge variant for an identity queue row.
 *
 * @param item - Status and reviewer assignment.
 * @returns Badge variant.
 * @calledBy IdentityReviewQueuePage
 */
export function identityReviewStatusBadgeVariant(item: {
  status: string;
  reviewerId: string | null;
}) {
  const label = identityReviewStatusLabel(item);
  if (label === "Pendiente") return "warning" as const;
  if (label === "En revisión") return "secondary" as const;
  if (label === "Aprobado") return "success" as const;
  if (label === "Rechazado") return "destructive" as const;
  return "outline" as const;
}

/**
 * canDecideIdentityReview
 *
 * Whether the current reviewer may approve or reject this case.
 * ADMIN may decide a case claimed by someone else.
 *
 * @param input.status - Verification status.
 * @param input.reviewerId - Assigned reviewer, if any.
 * @param input.actorId - Current profile id.
 * @param input.actorRole - Current profile role.
 * @returns True when a decision is allowed.
 * @calledBy Identity detail page and approve/reject actions
 */
export function canDecideIdentityReview(input: {
  status: string;
  reviewerId: string | null;
  actorId: string;
  actorRole: string;
}) {
  if (input.status !== "PENDING" && input.status !== "IN_REVIEW") {
    return false;
  }
  if (
    input.reviewerId &&
    input.reviewerId !== input.actorId &&
    input.actorRole !== "ADMIN"
  ) {
    return false;
  }
  return true;
}

/**
 * listIdentityVerificationsForReview
 *
 * Lists identity cases for one reviewer tab.
 *
 * @param tab - Queue tab.
 * @returns Verification rows with seller and reviewer.
 * @calledBy Identity review queue page
 */
export async function listIdentityVerificationsForReview(
  tab: IdentityReviewTab,
) {
  const history = tab === "aprobados" || tab === "rechazados";
  return prisma.identityVerification.findMany({
    where: identityQueueWhere(tab),
    include: identityReviewInclude,
    orderBy: history ? { reviewedAt: "desc" } : { submittedAt: "asc" },
  });
}

/**
 * countIdentityVerificationsForReview
 *
 * Counts identity cases per queue tab.
 *
 * @returns Counts keyed by tab.
 * @calledBy IdentityReviewTabs
 */
export async function countIdentityVerificationsForReview() {
  const [pendiente, enRevision, aprobados, rechazados] = await Promise.all([
    prisma.identityVerification.count({
      where: identityQueueWhere("pendiente"),
    }),
    prisma.identityVerification.count({
      where: identityQueueWhere("en_revision"),
    }),
    prisma.identityVerification.count({
      where: identityQueueWhere("aprobados"),
    }),
    prisma.identityVerification.count({
      where: identityQueueWhere("rechazados"),
    }),
  ]);
  return { pendiente, enRevision, aprobados, rechazados };
}

/**
 * getIdentityVerificationForReview
 *
 * Loads one identity case for the reviewer detail view.
 *
 * @param verificationId - IdentityVerification id.
 * @returns Verification with seller and reviewer, or null.
 * @calledBy Identity review detail page
 */
export async function getIdentityVerificationForReview(verificationId: string) {
  return prisma.identityVerification.findFirst({
    where: {
      id: verificationId,
      status: { in: ["PENDING", "IN_REVIEW", "VERIFIED", "REJECTED"] },
    },
    include: identityReviewInclude,
  });
}

/**
 * findNextUnclaimedIdentityVerification
 *
 * Finds the oldest unclaimed PENDING/IN_REVIEW case, optionally skipping one id.
 *
 * @param excludeId - Case to skip (the one just decided).
 * @returns Next verification id, or null.
 * @calledBy Identity review detail after approve/reject
 */
export async function findNextUnclaimedIdentityVerification(
  excludeId?: string,
) {
  const next = await prisma.identityVerification.findFirst({
    where: {
      status: { in: ACTIVE_IDENTITY },
      reviewerId: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { submittedAt: "asc" },
    select: { id: true },
  });
  return next?.id ?? null;
}

/**
 * identitySellerDisplayName
 *
 * Resolves a seller display name for identity review UI.
 *
 * @param seller - Profile name fields.
 * @returns Display string.
 * @calledBy Identity queue and detail pages
 */
export function identitySellerDisplayName(seller: {
  fullName: string | null;
  username: string | null;
}) {
  if (seller.fullName) return seller.fullName;
  if (seller.username) return `@${seller.username}`;
  return "Vendedor";
}
