import { prisma } from "@/lib/db";
import { generatePossessionCode } from "@/features/listings/schemas/listing";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";

export async function requireVerifiedSeller() {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false as const, error: "Debes iniciar sesión." };
  }
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    return {
      ok: false as const,
      error: "Debes verificar tu identidad antes de publicar.",
    };
  }
  return { ok: true as const, current };
}

export async function getOwnedListing(listingId: string, sellerId: string) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      sellerId,
      deletedAt: null,
    },
    include: {
      iphoneModel: true,
      iphoneColor: true,
      iphoneStorage: true,
      images: { orderBy: { displayOrder: "asc" } },
      possessionChallenge: true,
    },
  });
}

export async function listSellerListings(sellerId: string) {
  return prisma.listing.findMany({
    where: { sellerId, deletedAt: null },
    include: {
      iphoneModel: true,
      images: {
        where: { imageType: "gallery" },
        orderBy: { displayOrder: "asc" },
        take: 1,
      },
      possessionChallenge: {
        select: { photoUrl: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Resume a DRAFT at the first incomplete wizard step.
 * Assumes device details already exist from listing creation.
 */
export function getSellerDraftResumePath(listing: {
  id: string;
  imeiHash: string | null;
  images: { imageType: string }[];
  possessionChallenge: { photoUrl: string | null } | null;
}) {
  const hasGallery = listing.images.some(
    (image) => image.imageType === "gallery",
  );
  if (!hasGallery) {
    return `/vender/${listing.id}/fotos`;
  }
  if (!listing.imeiHash) {
    return `/vender/${listing.id}/seguridad`;
  }
  if (!listing.possessionChallenge?.photoUrl) {
    return `/vender/${listing.id}/posesion`;
  }
  return `/vender/${listing.id}/revisar`;
}

export async function listIphoneModels() {
  return prisma.iphoneModel.findMany({
    orderBy: [{ releaseYear: "desc" }, { name: "asc" }],
  });
}

export async function getCatalog() {
  const [models, colors, storages, modelColors] = await Promise.all([
    prisma.iphoneModel.findMany({ orderBy: { releaseYear: "desc" } }),
    prisma.iphoneColor.findMany({ orderBy: { name: "asc" } }),
    prisma.iphoneStorage.findMany({ orderBy: { valueGb: "asc" } }),
    prisma.iphoneModelColor.findMany({
      select: { iphoneModelId: true, iphoneColorId: true },
    }),
  ]);

  const colorIdsByModelId: Record<string, string[]> = {};
  for (const link of modelColors) {
    colorIdsByModelId[link.iphoneModelId] ??= [];
    colorIdsByModelId[link.iphoneModelId].push(link.iphoneColorId);
  }

  return { models, colors, storages, colorIdsByModelId };
}

export async function isColorAllowedForModel(
  iphoneModelId: string,
  iphoneColorId: string,
) {
  const link = await prisma.iphoneModelColor.findUnique({
    where: {
      iphoneModelId_iphoneColorId: { iphoneModelId, iphoneColorId },
    },
    select: { id: true },
  });
  return Boolean(link);
}

export async function ensurePossessionChallenge(listingId: string) {
  const existing = await prisma.devicePossessionChallenge.findUnique({
    where: { listingId },
  });
  if (existing) return existing;

  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 7);

  return prisma.devicePossessionChallenge.create({
    data: {
      listingId,
      code: generatePossessionCode(),
      expiresAt,
    },
  });
}
