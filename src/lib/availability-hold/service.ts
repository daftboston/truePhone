/**
 * @file service.ts
 * @description Multi-platform availability hold state machine (F3).
 * @dependencies prisma, constants
 */

import type { AvailabilityHoldStatus, Prisma } from "@prisma/client";

import {
  AVAILABILITY_HOLD_PENDING_MS,
  AVAILABILITY_HOLD_UNLOCK_MS,
} from "@/lib/availability-hold/constants";
import { prisma } from "@/lib/db";

export class AvailabilityHoldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityHoldError";
  }
}

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
 * getPendingHoldForListing
 *
 * Returns the active PENDING hold for a listing, if any.
 */
export async function getPendingHoldForListing(listingId: string) {
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
        return tx.availabilityHold.findUniqueOrThrow({
          where: { id: existingPendingListing.id },
        });
      }

      const now = new Date();
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

      const now = new Date();
      if (now > hold.expiresAt) {
        await tx.availabilityHold.update({
          where: { id: hold.id },
          data: { status: "EXPIRED", expiredAt: now },
        });
        await appendHoldEvent(tx, {
          holdId: hold.id,
          kind: "EXPIRED",
          metadata: { reason: "expired_on_confirm" },
        });
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

      const now = new Date();
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
 * Marks PENDING holds past expiresAt as EXPIRED. Called by cron.
 */
export async function expireStaleAvailabilityHolds(limit = 50) {
  const now = new Date();
  const stale = await prisma.availabilityHold.findMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
    take: limit,
    orderBy: { expiresAt: "asc" },
    select: { id: true },
  });

  const results: { holdId: string; ok: boolean }[] = [];

  for (const row of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.availabilityHold.updateMany({
          where: { id: row.id, status: "PENDING" },
          data: { status: "EXPIRED", expiredAt: now },
        });
        if (updated.count !== 1) return;
        await appendHoldEvent(tx, {
          holdId: row.id,
          kind: "EXPIRED",
          metadata: { reason: "cron" },
        });
      });
      results.push({ holdId: row.id, ok: true });
    } catch {
      results.push({ holdId: row.id, ok: false });
    }
  }

  return results;
}

/**
 * assertCheckoutAllowedForFlaggedListing
 *
 * Hard gate before Wompi: flagged listings require CONFIRMED hold linked to order.
 */
export async function assertCheckoutAllowedForFlaggedListing(input: {
  listingId: string;
  buyerId: string;
  orderId: string;
  paymentId?: string;
}): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: { alsoListedElsewhere: true },
  });

  if (!listing?.alsoListedElsewhere) return;

  const hold = await prisma.availabilityHold.findFirst({
    where: {
      listingId: input.listingId,
      buyerId: input.buyerId,
      orderId: input.orderId,
      status: "CONFIRMED",
    },
  });

  if (!hold) {
    throw new Error(
      "Debes esperar la confirmación del vendedor antes de pagar.",
    );
  }

  const now = new Date();
  if (hold.unlockExpiresAt && now > hold.unlockExpiresAt) {
    throw new Error(
      "El plazo para pagar después de la confirmación venció. Solicita de nuevo.",
    );
  }

  await prisma.availabilityHoldEvent.create({
    data: {
      holdId: hold.id,
      kind: "PAYMENT_ATTEMPT",
      actorId: input.buyerId,
      paymentAttemptId: input.paymentId ?? null,
    },
  });
}

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
 * getHoldByIdForParticipant
 *
 * Loads a hold when the viewer is buyer or listing seller.
 */
export async function getHoldByIdForParticipant(
  holdId: string,
  profileId: string,
) {
  const hold = await prisma.availabilityHold.findUnique({
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
