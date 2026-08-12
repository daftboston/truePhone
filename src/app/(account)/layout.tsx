/**
 * @file layout.tsx
 * @description Authenticated account shell with side nav, verification, and unread counts.
 * @dependencies AppShell, AccountNav, auth/session, identity, messages, notifications
 */

import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { AccountNav } from "@/features/profile/components/account-nav";
import {
  isSellerIdentityVerified,
  nextVerificationPath,
} from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
} from "@/lib/auth/session";
import { countUnreadForUser } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";

/**
 * AccountLayout
 *
 * Requires a signed-in profile and renders account navigation beside children.
 *
 * @param props.children - Account route pages.
 * @returns AppShell with AccountNav and main content column.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/perfil";
  const search = headerStore.get("x-search") ?? "";
  const current = await requireCurrentProfile(`${pathname}${search}`);
  const { profile } = current;
  const [verification, unreadMessages, unreadNotifications] = await Promise.all(
    [
      getLatestIdentityVerification(profile.id),
      countUnreadForUser(profile.id),
      countUnreadNotifications(profile.id),
    ],
  );
  const verified = isSellerIdentityVerified(profile.verifikStatus);

  const verificationHref = verified
    ? "/vender"
    : profile.verifikStatus === "pending"
      ? "/verificacion/enviada"
      : verification
        ? nextVerificationPath(verification)
        : "/verificacion";

  return (
    <AppShell mainClassName="max-w-5xl gap-6 md:gap-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start lg:grid-cols-[240px_1fr]">
        <AccountNav
          verificationHref={verificationHref}
          canReview={canAccessReviewPortal(profile.role)}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          className="border-border md:sticky md:top-20 md:rounded-xl md:border md:p-4"
        />
        <div className="min-w-0 space-y-6 md:space-y-8">{children}</div>
      </div>
    </AppShell>
  );
}
