import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Minimum visible reviews + average to earn Vendedor de confianza. */
export const TRUSTED_SELLER_MIN_REVIEWS = 3;
export const TRUSTED_SELLER_MIN_RATING = 4.5;

const reviewAuthorSelect = {
  id: true,
  fullName: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

const reviewListInclude = {
  reviewer: { select: reviewAuthorSelect },
  reviewedUser: { select: reviewAuthorSelect },
  order: {
    select: {
      id: true,
      completedAt: true,
      listing: { select: { title: true, slug: true } },
    },
  },
} satisfies Prisma.ReviewInclude;

export type MarketplaceReview = Prisma.ReviewGetPayload<{
  include: typeof reviewListInclude;
}>;

export function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function shouldBeTrustedSeller(input: {
  totalReviews: number;
  sellerRating: number;
}): boolean {
  return (
    input.totalReviews >= TRUSTED_SELLER_MIN_REVIEWS &&
    input.sellerRating >= TRUSTED_SELLER_MIN_RATING
  );
}

export function otherPartyId(
  order: {
    buyerId: string;
    sellerId: string;
  },
  actorId: string,
): string | null {
  if (actorId === order.buyerId) return order.sellerId;
  if (actorId === order.sellerId) return order.buyerId;
  return null;
}

export type CreateReviewResult =
  | { ok: true; reviewId: string; reviewedUserId: string }
  | { ok: false; error: string };

/**
 * Create an order-tied review after COMPLETED, then refresh reputation.
 */
export async function createOrderReview(input: {
  orderId: string;
  reviewerId: string;
  rating: number;
  comment?: string | null;
}): Promise<CreateReviewResult> {
  const { orderId, reviewerId, rating, comment } = input;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          buyerId: true,
          sellerId: true,
        },
      });

      if (!order) {
        throw new ReviewError("Pedido no encontrado.");
      }
      if (order.status !== "COMPLETED") {
        throw new ReviewError(
          "Solo puedes calificar después de completar la venta.",
        );
      }

      const reviewedUserId = otherPartyId(order, reviewerId);
      if (!reviewedUserId) {
        throw new ReviewError("No tienes acceso a este pedido.");
      }

      const existing = await tx.review.findUnique({
        where: {
          orderId_reviewerId: { orderId, reviewerId },
        },
        select: { id: true },
      });
      if (existing) {
        throw new ReviewError("Ya dejaste una reseña para este pedido.");
      }

      const review = await tx.review.create({
        data: {
          orderId,
          reviewerId,
          reviewedUserId,
          rating,
          comment: comment?.trim() || null,
        },
        select: { id: true },
      });

      await refreshUserReputation(tx, reviewedUserId);

      return { reviewId: review.id, reviewedUserId };
    });

    return {
      ok: true,
      reviewId: created.reviewId,
      reviewedUserId: created.reviewedUserId,
    };
  } catch (error) {
    if (error instanceof ReviewError) {
      return { ok: false, error: error.message };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Ya dejaste una reseña para este pedido." };
    }
    throw error;
  }
}

export async function reportReview(input: {
  reviewId: string;
  reporterId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const review = await prisma.review.findFirst({
    where: { id: input.reviewId, hiddenAt: null },
    select: {
      id: true,
      reviewerId: true,
      reviewedUserId: true,
      order: { select: { buyerId: true, sellerId: true } },
    },
  });

  if (!review) {
    return { ok: false, error: "Reseña no encontrada." };
  }

  if (review.reviewerId === input.reporterId) {
    return { ok: false, error: "No puedes reportar tu propia reseña." };
  }

  const isParticipant =
    review.order.buyerId === input.reporterId ||
    review.order.sellerId === input.reporterId ||
    review.reviewedUserId === input.reporterId;

  if (!isParticipant) {
    return {
      ok: false,
      error: "Solo puedes reportar reseñas de pedidos en los que participaste.",
    };
  }

  const already = await prisma.reviewReport.findFirst({
    where: {
      reviewId: input.reviewId,
      reporterId: input.reporterId,
      resolvedAt: null,
    },
    select: { id: true },
  });
  if (already) {
    return { ok: false, error: "Ya reportaste esta reseña." };
  }

  await prisma.reviewReport.create({
    data: {
      reviewId: input.reviewId,
      reporterId: input.reporterId,
      reason: input.reason.trim(),
    },
  });

  return { ok: true };
}

export async function hideReviewForModeration(input: {
  reviewId: string;
  moderatorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.findFirst({
        where: { id: input.reviewId },
        select: { id: true, reviewedUserId: true, hiddenAt: true },
      });
      if (!review) {
        throw new ReviewError("Reseña no encontrada.");
      }
      if (review.hiddenAt) {
        throw new ReviewError("Esta reseña ya está oculta.");
      }

      const now = new Date();
      await tx.review.update({
        where: { id: review.id },
        data: {
          hiddenAt: now,
          hiddenById: input.moderatorId,
        },
      });

      await tx.reviewReport.updateMany({
        where: { reviewId: review.id, resolvedAt: null },
        data: {
          resolvedAt: now,
          resolvedById: input.moderatorId,
        },
      });

      await refreshUserReputation(tx, review.reviewedUserId);
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof ReviewError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export async function dismissReviewReports(input: {
  reviewId: string;
  moderatorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const review = await prisma.review.findFirst({
    where: { id: input.reviewId },
    select: { id: true },
  });
  if (!review) {
    return { ok: false, error: "Reseña no encontrada." };
  }

  await prisma.reviewReport.updateMany({
    where: { reviewId: input.reviewId, resolvedAt: null },
    data: {
      resolvedAt: new Date(),
      resolvedById: input.moderatorId,
    },
  });

  return { ok: true };
}

async function refreshUserReputation(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const visible = await tx.review.findMany({
    where: { reviewedUserId: userId, hiddenAt: null },
    select: { rating: true },
  });

  const totalReviews = visible.length;
  const sellerRating = computeAverageRating(visible.map((row) => row.rating));
  const trusted = shouldBeTrustedSeller({ totalReviews, sellerRating });

  const current = await tx.profile.findFirst({
    where: { id: userId },
    select: { isTrustedSeller: true, trustedSellerSince: true },
  });

  await tx.profile.update({
    where: { id: userId },
    data: {
      totalReviews,
      sellerRating,
      isTrustedSeller: trusted,
      trustedSellerSince: trusted
        ? (current?.trustedSellerSince ?? new Date())
        : null,
    },
  });
}

export async function listVisibleReviewsForUser(userId: string, take = 20) {
  return prisma.review.findMany({
    where: { reviewedUserId: userId, hiddenAt: null },
    include: reviewListInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listReviewsForOrder(orderId: string) {
  return prisma.review.findMany({
    where: { orderId, hiddenAt: null },
    include: {
      reviewer: { select: reviewAuthorSelect },
      reviewedUser: { select: reviewAuthorSelect },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function countOpenReviewReports() {
  return prisma.reviewReport.count({
    where: { resolvedAt: null },
  });
}

export async function listOpenReviewReports(take = 50) {
  return prisma.reviewReport.findMany({
    where: { resolvedAt: null },
    include: {
      reporter: { select: reviewAuthorSelect },
      review: {
        include: {
          reviewer: { select: reviewAuthorSelect },
          reviewedUser: { select: reviewAuthorSelect },
          order: {
            select: {
              id: true,
              listing: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
}

export function reviewAuthorName(party: {
  fullName: string | null;
  username: string | null;
}) {
  return party.fullName?.trim() || party.username || "Usuario TruePhone";
}

class ReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewError";
  }
}
