/**
 * @file layout.tsx
 * @description Authenticated account shell with the shared Mi TruePhone sidebar.
 * @dependencies AuthenticatedSidebarShell
 */

import { AuthenticatedSidebarShell } from "@/features/profile/components/authenticated-sidebar-shell";

/**
 * AccountLayout
 *
 * Wraps Mi TruePhone routes in the shared sidebar chrome.
 *
 * @param props.children - Account route pages.
 * @returns Authenticated sidebar shell.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedSidebarShell>{children}</AuthenticatedSidebarShell>;
}
