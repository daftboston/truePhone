/**
 * @file service.ts
 * @description Multi-platform availability hold state machine (F3).
 * @dependencies prisma, constants
 */

import type { AvailabilityHoldStatus, Prisma } from "@prisma/client";

import {
  evaluateAvailabilityHoldCheckoutGate,
  HOLD_MISSING_CHECKOUT_ERROR,
  HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR,
} from "@/lib/availability-hold/checkout-gate";
import { ACTIVE_UNLOCK_BLOCK_MESSAGE } from "@/lib/availability-hold/copy";
import {
  AVAILABILITY_HOLD_PENDING_MS,
  AVAILABILITY_HOLD_UNLOCK_MS,
} from "@/lib/availability-hold/constants";
import { prisma } from "@/lib/db";

export class AvailabilityHoldError extends Error {
  readonly holdId: string | null;

  constructor(message: string, holdId: string | null = null) {
    super(message);
    this.name = "AvailabilityHoldError";
    this.holdId = holdId;
  }
}

export { ACTIVE_UNLOCK_BLOCK_MESSAGE };

/**
 * appendHoldEvent
 *
 * Writes an append-only audit row for a hold transition.
 */
async function appendHoldEvent(
  tx: Prisma.TransactionClient,
  input: {
    holdId: string;
    kind:
      | "WARNING_ACK"
      | "CREATED"
      | "CONFIRMED"
      | "DENIED"
      | "EXPIRED"
      | "LATE_CONFIRM"
      | "PAYMENT_ATTEMPT";
    actorId?: string | null;
    paymentAttemptId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.availabilityHoldEvent.create({
    data: {
      holdId: input.holdId,
      kind: input.kind,
      actorId: input.actorId ?? null,
      paymentAttemptId: input.paymentAttemptId ?? null,
      metadata: input.metadata,
    },
  });
}

/**
 * expireStalePendingHoldsInTx
 *
 * Marks overdue PENDING holds EXPIRED (lazy on request or cron sweep).
 */
async function expireStalePendingHoldsInTx(
  tx: Prisma.TransactionClient,
  filter: { listingId?: string; buyerId?: string },
  reason: string,
  now: Date,
) {
  const or: Prisma.AvailabilityHoldWhereInput[] = [];
  if (filter.listingId) or.push({ listingId: filter.listingId });
  if (filter.buyerId) or.push({ buyerId: filter.buyerId });
  if (or.length === 0) return;

  const stale = await tx.availabilityHold.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      OR: or,
    },
    select: { id: true },
  });

  for (const row of stale) {
    const updated = await tx.availabilityHold.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "EXPIRED", expiredAt: now },
    });
    if (updated.count !== 1) continue;
    await appendHoldEvent(tx, {
      holdId: row.id,
      kind: "EXPIRED",
      metadata: { reason },
    });
  }
}

/**
 * expireUnlockStaleHoldInTx
 *
 * Expires CONFIRMED holds whose checkout unlock window ended (no order yet).
 */
async function expireUnlockStaleHoldInTx(
  tx: Prisma.TransactionClient,
  holdId: string,
  reason: string,
  now: Date,
) {
  const updated = await tx.availabilityHold.updateMany({
    where: {
      id: holdId,
      status: "CONFIRMED",
      orderId: null,
      unlockExpiresAt: { lt: now },
    },
    data: { status: "EXPIRED", expiredAt: now },
  });
  if (updated.count !== 1) return;
  await appendHoldEvent(tx, {
    holdId,
    kind: "EXPIRED",
    metadata: { reason, trigger: "unlock_expired" },
  });
}

/**
 * expireStaleUnlockHoldsInTx
 *
 * Batch-expires CONFIRMED holds past unlockExpiresAt for a listing and/or buyer.
 */
async function expireStaleUnlockHoldsInTx(
  tx: Prisma.TransactionClient,
  filter: { listingId?: string; buyerId?: string },
  reason: string,
  now: Date,
) {
  const and: Prisma.AvailabilityHoldWhereInput[] = [
    { status: "CONFIRMED" },
    { orderId: null },
    { unlockExpiresAt: { lt: now } },
  ];
  if (!filter.listingId && !filter.buyerId) return;
  if (filter.listingId) and.push({ listingId: filter.listingId });
  if (filter.buyerId) and.push({ buyerId: filter.buyerId });

  const stale = await tx.availabilityHold.findMany({
    where: { AND: and },
    select: { id: true },
  });

  for (const row of stale) {
    await expireUnlockStaleHoldInTx(tx, row.id, reason, now);
  }
}

/**
 * expireAvailabilityHoldsInTx
 *
 * Authoritative lazy expiry for PENDING (expiresAt) and CONFIRMED (unlockExpiresAt).
 */
export async function expireAvailabilityHoldsInTx(
  tx: Prisma.TransactionClient,
  input: { listingId?: string; buyerId?: string; holdId?: string },
  reason: string,
  now: Date,
) {
  if (input.holdId) {
    await expireHoldIfStaleInTx(tx, input.holdId, reason, now);
    await expireUnlockStaleHoldInTx(tx, input.holdId, reason, now);
  }
  if (input.listingId || input.buyerId) {
    await expireStalePendingHoldsInTx(
      tx,
      { listingId: input.listingId, buyerId: input.buyerId },
      reason,
      now,
    );
    await expireStaleUnlockHoldsInTx(
      tx,
      { listingId: input.listingId, buyerId: input.buyerId },
      reason,
      now,
    );
  }
}

/**
 * lazyExpireAvailabilityHolds
 *
 * Runs expiry outside an existing transaction (read, confirm, buy, checkout paths).
 */
export async function lazyExpireAvailabilityHolds(input: {
  listingId?: string;
  buyerId?: string;
  holdId?: string;
  reason: string;
}) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await expireAvailabilityHoldsInTx(tx, input, input.reason, now);
  });
}

/**
 * recordAlsoListedSellerWarningAck
 *
 * Append-only seller wizard acknowledgement (F3). Uses a terminal audit hold row
 * because AvailabilityHoldEvent requires holdId.
 */
export async function recordAlsoListedSellerWarningAck(input: {
  listingId: string;
  sellerId: string;
}) {
  const existing = await prisma.availabilityHoldEvent.findFirst({
    where: {
      kind: "WARNING_ACK",
      hold: { listingId: input.listingId },
    },
    select: { id: true },
  });
  if (existing) return;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const auditHold = await tx.availabilityHold.create({
      data: {
        listingId: input.listingId,
        buyerId: input.sellerId,
        status: "EXPIRED",
        expiresAt: now,
        expiredAt: now,
      },
    });
    await appendHoldEvent(tx, {
      holdId: auditHold.id,
      kind: "WARNING_ACK",
      actorId: input.sellerId,
    });
  });
}

/**
 * getPendingHoldForListing
 *
 * Returns the active PENDING hold for a listing, if any.
 */
export async function getPendingHoldForListing(listingId: string) {
  await lazyExpireAvailabilityHolds({
    listingId,
    reason: "lazy_read",
  });

  return prisma.availabilityHold.findFirst({
    where: { listingId, status: "PENDING" },
    include: {
      buyer: { select: { id: true, fullName: true, username: true } },
    },
  });
}

/**
 * getBuyerHoldForListing
 *
 * Returns the buyer's most recent non-terminal hold on a listing.
 */
export async function getBuyerHoldForListing(
  listingId: string,
  buyerId: string,
) {
  await lazyExpireAvailabilityHolds({
    listingId,
    buyerId,
    reason: "lazy_read",
  });

  return prisma.availabilityHold.findFirst({
    where: {
      listingId,
      buyerId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * requestAvailabilityHold
 *
 * Creates a PENDING hold when a buyer starts checkout on a flagged listing.
 */
export async function requestAvailabilityHold(input: {
  listingId: string;
  buyerId: string;
}): Promise<{ ok: true; holdId: string } | { ok: false; error: string }> {
  const { listingId, buyerId } = input;

  try {
    const hold = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { id: listingId, deletedAt: null },
        select: {
          id: true,
          sellerId: true,
          status: true,
          alsoListedElsewhere: true,
          slug: true,
        },
      });

      if (!listing) {
        throw new AvailabilityHoldError("Anuncio no encontrado.");
      }
      if (listing.sellerId === buyerId) {
        throw new AvailabilityHoldError("No puedes comprar tu propio anuncio.");
      }
      if (!listing.alsoListedElsewhere) {
        throw new AvailabilityHoldError(
          "Este anuncio no requiere confirmación de disponibilidad.",
        );
      }
      if (listing.status !== "PUBLISHED") {
        throw new AvailabilityHoldError(
          listing.status === "RESERVED"
            ? "Este anuncio ya está reservado."
            : "Este anuncio no está disponible para compra.",
        );
      }

      const activeOrder = await tx.order.findFirst({
        where: {
          listingId,
          status: { in: ["AWAITING_PAYMENT", "PAID"] },
        },
        select: { id: true },
      });
      if (activeOrder) {
        throw new AvailabilityHoldError("Este anuncio ya está reservado.");
      }

      const now = new Date();
      await expireAvailabilityHoldsInTx(
        tx,
        { listingId, buyerId },
        "lazy_request",
        now,
      );

      const activeUnlock = await tx.availabilityHold.findFirst({
        where: {
          listingId,
          status: "CONFIRMED",
          unlockExpiresAt: { gt: now },
          orderId: null,
        },
        select: { id: true, buyerId: true },
      });
      if (activeUnlock) {
        if (activeUnlock.buyerId === buyerId) {
          return tx.availabilityHold.findUniqueOrThrow({
            where: { id: activeUnlock.id },
          });
        }
        throw new AvailabilityHoldError(ACTIVE_UNLOCK_BLOCK_MESSAGE);
      }

      const existingPendingListing = await tx.availabilityHold.findFirst({
        where: { listingId, status: "PENDING" },
        select: { id: true, buyerId: true },
      });
      if (
        existingPendingListing &&
        existingPendingListing.buyerId !== buyerId
      ) {
        throw new AvailabilityHoldError(
          "Otro comprador está esperando confirmación del vendedor. Intenta más tarde.",
        );
      }

      const existingBuyerPending = await tx.availabilityHold.findFirst({
        where: { buyerId, status: "PENDING" },
        select: { id: true, listingId: true },
      });
      if (
        existingBuyerPending &&
        existingBuyerPending.listingId !== listingId
      ) {
        throw new AvailabilityHoldError(
          "Ya tienes una solicitud de disponibilidad pendiente en otro anuncio.",
        );
      }

      if (existingPendingListing?.buyerId === buyerId) {
        const pending = await tx.availabilityHold.findUniqueOrThrow({
          where: { id: existingPendingListing.id },
        });
        if (pending.expiresAt > now) {
          return pending;
        }
      }

      const created = await tx.availabilityHold.create({
        data: {
          listingId,
          buyerId,
          status: "PENDING",
          expiresAt: new Date(now.getTime() + AVAILABILITY_HOLD_PENDING_MS),
        },
      });

      await appendHoldEvent(tx, {
        holdId: created.id,
        kind: "CREATED",
        actorId: buyerId,
      });

      return created;
    });

    return { ok: true, holdId: hold.id };
  } catch (error) {
    if (error instanceof AvailabilityHoldError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * confirmAvailabilityHold
 *
 * Seller confirms the iPhone is still available.
 */
export async function confirmAvailabilityHold(input: {
  holdId: string;
  sellerId: string;
}): Promise<{ ok: true } | { ok: false; error: string; late?: boolean }> {
  const { holdId, sellerId } = input;

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await expireAvailabilityHoldsInTx(tx, { holdId }, "lazy_confirm", now);

      const hold = await tx.availabilityHold.findUnique({
        where: { id: holdId },
        include: {
          listing: { select: { sellerId: true, status: true } },
        },
      });

      if (!hold || hold.listing.sellerId !== sellerId) {
        throw new AvailabilityHoldError("Solicitud no encontrada.");
      }

      if (hold.status === "EXPIRED") {
        await appendHoldEvent(tx, {
          holdId: hold.id,
          kind: "LATE_CONFIRM",
          actorId: sellerId,
        });
        throw new AvailabilityHoldError("El plazo para confirmar ya venció.");
      }

      if (hold.status !== "PENDING") {
        throw new AvailabilityHoldError("Esta solicitud ya fue respondida.");
      }

      if (now > hold.expiresAt) {
        await appendHoldEvent(tx, {
          holdId: hold.id,
          kind: "LATE_CONFIRM",
          actorId: sellerId,
        });
        throw new AvailabilityHoldError("El plazo para confirmar ya venció.");
      }

      await tx.availabilityHold.update({
        where: { id: hold.id, status: "PENDING" },
        data: {
          status: "CONFIRMED",
          confirmedAt: now,
          unlockExpiresAt: new Date(
            now.getTime() + AVAILABILITY_HOLD_UNLOCK_MS,
          ),
        },
      });

      await appendHoldEvent(tx, {
        holdId: hold.id,
        kind: "CONFIRMED",
        actorId: sellerId,
      });
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof AvailabilityHoldError) {
      const late = error.message.includes("venció");
      return { ok: false, error: error.message, late };
    }
    throw error;
  }
}

/**
 * denyAvailabilityHold
 *
 * Seller indicates the iPhone is no longer available; archives listing.
 */
export async function denyAvailabilityHold(input: {
  holdId: string;
  sellerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { holdId, sellerId } = input;

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await expireAvailabilityHoldsInTx(tx, { holdId }, "lazy_deny", now);

      const hold = await tx.availabilityHold.findUnique({
        where: { id: holdId },
        include: {
          listing: { select: { sellerId: true, id: true } },
        },
      });

      if (!hold || hold.listing.sellerId !== sellerId) {
        throw new AvailabilityHoldError("Solicitud no encontrada.");
      }
      if (hold.status !== "PENDING") {
        throw new AvailabilityHoldError("Esta solicitud ya fue respondida.");
      }

      await tx.availabilityHold.update({
        where: { id: hold.id, status: "PENDING" },
        data: { status: "DENIED", deniedAt: now },
      });
      await tx.listing.update({
        where: { id: hold.listing.id },
        data: { status: "ARCHIVED" },
      });

      await appendHoldEvent(tx, {
        holdId: hold.id,
        kind: "DENIED",
        actorId: sellerId,
      });
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof AvailabilityHoldError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * expireStaleAvailabilityHolds
 *
 * Daily backstop sweep (primary expiry is lazy on read/confirm/buy/checkout).
 */
export async function expireStaleAvailabilityHolds(limit = 50) {
  const now = new Date();
  const [stalePending, staleUnlock] = await Promise.all([
    prisma.availabilityHold.findMany({
      where: { status: "PENDING", expiresAt: { lte: now } },
      take: limit,
      orderBy: { expiresAt: "asc" },
      select: { id: true },
    }),
    prisma.availabilityHold.findMany({
      where: {
        status: "CONFIRMED",
        orderId: null,
        unlockExpiresAt: { lte: now },
      },
      take: limit,
      orderBy: { unlockExpiresAt: "asc" },
      select: { id: true },
    }),
  ]);

  const ids = [...stalePending, ...staleUnlock]
    .map((row) => row.id)
    .slice(0, limit);
  const results: { holdId: string; ok: boolean }[] = [];

  for (const holdId of ids) {
    try {
      await prisma.$transaction(async (tx) => {
        await expireAvailabilityHoldsInTx(tx, { holdId }, "cron_backstop", now);
      });
      results.push({ holdId, ok: true });
    } catch {
      results.push({ holdId, ok: false });
    }
  }

  return results;
}

/**
 * runAvailabilityHoldExpiryBackstop
 *
 * Daily backstop: expire stale holds and notify buyers (runs on `/api/cron/tick`).
 */
export async function runAvailabilityHoldExpiryBackstop(input: {
  limit?: number;
  siteOrigin: string;
}) {
  const { notifyBuyerAvailabilityHoldExpired } =
    await import("@/lib/notifications/availability-hold");
  const results = await expireStaleAvailabilityHolds(input.limit ?? 50);
  let notified = 0;

  for (const row of results.filter((r) => r.ok)) {
    try {
      await notifyBuyerAvailabilityHoldExpired({
        holdId: row.holdId,
        siteOrigin: input.siteOrigin,
      });
      notified += 1;
    } catch {
      // dedupe or email noop
    }
  }

  return { results, notified };
}

/**
 * assertCheckoutAllowedForFlaggedListing
 *
 * Hard gate before Wompi and on payment success: flagged listings require CONFIRMED
 * hold linked to order with a valid unlock window.
 */
export async function assertCheckoutAllowedForFlaggedListing(input: {
  listingId: string;
  buyerId: string;
  orderId: string;
  paymentId?: string;
  tx?: Prisma.TransactionClient;
  recordPaymentAttempt?: boolean;
  lazyExpireReason?: string;
}): Promise<void> {
  const db = input.tx ?? prisma;
  const now = new Date();
  const lazyReason = input.lazyExpireReason ?? "lazy_checkout";

  const listing = await db.listing.findUnique({
    where: { id: input.listingId },
    select: { alsoListedElsewhere: true },
  });

  if (!listing?.alsoListedElsewhere) return;

  if (input.tx) {
    await expireAvailabilityHoldsInTx(
      input.tx,
      { listingId: input.listingId, buyerId: input.buyerId },
      lazyReason,
      now,
    );
  } else {
    await lazyExpireAvailabilityHolds({
      listingId: input.listingId,
      buyerId: input.buyerId,
      reason: lazyReason,
    });
  }

  const hold = await db.availabilityHold.findFirst({
    where: {
      listingId: input.listingId,
      buyerId: input.buyerId,
      orderId: input.orderId,
      status: "CONFIRMED",
    },
    select: {
      id: true,
      status: true,
      unlockExpiresAt: true,
    },
  });

  const gate = evaluateAvailabilityHoldCheckoutGate({
    alsoListedElsewhere: true,
    hold,
    now,
  });

  if (!gate.allowed) {
    throw new AvailabilityHoldError(gate.error, hold?.id ?? null);
  }

  if (input.recordPaymentAttempt === false || !hold) return;

  await db.availabilityHoldEvent.create({
    data: {
      holdId: hold.id,
      kind: "PAYMENT_ATTEMPT",
      actorId: input.buyerId,
      paymentAttemptId: input.paymentId ?? null,
    },
  });
}

export { HOLD_MISSING_CHECKOUT_ERROR, HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR };

/**
 * linkHoldToOrder
 *
 * Associates a CONFIRMED hold with the reserved order.
 */
export async function linkHoldToOrder(input: {
  holdId: string;
  buyerId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await lazyExpireAvailabilityHolds({
    holdId: input.holdId,
    buyerId: input.buyerId,
    reason: "lazy_buy",
  });

  const hold = await prisma.availabilityHold.findFirst({
    where: {
      id: input.holdId,
      buyerId: input.buyerId,
      status: "CONFIRMED",
      orderId: null,
    },
  });

  if (!hold) {
    return {
      ok: false,
      error: "La confirmación de disponibilidad no es válida o ya expiró.",
    };
  }

  const now = new Date();
  if (hold.unlockExpiresAt && now > hold.unlockExpiresAt) {
    return {
      ok: false,
      error: "El plazo para comprar después de la confirmación venció.",
    };
  }

  await prisma.availabilityHold.update({
    where: { id: hold.id },
    data: { orderId: input.orderId },
  });

  return { ok: true };
}

/**
 * expireHoldIfStaleInTx
 *
 * Expires one PENDING hold when past expiresAt (e.g. hold detail page load).
 */
async function expireHoldIfStaleInTx(
  tx: Prisma.TransactionClient,
  holdId: string,
  reason: string,
  now: Date,
) {
  const updated = await tx.availabilityHold.updateMany({
    where: {
      id: holdId,
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED", expiredAt: now },
  });
  if (updated.count !== 1) return;
  await appendHoldEvent(tx, {
    holdId,
    kind: "EXPIRED",
    metadata: { reason },
  });
}

/**
 * getHoldByIdForParticipant
 *
 * Loads a hold when the viewer is buyer or listing seller.
 */
export async function getHoldByIdForParticipant(
  holdId: string,
  profileId: string,
) {
  await lazyExpireAvailabilityHolds({ holdId, reason: "lazy_read" });

  let hold = await prisma.availabilityHold.findUnique({
    where: { id: holdId },
    include: {
      listing: {
        include: {
          iphoneModel: true,
          iphoneStorage: true,
          iphoneColor: true,
          images: {
            where: { imageType: "gallery" },
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
      },
      buyer: {
        select: { id: true, fullName: true, username: true },
      },
    },
  });

  if (!hold) return null;
  if (hold.buyerId !== profileId && hold.listing.sellerId !== profileId) {
    return null;
  }

  await lazyExpireAvailabilityHolds({
    listingId: hold.listingId,
    buyerId: hold.buyerId,
    holdId: hold.id,
    reason: "lazy_read",
  });

  hold = await prisma.availabilityHold.findUnique({
    where: { id: holdId },
    include: {
      listing: {
        include: {
          iphoneModel: true,
          iphoneStorage: true,
          iphoneColor: true,
          images: {
            where: { imageType: "gallery" },
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
      },
      buyer: {
        select: { id: true, fullName: true, username: true },
      },
    },
  });

  if (!hold) return null;
  if (hold.buyerId !== profileId && hold.listing.sellerId !== profileId) {
    return null;
  }

  return hold;
}

export function holdStatusLabel(status: AvailabilityHoldStatus): string {
  switch (status) {
    case "PENDING":
      return "Esperando vendedor";
    case "CONFIRMED":
      return "Confirmado";
    case "DENIED":
      return "No disponible";
    case "EXPIRED":
      return "Vencido";
    default:
      return status;
  }
}
