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
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCatalog() {
  const [models, colors, storages] = await Promise.all([
    prisma.iphoneModel.findMany({ orderBy: { releaseYear: "desc" } }),
    prisma.iphoneColor.findMany({ orderBy: { name: "asc" } }),
    prisma.iphoneStorage.findMany({ orderBy: { valueGb: "asc" } }),
  ]);
  return { models, colors, storages };
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
