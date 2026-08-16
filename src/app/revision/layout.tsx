/**
 * @file layout.tsx
 * @description Ops/review layout that keeps AccountNav on every /revision page.
 * @dependencies AuthenticatedSidebarShell
 */

import { AuthenticatedSidebarShell } from "@/features/profile/components/authenticated-sidebar-shell";

export const dynamic = "force-dynamic";

/**
 * RevisionLayout
 *
 * Reuses Mi TruePhone sidebar chrome so reviewer/admin queues never lose
 * the lateral bar (cola de anuncios, identidad, pagos, etc.).
 *
 * @param props.children - Review portal pages.
 * @returns Authenticated sidebar shell.
 */
export default function RevisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedSidebarShell>{children}</AuthenticatedSidebarShell>;
}
