/**
 * @file party-card.tsx
 * @description Seller/buyer card for order detail: identity, rating, public activity.
 * @dependencies next/link, TrustBadge, Avatar, profile types, PublicActivityStrip
 */

import Link from "next/link";

import { TrustBadge } from "@/components/trust-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicActivityStrip } from "@/features/profile/components/public-activity-strip";
import {
  formatMemberSince,
  formatSellerRating,
  isIdentityVerified,
  publicProfilePath,
} from "@/features/profile/types";
import type { PublicActivityCounts } from "@/lib/profile-activity";
import { cn } from "@/lib/utils";

type PartyCardProps = {
  roleLabel: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  sellerRating: number;
  verifikStatus: string;
  activity: PublicActivityCounts;
  className?: string;
};

/**
 * initials
 *
 * Derives up to two uppercase initials from a display name.
 *
 * @param name - Full name, username, or null.
 * @returns Initials string, or `"?"` when empty.
 * @calledBy PartyCard
 */
function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * PartyCard
 *
 * Side-by-side order participant card so both parties can judge reputation.
 *
 * @param props.roleLabel - "Vendedor" or "Comprador".
 * @param props.fullName - Display name.
 * @param props.username - Public username for `/u/...` link.
 * @param props.avatarUrl - Avatar URL.
 * @param props.createdAt - Profile join date.
 * @param props.sellerRating - Average rating.
 * @param props.verifikStatus - Identity verification status.
 * @param props.activity - Public listing/purchase counters (incl. paid cancels).
 * @returns Bordered party card.
 * @calledBy OrderDetailView
 */
export function PartyCard({
  roleLabel,
  fullName,
  username,
  avatarUrl,
  createdAt,
  sellerRating,
  verifikStatus,
  activity,
  className,
}: PartyCardProps) {
  const displayName = fullName?.trim() || username || "Usuario TruePhone";
  const profileHref = publicProfilePath(username);
  const name = (
    <span className="text-foreground truncate text-sm font-semibold">
      {displayName}
    </span>
  );

  return (
    <article
      className={cn(
        "border-border flex flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {roleLabel}
      </p>
      <div className="flex items-start gap-3">
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials(fullName ?? username)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {profileHref ? (
              <Link
                href={profileHref}
                className="underline-offset-2 hover:underline"
              >
                {name}
              </Link>
            ) : (
              name
            )}
            {isIdentityVerified(verifikStatus) ? <TrustBadge /> : null}
          </div>
          {username ? (
            <p className="text-muted-foreground text-xs">@{username}</p>
          ) : null}
          <p className="text-muted-foreground text-xs capitalize">
            Miembro desde {formatMemberSince(createdAt)}
          </p>
          <p className="text-foreground text-xs">
            {formatSellerRating(sellerRating)}
          </p>
        </div>
      </div>
      <PublicActivityStrip counts={activity} className="text-xs" />
    </article>
  );
}
