/**
 * @file profile-header.tsx
 * @description Public/account profile header with avatar, badges, stats, and activity strip.
 * @dependencies TrustBadge, Avatar, Badge, PublicActivityStrip, profile types
 */

import { TrustBadge } from "@/components/trust-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PublicActivityStrip } from "@/features/profile/components/public-activity-strip";
import {
  formatMemberSince,
  formatSellerRating,
  isIdentityVerified,
} from "@/features/profile/types";
import type { PublicActivityCounts } from "@/lib/profile-activity";
import { cn } from "@/lib/utils";

type ProfileHeaderProps = {
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  department: string | null;
  sellerRating: number;
  totalSales: number;
  totalReviews: number;
  isTrustedSeller: boolean;
  verifikStatus: string;
  createdAt: Date;
  activity: PublicActivityCounts;
  className?: string;
};

/**
 * initials
 *
 * Derives up to two uppercase initials from a display name.
 *
 * @param name - Full name or null.
 * @returns Initials string, or `"?"` when name is empty.
 * @calledBy ProfileHeader
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
 * ProfileHeader
 *
 * Renders identity, trust badges, bio, and seller metrics for a profile.
 *
 * @param props - Profile display fields, seller aggregates, and public activity.
 * @returns Profile header section.
 * @calledBy profile and public `/u/[username]` pages
 */
export function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  bio,
  city,
  department,
  sellerRating,
  totalSales,
  totalReviews,
  isTrustedSeller,
  verifikStatus,
  createdAt,
  activity,
  className,
}: ProfileHeaderProps) {
  const location = [city, department].filter(Boolean).join(", ");
  const displayName = fullName ?? username ?? "Usuario TruePhone";

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-start gap-4">
        <Avatar className="size-16 md:size-20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-lg">
            {initials(fullName ?? username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
              {displayName}
            </h1>
            {username ? (
              <p className="text-muted-foreground text-sm">@{username}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {isIdentityVerified(verifikStatus) ? (
              <TrustBadge label="Verificado" />
            ) : null}
            {isTrustedSeller ? (
              <Badge variant="success">Vendedor de confianza</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <PublicActivityStrip counts={activity} />

      {bio ? (
        <p className="text-foreground text-sm leading-relaxed">{bio}</p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-border rounded-xl border p-3">
          <dt className="text-muted-foreground text-xs">Calificación</dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {formatSellerRating(sellerRating)}
          </dd>
        </div>
        <div className="border-border rounded-xl border p-3">
          <dt className="text-muted-foreground text-xs">Ventas</dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {totalSales}
          </dd>
        </div>
        <div className="border-border rounded-xl border p-3">
          <dt className="text-muted-foreground text-xs">Reseñas</dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {totalReviews}
          </dd>
        </div>
        <div className="border-border rounded-xl border p-3">
          <dt className="text-muted-foreground text-xs">Miembro desde</dt>
          <dd className="text-foreground mt-1 text-sm font-medium capitalize">
            {formatMemberSince(createdAt)}
          </dd>
        </div>
      </dl>

      {location ? (
        <p className="text-muted-foreground text-sm">{location}</p>
      ) : null}
    </div>
  );
}
