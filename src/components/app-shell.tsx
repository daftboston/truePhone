import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { getProfileByAuthUserId } from "@/lib/auth/profile";
import { canAccessReviewPortal, getAuthUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  className?: string;
};

export async function AppShell({
  children,
  mainClassName,
  className,
}: AppShellProps) {
  const user = await getAuthUser();
  const profile = user ? await getProfileByAuthUserId(user.id) : null;
  const canReview = profile ? canAccessReviewPortal(profile.role) : false;

  return (
    <div
      className={cn(
        "bg-background flex min-h-full flex-1 flex-col pb-20 md:pb-0",
        className,
      )}
    >
      <AppHeader
        isAuthenticated={Boolean(user)}
        canReview={canReview}
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
      <BottomNav showReview={canReview} />
    </div>
  );
}
