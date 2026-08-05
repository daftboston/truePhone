/**
 * @file page.tsx
 * @description Public seller profile page by username.
 * @dependencies Profile and listings public helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ShareProfileButton } from "@/features/profile/components/share-profile-button";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listVisibleReviewsForUser, reviewAuthorName } from "@/lib/reviews";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await prisma.profile.findUnique({
    where: { username: username.toLowerCase() },
    select: { fullName: true, username: true, bio: true },
  });

  if (!profile) {
    return { title: "Perfil no encontrado" };
  }

  const title = profile.fullName ?? `@${profile.username}`;
  return {
    title,
    description:
      profile.bio ??
      `Perfil de ${title} en TruePhone, el marketplace confiable de iPhones en Colombia.`,
  };
}

/**
 * PublicProfilePage
 *
 * Shows a seller's public profile and their published listings.
 *
 * @returns Public profile page or notFound.
 */
export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await prisma.profile.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!profile || !profile.username) {
    notFound();
  }

  const [user, reviews] = await Promise.all([
    getAuthUser(),
    listVisibleReviewsForUser(profile.id, 12),
  ]);
  const isOwner = user?.id === profile.authUserId;
  const sharePath = `/u/${profile.username}`;

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <ProfileHeader
        fullName={profile.fullName}
        username={profile.username}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        city={profile.city}
        department={profile.department}
        sellerRating={profile.sellerRating}
        totalSales={profile.totalSales}
        totalReviews={profile.totalReviews}
        isTrustedSeller={profile.isTrustedSeller}
        verifikStatus={profile.verifikStatus}
        createdAt={profile.createdAt}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <ShareProfileButton
          path={sharePath}
          title={profile.fullName ?? `@${profile.username}`}
        />
        {isOwner ? (
          <Button variant="outline" asChild>
            <Link href="/perfil/editar">Editar perfil</Link>
          </Button>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-foreground text-sm font-semibold">
            Reseñas recientes
          </h2>
          <p className="text-muted-foreground text-sm">
            Calificaciones de compras completadas en TruePhone.
          </p>
        </div>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aún no hay reseñas públicas.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  reviewerName={reviewAuthorName(review.reviewer)}
                  reviewerAvatarUrl={review.reviewer.avatarUrl}
                  rating={review.rating}
                  comment={review.comment}
                  transactionDate={review.order.completedAt ?? review.createdAt}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
