/**
 * @file seller-card.tsx
 * @description Compact seller summary with avatar, name, and optional trust badge.
 * @dependencies trust-badge, ui/avatar, @/lib/utils
 */

import { TrustBadge } from "@/components/trust-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SellerCardProps = {
  name: string;
  avatarUrl?: string;
  verified?: boolean;
  subtitle?: string;
  className?: string;
};

/**
 * initials
 *
 * Builds up to two-letter initials from a display name.
 *
 * @param name - Seller full name.
 * @returns Uppercase initials for AvatarFallback.
 * @calledBy SellerCard
 */
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * SellerCard
 *
 * Displays seller identity for listing and order contexts.
 *
 * @param props.name - Seller display name.
 * @param props.avatarUrl - Optional avatar image URL.
 * @param props.verified - When true, shows TrustBadge.
 * @param props.subtitle - Optional secondary line (e.g. city).
 * @param props.className - Wrapper className.
 * @returns Bordered seller row.
 * @calledBy Listing detail, featured rotator, order views
 */
export function SellerCard({
  name,
  avatarUrl,
  verified = false,
  subtitle,
  className,
}: SellerCardProps) {
  return (
    <div
      className={cn(
        "border-border flex items-center gap-3 rounded-xl border p-3",
        className,
      )}
    >
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground truncate text-sm font-semibold">
            {name}
          </p>
          {verified && <TrustBadge label="Verificado" />}
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
