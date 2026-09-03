/**
 * @file seller-listing-hub.ts
 * @description Seller listing hub buckets, URL query parsing, and archive/relist rules.
 * @dependencies @prisma/client
 */

import type { ListingStatus } from "@prisma/client";

/**
 * publicListingPath
 *
 * Builds the public listing URL from a slug. Kept local so this hub module
 * stays client-safe (account nav and the seller toolbar import it).
 *
 * @param slug - Listing slug.
 * @returns `/anuncios/{slug}` path.
 * @calledBy sellerListingViewHref
 */
function publicListingPath(slug: string) {
  return `/anuncios/${slug}`;
}

/** Listings the seller still manages on Anuncios activos. */
export const SELLER_ACTIVE_STATUSES: ListingStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "REJECTED",
  "RESERVED",
];

/** Listings shown on Archivados (seller-retired plus completed sales). */
export const SELLER_ARCHIVED_STATUSES: ListingStatus[] = ["ARCHIVED", "SOLD"];

export type SellerListingVista = "activos" | "archivados";

export type SellerListingSort =
  "created_desc" | "created_asc" | "updated_desc" | "price_asc" | "price_desc";

export type SellerListingsQuery = {
  vista: SellerListingVista;
  q: string;
  estado: ListingStatus | "";
  orden: SellerListingSort;
};

const SORT_VALUES = new Set<SellerListingSort>([
  "created_desc",
  "created_asc",
  "updated_desc",
  "price_asc",
  "price_desc",
]);

const ALL_HUB_STATUSES = new Set<ListingStatus>([
  ...SELLER_ACTIVE_STATUSES,
  ...SELLER_ARCHIVED_STATUSES,
]);

/**
 * firstSearchParam
 *
 * Reads the first string value from a Next.js searchParams entry.
 *
 * @param value - Raw search param (string, array, or missing).
 * @returns Trimmed string, or empty when missing.
 * @calledBy parseSellerListingsSearchParams
 */
function firstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

/**
 * statusesForVista
 *
 * Returns the listing statuses that belong to a seller hub bucket.
 *
 * @param vista - Active or archived bucket.
 * @returns Status list for that bucket.
 * @calledBy parseSellerListingsSearchParams, listSellerListings
 */
export function statusesForVista(vista: SellerListingVista): ListingStatus[] {
  return vista === "archivados"
    ? SELLER_ARCHIVED_STATUSES
    : SELLER_ACTIVE_STATUSES;
}

/**
 * parseSellerListingsSearchParams
 *
 * Parses `/vender` search params into a typed hub query. Unknown sort/status
 * values fall back to defaults. Status filters outside the current bucket are ignored.
 *
 * @param params - Next.js searchParams record.
 * @returns Normalized seller listings query.
 * @calledBy SellPage, SellerListingsToolbar
 */
export function parseSellerListingsSearchParams(
  params: Record<string, string | string[] | undefined>,
): SellerListingsQuery {
  const vista: SellerListingVista =
    firstSearchParam(params.vista) === "archivados" ? "archivados" : "activos";
  const rawStatus = firstSearchParam(params.estado);
  const bucket = statusesForVista(vista);
  const estado =
    ALL_HUB_STATUSES.has(rawStatus as ListingStatus) &&
    bucket.includes(rawStatus as ListingStatus)
      ? (rawStatus as ListingStatus)
      : "";
  const rawSort = firstSearchParam(params.orden);
  const orden = SORT_VALUES.has(rawSort as SellerListingSort)
    ? (rawSort as SellerListingSort)
    : "created_desc";

  return {
    vista,
    q: firstSearchParam(params.q),
    estado,
    orden,
  };
}

/**
 * isArchivedVistaSearch
 *
 * Returns whether a query string selects the archived seller listings bucket.
 *
 * @param search - Raw `URLSearchParams` string, with or without a leading `?`.
 * @returns True when `vista=archivados`.
 * @calledBy isAccountNavItemActive
 */
export function isArchivedVistaSearch(search: string) {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(normalized).get("vista") === "archivados";
}

/**
 * canArchiveListing
 *
 * Seller archive is allowed only for live published listings.
 *
 * @param status - Current listing status.
 * @returns True when the seller may archive.
 * @calledBy archiveListingAction, SellerListingActions
 */
export function canArchiveListing(status: ListingStatus) {
  return status === "PUBLISHED";
}

/**
 * orderReachedPaid
 *
 * Returns whether an order reached the paid hold (or completed) stage.
 * A cancelled paid order still has `fundsHeldAt` set (seller-abandon archive).
 *
 * @param order.status - Current order status.
 * @param order.fundsHeldAt - Hold timestamp when payment succeeded.
 * @returns True when the order must block relist.
 * @calledBy listingHadPaidOrder, relistListingAction
 */
export function orderReachedPaid(order: {
  status: string;
  fundsHeldAt: Date | null;
}) {
  return (
    order.status === "PAID" ||
    order.status === "COMPLETED" ||
    order.fundsHeldAt != null
  );
}

/**
 * listingHadPaidOrder
 *
 * Returns whether any related order reached payment.
 *
 * @param orders - Orders tied to the listing.
 * @returns True when relist must be blocked.
 * @calledBy canRelistListing, SellerListingRow
 */
export function listingHadPaidOrder(
  orders: { status: string; fundsHeldAt: Date | null }[],
) {
  return orders.some(orderReachedPaid);
}

/**
 * canRelistListing
 *
 * Relist restores `PUBLISHED` immediately. Only seller-archived listings
 * that never had a paid order may relist (system archives stay archived).
 *
 * @param input.status - Current listing status.
 * @param input.hadPaidOrder - True when any related order reached payment.
 * @returns True when Relistar is allowed.
 * @calledBy relistListingAction, SellerListingActions
 */
export function canRelistListing(input: {
  status: ListingStatus;
  hadPaidOrder: boolean;
}) {
  return input.status === "ARCHIVED" && !input.hadPaidOrder;
}

/**
 * sellerListingViewHref
 *
 * Picks the Ver destination: public page for published listings, seller
 * detail otherwise.
 *
 * @param listing.id - Listing UUID.
 * @param listing.status - Current status.
 * @param listing.slug - Public slug when present.
 * @returns Path for the Ver action.
 * @calledBy SellerListingRow
 */
export function sellerListingViewHref(listing: {
  id: string;
  status: ListingStatus;
  slug: string | null;
}) {
  if (listing.status === "PUBLISHED" && listing.slug) {
    return publicListingPath(listing.slug);
  }
  return `/vender/${listing.id}`;
}
