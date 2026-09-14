/**
 * @file listing-purchase-actions.tsx
 * @description Buy / contact / save / share CTAs for public listing detail.
 * @dependencies next/link, Button, FavoriteButton, ShareListingButton, CreateOrderButton
 * @changelog 2026-09-11 — Compact sticky bar drops Contactar; desktop column keeps it.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/features/listings/components/favorite-button";
import { ShareListingButton } from "@/features/listings/components/share-listing-button";
import { CreateOrderButton } from "@/features/orders/components/create-order-button";
import { formatOrderMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";

type ListingPurchaseActionsProps = {
  listingId: string;
  listingTitle: string;
  publicPath: string;
  loginHref: string;
  messageHref: string;
  messageLoginHref: string;
  isOwnListing: boolean;
  isAuthenticated: boolean;
  pendingOrderId: string | null;
  favorited: boolean;
  totalPrice: number;
  compact?: boolean;
  className?: string;
};

/**
 * ListingPurchaseActions
 *
 * Primary listing CTAs. Compact mode is the mobile sticky buy bar (no Contactar).
 *
 * @param props.compact - When true, total + Comprar + escrow line (sticky bar).
 * @param props.totalPrice - Buyer-facing total shown in the sticky bar.
 * @returns Purchase action stack.
 * @calledBy PublicListingPage
 */
export function ListingPurchaseActions({
  listingId,
  listingTitle,
  publicPath,
  loginHref,
  messageHref,
  messageLoginHref,
  isOwnListing,
  isAuthenticated,
  pendingOrderId,
  favorited,
  totalPrice,
  compact = false,
  className,
}: ListingPurchaseActionsProps) {
  const contactHref = isAuthenticated ? messageHref : messageLoginHref;
  const contactLabel = isAuthenticated
    ? "Contactar vendedor"
    : "Iniciar sesión para contactar";

  return (
    <div className={cn("space-y-2", className)}>
      {isOwnListing ? (
        <Button fullWidth asChild variant="outline">
          <Link href={`/vender/${listingId}`}>Ver en mis anuncios</Link>
        </Button>
      ) : isAuthenticated ? (
        <>
          {compact ? (
            <div className="flex items-end justify-between gap-3">
              <p className="text-foreground text-lg font-semibold tracking-tight">
                {formatOrderMoney(totalPrice)}
              </p>
              <div className="min-w-0 flex-1">
                {pendingOrderId ? (
                  <Button fullWidth asChild>
                    <Link href={`/compras/${pendingOrderId}`}>
                      Ver mi pedido
                    </Link>
                  </Button>
                ) : (
                  <CreateOrderButton
                    listingId={listingId}
                    loginHref={loginHref}
                    fullWidth
                    disclosure="none"
                  />
                )}
              </div>
            </div>
          ) : pendingOrderId ? (
            <Button fullWidth asChild>
              <Link href={`/compras/${pendingOrderId}`}>Ver mi pedido</Link>
            </Button>
          ) : (
            <CreateOrderButton
              listingId={listingId}
              loginHref={loginHref}
              fullWidth
              disclosure="fee"
            />
          )}
          {compact ? (
            <p className="text-muted-foreground text-[11px]">
              Sin envío en este cobro · retención 24h
            </p>
          ) : (
            <Button fullWidth asChild variant="ghost">
              <Link href={contactHref}>{contactLabel}</Link>
            </Button>
          )}
        </>
      ) : (
        <>
          {compact ? (
            <div className="flex items-end justify-between gap-3">
              <p className="text-foreground text-lg font-semibold tracking-tight">
                {formatOrderMoney(totalPrice)}
              </p>
              <Button fullWidth asChild className="min-w-0 flex-1">
                <Link href={loginHref}>Iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <Button fullWidth asChild>
              <Link href={loginHref}>Iniciar sesión para comprar</Link>
            </Button>
          )}
          {compact ? (
            <p className="text-muted-foreground text-[11px]">
              Sin envío en este cobro · retención 24h
            </p>
          ) : (
            <Button fullWidth asChild variant="ghost">
              <Link href={messageLoginHref}>Iniciar sesión para contactar</Link>
            </Button>
          )}
        </>
      )}
      {compact ? null : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <FavoriteButton
              listingId={listingId}
              initialFavorited={favorited}
              loginHref={loginHref}
              fullWidth
            />
            <ShareListingButton
              path={publicPath}
              title={listingTitle}
              fullWidth
            />
          </div>
          {!isOwnListing && !isAuthenticated ? (
            <p className="text-muted-foreground text-center text-xs">
              Sin envío en este cobro. Retención 24h tras «Ya recibí».
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
