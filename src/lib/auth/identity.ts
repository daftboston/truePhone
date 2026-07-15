import { prisma } from "@/lib/db";

export async function getLatestIdentityVerification(profileId: string) {
  return prisma.identityVerification.findFirst({
    where: { profileId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrCreateDraftVerification(profileId: string) {
  const latest = await getLatestIdentityVerification(profileId);

  if (latest && (latest.status === "DRAFT" || latest.status === "REJECTED")) {
    if (latest.status === "REJECTED") {
      return prisma.identityVerification.create({
        data: {
          profileId,
          status: "DRAFT",
          provider: "manual",
        },
      });
    }
    return latest;
  }

  if (
    latest &&
    (latest.status === "PENDING" ||
      latest.status === "IN_REVIEW" ||
      latest.status === "VERIFIED")
  ) {
    return latest;
  }

  return prisma.identityVerification.create({
    data: {
      profileId,
      status: "DRAFT",
      provider: "manual",
    },
  });
}

export async function listPendingIdentityVerifications() {
  return prisma.identityVerification.findMany({
    where: {
      status: { in: ["PENDING", "IN_REVIEW"] },
    },
    include: {
      profile: {
        select: {
          id: true,
          fullName: true,
          username: true,
          city: true,
          verifikStatus: true,
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
}
