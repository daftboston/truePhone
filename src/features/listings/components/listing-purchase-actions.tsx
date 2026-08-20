/**
 * @file listing-purchase-actions.tsx
 * @description Buy / contact / save / share CTAs for public listing detail.
 * @dependencies next/link, Button, FavoriteButton, ShareListingButton, CreateOrderButton
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/features/listings/components/favorite-button";
import { ShareListingButton } from "@/features/listings/components/share-listing-button";
import { CreateOrderButton } from "@/features/orders/components/create-order-button";
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
  compact?: boolean;
  className?: string;
};

/**
 * ListingPurchaseActions
 *
 * Primary listing CTAs. Compact mode is the mobile sticky buy bar.
 *
 * @param props.compact - When true, only primary + contact (sticky bar).
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
  compact = false,
  className,
}: ListingPurchaseActionsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {isOwnListing ? (
        <Button fullWidth asChild variant="outline">
          <Link href={`/vender/${listingId}`}>Ver en mis anuncios</Link>
        </Button>
      ) : isAuthenticated ? (
        <>
          {pendingOrderId ? (
            <Button fullWidth asChild>
              <Link href={`/compras/${pendingOrderId}`}>Ver mi pedido</Link>
            </Button>
          ) : (
            <CreateOrderButton
              listingId={listingId}
              loginHref={loginHref}
              fullWidth
              showSettlementDisclosure={!compact}
            />
          )}
          <Button fullWidth asChild variant="outline">
            <Link href={messageHref}>Contactar vendedor</Link>
          </Button>
        </>
      ) : (
        <>
          <Button fullWidth asChild>
            <Link href={loginHref}>
              {compact ? "Iniciar sesión" : "Iniciar sesión para comprar"}
            </Link>
          </Button>
          {compact ? null : (
            <Button fullWidth asChild variant="outline">
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
              Al comprar, el anuncio se reserva y pagas Compra Garantizada
              (precio del equipo + protección 10%). Tras marcar «Ya recibí»
              tienes 24 horas para confirmar o reportar; si no reportas,
              TruePhone paga al vendedor.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
