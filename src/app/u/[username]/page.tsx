import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ShareProfileButton } from "@/features/profile/components/share-profile-button";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

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

  const user = await getAuthUser();
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
    </AppShell>
  );
}
