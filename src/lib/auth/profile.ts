import { prisma } from "@/lib/db";

type EnsureProfileInput = {
  authUserId: string;
  fullName?: string | null;
};

export async function ensureProfile({
  authUserId,
  fullName,
}: EnsureProfileInput) {
  const existing = await prisma.profile.findUnique({
    where: { authUserId },
  });

  if (existing) {
    if (fullName && !existing.fullName) {
      return prisma.profile.update({
        where: { authUserId },
        data: { fullName },
      });
    }
    return existing;
  }

  return prisma.profile.create({
    data: {
      authUserId,
      fullName: fullName ?? null,
      role: "BUYER",
    },
  });
}

export async function getProfileByAuthUserId(authUserId: string) {
  return prisma.profile.findUnique({
    where: { authUserId },
  });
}
