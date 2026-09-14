/**
 * @file authenticated-sidebar-shell.tsx
 * @description Shared AppShell + AccountNav chrome for Mi TruePhone and ops routes.
 * @dependencies AppShell, AccountNav, auth/session, identity, messages, notifications, listings
 */

import { Suspense } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { AccountNav } from "@/features/profile/components/account-nav";
import { AccountNavDrawer } from "@/features/profile/components/account-nav-drawer";
import { verificationNavHref } from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
} from "@/lib/auth/session";
import { countSellerListingBuckets } from "@/lib/listings";
import { countUnreadForUser } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";

type AuthenticatedSidebarShellProps = {
  children: React.ReactNode;
};

/**
 * AuthenticatedSidebarShell
 *
 * Requires a signed-in profile and renders AccountNav beside page content.
 * Used by the account route group and `/revision` so ops pages keep the
 * same lateral bar.
 *
 * @param props.children - Page content rendered next to the sidebar.
 * @returns AppShell with sticky AccountNav and a main column.
 * @calledBy (account)/layout, revision/layout
 */
export async function AuthenticatedSidebarShell({
  children,
}: AuthenticatedSidebarShellProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/perfil";
  const search = headerStore.get("x-search") ?? "";
  const current = await requireCurrentProfile(`${pathname}${search}`);
  const { profile } = current;
  const [verification, unreadMessages, unreadNotifications, listingCounts] =
    await Promise.all([
      getLatestIdentityVerification(profile.id),
      countUnreadForUser(profile.id),
      countUnreadNotifications(profile.id),
      countSellerListingBuckets(profile.id),
    ]);
  const verificationHref = verificationNavHref({
    verifikStatus: profile.verifikStatus,
    verification,
  });

  return (
    <AppShell mainClassName="gap-6 md:gap-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start lg:grid-cols-[240px_1fr]">
        <AccountNavDrawer>
          <Suspense
            fallback={
              <div className="border-border md:sticky md:top-20 md:rounded-xl md:border md:p-4">
                <p className="text-foreground text-lg font-semibold tracking-tight">
                  Mi TruePhone
                </p>
              </div>
            }
          >
            <AccountNav
              verificationHref={verificationHref}
              canReview={canAccessReviewPortal(profile.role)}
              isAdmin={profile.role === "ADMIN"}
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
              activeListingCount={listingCounts.active}
              archivedListingCount={listingCounts.archived}
              className="border-border md:sticky md:top-20 md:rounded-xl md:border md:p-4"
            />
          </Suspense>
        </AccountNavDrawer>
        <div className="min-w-0 space-y-6 md:space-y-8">{children}</div>
      </div>
    </AppShell>
  );
}
