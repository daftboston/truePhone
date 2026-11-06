/** Private buyback persistence. All writers lock the quote before state transitions.
 * Payments & Trust must use the SAME quote lock and validate the accepted current
 * offer before recording a payment, then set PURCHASED atomically.
 */
import type { Prisma, BuybackQuote } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRetiredCatalogSlug } from "@/lib/iphone-catalog-data";
import { draftSchema } from "@/features/buyback/schemas";
import type {
  BuybackErrorCode,
  BuybackQuoteView,
} from "@/features/buyback/types";
import {
  acceptanceGuard,
  BUYBACK_CONDITIONS,
  mayReadQuote,
  mayReview,
  offerExpiry,
  priceRange,
  reviewDeadline,
  reviewOpening,
} from "./policy";

export type BuybackActor = { id: string; role: string };
type Tx = Prisma.TransactionClient;
const include = {
  photos: { orderBy: { slot: "asc" as const } },
  offers: { orderBy: { version: "desc" as const }, take: 1 },
};
type QuoteRecord = Prisma.BuybackQuoteGetPayload<{ include: typeof include }>;

export class BuybackError extends Error {
  constructor(
    public code: BuybackErrorCode,
    message: string,
  ) {
    super(message);
  }
}
export function quoteView(q: QuoteRecord, now = new Date()): BuybackQuoteView {
  const offer = q.offers[0];
  return {
    id: q.id,
    version: q.version,
    status: q.status,
    iphoneModelId: q.iphoneModelId,
    iphoneStorageId: q.iphoneStorageId,
    condition: q.condition,
    batteryHealth: q.batteryHealth,
    description: q.description,
    city: q.city,
    range:
      q.rangeMinCop !== null && q.rangeMaxCop !== null
        ? { minCop: q.rangeMinCop, maxCop: q.rangeMaxCop }
        : null,
    manualReview: q.submittedAt !== null && q.rangeMinCop === null,
    reviewDueAt: q.reviewDueAt?.toISOString() ?? null,
    reviewStartsAt: reviewOpening(now).toISOString(),
    photoSlots: q.photos.map((p) => p.slot),
    offer: offer
      ? {
          id: offer.id,
          version: offer.version,
          amountCop: offer.amountCop,
          conditions: offer.conditions,
          expiresAt: offer.expiresAt.toISOString(),
          acceptedAt: offer.acceptedAt?.toISOString() ?? null,
          expired: offer.expiresAt <= now,
        }
      : null,
    pickupStatus:
      q.status === "PURCHASED"
        ? "COMPLETED"
        : q.status === "OFFER_ACCEPTED"
          ? "PENDING_SCHEDULING"
          : "NOT_REQUESTED",
  };
}
export async function lockedQuote(tx: Tx, id: string) {
  // Parameterized identifiers are data, never raw SQL interpolation.
  await tx.$queryRaw`SELECT id FROM buyback_quotes WHERE id = ${id} FOR UPDATE`;
  const q = await tx.buybackQuote.findUnique({ where: { id }, include });
  if (!q) throw new BuybackError("NOT_FOUND", "Solicitud no encontrada.");
  return q;
}
function owner(q: BuybackQuote, actor: BuybackActor) {
  if (q.sellerId !== actor.id)
    throw new BuybackError("NOT_FOUND", "Solicitud no encontrada.");
}
function version(q: BuybackQuote, expected: number) {
  if (q.version !== expected)
    throw new BuybackError(
      "QUOTE_CHANGED",
      "La solicitud cambió. Actualiza antes de continuar.",
    );
}
function event(
  tx: Tx,
  q: BuybackQuote,
  actor: BuybackActor,
  kind: string,
  nextVersion: number,
) {
  return tx.buybackEvent.create({
    data: { quoteId: q.id, actorId: actor.id, kind, version: nextVersion },
  });
}
async function reload(tx: Tx, id: string) {
  return quoteView(
    await tx.buybackQuote.findUniqueOrThrow({ where: { id }, include }),
  );
}

export async function createQuote(actor: BuybackActor, input: unknown) {
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success)
    throw new BuybackError(
      "INVALID_INPUT",
      "Revisa los datos y confirma propiedad y Bloqueo de activación.",
    );
  const {
    clientRequestId,
    iphoneModelId,
    iphoneStorageId,
    condition,
    batteryHealth,
    description,
    city,
  } = parsed.data;
  const allowed = await prisma.iphoneModelStorage.findUnique({
    where: {
      iphoneModelId_iphoneStorageId: { iphoneModelId, iphoneStorageId },
    },
    include: { iphoneModel: true },
  });
  if (!allowed || isRetiredCatalogSlug(allowed.iphoneModel.slug))
    throw new BuybackError(
      "INVALID_INPUT",
      "Modelo o capacidad no disponible.",
    );
  const q = await prisma.buybackQuote.upsert({
    where: {
      sellerId_clientRequestId: { sellerId: actor.id, clientRequestId },
    },
    update: {},
    create: {
      sellerId: actor.id,
      clientRequestId,
      iphoneModelId,
      iphoneStorageId,
      condition,
      batteryHealth,
      description,
      city,
    },
    select: { id: true },
  });
  return readQuote(actor, q.id);
}

export async function readQuote(actor: BuybackActor, quoteId: string) {
  const q = await prisma.buybackQuote.findUnique({
    where: { id: quoteId },
    include,
  });
  if (!q || !mayReadQuote(actor, q.sellerId))
    throw new BuybackError("NOT_FOUND", "Solicitud no encontrada.");
  return quoteView(q);
}

export async function submitQuote(
  actor: BuybackActor,
  input: { quoteId: string; expectedVersion: number },
  clock?: Date,
) {
  return prisma.$transaction(async (tx) => {
    const q = await lockedQuote(tx, input.quoteId);
    owner(q, actor);
    const now = clock ?? new Date();
    if (q.status === "RANGE_READY" || q.status === "REVIEW_REQUESTED")
      return quoteView(q, now);
    if (q.status !== "DRAFT")
      throw new BuybackError("INVALID_STATE", "La solicitud ya fue enviada.");
    version(q, input.expectedVersion);
    if (
      !Array.from({ length: 8 }, (_, i) => i).every((i) =>
        q.photos.some((p) => p.slot === i),
      )
    ) {
      throw new BuybackError(
        "INVALID_INPUT",
        "Completa las ocho fotos guiadas.",
      );
    }
    const price = await tx.buybackPrice.findUnique({
      where: {
        iphoneModelId_iphoneStorageId: {
          iphoneModelId: q.iphoneModelId,
          iphoneStorageId: q.iphoneStorageId,
        },
      },
    });
    const range = price?.active ? priceRange(price.purchasePriceCop) : null;
    await tx.buybackQuote.update({
      where: { id: q.id },
      data: {
        status: range ? "RANGE_READY" : "REVIEW_REQUESTED",
        submittedAt: now,
        purchasePriceCop: range ? price!.purchasePriceCop : null,
        priceImportId: range ? price!.importId : null,
        rangeMinCop: range?.minCop ?? null,
        rangeMaxCop: range?.maxCop ?? null,
        reviewDueAt: range ? null : reviewDeadline(now),
        version: { increment: 1 },
      },
    });
    await event(
      tx,
      q,
      actor,
      range ? "RANGE_PRESENTED" : "MANUAL_REVIEW_REQUESTED",
      q.version + 1,
    );
    return reload(tx, q.id);
  });
}

export async function requestReview(
  actor: BuybackActor,
  input: { quoteId: string; expectedVersion: number },
  clock?: Date,
) {
  return prisma.$transaction(async (tx) => {
    const q = await lockedQuote(tx, input.quoteId);
    owner(q, actor);
    const now = clock ?? new Date();
    if (q.status === "REVIEW_REQUESTED") return quoteView(q, now);
    version(q, input.expectedVersion);
    const expiredOffer =
      q.status === "OFFER_SENT" && q.offers[0]?.expiresAt <= now;
    if (q.status !== "RANGE_READY" && !expiredOffer)
      throw new BuybackError(
        "INVALID_STATE",
        "No hay un rango pendiente de confirmar.",
      );
    if (expiredOffer)
      await tx.buybackOffer.updateMany({
        where: { quoteId: q.id, supersededAt: null },
        data: { supersededAt: now },
      });
    await tx.buybackQuote.update({
      where: { id: q.id },
      data: {
        status: "REVIEW_REQUESTED",
        rangeInterestedAt: now,
        reviewDueAt: reviewDeadline(now),
        version: { increment: 1 },
      },
    });
    await event(tx, q, actor, "RANGE_INTERESTED", q.version + 1);
    return reload(tx, q.id);
  });
}

export async function sendOffer(
  actor: BuybackActor,
  input: { quoteId: string; expectedVersion: number; amountCop: number },
  clock?: Date,
) {
  if (!mayReview(actor.role))
    throw new BuybackError(
      "FORBIDDEN",
      "Solo un revisor o administrador puede enviar ofertas.",
    );
  return prisma.$transaction(async (tx) => {
    const q = await lockedQuote(tx, input.quoteId);
    const now = clock ?? new Date();
    if (q.sellerId === actor.id)
      throw new BuybackError(
        "FORBIDDEN",
        "No puedes revisar tu propia solicitud.",
      );
    version(q, input.expectedVersion);
    if (
      !["REVIEW_REQUESTED", "OFFER_SENT", "OFFER_ACCEPTED"].includes(q.status)
    )
      throw new BuybackError(
        "INVALID_STATE",
        "No se puede enviar una oferta en este estado.",
      );
    await tx.buybackOffer.updateMany({
      where: { quoteId: q.id, supersededAt: null },
      data: { supersededAt: now },
    });
    await tx.buybackOffer.create({
      data: {
        quoteId: q.id,
        version: q.currentOfferVersion + 1,
        amountCop: input.amountCop,
        reviewerId: actor.id,
        conditions: BUYBACK_CONDITIONS,
        expiresAt: offerExpiry(now),
        createdAt: now,
      },
    });
    await tx.buybackQuote.update({
      where: { id: q.id },
      data: {
        status: "OFFER_SENT",
        currentOfferVersion: { increment: 1 },
        version: { increment: 1 },
      },
    });
    await event(tx, q, actor, "OFFER_SENT", q.version + 1);
    const preference = await tx.notificationPreference.findUnique({
      where: { userId: q.sellerId },
    });
    await tx.notification.create({
      data: {
        userId: q.sellerId,
        type: "BUYBACK_OFFER",
        title: "Tienes una oferta de TruePhone",
        body: "Revisa el precio, las condiciones y la vigencia antes de aceptar. La recogida requiere confirmación.",
        href: `/vende-ya?quote=${encodeURIComponent(q.id)}`,
        dedupeKey: `buyback:${q.id}:offer:${q.currentOfferVersion + 1}`,
        readAt: preference?.inAppEnabled === false ? now : null,
      },
    });
    return reload(tx, q.id);
  });
}

export async function acceptOffer(
  actor: BuybackActor,
  input: { quoteId: string; offerId: string; expectedOfferVersion: number },
  clock?: Date,
) {
  return prisma.$transaction(async (tx) => {
    const q = await lockedQuote(tx, input.quoteId);
    owner(q, actor);
    const now = clock ?? new Date();
    const offer = q.offers[0];
    if (!offer || offer.id !== input.offerId)
      throw new BuybackError(
        "OFFER_CHANGED",
        "La oferta cambió. Lee y acepta la oferta actual.",
      );
    const result = acceptanceGuard({
      status: q.status,
      currentOfferVersion: q.currentOfferVersion,
      offeredVersion: offer.version,
      expectedOfferVersion: input.expectedOfferVersion,
      expiresAt: offer.expiresAt,
      acceptedAt: offer.acceptedAt,
      supersededAt: offer.supersededAt,
      now,
    });
    if (result === "ALREADY_ACCEPTED") return quoteView(q, now);
    if (result !== "OK")
      throw new BuybackError(
        result,
        result === "OFFER_EXPIRED"
          ? "La oferta venció. Solicita una nueva revisión."
          : "La oferta cambió o ya no está disponible.",
      );
    await tx.buybackOffer.update({
      where: { id: offer.id },
      data: { acceptedAt: now },
    });
    await tx.buybackQuote.update({
      where: { id: q.id },
      data: { status: "OFFER_ACCEPTED", version: { increment: 1 } },
    });
    await event(tx, q, actor, "OFFER_ACCEPTED", q.version + 1);
    return reload(tx, q.id);
  });
}

export async function cancelQuote(
  actor: BuybackActor,
  input: { quoteId: string; expectedVersion: number },
) {
  return prisma.$transaction(async (tx) => {
    const q = await lockedQuote(tx, input.quoteId);
    owner(q, actor);
    version(q, input.expectedVersion);
    // Once custody/scheduling may exist, Payments & Trust handles cancellation.
    if (
      !["DRAFT", "RANGE_READY", "REVIEW_REQUESTED", "OFFER_SENT"].includes(
        q.status,
      )
    )
      throw new BuybackError(
        "INVALID_STATE",
        "Contacta al equipo para cancelar esta solicitud.",
      );
    await tx.buybackQuote.update({
      where: { id: q.id },
      data: { status: "CANCELLED", version: { increment: 1 } },
    });
    await event(tx, q, actor, "CANCELLED", q.version + 1);
    return reload(tx, q.id);
  });
}
