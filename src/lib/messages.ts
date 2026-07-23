import { Prisma, type ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

const profileCardSelect = {
  id: true,
  fullName: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

const listingThreadSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  sellerId: true,
  reviewerId: true,
  deletedAt: true,
} satisfies Prisma.ListingSelect;

export type MessageProfileCard = Prisma.ProfileGetPayload<{
  select: typeof profileCardSelect;
}>;

export type ThreadListing = Prisma.ListingGetPayload<{
  select: typeof listingThreadSelect;
}>;

export type ConversationSummary = {
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  listingStatus: ListingStatus;
  otherUser: MessageProfileCard;
  lastMessage: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
};

export type ThreadMessage = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  isRead: boolean;
};

/** True if either user has blocked the other (blocks messaging both ways). */
export async function areMessagingBlocked(userA: string, userB: string) {
  if (userA === userB) return false;
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(block);
}

export async function isUserBlockedBy(blockerId: string, blockedId: string) {
  const block = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
    select: { id: true },
  });
  return Boolean(block);
}

/** True if these two users already exchanged ≥1 message on this listing. */
export async function hasExistingThread(
  listingId: string,
  userA: string,
  userB: string,
) {
  const existing = await prisma.message.findFirst({
    where: {
      listingId,
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(existing);
}

/**
 * Pure send-access rules (no DB). Pass `hasExistingThread` when the sender
 * is the listing seller on a PUBLISHED listing (cold outreach blocked).
 */
export function evaluateListingMessageSendAccess(input: {
  listing: ThreadListing;
  userId: string;
  otherUserId: string;
  hasExistingThread: boolean;
}): { ok: true } | { ok: false; error: string } {
  const { listing, userId, otherUserId, hasExistingThread } = input;

  if (userId === otherUserId) {
    return { ok: false, error: "No puedes enviarte mensajes a ti mismo." };
  }
  if (listing.deletedAt) {
    return { ok: false, error: "Este anuncio ya no está disponible." };
  }

  const pair = new Set([userId, otherUserId]);

  if (listing.status === "PUBLISHED") {
    if (!pair.has(listing.sellerId)) {
      return {
        ok: false,
        error: "Solo puedes chatear con el vendedor de este anuncio.",
      };
    }
    // Sellers cannot open cold threads via ?con=<anyProfileId>.
    if (userId === listing.sellerId && !hasExistingThread) {
      return {
        ok: false,
        error: "Solo puedes responder a compradores que te escribieron.",
      };
    }
    return { ok: true };
  }

  if (listing.status === "PENDING_REVIEW" || listing.status === "REJECTED") {
    if (!listing.reviewerId) {
      return {
        ok: false,
        error: "Aún no hay un revisor asignado para este anuncio.",
      };
    }
    const allowed = new Set([listing.sellerId, listing.reviewerId]);
    if (!allowed.has(userId) || !allowed.has(otherUserId)) {
      return {
        ok: false,
        error: "Este chat es solo entre el vendedor y el revisor asignado.",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    error: "Este anuncio ya no acepta mensajes.",
  };
}

/**
 * Who may send new messages in a listing thread.
 * - PUBLISHED: buyer may start/continue with seller; seller may only reply
 *   to buyers who already messaged on this listing
 * - PENDING_REVIEW / REJECTED: seller ↔ assigned reviewer
 */
export async function canSendInListingThread(
  listing: ThreadListing,
  userId: string,
  otherUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let existing = false;
  if (
    listing.status === "PUBLISHED" &&
    userId === listing.sellerId &&
    userId !== otherUserId
  ) {
    existing = await hasExistingThread(listing.id, userId, otherUserId);
  }

  return evaluateListingMessageSendAccess({
    listing,
    userId,
    otherUserId,
    hasExistingThread: existing,
  });
}

/** @deprecated Prefer canSendInListingThread */
export async function canParticipateInListingThread(
  listing: ThreadListing,
  userId: string,
  otherUserId: string,
) {
  return canSendInListingThread(listing, userId, otherUserId);
}

/**
 * Who may open / read a thread. Allows send participants, or anyone with
 * existing history (e.g. after the listing is SOLD / RESERVED / ARCHIVED).
 */
export async function canViewListingThread(
  listing: ThreadListing,
  userId: string,
  otherUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (userId === otherUserId) {
    return { ok: false, error: "No puedes enviarte mensajes a ti mismo." };
  }

  const send = await canSendInListingThread(listing, userId, otherUserId);
  if (send.ok) return { ok: true };

  if (await hasExistingThread(listing.id, userId, otherUserId)) {
    return { ok: true };
  }

  return { ok: false, error: send.error };
}

export async function getListingForThread(listingId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId },
    select: listingThreadSelect,
  });
}

/** Resolve the other party when opening /mensajes/[listingId]. */
export function resolveThreadCounterpart(
  listing: ThreadListing,
  currentUserId: string,
  otherUserId?: string | null,
): { ok: true; otherUserId: string } | { ok: false; error: string } {
  if (listing.status === "PENDING_REVIEW" || listing.status === "REJECTED") {
    if (!listing.reviewerId) {
      return {
        ok: false,
        error: "Aún no hay un revisor asignado para este anuncio.",
      };
    }
    if (currentUserId === listing.sellerId) {
      return { ok: true, otherUserId: listing.reviewerId };
    }
    if (currentUserId === listing.reviewerId) {
      return { ok: true, otherUserId: listing.sellerId };
    }
    return {
      ok: false,
      error: "No tienes acceso a este chat de revisión.",
    };
  }

  // PUBLISHED and post-sale statuses (SOLD / RESERVED / ARCHIVED / …):
  // buyer↔seller; seller needs ?con= when multiple buyers.
  if (currentUserId === listing.sellerId) {
    if (!otherUserId) {
      return {
        ok: false,
        error: "Selecciona una conversación con un comprador.",
      };
    }
    if (otherUserId === listing.sellerId) {
      return { ok: false, error: "Conversación inválida." };
    }
    return { ok: true, otherUserId };
  }

  if (listing.reviewerId && currentUserId === listing.reviewerId) {
    return { ok: true, otherUserId: listing.sellerId };
  }

  return { ok: true, otherUserId: listing.sellerId };
}

export async function listConversationsForUser(
  profileId: string,
): Promise<ConversationSummary[]> {
  type LatestRow = {
    id: string;
    listingId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    otherUserId: string;
    listingTitle: string;
    listingSlug: string;
    listingStatus: ListingStatus;
  };

  type UnreadRow = {
    listingId: string;
    otherUserId: string;
    unreadCount: number;
  };

  const [latestRows, unreadRows] = await Promise.all([
    prisma.$queryRaw<LatestRow[]>(Prisma.sql`
      SELECT DISTINCT ON (m."listingId", o."otherUserId")
        m.id,
        m."listingId",
        m."senderId",
        m."receiverId",
        m.content,
        m."isRead",
        m."createdAt",
        o."otherUserId",
        l.title AS "listingTitle",
        l.slug AS "listingSlug",
        l.status AS "listingStatus"
      FROM messages m
      INNER JOIN listings l ON l.id = m."listingId"
      CROSS JOIN LATERAL (
        SELECT CASE
          WHEN m."senderId" = ${profileId} THEN m."receiverId"
          ELSE m."senderId"
        END AS "otherUserId"
      ) o
      WHERE m."senderId" = ${profileId} OR m."receiverId" = ${profileId}
      ORDER BY m."listingId", o."otherUserId", m."createdAt" DESC
    `),
    prisma.$queryRaw<UnreadRow[]>(Prisma.sql`
      SELECT
        m."listingId" AS "listingId",
        m."senderId" AS "otherUserId",
        COUNT(*)::int AS "unreadCount"
      FROM messages m
      WHERE m."receiverId" = ${profileId} AND m."isRead" = false
      GROUP BY m."listingId", m."senderId"
    `),
  ]);

  if (latestRows.length === 0) return [];

  const unreadByKey = new Map(
    unreadRows.map((row) => [
      `${row.listingId}:${row.otherUserId}`,
      row.unreadCount,
    ]),
  );

  const otherIds = [...new Set(latestRows.map((row) => row.otherUserId))];
  const profiles = await prisma.profile.findMany({
    where: { id: { in: otherIds } },
    select: profileCardSelect,
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return latestRows
    .map((row) => {
      const otherUser = profileById.get(row.otherUserId);
      if (!otherUser) return null;
      return {
        listingId: row.listingId,
        listingTitle: row.listingTitle,
        listingSlug: row.listingSlug,
        listingStatus: row.listingStatus,
        otherUser,
        lastMessage: {
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          senderId: row.senderId,
          isRead: row.isRead,
        },
        unreadCount:
          unreadByKey.get(`${row.listingId}:${row.otherUserId}`) ?? 0,
      } satisfies ConversationSummary;
    })
    .filter((row): row is ConversationSummary => Boolean(row))
    .sort(
      (a, b) =>
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    );
}

export async function getThreadMessages(
  listingId: string,
  userId: string,
  otherUserId: string,
): Promise<ThreadMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      listingId,
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      receiverId: true,
      isRead: true,
    },
  });
  return messages;
}

export async function countUnreadForUser(profileId: string) {
  return prisma.message.count({
    where: {
      receiverId: profileId,
      isRead: false,
    },
  });
}

export async function markThreadRead(
  listingId: string,
  readerId: string,
  otherUserId: string,
) {
  await prisma.message.updateMany({
    where: {
      listingId,
      senderId: otherUserId,
      receiverId: readerId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function createMessage(input: {
  listingId: string;
  senderId: string;
  receiverId: string;
  content: string;
}) {
  return prisma.message.create({
    data: {
      listingId: input.listingId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      content: input.content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      receiverId: true,
      isRead: true,
    },
  });
}

export async function getProfileCard(profileId: string) {
  return prisma.profile.findUnique({
    where: { id: profileId },
    select: profileCardSelect,
  });
}

export function publicThreadPath(listingId: string, otherUserId?: string) {
  const base = `/mensajes/${listingId}`;
  if (!otherUserId) return base;
  return `${base}?con=${encodeURIComponent(otherUserId)}`;
}

export function marketplaceSellerDisplayName(profile: {
  fullName: string | null;
  username: string | null;
}) {
  if (profile.fullName) return profile.fullName;
  if (profile.username) return `@${profile.username}`;
  return "Usuario";
}
