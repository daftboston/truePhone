/**
 * @file seller-listing-row.tsx
 * @description Seller hub management row: thumbnail, specs, price, status, Acciones.
 * @dependencies next/image, PriceDisplay, Badge, listing labels, seller hub helpers
 */

import Image from "next/image";
import type { ListingStatus } from "@prisma/client";

import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { SellerListingActions } from "@/features/listings/components/seller-listing-actions";
import {
  canArchiveListing,
  canRelistListing,
  listingHadPaidOrder,
  sellerListingViewHref,
} from "@/features/listings/lib/seller-listing-hub";
import {
  conditionLabels,
  listingStatusLabel,
} from "@/features/listings/schemas/listing";
import { formatStorageLabel } from "@/lib/iphone-catalog";
import { getSellerDraftResumePath } from "@/lib/listings";

type SellerListingRowListing = {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  price: number;
  unlocked: boolean;
  carrier: string | null;
  condition: keyof typeof conditionLabels;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason: string | null;
  images: { imageUrl: string; imageType: string }[];
  iphoneColor: { name: string };
  iphoneStorage: { valueGb: number };
  possessionChallenge: { photoUrl: string | null } | null;
  imeiHash: string | null;
  orders: { id: string; status: string; fundsHeldAt: Date | null }[];
};

type SellerListingRowProps = {
  listing: SellerListingRowListing;
};

/**
 * formatSellerListingDate
 *
 * Formats a listing timestamp for the seller hub row.
 *
 * @param value - Date to display.
 * @returns Short es-CO date string.
 * @calledBy SellerListingRow
 */
function formatSellerListingDate(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

/**
 * statusBadgeVariant
 *
 * Picks a badge variant that matches listing status meaning.
 *
 * @param status - Listing status.
 * @returns Badge variant name.
 * @calledBy SellerListingRow
 */
function statusBadgeVariant(status: ListingStatus) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    case "RESERVED":
    case "PENDING_REVIEW":
    case "SUBMITTED":
    case "DRAFT":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

/**
 * SellerListingRow
 *
 * Renders one seller-managed listing as a horizontal management row.
 *
 * @param props.listing - Seller hub listing with catalog, cover, and orders.
 * @returns Row for the `/vender` list.
 * @calledBy SellPage
 */
export function SellerListingRow({ listing }: SellerListingRowProps) {
  const coverUrl = listing.images[0]?.imageUrl;
  const hadPaidOrder = listingHadPaidOrder(listing.orders);
  const latestOrder = listing.orders[0];
  const viewHref = sellerListingViewHref(listing);
  const continueHref =
    listing.status === "DRAFT" ? getSellerDraftResumePath(listing) : undefined;
  const reasonHref =
    listing.status === "REJECTED" ? `/vender/${listing.id}` : undefined;
  const orderHref =
    (listing.status === "RESERVED" || listing.status === "SOLD") && latestOrder
      ? `/ventas/${latestOrder.id}`
      : undefined;
  const specs = [
    listing.unlocked ? "Liberado" : (listing.carrier ?? "Con operador"),
    listing.iphoneColor.name,
    formatStorageLabel(listing.iphoneStorage.valueGb),
    conditionLabels[listing.condition],
  ].join(" · ");

  return (
    <article className="border-border flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
      <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            Sin foto
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-foreground text-sm font-semibold">
          {listing.title}
        </h2>
        <p className="text-muted-foreground text-xs">{specs}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(listing.status)}>
            {listingStatusLabel(listing.status)}
          </Badge>
          <p className="text-muted-foreground text-xs">
            Creado {formatSellerListingDate(listing.createdAt)}
            <span aria-hidden> · </span>
            Actualizado {formatSellerListingDate(listing.updatedAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
        <PriceDisplay price={listing.price} className="[&>p]:text-base" />
        <SellerListingActions
          listingId={listing.id}
          viewHref={viewHref}
          continueHref={continueHref}
          reasonHref={reasonHref}
          orderHref={orderHref}
          canArchive={canArchiveListing(listing.status)}
          canRelist={canRelistListing({
            status: listing.status,
            hadPaidOrder,
          })}
        />
      </div>
    </article>
  );
}
