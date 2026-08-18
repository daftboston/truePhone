/**
 * @file listings.ts
 * @description Seller listing ownership, catalog, and possession challenge helpers.
 * @dependencies @/lib/auth/session, @/lib/db, @/lib/iphone-catalog-sync
 */

import { prisma } from "@/lib/db";
import { generatePossessionCode } from "@/features/listings/schemas/listing";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { ensureIphoneCatalog } from "@/lib/iphone-catalog-sync";

/**
 * backfillIphoneCatalog
 *
 * Best-effort write of missing canonical models so browse/sell pickers stay complete.
 * Failures are logged and ignored so a read-only or locked DB cannot take down pages.
 *
 * @returns Resolves after a successful sync or a logged failure.
 * @calledBy listIphoneModels, getCatalog
 */
async function backfillIphoneCatalog() {
  try {
    await ensureIphoneCatalog(prisma);
  } catch (error) {
    console.error("Failed to backfill iPhone catalog", error);
  }
}

/**
 * requireVerifiedSeller
 *
 * Ensures the current profile is a verified seller; redirects otherwise.
 *
 * @returns Current profile for a verified seller session.
 * @calledBy Seller listing create/edit pages and actions
 */
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

/**
 * getOwnedListing
 *
 * Loads a listing owned by the given seller.
 *
 * @param listingId - Listing UUID.
 * @param sellerId - Expected seller profile UUID.
 * @returns Listing with images/catalog or null.
 * @calledBy Seller edit flows
 */
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

/**
 * listSellerListings
 *
 * Lists non-deleted listings for a seller, newest first.
 *
 * @param sellerId - Seller profile UUID.
 * @returns Seller listing rows with catalog and images.
 * @calledBy Seller ventas/anuncios dashboard
 */
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
 * getSellerDraftResumePath
 *
 * Computes the wizard step path to resume a draft listing.
 *
 * @param listing - Listing status and possession challenge fields.
 * @returns Relative path into the sell wizard.
 * @calledBy Seller listing list CTAs
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

/**
 * listIphoneModels
 *
 * Lists active iPhone models for catalog pickers.
 * Ensures the canonical 28-model catalog exists before reading.
 *
 * @returns iPhoneModel rows ordered for display.
 * @calledBy AppShell, listing create forms
 */
export async function listIphoneModels() {
  await backfillIphoneCatalog();
  return prisma.iphoneModel.findMany({
    orderBy: [{ sortOrder: "desc" }, { name: "asc" }],
  });
}

/**
 * getCatalog
 *
 * Loads models, colors, storages, and per-model color/storage joins for listing forms.
 * Backfills missing canonical models (iPhone 17, Air, Pro Max, Plus, mini, e) first.
 *
 * @returns Catalog maps used by create/edit listing UI and browse filters.
 * @calledBy Seller listing wizard pages, SearchPage, ExplorePage, AdminRecommendedPricesPage
 */
export async function getCatalog() {
  await backfillIphoneCatalog();

  const [models, colors, storages, modelColors, modelStorages] =
    await Promise.all([
      prisma.iphoneModel.findMany({
        orderBy: [{ sortOrder: "desc" }, { name: "asc" }],
      }),
      prisma.iphoneColor.findMany({ orderBy: { name: "asc" } }),
      prisma.iphoneStorage.findMany({ orderBy: { valueGb: "asc" } }),
      prisma.iphoneModelColor.findMany({
        select: { iphoneModelId: true, iphoneColorId: true },
      }),
      prisma.iphoneModelStorage.findMany({
        select: { iphoneModelId: true, iphoneStorageId: true },
      }),
    ]);

  const colorIdsByModelId: Record<string, string[]> = {};
  for (const link of modelColors) {
    colorIdsByModelId[link.iphoneModelId] ??= [];
    colorIdsByModelId[link.iphoneModelId].push(link.iphoneColorId);
  }

  const storageIdsByModelId: Record<string, string[]> = {};
  for (const link of modelStorages) {
    storageIdsByModelId[link.iphoneModelId] ??= [];
    storageIdsByModelId[link.iphoneModelId].push(link.iphoneStorageId);
  }

  return {
    models,
    colors,
    storages,
    colorIdsByModelId,
    storageIdsByModelId,
  };
}

/**
 * isColorAllowedForModel
 *
 * Validates that a color is allowed for a given iPhone model.
 *
 * @param modelId - iPhoneModel UUID.
 * @param colorId - iPhoneModelColor UUID.
 * @returns True when the join exists.
 * @calledBy Listing create/update validation
 */
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

/**
 * isStorageAllowedForModel
 *
 * Validates that a storage capacity is allowed for a given iPhone model.
 *
 * @param iphoneModelId - iPhoneModel UUID.
 * @param iphoneStorageId - IphoneStorage UUID.
 * @returns True when the join exists.
 * @calledBy Listing create/update validation, recommended-price upsert
 */
export async function isStorageAllowedForModel(
  iphoneModelId: string,
  iphoneStorageId: string,
) {
  const link = await prisma.iphoneModelStorage.findUnique({
    where: {
      iphoneModelId_iphoneStorageId: { iphoneModelId, iphoneStorageId },
    },
    select: { id: true },
  });
  return Boolean(link);
}

/**
 * ensurePossessionChallenge
 *
 * Creates a possession challenge for a listing when missing.
 *
 * @param listingId - Listing UUID.
 * @returns Existing or newly created PossessionChallenge.
 * @calledBy Seller possession verification step
 */
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
