/**
 * @file app-shell.tsx
 * @description Async layout shell loading auth/profile and composing header, main, bottom nav.
 * @dependencies AppHeader, BottomNav, auth session/profile helpers, @/lib/listings
 */

import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { getProfileByAuthUserId } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { listIphoneModels } from "@/lib/listings";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  className?: string;
};

/**
 * AppShell
 *
 * Loads the current user, profile, and catalog models, then wraps page content.
 *
 * @param props.children - Page content rendered in main.
 * @param props.mainClassName - Extra classes for the main container.
 * @param props.className - Extra classes for the outer shell.
 * @returns Full-height layout with AppHeader and BottomNav.
 * @calledBy Root marketing pages and AccountLayout
 */
export async function AppShell({
  children,
  mainClassName,
  className,
}: AppShellProps) {
  const [user, catalogModels] = await Promise.all([
    getAuthUser(),
    listIphoneModels(),
  ]);
  const profile = user ? await getProfileByAuthUserId(user.id) : null;

  return (
    <div
      className={cn(
        "bg-background flex min-h-full flex-1 flex-col pb-20 md:pb-0",
        className,
      )}
    >
      <AppHeader
        isAuthenticated={Boolean(user)}
        catalogModels={catalogModels}
        user={
          profile
            ? {
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
              }
            : null
        }
      />
      <main
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-10",
          mainClassName,
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
